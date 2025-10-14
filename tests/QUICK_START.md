# Quick Start - Testing Guide

Szybki start do rozpoczęcia pracy z testami w projekcie 10xCards.

## 🚀 Pierwsze Kroki

### 1. Upewnij się, że wszystko jest zainstalowane

```bash
npm install
```

### 2. Uruchom przykładowe testy

**Testy jednostkowe:**
```bash
npm run test:run
```

**Testy E2E:**
```bash
# Najpierw uruchom dev server w jednym terminalu
npm run dev

# Następnie w drugim terminalu uruchom testy E2E
npm run test:e2e
```

## 📝 Tworzenie Pierwszego Testu Jednostkowego

### Krok 1: Utwórz plik testu

Utwórz plik `tests/unit/myComponent.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Krok 2: Uruchom test

```bash
npm run test
```

## 🎭 Tworzenie Pierwszego Testu E2E

### Krok 1: Utwórz Page Object (opcjonalnie)

Dla złożonych interakcji, utwórz Page Object w `tests/e2e/pages/MyPage.ts`:

```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  readonly myButton: Locator;

  constructor(page: Page) {
    super(page);
    this.myButton = page.getByRole('button', { name: /click me/i });
  }

  async clickButton(): Promise<void> {
    await this.myButton.click();
  }
}
```

### Krok 2: Utwórz test

Utwórz plik `tests/e2e/myFeature.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from './pages/MyPage';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.goto('/my-page');
    await myPage.clickButton();
    
    await expect(page).toHaveURL(/success/);
  });
});
```

### Krok 3: Uruchom test

```bash
npm run test:e2e
```

## 🎯 Użyteczne Komendy

### Development Workflow

```bash
# Watch mode dla testów jednostkowych (automatyczne uruchamianie przy zmianach)
npm run test:watch

# UI mode dla testów jednostkowych (graficzny interfejs)
npm run test:ui

# Debug mode dla testów E2E (krokowe przechodzenie)
npm run test:e2e:debug

# UI mode dla testów E2E (graficzny interfejs)
npm run test:e2e:ui
```

### Narzędzia

```bash
# Generuj testy E2E automatycznie (codegen)
npm run test:e2e:codegen

# Uruchom testy E2E z widoczną przeglądarką
npm run test:e2e:headed

# Wygeneruj pokrycie kodu
npm run test:coverage
```

## 🔍 Najczęstsze Przypadki Użycia

### Test Komponentu z Props

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with custom text', () => {
    render(<Button>Custom Text</Button>);
    expect(screen.getByText('Custom Text')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test Funkcji z Mockami

```typescript
import { describe, it, expect, vi } from 'vitest';
import { fetchData } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  fetchData: vi.fn(),
}));

describe('fetchData', () => {
  it('returns data successfully', async () => {
    vi.mocked(fetchData).mockResolvedValue({ data: 'test' });
    
    const result = await fetchData('/endpoint');
    expect(result).toEqual({ data: 'test' });
  });
});
```

### Test E2E z Formularzem

```typescript
import { test, expect } from '@playwright/test';

test('submit login form', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByLabel(/email/i).fill('test@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

### Test E2E z API Testing

```typescript
import { test, expect } from '@playwright/test';

test('verify API response', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data).toHaveProperty('users');
});
```

## 🐛 Debugowanie

### Vitest

```bash
# 1. Dodaj breakpoint w kodzie używając debugger;
# 2. Uruchom test:
npm run test:ui

# lub użyj VS Code debugger z konfiguracją
```

### Playwright

```bash
# 1. Użyj debug mode
npm run test:e2e:debug

# 2. Lub dodaj pause w teście:
await page.pause();

# 3. Lub użyj headed mode aby zobaczyć przeglądarkę
npm run test:e2e:headed
```

## 📊 Sprawdzanie Rezultatów

### Vitest
- Wyniki w konsoli
- HTML raport w `coverage/index.html` (po uruchomieniu z coverage)
- UI mode pod adresem wyświetlonym w konsoli

### Playwright
- Wyniki w konsoli
- HTML raport w `playwright-report/index.html`
- Trace viewer dla nieudanych testów

## ⚠️ Najczęstsze Problemy

### Problem: Testy nie znajdują elementów

**Rozwiązanie:** Użyj resilient locators:
```typescript
// ❌ Unikaj
page.locator('#id')
page.locator('.class')

// ✅ Używaj
page.getByRole('button', { name: /submit/i })
page.getByLabel(/email/i)
page.getByText(/welcome/i)
```

### Problem: Testy są niestabilne (flaky)

**Rozwiązanie:** Dodaj właściwe oczekiwanie:
```typescript
// ❌ Unikaj hardcoded timeouts
await page.waitForTimeout(1000);

// ✅ Używaj właściwych waitów
await page.waitForLoadState('networkidle');
await expect(page.getByText('Loaded')).toBeVisible();
```

### Problem: Mock nie działa

**Rozwiązanie:** Upewnij się że mock jest zdefiniowany przed importem:
```typescript
// ✅ Mock na początku pliku
vi.mock('@/lib/api');

import { fetchData } from '@/lib/api';
// ... testy
```

## 📚 Dodatkowe Zasoby

- [tests/README.md](./README.md) - Pełna dokumentacja
- [TESTING_SETUP.md](../TESTING_SETUP.md) - Informacje o setupie
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Docs](https://testing-library.com/)

---

**Powodzenia z testowaniem! 🚀**

