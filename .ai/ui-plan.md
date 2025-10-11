# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

Aplikacja 10x-cards została zaprojektowana jako responsywna aplikacja webowa oparta na frameworku Astro (dla statycznych widoków) i React (dla komponentów interaktywnych). Architektura UI skupia się na prostocie, intuicyjności i dostępności, zapewniając płynne doświadczenie użytkownika podczas tworzenia, zarządzania i nauki z fiszek edukacyjnych.

### Główne założenia architektoniczne:
- **Framework**: Astro 5 + React 19 dla komponentów dynamicznych
- **Stylizacja**: Tailwind CSS 4 + Shadcn/ui dla komponentów
- **Zarządzanie stanem**: React hooks (`useState`, `useContext`)
- **Routing**: Astro routing z middleware dla autoryzacji
- **Responsywność**: Mobile-first approach z dedykowanymi interakcjami dla urządzeń mobilnych
- **Dostępność**: WCAG AA compliance poprzez Shadcn/ui i semantyczny HTML

### Stack techniczny UI:
- TypeScript 5 dla type safety
- Supabase Auth dla uwierzytelniania
- Toast notifications dla komunikatów systemowych
- Modal dialogs dla formularzy i potwierdzeń

## 2. Lista widoków

### 2.1. Widok Uwierzytelniania (`/auth`)

**Główny cel:**
Umożliwienie nowym użytkownikom rejestracji oraz istniejącym użytkownikom zalogowania się do aplikacji.

**Ścieżka:** `/auth` (lub `/` dla niezalogowanych użytkowników)

**Kluczowe informacje do wyświetlenia:**
- Formularz logowania (e-mail, hasło)
- Formularz rejestracji (e-mail, hasło, potwierdzenie hasła)
- Przełącznik między trybem logowania a rejestracją
- Komunikaty o błędach walidacji
- Stan ładowania podczas przetwarzania

**Kluczowe komponenty widoku:**
- `AuthToggle` - przełącznik między logowaniem a rejestracją (zakładki/toggle)
- `LoginForm` - formularz logowania z polami e-mail i hasła
- `RegisterForm` - formularz rejestracji z walidacją
- `Button` (Shadcn/ui) - przyciski akcji
- `Input` (Shadcn/ui) - pola tekstowe z walidacją
- `Alert` (Shadcn/ui) - komunikaty błędów
- `Spinner` - wskaźnik ładowania

**Mapowanie User Stories:**
- US-001: Rejestracja konta
- US-002: Logowanie do aplikacji

**Integracja z API:**
- Supabase Auth: `/auth/register`, `/auth/login`

**UX, dostępność i względy bezpieczeństwa:**
- **UX**: 
  - Płynne przełączanie między formularzami bez przeładowania strony
  - Walidacja w czasie rzeczywistym z wizualnym feedbackiem
  - Jasne komunikaty o błędach (np. "Nieprawidłowy e-mail lub hasło")
  - Autofocus na pierwszym polu formularza
- **Dostępność**: 
  - Proper form labels i ARIA attributes
  - Keyboard navigation (Tab, Enter)
  - Screen reader support dla komunikatów błędów
  - Wysokí kontrast dla czytelności
- **Bezpieczeństwo**:
  - Hasła nigdy nie są przechowywane w stanie klienta
  - HTTPS only
  - Walidacja siły hasła (min. 8 znaków)
  - Rate limiting na poziomie API

**Przypadki brzegowe:**
- Próba rejestracji z istniejącym e-mailem → wyświetl błąd "E-mail już istnieje"
- Nieprawidłowe dane logowania → "Nieprawidłowy e-mail lub hasło"
- Błąd sieciowy → "Problem z połączeniem. Spróbuj ponownie."
- Słabe hasło → wskaźnik siły hasła z sugestiami

**Przekierowania:**
- Po pomyślnym zalogowaniu/rejestracji → `/generate` (Widok Generowania Fiszek)

---

### 2.2. Widok Generowania Fiszek (`/generate`)

**Główny cel:**
Umożliwienie użytkownikom wklejenia tekstu źródłowego i wygenerowania propozycji fiszek za pomocą AI, a następnie przejrzenia, edycji i zaakceptowania propozycji.

**Ścieżka:** `/generate` (domyślna strona po zalogowaniu)

**Kluczowe informacje do wyświetlenia:**
- Textarea dla tekstu źródłowego (1000-10000 znaków)
- Licznik znaków z walidacją w czasie rzeczywistym
- Lista wygenerowanych propozycji fiszek
- Status każdej propozycji (zaakceptowana/odrzucona/edytowana)
- Stan ładowania podczas generowania

**Kluczowe komponenty widoku:**
- `AppLayout` - główny layout z sidebar
- `GenerationForm` - formularz z textarea i przyciskiem "Generuj"
- `CharacterCounter` - licznik znaków z wizualizacją limitu
- `FlashcardProposalsList` - lista wygenerowanych propozycji
- `FlashcardProposalCard` - pojedyncza karta propozycji z akcjami
- `ProposalActionButtons` - przyciski: Akceptuj, Odrzuć, Edytuj
- `EditProposalModal` - modal do edycji propozycji
- `SaveProposalsButton` - przycisk zapisu zaakceptowanych fiszek
- `Textarea` (Shadcn/ui) - pole tekstowe
- `Spinner` - wskaźnik ładowania

**Mapowanie User Stories:**
- US-003: Generowanie fiszek przy użyciu AI
- US-004: Przegląd i zatwierdzanie propozycji fiszek

**Integracja z API:**
- POST `/api/generations` - generowanie propozycji
- POST `/api/flashcards` - zapis zaakceptowanych fiszek

