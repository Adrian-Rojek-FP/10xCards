# Plan Testów – 10xCards

## 1. Wprowadzenie i Cele Testowania

### 1.1 Cel dokumentu
Niniejszy dokument określa strategię, zakres oraz procedury testowania aplikacji webowej **10xCards** – platformy do szybkiego tworzenia fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji oraz algorytmu spaced repetition.

### 1.2 Cele testowania
Główne cele procesu testowania obejmują:

1. **Weryfikację poprawności działania kluczowych funkcjonalności**:
   - Autentykacja użytkowników (rejestracja, logowanie, wylogowanie, reset hasła)
   - Generowanie fiszek przy użyciu AI
   - Ręczne tworzenie i zarządzanie fiszkami
   - System nauki ze spaced repetition

2. **Walidację integracji z usługami zewnętrznymi**:
   - Supabase (baza danych PostgreSQL, autentykacja)
   - OpenRouter AI (generowanie treści przez modele LLM)

3. **Zapewnienie bezpieczeństwa i prywatności danych**:
   - Autoryzacja dostępu do zasobów użytkowników
   - Bezpieczne przechowywanie i przetwarzanie danych osobowych zgodnie z RODO
   - Ochrona przed nieautoryzowanym dostępem

4. **Ocenę wydajności i skalowalności**:
   - Czas odpowiedzi API
   - Wydajność generowania fiszek przez AI
   - Obsługa wielu równoczesnych żądań

5. **Sprawdzenie użyteczności interfejsu użytkownika**:
   - Responsywność aplikacji na różnych urządzeniach
   - Intuicyjność nawigacji i procesów
   - Dostępność (WCAG 2.1)

---

## 2. Zakres Testów

### 2.1 Funkcjonalności objęte testami

#### 2.1.1 Moduł Autentykacji
- Rejestracja nowego użytkownika (US-001)
- Logowanie do aplikacji (US-002)
- Wylogowanie z aplikacji
- Odzyskiwanie hasła
- Aktualizacja hasła
- Walidacja danych logowania
- Zarządzanie sesjami użytkowników

#### 2.1.2 Moduł Generowania Fiszek AI (US-003, US-004)
- Wprowadzanie tekstu źródłowego (1000-10000 znaków)
- Generowanie propozycji fiszek przez AI
- Walidacja długości tekstu wejściowego
- Obsługa błędów AI service
- Wyświetlanie wygenerowanych propozycji
- Akceptacja, edycja i odrzucanie propozycji

#### 2.1.3 Moduł Zarządzania Fiszkami (US-005, US-006, US-007)
- Zapisywanie fiszek (masowe i pojedyncze)
- Ręczne tworzenie fiszek
- Edycja istniejących fiszek
- Usuwanie fiszek
- Wyświetlanie listy fiszek użytkownika
- Walidacja danych fiszek (maksymalna długość)

#### 2.1.4 Moduł Sesji Nauki (US-008)
- Algorytm spaced repetition (Leitner 5-box)
- Wyświetlanie fiszek w sesji nauki
- Ocena poziomu przyswojenia fiszki
- Nawigacja między fiszkami
- Śledzenie postępów w nauce

#### 2.1.5 Bezpieczeństwo i Autoryzacja (US-009)
- Dostęp tylko do własnych zasobów
- Walidacja tokenów sesji
- Ochrona endpointów API
- Middleware autoryzacyjny

### 2.2 Funkcjonalności poza zakresem testów MVP
- Zaawansowane algorytmy spaced repetition
- Import z plików (PDF, DOCX)
- Współdzielenie fiszek między użytkownikami
- Aplikacje mobilne natywne
- Logowanie przez OAuth (Google, GitHub)
- Rozbudowane statystyki i analytics
- Wyszukiwanie fiszek po słowach kluczowych

---

## 3. Typy Testów do Przeprowadzenia

### 3.1 Testy Jednostkowe (Unit Tests)
**Cel**: Weryfikacja poprawności działania pojedynczych funkcji i modułów w izolacji.

**Zakres**:
- Funkcje walidacji (`src/lib/validation/`)
- Schematy Zod (walidacja API)
- Funkcje pomocnicze (`src/lib/utils.ts`)
- Logika biznesowa w serwisach:
  - `flashcard.service.ts`
  - `generation.service.ts`
  - `openrouter.service.ts`

**Narzędzia**: Vitest, React Testing Library

**Przykładowe przypadki testowe**:
- Walidacja formatu email
- Walidacja złożoności hasła
- Poprawność schematów Zod dla API
- Obliczanie hash'a SHA-256 tekstu źródłowego
- Mapowanie danych z bazy na DTO

### 3.2 Testy Integracyjne (Integration Tests)
**Cel**: Weryfikacja poprawności współdziałania między modułami i zewnętrznymi usługami.

**Zakres**:
- Endpointy API (`src/pages/api/`):
  - `/api/auth/login`
  - `/api/auth/logout`
  - `/api/auth/register`
  - `/api/flashcards` (GET, POST, PUT, DELETE)
  - `/api/generations` (POST)
- Integracja z Supabase:
  - Operacje na bazie danych
  - Autentykacja użytkowników
