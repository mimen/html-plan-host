import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const text = readFileSync(
  join(import.meta.dir, "../skills/html-plan/references/plan-themes.md"),
  "utf8",
);

test("plan theme is Margin and follows the OS", () => {
  expect(text).toContain("One theme, **Margin**");
  expect(text).toContain("@media (prefers-color-scheme: dark)");
  expect(text).toContain("## Markup skeleton");
  expect(text).toContain('<aside class="sources">');
  expect(text).toContain("new IntersectionObserver");
  expect(text).toContain("nav a.current");
  expect(text).not.toContain("Engineering");
  expect(text).not.toContain("Space Grotesk");
  expect(text).not.toContain("**Spec**");
});