**UX, dostępność i względy bezpieczeństwa:**
- **UX**:
  - Licznik znaków z kolorowym wskaźnikiem (czerwony <1000, zielony 1000-10000, czerwony >10000)
  - Komunikat walidacji: "Tekst musi zawierać od 1000 do 10000 znaków"
  - Blokowanie formularza i przycisku podczas generowania (disabled state)
  - Pełnoekranowy spinner z komunikatem "Generuję fiszki..."
  - Responsywne karty propozycji z wyraźnymi ikonami akcji
  - Na mobile: swipe-to-accept/reject lub dedykowane ikony
  - Potwierdzenie przed zapisem: "Zapisać X zaakceptowanych fiszek?"
  - Toast po zapisie: "Pomyślnie dodano X fiszek"
  - Automatyczne przekierowanie do `/flashcards` po zapisie
- **Dostępność**:
  - ARIA live region dla licznika znaków
  - Keyboard shortcuts: Ctrl+Enter dla generowania
  - Focus management w modalach edycji
  - Screen reader announcements dla statusu generowania
- **Bezpieczeństwo**:
  - Walidacja długości tekstu po stronie klienta i serwera
  - Sanityzacja wejścia przed wysłaniem do API
  - Rate limiting dla generowania (max X requestów/godzinę)

**Przypadki brzegowe:**
- Tekst poza zakresem 1000-10000 znaków → disable przycisku + komunikat
- Błąd API podczas generowania → toast "Nie udało się wygenerować fiszek. Spróbuj ponownie."
- Brak wygenerowanych propozycji → komunikat "AI nie wygenerowało żadnych fiszek. Spróbuj z innym tekstem."
- Próba zapisu bez zaakceptowanych fiszek → disable przycisku zapisu
- Session timeout podczas generowania → przekierowanie do `/auth` z komunikatem

**Stany widoku:**
1. **Początkowy**: pusty formularz, przycisk "Generuj" disabled
2. **Gotowy**: tekst w zakresie, przycisk "Generuj" enabled
3. **Generowanie**: formularz zablokowany, spinner, brak możliwości interakcji
4. **Propozycje gotowe**: lista propozycji z możliwością akcji
5. **Zapisywanie**: przycisk "Zapisz" disabled, spinner
6. **Po zapisie**: przekierowanie z toast notification

---

### 2.3. Widok Moich Fiszek (`/flashcards`)

**Główny cel:**
Wyświetlenie wszystkich zapisanych fiszek użytkownika z możliwością filtrowania, ręcznego dodawania, edycji i usuwania pojedynczych fiszek.

**Ścieżka:** `/flashcards`

**Kluczowe informacje do wyświetlenia:**
- Lista wszystkich fiszek w porządku chronologicznym (od najnowszych)
- Filtry: Wszystkie / Ręczne / AI
- Dla każdej fiszki: przód, tył, źródło (manual/ai-full/ai-edited), data utworzenia
- Akcje: Edytuj, Usuń
- Przycisk "Dodaj fiszkę" (otwiera modal)
- Paginacja (jeśli więcej niż 10 fiszek)
- Licznik: "Wyświetlam X z Y fiszek"

**Kluczowe komponenty widoku:**
- `AppLayout` - główny layout z sidebar
- `FlashcardsHeader` - nagłówek z przyciskiem "Dodaj fiszkę"
- `FlashcardsFilters` - przyciski filtrowania (Wszystkie/Ręczne/AI)
- `FlashcardsList` - lista fiszek
- `FlashcardItem` - pojedyncza karta fiszki z akcjami
- `AddFlashcardModal` - modal z formularzem dodawania fiszki
- `EditFlashcardModal` - modal z formularzem edycji fiszki
- `DeleteConfirmDialog` - dialog potwierdzenia usunięcia
- `Pagination` (Shadcn/ui) - paginacja
- `EmptyState` - komunikat gdy brak fiszek

**Mapowanie User Stories:**
- US-005: Edycja fiszek
- US-006: Usuwanie fiszek
- US-007: Ręczne tworzenie fiszek
- US-009: Bezpieczny dostęp i autoryzacja

**Integracja z API:**
- GET `/api/flashcards?page=1&limit=10&sort=created_at&order=desc&source=manual` - lista fiszek
- POST `/api/flashcards` - dodanie nowej fiszki
- PUT `/api/flashcards/{id}` - edycja fiszki
- DELETE `/api/flashcards/{id}` - usunięcie fiszki

**UX, dostępność i względy bezpieczeństwa:**
- **UX**:
  - Filtry jako toggle buttons z visual feedback (aktywny filtr podświetlony)
  - Karty fiszek z hover effect
  - Akcje widoczne on hover (desktop) lub zawsze widoczne (mobile)
  - Modal dodawania/edycji z autofocus na polu "Przód"
  - Walidacja formularza: przód max 200 znaków, tył max 500 znaków
  - Licznik znaków w formularzach
  - Dialog potwierdzenia usunięcia: "Czy na pewno chcesz usunąć tę fiszkę?"
  - Toast po akcjach: "Fiszka dodana", "Fiszka zaktualizowana", "Fiszka usunięta"
  - Optimistic UI updates (natychmiastowa aktualizacja UI, rollback przy błędzie)
  - Empty state gdy brak fiszek: "Nie masz jeszcze żadnych fiszek. Wygeneruj je lub dodaj ręcznie."
  - Skeleton loaders podczas ładowania
- **Dostępność**:
  - Keyboard navigation między fiszkami
  - ARIA labels dla przycisków akcji
  - Focus trap w modalach
  - ESC do zamykania modali
  - Screen reader announcements dla akcji
