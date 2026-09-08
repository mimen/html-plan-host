import { describe, expect, test } from "bun:test";

const cwd = new URL("../", import.meta.url).pathname;
const env = {
  DATABASE_URL: "postgres://localhost:1/test_only",
  SESSION_SECRET: "test-session-secret",
  PUBLISH_TOKEN: "test-draft-token",
};

function probe(overrides: Record<string, string | undefined> = {}): Bun.ReadableSyncSubprocess {
  return Bun.spawnSync([process.execPath, "--no-env-file", "--eval", `
    import server, { app } from "./src/app.ts";
    import { config } from "./src/config.ts";
    import { sql } from "./src/db.ts";
    const health = await app.request("/healthz");
    const version = await app.request("/version");
    console.log(JSON.stringify({
      hostname: server.hostname, ssl: sql.options.ssl,
      production: config.isProduction,
      healthStatus: health.status, health: await health.text(),
      versionStatus: version.status, version: await version.json(),
      versionCache: version.headers.get("Cache-Control")
    }));
    await sql.end();
  `], { cwd, env: { ...env, ...overrides }, stdout: "pipe", stderr: "pipe" });
}

function result(overrides: Record<string, string | undefined> = {}): object {
  const child = probe(overrides);
  expect(child.exitCode, child.stderr.toString()).toBe(0);
  return JSON.parse(child.stdout.toString());
}

describe("deployment config with the real Postgres client", () => {
  test("default bind and development database stay unchanged", () => {
    expect(result()).toMatchObject({ hostname: "0.0.0.0", ssl: false, production: false });
  });

  test("Mini production binds loopback and explicitly disables SSL", () => {
    expect(result({ NODE_ENV: "production", HOST: "127.0.0.1", DATABASE_SSL: "disable" }))
      .toMatchObject({ hostname: "127.0.0.1", ssl: false, production: true });
  });

  test.each([{ NODE_ENV: "production" }, { DYNO: "web.1" }])("Heroku default keeps required SSL for %j", (overrides) => {
    expect(result(overrides)).toMatchObject({ hostname: "0.0.0.0", ssl: { rejectUnauthorized: false }, production: true });
  });

  test("require enables SSL in development", () => {
    expect(result({ DATABASE_SSL: "require" })).toMatchObject({ ssl: { rejectUnauthorized: false } });
  });

  test("the default honors sslmode=require", () => {
    expect(result({ DATABASE_URL: `${env.DATABASE_URL}?sslmode=require` }))
      .toMatchObject({ ssl: { rejectUnauthorized: false } });
  });

  test("explicit SSL modes override contradictory URL modes", () => {
    expect(result({ DATABASE_SSL: "disable", DATABASE_URL: `${env.DATABASE_URL}?sslmode=require` }))
      .toMatchObject({ ssl: false });
    expect(result({ DATABASE_SSL: "require", DATABASE_URL: `${env.DATABASE_URL}?sslmode=disable` }))
      .toMatchObject({ ssl: { rejectUnauthorized: false } });
  });

  test("invalid SSL modes fail at startup", () => {
    const child = probe({ DATABASE_SSL: "false" });
    expect(child.exitCode).not.toBe(0);
    expect(child.stderr.toString()).toContain('DATABASE_SSL must be "disable" or "require"');
  });
});

test("Bun binds the exported server options to loopback", () => {
  const child = Bun.spawnSync([process.execPath, "--no-env-file", "--eval", `
    import options from "./src/app.ts";
    const server = Bun.serve(options);
    try {
      const response = await fetch(server.url + "healthz");
      console.log(JSON.stringify({ hostname: server.hostname, status: response.status, body: await response.text() }));
    } finally {
      await server.stop(true);
    }
  `], { cwd, env: { ...env, HOST: "127.0.0.1", PORT: "0" }, stdout: "pipe", stderr: "pipe" });
  expect(child.exitCode, child.stderr.toString()).toBe(0);
  expect(JSON.parse(child.stdout.toString())).toEqual({ hostname: "127.0.0.1", status: 200, body: "ok" });
});

test("publish Origin uses the Heroku forwarded protocol when BASE_URL is unset", () => {
  const child = Bun.spawnSync([process.execPath, "--no-env-file", "--eval", `
    import { Hono } from "hono";
    import { requireBrowserPublish } from "./src/auth.ts";
    const app = new Hono().post("/publish", requireBrowserPublish, c => c.text("accepted"));
    const statuses = [];
    for (const origin of ["https://plans.example.test", "http://plans.example.test", "null"]) {
      const response = await app.request("http://plans.example.test/publish", {
        method: "POST", headers: { Origin: origin, Host: "plans.example.test", "X-Forwarded-Proto": "https" }
      });
      statuses.push(response.status);
    }
    console.log(JSON.stringify(statuses));
  `], { cwd, env, stdout: "pipe", stderr: "pipe" });
  expect(child.exitCode, child.stderr.toString()).toBe(0);
  expect(JSON.parse(child.stdout.toString())).toEqual([200, 403, 403]);
});

describe("release probes", () => {
  test("health stays text ok and version defaults safely", () => {
    expect(result()).toMatchObject({
      healthStatus: 200, health: "ok", versionStatus: 200,
      version: { service: "html-plan-host", revision: "unknown" }, versionCache: "no-store",
    });
  });

  test("release identity remains readable with OAuth configured", () => {
    expect(result({
      APP_REVISION: "test-revision-123", HEROKU_OAUTH_ID: "test-id",
      HEROKU_OAUTH_SECRET: "test-secret", ALLOWED_EMAILS: "test@example.com",
    })).toMatchObject({
      healthStatus: 200, health: "ok", versionStatus: 200,
      version: { service: "html-plan-host", revision: "test-revision-123" },
    });
  });
});
