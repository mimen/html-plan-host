import { randomBytes } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context, MiddlewareHandler } from "hono";
import { config, isAllowedEmail } from "./config.ts";
import { SESSION_COOKIE, createSessionCookie, verifySessionCookie } from "./session.ts";

const OAUTH_STATE_COOKIE = "hph_oauth_state";
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

// The redirect URI must match what's registered in Google Cloud Console. We
// derive it from the request (respecting Heroku's forwarded proto) unless
// BASE_URL pins it explicitly.
export function baseUrl(c: Context): string {
  if (config.baseUrl) return config.baseUrl;
  const proto = c.req.header("x-forwarded-proto") ?? "http";
  const host = c.req.header("host") ?? `localhost:${config.port}`;
  return `${proto}://${host}`;
}

function redirectUri(c: Context): string {
  return `${baseUrl(c)}/auth/callback`;
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
    client_id: config.google.clientId,
    redirect_uri: redirectUri(c),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return c.redirect(`${GOOGLE_AUTH}?${params}`);
}

interface GoogleIdToken {
  email?: string;
  email_verified?: boolean;
}

function decodeIdToken(idToken: string): GoogleIdToken {
  // Safe to decode without signature verification: the token came directly from
  // Google's token endpoint over TLS (per Google's OIDC guidance).
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("Malformed id_token");
  return JSON.parse(Buffer.from(payload, "base64url").toString()) as GoogleIdToken;
}

export interface CallbackResult {
  ok: boolean;
  email?: string;
  returnTo: string;
  error?: string;
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

  const res = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: redirectUri(c),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return { ok: false, returnTo, error: "Token exchange failed" };

  const token = (await res.json()) as { id_token?: string };
  if (!token.id_token) return { ok: false, returnTo, error: "No id_token" };

  const claims = decodeIdToken(token.id_token);
  const email = claims.email?.toLowerCase();
  if (!email || claims.email_verified !== true) return { ok: false, returnTo, error: "Unverified email" };
  if (!isAllowedEmail(email)) return { ok: false, returnTo, email, error: "Domain not allowed" };

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

// Gate for read routes: valid session or bounce to Google login, preserving
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