- **Bezpieczeństwo**:
  - RLS (Row Level Security) w Supabase - użytkownik widzi tylko swoje fiszki
  - Walidacja długości pól po stronie klienta i serwera
  - Confirmation dialog dla destructive actions

**Przypadki brzegowe:**
- Brak fiszek → Empty state z zachętą do dodania
- Błąd ładowania → komunikat z przyciskiem "Spróbuj ponownie"
- Błąd zapisu/edycji → toast z komunikatem błędu, rollback UI
- Próba edycji podczas utraty połączenia → offline indicator + queue
- Filtry bez wyników → "Brak fiszek spełniających kryteria"

**Stany widoku:**
1. **Ładowanie**: skeleton loaders
2. **Lista fiszek**: karty z danymi
3. **Empty state**: brak fiszek
4. **Modal otwarty**: formularz dodawania/edycji
5. **Dialog potwierdzenia**: przed usunięciem
6. **Zapisywanie**: disabled form + spinner

---

### 2.4. Widok Sesji Nauki (`/study`)

**Główny cel:**
Przeprowadzenie użytkownika przez sesję nauki z wykorzystaniem zewnętrznego algorytmu powtórek (spaced repetition).

**Ścieżka:** `/study`

**Kluczowe informacje do wyświetlenia:**
- Licznik: "Fiszka X z Y w tej sesji"
- Przód fiszki (pytanie)
- Przycisk "Pokaż odpowiedź"
- Tył fiszki (odpowiedź) - po kliknięciu "Pokaż odpowiedź"
- Przyciski oceny: "Powtórz", "Trudne", "Dobrze"
- Progress bar sesji
- Komunikat końca sesji z statystykami

**Kluczowe komponenty widoku:**
- `AppLayout` - główny layout z sidebar
- `StudySessionHeader` - nagłówek z licznikiem i progress bar
- `FlashcardDisplay` - wyświetlacz fiszki (przód/tył)
- `RevealButton` - przycisk "Pokaż odpowiedź"
- `RatingButtons` - przyciski oceny ("Powtórz", "Trudne", "Dobrze")
- `SessionCompleteModal` - modal z podsumowaniem sesji
- `Card` (Shadcn/ui) - karta fiszki
- `Progress` (Shadcn/ui) - progress bar

**Mapowanie User Stories:**
- US-008: Sesja nauki z algorytmem powtórek

**Integracja z API:**
- GET `/api/study/session` - pobranie fiszek do nauki (algorytm decyduje które)
- POST `/api/study/rate` - zapisanie oceny fiszki (input dla algorytmu)

**UX, dostępność i względy bezpieczeństwa:**
- **UX**:
  - Duża, czytelna czcionka dla treści fiszek
  - Animacja flip przy pokazywaniu odpowiedzi
  - Przyciski oceny z różnymi kolorami (czerwony/żółty/zielony)
  - Keyboard shortcuts: Spacja = pokaż odpowiedź, 1/2/3 = oceny
  - Progress bar wizualizujący postęp w sesji
  - Smooth transitions między fiszkami
  - Modal końca sesji z statystykami: "Świetna robota! Przejrzałeś X fiszek."
  - Przycisk "Rozpocznij nową sesję" lub "Powrót do fiszek"
  - Empty state gdy brak fiszek do nauki: "Nie masz fiszek do powtórki. Dodaj nowe fiszki!"
- **Dostępność**:
  - ARIA live region dla zmian stanu fiszki
  - Keyboard navigation (Spacja, 1-3)
  - Screen reader friendly
  - Focus management na przyciskach akcji
- **Bezpieczeństwo**:
  - Walidacja sesji po stronie serwera
  - RLS - użytkownik uczy się tylko swoich fiszek

**Przypadki brzegowe:**
- Brak fiszek do nauki → Empty state z linkiem do `/flashcards`
- Przerwanie sesji → zapisanie postępu, możliwość powrotu
- Błąd podczas zapisywania oceny → retry mechanism z queue
- Koniec sesji → modal z podsumowaniem i opcjami dalszych działań

**Stany widoku:**
1. **Ładowanie sesji**: spinner
2. **Pytanie**: wyświetlony przód, przycisk "Pokaż odpowiedź"
3. **Odpowiedź**: wyświetlony przód i tył, przyciski oceny
4. **Przejście**: animacja do następnej fiszki
5. **Koniec sesji**: modal z podsumowaniem
6. **Empty state**: brak fiszek do nauki

---

### 2.5. Widok Profilu/Ustawień (`/profile`) [Opcjonalny dla MVP]

**Główny cel:**
Umożliwienie użytkownikowi zarządzania swoim kontem i wyświetlenia podstawowych statystyk.

**Ścieżka:** `/profile`

**Kluczowe informacje do wyświetlenia:**
- E-mail użytkownika
- Statystyki:
  - Łączna liczba fiszek
  - Liczba fiszek wygenerowanych przez AI
  - Liczba fiszek ręcznych
  - Procent zaakceptowanych propozycji AI
- Przycisk "Zmień hasło"
- Przycisk "Usuń konto" (z ostrzeżeniem)

**Kluczowe komponenty widoku:**
- `AppLayout` - główny layout z sidebar
- `ProfileInfo` - informacje o koncie
- `StatsDisplay` - wyświetlanie statystyk
- `ChangePasswordForm` - formularz zmiany hasła
- `DeleteAccountDialog` - dialog potwierdzenia usunięcia konta
- `Card` (Shadcn/ui) - karty dla sekcji

**Mapowanie User Stories:**
- Częściowo US-009: Bezpieczny dostęp
- Wymagania funkcjonalne #6: Statystyki generowania fiszek
- Wymagania prawne: prawo do usunięcia danych

