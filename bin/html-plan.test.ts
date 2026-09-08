import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const temporary: string[] = [];
afterEach(() => {
  for (const folder of temporary.splice(0)) rmSync(folder, { recursive: true, force: true });
});

function fixture(url: string): { folder: string; config: string; html: string } {
  const folder = mkdtempSync(join(tmpdir(), "html-plan-cli-"));
  temporary.push(folder);
  const config = join(folder, "config.json");
  const html = join(folder, "plan.html");
  writeFileSync(config, JSON.stringify({ url, tokenRef: "op://Test/Plan/token" }));
  writeFileSync(html, "<title>CLI fixture</title><p>Draft</p>");
  return { folder, config, html };
}

async function cli(config: string, args: string[], env: Record<string, string> = {}): Promise<{ code: number; output: string; error: string }> {
  const child = Bun.spawn([process.execPath, join(import.meta.dir, "html-plan.mjs"), ...args], {
    env: { ...process.env, PLAN_HOST_URL: "", PLAN_HOST_TOKEN: "", PLAN_HOST_CONFIG: config, ...env },
    stdout: "pipe", stderr: "pipe",
  });
  const [code, output, error] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
  return { code, output, error };
}

test("changing hosts never falls back to the personal token reference", async () => {
  const data = fixture("https://personal.example");
  const result = await cli(data.config, ["push", "--file", data.html, "--url", "https://work.example"]);
  expect(result.code).toBe(1);
  expect(result.error).toContain("refusing to reuse another host's credential");
});

test("non-loopback HTTP is rejected before credential lookup", async () => {
  const data = fixture("http://public.example");
  const result = await cli(data.config, ["push", "--file", data.html]);
  expect(result.code).toBe(1);
  expect(result.error).toContain("must use HTTPS");
});

test("CLI creates a draft and reads the baseline using a configured host", async () => {
  const requests: { path: string; authorization: string | null; method: string }[] = [];
  const server = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch(request) {
    requests.push({ path: new URL(request.url).pathname, authorization: request.headers.get("Authorization"), method: request.method });
    return Response.json(request.method === "POST"
      ? { created: true, title: "CLI fixture", draftUrl: "https://example/p/fixture/draft", shareUrl: "https://example/p/fixture" }
      : { latestPublishedVersion: null });
  } });
  try {
    const data = fixture(`http://127.0.0.1:${server.port}`);
    const pushed = await cli(data.config, ["push", "--file", data.html], { PLAN_HOST_TOKEN: "fixture-token" });
    const baseline = await cli(data.config, ["baseline", "--slug", "fixture"], { PLAN_HOST_TOKEN: "fixture-token" });
    expect(pushed.code).toBe(0);
    expect(pushed.output).toContain("Created draft");
    expect(baseline.code).toBe(0);
    expect(JSON.parse(baseline.output)).toEqual({ latestPublishedVersion: null });
    expect(requests).toEqual([
      { path: "/api/plans", authorization: "Bearer fixture-token", method: "POST" },
      { path: "/api/plans/fixture", authorization: "Bearer fixture-token", method: "GET" },
    ]);
  } finally {
    server.stop(true);
  }
});
