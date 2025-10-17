import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

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
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly showPasswordButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.emailInput = page.getByLabel(/adres e-mail|email/i);
    this.passwordInput = page.getByLabel(/hasło|password/i);
    this.loginButton = page.getByRole("button", { name: /sign in|login|zaloguj/i });
    this.errorMessage = page.getByRole("alert");
    this.registerLink = page.getByRole("link", { name: /sign up|register|zarejestruj/i });
    this.passwordResetLink = page.getByRole("link", { name: /forgot password|reset|zapomnia/i });
    this.emailError = page.locator("#email-error");
    this.passwordError = page.locator("#password-error");
    this.showPasswordButton = page.locator('button[aria-label*="hasło"]').first();
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
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
    return (await this.errorMessage.textContent()) || "";
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

  /**
   * Check if email validation error is displayed
   */
  async hasEmailError(): Promise<boolean> {
    return await this.isVisible(this.emailError);
  }

  /**
   * Check if password validation error is displayed
   */
  async hasPasswordError(): Promise<boolean> {
    return await this.isVisible(this.passwordError);
  }

  /**
   * Get email validation error text
   */
  async getEmailError(): Promise<string> {
    await this.waitForElement(this.emailError);
    return (await this.emailError.textContent()) || "";
  }

  /**
   * Get password validation error text
   */
  async getPasswordError(): Promise<string> {
    await this.waitForElement(this.passwordError);
    return (await this.passwordError.textContent()) || "";
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  /**
   * Check if login button is disabled
   */
  async isLoginButtonDisabled(): Promise<boolean> {
    return await this.loginButton.isDisabled();
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  /**
   * Wait for login to complete (success or error)
   */
  async waitForLoginResult(): Promise<void> {
    await Promise.race([
      this.waitForElement(this.errorMessage),
      this.page.waitForURL(/\/generate/, { timeout: 10000 }),
    ]);
  }
}