**Integracja z API:**
- GET `/api/profile` - dane użytkownika
- GET `/api/stats` - statystyki użytkownika
- PUT `/api/profile/password` - zmiana hasła
- DELETE `/api/profile` - usunięcie konta

**UX, dostępność i względy bezpieczeństwa:**
- **UX**:
  - Wyraźne sekcje: "Informacje", "Statystyki", "Ustawienia"
  - Dialog ostrzegający przed usunięciem konta: "UWAGA: Ta akcja jest nieodwracalna!"
  - Wymaganie potwierdzenia przez wpisanie "USUŃ" przed usunięciem konta
  - Toast potwierdzający zmianę hasła
- **Dostępność**:
  - Semantic HTML dla czytelności
  - Clear labels i instructions
- **Bezpieczeństwo**:
  - Zmiana hasła wymaga podania starego hasła
  - Usunięcie konta wymaga re-authentication
  - Wylogowanie po usunięciu konta

**Przypadki brzegowe:**
- Błąd ładowania statystyk → wyświetl partial data z komunikatem
- Błąd zmiany hasła → toast z komunikatem (np. "Stare hasło nieprawidłowe")

---

## 3. Mapa podróży użytkownika

### 3.1. Główny przepływ: Od rejestracji do nauki

```
1. REJESTRACJA/LOGOWANIE (/auth)
   ↓
   Użytkownik wypełnia formularz rejestracji
   ↓
   Klik "Zarejestruj się"
   ↓
   Walidacja + utworzenie konta
   ↓
   [Przekierowanie automatyczne]
   ↓

2. GENEROWANIE FISZEK (/generate)
   ↓
   Użytkownik wkleja tekst (1000-10000 znaków)
   ↓
   Licznik pokazuje status (zielony gdy OK)
   ↓
   Klik "Generuj fiszki"
   ↓
   Spinner + komunikat "Generuję fiszki..."
   ↓
   Lista propozycji pojawia się poniżej
   ↓
   Użytkownik przegląda propozycje
   ↓
   Dla każdej propozycji: Akceptuj / Odrzuć / Edytuj
   ↓
   (Opcjonalnie) Edycja propozycji w modalu
   ↓
   Klik "Zapisz zaakceptowane fiszki"
   ↓
   Spinner + zapisywanie
   ↓
   [Przekierowanie automatyczne] + Toast "Dodano X fiszek"
   ↓

3. PRZEGLĄDANIE FISZEK (/flashcards)
   ↓
   Użytkownik widzi listę swoich fiszek
   ↓
   (Opcjonalnie) Filtrowanie: Wszystkie / Ręczne / AI
   ↓
   (Opcjonalnie) Dodanie ręcznej fiszki przez modal
   ↓
   (Opcjonalnie) Edycja/Usunięcie fiszki
   ↓
   Klik w sidebar: "Sesja nauki"
   ↓

4. SESJA NAUKI (/study)
   ↓
   Algorytm przygotowuje sesję
   ↓
   Wyświetlenie pierwszej fiszki (przód)
   ↓
   Użytkownik czyta pytanie
   ↓
   Klik "Pokaż odpowiedź" (lub Spacja)
   ↓
   Animacja flip → wyświetlenie tyłu
   ↓
   Użytkownik ocenia swoją wiedzę
   ↓
   Klik "Powtórz" / "Trudne" / "Dobrze" (lub 1/2/3)
   ↓
   Zapisanie oceny → następna fiszka
   ↓
   [Powtórzenie dla każdej fiszki w sesji]
   ↓
   Koniec sesji
   ↓
   Modal z podsumowaniem: "Świetna robota! Przejrzałeś X fiszek."
   ↓
   Opcje: "Rozpocznij nową sesję" / "Powrót do fiszek"
```

### 3.2. Przepływ alternatywny: Ręczne dodawanie fiszek

```
PRZEGLĄDANIE FISZEK (/flashcards)
↓
Klik "Dodaj fiszkę"
↓
Modal z formularzem
↓
Wypełnienie pól: "Przód" i "Tył"
↓
(Opcjonalnie) Walidacja w czasie rzeczywistym
↓
Klik "Zapisz"
↓
Spinner w przycisku
↓
Modal zamyka się
↓
Toast "Fiszka dodana"
↓
Nowa fiszka pojawia się na liście (na górze)
```

### 3.3. Przepływ obsługi błędów

```
DOWOLNY WIDOK
↓
Akcja użytkownika (np. zapisanie fiszki)
↓
Błąd API (400/500)
↓
Toast z komunikatem błędu
↓
(Jeśli 401 - sesja wygasła)
↓
Próba cichego odświeżenia tokenu
↓
Jeśli fail → przekierowanie do /auth
↓
Toast "Sesja wygasła. Zaloguj się ponownie."
```

### 3.4. Kluczowe punkty decyzyjne użytkownika

1. **Po zalogowaniu**: Generować fiszki AI czy przejść do istniejących?
   - Domyślnie: `/generate` (zakładamy, że nowy użytkownik chce generować)
   - Sidebar umożliwia szybkie przejście do `/flashcards`

2. **Po wygenerowaniu propozycji**: Które fiszki zaakceptować?
   - Użytkownik decyduje dla każdej propozycji osobno
   - Może edytować przed zaakceptowaniem

3. **W widoku fiszek**: Uczyć się czy zarządzać?
   - "Sesja nauki" w sidebar dla rozpoczęcia nauki
   - Pozostanie w widoku dla zarządzania

