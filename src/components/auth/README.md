# Moduł Autentykacji - Interfejs Użytkownika

Moduł zawiera komponenty React i strony Astro dla procesu autentykacji użytkowników.

## Struktura

### Komponenty React (`src/components/auth/`)

- **`LoginForm.tsx`** - Formularz logowania z walidacją e-mail i hasła
- **`RegisterForm.tsx`** - Formularz rejestracji z potwierdzeniem hasła
- **`PasswordResetForm.tsx`** - Formularz żądania linku resetującego hasło
- **`UpdatePasswordForm.tsx`** - Formularz ustawiania nowego hasła

### Strony Astro (`src/pages/`)

- **`login.astro`** - Strona logowania
- **`register.astro`** - Strona rejestracji
- **`password-reset.astro`** - Strona resetowania hasła
- **`update-password.astro`** - Strona zmiany hasła (po kliknięciu linku z e-maila)

### Walidacja (`src/lib/validation/auth.validation.ts`)

Wspólne schematy walidacji wykorzystujące Zod:
- `loginSchema` - walidacja logowania
- `registerSchema` - walidacja rejestracji z weryfikacją zgodności haseł
- `passwordResetSchema` - walidacja żądania resetu hasła
- `updatePasswordSchema` - walidacja zmiany hasła

## Funkcjonalności

### Wspólne dla wszystkich formularzy:
- ✅ Walidacja client-side w czasie rzeczywistym
- ✅ Komunikaty o błędach pod polami formularzy
- ✅ Wsparcie dla trybu ciemnego (dark mode)
- ✅ Responsywny design (mobile-first)
- ✅ Atrybuty ARIA dla accessibility
- ✅ Loading states podczas submisji
- ✅ Disabled states dla inputów podczas ładowania

### LoginForm
- Pole e-mail z walidacją formatu
- Pole hasła z możliwością pokazania/ukrycia
- Link do resetowania hasła
- Link do rejestracji
- Minimalna długość hasła: 6 znaków

### RegisterForm
- Walidacja formatu e-mail
- Walidacja siły hasła (min. 6 znaków)
- Potwierdzenie hasła z weryfikacją zgodności
- Pokazywanie/ukrywanie obu pól hasła
- Komunikat sukcesu po rejestracji
- Link do logowania

### PasswordResetForm
- Pojedyncze pole e-mail
- Komunikat sukcesu po wysłaniu żądania
- Link powrotny do logowania

### UpdatePasswordForm
- Nowe hasło z walidacją
- Potwierdzenie nowego hasła
- Pokazywanie/ukrywanie pól
- Automatyczne przekierowanie do logowania po sukcesie

## Stylowanie

Komponenty używają:
- **Tailwind CSS 4** - utility classes
- **Shadcn/ui Button** - komponent przycisku
- **cn utility** - łączenie klas CSS
- Spójne z istniejącymi komponentami (`FlashcardListItem`, `FlashcardList`)

## Ikony

SVG ikony inline dla:
- Pokazywanie/ukrywanie hasła (eye/eye-off)
- Błędy (exclamation triangle)
- Sukcesy (check circle)
- Loading spinner

## Następne kroki (implementacja backend)

Komponenty są przygotowane do integracji z Supabase Auth:
1. Implementacja wywołań `supabase.auth.signInWithPassword()`
2. Implementacja wywołań `supabase.auth.signUp()`
3. Implementacja wywołań `supabase.auth.resetPasswordForEmail()`
4. Implementacja wywołań `supabase.auth.updateUser()`
5. Obsługa błędów zwracanych przez Supabase
6. Middleware do ochrony tras
7. Endpointy API (`/api/auth/callback`, `/api/auth/signout`)