- Integracja z OpenRouter AI:
  - Generowanie fiszek
  - Obsługa odpowiedzi i błędów
- Middleware autoryzacyjny (`src/middleware/index.ts`)

**Narzędzia**: Vitest, Supertest, testowa instancja Supabase

**Przykładowe przypadki testowe**:
- Utworzenie użytkownika i weryfikacja zapisania w bazie
- Logowanie i zwrócenie poprawnego tokenu sesji
- Tworzenie fiszek z poprawnym `generation_id`
- Odrzucenie żądania API bez autoryzacji
- Weryfikacja struktury odpowiedzi JSON z OpenRouter

### 3.3 Testy End-to-End (E2E Tests)
**Cel**: Weryfikacja pełnych przepływów użytkownika w środowisku zbliżonym do produkcyjnego.

**Zakres**:
- Rejestracja → logowanie → generowanie fiszek → zapisanie → wylogowanie
- Ręczne tworzenie fiszek → edycja → usunięcie
- Proces odzyskiwania hasła
- Sesja nauki ze spaced repetition
- Responsywność UI na różnych rozdzielczościach
- Dostępność (WCAG 2.1)

**Narzędzia**: Playwright, Cypress

**Przykładowe przypadki testowe**:
- Nowy użytkownik rejestruje się, wkleja tekst, generuje fiszki AI, akceptuje je i zapisuje
- Zalogowany użytkownik tworzy ręcznie 5 fiszek i rozpoczyna sesję nauki
- Użytkownik zapomina hasła, resetuje je przez email i loguje się nowym hasłem
- Aplikacja działa poprawnie na urządzeniach mobilnych (viewport 375px)
- Nawigacja za pomocą klawiatury działa we wszystkich formularzach

### 3.4 Testy Wydajnościowe (Performance Tests)
**Cel**: Ocena wydajności aplikacji pod obciążeniem oraz czasu odpowiedzi.

**Zakres**:
- Czas odpowiedzi endpointów API (< 200ms dla prostych operacji)
- Czas generowania fiszek przez AI (< 10s dla 10000 znaków)
- Obsługa 100 równoczesnych użytkowników
- Wydajność renderowania list fiszek (100+ pozycji)
- Optymalizacja zapytań do bazy danych

**Narzędzia**: k6, Lighthouse, WebPageTest

**Kryteria akceptacji**:
- API `/flashcards` (GET): odpowiedź < 200ms dla 100 fiszek
- API `/generations` (POST): odpowiedź < 12s dla 10000 znaków tekstu
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.0s
- Lighthouse Score: > 90 (Performance)

### 3.5 Testy Bezpieczeństwa (Security Tests)
**Cel**: Identyfikacja i eliminacja luk bezpieczeństwa.

**Zakres**:
- SQL Injection (walidacja wejść Supabase)
- Cross-Site Scripting (XSS)
- Cross-Site Request Forgery (CSRF)
- Bezpieczne przechowywanie haseł (hashing przez Supabase Auth)
- Autoryzacja dostępu do zasobów (RLS w Supabase)
- Secure cookies (httpOnly, sameSite, secure flags)
- Rate limiting na endpointach API
- Walidacja tokenów JWT

**Narzędzia**: OWASP ZAP, Burp Suite, npm audit

**Przykładowe przypadki testowe**:
- Próba dostępu do fiszek innego użytkownika (oczekiwany błąd 403)
- Próba wstrzyknięcia SQL przez formularz
- Weryfikacja flag bezpieczeństwa cookies
- Sprawdzenie limitów zapytań API (rate limiting)
- Analiza zależności npm pod kątem podatności

### 3.6 Testy Użyteczności (Usability Tests)
**Cel**: Ocena intuicyjności interfejsu i doświadczenia użytkownika.

**Zakres**:
- Intuicyjność procesu rejestracji i logowania
- Czytelność komunikatów walidacji i błędów
- Łatwość korzystania z generatora fiszek AI
- Efektywność procesu edycji fiszek
- Responsywność na urządzeniach mobilnych i tabletach
- Dostępność dla osób z niepełnosprawnościami (WCAG 2.1 Level AA)