4. **Podczas sesji nauki**: Jak ocenić swoją wiedzę?
   - Trzy opcje: Powtórz / Trudne / Dobrze
   - Wpływa na algorytm powtórek

---

## 4. Układ i struktura nawigacji

### 4.1. Nawigacja główna (dla zalogowanych użytkowników)

**Sidebar - stały, widoczny na wszystkich stronach (desktop):**

```
┌─────────────────────┐
│  10x-cards          │ <- Logo/Nazwa aplikacji (link do /generate)
├─────────────────────┤
│                     │
│  ⚡ Generuj         │ <- Link do /generate (aktywny podświetlony)
│  📚 Moje fiszki     │ <- Link do /flashcards
│  🎓 Sesja nauki     │ <- Link do /study
│                     │
├─────────────────────┤
│  👤 Profil          │ <- Link do /profile (opcjonalny)
│  🚪 Wyloguj         │ <- Akcja wylogowania
└─────────────────────┘
```

**Mobile navigation:**
- Top bar z hamburger menu (ikona ☰)
- Po kliknięciu: drawer z menu (te same linki co sidebar)
- Active route wizualnie wyróżniony

### 4.2. Hierarchia nawigacji

```
Nawigacja główna (Sidebar/Drawer)
├── Generuj (/generate)
├── Moje fiszki (/flashcards)
│   └── [Modalowe akcje]
│       ├── Dodaj fiszkę (modal)
│       ├── Edytuj fiszkę (modal)
│       └── Potwierdź usunięcie (dialog)
├── Sesja nauki (/study)
│   └── Podsumowanie sesji (modal)
└── Profil (/profile) [opcjonalny]
    └── [Modalowe akcje]
        ├── Zmień hasło (modal)
        └── Usuń konto (dialog)

Nawigacja dla niezalogowanych
└── Uwierzytelnianie (/auth)
    ├── Tab: Logowanie
    └── Tab: Rejestracja
```

### 4.3. Breadcrumbs / Orientacja użytkownika

Ze względu na prostą strukturę MVP, breadcrumbs nie są wymagane. Orientacja użytkownika zapewniana jest przez:
- **Active link w sidebar** (wizualne podświetlenie)
- **Nagłówki stron** (np. "Generuj fiszki", "Moje fiszki", "Sesja nauki")
- **Komunikaty kontekstowe** (np. "Nie masz jeszcze fiszek do nauki")

### 4.4. Przepływy nawigacyjne

**Automatyczne przekierowania:**
- Niezalogowany użytkownik próbujący dostać się do chronionej strony → `/auth`
- Zalogowany użytkownik na `/auth` → `/generate`
- Po pomyślnym zapisaniu fiszek w `/generate` → `/flashcards` + toast
- Po wylogowaniu → `/auth` + toast "Wylogowano pomyślnie"
- Po wygaśnięciu sesji (401) → `/auth` + toast "Sesja wygasła"

**Nawigacja ręczna:**
- Wszystkie główne widoki dostępne przez sidebar
- Back button przeglądarki wspierany (Astro routing)

---

## 5. Kluczowe komponenty

### 5.1. Komponenty layoutu

#### `AppLayout`
**Opis:** Główny layout dla zalogowanych użytkowników. Zawiera sidebar/drawer i content area.

**Użycie:** Wszystkie widoki autoryzowane (`/generate`, `/flashcards`, `/study`, `/profile`)

**Kluczowe elementy:**
- Sidebar z nawigacją (desktop)
- Top bar z hamburger menu (mobile)
- Content area (main)
- Toast container

**Props:**
- `children`: React.ReactNode - treść strony
- `activeRoute`: string - aktywny route dla podświetlenia

---

#### `AuthLayout`
**Opis:** Layout dla widoku uwierzytelniania. Prosty, wycentrowany formularz.

**Użycie:** Widok `/auth`

**Kluczowe elementy:**
- Centered container
- Logo/nazwa aplikacji
- Form container

---

### 5.2. Komponenty nawigacji

#### `Sidebar`
**Opis:** Boczny panel nawigacyjny dla desktop.

**Elementy:**
- Logo (link do `/generate`)
- Lista linków nawigacyjnych
- Sekcja użytkownika (profil + wyloguj)

**Interakcje:**
- Hover effects na linkach
- Active link highlighting
- Smooth transitions

---

#### `MobileNav`
**Opis:** Drawer nawigacyjny dla urządzeń mobilnych.

**Elementy:**
- Top bar z hamburger icon
- Drawer z listą linków (te same co Sidebar)

**Interakcje:**
- Toggle drawer on/off
- Overlay gdy otwarty
- Zamknięcie po kliknięciu linku

---

### 5.3. Komponenty formularzy

#### `LoginForm` / `RegisterForm`
**Opis:** Formularze uwierzytelniania z walidacją.

**Użycie:** Widok `/auth`

**Kluczowe elementy:**
- Input fields (e-mail, hasło)
- Submit button z loading state
- Error messages
- Links (np. "Nie masz konta?" → przełączenie do rejestracji)

**Walidacja:**
- E-mail format
- Password strength (min. 8 znaków)
- Real-time feedback

---

#### `GenerationForm`
**Opis:** Formularz generowania fiszek z textarea i walidacją długości.

**Użycie:** Widok `/generate`

**Kluczowe elementy:**
- Textarea (1000-10000 znaków)
- Character counter z wizualizacją
- Submit button "Generuj fiszki"
- Loading state podczas generowania

**Walidacja:**
- Długość tekstu 1000-10000
- Real-time character count
- Visual feedback (kolory)

---

#### `AddFlashcardForm` / `EditFlashcardForm`
**Opis:** Formularz dodawania/edycji pojedynczej fiszki.

