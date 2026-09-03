// Environment configuration, validated once at startup so a misconfigured
// deploy fails loudly instead of erroring on the first request.
//
// The service is deployment-agnostic: one codebase, many Heroku apps, each
// shaped entirely by its config vars. Auth is implicit. If Google OAuth
// credentials are present, sign-in is required; if not, reads are open.

import { themeNames, defaultTheme } from "./themes.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const googleClientId = optional("GOOGLE_CLIENT_ID", "");
const googleClientSecret = optional("GOOGLE_CLIENT_SECRET", "");
const authEnabled = Boolean(googleClientId && googleClientSecret);

// Comma-separated glob patterns matched against a signed-in user's email.
// Examples: "*.salesforce.com, *.heroku.com" (domain + subdomains),
// "someone@gmail.com" (one person), "*" (any verified Google account).
const allowedEmails = optional("ALLOWED_EMAILS", "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter(Boolean);

if (authEnabled && allowedEmails.length === 0) {
  throw new Error(
    'ALLOWED_EMAILS must be set when Google OAuth is configured. ' +
      'Use patterns like "*.salesforce.com, *.heroku.com", a specific address, or "*" for any verified Google account.',
  );
}

const theme = optional("THEME", defaultTheme).trim().toLowerCase();
if (!themeNames.includes(theme)) {
  throw new Error(
    `Invalid THEME "${theme}". Valid themes: ${themeNames.join(", ")}`,
  );
}

export const config = {
  port: Number(optional("PORT", "3000")),
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),
  publishToken: required("PUBLISH_TOKEN"),
  theme,
  authEnabled,
  google: { clientId: googleClientId, clientSecret: googleClientSecret },
  allowedEmails,
  // Empty string means "derive from the incoming request".
  baseUrl: optional("BASE_URL", "").replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production" || Boolean(process.env.DYNO),
} as const;

function globToRegExp(glob: string): RegExp {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

// Match a verified email against the allow-list patterns. A "*.base" pattern
// matches the base domain and any subdomain; a pattern with "@" matches the
// full address; a bare domain matches exactly; "*" matches anything.
export function isAllowedEmail(email: string): boolean {
  const normalized = email.toLowerCase();
  const domain = normalized.split("@")[1] ?? "";
  if (!domain) return false;

  return config.allowedEmails.some((pattern) => {
    if (pattern === "*") return true;
    if (pattern.includes("@")) return globToRegExp(pattern).test(normalized);
    if (pattern.startsWith("*.")) {
      const base = pattern.slice(2);
      return domain === base || domain.endsWith(`.${base}`);
    }
    return globToRegExp(pattern).test(domain);
  });
}
