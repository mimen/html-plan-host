import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./html-plan.ts", import.meta.url));
const temporaryDirectories: string[] = [];

function temporaryProject(withGit = true): string {
  const directory = mkdtempSync(join(tmpdir(), "html-plan-cli-"));
  temporaryDirectories.push(directory);
  if (withGit) {
    mkdirSync(join(directory, ".git"));
  }
  return directory;
}

function run(args: readonly string[]): { status: number; stdout: string; stderr: string } {
  const result = Bun.spawnSync([process.execPath, SCRIPT, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    status: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("html-plan CLI", () => {
  test("resolve is pure and prepare creates the selected directory", () => {
    const project = temporaryProject();
    const resolveResult = run([
      "resolve",
      "--project-root",
      project,
      "--slug",
      "cli-smoke",
    ]);
    expect(resolveResult.status).toBe(0);
    expect(existsSync(join(project, "docs", "plans"))).toBeFalse();

    const prepareResult = run([
      "prepare",
      "--project-root",
      project,
      "--slug",
      "cli-smoke",
    ]);
    expect(prepareResult.status).toBe(0);
    expect(existsSync(join(project, "docs", "plans"))).toBeTrue();
    expect(JSON.parse(resolveResult.stdout).file).toBe(JSON.parse(prepareResult.stdout).file);
  });

  test("project root is required", () => {
    const directory = temporaryProject(false);
    const result = run(["resolve", "--slug", "cli-smoke"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Missing required option --project-root");
    expect(existsSync(join(directory, "docs", "plans"))).toBeFalse();
  });
});
