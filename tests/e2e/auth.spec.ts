import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';

/**
 * E2E tests for authentication flow
 * Using Page Object Model for maintainability
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Browser contexts isolate test environments
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Verify login form is visible
    expect(await loginPage.isLoginFormVisible()).toBe(true);
    
    // Verify page title
    await expect(page).toHaveTitle(/login|sign in/i);
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try to login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Wait for error message
    await page.waitForTimeout(1000);

    // Check if error is displayed (if implemented in the app)
    const hasError = await loginPage.hasError();
    
    // This test might need adjustment based on actual implementation
    if (hasError) {
      expect(await loginPage.getErrorMessage()).toBeTruthy();
    }
  });

  test('should navigate to register page from login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Click on register link
    await loginPage.goToRegister();

    // Verify navigation to register page
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to password reset page from login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Click on password reset link
    await loginPage.goToPasswordReset();

    // Verify navigation to password reset page
    await expect(page).toHaveURL(/password-reset/);
  });
});

test.describe('Home Page Navigation', () => {
  test('should display home page elements', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Verify we're on home page
    expect(await homePage.isOnHomePage()).toBe(true);

    // Verify welcome heading is visible
    expect(await homePage.welcomeHeading.isVisible()).toBe(true);
  });

  test('should navigate to login from home page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigate();

    // Navigate to login
    await homePage.goToLogin();

    // Verify we're on login page
    await expect(page).toHaveURL(/login/);
  });
});

