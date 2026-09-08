import { afterEach, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  findBrowserSurface,
  findBrowserSurfaceId,
  openPlan,
  parseCmuxCaller,
  planSurfaceMarker,
  refreshPlan,
  resolvePlanLocation,
  slugifyPlanTopic,
  validateProjectRoot,
  type CommandResult,
  type CommandRunner,
} from "./lib";

const temporaryDirectories: string[] = [];

function temporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "html-plan-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function success(stdout = ""): CommandResult {
  return { status: 0, stdout, stderr: "" };
}

const caller = {
  workspaceId: "workspace-uuid",
  surfaceId: "terminal-surface-uuid",
  windowId: "window-uuid",
};

function identifyJson(): string {
  return JSON.stringify({
    caller: {
      workspace_id: caller.workspaceId,
      surface_id: caller.surfaceId,
      window_id: caller.windowId,
    },
    focused: {
      workspace_id: "wrong-focused-workspace",
      surface_id: "wrong-focused-surface",
      window_id: caller.windowId,
    },
  });
}

function treeJson(
  fileUrl: string | null,
  surfaceId = "browser-surface-uuid",
  workspaceId = caller.workspaceId,
  title?: string,
): string {
  return JSON.stringify({
    windows: [
      {
        id: caller.windowId,
        workspaces: [
          {
            id: workspaceId,
            panes: [
              {
                id: "pane-uuid",
                surfaces: fileUrl
                  ? [{ id: surfaceId, type: "browser", url: fileUrl, title }]
                  : [{ id: caller.surfaceId, type: "terminal", url: null }],
              },
            ],
          },
        ],
      },
    ],
  });
}

describe("project and plan placement", () => {
  test("accepts a marked persistent project root", () => {
    const root = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    expect(validateProjectRoot(root)).toBe(realpathSync(root));
  });

  test("rejects home and Claude state as project roots", () => {
    const home = temporaryDirectory();
    const stateProject = join(home, ".claude", "project");
    mkdirSync(join(stateProject, ".git"), { recursive: true });
    expect(() => validateProjectRoot(home, home)).toThrow("Home directory");
    expect(() => validateProjectRoot(stateProject, home)).toThrow("Claude state directories");
  });

  test("rejects markerless and Git worktree roots", () => {
    const markerless = temporaryDirectory();
    expect(() => validateProjectRoot(markerless)).toThrow("Markerless directory");

    const worktree = temporaryDirectory();
    writeFileSync(join(worktree, ".git"), "gitdir: /tmp/main/.git/worktrees/feature\n");
    expect(() => validateProjectRoot(worktree)).toThrow("Gitfile roots");
  });

  test("requires marker files and rejects Git submodule roots", () => {
    const fakeMarkers = temporaryDirectory();
    mkdirSync(join(fakeMarkers, "CLAUDE.md"));
    mkdirSync(join(fakeMarkers, "package.json"));
    expect(() => validateProjectRoot(fakeMarkers)).toThrow("Markerless directory");

    const submodule = temporaryDirectory();
    writeFileSync(join(submodule, ".git"), "gitdir: /tmp/main/.git/modules/submodule\n");
    expect(() => validateProjectRoot(submodule)).toThrow("Gitfile roots");
  });

  test("falls back to project docs/plans", () => {
    const root = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    const location = resolvePlanLocation(root, "Payment Retry Design");
    expect(location.directory).toBe(join(realpathSync(root), "docs", "plans"));
    expect(location.file).toBe(join(realpathSync(root), "docs", "plans", "payment-retry-design.html"));
    expect(location.convention).toBe("default-docs-plans");
  });

  test("prefers standard directories that already contain HTML plans", () => {
    const root = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, "docs", "plans"), { recursive: true });
    mkdirSync(join(root, "plans"));
    writeFileSync(join(root, "docs", "plans", "README.md"), "# plans\n");
    writeFileSync(join(root, "plans", "existing.html"), "<!doctype html>");
    const location = resolvePlanLocation(root, "Next Plan");
    expect(location.directory).toBe(join(realpathSync(root), "plans"));
    expect(location.convention).toBe("existing-plans");
  });

  test("rejects standard plan directories and files that escape through symlinks", () => {
    const root = temporaryDirectory();
    const outside = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    mkdirSync(join(outside, "plans"));
    mkdirSync(join(root, "docs"));
    symlinkSync(join(outside, "plans"), join(root, "docs", "plans"));
    expect(() => resolvePlanLocation(root, "Escaped Directory")).toThrow("symbolic link");

    rmSync(join(root, "docs", "plans"));
    mkdirSync(join(root, "docs", "plans"));
    writeFileSync(join(outside, "target.html"), "outside");
    symlinkSync(join(outside, "target.html"), join(root, "docs", "plans", "escaped-file.html"));
    expect(() => resolvePlanLocation(root, "Escaped File")).toThrow("symbolic link");

    symlinkSync(join(outside, "missing.html"), join(root, "docs", "plans", "dangling-file.html"));
    expect(() => resolvePlanLocation(root, "Dangling File")).toThrow("symbolic link");

    writeFileSync(join(root, "package.json"), "{}\n");
    symlinkSync(join(root, "package.json"), join(root, "docs", "plans", "package-link.html"));
    expect(() => resolvePlanLocation(root, "Package Link")).toThrow("symbolic link");
  });

  test("uses an explicitly inspected nonstandard plan directory", () => {
    const root = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    const decisions = join(root, "architecture", "decisions");
    mkdirSync(decisions, { recursive: true });
    writeFileSync(join(decisions, "migration-plan.html"), "<!doctype html>");
    const location = resolvePlanLocation(root, "Follow Up", "architecture/decisions");
    expect(location.directory).toBe(realpathSync(decisions));
    expect(location.convention).toBe("explicit-plan-directory");
  });

  test("rejects plan directories outside the project or in runtime paths", () => {
    const root = temporaryDirectory();
    const outside = temporaryDirectory();
    mkdirSync(join(root, ".git"));
    expect(() => resolvePlanLocation(root, "Outside", outside)).toThrow("inside the project");
    writeFileSync(join(root, "plans.html"), "not a directory");
    expect(() => resolvePlanLocation(root, "File", "plans.html")).toThrow("not a directory");
    symlinkSync(outside, join(root, "linked-outside"));
    expect(() => resolvePlanLocation(root, "Symlink", "linked-outside/plans")).toThrow(
      "inside the project",
    );
    expect(() => resolvePlanLocation(root, "Output", "out/plans")).toThrow("runtime, build, or deploy");
    expect(() => resolvePlanLocation(root, "Pages", "src/pages/plans")).toThrow("runtime, build, or deploy");
  });

  test("normalizes readable stable slugs", () => {
    expect(slugifyPlanTopic("  Héllo, Billing v2!  ")).toBe("hello-billing-v2");
    expect(() => slugifyPlanTopic("---")).toThrow("letter or number");
  });
});

