import { test, expect } from "@playwright/test";

/**
 * Basic example E2E test
 * This demonstrates basic Playwright functionality
 */
test.describe("Basic E2E Tests", () => {
  test("home page loads successfully", async ({ page }) => {
    // Navigate to home page
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check that page has loaded by verifying title
    await expect(page).toHaveTitle(/10x Cards|10xCards/i);
  });

  test("can navigate between pages", async ({ page }) => {
    await page.goto("/");

    // Find and click login link
    const loginLink = page.getByRole("link", { name: /login|sign in|zaloguj/i });
    await loginLink.click();

    // Verify URL changed
    await expect(page).toHaveURL(/login/);

    // Take screenshot on failure
    if (!(await page.url().includes("login"))) {
      await page.screenshot({ path: "test-failure.png" });
    }
  });

  test("visual comparison example", async ({ page }) => {
    await page.goto("/");

    // Wait for page to stabilize
    await page.waitForLoadState("networkidle");

    // Visual comparison with screenshot
    // Uncomment when you want to enable visual regression testing
    // await expect(page).toHaveScreenshot('homepage.png');
  });
});
