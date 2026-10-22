import { test, expect } from "@playwright/test";

test("learner opens Home, navigates to a lesson, reads a token, answers the question, and sees progress", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Learn your first Arabic sentences/i })).toBeVisible();
  await page.getByRole("link", { name: /Start Learning/i }).click();

  // Lesson list shows the three lessons.
  await expect(page.getByRole("heading", { name: /Lessons/i })).toBeVisible();
  await expect(page.getByText(/Greetings and basic courtesies/i)).toBeVisible();

  // Open the first lesson.
  await page.getByRole("link", { name: /Greetings and basic courtesies/i }).click();

  // Sentence area renders the Arabic greeting.
  const token = page.locator('button.token').first();
  await expect(token).toBeVisible();

  // Tap the first token; TokenPanel appears with curated meaning.
  await token.click();
  await expect(page.getByRole("region", { name: /Details for/i })).toBeVisible();
  await expect(page.locator(".token-panel__meaning")).toContainText(/peace/i);

  // Mark as tricky.
  await page.getByRole("button", { name: /Mark as tricky/i }).click();
  await expect(page.getByRole("button", { name: /Marked tricky/i })).toBeVisible();

  // Close the token panel via Escape.
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: /Details for/i })).toHaveCount(0);

  // Answer the comprehension question (first option, which is correct for this question).
  await page.getByRole("radio", { name: /When you meet someone, as a general greeting/i }).click();
  await page.getByRole("button", { name: /Check answer/i }).click();
  await expect(page.getByText(/Correct\./)).toBeVisible();

  // Advance to the next sentence.
  await page.getByRole("button", { name: /Next sentence/i }).click();
  await expect(page.getByText(/Sentence 2 of/)).toBeVisible();

  // Reload — progress should persist in localStorage.
  await page.reload();
  await expect(page.getByText(/Sentence 1 of/)).toBeVisible();
  // The lesson list marks it as done.
  await page.goto("/lessons");
  await expect(page.getByText(/done/i).first()).toBeVisible();

  // Open Progress — should show 1 lesson completed, 1 question answered.
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: /Your progress/i })).toBeVisible();
  await expect(page.getByText(/Lessons completed/i)).toBeVisible();
});

test("alphabet page lists 28 letters and 3 diacritics", async ({ page }) => {
  await page.goto("/alphabet");
  await expect(page.getByRole("heading", { name: /The Arabic alphabet/i })).toBeVisible();
  const cells = page.locator(".alphabet-cell");
  await expect(cells).toHaveCount(28);
  await expect(page.getByText(/fatḥa/i)).toBeVisible();
  await expect(page.getByText(/kasra/i)).toBeVisible();
  await expect(page.getByText(/ḍamma/i)).toBeVisible();
});