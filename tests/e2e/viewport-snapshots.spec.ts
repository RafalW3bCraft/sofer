/**
 * Manual-style viewport smoke: render each main page at 320, 375, 768, 1024,
 * 1440 px and snapshot to docs/release/screenshots/. This is a one-shot
 * test that produces visual evidence for the release matrix; it does not
 * fail on visual judgment, only on rendering errors.
 */
import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const VIEWPORTS = [
  { name: "320", width: 320, height: 640 },
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
];

const OUT_DIR = resolve("docs/release/screenshots");

test.beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

const PAGES: Array<{ name: string; path: string }> = [
  { name: "home", path: "/" },
  { name: "lessons", path: "/lessons" },
  { name: "lesson-player", path: "/lessons/greetings-1" },
  { name: "alphabet", path: "/alphabet" },
  { name: "progress", path: "/progress" },
];

for (const vp of VIEWPORTS) {
  test.describe(`viewport-${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });
    for (const p of PAGES) {
      test(`${p.name} renders at ${vp.name}px wide`, async ({ page }) => {
        await page.goto(p.path);
        await page.screenshot({
          path: `${OUT_DIR}/${p.name}-${vp.name}.png`,
          fullPage: true,
        });
      });
    }
  });
}