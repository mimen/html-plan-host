import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const text = readFileSync(
  join(import.meta.dir, "../skills/html-plan/references/plan-themes.md"),
  "utf8",
);

const consoleText = readFileSync(
  join(import.meta.dir, "../skills/html-plan/references/plan-themes-console.md"),
  "utf8",
);

test("plan theme is Margin and follows the OS", () => {
  expect(text).toContain("This file is **Margin**");
  expect(text).toContain("@media (prefers-color-scheme: dark)");
  expect(text).toContain("## Markup skeleton");
  expect(text).toContain('<aside class="sources">');
  expect(text).toContain("new IntersectionObserver");
  expect(text).toContain("nav a.current");
  expect(text).not.toContain("Engineering");
  expect(text).not.toContain("Space Grotesk");
  expect(text).not.toContain("**Spec**");
});

test("Console theme follows the OS and ships its skeleton", () => {
  expect(consoleText).toContain("**Console**");
  expect(consoleText).toContain("@media (prefers-color-scheme: dark)");
  expect(consoleText).toContain("## Markup skeleton");
  expect(consoleText).toContain("IntersectionObserver");
  expect(consoleText).toContain("nav.rail a.current");
});

const nocturneText = readFileSync(
  join(import.meta.dir, "../skills/html-plan/references/plan-themes-nocturne.md"),
  "utf8",
);

test("Nocturne theme follows the OS and ships its skeleton", () => {
  expect(nocturneText).toContain("**Nocturne**");
  expect(nocturneText).toContain("@media (prefers-color-scheme: dark)");
  expect(nocturneText).toContain("## Markup skeleton");
  expect(nocturneText).toContain("IntersectionObserver");
  expect(nocturneText).toContain("nav.toc a.current");
});

const skillText = readFileSync(
  join(import.meta.dir, "../skills/html-plan/SKILL.md"),
  "utf8",
);

const squish = (value: string) => value.replace(/\s+/g, " ");

// The default was previously unstated, so every plan improvised a theme.
test("Nocturne is the stated default, in both entry points", () => {
  expect(squish(skillText)).toMatch(/\*\*Nocturne\*\* is the default/);
  expect(squish(text)).toMatch(/\*\*Nocturne\*\* is the default/);
  expect(squish(skillText)).not.toMatch(/\*\*Margin\*\* is the default/);
  expect(squish(text)).not.toMatch(/\*\*Margin\*\* is the default/);
});
