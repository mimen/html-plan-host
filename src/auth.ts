import { randomBytes } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";
import { config, isAllowedEmail } from "./config.ts";
import { SESSION_COOKIE, createSessionCookie, verifySessionCookie } from "./session.ts";

const OAUTH_STATE_COOKIE = "hph_oauth_state";
const HEROKU_AUTHORIZE = "https://id.heroku.com/oauth/authorize";
const HEROKU_TOKEN = "https://id.heroku.com/oauth/token";
const HEROKU_ACCOUNT = "https://api.heroku.com/account";

// Base URL of this deployment (from BASE_URL, else derived from the request
// respecting Heroku's forwarded proto). Used for publish URLs. The OAuth
// callback is fixed at Heroku client registration, not passed in the flow.
export function baseUrl(c: Context): string {
  if (config.baseUrl) return config.baseUrl;
  const proto = c.req.header("x-forwarded-proto") ?? "http";
  const host = c.req.header("host") ?? `localhost:${config.port}`;
  return `${proto}://${host}`;
}

export function startLogin(c: Context, returnTo: string): Response {
  const state = randomBytes(16).toString("hex");
  // Pack the post-login destination into the state cookie alongside the CSRF token.
  setCookie(c, OAUTH_STATE_COOKIE, `${state}:${Buffer.from(returnTo).toString("base64url")}`, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const params = new URLSearchParams({
    client_id: config.herokuOauth.clientId,
    response_type: "code",
    scope: "identity",
    state,
  });
  return c.redirect(`${HEROKU_AUTHORIZE}?${params}`);
}

export interface CallbackResult {
  ok: boolean;
  email?: string;
  returnTo: string;
  error?: string;
}

interface TokenResponse {
  access_token?: string | { token?: string };
}

interface HerokuAccount {
  email?: string;
}

export async function handleCallback(c: Context): Promise<CallbackResult> {
  const raw = getCookie(c, OAUTH_STATE_COOKIE);
  deleteCookie(c, OAUTH_STATE_COOKIE, { path: "/" });

  const [expectedState, encodedReturn] = (raw ?? "").split(":");
  const returnTo = encodedReturn ? Buffer.from(encodedReturn, "base64url").toString() : "/";

  const state = c.req.query("state");
  const code = c.req.query("code");
  if (!expectedState || state !== expectedState) return { ok: false, returnTo, error: "Bad state" };
  if (!code) return { ok: false, returnTo, error: "Missing code" };

  // Exchange the code for an access token. Heroku identifies the client by its
  // secret; the callback URL is fixed at client registration, not sent here.
  const tokenRes = await fetch(HEROKU_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_secret: config.herokuOauth.clientSecret,
    }),
  });
  if (!tokenRes.ok) return { ok: false, returnTo, error: "Token exchange failed" };

  const token = (await tokenRes.json()) as TokenResponse;
  // The web flow returns access_token as a string; direct auth returns an
  // object with a .token field. Handle both.
  const accessToken =
    typeof token.access_token === "string" ? token.access_token : token.access_token?.token;
  if (!accessToken) return { ok: false, returnTo, error: "No access token" };

  const acctRes = await fetch(HEROKU_ACCOUNT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.heroku+json; version=3",
    },
  });
  if (!acctRes.ok) return { ok: false, returnTo, error: "Account lookup failed" };

  const account = (await acctRes.json()) as HerokuAccount;
  const email = account.email?.toLowerCase();
  if (!email) return { ok: false, returnTo, error: "No account email" };
  if (!isAllowedEmail(email)) return { ok: false, returnTo, email, error: "Not allowed" };

  setCookie(c, SESSION_COOKIE, createSessionCookie(email), {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return { ok: true, email, returnTo };
}

export function logout(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

// Gate for read routes: valid session or bounce to Heroku login, preserving
// the originally requested path. With auth disabled the gate is a passthrough.
export const requireSession: MiddlewareHandler = async (c, next) => {
  if (!config.authEnabled) {
    c.set("email", "");
    return next();
  }
  const session = verifySessionCookie(getCookie(c, SESSION_COOKIE));
  if (!session) return startLogin(c, c.req.path);
  c.set("email", session.email);
  await next();
};
