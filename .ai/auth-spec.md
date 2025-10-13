# Specyfikacja Techniczna - Moduł Autentykacji Użytkowników

## Wprowadzenie
Niniejszy dokument opisuje architekturę i plan wdrożenia funkcjonalności autentykacji użytkowników (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) w aplikacji 10x-cards. Specyfikacja bazuje na wymaganiach z `PRD.md` (US-001, US-002), stosie technologicznym z `tech-stack.md` oraz istniejącej strukturze projektu. Celem jest integracja z Supabase Auth przy użyciu Astro i React, z zachowaniem renderowania po stronie serwera (`output: "server"`).

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA (FRONTEND)

### 1.1. Nowe Strony (Astro)

Wprowadzone zostaną następujące strony w katalogu `src/pages/`:

- **`src/pages/login.astro`**: Strona publiczna, zawierająca formularz logowania. Będzie renderować komponent React `LoginForm.tsx`. W przypadku, gdy użytkownik jest już zalogowany, strona przekieruje go do `/generate`.
- **`src/pages/register.astro`**: Strona publiczna, zawierająca formularz rejestracji. Będzie renderować komponent React `RegisterForm.tsx`. Po udanej rejestracji użytkownik zostanie automatycznie zalogowany i przekierowany do `/generate`.
- **`src/pages/password-reset.astro`**: Strona publiczna z formularzem do zainicjowania procesu odzyskiwania hasła (wprowadzenie adresu e-mail).
- **`src/pages/update-password.astro`**: Strona, na którą użytkownik zostanie przekierowany z linku w mailu od Supabase. Będzie zawierać formularz do ustawienia nowego hasła.

### 1.2. Nowe Komponenty (React)

W katalogu `src/components/` powstanie nowy podkatalog `auth/` zawierający interaktywne komponenty formularzy:

- **`src/components/auth/LoginForm.tsx`**:
    - Odpowiedzialność: Zarządzanie stanem formularza logowania (e-mail, hasło), walidacja po stronie klienta, obsługa interakcji z użytkownikiem (np. pokazywanie/ukrywanie hasła) oraz komunikacja z Supabase Auth SDK.
    - Logika: Po submisji formularza wywoła `supabase.auth.signInWithPassword()`. W przypadku sukcesu, nawigacja Astro (`Astro.redirect`) (zarządzana przez middleware) przekieruje użytkownika. W przypadku błędu, komponent wyświetli stosowny komunikat (np. "Nieprawidłowy e-mail lub hasło").
- **`src/components/auth/RegisterForm.tsx`**:
    - Odpowiedzialność: Zarządzanie stanem formularza rejestracji, walidacja (np. złożoność hasła, poprawność formatu e-mail), obsługa submisji.
    - Logika: Wywoła `supabase.auth.signUp()`. Po pomyślnej rejestracji, Supabase automatycznie zaloguje użytkownika (domyślna konfiguracja), a middleware Astro zajmie się przekierowaniem.
- **`src/components/auth/PasswordResetForm.tsx`**:
    - Odpowiedzialność: Formularz z jednym polem na e-mail.
    - Logika: Wywoła `supabase.auth.resetPasswordForEmail()`, podając adres URL strony `update-password.astro` jako docelowy. Wyświetli komunikat o wysłaniu instrukcji na podany adres.

### 1.3. Modyfikacje Istniejących Komponentów i Layoutów

- **`src/layouts/Layout.astro`**:
    - Zostanie zmodyfikowany, aby pobierać stan sesji użytkownika po stronie serwera. Informacja o zalogowanym użytkowniku (`session`) będzie dostępna w `Astro.locals` (dzięki middleware) i przekazywana jako `prop` do komponentu `AppShell.tsx` lub `Header.tsx`.
- **`src/components/AppShell.tsx` / `src/components/Header.tsx`**:
    - Komponent ten będzie warunkowo renderował przyciski w zależności od stanu zalogowania.
    - **Tryb non-auth**: Wyświetli przycisk "Zaloguj się", kierujący do `/login`.
    - **Tryb auth**: Wyświetli przycisk "Wyloguj się". Kliknięcie przycisku będzie realizowało żądanie (np. POST) do serwerowego endpointu `/api/auth/signout`, który wyczyści sesję po stronie serwera.

### 1.4. Walidacja i Obsługa Błędów

- **Walidacja Client-Side (w komponentach React)**: Natychmiastowa informacja zwrotna dla użytkownika dotycząca formatu danych (np. poprawność adresu e-mail, minimalna długość hasła). Można wykorzystać bibliotekę `zod` do definicji schematów walidacji, które będą współdzielone z backendem.
- **Komunikaty o błędach (Server-Side)**: Błędy zwracane przez Supabase API (np. "User already registered", "Invalid login credentials") będą przechwytywane w komponentach React i wyświetlane użytkownikowi w czytelnej formie pod odpowiednimi polami formularza.