**Użycie:** Modal w widoku `/flashcards`

**Kluczowe elementy:**
- Input "Przód" (max 200 znaków)
- Textarea "Tył" (max 500 znaków)
- Character counters
- Submit button
- Cancel button

**Walidacja:**
- Długość pól
- Required fields
- Real-time feedback

---

### 5.4. Komponenty wyświetlania danych

#### `FlashcardProposalCard`
**Opis:** Karta pojedynczej propozycji fiszki z akcjami.

**Użycie:** Widok `/generate` (lista propozycji)

**Kluczowe elementy:**
- Przód fiszki
- Tył fiszki
- Przyciski akcji: Akceptuj, Odrzuć, Edytuj
- Visual state (zaakceptowana/odrzucona)

**Interakcje:**
- Accept: zmienia kolor na zielony
- Reject: przygasa/ukrywa
- Edit: otwiera modal

**Mobile:**
- Swipe gestures lub wyraźne ikony

---

#### `FlashcardItem`
**Opis:** Karta zapisanej fiszki na liście.

**Użycie:** Widok `/flashcards`

**Kluczowe elementy:**
- Przód fiszki
- Tył fiszki (skrócony lub collapsed)
- Metadata: źródło, data utworzenia
- Akcje: Edytuj, Usuń (on hover lub zawsze widoczne)

**Interakcje:**
- Expand/collapse dla długich treści
- Click to edit (opcjonalnie)
- Hover effects

---

#### `FlashcardDisplay`
**Opis:** Wyświetlacz fiszki podczas sesji nauki.

**Użycie:** Widok `/study`

**Kluczowe elementy:**
- Card z dużą, czytelną czcionką
- Przód fiszki (pytanie)
- Tył fiszki (odpowiedź) - pokazywany po kliknięciu
- Flip animation

**Stany:**
- Question state (tylko przód)
- Answer state (przód + tył)

---

### 5.5. Komponenty interakcji

#### `CharacterCounter`
**Opis:** Licznik znaków z wizualnym feedbackiem.

**Użycie:** Formularze z limitami (`GenerationForm`, `AddFlashcardForm`)

**Kluczowe elementy:**
- Aktualny count / max
- Kolorowa wizualizacja (czerwony/zielony)
- Komunikat walidacyjny

**Logika:**
- < min: czerwony + komunikat
- min-max: zielony
- > max: czerwony + komunikat

---

#### `ProposalActionButtons`
**Opis:** Grupa przycisków akcji dla propozycji fiszek.

**Użycie:** `FlashcardProposalCard` w `/generate`

**Przyciski:**
- ✓ Akceptuj (zielony)
- ✗ Odrzuć (czerwony)
- ✎ Edytuj (niebieski)

**Interakcje:**
- Click handlers dla każdej akcji
- Visual feedback (hover, active)
- Disabled state gdy w trakcie zapisu

---

#### `RatingButtons`
**Opis:** Przyciski oceny wiedzy podczas sesji nauki.

**Użycie:** `FlashcardDisplay` w `/study` (po pokazaniu odpowiedzi)

**Przyciski:**
- 🔁 Powtórz (czerwony) - keyboard: 1
- 😐 Trudne (żółty) - keyboard: 2
- ✓ Dobrze (zielony) - keyboard: 3

**Interakcje:**
- Click handlers
- Keyboard shortcuts (1, 2, 3)
- Visual feedback

---

### 5.6. Komponenty modalowe

#### `EditProposalModal`
**Opis:** Modal do edycji propozycji fiszki przed zaakceptowaniem.

**Użycie:** Widok `/generate`

**Kluczowe elementy:**
- Form z polami "Przód" i "Tył"
- Character counters
- Buttons: "Zapisz zmiany", "Anuluj"

**Behavior:**
- Focus trap
- ESC to close
- Overlay click to close

---

#### `AddFlashcardModal` / `EditFlashcardModal`
**Opis:** Modal do dodawania/edycji fiszki w widoku "Moje fiszki".

**Użycie:** Widok `/flashcards`

**Kluczowe elementy:**
- `AddFlashcardForm` / `EditFlashcardForm`
- Modal header z tytułem
- Close button (X)

---

#### `DeleteConfirmDialog`
**Opis:** Dialog potwierdzenia usunięcia fiszki.

**Użycie:** Widok `/flashcards`

**Kluczowe elementy:**
- Komunikat: "Czy na pewno chcesz usunąć tę fiszkę?"
- Buttons: "Usuń" (destructive), "Anuluj"

**Behavior:**
- Wymaga explicit confirmation
- ESC to cancel

---

#### `SessionCompleteModal`
**Opis:** Modal podsumowania sesji nauki.

**Użycie:** Widok `/study` (po zakończeniu sesji)

**Kluczowe elementy:**
- Gratulacje + statystyki (ile fiszek przejrzano)
- Buttons: "Rozpocznij nową sesję", "Powrót do fiszek"

---

### 5.7. Komponenty feedbacku

#### `Toast` (Shadcn/ui)
**Opis:** Powiadomienia typu toast dla komunikatów systemowych.

**Użycie:** Wszystkie widoki

**Typy:**
- Success (zielony): "Fiszka dodana", "Zapisano pomyślnie"
- Error (czerwony): "Błąd zapisu", "Sesja wygasła"
- Info (niebieski): "Generuję fiszki..."
- Warning (żółty): "Brak fiszek do nauki"

**Behavior:**
- Auto-dismiss (3-5 sekund)
- Manual dismiss (X button)
- Stack multiple toasts

---

#### `Spinner` / `LoadingIndicator`
**Opis:** Wskaźnik ładowania dla długotrwałych operacji.

