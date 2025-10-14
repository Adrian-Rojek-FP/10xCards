import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Login Page
 * Implements the Page Object Pattern for maintainable tests
 */
export class LoginPage extends BasePage {
  // Locators - use specific, resilient selectors
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly passwordResetLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Initialize locators
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.loginButton = page.getByRole('button', { name: /sign in|login|zaloguj/i });
    this.errorMessage = page.getByRole('alert');
    this.registerLink = page.getByRole('link', { name: /sign up|register|zarejestruj/i });
    this.passwordResetLink = page.getByRole('link', { name: /forgot password|reset|zapomnia/i });
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill login form and submit
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Click on register link
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Click on password reset link
   */
  async goToPasswordReset(): Promise<void> {
    await this.passwordResetLink.click();
  }

  /**
   * Check if login form is displayed
   */
  async isLoginFormVisible(): Promise<boolean> {
    return (
      (await this.isVisible(this.emailInput)) &&
      (await this.isVisible(this.passwordInput)) &&
      (await this.isVisible(this.loginButton))
    );
  }
}

