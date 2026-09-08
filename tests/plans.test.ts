import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Plan, PlanVersion } from "../src/plans.ts";

const testEnv = {
  DATABASE_URL: "postgres://localhost:1/test_only",
  SESSION_SECRET: "test-session-secret",
  PUBLISH_TOKEN: "test-draft-token",
  HEROKU_OAUTH_ID: "",
  HEROKU_OAUTH_SECRET: "",
  BASE_URL: "https://plans.example.test",
  APP_REVISION: "test-revision",
};
const previousEnv = Object.fromEntries(Object.keys(testEnv).map((key) => [key, process.env[key]]));
Object.assign(process.env, testEnv);

const html = '<!doctype html><h1 id="plan">A plan</h1><script>document.querySelector("h1").textContent = "Interactive plan"</script>';
const plan: Plan = {
  id: "test-plan-id", slug: "test-plan", title: "Test plan", description: null,
  draft_html: html, draft_summary: null, draft_updated_at: new Date(0),
  draft_updated_by: null, draft_dirty: true, created_at: new Date(0), updated_at: new Date(0),
};
const version: PlanVersion = {
  id: "test-version-id", plan_id: plan.id, version: 1, title: plan.title,
  html, summary: null, published_by: "test@example.com", created_at: new Date(0),
};
const publishDraft = mock(async () => version);
const getPlanBySlug = mock(async () => plan);
mock.module("../src/plans.ts", () => ({
  getPlanBySlug, publishDraft,
  getLatestPublishedVersion: async () => version,
  getVersion: async () => version,
  listPlans: async () => [],
  listVersions: async () => [version],
  pushDraft: async () => { throw new Error("Unexpected draft write"); },
}));

const { app } = await import("../src/app.ts");
const { requireBrowserPublish } = await import("../src/auth.ts");
const { Hono } = await import("hono");
for (const [key, value] of Object.entries(previousEnv)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

beforeEach(() => {
  publishDraft.mockClear();
  getPlanBySlug.mockClear();
});

function publish(headers: Record<string, string>): Promise<Response> {
  return Promise.resolve(app.request("https://internal.test/p/test-plan/publish", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
  }));
}

describe("open-read publish guard on the real route", () => {
  test.each(["Bearer test-draft-token", "Basic arbitrary", ""])("rejects Authorization %j even with matching Origin", async (authorization) => {
    const response = await publish({ Authorization: authorization, Origin: testEnv.BASE_URL });
    expect(response.status).toBe(403);
    expect(getPlanBySlug).not.toHaveBeenCalled();
    expect(publishDraft).not.toHaveBeenCalled();
  });

  test.each([undefined, "null", "https://evil.test", "https://plans.example.test.evil.test", "http://plans.example.test", "https://plans.example.test:444"])("rejects Origin %j before database access", async (origin) => {
    const response = await publish(origin === undefined ? {} : { Origin: origin });
    expect(response.status).toBe(403);
    expect(getPlanBySlug).not.toHaveBeenCalled();
    expect(publishDraft).not.toHaveBeenCalled();
  });

  test("canonical BASE_URL Origin can publish behind a proxy", async () => {
    const response = await publish({ Origin: testEnv.BASE_URL });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/p/test-plan");
    expect(publishDraft).toHaveBeenCalledWith(plan.id, "you");
  });

  test("forged forwarded headers cannot override configured BASE_URL", async () => {
    const response = await publish({ Origin: "https://evil.test", Host: "evil.test", "X-Forwarded-Proto": "https" });
    expect(response.status).toBe(403);
    expect(publishDraft).not.toHaveBeenCalled();
  });

  test("middleware permits matching Origin independent of the handler", async () => {
    const guarded = new Hono().post("/publish", requireBrowserPublish, (c) => c.text("accepted"));
    expect((await guarded.request("/publish", { method: "POST", headers: { Origin: testEnv.BASE_URL } })).status).toBe(200);
  });
});

describe("raw plan isolation", () => {
  test.each(["/p/test-plan?raw=1", "/p/test-plan/draft?raw=1", "/p/test-plan/v/1?raw=1"])("sandboxes %s without stripping HTML or JavaScript", async (path) => {
    const response = await app.request(path);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("Content-Security-Policy")).toBe("sandbox allow-scripts");
    expect(await response.text()).toBe(html);
  });

  test("trusted plan wrapper keeps its publish form and navigation outside the sandbox", async () => {
    const response = await app.request("/p/test-plan/draft");
    expect(response.headers.get("Content-Security-Policy")).toBeNull();
    const body = await response.text();
    expect(body).toContain('method="post" action="/p/test-plan/publish"');
    expect(body).toContain('href="/p/test-plan/versions"');
    expect(body).toContain('src="/p/test-plan/draft?raw=1"');
    expect(body).not.toContain("Interactive plan");
  });
});
