// Environment configuration, validated once at startup so a misconfigured
// deploy fails loudly instead of erroring on the first request.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

const allowedEmailDomains = optional("ALLOWED_EMAIL_DOMAINS", "salesforce.com,heroku.com")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

// When AUTH_ENABLED=false the read routes are open (no Google sign-in). Lets us
// stand the service up and prove everything else while OAuth access is still an
// open question. Google creds are only required when auth is on.
const authEnabled = optional("AUTH_ENABLED", "true").toLowerCase() !== "false";

export const config = {
  port: Number(optional("PORT", "3000")),
  databaseUrl: required("DATABASE_URL"),
  sessionSecret: required("SESSION_SECRET"),
  publishToken: required("PUBLISH_TOKEN"),
  authEnabled,
  google: {
    clientId: authEnabled ? required("GOOGLE_CLIENT_ID") : optional("GOOGLE_CLIENT_ID", ""),
    clientSecret: authEnabled ? required("GOOGLE_CLIENT_SECRET") : optional("GOOGLE_CLIENT_SECRET", ""),
  },
  allowedEmailDomains,
  // Empty string means "derive from the incoming request".
  baseUrl: optional("BASE_URL", "").replace(/\/$/, ""),
  isProduction: process.env.NODE_ENV === "production" || Boolean(process.env.DYNO),
} as const;

export function isAllowedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? config.allowedEmailDomains.includes(domain) : false;
}
