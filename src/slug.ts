import { randomBytes } from "node:crypto";

// Turn a human title into a readable slug stem, e.g. "MIA Model Pipeline" ->
// "mia-model-pipeline".
export function slugifyTitle(title: string): string {
  const stem = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return stem || "plan";
}

// High-entropy suffix so a leaked/guessed stem doesn't expose other plans.
// ~48 bits of entropy in 8 base32-ish chars.
export function randomSuffix(): string {
  return randomBytes(6).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
}