**Użycie:** Wszystkie widoki (podczas API calls)

**Warianty:**
- Inline spinner (w przycisku)
- Full-screen overlay (generowanie fiszek)
- Skeleton loaders (ładowanie list)

---

#### `EmptyState`
**Opis:** Komunikat gdy brak danych do wyświetlenia.

**Użycie:** Widoki `/flashcards`, `/study`

**Elementy:**
- Ikona (opcjonalnie)
- Komunikat (np. "Nie masz jeszcze żadnych fiszek")
- Call-to-action button (np. "Dodaj pierwszą fiszkę")

---

### 5.8. Komponenty Shadcn/ui

Aplikacja wykorzystuje gotowe komponenty z biblioteki Shadcn/ui dla spójności i dostępności:

- `Button` - wszystkie przyciski w aplikacji
- `Input` - pola tekstowe w formularzach
- `Textarea` - pola wieloliniowe
- `Card` - kontenery dla fiszek i sekcji
- `Dialog` - modale i dialogi
- `Alert` - komunikaty inline
- `Progress` - progress bar w sesji nauki
- `Separator` - separator wizualny
- `Badge` - etykiety (np. źródło fiszki)
- `Drawer` - mobile navigation drawer

---

## 6. Mapowanie wymagań na komponenty UI

### 6.1. User Stories → Widoki → Komponenty

| User Story | Widok(i) | Kluczowe Komponenty |
|------------|----------|---------------------|
| US-001: Rejestracja | `/auth` | `RegisterForm`, `AuthLayout`, `Input`, `Button` |
| US-002: Logowanie | `/auth` | `LoginForm`, `AuthLayout`, `Input`, `Button` |
| US-003: Generowanie AI | `/generate` | `GenerationForm`, `CharacterCounter`, `Textarea`, `Button` |
| US-004: Przegląd propozycji | `/generate` | `FlashcardProposalsList`, `FlashcardProposalCard`, `ProposalActionButtons`, `EditProposalModal` |
| US-005: Edycja fiszek | `/flashcards` | `FlashcardItem`, `EditFlashcardModal`, `EditFlashcardForm` |
| US-006: Usuwanie fiszek | `/flashcards` | `FlashcardItem`, `DeleteConfirmDialog` |
| US-007: Ręczne tworzenie | `/flashcards` | `AddFlashcardModal`, `AddFlashcardForm` |
| US-008: Sesja nauki | `/study` | `FlashcardDisplay`, `RevealButton`, `RatingButtons`, `SessionCompleteModal` |
| US-009: Bezpieczeństwo | Wszystkie | Middleware, RLS, Auth Context |

### 6.2. Wymagania funkcjonalne → Implementacja UI

| Wymaganie | Implementacja UI |
|-----------|------------------|
| Walidacja 1000-10000 znaków | `CharacterCounter` + real-time validation w `GenerationForm` |
| Edycja propozycji AI | `EditProposalModal` w `/generate` |
| Filtrowanie fiszek | `FlashcardsFilters` (toggle buttons) w `/flashcards` |
| Paginacja | `Pagination` component w `/flashcards` |
| Loading states | `Spinner`, disabled states, skeleton loaders |
| Error handling | `Toast` notifications + inline error messages |
| Responsywność | Mobile-specific `MobileNav`, responsive card layouts |
| Dostępność | ARIA labels, keyboard navigation, focus management |

---

## 7. Wzorce UX i interakcji

### 7.1. Loading states
- **Krótkie operacje (< 1s)**: Disabled button + inline spinner
- **Średnie operacje (1-5s)**: Full screen overlay z spinnerem + komunikat
- **Długie operacje**: Progress bar (jeśli możliwe) + komunikat o postępie
- **Listy**: Skeleton loaders podczas ładowania

### 7.2. Error handling
- **Błędy walidacji (400)**: Inline error messages + podświetlenie pól + toast
- **Błędy serwera (500)**: Toast z ogólnym komunikatem + opcja retry
- **Błędy sieci**: Toast + offline indicator + kolejkowanie akcji
- **Session expired (401)**: Cichy refresh tokenu → jeśli fail: przekierowanie do `/auth` + toast

### 7.3. Optimistic UI
- Natychmiastowa aktualizacja UI po akcji użytkownika (np. dodanie fiszki)
- W tle: API call
- Jeśli API fail: rollback UI + toast z błędem

### 7.4. Accessibility patterns
- **Keyboard navigation**: Tab, Enter, Spacja, Arrow keys, 1-3 (shortcuts)
- **Focus management**: Auto-focus w modalach, focus trap
- **ARIA**: Labels, live regions, announcements
- **Color contrast**: WCAG AA compliance
- **Screen readers**: Descriptive labels, announcements dla zmian stanu

### 7.5. Responsive patterns
- **Desktop**: Sidebar zawsze widoczny, hover effects
- **Mobile**: Drawer menu, swipe gestures, larger touch targets
- **Breakpoints**: Tailwind standard (sm: 640px, md: 768px, lg: 1024px)

---

## 8. Bezpieczeństwo UI

### 8.1. Ochrona tras
- Middleware Astro sprawdza auth token przed renderowaniem chronionych stron
- Redirect do `/auth` jeśli brak tokenu lub wygasł
- Redirect do `/generate` jeśli zalogowany próbuje dostać się do `/auth`

### 8.2. Zarządzanie sesją
- Token JWT przechowywany w httpOnly cookie (Supabase)
- Cichy refresh mechanizm w tle
- Auto-logout po wygaśnięciu refresh tokenu
- Logout button czyści cookies i przekierowuje do `/auth`

