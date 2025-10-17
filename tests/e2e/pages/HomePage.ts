import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Home Page
 */
export class HomePage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly loginLink: Locator;
  readonly registerLink: Locator;
  readonly generateLink: Locator;

  constructor(page: Page) {
    super(page);

    this.welcomeHeading = page.getByRole("heading", { level: 1 });
    this.loginLink = page.getByRole("link", { name: /login|sign in|zaloguj/i });
    this.registerLink = page.getByRole("link", { name: /register|sign up|zarejestruj/i });
    this.generateLink = page.getByRole("link", { name: /generate|generuj/i });
  }

  /**
   * Navigate to home page
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Check if user is on the home page
   */
  async isOnHomePage(): Promise<boolean> {
    const url = this.page.url();
    return url.endsWith("/") || url.endsWith("/index");
  }

  /**
   * Navigate to login page
   */
  async goToLogin(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Navigate to register page
   */
  async goToRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Navigate to generate page
   */
  async goToGenerate(): Promise<void> {
    await this.generateLink.click();
  }
}