describe("Cmux caller targeting", () => {
  test("parses caller identity rather than global focus", () => {
    expect(parseCmuxCaller(identifyJson())).toEqual(caller);
  });

  test("finds a matching browser surface by stable workspace id and file URL", () => {
    const url = "file:///tmp/plan.html";
    expect(findBrowserSurfaceId(treeJson(url), caller.workspaceId, url)).toBe(
      "browser-surface-uuid",
    );
    expect(findBrowserSurfaceId(treeJson(url), "other-workspace", url)).toBeNull();
  });

  test("normalizes equivalent file URL aliases", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const aliasUrl = pathToFileURL(file).href;
    const canonicalUrl = pathToFileURL(realpathSync(file)).href;
    expect(findBrowserSurfaceId(treeJson(aliasUrl), caller.workspaceId, canonicalUrl)).toBe(
      "browser-surface-uuid",
    );
  });

  test("finds a marked plan surface after its URL changes", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    const marker = planSurfaceMarker(realpathSync(file));
    const surface = findBrowserSurface(
      treeJson("file:///tmp/linked-source.html", "marked-surface", caller.workspaceId, `${marker} plan.html`),
      fileUrl,
      marker,
      caller.workspaceId,
    );
    expect(surface).toEqual({
      surfaceId: "marked-surface",
      workspaceId: caller.workspaceId,
      url: "file:///tmp/linked-source.html",
    });
  });

  test("reuses an existing browser surface without opening another pane", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (command === "cmux" && args[0] === "identify") {
        return success(identifyJson());
      }
      if (command === "cmux" && args[0] === "tree") {
        return success(treeJson(fileUrl));
      }
      return success("OK");
    };

    const result = openPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      "darwin",
      runner,
    );
    expect(result.kind).toBe("cmux-reloaded");
    expect(calls.some(({ args }) => args[0] === "open")).toBeFalse();
    expect(calls.some(({ args }) =>
      args.join("|") === "browser|--surface|browser-surface-uuid|reload"
    )).toBeTrue();
  });

  test("removes every stale duplicate when reusing the caller surface", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    const allTree = JSON.stringify({
      windows: [
        {
          id: caller.windowId,
          workspaces: [
            {
              id: caller.workspaceId,
              panes: [{ surfaces: [{ id: "current", type: "browser", url: fileUrl }] }],
            },
            {
              id: "old-workspace-a",
              panes: [{ surfaces: [{ id: "stale-a", type: "browser", url: fileUrl }] }],
            },
            {
              id: "old-workspace-b",
              panes: [{ surfaces: [{ id: "stale-b", type: "browser", url: fileUrl }] }],
            },
          ],
        },
      ],
    });
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree" && args.includes("--all")) {
        return success(allTree);
      }
      if (args[0] === "tree") {
        return success(treeJson(fileUrl, "current"));
      }
      if (args[0] === "close-surface" && args.includes("stale-a")) {
        return { status: 1, stdout: "", stderr: "not_found" };
      }
      return success("OK");
    };

    const result = openPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      "darwin",
      runner,
    );
    expect(result.kind).toBe("cmux-reloaded");
    const closed = calls
      .filter(({ args }) => args[0] === "close-surface")
      .map(({ args }) => args[2])
      .sort();
    expect(closed).toEqual(["stale-a", "stale-b"]);
  });

  test("duplicate discovery failure does not fail an already refreshed plan", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    const runner: CommandRunner = (_command, args) => {
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree" && args.includes("--all")) {
        return { status: 1, stdout: "", stderr: "transient tree failure" };
      }
      if (args[0] === "tree") {
        return success(treeJson(fileUrl, "current"));
      }
      return success("OK");
    };

    const result = openPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      "darwin",
      runner,
    );
    expect(result).toEqual({
      kind: "cmux-reloaded",
      file: realpathSync(file),
      surfaceId: "current",
    });
  });

  test("opens beside the invoking surface with explicit caller ids", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    let opened = false;
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (command === "cmux" && args[0] === "identify") {
        return success(identifyJson());
      }
      if (command === "cmux" && args[0] === "tree") {
        return success(treeJson(opened ? fileUrl : null));
      }
      if (command === "cmux" && args[0] === "open") {
        opened = true;
      }
      return success("OK");
    };

    const result = openPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      "darwin",
      runner,
    );
    expect(result.kind).toBe("cmux-opened");
    const openCall = calls.find(({ args }) => args[0] === "open");
    expect(openCall?.args).toEqual([
      "open",
      realpathSync(file),
      "--workspace",
      caller.workspaceId,
      "--surface",
      caller.surfaceId,
      "--window",
      caller.windowId,
      "--no-focus",
    ]);
  });

  test("refresh restores a marked plan surface after link navigation", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const canonicalFile = realpathSync(file);
    const fileUrl = pathToFileURL(canonicalFile).href;
    const marker = planSurfaceMarker(canonicalFile);
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree") {
        return success(
          treeJson(
            "file:///tmp/linked-source.html",
            "marked-surface",
            caller.workspaceId,
            `${marker} plan.html`,
          ),
        );
      }
      return success("OK");
    };

    const result = refreshPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      runner,
    );
    expect(result).toEqual({
      kind: "cmux-reloaded",
      file: canonicalFile,
      surfaceId: "marked-surface",
    });
    expect(calls.some(({ args }) =>
      args.join("|") === `browser|--surface|marked-surface|navigate|${fileUrl}`
    )).toBeTrue();
  });

  test("refresh finds the plan in a previous workspace", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const canonicalFile = realpathSync(file);
    const fileUrl = pathToFileURL(canonicalFile).href;
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree" && args.includes("--all")) {
        return success(treeJson(fileUrl, "old-surface", "old-workspace"));
      }
      if (args[0] === "tree") {
        return success(treeJson(null));
      }
      return success("OK");
    };

    const result = refreshPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      runner,
    );
    if (result.kind !== "cmux-reloaded") {
      throw new Error(`Expected cmux-reloaded, received ${result.kind}`);
    }
    expect(result.surfaceId).toBe("old-surface");
    expect(calls.some(({ args }) =>
      args.join("|") === "browser|--surface|old-surface|reload"
    )).toBeTrue();
  });

  test("explicit open replaces a previous-workspace surface", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const fileUrl = pathToFileURL(realpathSync(file)).href;
    let opened = false;
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree" && args.includes("--all")) {
        return success(treeJson(fileUrl, "old-surface", "old-workspace"));
      }
      if (args[0] === "tree") {
        return success(opened ? treeJson(fileUrl, "new-surface") : treeJson(null));
      }
      if (args[0] === "open") {
        opened = true;
      }
      return success("OK");
    };

    const result = openPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      "darwin",
      runner,
    );
    if (result.kind !== "cmux-opened") {
      throw new Error(`Expected cmux-opened, received ${result.kind}`);
    }
    expect(result.surfaceId).toBe("new-surface");
    expect(calls.some(({ args }) =>
      args[0] === "close-surface" &&
      args.includes("old-surface") &&
      args.includes("old-workspace")
    )).toBeTrue();
  });

  test("refresh keeps a closed pane closed", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      if (args[0] === "identify") {
        return success(identifyJson());
      }
      if (args[0] === "tree") {
        return success(treeJson(null));
      }
      return success("OK");
    };

    const result = refreshPlan(
      file,
      { CMUX_WORKSPACE_ID: "runtime-workspace", CMUX_SURFACE_ID: "runtime-surface" },
      runner,
    );
    expect(result.kind).toBe("cmux-closed");
    expect(calls.some(({ args }) => args[0] === "open")).toBeFalse();
    expect(calls.some(({ args }) => args[0] === "browser")).toBeFalse();
  });

  test("outside Cmux opens the platform default browser", () => {
    const root = temporaryDirectory();
    const file = join(root, "plan.html");
    writeFileSync(file, "<!doctype html>");
    const calls: Array<{ command: string; args: readonly string[] }> = [];
    const runner: CommandRunner = (command, args) => {
      calls.push({ command, args });
      return success();
    };
    const result = openPlan(file, {}, "darwin", runner);
    expect(result.kind).toBe("default-browser-opened");
    expect(calls).toEqual([{ command: "open", args: ["-g", realpathSync(file)] }]);
  });
});
