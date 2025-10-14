# Testing Guide

This project uses **Vitest** for unit tests and **Playwright** for E2E tests.

## 📦 Test Structure

```
tests/
├── setup/              # Test setup files
│   └── vitest.setup.ts # Vitest global setup and mocks
├── unit/               # Unit tests
│   └── *.test.tsx      # Component and function tests
└── e2e/                # End-to-End tests
    ├── pages/          # Page Object Models
    │   ├── BasePage.ts
    │   ├── LoginPage.ts
    │   └── HomePage.ts
    └── *.spec.ts       # E2E test files
```

## 🧪 Unit Tests (Vitest)

### Running Unit Tests

```bash
# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

Unit tests are located in `tests/unit/` directory. Use the `.test.ts` or `.test.tsx` extension.

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
});
```

### Best Practices

- Use `describe` blocks to group related tests
- Use explicit assertion messages
- Follow the Arrange-Act-Assert pattern
- Leverage `vi.mock()` for mocking dependencies
- Use `@testing-library` utilities for realistic user interactions
- Enable TypeScript strict typing in tests

## 🎭 E2E Tests (Playwright)

### Running E2E Tests

```bash
# Run E2E tests (will start dev server automatically)
npm run test:e2e

# Run with UI mode for debugging
npm run test:e2e:ui

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Generate tests using codegen tool
npm run test:e2e:codegen
```

### Writing E2E Tests

E2E tests are located in `tests/e2e/` directory. Use the `.spec.ts` extension.

#### Page Object Model Pattern

We use the Page Object Model for maintainable tests. Create page objects in `tests/e2e/pages/`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    this.loginButton = page.getByRole('button', { name: /sign in/i });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    // ... more actions
  }
}
```

#### Using Page Objects in Tests

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('user@example.com', 'password');
    
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

### Best Practices

- Use Page Object Model for maintainability
- Use resilient locators (getByRole, getByLabel, getByText)
- Isolate tests with browser contexts
- Use proper setup/teardown with hooks
- Leverage trace viewer for debugging failures
- Implement visual regression testing with screenshots when needed
- Use the codegen tool for recording tests

## 🔧 Configuration

### Vitest Configuration

Configuration is in `vitest.config.ts`:
- Uses `jsdom` environment for DOM testing
- Global test utilities enabled
- Coverage configured (v8 provider)
- TypeScript path aliases supported

### Playwright Configuration

Configuration is in `playwright.config.ts`:
- Only Chromium browser configured (as per guidelines)
- Automatic dev server startup
- Trace collection on first retry
- Screenshots on failure
- HTML and list reporters enabled

## 📊 Coverage

To generate coverage report:

```bash
npm run test:coverage
```

Coverage reports will be generated in `coverage/` directory. View the HTML report by opening `coverage/index.html`.

**Note:** Focus on meaningful tests rather than arbitrary coverage percentages.

## 🎯 CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example for GitHub Actions
- name: Run Unit Tests
  run: npm run test:run

- name: Run E2E Tests
  run: npm run test:e2e
```

## 🐛 Debugging

### Debugging Unit Tests

1. Use `test.only()` to focus on specific tests
2. Use `console.log()` or `screen.debug()` to inspect rendered output
3. Use VS Code debugger with Vitest extension
4. Run tests with UI: `npm run test:ui`

### Debugging E2E Tests

1. Use debug mode: `npm run test:e2e:debug`
2. Use UI mode: `npm run test:e2e:ui`
3. Use headed mode to see the browser: `npm run test:e2e:headed`
4. View trace files from `playwright-report/` directory
5. Use `await page.pause()` to pause test execution

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

