import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config.ts";

// Stateless signed-cookie sessions: no session table needed for a single-user
// app. Payload is base64url(JSON) and the signature is HMAC-SHA256 over it.

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = "hph_session";

interface SessionPayload {
  email: string;
  exp: number; // epoch ms
}

function sign(data: string): string {
  return createHmac("sha256", config.sessionSecret).update(data).digest("base64url");
}

export function createSessionCookie(email: string): string {
  const payload: SessionPayload = { email, exp: Date.now() + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionCookie(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.email !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}
