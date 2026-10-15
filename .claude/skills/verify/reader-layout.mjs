// Run with Bun. Set PLAYWRIGHT_MODULE to an existing Playwright installation if needed.
import assert from 'node:assert/strict';

process.env.DATABASE_URL = 'postgres://unused@127.0.0.1:1/unused';
process.env.SESSION_SECRET = 'layout-check';
process.env.PUBLISH_TOKEN = 'layout-check';
process.env.HEROKU_OAUTH_ID = '';
process.env.HEROKU_OAUTH_SECRET = '';
const { planFramePage } = await import('../../../src/views/versions.ts');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const now = new Date('2026-10-14T12:00:00Z');
const plan = { slug: 'layout-check', title: 'Cloudinary Cloudflare R2 migration implementation plan' };
const views = [
  { kind: 'draft', dirty: true, latestPublished: 1, updatedAt: now, summary: 'Read the changes before publishing.' },
  { kind: 'version', version: 2, latest: 3, dirty: true, publishedAt: now, summary: 'Read the published changes.' },
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/*', route => route.abort());
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of views) {
      await page.setContent(planFramePage(plan, view, 'about:blank', false));
      const layout = await page.evaluate(() => {
        const bar = document.querySelector('.bar').getBoundingClientRect();
        return {
          viewport: innerWidth,
          scroll: document.documentElement.scrollWidth,
          barBottom: bar.bottom,
          controls: [...document.querySelectorAll('.bar a, .bar button, .bar label, .crumb.title')].map(element => {
            const box = element.getBoundingClientRect();
            return { text: element.textContent, left: box.left, right: box.right, top: box.top, bottom: box.bottom };
          }),
        };
      });
      assert.ok(layout.scroll <= width, `${view.kind} at ${width}px overflows to ${layout.scroll}px`);
      for (const control of layout.controls) {
        assert.ok(control.left >= 0 && control.right <= width && control.top >= 0 && control.bottom <= layout.barBottom,
          `${view.kind} at ${width}px clips ${control.text}: ${JSON.stringify(control)}`);
      }
      await page.locator('label[for="summary-toggle"]').click();
      assert.equal(await page.locator('.subbar').isVisible(), true);
      if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${width}-${view.kind}.png` });
      console.log(`PASS ${view.kind} at ${width}px: controls fit, summary opens`);
    }
  }
} finally {
  await browser.close();
}
