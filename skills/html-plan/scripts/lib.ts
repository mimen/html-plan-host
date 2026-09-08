import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export type PlanConvention =
  | "existing-docs-plans"
  | "existing-plans"
  | "explicit-plan-directory"
  | "default-docs-plans";

export interface PlanLocation {
  projectRoot: string;
  directory: string;
  file: string;
  convention: PlanConvention;
}

export interface CommandResult {
  status: number;
  stdout: string;
  stderr: string;
}

export type CommandRunner = (
  command: string,
  args: readonly string[],
) => CommandResult;

export interface CmuxCaller {
  workspaceId: string;
  surfaceId: string;
  windowId: string;
}

export interface BrowserSurface {
  surfaceId: string;
  workspaceId: string;
  url: string;
}

export type PresentationResult =
  | { kind: "cmux-opened"; file: string; surfaceId: string | null }
  | { kind: "cmux-reloaded"; file: string; surfaceId: string }
  | { kind: "cmux-closed"; file: string }
  | { kind: "default-browser-opened"; file: string }
  | { kind: "default-browser-refresh-fallback"; file: string };

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

const PROJECT_MANIFESTS = [
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "Gemfile",
];
const FORBIDDEN_PLAN_DIRECTORY_SEGMENTS = new Set([
  ".astro",
  ".cache",
  ".claude",
  ".docusaurus",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
  ".worktrees",
  "_site",
  "assets",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "output",
  "public",
  "site",
  "static",
  "target",
  "vendor",
  "www",
]);

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function canonicalDirectory(path: string): string {
  const absolute = resolve(path);
  if (!isDirectory(absolute)) {
    throw new Error(`Directory does not exist: ${absolute}`);
  }
  return realpathSync(absolute);
}

