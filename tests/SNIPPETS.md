# Testing Snippets & Templates

Gotowe do użycia snippety i szablony dla testów.

## 🧪 Vitest - Testy Jednostkowe

### Podstawowy Test Komponentu React

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Test z User Interaction

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Interaction', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    await user.click(screen.getByRole('button', { name: /click me/i }));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test z Props

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/Card';

describe('Card with Props', () => {
  it('displays correct title', () => {
    render(<Card title="Test Title" description="Test Description" />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### Test Async Function

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from '@/lib/api';

describe('Async Function', () => {
  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    // Mock implementation
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);
    
    const result = await fetchData('/api/test');
    
    expect(result).toEqual(mockData);
  });

  it('handles fetch errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    
    await expect(fetchData('/api/test')).rejects.toThrow('Network error');
  });
});
```

### Mock Module

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock at the top of the file
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [{ id: 1, name: 'Test' }],
        error: null,
      })),
    })),
  },
}));

import { supabase } from '@/lib/supabase';

describe('Supabase Mock', () => {
  it('fetches data from supabase', async () => {
    const { data, error } = await supabase.from('table').select();
    
    expect(data).toHaveLength(1);
    expect(error).toBeNull();
  });
});
```

### Test with Context/Provider

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ComponentWithTheme } from '@/components/ComponentWithTheme';

describe('Component with Provider', () => {
  it('renders with theme context', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ComponentWithTheme />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('themed-component')).toBeInTheDocument();
  });
});
```

### Snapshot Test

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from '@/components/Card';

describe('Card Snapshot', () => {
  it('matches snapshot', () => {
    const { container } = render(<Card title="Test" />);
    expect(container.firstChild).toMatchInlineSnapshot(`
      <div class="card">
        <h2>Test</h2>
      </div>
    `);
  });
});
```

## 🎭 Playwright - Testy E2E

### Podstawowy Page Object

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly heading: Locator;
  readonly submitButton: Locator;
  readonly inputField: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.submitButton = page.getByRole('button', { name: /submit/i });
    this.inputField = page.getByLabel(/input/i);
  }

  async navigate(): Promise<void> {
    await this.goto('/my-page');
    await this.waitForPageLoad();
  }

  async fillAndSubmit(value: string): Promise<void> {
    await this.inputField.fill(value);
    await this.submitButton.click();
  }
}
```

### Podstawowy Test E2E

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/MyPage';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.navigate();
    
    await myPage.fillAndSubmit('test value');
    
    await expect(page).toHaveURL(/success/);
  });
});
```

### Test z Hooks

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature with Hooks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup code
  });

  test.afterEach(async ({ page }) => {
    // Cleanup code
  });

  test('test case 1', async ({ page }) => {
    // Test implementation
  });

  test('test case 2', async ({ page }) => {
    // Test implementation
  });
});
```

### Test z Authentication

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authenticated Tests', () => {
  test.use({
    storageState: 'playwright/.auth/user.json', // Pre-saved auth state
  });

  test('access protected page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });
});
```

### API Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('GET request', async ({ request }) => {
    const response = await request.get('/api/flashcards');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('flashcards');
  });

  test('POST request', async ({ request }) => {
    const response = await request.post('/api/flashcards', {
      data: {
        question: 'Test Question',
        answer: 'Test Answer',
      },
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('id');
  });
});
```

### Visual Regression Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual Tests', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('element screenshot', async ({ page }) => {
    await page.goto('/');
    const element = page.getByTestId('hero-section');
    
    await expect(element).toHaveScreenshot('hero.png');
  });
});
```

### Test z Multiple Contexts

```typescript
import { test, expect } from '@playwright/test';

test('multi-user scenario', async ({ browser }) => {
  // Create two separate contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  // User 1 actions
  await page1.goto('/');
  await page1.getByRole('button', { name: /user 1/i }).click();
  
  // User 2 actions
  await page2.goto('/');
  await page2.getByRole('button', { name: /user 2/i }).click();
  
  // Verify both users
  await expect(page1.getByText(/user 1 logged in/i)).toBeVisible();
  await expect(page2.getByText(/user 2 logged in/i)).toBeVisible();
  
  // Cleanup
  await context1.close();
  await context2.close();
});
```

### Test z File Upload

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test('file upload', async ({ page }) => {
  await page.goto('/upload');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(__dirname, 'test-file.txt'));
  
  await page.getByRole('button', { name: /upload/i }).click();
  
  await expect(page.getByText(/upload successful/i)).toBeVisible();
});
```

### Test z Retry Logic

```typescript
import { test, expect } from '@playwright/test';

test('test with retry', async ({ page }) => {
  test.setTimeout(30000); // 30 seconds timeout
  
  await page.goto('/');
  
  // Wait for element with retry
  await expect(async () => {
    const element = page.getByText(/loading/i);
    await expect(element).not.toBeVisible();
  }).toPass({
    intervals: [1000, 2000, 5000],
    timeout: 30000,
  });
});
```

## 🎯 Custom Matchers & Utilities

### Custom Vitest Matcher

```typescript
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass: isValid,
      message: () => `expected ${received} to be a valid email`,
    };
  },
});

// Usage
expect('test@example.com').toBeValidEmail();
```

### Test Helper Function

```typescript
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  );
}

// Usage
renderWithProviders(<MyComponent />);
```

### Playwright Helper

```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login/i }).click();
  await page.waitForURL(/dashboard/);
}

// Usage
await login(page, 'test@example.com', 'password123');
```

## 🔍 Debugging Snippets

### Debug Vitest Test

```typescript
import { describe, it } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Debug Test', () => {
  it('debug output', () => {
    render(<MyComponent />);
    
    // Print DOM tree
    screen.debug();
    
    // Print specific element
    screen.debug(screen.getByRole('button'));
    
    // Print current queries
    console.log(screen.logTestingPlaygroundURL());
  });
});
```

### Debug Playwright Test

```typescript
import { test } from '@playwright/test';

test('debug test', async ({ page }) => {
  await page.goto('/');
  
  // Pause execution
  await page.pause();
  
  // Take screenshot
  await page.screenshot({ path: 'debug.png' });
  
  // Console log
  page.on('console', msg => console.log(msg.text()));
  
  // Print locator info
  const button = page.getByRole('button');
  console.log(await button.textContent());
});
```

---

**Użyj tych snippetów jako punktu wyjścia dla swoich testów!** 🎯

