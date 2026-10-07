import { expect, test } from "bun:test";

const cwd = new URL("../", import.meta.url).pathname;
const env = {
  DATABASE_URL: "postgres://localhost:1/test_only",
  SESSION_SECRET: "test-session-secret",
  PUBLISH_TOKEN: "test-draft-token",
  HEROKU_OAUTH_ID: "test-id",
  HEROKU_OAUTH_SECRET: "test-secret",
  ALLOWED_EMAILS: "test@example.com",
};

test("OAuth returnTo stays on this site", () => {
  const child = Bun.spawnSync(
    [
      process.execPath,
      "--no-env-file",
      "--eval",
      `
    globalThis.fetch = async (url) => {
      const target = String(url);
      if (target.includes("/oauth/token")) return Response.json({ access_token: "tok" });
      if (target.includes("/account")) return Response.json({ email: "test@example.com" });
      return new Response("no", { status: 500 });
    };
    const { app } = await import("./src/app.ts");
    async function locationFor(returnTo) {
      const login = await app.request(
        "http://plans.example.test/auth/login?returnTo=" + encodeURIComponent(returnTo),
      );
      const setCookie = login.headers.get("set-cookie") ?? "";
      const state = new URL(login.headers.get("location") ?? "http://x").searchParams.get("state");
      const callback = await app.request(
        "http://plans.example.test/auth/callback?state=" + state + "&code=abc",
        { headers: { cookie: setCookie.split(";")[0] } },
      );
      return callback.headers.get("location");
    }
    console.log(JSON.stringify({
      external: await locationFor("https://evil.example/phish"),
      protocolRelative: await locationFor("//evil.example"),
      backslash: await locationFor("/\\\\evil.example"),
      local: await locationFor("/p/mia-model?raw=1"),
    }));
  `,
    ],
    { cwd, env, stdout: "pipe", stderr: "pipe" },
  );
  expect(child.exitCode, child.stderr.toString()).toBe(0);
  expect(JSON.parse(child.stdout.toString())).toEqual({
    external: "/",
    protocolRelative: "/",
    backslash: "/",
    local: "/p/mia-model?raw=1",
  });
});