### 8.3. Input sanitization
- Wszystkie inputy walidowane po stronie klienta
- XSS protection przez escape'owanie user input
- SQL injection protection przez ORM (Supabase)

### 8.4. HTTPS only
- Wszystkie requesty przez HTTPS
- Secure cookies

---

## 9. Metryki i monitorowanie UI

### 9.1. Kluczowe metryki UX (dla przyszłego monitorowania)
- **Time to first interaction**: Jak szybko użytkownik może zacząć korzystać z app
- **Generation success rate**: % udanych generacji AI
- **Acceptance rate**: % zaakceptowanych propozycji AI
- **Session completion rate**: % ukończonych sesji nauki
- **Error rate**: % błędów API vs total requests

### 9.2. Performance metrics
- **Page load time**: Target < 2s
- **Time to interactive**: Target < 3s
- **API response time**: Target < 1s dla większości requestów

---

## 10. Podsumowanie i priorytety implementacyjne

### 10.1. Must-have dla MVP (P0)
1. ✅ Widok uwierzytelniania (`/auth`) - logowanie + rejestracja
2. ✅ Widok generowania (`/generate`) - core feature
3. ✅ Widok fiszek (`/flashcards`) - CRUD operations
4. ✅ Widok sesji nauki (`/study`) - learning feature
5. ✅ Sidebar navigation
6. ✅ Toast notifications
7. ✅ Loading states i error handling
8. ✅ Mobile responsiveness

### 10.2. Nice-to-have dla MVP (P1)
1. Widok profilu (`/profile`) - statystyki + zarządzanie kontem
2. Keyboard shortcuts w sesji nauki
3. Animacje (flip, transitions)
4. Dark mode (opcjonalnie)

### 10.3. Post-MVP (P2)
1. Zaawansowane filtrowanie i wyszukiwanie
2. Export/import fiszek
3. Więcej statystyk i wizualizacji
4. PWA features (offline mode)
5. Collaborative features (współdzielenie)

---

## 11. Diagram architektury UI

```
┌─────────────────────────────────────────────────────────┐
│                     10x-cards UI                        │
│                   Architecture Diagram                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────────┐
│   Unauthenticated   │         │     Authenticated       │
│       Routes        │         │        Routes           │
└─────────────────────┘         └─────────────────────────┘
         │                                  │
         │                                  │
    ┌────┴────┐                    ┌────────┴────────┐
    │         │                    │                 │
    │  /auth  │                    │   AppLayout     │
    │         │                    │   (Sidebar)     │
    │ ┌───────┴─────────┐          │                 │
    │ │ AuthLayout      │          ├─────────────────┤
    │ │  - LoginForm    │          │                 │
    │ │  - RegisterForm │          │  /generate      │
    │ └─────────────────┘          │  /flashcards    │
    │                              │  /study         │
    └──────────────────────────────┤  /profile       │
                                   │                 │
                                   └─────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Component Hierarchy                     │
└─────────────────────────────────────────────────────────┘

AppLayout
├── Sidebar (Desktop) / MobileNav (Mobile)
│   ├── Logo
│   ├── NavLinks
│   │   ├── Generuj → /generate
│   │   ├── Moje fiszki → /flashcards
│   │   ├── Sesja nauki → /study
│   │   └── Profil → /profile
│   └── UserSection (Logout)
│
└── ContentArea
    ├── PageHeader
    ├── PageContent
    │   ├── [Page-specific components]
    │   ├── Modals
    │   └── Dialogs
    └── ToastContainer

┌─────────────────────────────────────────────────────────┐
│                   State Management                       │
└─────────────────────────────────────────────────────────┘

AuthContext (useContext)
├── user: User | null
├── loading: boolean
├── login(email, password)
├── register(email, password)
└── logout()

GenerationContext (useContext) [dla /generate]
├── proposals: FlashcardProposal[]
├── acceptedIds: string[]
├── rejectedIds: string[]
├── editedProposals: Map<string, FlashcardProposal>
├── acceptProposal(id)
├── rejectProposal(id)
└── editProposal(id, data)

Local State (useState) w każdym widoku/komponencie
└── Loading states, form data, UI state, etc.

┌─────────────────────────────────────────────────────────┐
│                     API Integration                      │
└─────────────────────────────────────────────────────────┘

UI Layer
    ↓ (API calls via fetch/axios)
API Endpoints (/api/*)
    ↓ (Astro endpoints)
Supabase Client
    ↓
Supabase Backend
    ↓
Database (PostgreSQL)
```

---

## 12. Uwagi końcowe

Architektura UI dla aplikacji 10x-cards została zaprojektowana z myślą o:

1. **Prostocie**: Minimalistyczny interfejs skupiony na kluczowych funkcjach MVP
2. **Intuicyjności**: Jasne przepływy użytkownika i przewidywalne interakcje
3. **Dostępności**: WCAG AA compliance poprzez Shadcn/ui i best practices
4. **Responsywności**: Pełne wsparcie dla desktop i mobile
5. **Skalowalności**: Modularna struktura komponentów umożliwiająca łatwe rozszerzanie
6. **Bezpieczeństwie**: Auth middleware, RLS, input validation

Kolejne kroki implementacji powinny następować w tej kolejności:
1. Setup projektu (Astro + React + Tailwind + Shadcn/ui)
2. Implementacja Auth UI i integracji z Supabase
3. Layout components (AppLayout, Sidebar, MobileNav)
4. Widok generowania (core feature)
5. Widok fiszek (CRUD)
6. Widok sesji nauki
7. Optymalizacja i testy dostępności
8. (Opcjonalnie) Widok profilu

Architektura jest zgodna z PRD, planem API i decyzjami z sesji planowania.