---

## 2. LOGIKA BACKENDOWA (API I SERVER-SIDE)

Aplikacja działa w trybie `output: "server"`, co pozwala na pełne wykorzystanie logiki po stronie serwera, w tym middleware i endpointów API.

### 2.1. Middleware

Plik `src/middleware/index.ts` będzie centralnym punktem zarządzania sesją i autoryzacją.

- **Logika działania**:
    1. Middleware będzie uruchamiany dla każdego żądania.
    2. Utworzy serwerowego klienta Supabase przy użyciu ciasteczek z żądania.
    3. Pobierze sesję użytkownika (`supabase.auth.getSession()`).
    4. Zapisze obiekt sesji (lub `null`) w `Astro.locals.session`, udostępniając go wszystkim stronim i endpointom Astro.
    5. Zaimplementuje logikę ochrony tras:
        - Jeśli użytkownik próbuje uzyskać dostęp do `/generate` (lub innych chronionych stron) i `Astro.locals.session` jest `null`, nastąpi przekierowanie do `/login`.
        - Jeśli zalogowany użytkownik wejdzie na `/login` lub `/register`, zostanie przekierowany do `/generate`.

### 2.2. Endpointy API (w `src/pages/api/`)

Chociaż Supabase Auth SDK zarządza większością logiki, potrzebne będą dedykowane endpointy do obsługi cyklu życia sesji w kontekście SSR.

- **`src/pages/api/auth/callback.ts` (GET)**:
    - Ten endpoint jest wymagany przez Supabase do sfinalizowania procesu logowania po stronie serwera (np. po potwierdzeniu e-maila lub logowaniu przez OAuth, jeśli zostanie dodane w przyszłości).
    - Wymieni kod autoryzacyjny otrzymany w parametrach URL na sesję i zapisze ją w bezpiecznym ciasteczku `httpOnly`.
- **`src/pages/api/auth/signout.ts` (POST)**:
    - Bezpieczny endpoint do wylogowywania.
    - Wywoła `supabase.auth.signOut()` po stronie serwera, co unieważni token i wyczyści ciasteczko sesji.
    - Po pomyślnym wylogowaniu przekieruje użytkownika na stronę główną (`/`).

### 2.3. Modele Danych

Supabase Auth wewnętrznie zarządza tabelą `auth.users`. Nie ma potrzeby tworzenia dodatkowych modeli danych dla użytkowników w naszej bazie, chyba że chcemy przechowywać dodatkowe informacje w publicznej tabeli `profiles` powiązanej z `auth.users` przez `user_id`. Na potrzeby US-001 i US-002 nie jest to wymagane.

---

## 3. SYSTEM AUTENTYKACJI (SUPABASE AUTH)

Integracja z Supabase będzie opierać się na kliencie `@supabase/supabase-js`.

### 3.1. Konfiguracja Klienta Supabase

- **`src/db/supabase.client.ts`**: Ten plik będzie eksportował jedną, współdzieloną instancję klienta Supabase do użytku po stronie klienta (w komponentach React).
- **Klient serwerowy**: W `middleware/index.ts` oraz w endpointach API będzie tworzona oddzielna instancja klienta Supabase dla każdego żądania, z użyciem ciasteczek do uwierzytelnienia. Jest to kluczowe dla bezpieczeństwa i poprawnego działania w trybie SSR.

### 3.2. Procesy Autentykacji

- **Rejestracja**: Komponent `RegisterForm.tsx` wywoła `supabase.auth.signUp({ email, password })`. Domyślnie Supabase wyśle e-mail z linkiem potwierdzającym. Po kliknięciu linku, użytkownik zostanie przekierowany z powrotem do aplikacji, a sesja zostanie utworzona.
- **Logowanie**: Komponent `LoginForm.tsx` wywoła `supabase.auth.signInWithPassword({ email, password })`. SDK automatycznie zapisze sesję w ciasteczkach przeglądarki. Middleware po stronie serwera odczyta tę sesję przy kolejnym żądaniu.
- **Wylogowanie**: Przycisk w `Header.tsx` wyśle żądanie do endpointu `/api/auth/signout`, który bezpiecznie zakończy sesję na serwerze.
- **Odzyskiwanie hasła**:
    1. `PasswordResetForm.tsx` wywoła `supabase.auth.resetPasswordForEmail({ email, options: { redirectTo: '/update-password' } })`.
    2. Supabase wyśle e-mail z unikalnym linkiem.
    3. Użytkownik, po kliknięciu, trafi na stronę `/update-password.astro`, gdzie formularz pozwoli mu ustawić nowe hasło, wywołując `supabase.auth.updateUser({ password: newPassword })`.

Ta architektura w pełni wykorzystuje możliwości Astro w trybie SSR oraz React do części interaktywnych, integrując się z Supabase w bezpieczny i skalowalny sposób.
