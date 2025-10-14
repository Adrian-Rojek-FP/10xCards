# Testing Environment Setup

Środowisko testowe zostało pomyślnie skonfigurowane dla projektu 10xCards.

## 🎯 Zainstalowane Narzędzia

### Vitest (Testy Jednostkowe)
- `vitest` - framework do testów jednostkowych
- `@vitest/ui` - interfejs graficzny do przeglądania testów
- `jsdom` - środowisko DOM dla testów
- `@testing-library/react` - narzędzia do testowania komponentów React
- `@testing-library/user-event` - symulacja interakcji użytkownika
- `@testing-library/dom` - narzędzia do zapytań DOM
- `@testing-library/jest-dom` - dodatkowe matchery dla asercji
- `happy-dom` - alternatywne środowisko DOM
- `@vitejs/plugin-react` - plugin Vite dla React

### Playwright (Testy E2E)
- `@playwright/test` - framework do testów E2E
- `playwright` - biblioteka do automatyzacji przeglądarki
- Przeglądarka: **Chromium** (zgodnie z wytycznymi)

## 📁 Struktura Katalogów

```
10xCards/
├── tests/
│   ├── setup/
│   │   └── vitest.setup.ts          # Globalna konfiguracja Vitest
│   ├── unit/
│   │   └── example.test.tsx         # Przykładowy test jednostkowy
│   ├── e2e/
│   │   ├── pages/
│   │   │   ├── BasePage.ts         # Bazowa klasa Page Object
│   │   │   ├── LoginPage.ts        # Page Object dla strony logowania
│   │   │   └── HomePage.ts         # Page Object dla strony głównej
│   │   ├── auth.spec.ts            # Testy E2E autentykacji
│   │   └── example.spec.ts         # Przykładowy test E2E
│   └── README.md                    # Dokumentacja testów
├── vitest.config.ts                 # Konfiguracja Vitest
├── playwright.config.ts             # Konfiguracja Playwright
└── tsconfig.json                    # Zaktualizowany dla testów
```

## ⚙️ Konfiguracja

### Vitest (`vitest.config.ts`)

```typescript
- Environment: jsdom (dla testów React)
- Globals: włączone (describe, it, expect bez importu)
- Setup Files: tests/setup/vitest.setup.ts
- Coverage: V8 provider (domyślnie wyłączone)
- Path Aliases: @/* -> ./src/*
```

### Playwright (`playwright.config.ts`)

```typescript
- Browser: Tylko Chromium (zgodnie z wytycznymi)
- Test Directory: tests/e2e/
- Base URL: http://localhost:4321
- Parallel Tests: włączone
- Trace: przy pierwszym ponownym uruchomieniu
- Screenshots: tylko przy błędach
- Dev Server: automatyczne uruchamianie
```

### Setup File (`tests/setup/vitest.setup.ts`)

Konfiguruje:
- Automatyczne czyszczenie po testach
- Reset mocków przed każdym testem
- Mock `window.matchMedia`
- Mock `IntersectionObserver`
- Mock `ResizeObserver`

## 🚀 Dostępne Komendy

### Testy Jednostkowe (Vitest)

```bash
npm run test              # Uruchom w trybie watch
npm run test:ui           # Uruchom z interfejsem graficznym
npm run test:run          # Uruchom jednokrotnie
npm run test:watch        # Uruchom w trybie watch (explicit)
npm run test:coverage     # Uruchom z pokryciem kodu
```

### Testy E2E (Playwright)

```bash
npm run test:e2e          # Uruchom testy E2E
npm run test:e2e:ui       # Uruchom z interfejsem graficznym
npm run test:e2e:headed   # Uruchom z widoczną przeglądarką
npm run test:e2e:debug    # Uruchom w trybie debugowania
npm run test:e2e:codegen  # Generuj testy (codegen tool)
```

## 📝 Przykłady Użycia

### Test Jednostkowy

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test E2E z Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@test.com', 'password');
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🎓 Najlepsze Praktyki

### Vitest
✅ Używaj `vi.mock()` dla factory patterns  
✅ Wykorzystuj `vi.spyOn()` do monitorowania funkcji  
✅ Twórz setup files dla konfiguracji wielokrotnego użytku  
✅ Używaj inline snapshots dla czytelności  
✅ Uruchamiaj watch mode podczas developmentu  
✅ Konfiguruj jsdom dla testów komponentów  
✅ Włączaj TypeScript type checking w testach  

### Playwright
✅ Używaj tylko Chromium (zgodnie z wytycznymi)  
✅ Implementuj Page Object Model  
✅ Używaj resilient locators (getByRole, getByLabel)  
✅ Izoluj testy z browser contexts  
✅ Wykorzystuj API testing dla walidacji backendu  
✅ Implementuj visual comparison z screenshots  
✅ Używaj codegen do nagrywania testów  
✅ Wykorzystuj trace viewer do debugowania  
✅ Używaj hooków dla setup/teardown  
✅ Wykorzystuj parallel execution  

## 🔄 Integracja z CI/CD

Testy są gotowe do integracji z GitHub Actions:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install chromium

- name: Run unit tests
  run: npm run test:run

- name: Run E2E tests
  run: npm run test:e2e
```

## 📊 Pokrycie Kodu

Aby wygenerować raport pokrycia:

```bash
npm run test:coverage
```

Raport HTML będzie dostępny w `coverage/index.html`.

**Uwaga:** Skup się na znaczących testach zamiast na arbitralnych procentach pokrycia.

## 🔍 Debugowanie

### Vitest
- Użyj `test.only()` dla fokusowania na konkretnych testach
- Użyj `screen.debug()` do inspekcji renderowanego output
- Uruchom UI mode: `npm run test:ui`

### Playwright
- Debug mode: `npm run test:e2e:debug`
- UI mode: `npm run test:e2e:ui`
- Headed mode: `npm run test:e2e:headed`
- Dodaj `await page.pause()` w teście

## ✅ Status

- ✅ Vitest zainstalowany i skonfigurowany
- ✅ Playwright zainstalowany i skonfigurowany
- ✅ Chromium zainstalowany
- ✅ Setup files utworzone
- ✅ Page Object Model zaimplementowany
- ✅ Przykładowe testy utworzone
- ✅ Skrypty npm dodane
- ✅ TypeScript skonfigurowany
- ✅ Dokumentacja utworzona

## 📚 Zasoby

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Page Object Model](https://playwright.dev/docs/pom)

---

**Gotowe do użycia!** 🎉

Możesz teraz rozpocząć pisanie testów dla swojej aplikacji.

