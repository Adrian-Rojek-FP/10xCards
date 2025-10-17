import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Register Page
 * Implements the Page Object Pattern for maintainable tests
 */
export class RegisterPage extends BasePage {
  // Locators - use specific, resilient selectors
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  readonly showPasswordButton: Locator;
  readonly showConfirmPasswordButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.emailInput = page.getByLabel(/adres e-mail|email/i);
    this.passwordInput = page.getByLabel(/^hasło$/i);
    this.confirmPasswordInput = page.getByLabel(/potwierdź hasło|confirm password/i);
    this.registerButton = page.getByRole("button", { name: /zarejestruj|register|sign up/i });
    this.errorMessage = page.getByRole("alert");
    this.successMessage = page.locator('[role="status"]');
    this.loginLink = page.getByRole("link", { name: /zaloguj|login|sign in/i });
    this.emailError = page.locator("#email-error");
    this.passwordError = page.locator("#password-error");
    this.confirmPasswordError = page.locator("#confirm-password-error");
    this.showPasswordButton = page.locator('button[aria-label*="hasło"]').first();
    this.showConfirmPasswordButton = page.locator('button[aria-label*="hasło"]').last();
  }

  /**
   * Navigate to register page
   */
  async navigate(): Promise<void> {
    await this.goto("/register");
    await this.waitForPageLoad();
  }

  /**
   * Fill registration form and submit
   */
  async register(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }
    await this.registerButton.click();
  }

  /**
   * Fill registration form with matching passwords
   */
  async registerWithMatchingPasswords(email: string, password: string): Promise<void> {
    await this.register(email, password, password);
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    return await this.isVisible(this.successMessage);
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.waitForElement(this.errorMessage);
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    await this.waitForElement(this.successMessage);
    return (await this.successMessage.textContent()) || "";
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
   * Check if confirm password validation error is displayed
   */
  async hasConfirmPasswordError(): Promise<boolean> {
    return await this.isVisible(this.confirmPasswordError);
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
   * Get confirm password validation error text
   */
  async getConfirmPasswordError(): Promise<string> {
    await this.waitForElement(this.confirmPasswordError);
    return (await this.confirmPasswordError.textContent()) || "";
  }

  /**
   * Click on login link
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  /**
   * Toggle confirm password visibility
   */
  async toggleConfirmPasswordVisibility(): Promise<void> {
    await this.showConfirmPasswordButton.click();
  }

  /**
   * Check if register form is displayed
   */
  async isRegisterFormVisible(): Promise<boolean> {
    return (
      (await this.isVisible(this.emailInput)) &&
      (await this.isVisible(this.passwordInput)) &&
      (await this.isVisible(this.confirmPasswordInput)) &&
      (await this.isVisible(this.registerButton))
    );
  }

  /**
   * Check if register button is disabled
   */
  async isRegisterButtonDisabled(): Promise<boolean> {
    return await this.registerButton.isDisabled();
  }

  /**
   * Check if register button is enabled
   */
  async isRegisterButtonEnabled(): Promise<boolean> {
    return await this.registerButton.isEnabled();
  }

  /**
   * Wait for registration to complete (success or error)
   */
  async waitForRegistrationResult(): Promise<void> {
    await Promise.race([
      this.waitForElement(this.successMessage),
      this.waitForElement(this.errorMessage),
      this.page.waitForURL(/\/generate/, { timeout: 10000 }),
    ]);
  }
}
