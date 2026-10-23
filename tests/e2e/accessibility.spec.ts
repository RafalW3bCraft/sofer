import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

// Automated axe-core accessibility audit of the five core pages, at WCAG
// 2.2 A/AA level. Zero automated violations is NOT a substitute for human
// screen-reader review — this is the mechanical floor.
const pages = [
  { name: "home", path: "/" },
  { name: "lessons", path: "/lessons" },
  { name: "lesson player", path: "/lessons/greetings-1" },
  { name: "alphabet", path: "/alphabet" },
  { name: "progress", path: "/progress" },
];

test.describe("axe-core WCAG 2.2 A/AA audit", () => {
  for (const p of pages) {
    test(`${p.name} has no automated violations`, async ({ page }) => {
      await page.goto(p.path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      const violations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        targets: v.nodes.slice(0, 3).map((n) => String(n.target)),
      }));
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});