**Metody**:
- Testy z użytkownikami końcowymi (5-10 osób)
- Heurystyczna ocena UX (Nielsen's heuristics)
- Analityka zachowań użytkowników

**Narzędzia**: Hotjar, Microsoft Clarity, axe DevTools

---

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1 Autentykacja Użytkowników

#### TC-AUTH-001: Rejestracja nowego użytkownika
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik nie jest zalogowany  
**Kroki**:
1. Przejdź do `/register`
2. Wprowadź poprawny email (np. `test@example.com`)
3. Wprowadź silne hasło (min. 8 znaków, wielkie/małe litery, cyfry)
4. Kliknij "Zarejestruj się"

**Oczekiwany rezultat**:
- Konto zostało utworzone w Supabase
- Użytkownik otrzymał email potwierdzający
- Automatyczne zalogowanie po rejestracji
- Przekierowanie do `/generate`

#### TC-AUTH-002: Logowanie z poprawnymi danymi
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik posiada konto  
**Kroki**:
1. Przejdź do `/login`
2. Wprowadź poprawny email
3. Wprowadź poprawne hasło
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- Sesja została utworzona
- Cookie `sb-access-token` został ustawiony
- Przekierowanie do `/generate`
- Header wyświetla przycisk "Wyloguj"

#### TC-AUTH-003: Logowanie z niepoprawnymi danymi
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik nie jest zalogowany  
**Kroki**:
1. Przejdź do `/login`
2. Wprowadź email `test@example.com`
3. Wprowadź błędne hasło
4. Kliknij "Zaloguj się"

**Oczekiwany rezultat**:
- Komunikat błędu: "Nieprawidłowy email lub hasło"
- Użytkownik pozostaje na stronie logowania
- Brak utworzenia sesji

#### TC-AUTH-004: Reset hasła
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik posiada konto  
**Kroki**:
1. Przejdź do `/password-reset`
2. Wprowadź email konta
3. Kliknij "Wyślij link resetujący"
4. Otwórz email i kliknij link
5. Na stronie `/update-password` wprowadź nowe hasło
6. Kliknij "Zaktualizuj hasło"

**Oczekiwany rezultat**:
- Email z linkiem resetującym został wysłany
- Nowe hasło zostało zapisane
- Możliwość zalogowania się nowym hasłem

#### TC-AUTH-005: Ochrona tras wymagających autentykacji
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik nie jest zalogowany  
**Kroki**:
1. Próba dostępu do `/generate` bez zalogowania

**Oczekiwany rezultat**:
- Middleware przekierowuje do `/login`
- Brak dostępu do chronionej strony

### 4.2 Generowanie Fiszek AI

#### TC-GEN-001: Generowanie fiszek z poprawnym tekstem
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst o długości 2000 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- Loading indicator jest widoczny podczas generowania
- Po 5-10s wyświetla się lista 5-10 wygenerowanych fiszek
- Każda fiszka ma przycisk "Akceptuj", "Edytuj", "Odrzuć"
- Zapisany rekord w tabeli `generations` z metadanymi

#### TC-GEN-002: Walidacja minimalnej długości tekstu
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst o długości 500 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- Komunikat błędu: "Tekst musi zawierać co najmniej 1000 znaków"
- Przycisk "Generuj fiszki" jest nieaktywny
- Brak wywołania API

#### TC-GEN-003: Walidacja maksymalnej długości tekstu
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do `/generate`
2. Wklej tekst o długości 11000 znaków
3. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- Komunikat błędu: "Tekst nie może przekraczać 10000 znaków"
- Przycisk "Generuj fiszki" jest nieaktywny
- Brak wywołania API

#### TC-GEN-004: Obsługa błędu AI service
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany, OpenRouter API jest niedostępne  
**Kroki**:
1. Symuluj niedostępność OpenRouter (np. błędny API key)
2. Przejdź do `/generate`
3. Wklej poprawny tekst
4. Kliknij "Generuj fiszki"

**Oczekiwany rezultat**:
- Komunikat błędu: "Wystąpił błąd podczas generowania fiszek"
- Błąd zapisany w tabeli `generation_error_logs`
- Możliwość ponowienia próby

#### TC-GEN-005: Edycja wygenerowanej fiszki
**Priorytet**: Średni  
**Warunki wstępne**: Fiszki zostały wygenerowane  
**Kroki**:
1. Po wygenerowaniu fiszek kliknij "Edytuj" przy wybranej fiszce
2. Zmień tekst na froncie fiszki
3. Zmień tekst na tyle fiszki
4. Kliknij "Zapisz zmiany"

**Oczekiwany rezultat**:
- Fiszka przechodzi w stan "edytowana"
- Source zmienia się z `ai-full` na `ai-edited`
- Zmieniony tekst jest widoczny na liście
- Przycisk "Zapisz wszystkie" jest aktywny

### 4.3 Zarządzanie Fiszkami

#### TC-FLASH-001: Masowe zapisywanie fiszek
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik zaakceptował co najmniej 1 fiszkę  
**Kroki**:
1. Po wygenerowaniu fiszek zaakceptuj 5 fiszek
2. Kliknij "Zapisz wszystkie"

**Oczekiwany rezultat**:
- POST `/api/flashcards` zwraca status 201
- 5 fiszek zostało zapisanych w bazie danych
- Komunikat sukcesu: "Zapisano 5 fiszek"
- Przekierowanie do listy "Moje fiszki"

#### TC-FLASH-002: Ręczne tworzenie fiszki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik jest zalogowany  
**Kroki**:
1. Przejdź do widoku "Moje fiszki"
2. Kliknij "Dodaj fiszkę"
3. Wprowadź tekst na przód (max 200 znaków)
4. Wprowadź tekst na tył (max 500 znaków)
5. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- Fiszka zapisana z `source: "manual"`
- `generation_id: null`
- Fiszka pojawia się na liście użytkownika
- Komunikat sukcesu

#### TC-FLASH-003: Walidacja maksymalnej długości frontu
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik tworzy fiszkę  
**Kroki**:
1. W formularzu ręcznego tworzenia wprowadź 250 znaków na przód
2. Kliknij "Zapisz"

**Oczekiwany rezultat**:
- Komunikat błędu: "Przód fiszki nie może przekraczać 200 znaków"
- Fiszka nie zostaje zapisana
- Licznik znaków jest widoczny (250/200)

#### TC-FLASH-004: Edycja istniejącej fiszki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma zapisane fiszki  
**Kroki**:
1. Przejdź do "Moje fiszki"
2. Kliknij ikonę edycji przy wybranej fiszce
3. Zmień tekst na tyle
4. Kliknij "Zapisz zmiany"

**Oczekiwany rezultat**:
- PUT `/api/flashcards/{id}` zwraca status 200
- Zmieniony tekst jest widoczny na liście
- Pole `updated_at` zostało zaktualizowane

#### TC-FLASH-005: Usuwanie fiszki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma zapisane fiszki  
**Kroki**:
1. Przejdź do "Moje fiszki"
2. Kliknij ikonę usunięcia przy wybranej fiszce
3. Potwierdź usunięcie w modal'u

**Oczekiwany rezultat**:
- Modal potwierdzenia: "Czy na pewno chcesz usunąć tę fiszkę?"
- DELETE `/api/flashcards/{id}` zwraca status 200
- Fiszka znika z listy
- Fiszka usunięta trwale z bazy danych

#### TC-FLASH-006: Autoryzacja dostępu do fiszek
**Priorytet**: Krytyczny  
**Warunki wstępne**: Użytkownik A ma fiszkę o ID=123  
**Kroki**:
1. Zaloguj się jako użytkownik B
2. Wykonaj żądanie GET `/api/flashcards/123`

**Oczekiwany rezultat**:
- Zwrócony status 403 Forbidden
- Komunikat: "Brak uprawnień do tego zasobu"
- Row Level Security (RLS) Supabase blokuje dostęp

### 4.4 Sesja Nauki (Spaced Repetition)

#### TC-LEARN-001: Rozpoczęcie sesji nauki
**Priorytet**: Wysoki  
**Warunki wstępne**: Użytkownik ma co najmniej 5 fiszek  
**Kroki**:
1. Przejdź do widoku "Sesja nauki"
2. Kliknij "Rozpocznij naukę"

**Oczekiwany rezultat**:
- Algorytm Leitner wybiera fiszki do nauki
- Wyświetlona pierwsza fiszka (tylko przód)
- Przycisk "Pokaż odpowiedź" jest widoczny
- Licznik postępu (np. "1/10")

#### TC-LEARN-002: Ocena fiszki w sesji
**Priorytet**: Wysoki  
**Warunki wstępne**: Sesja nauki jest aktywna  
**Kroki**:
1. Wyświetlony przód fiszki
2. Kliknij "Pokaż odpowiedź"
3. Oceń fiszkę (np. "Dobrze" lub "Trudne")

**Oczekiwany rezultat**:
- Wyświetlony tył fiszki
- Przyciski oceny zgodne z algorytmem Leitner
- Po ocenie wyświetlona następna fiszka
- Metadane nauki zapisane w bazie

#### TC-LEARN-003: Zakończenie sesji nauki
**Priorytet**: Średni  
**Warunki wstępne**: Użytkownik przejrzał wszystkie fiszki w sesji  
**Kroki**:
1. Oceń ostatnią fiszkę w sesji

**Oczekiwany rezultat**:
- Komunikat: "Gratulacje! Ukończyłeś sesję nauki"
- Podsumowanie sesji (ile fiszek, ile poprawnych)
- Przycisk "Rozpocznij nową sesję"
- Dane sesji zapisane do analytics

---

## 5. Środowisko Testowe

### 5.1 Konfiguracja środowisk

#### Środowisko Deweloperskie (Development)
- **URL**: `http://localhost:4321`
- **Baza danych**: Lokalna instancja Supabase (Docker)
- **AI Service**: OpenRouter z kluczem testowym (ograniczone limity)
- **Cel**: Testy lokalne podczas development

#### Środowisko Testowe (Staging)
- **URL**: `https://staging.10xcards.com`
- **Baza danych**: Supabase Cloud (dedykowany projekt testowy)
- **AI Service**: OpenRouter z kluczem testowym
- **Cel**: Testy integracyjne, E2E, wydajnościowe

#### Środowisko Produkcyjne (Production)
- **URL**: `https://10xcards.com`
- **Baza danych**: Supabase Cloud (projekt produkcyjny)
- **AI Service**: OpenRouter z kluczem produkcyjnym
- **Cel**: Smoke tests po deploymencie, monitoring

### 5.2 Dane testowe

#### Użytkownicy testowi
- `test-user-1@10xcards.com` / `TestPassword123!`
- `test-user-2@10xcards.com` / `TestPassword456!`
- `admin@10xcards.com` / `AdminPass789!`

#### Fiszki testowe
- Minimum 100 fiszek dla użytkownika testowego
- Różne źródła: `ai-full`, `ai-edited`, `manual`
- Różne długości treści (krótkie, średnie, długie)

#### Teksty źródłowe do generowania
- Tekst edukacyjny o długości 1000 znaków (minimum)
- Tekst edukacyjny o długości 5000 znaków (średnia)
- Tekst edukacyjny o długości 10000 znaków (maksimum)
- Przykłady w katalogu `/examples/`

---

## 6. Narzędzia do Testowania

### 6.1 Testy Jednostkowe i Integracyjne
- **Vitest**: Framework testowy dla Vite/Astro
- **React Testing Library**: Testy komponentów React
- **@testing-library/user-event**: Symulacja interakcji użytkownika
- **MSW (Mock Service Worker)**: Mockowanie API calls

### 6.2 Testy E2E
- **Playwright**: Testy end-to-end w wielu przeglądarkach
  - Chromium, Firefox, WebKit
  - Headless i headed mode
  - Screenshot i video recording
- **Cypress** (alternatywa): Testy E2E z time-travel debugging

### 6.3 Testy Wydajnościowe
- **k6**: Load testing i stress testing API
- **Lighthouse CI**: Continuous performance monitoring
- **WebPageTest**: Analiza wydajności w różnych lokalizacjach
- **Chrome DevTools**: Profiling i analiza network

### 6.4 Testy Bezpieczeństwa
- **npm audit**: Skanowanie zależności pod kątem podatności
- **OWASP ZAP**: Automated security testing
- **Burp Suite Community**: Manual security testing
- **Snyk**: Continuous security monitoring

### 6.5 Testy Dostępności
- **axe DevTools**: Automatyczne testy WCAG
- **WAVE**: Web accessibility evaluation tool
- **Screen readers**: NVDA (Windows), VoiceOver (macOS)

### 6.6 Narzędzia Wsparcia
- **Postman/Insomnia**: Testy API (manualne)
- **GitHub Actions**: CI/CD pipeline
- **Sentry**: Error tracking i monitoring
- **Supabase Dashboard**: Analiza zapytań SQL i RLS

---

## 7. Harmonogram Testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)
- ✅ Analiza wymagań i dokumentacji
- ✅ Stworzenie planu testów
- ⬜ Konfiguracja środowisk testowych
- ⬜ Przygotowanie danych testowych
- ⬜ Setup frameworków testowych (Vitest, Playwright)

### 7.2 Faza 2: Testy Modułu Autentykacji (Tydzień 2)
- ⬜ Testy jednostkowe walidacji auth
- ⬜ Testy integracyjne endpointów auth API
- ⬜ Testy E2E przepływów rejestracji i logowania
- ⬜ Testy bezpieczeństwa auth (JWT, cookies)
- ⬜ Testy middleware autoryzacyjnego

**Kryteria wyjścia**: 100% przypadków testowych zakończonych, 0 błędów krytycznych

### 7.3 Faza 3: Testy Generowania Fiszek AI (Tydzień 3)
- ⬜ Testy jednostkowe serwisu generation.service.ts
- ⬜ Testy integracyjne z OpenRouter API
- ⬜ Testy E2E pełnego przepływu generowania
- ⬜ Testy wydajnościowe czasu odpowiedzi AI
- ⬜ Testy obsługi błędów AI service

**Kryteria wyjścia**: Czas generowania < 12s (10000 znaków), 95% success rate

### 7.4 Faza 4: Testy Zarządzania Fiszkami (Tydzień 4)
- ⬜ Testy jednostkowe serwisu flashcard.service.ts
- ⬜ Testy integracyjne CRUD API
- ⬜ Testy E2E tworzenia, edycji, usuwania fiszek
- ⬜ Testy autoryzacji dostępu (RLS)
- ⬜ Testy walidacji długości treści

**Kryteria wyjścia**: Wszystkie operacje CRUD działają poprawnie, RLS działa

### 7.5 Faza 5: Testy Sesji Nauki (Tydzień 5)
- ⬜ Testy jednostkowe algorytmu Leitner
- ⬜ Testy integracyjne zapisywania postępów
- ⬜ Testy E2E pełnej sesji nauki
- ⬜ Testy wydajnościowe dla 100+ fiszek
- ⬜ Testy użyteczności interfejsu nauki

**Kryteria wyjścia**: Algorytm działa zgodnie ze specyfikacją, UX jest intuicyjny

### 7.6 Faza 6: Testy Kompleksowe (Tydzień 6)
- ⬜ Testy wydajnościowe całej aplikacji (k6)
- ⬜ Testy bezpieczeństwa (OWASP ZAP)
- ⬜ Testy dostępności (axe, WCAG 2.1)
- ⬜ Testy responsywności (mobile, tablet, desktop)
- ⬜ Smoke tests w środowisku staging
- ⬜ Testy regresji przed releasem

**Kryteria wyjścia**: Lighthouse score > 90, 0 błędów WCAG Level A, wszystkie smoke tests pass

### 7.7 Faza 7: UAT i Feedback (Tydzień 7)
- ⬜ User Acceptance Testing z grupą 5-10 użytkowników
- ⬜ Zbieranie feedbacku UX
- ⬜ Testy eksploracyjne
- ⬜ Bug fixing i retesty
- ⬜ Finalne testy regresji

**Kryteria wyjścia**: 90% użytkowników ocenia aplikację pozytywnie

---

## 8. Kryteria Akceptacji Testów

### 8.1 Kryteria funkcjonalne
- ✅ **100%** scenariuszy testowych o priorytecie "Krytyczny" zakończonych sukcesem
- ✅ **95%** scenariuszy testowych o priorytecie "Wysoki" zakończonych sukcesem
- ✅ **0** błędów krytycznych (blokujących działanie aplikacji)
- ✅ **Maksymalnie 3** błędy wysokiego priorytetu (muszą być zadokumentowane)

### 8.2 Kryteria wydajnościowe
- ✅ API `/flashcards` (GET): średni czas odpowiedzi < 200ms
- ✅ API `/generations` (POST): średni czas odpowiedzi < 12s dla 10000 znaków
- ✅ First Contentful Paint (FCP): < 1.5s
- ✅ Time to Interactive (TTI): < 3.0s
- ✅ Lighthouse Performance Score: > 90
- ✅ Aplikacja obsługuje 100 równoczesnych użytkowników bez degradacji wydajności

### 8.3 Kryteria bezpieczeństwa
- ✅ Wszystkie znane podatności w zależnościach npm zostały naprawione
- ✅ OWASP ZAP nie wykrywa wysokich ani średnich podatności
- ✅ Row Level Security (RLS) w Supabase działa poprawnie dla wszystkich tabel
- ✅ Cookies mają flagi: `httpOnly=true`, `secure=true`, `sameSite=strict`
- ✅ Rate limiting jest aktywny na wszystkich endpointach API

### 8.4 Kryteria dostępności
- ✅ axe DevTools nie wykrywa błędów WCAG 2.1 Level A
- ✅ **Maksymalnie 5** ostrzeżeń WCAG 2.1 Level AA (muszą być zadokumentowane)
- ✅ Nawigacja klawiaturą działa we wszystkich formularzach
- ✅ Screen reader poprawnie odczytuje wszystkie kluczowe elementy

### 8.5 Kryteria kompatybilności
- ✅ Aplikacja działa poprawnie w:
  - Chrome 120+ ✅
  - Firefox 120+ ✅
  - Safari 17+ ✅
  - Edge 120+ ✅
- ✅ Aplikacja jest responsywna na:
  - Desktop (1920x1080) ✅
  - Tablet (768x1024) ✅
  - Mobile (375x667) ✅

### 8.6 Kryteria pokrycia kodu (Code Coverage)
- ✅ **80%** pokrycia kodu testami jednostkowymi
- ✅ **70%** pokrycia logiki biznesowej (services)
- ✅ **100%** pokrycia endpointów API testami integracyjnymi

---

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1 QA Lead
**Odpowiedzialności**:
- Koordynacja procesu testowania
- Tworzenie i utrzymanie planu testów
- Zarządzanie środowiskami testowymi
- Raportowanie postępów do stakeholderów
- Final sign-off przed releasem

### 9.2 QA Engineer (Automation)
**Odpowiedzialności**:
- Implementacja testów jednostkowych i integracyjnych
- Implementacja testów E2E w Playwright
- Konfiguracja CI/CD pipeline dla testów
- Maintenance testów automatycznych
- Code review test code

### 9.3 QA Engineer (Manual)
**Odpowiedzialności**:
- Wykonywanie testów manualnych (eksploracyjnych)
- Testy użyteczności (UAT)
- Testy dostępności (manual checks)
- Weryfikacja błędów zgłoszonych przez użytkowników
- Dokumentacja przypadków testowych

### 9.4 Developer
**Odpowiedzialności**:
- Pisanie testów jednostkowych dla własnego kodu
- Fixing bugów znalezionych podczas testów
- Code review z uwzględnieniem testability
- Współpraca z QA przy reprodukcji błędów
- Unit test coverage > 80%

### 9.5 DevOps Engineer
**Odpowiedzialności**:
- Konfiguracja środowisk testowych
- Setup CI/CD pipeline (GitHub Actions)
- Monitoring wydajności i dostępności
- Deployment do środowisk staging i production
- Backup i restore danych testowych

### 9.6 Product Owner
**Odpowiedzialności**:
- Akceptacja kryteriów testów
- Uczestnictwo w UAT
- Priorytetyzacja błędów do naprawy
- Final acceptance przed release
- Feedback od użytkowników końcowych

---

## 10. Procedury Raportowania Błędów

### 10.1 Klasyfikacja błędów

#### Krytyczny (P0)
**Definicja**: Błąd całkowicie blokujący działanie aplikacji lub powodujący utratę danych.

**Przykłady**:
- Niemożność zalogowania się do aplikacji
- Utrata zapisanych fiszek
- Błąd 500 na głównym endpointcie API
- Naruszenie bezpieczeństwa (dostęp do danych innych użytkowników)

**SLA**: Naprawa w ciągu 24 godzin

#### Wysoki (P1)
**Definicja**: Błąd poważnie wpływający na funkcjonalność, ale z możliwością obejścia.

**Przykłady**:
- Generowanie fiszek AI nie działa
- Nie można usunąć fiszki
- Błąd walidacji w formularzu
- Sesja nauki nie zapisuje postępów

**SLA**: Naprawa w ciągu 3 dni roboczych

#### Średni (P2)
**Definicja**: Błąd wpływający na komfort użytkowania, ale nie blokujący podstawowych funkcji.

**Przykłady**:
- Niepoprawne formatowanie tekstu
- Brak komunikatu o sukcesie po zapisaniu
- Wolne ładowanie listy fiszek
- Niewłaściwy kolor przycisku

**SLA**: Naprawa w najbliższym sprincie

#### Niski (P3)
**Definicja**: Kosmetyczne błędy wizualne lub sugestie usprawnień.

**Przykłady**:
- Niezgodność czcionki z design systemem
- Drobne błędy literowe w UI
- Sugestie usprawnień UX

**SLA**: Naprawa w backlogu (według dostępności)

### 10.2 Szablon raportu błędu

```markdown
## [P0/P1/P2/P3] Krótki tytuł błędu

**ID**: BUG-XXX  
**Priorytet**: [Krytyczny/Wysoki/Średni/Niski]  
**Status**: [New/In Progress/Fixed/Verified/Closed]  
**Zgłaszający**: [Imię Nazwisko]  
**Data zgłoszenia**: YYYY-MM-DD  
**Środowisko**: [Dev/Staging/Production]  
**Przeglądarka**: [Chrome 120 / Firefox 120 / Safari 17]  
**OS**: [Windows 11 / macOS 14 / Ubuntu 22.04]  

### Opis problemu
Jasny i zwięzły opis tego, co nie działa poprawnie.

### Kroki do reprodukcji
1. Przejdź do strony X
2. Kliknij przycisk Y
3. Wprowadź wartość Z
4. Obserwuj błąd

### Oczekiwany rezultat
Co powinno się wydarzyć.

### Aktualny rezultat
Co faktycznie się wydarzyło.

### Screenshots/Videos
[Załącz zrzuty ekranu lub nagranie]

### Logi konsoli
```
[Załącz logi z konsoli przeglądarki lub serwera]
```

### Severity/Impact
Opisz wpływ błędu na użytkowników (ile osób dotkniętych, jak często występuje).

### Dodatkowe informacje
- Czy błąd występuje zawsze, czy sporadycznie?
- Czy istnieje workaround?
- Logi backendu (jeśli dotyczy)
```

### 10.3 Przepływ raportowania błędów

1. **Wykrycie błędu** przez testera lub użytkownika
2. **Weryfikacja** czy błąd jest reprodukowalny
3. **Utworzenie raportu** w systemie (GitHub Issues lub Jira)
4. **Klasyfikacja** (priorytet P0-P3)
5. **Assignment** do developera przez QA Lead
6. **Fix** przez developera
7. **Code review** przez innego developera
8. **Deployment** do środowiska testowego
9. **Weryfikacja** przez testera (re-test)
10. **Closure** jeśli błąd został naprawiony, lub **Re-open** jeśli nadal występuje

### 10.4 Narzędzia do śledzenia błędów
- **GitHub Issues**: Podstawowe śledzenie bugów i features
- **Labels**: `bug`, `critical`, `high-priority`, `security`, `performance`, `ux`
- **Milestones**: Przypisanie do konkretnego release'u
- **Projects**: Board Kanban do wizualizacji statusu (To Do, In Progress, Done)

---

## 11. Metryki i Raportowanie

### 11.1 Kluczowe metryki testowania (KPI)

#### Test Coverage
- **Jednostkowe**: > 80%
- **Integracyjne**: > 70%
- **E2E**: 100% krytycznych przepływów

#### Defect Density
- **Target**: < 5 defektów na 1000 linii kodu
- **Monitorowanie**: Cotygodniowe sprawdzenie

#### Defect Detection Rate
- **% bugów wykrytych przed production**: > 95%

#### Test Execution Rate
- **Automated tests**: 100% uruchamiane w CI/CD
- **Manual tests**: 100% przed każdym releasem

#### Mean Time to Detect (MTTD)
- **Target**: < 24 godziny od wprowadzenia buga

#### Mean Time to Resolve (MTTR)
- **P0 bugs**: < 24 godziny
- **P1 bugs**: < 3 dni

### 11.2 Raportowanie postępów

#### Dzienny Status Report (Standup)
- Liczba wykonanych testów (dzisiaj)
- Liczba wykrytych błędów (dzisiaj)
- Liczba naprawionych błędów (dzisiaj)
- Blokery (jeśli są)

#### Tygodniowy Test Summary
- Test coverage progress
- Open bugs breakdown (P0/P1/P2/P3)
- Test execution status (% completed)
- Risk assessment

#### Release Readiness Report
- Go/No-Go recommendation
- Wszystkie kryteria akceptacji (checklist)
- Lista known issues
- Recommendations dla stakeholderów

---

## 12. Zarządzanie Ryzykiem

### 12.1 Zidentyfikowane ryzyka

#### Ryzyko 1: Niedostępność OpenRouter API
**Prawdopodobieństwo**: Średnie  
**Wpływ**: Wysoki  
**Mitygacja**:
- Implementacja retry logic z exponential backoff
- Circuit breaker pattern
- Fallback na inny model LLM (np. Anthropic Claude)
- Monitoring uptime OpenRouter i alerty

#### Ryzyko 2: Powolna generacja fiszek AI
**Prawdopodobieństwo**: Średnie  
**Wpływ**: Średni  
**Mitygacja**:
- Optymalizacja promptów
- Użycie szybszego modelu (gpt-4o-mini zamiast gpt-4)
- Asynchroniczna generacja z websockets lub polling
- Loading indicator i komunikat o szacowanym czasie

#### Ryzyko 3: Przekroczenie limitów API OpenRouter
**Prawdopodobieństwo**: Niskie (w MVP)  
**Wpływ**: Wysoki  
**Mitygacja**:
- Ustawienie limitów finansowych w OpenRouter
- Rate limiting po stronie aplikacji
- Monitoring zużycia API w czasie rzeczywistym
- Alerty przy 80% zużycia limitu

#### Ryzyko 4: Problemy z wydajnością Supabase
**Prawdopodobieństwo**: Niskie  
**Wpływ**: Wysoki  
**Mitygacja**:
- Indeksy na kluczowych kolumnach (user_id, generation_id)
- Connection pooling
- Caching (Redis) dla często odczytywanych danych
- Monitoring slow queries w Supabase Dashboard

#### Ryzyko 5: Luki bezpieczeństwa w zależnościach
**Prawdopodobieństwo**: Średnie  
**Wpływ**: Wysoki  
**Mitygacja**:
- Automatyczne `npm audit` w CI/CD
- Dependabot alerts w GitHub
- Regularne aktualizacje zależności (co 2 tygodnie)
- Security review przed każdym releasem

#### Ryzyko 6: Niewystarczające testy użyteczności
**Prawdopodobieństwo**: Średnie  
**Wpływ**: Średni  
**Mitygacja**:
- UAT z prawdziwymi użytkownikami (5-10 osób)
- Analityka behawioralna (Hotjar/Clarity)
- A/B testing kluczowych flow
- Iteracyjne usprawnienia na podstawie feedbacku

### 12.2 Plan awaryjny (Contingency Plan)

#### Scenariusz: Krytyczny bug wykryty w production
**Akcje**:
1. Natychmiastowy rollback do poprzedniej stabilnej wersji
2. Komunikat dla użytkowników o tymczasowych problemach
3. Hot-fix w trybie priorytetowym (P0)
4. Testy regresji hot-fix'a w staging
5. Deploy hot-fix'a do production
6. Post-mortem i aktualizacja procedur

#### Scenariusz: Niedostępność Supabase > 1 godzina
**Akcje**:
1. Wyświetlenie maintenance page
2. Komunikat do użytkowników (email/social media)
3. Kontakt z supportem Supabase
4. Rozważenie przełączenia na backup region (jeśli skonfigurowane)
5. Monitoring do momentu przywrócenia usługi

---

## 13. Podsumowanie i Wnioski

### 13.1 Kluczowe punkty planu testów

Ten plan testów został stworzony specjalnie dla aplikacji **10xCards** z uwzględnieniem:

1. **Architektury technologicznej**: Astro 5 SSR + React 19 + Supabase + OpenRouter AI
2. **Kluczowych funkcjonalności MVP**: Autentykacja, generowanie fiszek AI, CRUD fiszek, spaced repetition
3. **Priorytetów jakościowych**: Bezpieczeństwo (RLS, JWT), wydajność (< 12s generowanie), dostępność (WCAG 2.1)
4. **Specyfiki projektu**: Integracja z zewnętrznymi API (OpenRouter, Supabase), SSR rendering, responsywność

### 13.2 Obszary wymagające szczególnej uwagi

1. **Integracja z OpenRouter AI**:
   - Testy obsługi błędów i timeoutów
   - Monitorowanie kosztów i limitów API
   - Walidacja jakości generowanych fiszek

2. **Bezpieczeństwo i autoryzacja**:
   - Row Level Security w Supabase
   - Ochrona endpointów API
   - Bezpieczne zarządzanie sesjami

3. **Wydajność generowania fiszek**:
   - Optymalizacja czasu odpowiedzi AI
   - UX podczas oczekiwania (loading states)
   - Obsługa długich tekstów (10000 znaków)

4. **Responsywność i dostępność**:
   - Mobile-first approach
   - WCAG 2.1 Level AA compliance
   - Testy z prawdziwymi screen readers

### 13.3 Następne kroki

1. ✅ **Akceptacja planu testów** przez Product Ownera i Team Lead
2. ⬜ **Setup środowisk testowych** (lokalne, staging)
3. ⬜ **Implementacja frameworków testowych** (Vitest, Playwright)
4. ⬜ **Przygotowanie danych testowych** i user accounts
5. ⬜ **Rozpoczęcie testowania** zgodnie z harmonogramem (Faza 2)
6. ⬜ **Continuous improvement** na podstawie metryk i feedbacku

---

**Dokument przygotowany**: 2025-10-14  
**Wersja**: 1.0  
**Status**: ✅ Do akceptacji  
**Autor**: QA Team – 10xCards Project

