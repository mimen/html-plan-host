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

// Agents improvised these three when Console lacked them, so each theme owns
// the full house component set: per-section sources, a picked row, definitions.
test("Console styles the house components and demonstrates them", () => {
  expect(consoleText).toContain("table.matrix tr.pick");
  expect(consoleText).toContain('<aside class="sources">');
  expect(consoleText).toContain('<table class="matrix">');
  expect(consoleText).toContain('<tr class="pick">');
  expect(consoleText).toContain('<dl class="defs">');
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

// Every theme carries the full house component set, whichever is the default.
test("Nocturne styles the house components and demonstrates them", () => {
  expect(nocturneText).toContain("tr.pick");
  expect(nocturneText).toContain('<table class="matrix">');
  expect(nocturneText).toContain('<tr class="pick">');
  expect(nocturneText).toContain('<dl class="defs">');
  expect(nocturneText).toContain('class="stats"');
});

const skillText = readFileSync(
  join(import.meta.dir, "../skills/html-plan/SKILL.md"),
  "utf8",
);

const squish = (value: string) => value.replace(/\s+/g, " ");

// The default was previously unstated, so every plan improvised a theme.
test("Console is the stated default, in both entry points", () => {
  expect(squish(skillText)).toMatch(/\*\*Console\*\* is the default/);
  expect(squish(text)).toMatch(/\*\*Console\*\* is the default/);
  expect(squish(skillText)).not.toMatch(/\*\*Margin\*\* is the default/);
  expect(squish(text)).not.toMatch(/\*\*Margin\*\* is the default/);
  expect(squish(skillText)).not.toMatch(/\*\*Nocturne\*\* is the default/);
  expect(squish(text)).not.toMatch(/\*\*Nocturne\*\* is the default/);
});
