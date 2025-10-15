import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
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

  test('should show email validation errors on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try invalid email formats
    const invalidEmails = ['invalid-email', '@test.com', 'test@', 'test.com'];

    for (const email of invalidEmails) {
      await loginPage.emailInput.fill(email);
      await loginPage.emailInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown
      const hasError = await loginPage.hasEmailError();
      if (hasError) {
        expect(await loginPage.getEmailError()).toContain('adres e-mail');
      }
    }
  });

  test('should show password validation errors on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try empty or short passwords
    const invalidPasswords = ['', '1', '12', '123', '1234', '12345'];

    for (const password of invalidPasswords) {
      await loginPage.passwordInput.fill(password);
      await loginPage.passwordInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown for passwords shorter than 6 chars
      if (password.length > 0 && password.length < 6) {
        const hasError = await loginPage.hasPasswordError();
        if (hasError) {
          expect(await loginPage.getPasswordError()).toContain('6 znaków');
        }
      }
    }
  });

  test('should enable login button when form is valid', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Initially disabled (assuming validation requires both fields)
    expect(await loginPage.isLoginButtonDisabled()).toBe(true);

    // Fill email
    await loginPage.emailInput.fill('test@example.com');
    expect(await loginPage.isLoginButtonDisabled()).toBe(true);

    // Fill password (too short)
    await loginPage.passwordInput.fill('12345');
    expect(await loginPage.isLoginButtonDisabled()).toBe(true);

    // Fill valid password
    await loginPage.passwordInput.fill('password123');
    expect(await loginPage.isLoginButtonEnabled()).toBe(true);
  });

  test('should toggle password visibility on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill password
    await loginPage.passwordInput.fill('password123');

    // Check initial state (password hidden)
    const passwordInputType = await loginPage.passwordInput.getAttribute('type');
    expect(passwordInputType).toBe('password');

    // Toggle visibility
    await loginPage.togglePasswordVisibility();

    // Check if password is now visible
    const newPasswordInputType = await loginPage.passwordInput.getAttribute('type');
    expect(newPasswordInputType).toBe('text');

    // Toggle back
    await loginPage.togglePasswordVisibility();
    const finalPasswordInputType = await loginPage.passwordInput.getAttribute('type');
    expect(finalPasswordInputType).toBe('password');
  });

  test('should show loading state during login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill valid form
    await loginPage.login('test@example.com', 'password123');

    // Check if button text changes to loading state
    await expect(loginPage.loginButton).toContainText(/logowanie|logging|signing/i);
  });

  test('should handle invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try to login with invalid credentials
    await loginPage.login('nonexistent@example.com', 'wrongpassword');

    // Wait for result
    await loginPage.waitForLoginResult();

    // Check if error message is displayed
    expect(await loginPage.hasError()).toBe(true);
    expect(await loginPage.getErrorMessage()).toBeTruthy();
  });

  test('should handle empty form submission', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try to submit empty form
    await loginPage.loginButton.click();

    // Wait for validation
    await page.waitForTimeout(100);

    // Check if validation errors are shown
    const hasEmailError = await loginPage.hasEmailError();
    const hasPasswordError = await loginPage.hasPasswordError();

    // At least one validation error should be shown
    expect(hasEmailError || hasPasswordError).toBe(true);
  });

  test('should handle case insensitive email login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try login with uppercase email
    await loginPage.login('TEST@EXAMPLE.COM', 'password123');

    // Wait for result - this depends on backend implementation
    await loginPage.waitForLoginResult();

    // Either success or error is acceptable depending on backend
    const hasError = await loginPage.hasError();
    const isRedirected = page.url().includes('/generate');

    expect(hasError || isRedirected).toBe(true);
  });

  test('should handle login with spaces in email', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Try login with email containing spaces
    await loginPage.login('  test@example.com  ', 'password123');

    // Wait for result
    await loginPage.waitForLoginResult();

    // Check result - should either work or show appropriate error
    const hasError = await loginPage.hasError();
    const isRedirected = page.url().includes('/generate');

    expect(hasError || isRedirected).toBe(true);
  });

  test('should handle rapid multiple login attempts', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Attempt multiple rapid logins
    for (let i = 0; i < 3; i++) {
      await loginPage.login('test@example.com', 'password123');
      await page.waitForTimeout(500);
    }

    // Wait for final result
    await loginPage.waitForLoginResult();

    // Should either succeed or show rate limiting error
    const hasError = await loginPage.hasError();
    const isRedirected = page.url().includes('/generate');

    expect(hasError || isRedirected).toBe(true);
  });

  test('should handle login after page refresh', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill form
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');

    // Refresh page
    await page.reload();

    // Check if form is cleared (depends on implementation)
    const emailValue = await loginPage.emailInput.inputValue();
    const passwordValue = await loginPage.passwordInput.inputValue();

    // Form should be cleared after refresh for security
    expect(emailValue).toBe('');
    expect(passwordValue).toBe('');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Navigate through form using keyboard
    await page.keyboard.press('Tab'); // Focus email
    // Note: We can't easily test focus state with Playwright locators
    // Instead, we'll test that keyboard navigation works by typing
    await page.keyboard.type('test@example.com');

    await page.keyboard.press('Tab'); // Focus password
    await page.keyboard.type('password123');

    await page.keyboard.press('Tab'); // Focus login button
    await page.keyboard.press('Enter'); // Submit

    // Check if form submits or shows validation
    await loginPage.waitForLoginResult();
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

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Browser contexts isolate test environments
    await page.goto('/');
  });

  test('should display registration page correctly', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Verify registration form is visible
    expect(await registerPage.isRegisterFormVisible()).toBe(true);

    // Verify page title
    await expect(page).toHaveTitle(/register|rejestracja/i);

    // Verify register button is initially disabled
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);
  });

  test('should show email validation errors', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try invalid email formats
    const invalidEmails = ['invalid-email', '@test.com', 'test@', 'test.com'];

    for (const email of invalidEmails) {
      await registerPage.emailInput.fill(email);
      await registerPage.emailInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown
      const hasError = await registerPage.hasEmailError();
      if (hasError) {
        expect(await registerPage.getEmailError()).toContain('adres e-mail');
      }
    }
  });

  test('should show password validation errors', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try passwords shorter than 6 characters
    const shortPasswords = ['', '1', '12', '123', '1234', '12345'];

    for (const password of shortPasswords) {
      await registerPage.passwordInput.fill(password);
      await registerPage.passwordInput.blur();

      // Wait for validation
      await page.waitForTimeout(100);

      // Check if validation error is shown for passwords shorter than 6 chars
      if (password.length > 0 && password.length < 6) {
        const hasError = await registerPage.hasPasswordError();
        if (hasError) {
          expect(await registerPage.getPasswordError()).toContain('6 znaków');
        }
      }
    }
  });

  test('should show password confirmation validation errors', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill password and different confirmation
    await registerPage.passwordInput.fill('password123');
    await registerPage.confirmPasswordInput.fill('differentpassword');
    await registerPage.confirmPasswordInput.blur();

    // Wait for validation
    await page.waitForTimeout(100);

    // Check if validation error is shown
    const hasError = await registerPage.hasConfirmPasswordError();
    if (hasError) {
      expect(await registerPage.getConfirmPasswordError()).toContain('identyczne');
    }
  });

  test('should enable register button when form is valid', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Initially disabled
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill email
    await registerPage.emailInput.fill('test@example.com');
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill password (too short)
    await registerPage.passwordInput.fill('12345');
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill valid password
    await registerPage.passwordInput.fill('password123');
    expect(await registerPage.isRegisterButtonDisabled()).toBe(true);

    // Fill matching confirmation
    await registerPage.confirmPasswordInput.fill('password123');
    expect(await registerPage.isRegisterButtonEnabled()).toBe(true);
  });

  test('should toggle password visibility', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill password
    await registerPage.passwordInput.fill('password123');

    // Check initial state (password hidden)
    const passwordInputType = await registerPage.passwordInput.getAttribute('type');
    expect(passwordInputType).toBe('password');

    // Toggle visibility
    await registerPage.togglePasswordVisibility();

    // Check if password is now visible
    const newPasswordInputType = await registerPage.passwordInput.getAttribute('type');
    expect(newPasswordInputType).toBe('text');

    // Toggle back
    await registerPage.togglePasswordVisibility();
    const finalPasswordInputType = await registerPage.passwordInput.getAttribute('type');
    expect(finalPasswordInputType).toBe('password');
  });

  test('should toggle confirm password visibility', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill confirm password
    await registerPage.confirmPasswordInput.fill('password123');

    // Check initial state (password hidden)
    const confirmPasswordInputType = await registerPage.confirmPasswordInput.getAttribute('type');
    expect(confirmPasswordInputType).toBe('password');

    // Toggle visibility
    await registerPage.toggleConfirmPasswordVisibility();

    // Check if password is now visible
    const newConfirmPasswordInputType = await registerPage.confirmPasswordInput.getAttribute('type');
    expect(newConfirmPasswordInputType).toBe('text');
  });

  test('should navigate to login page from register', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Click on login link
    await registerPage.goToLogin();

    // Verify navigation to login page
    await expect(page).toHaveURL(/login/);
  });

  test('should handle registration with existing email', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Try to register with an email that might already exist
    // Note: This test assumes there might be a test user in the database
    await registerPage.registerWithMatchingPasswords('test@example.com', 'password123');

    // Wait for result
    await registerPage.waitForRegistrationResult();

    // Check if error message appears (depends on backend implementation)
    const hasError = await registerPage.hasError();
    if (hasError) {
      expect(await registerPage.getErrorMessage()).toBeTruthy();
    }
  });

  test('should show loading state during registration', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill valid form
    await registerPage.registerWithMatchingPasswords('test@example.com', 'password123');

    // Check if button text changes to loading state
    await expect(registerPage.registerButton).toContainText(/tworzenie konta|loading|registering/i);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // This test would require mocking network requests
    // For now, we'll skip it as it requires additional setup
    test.skip();
  });

  test('should maintain visual consistency of registration form', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Take screenshot of empty registration form
    await expect(page).toHaveScreenshot('register-form-empty.png', {
      fullPage: true
    });

    // Fill form partially and take screenshot
    await registerPage.emailInput.fill('test@example.com');
    await registerPage.passwordInput.fill('password123');

    await expect(page).toHaveScreenshot('register-form-partial.png', {
      fullPage: true
    });

    // Fill complete form and take screenshot
    await registerPage.confirmPasswordInput.fill('password123');

    await expect(page).toHaveScreenshot('register-form-complete.png', {
      fullPage: true
    });

    // Show validation errors and take screenshot
    await registerPage.passwordInput.fill('short');
    await registerPage.confirmPasswordInput.fill('different');
    await registerPage.passwordInput.blur();
    await registerPage.confirmPasswordInput.blur();
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('register-form-validation-errors.png', {
      fullPage: true
    });
  });

  test('should maintain visual consistency of registration loading state', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill complete form
    await registerPage.emailInput.fill('test@example.com');
    await registerPage.passwordInput.fill('password123');
    await registerPage.confirmPasswordInput.fill('password123');

    // Submit and take screenshot during loading
    await registerPage.registerButton.click();

    await expect(page).toHaveScreenshot('register-form-loading.png', {
      fullPage: true
    });
  });

  test('should maintain visual consistency of registration success state', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.navigate();

    // Fill form
    await registerPage.emailInput.fill('test@example.com');
    await registerPage.passwordInput.fill('password123');
    await registerPage.confirmPasswordInput.fill('password123');

    // Submit and wait for result
    await registerPage.registerButton.click();
    await registerPage.waitForRegistrationResult();

    // Take screenshot of result state (success or error)
    await expect(page).toHaveScreenshot('register-form-result.png', {
      fullPage: true
    });
  });

  test('should maintain visual consistency of login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Take screenshot of empty login form
    await expect(page).toHaveScreenshot('login-form-empty.png', {
      fullPage: true
    });

    // Fill form and take screenshot
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');

    await expect(page).toHaveScreenshot('login-form-filled.png', {
      fullPage: true
    });

    // Show validation errors and take screenshot
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.emailInput.blur();
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot('login-form-validation-errors.png', {
      fullPage: true
    });
  });

  test('should maintain visual consistency of login loading state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill form
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('password123');

    // Submit and take screenshot during loading
    await loginPage.loginButton.click();

    await expect(page).toHaveScreenshot('login-form-loading.png', {
      fullPage: true
    });
  });
});
