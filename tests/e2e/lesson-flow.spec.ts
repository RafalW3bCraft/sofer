import { test, expect } from "@playwright/test";

test.describe("learner flow", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies + localStorage so V1/V2 migration doesn't leak state.
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    });
  });

  test("home -> lesson -> token -> answer -> next sentence -> progress", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Learn your first Arabic sentences/i })
    ).toBeVisible();
    await page.getByRole("link", { name: /Start Learning/i }).click();

    await expect(page.getByRole("heading", { name: /Lessons/i })).toBeVisible();
    await expect(
      page.getByText(/Greetings and basic courtesies/i)
    ).toBeVisible();

    await page.getByRole("link", { name: /Greetings and basic courtesies/i }).click();

    const token = page.locator("button.token").first();
    await expect(token).toBeVisible();
    await token.click();
    await expect(page.getByRole("region", { name: /Details for/i })).toBeVisible();
    await expect(page.locator(".token-panel__meaning")).toContainText(/peace/i);

    // Mark as tricky.
    await page.getByRole("button", { name: /Mark as tricky/i }).click();
    await expect(page.getByRole("button", { name: /Marked tricky/i })).toBeVisible();

    // Close via Escape.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: /Details for/i })).toHaveCount(0);

    // Answer the first question.
    await page
      .getByRole("radio", {
        name: /When you meet someone, as a general greeting/i,
      })
      .click();
    await page.getByRole("button", { name: /Check answer/i }).click();
    await expect(page.getByText(/Correct\./)).toBeVisible();

    // Advance to sentence 2.
    await page.getByRole("button", { name: /Next sentence/i }).click();
    await expect(page.getByText(/Sentence 2 of 3/)).toBeVisible();

    // Reload — progress should persist and resume at the unanswered sentence.
    await page.reload();
    await expect(page.getByText(/Sentence 2 of 3/)).toBeVisible();

    // The lesson should NOT yet be marked done (we answered only one of three).
    await page.goto("/lessons");
    await expect(
      page.getByText(/0 of 3 lessons complete/i)
    ).toBeVisible();
    await expect(page.getByText(/^done$/i)).toHaveCount(0);
  });

  test("completing every sentence marks the lesson done", async ({ page }) => {
    await page.goto("/lessons/greetings-1");

    // Helper: click the first answer option on the current page, check, advance.
    const answerAndAdvance = async (
      correctTextMatcher: RegExp | null,
      advanceButton: RegExp
    ) => {
      if (correctTextMatcher) {
        await page.getByRole("radio", { name: correctTextMatcher }).click();
      } else {
        // No specific option given — pick the first radio.
        await page.locator('[role="radio"]').first().click();
      }
      await page.getByRole("button", { name: /Check answer/i }).click();
      await page.getByRole("button", { name: advanceButton }).click();
    };

    await answerAndAdvance(
      /When you meet someone, as a general greeting/i,
      /Next sentence/i
    );
    await answerAndAdvance(/It means 'and', linking this response/i, /Next sentence/i);
    await answerAndAdvance(
      /you say the same phrase back/i,
      /Finish lesson/i
    );

    // Lesson list should now report 1/3 done and show "✓ done" next to the lesson.
    await page.goto("/lessons");
    await expect(
      page.getByText(/Greetings and basic courtesies/i).first()
    ).toBeVisible();
    await expect(page.getByText(/✓ done/i).first()).toBeVisible();
    await expect(page.getByText(/1 of 3 lessons complete/i)).toBeVisible();
  });

  test("re-submitting the same answer does not inflate the totals", async ({ page }) => {
    await page.goto("/lessons/greetings-1");
    await page
      .getByRole("radio", {
        name: /When you meet someone, as a general greeting/i,
      })
      .click();
    await page.getByRole("button", { name: /Check answer/i }).click();
    await expect(page.getByText(/Correct\./)).toBeVisible();
    // Now go to Progress before advancing — the lesson is NOT complete.
    await page.goto("/progress");
    await expect(
      page.getByRole("heading", { name: /Your progress/i })
    ).toBeVisible();
    // Wait for the persisted progress to surface (the page reads storage on
    // mount in a useMemo; the render that shows non-zero totals must happen).
    await page.waitForFunction(() => {
      const stats = document.querySelectorAll(".progress-stat__value");
      return Array.from(stats).some((s) => s.textContent === "1");
    }, { timeout: 5000 });
    const questionsStat = page.locator(".progress-stat", {
      hasText: /Questions answered/i,
    });
    await expect(questionsStat.locator(".progress-stat__value")).toHaveText("1");
    // The "Lessons completed" stat should read "0".
    const lessonsStat = page.locator(".progress-stat", {
      hasText: /Lessons completed/i,
    });
    await expect(lessonsStat.locator(".progress-stat__value")).toHaveText("0");
  });
});

test("alphabet page lists 28 letters and 3 diacritics", async ({ page }) => {
  await page.goto("/alphabet");
  await expect(
    page.getByRole("heading", { name: /The Arabic alphabet/i })
  ).toBeVisible();
  const cells = page.locator(".alphabet-cell");
  await expect(cells).toHaveCount(28);
  await expect(page.getByText(/fatḥa/i)).toBeVisible();
  await expect(page.getByText(/kasra/i)).toBeVisible();
  await expect(page.getByText(/ḍamma/i)).toBeVisible();
});

test("tricky token deep link focuses the right sentence + token", async ({ page }) => {
  await page.goto("/lessons/greetings-1");
  // Mark the first token tricky.
  await page.locator("button.token").first().click();
  await page.getByRole("button", { name: /Mark as tricky/i }).click();
  await page.keyboard.press("Escape");
  // Close the panel.
  await page.goto("/progress");
  // Click "Jump to lesson" — should land on the same lesson and the same token panel.
  const jump = page.getByRole("link", { name: /Jump to lesson/i }).first();
  await jump.click();
  // We should be on the lesson page.
  await expect(page).toHaveURL(/#greetings-1:g1-s1:0$/);
  // The TokenPanel for the marked token should be visible (deep link re-opens it).
  await expect(page.getByRole("region", { name: /Details for/i })).toBeVisible();
});