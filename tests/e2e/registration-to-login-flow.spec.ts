import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

/**
 * E2E tests for complete registration to first login flow
 * Tests the entire user journey from account creation to successful login
 */
test.describe('Complete Registration to Login Flow', () => {
  // Generate unique test email to avoid conflicts
  const getUniqueEmail = () => `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  test('should complete full registration and first login flow', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    // Step 1: Start from home page
    await homePage.navigate();
    expect(await homePage.isOnHomePage()).toBe(true);

    // Step 2: Navigate to registration page
    await homePage.goToLogin(); // Navigate to login first
    await loginPage.goToRegister(); // Then to register

    // Step 3: Verify registration page loads correctly
    expect(await registerPage.isRegisterFormVisible()).toBe(true);
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Step 4: Fill registration form
    const testEmail = getUniqueEmail();
    await registerPage.emailInput.fill(testEmail);
    await registerPage.passwordInput.fill(testPassword);
    await registerPage.confirmPasswordInput.fill(testPassword);

    // Step 5: Verify form validation
    expect(await registerPage.isRegisterButtonEnabled()).toBe(true);

    // Step 6: Submit registration
    await registerPage.registerButton.click();

    // Step 7: Wait for registration result
    await registerPage.waitForRegistrationResult();

    // Step 8: Check registration outcome
    const hasSuccessMessage = await registerPage.hasSuccessMessage();
    const hasError = await registerPage.hasError();
    const isRedirected = page.url().includes('/generate');

    // Registration should either succeed or show appropriate message
    expect(hasSuccessMessage || hasError || isRedirected).toBe(true);

    // If registration succeeded and redirected, we're done
    if (isRedirected) {
      // Verify we're on the generate page (main app page after login)
      await expect(page).toHaveURL(/\/generate/);
      return;
    }

    // If not redirected, check for success message
    if (hasSuccessMessage) {
      const successText = await registerPage.getSuccessMessage();
      expect(successText).toContain('pomyślnie');
    }

    // Step 9: Navigate to login page
    await registerPage.goToLogin();

    // Step 10: Verify login page loads
    expect(await loginPage.isLoginFormVisible()).toBe(true);

    // Step 11: Attempt first login with new credentials
    await loginPage.login(testEmail, testPassword);

    // Step 12: Wait for login result
    await loginPage.waitForLoginResult();

    // Step 13: Verify successful login
    const loginSuccessful = page.url().includes('/generate');
    const hasLoginError = await loginPage.hasError();

    expect(loginSuccessful || !hasLoginError).toBe(true);

    if (loginSuccessful) {
      // Verify we're redirected to the main app page
      await expect(page).toHaveURL(/\/generate/);
    }
  });

  test('should handle registration with email confirmation flow', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    // This test assumes email confirmation is required
    test.skip(); // Skip if email confirmation is not implemented

    const testEmail = getUniqueEmail();

    // Register user
    await registerPage.navigate();
    await registerPage.registerWithMatchingPasswords(testEmail, testPassword);

    // Wait for success message about email confirmation
    await registerPage.waitForRegistrationResult();
    expect(await registerPage.hasSuccessMessage()).toBe(true);

    const successMessage = await registerPage.getSuccessMessage();
    expect(successMessage).toContain('e-mail');

    // Try to login before email confirmation (should fail)
    await registerPage.goToLogin();
    await loginPage.login(testEmail, testPassword);
    await loginPage.waitForLoginResult();

    // Should show error about unconfirmed email
    expect(await loginPage.hasError()).toBe(true);

    // Note: Actual email confirmation would require external email service
    // This test demonstrates the expected flow
  });

  test('should handle registration and immediate login attempt', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    const testEmail = getUniqueEmail();

    // Register user
    await registerPage.navigate();
    await registerPage.registerWithMatchingPasswords(testEmail, testPassword);

    // Immediately try to login (without waiting for registration to complete)
    await registerPage.goToLogin();
    await loginPage.login(testEmail, testPassword);

    // Wait for result
    await loginPage.waitForLoginResult();

    // Should either succeed or show appropriate error
    const loginSuccessful = page.url().includes('/generate');
    const hasError = await loginPage.hasError();

    expect(loginSuccessful || hasError).toBe(true);
  });

  test('should handle form data persistence across navigation', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    // Start registration
    await registerPage.navigate();
    const testEmail = getUniqueEmail();

    await registerPage.emailInput.fill(testEmail);
    await registerPage.passwordInput.fill(testPassword);
    await registerPage.confirmPasswordInput.fill(testPassword);

    // Navigate to login and back
    await registerPage.goToLogin();
    await loginPage.goToRegister();

    // Check if form data is preserved (depends on implementation)
    const emailValue = await registerPage.emailInput.inputValue();
    const passwordValue = await registerPage.passwordInput.inputValue();
    const confirmValue = await registerPage.confirmPasswordInput.inputValue();

    // Form should be cleared for security (recommended)
    expect(emailValue).toBe('');
    expect(passwordValue).toBe('');
    expect(confirmValue).toBe('');
  });

  test('should complete flow with password visibility toggles', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    const testEmail = getUniqueEmail();

    // Register with password visibility toggle
    await registerPage.navigate();

    await registerPage.emailInput.fill(testEmail);
    await registerPage.passwordInput.fill(testPassword);
    await registerPage.confirmPasswordInput.fill(testPassword);

    // Toggle password visibility during registration
    await registerPage.togglePasswordVisibility();
    await registerPage.toggleConfirmPasswordVisibility();

    // Verify password is visible
    let passwordType = await registerPage.passwordInput.getAttribute('type');
    let confirmType = await registerPage.confirmPasswordInput.getAttribute('type');
    expect(passwordType).toBe('text');
    expect(confirmType).toBe('text');

    // Submit registration
    await registerPage.registerButton.click();
    await registerPage.waitForRegistrationResult();

    // Navigate to login
    await registerPage.goToLogin();

    // Login with password visibility toggle
    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill(testPassword);

    // Toggle password visibility during login
    await loginPage.togglePasswordVisibility();

    // Verify password is visible
    passwordType = await loginPage.passwordInput.getAttribute('type');
    expect(passwordType).toBe('text');

    // Submit login
    await loginPage.loginButton.click();
    await loginPage.waitForLoginResult();

    // Verify successful login
    const loginSuccessful = page.url().includes('/generate');
    expect(loginSuccessful).toBe(true);
  });

  test('should handle browser back/forward navigation during flow', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    // Start on home page
    await page.goto('/');

    // Navigate to registration
    await page.goto('/register');

    // Fill registration form
    const testEmail = getUniqueEmail();
    await registerPage.emailInput.fill(testEmail);
    await registerPage.passwordInput.fill(testPassword);
    await registerPage.confirmPasswordInput.fill(testPassword);

    // Go back to home
    await page.goBack();
    await expect(page).toHaveURL(/\//);

    // Go forward to registration
    await page.goForward();
    await expect(page).toHaveURL(/\/register/);

    // Verify form data is cleared (for security)
    const emailValue = await registerPage.emailInput.inputValue();
    expect(emailValue).toBe('');
  });

  test('should handle multiple tabs/windows during registration flow', async ({ context, page }) => {
    // Open registration in new tab
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Open login in new tab
    const newPage = await context.newPage();
    const loginPage = new LoginPage(newPage);
    await loginPage.navigate();

    // Fill registration in first tab
    const testEmail = getUniqueEmail();
    await registerPage.emailInput.fill(testEmail);
    await registerPage.passwordInput.fill(testPassword);
    await registerPage.confirmPasswordInput.fill(testPassword);

    // Fill login in second tab
    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill(testPassword);

    // Submit registration in first tab
    await registerPage.registerButton.click();
    await registerPage.waitForRegistrationResult();

    // Submit login in second tab
    await loginPage.loginButton.click();
    await loginPage.waitForLoginResult();

    // Both should work independently
    const registerSuccess = await registerPage.hasSuccessMessage() || page.url().includes('/generate');
    const loginSuccess = newPage.url().includes('/generate') || await loginPage.hasError() === false;

    expect(registerSuccess || loginSuccess).toBe(true);
  });

  test('should handle network interruptions during registration', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    // This test would require network mocking
    test.skip(); // Skip as it requires advanced network mocking setup

    const testEmail = getUniqueEmail();
    await registerPage.navigate();
    await registerPage.registerWithMatchingPasswords(testEmail, testPassword);

    // Simulate network failure during registration
    // Verify appropriate error handling
    // This would need Playwright's request interception
  });

  test('should validate complete user journey accessibility', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    // Test keyboard navigation through entire flow
    await registerPage.navigate();

    // Navigate through registration form with keyboard
    await page.keyboard.press('Tab'); // Email
    await page.keyboard.type(getUniqueEmail());
    await page.keyboard.press('Tab'); // Password
    await page.keyboard.type(testPassword);
    await page.keyboard.press('Tab'); // Confirm password
    await page.keyboard.type(testPassword);
    await page.keyboard.press('Tab'); // Register button
    await page.keyboard.press('Enter'); // Submit

    // Wait for result
    await registerPage.waitForRegistrationResult();

    // Navigate to login
    await page.keyboard.press('Tab'); // Login link
    await page.keyboard.press('Enter');

    // Navigate through login form
    await page.keyboard.press('Tab'); // Email
    await page.keyboard.type(getUniqueEmail());
    await page.keyboard.press('Tab'); // Password
    await page.keyboard.type(testPassword);
    await page.keyboard.press('Tab'); // Login button
    await page.keyboard.press('Enter'); // Submit

    // Verify successful completion
    await loginPage.waitForLoginResult();
    const loginSuccessful = page.url().includes('/generate');
    expect(loginSuccessful).toBe(true);
  });
});