function isWithin(parent: string, candidate: string): boolean {
  const path = relative(parent, candidate);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function hasProjectMarker(directory: string): boolean {
  const gitMarker = join(directory, ".git");
  return (
    isFile(join(directory, "CLAUDE.md")) ||
    isDirectory(gitMarker) ||
    isFile(gitMarker) ||
    PROJECT_MANIFESTS.some((manifest) => isFile(join(directory, manifest)))
  );
}

function isGitfileRoot(directory: string): boolean {
  return isFile(join(directory, ".git"));
}

export function validateProjectRoot(
  projectRoot: string,
  homeDirectory: string = homedir(),
): string {
  const root = canonicalDirectory(projectRoot);
  const home = canonicalDirectory(homeDirectory);
  if (root === home) {
    throw new Error(`Home directory is not a project root: ${root}`);
  }
  const claudeStatePath = resolve(home, ".claude");
  const claudeState = isDirectory(claudeStatePath)
    ? realpathSync(claudeStatePath)
    : claudeStatePath;
  if (isWithin(claudeState, root)) {
    throw new Error(`Claude state directories cannot contain project plans: ${root}`);
  }
  if (isGitfileRoot(root)) {
    throw new Error(
      `Gitfile roots (worktrees or submodules) are not accepted: ${root}; pass a persistent parent project root with a real .git directory`,
    );
  }
  if (!hasProjectMarker(root)) {
    throw new Error(
      `Markerless directory is not a verified project root: ${root}; choose a root with CLAUDE.md, a .git directory, or a project manifest`,
    );
  }
  return root;
}

function containsDirectHtml(directory: string): boolean {
  if (!isDirectory(directory)) {
    return false;
  }
  return readdirSync(directory, { withFileTypes: true }).some(
    (entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".html",
  );
}

function canonicalDestination(path: string): string {
  let existing = resolve(path);
  const missingSegments: string[] = [];
  while (!existsSync(existing)) {
    missingSegments.unshift(basename(existing));
    const parent = dirname(existing);
    if (parent === existing) {
      break;
    }
    existing = parent;
  }
  return resolve(realpathSync(existing), ...missingSegments);
}

function validatePlanDirectory(projectRoot: string, directory: string): string {
  const absolute = isAbsolute(directory) ? resolve(directory) : resolve(projectRoot, directory);
  if (isSymbolicLink(absolute)) {
    throw new Error(`Plan directory cannot be a symbolic link: ${absolute}`);
  }
  if (existsSync(absolute) && !isDirectory(absolute)) {
    throw new Error(`Plan directory is not a directory: ${absolute}`);
  }
  const selected = canonicalDestination(absolute);
  if (!isWithin(projectRoot, selected)) {
    throw new Error(`Plan directory must stay inside the project root: ${selected}`);
  }
  const segments = relative(projectRoot, selected).split(/[\\/]/).filter(Boolean);
  const forbidden = segments.find((segment) => FORBIDDEN_PLAN_DIRECTORY_SEGMENTS.has(segment));
  if (forbidden || (segments.includes("src") && segments.includes("pages"))) {
    throw new Error(`Plan directory is a runtime, build, or deploy path: ${selected}`);
  }
  return selected;
}

function validatePlanFile(projectRoot: string, file: string): string {
  const absolute = resolve(file);
  if (isSymbolicLink(absolute)) {
    throw new Error(`Plan file cannot be a symbolic link: ${absolute}`);
  }
  if (isDirectory(absolute)) {
    throw new Error(`Plan file path is a directory: ${absolute}`);
  }
  const canonical = canonicalDestination(absolute);
  if (!isWithin(projectRoot, canonical)) {
    throw new Error(`Plan file must stay inside the project root: ${absolute}`);
  }
  return absolute;
}

function defaultPlanDirectory(projectRoot: string): {
  directory: string;
  convention: Exclude<PlanConvention, "explicit-plan-directory">;
} {
  const docsPlans = validatePlanDirectory(projectRoot, "docs/plans");
  const rootPlans = validatePlanDirectory(projectRoot, "plans");
  if (containsDirectHtml(docsPlans)) {
    return { directory: docsPlans, convention: "existing-docs-plans" };
  }
  if (containsDirectHtml(rootPlans)) {
    return { directory: rootPlans, convention: "existing-plans" };
  }
  if (isDirectory(docsPlans)) {
    return { directory: docsPlans, convention: "existing-docs-plans" };
  }
  if (isDirectory(rootPlans)) {
    return { directory: rootPlans, convention: "existing-plans" };
  }
  return { directory: docsPlans, convention: "default-docs-plans" };
}

export function slugifyPlanTopic(topic: string): string {
  const slug = topic
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  if (!slug) {
    throw new Error("Plan slug must contain at least one letter or number");
  }
  return slug;
}

export function resolvePlanLocation(
  projectRootInput: string,
  topic: string,
  explicitPlanDirectory?: string,
): PlanLocation {
  const projectRoot = validateProjectRoot(projectRootInput);
  const slug = slugifyPlanTopic(topic);
  const selected = explicitPlanDirectory
    ? {
        directory: validatePlanDirectory(projectRoot, explicitPlanDirectory),
        convention: "explicit-plan-directory" as const,
      }
    : defaultPlanDirectory(projectRoot);
  return {
    projectRoot,
    directory: selected.directory,
    file: validatePlanFile(projectRoot, join(selected.directory, `${slug}.html`)),
    convention: selected.convention,
  };
}

export function ensurePlanDirectory(location: PlanLocation): void {
  mkdirSync(location.directory, { recursive: true });
}

function parseJson(text: string): JsonValue {
  return JSON.parse(text) as JsonValue;
}

function asObject(value: JsonValue | undefined): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
}

function asArray(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function requiredString(object: JsonObject, key: string): string {
  const value = object[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Cmux response is missing ${key}`);
  }
  return value;
}

export function parseCmuxCaller(text: string): CmuxCaller {
  const root = asObject(parseJson(text));
  const caller = root ? asObject(root.caller) : null;
  if (!caller) {
    throw new Error("Cmux identify response is missing caller context");
  }
  return {
    workspaceId: requiredString(caller, "workspace_id"),
    surfaceId: requiredString(caller, "surface_id"),
    windowId: requiredString(caller, "window_id"),
  };
}

function normalizedBrowserUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "file:") {
      const path = fileURLToPath(parsed);
      return pathToFileURL(existsSync(path) ? realpathSync(path) : resolve(path)).href;
    }
    return parsed.href;
  } catch {
    return url;
  }
}

export function planSurfaceMarker(file: string): string {
  const digest = createHash("sha256").update(resolve(file)).digest("hex").slice(0, 12);
  return `[html-plan:${digest}]`;
}

export function findBrowserSurfaces(
  treeText: string,
  fileUrl: string,
  marker: string,
  workspaceId?: string,
): BrowserSurface[] {
  const root = asObject(parseJson(treeText));
  const normalizedFileUrl = normalizedBrowserUrl(fileUrl);
  const matches: BrowserSurface[] = [];
  if (!root) {
    return matches;
  }
  for (const windowValue of asArray(root.windows)) {
    const window = asObject(windowValue);
    if (!window) {
      continue;
    }
    for (const workspaceValue of asArray(window.workspaces)) {
      const workspace = asObject(workspaceValue);
      if (
        !workspace ||
        typeof workspace.id !== "string" ||
        (workspaceId && workspace.id !== workspaceId)
      ) {
        continue;
      }
      for (const paneValue of asArray(workspace.panes)) {
        const pane = asObject(paneValue);
        if (!pane) {
          continue;
        }
        for (const surfaceValue of asArray(pane.surfaces)) {
          const surface = asObject(surfaceValue);
          if (
            surface &&
            surface.type === "browser" &&
            typeof surface.url === "string" &&
            typeof surface.id === "string" &&
            (normalizedBrowserUrl(surface.url) === normalizedFileUrl ||
              (typeof surface.title === "string" && surface.title.startsWith(marker)))
          ) {
            matches.push({
              surfaceId: surface.id,
              workspaceId: workspace.id,
              url: surface.url,
            });
          }
        }
      }
    }
  }
  return matches;
}

export function findBrowserSurface(
  treeText: string,
  fileUrl: string,
  marker: string,
  workspaceId?: string,
): BrowserSurface | null {
  return findBrowserSurfaces(treeText, fileUrl, marker, workspaceId)[0] ?? null;
}

export function findBrowserSurfaceId(
  treeText: string,
  workspaceId: string,
  fileUrl: string,
): string | null {
  let marker = "[html-plan:";
  try {
    marker = planSurfaceMarker(fileURLToPath(fileUrl));
  } catch {
    // Exact URL matching still works for non-file URLs used by callers/tests.
  }
  return findBrowserSurface(treeText, fileUrl, marker, workspaceId)?.surfaceId ?? null;
}

export const defaultCommandRunner: CommandRunner = (
  command: string,
  args: readonly string[],
): CommandResult => {
  const result = spawnSync(command, [...args], {
    encoding: "utf8",
    env: process.env,
  });
  return {
    status: result.status ?? (result.error ? 127 : 0),
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? result.error?.message ?? "",
  };
};

function runChecked(
  runner: CommandRunner,
  command: string,
  args: readonly string[],
): string {
  const result = runner(command, args);
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new Error(`${command} ${args.join(" ")} failed: ${detail}`);
  }
  return result.stdout;
}

function cmuxCaller(runner: CommandRunner): CmuxCaller {
  return parseCmuxCaller(runChecked(runner, "cmux", ["identify", "--id-format", "uuids"]));
}

function matchingCmuxSurfaces(
  runner: CommandRunner,
  fileUrl: string,
  marker: string,
  workspaceId?: string,
): BrowserSurface[] {
  const scope = workspaceId ? ["--workspace", workspaceId] : ["--all"];
  const tree = runChecked(runner, "cmux", [
    "tree",
    ...scope,
    "--json",
    "--id-format",
    "uuids",
  ]);
  return findBrowserSurfaces(tree, fileUrl, marker, workspaceId);
}

function matchingCmuxSurface(
  runner: CommandRunner,
  fileUrl: string,
  marker: string,
  workspaceId?: string,
): BrowserSurface | null {
  return matchingCmuxSurfaces(runner, fileUrl, marker, workspaceId)[0] ?? null;
}

function sleep(milliseconds: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForMatchingCmuxSurface(
  runner: CommandRunner,
  fileUrl: string,
  marker: string,
  workspaceId: string,
): BrowserSurface | null {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const surface = matchingCmuxSurface(runner, fileUrl, marker, workspaceId);
    if (surface) {
      return surface;
    }
    if (attempt < 19) {
      sleep(50);
    }
  }
  return null;
}

function showPlanSurface(
  runner: CommandRunner,
  surface: BrowserSurface,
  fileUrl: string,
  marker: string,
  file: string,
): void {
  runChecked(runner, "cmux", [
    "rename-tab",
    "--surface",
    surface.surfaceId,
    `${marker} ${basename(file)}`,
  ]);
  if (normalizedBrowserUrl(surface.url) === normalizedBrowserUrl(fileUrl)) {
    runChecked(runner, "cmux", ["browser", "--surface", surface.surfaceId, "reload"]);
  } else {
    runChecked(runner, "cmux", ["browser", "--surface", surface.surfaceId, "navigate", fileUrl]);
  }
}

function closeDuplicatePlanSurfaces(
  runner: CommandRunner,
  fileUrl: string,
  marker: string,
  keepSurfaceId: string,
): void {
  let surfaces: BrowserSurface[];
  try {
    surfaces = matchingCmuxSurfaces(runner, fileUrl, marker);
  } catch {
    return;
  }
  for (const surface of surfaces) {
    if (surface.surfaceId === keepSurfaceId) {
      continue;
    }
    runner("cmux", [
      "close-surface",
      "--surface",
      surface.surfaceId,
      "--workspace",
      surface.workspaceId,
    ]);
  }
}

function inCmux(environment: Readonly<Record<string, string | undefined>>): boolean {
  return Boolean(environment.CMUX_WORKSPACE_ID && environment.CMUX_SURFACE_ID);
}

function absoluteFile(file: string): string {
  const absolute = resolve(file);
  if (!existsSync(absolute)) {
    throw new Error(`Plan file does not exist: ${absolute}`);
  }
  return realpathSync(absolute);
}

export function openPlan(
  file: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  platform: string = process.platform,
  runner: CommandRunner = defaultCommandRunner,
): PresentationResult {
  const absolute = absoluteFile(file);
  if (inCmux(environment)) {
    const caller = cmuxCaller(runner);
    const fileUrl = pathToFileURL(absolute).href;
    const marker = planSurfaceMarker(absolute);
    const currentSurface = matchingCmuxSurface(
      runner,
      fileUrl,
      marker,
      caller.workspaceId,
    );
    if (currentSurface) {
      showPlanSurface(runner, currentSurface, fileUrl, marker, absolute);
      closeDuplicatePlanSurfaces(runner, fileUrl, marker, currentSurface.surfaceId);
      return {
        kind: "cmux-reloaded",
        file: absolute,
        surfaceId: currentSurface.surfaceId,
      };
    }

    runChecked(runner, "cmux", [
      "open",
      absolute,
      "--workspace",
      caller.workspaceId,
      "--surface",
      caller.surfaceId,
      "--window",
      caller.windowId,
      "--no-focus",
    ]);
    const openedSurface = waitForMatchingCmuxSurface(
      runner,
      fileUrl,
      marker,
      caller.workspaceId,
    );
    if (openedSurface) {
      showPlanSurface(runner, openedSurface, fileUrl, marker, absolute);
      closeDuplicatePlanSurfaces(runner, fileUrl, marker, openedSurface.surfaceId);
    }
    return {
      kind: "cmux-opened",
      file: absolute,
      surfaceId: openedSurface?.surfaceId ?? null,
    };
  }

  if (platform === "darwin") {
    runChecked(runner, "open", ["-g", absolute]);
  } else if (platform === "win32") {
    runChecked(runner, "cmd", ["/c", "start", "", absolute]);
  } else {
    runChecked(runner, "xdg-open", [absolute]);
  }
  return { kind: "default-browser-opened", file: absolute };
}

export function refreshPlan(
  file: string,
  environment: Readonly<Record<string, string | undefined>> = process.env,
  runner: CommandRunner = defaultCommandRunner,
): PresentationResult {
  const absolute = absoluteFile(file);
  if (!inCmux(environment)) {
    return { kind: "default-browser-refresh-fallback", file: absolute };
  }
  const caller = cmuxCaller(runner);
  const fileUrl = pathToFileURL(absolute).href;
  const marker = planSurfaceMarker(absolute);
  const surface =
    matchingCmuxSurface(runner, fileUrl, marker, caller.workspaceId) ??
    matchingCmuxSurface(runner, fileUrl, marker);
  if (!surface) {
    return { kind: "cmux-closed", file: absolute };
  }
  showPlanSurface(runner, surface, fileUrl, marker, absolute);
  closeDuplicatePlanSurfaces(runner, fileUrl, marker, surface.surfaceId);
  return { kind: "cmux-reloaded", file: absolute, surfaceId: surface.surfaceId };
}
