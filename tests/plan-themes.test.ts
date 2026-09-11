import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const text = readFileSync(
  join(import.meta.dir, "../skills/html-plan/references/plan-themes.md"),
  "utf8",
);

test("plan themes default to Spec and follow the OS", () => {
  expect(text).toContain("Default is\n**Spec**");
  expect(text).toContain("@media (prefers-color-scheme: dark)");
  expect(text).toContain("## Reading");
  expect(text).toContain("## Carbon");
  expect(text).not.toContain("Default is **Engineering**");
  expect(text).not.toContain("Space Grotesk");
});
