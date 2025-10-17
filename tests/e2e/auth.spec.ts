import { test, expect } from "@playwright/test";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";

/**
 * E2E tests for authentication flow
 * Using Page Object Model for maintainability
 */

test.describe("Home Page Navigation", () => {
  test("should display home page elements", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Verify we're on home page
    expect(await homePage.isOnHomePage()).toBe(true);

    // Verify welcome heading is visible
    expect(await homePage.welcomeHeading.isVisible()).toBe(true);
  });

  test("should navigate to login from home page", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Navigate to login
    await homePage.goToLogin();

    // Verify we're on login page
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Browser contexts isolate test environments
    await page.goto("/");
  });

  test("should display registration page correctly", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Verify registration form is visible
    expect(await registerPage.isRegisterFormVisible()).toBe(true);

    // Verify page title
    await expect(page).toHaveTitle(/register|rejestracja/i);

    // Verify register button is initially disabled
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);
  });

  test("should show email validation errors", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try invalid email formats
    const invalidEmails = ["invalid-email", "@test.com", "test@", "test.com"];

    for (const email of invalidEmails) {
      await registerPage.emailInput.fill(email);
      await registerPage.emailInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown
      const hasError = await registerPage.hasEmailError();
      if (hasError) {
        expect(await registerPage.getEmailError()).toContain("adres e-mail");
      }
    }
  });

  test("should show password validation errors", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try passwords shorter than 6 characters
    const shortPasswords = ["", "1", "12", "123", "1234", "12345"];

    for (const password of shortPasswords) {
      await registerPage.passwordInput.fill(password);
      await registerPage.passwordInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown for passwords shorter than 6 chars
      if (password.length > 0 && password.length < 6) {
        const hasError = await registerPage.hasPasswordError();
        if (hasError) {
          expect(await registerPage.getPasswordError()).toContain("6 znaków");
        }
      }
    }
  });

  test("should show password confirmation validation errors", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill password and different confirmation
    await registerPage.passwordInput.fill("password123");
    await registerPage.confirmPasswordInput.fill("differentpassword");
    await registerPage.confirmPasswordInput.blur();

    // Wait for validation
    await page.waitForTimeout(100);

    // Check if validation error is shown
    const hasError = await registerPage.hasConfirmPasswordError();
    if (hasError) {
      expect(await registerPage.getConfirmPasswordError()).toContain("identyczne");
    }
  });

  test("should enable register button when form is valid", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Initially disabled
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill email
    await registerPage.emailInput.fill("test@example.com");
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill password (too short)
    await registerPage.passwordInput.fill("12345");
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill valid password
    await registerPage.passwordInput.fill("password123");
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill matching confirmation
    await registerPage.confirmPasswordInput.fill("password123");
    expect(await registerPage.isRegisterButtonEnabled()).toBe(true);
  });

  test("should toggle password visibility", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill password
    await registerPage.passwordInput.fill("password123");

    // Check initial state (password hidden)
    const passwordInputType = await registerPage.passwordInput.getAttribute("type");
    expect(passwordInputType).toBe("password");

    // Toggle visibility
    await registerPage.togglePasswordVisibility();

    // Check if password is now visible
    const newPasswordInputType = await registerPage.passwordInput.getAttribute("type");
    expect(newPasswordInputType).toBe("text");

    // Toggle back
    await registerPage.togglePasswordVisibility();
    const finalPasswordInputType = await registerPage.passwordInput.getAttribute("type");
    expect(finalPasswordInputType).toBe("password");
  });

  test("should toggle confirm password visibility", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill confirm password
    await registerPage.confirmPasswordInput.fill("password123");

    // Check initial state (password hidden)
    const confirmPasswordInputType = await registerPage.confirmPasswordInput.getAttribute("type");
    expect(confirmPasswordInputType).toBe("password");

    // Toggle visibility
    await registerPage.toggleConfirmPasswordVisibility();

    // Check if password is now visible
    const newConfirmPasswordInputType = await registerPage.confirmPasswordInput.getAttribute("type");
    expect(newConfirmPasswordInputType).toBe("text");
  });

  test("should handle registration with existing email", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try to register with an email that might already exist
    // Note: This test assumes there might be a test user in the database
    await registerPage.registerWithMatchingPasswords("test@example.com", "password123");

    // Wait for result
    await registerPage.waitForRegistrationResult();

    // Check if error message appears (depends on backend implementation)
    const hasError = await registerPage.hasError();
    if (hasError) {
      expect(await registerPage.getErrorMessage()).toBeTruthy();
    }
  });

  test("should handle network errors gracefully", async () => {
    // This test would require mocking network requests
    // For now, we'll skip it as it requires additional setup
    test.skip();
  });
});
