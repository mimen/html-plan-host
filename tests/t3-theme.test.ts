import { describe, expect, test } from "bun:test";
import { withT3Theme } from "../src/t3Theme.ts";

const MARK = '<style id="t3-theme">';

describe("withT3Theme", () => {
  test("puts T3 tokens first in head so the page's own rules win", () => {
    const page = '<!doctype html><html><head><title>x</title><style>.c{color:var(--accent)}</style></head><body><p class="c">hi</p></body></html>';
    const out = withT3Theme(page);
    expect(out.indexOf(MARK)).toBe(page.indexOf("<head>") + "<head>".length);
    expect(out.indexOf(MARK)).toBeLessThan(out.indexOf(".c{color"));
    expect(out).toContain("--accent:#346bf1");
    expect(out).toContain("@media (prefers-color-scheme: light){:root{color-scheme:light;");
  });

  test("handles fragments with no head or html element", () => {
    expect(withT3Theme("<!doctype html><h1>a</h1>")).toMatch(/^<!doctype html><style id="t3-theme">[\s\S]*<\/style><h1>a<\/h1>$/);
    expect(withT3Theme("<h1>a</h1>").startsWith(MARK)).toBe(true);
  });

  test.each([
    "body { margin: 0; background: var(--bg); }",
    "html,body{background-color:#fff}",
    ":root { background: white }",
  ])("leaves a page that paints its own canvas untouched: %s", (css) => {
    const page = `<!doctype html><html><head><style>${css}</style></head><body></body></html>`;
    expect(withT3Theme(page)).toBe(page);
  });

  test("a background on an inner element does not opt out", () => {
    const page = "<html><head><style>.card{background:var(--card)} tbody td{color:red}</style></head></html>";
    expect(withT3Theme(page)).toContain(MARK);
  });
});
