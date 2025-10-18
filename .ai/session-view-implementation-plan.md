# Plan implementacji widoku sesji nauki

## 1. Przegląd

Widok sesji nauki (`/session`) umożliwia użytkownikom przeprowadzenie sesji powtórek z fiszkami zgodnie z algorytmem spaced repetition (SM-2). Użytkownik przegląda fiszki wyznaczone przez algorytm do powtórzenia, ocenia swoją znajomość materiału, a system automatycznie aktualizuje stan nauki i harmonogram przyszłych powtórek.

Główne cele widoku:
- Prezentacja fiszek wymagających powtórzenia zgodnie z algorytmem
- Umożliwienie użytkownikowi oceny swojej znajomości materiału (4 poziomy: Again, Hard, Good, Easy)
- Śledzenie postępu w ramach sesji
- Automatyczne przejście do kolejnej fiszki po ocenie
- Wyświetlenie podsumowania po zakończeniu sesji

## 2. Routing widoku

**Ścieżka:** `/session`

**Wymagania:**
- Dostęp tylko dla zalogowanych użytkowników
- Przekierowanie do `/login` dla niezalogowanych użytkowników
- Implementacja jako strona Astro z zagnieżdżonym interaktywnym komponentem React

**Struktura plików:**
```
src/pages/session.astro          # Główna strona widoku
src/components/learning/         # Folder dla komponentów sesji nauki
  ├── LearningSession.tsx        # Główny komponent React
  ├── FlashcardDisplay.tsx       # Komponent wyświetlania fiszki
  ├── RatingButtons.tsx          # Przyciski oceny
  ├── SessionProgress.tsx        # Wskaźnik postępu
  └── SessionComplete.tsx        # Ekran zakończenia sesji
src/components/hooks/
  └── useLearningSession.ts      # Custom hook dla logiki sesji
```

## 3. Struktura komponentów

```
session.astro (Strona Astro)
│
└── LearningSession.tsx (React - client:load)
    │
    ├── SessionProgress.tsx
    │   └── Wskaźnik: X / Y fiszek, typ fiszek (nowe/powtórki)
    │
    ├── FlashcardDisplay.tsx
    │   ├── Card (shadcn/ui)
    │   │   ├── Przód fiszki (zawsze widoczny)
    │   │   └── Tył fiszki (po odkryciu)
    │   └── Button "Pokaż odpowiedź" (przed odkryciem)
    │
    ├── RatingButtons.tsx (widoczne po odkryciu)
    │   ├── Button "Powtórz" (rating: 0 - again)
    │   ├── Button "Trudne" (rating: 1 - hard)
    │   ├── Button "Dobre" (rating: 2 - good)
    │   └── Button "Łatwe" (rating: 3 - easy)
    │
    └── SessionComplete.tsx (po zakończeniu sesji)
        ├── Podsumowanie sesji
        ├── Statystyki
        └── Przyciski nawigacji
```

## 4. Szczegóły komponentów

### 4.1. LearningSession.tsx

**Opis:**
Główny komponent zarządzający całą sesją nauki. Odpowiada za pobranie fiszek z API, zarządzanie stanem sesji, obsługę przejść między fiszkami oraz koordynację komunikacji między komponentami potomnymi.

**Główne elementy:**
- Container `<div>` z Tailwind classes dla layoutu
- Warunkowe renderowanie: loading state, error state, session content, completion state
- Komponenty potomne: `<SessionProgress>`, `<FlashcardDisplay>`, `<RatingButtons>`, `<SessionComplete>`
- Alert component (shadcn/ui) dla komunikatów o błędach

**Obsługiwane interakcje:**
- Inicjalizacja sesji (pobieranie danych z API przy mount)
- Odkrywanie odpowiedzi fiszki (zmiana stanu `isCardRevealed`)
- Przesyłanie oceny (wywołanie API review)
- Przejście do kolejnej fiszki (zmiana `currentCardIndex`)
- Ponowne rozpoczęcie sesji (reset stanu, nowe wywołanie API)
- Opuszczenie sesji (nawigacja do innych widoków)

**Obsługiwana walidacja:**
- Weryfikacja uwierzytelnienia użytkownika (wykonana na poziomie strony Astro)
- Sprawdzenie, czy sesja zawiera fiszki (obsługa pustej sesji)
- Walidacja indeksu bieżącej fiszki (zapobieganie out-of-bounds)
- Weryfikacja, czy fiszka została odkryta przed wysłaniem oceny (UI enforcement)

**Typy:**
- `LearningSessionResponseDto` - dane sesji z API
- `FlashcardWithLearningStateDto` - pojedyncza fiszka ze stanem nauki
- `ReviewSubmitCommand` - dane do wysłania oceny
- `ReviewResponseDto` - odpowiedź z API po przesłaniu oceny

**Propsy:**
```typescript
interface LearningSessionProps {
  // Brak propsów - komponent samodzielnie pobiera dane
}
```

**Stan wewnętrzny:**
```typescript
{
  session: LearningSessionResponseDto | null;
  currentCardIndex: number;
  isCardRevealed: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### 4.2. FlashcardDisplay.tsx

**Opis:**
Komponent odpowiedzialny za wyświetlanie pojedynczej fiszki. Prezentuje przód fiszki oraz, po interakcji użytkownika, jej tył. Wykorzystuje komponenty Card z shadcn/ui dla spójnego wyglądu.

**Główne elementy:**
- `<Card>` (shadcn/ui) jako kontener
- `<CardHeader>` z etykietą "Pytanie" lub "Pytanie i Odpowiedź"
- `<CardContent>` z treścią przodu fiszki
- Warunkowe renderowanie `<CardContent>` z treścią tyłu fiszki (po odkryciu)
- `<Button>` "Pokaż odpowiedź" (przed odkryciem)
- Opcjonalnie: ikony, animacje przejścia

**Obsługiwane interakcje:**
- Kliknięcie przycisku "Pokaż odpowiedź" -> wywołanie `onReveal`
- Animacja flip/fade przy odkrywaniu odpowiedzi

**Obsługiwana walidacja:**
- Sprawdzenie, czy fiszka została przekazana (defensive programming)
- Walidacja obecności pól `front` i `back`

**Typy:**
- `FlashcardWithLearningStateDto` - dane fiszki

**Propsy:**
```typescript
interface FlashcardDisplayProps {
  flashcard: FlashcardWithLearningStateDto;
  isRevealed: boolean;
  onReveal: () => void;
}
```

### 4.3. RatingButtons.tsx

**Opis:**
Komponent renderujący cztery przyciski oceny (Again, Hard, Good, Easy), które pozwalają użytkownikowi ocenić swoją znajomość materiału. Przyciski są widoczne tylko po odkryciu odpowiedzi i są wyłączone podczas przesyłania oceny.

**Główne elementy:**
- Kontener `<div>` z grid/flex layout (Tailwind)
- 4 komponenty `<Button>` (shadcn/ui) z różnymi wariantami kolorystycznymi:
  - "Powtórz" (Again) - czerwony/destructive - rating: 0
  - "Trudne" (Hard) - pomarańczowy/warning - rating: 1
  - "Dobre" (Good) - zielony/success - rating: 2
  - "Łatwe" (Easy) - niebieski/primary - rating: 3
- Każdy przycisk z ikoną (opcjonalnie) i tekstem
- Loading spinner podczas `isSubmitting`

**Obsługiwane interakcje:**
- Kliknięcie dowolnego przycisku oceny -> wywołanie `onRate(ratingValue)`
- Wyłączenie przycisków podczas `isSubmitting`
- Hover effects, focus states dla dostępności

**Obsługiwana walidacja:**
- Przekazywanie poprawnej wartości rating (0-3) do handlera
- Walidacja typu `RatingValue` na poziomie TypeScript
- Sprawdzenie, czy `onRate` został przekazany (defensive programming)

**Typy:**
- `RatingValue` - typ (0 | 1 | 2 | 3)
- `RATING_MAP` - mapowanie nazw na wartości

**Propsy:**
```typescript
interface RatingButtonsProps {
  onRate: (rating: RatingValue) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}
```

### 4.4. SessionProgress.tsx

**Opis:**
Komponent wyświetlający postęp użytkownika w bieżącej sesji. Pokazuje numer aktualnej fiszki, całkowitą liczbę fiszek w sesji oraz informacje o typach fiszek (nowe vs powtórki).

**Główne elementy:**
- Kontener `<div>` z informacjami o sesji
- Tekst: "Fiszka X z Y"
- Progress bar (shadcn/ui Progress component)
- Ikony i etykiety dla nowych fiszek i powtórek
- Opcjonalnie: licznik czasu sesji

**Obsługiwane interakcje:**
- Brak bezpośrednich interakcji (komponent prezentacyjny)
- Aktualizacja wizualna przy zmianie `currentCard`

**Obsługiwana walidacja:**
- Sprawdzenie, czy `currentCard` <= `totalCards`
- Walidacja, że liczby są dodatnie

**Typy:**
- Prymitywne typy (number)

**Propsy:**
```typescript
interface SessionProgressProps {
  currentCard: number;      // 1-indexed dla UI
  totalCards: number;
  newCards: number;
  reviewCards: number;
}
```

### 4.5. SessionComplete.tsx

**Opis:**
Komponent wyświetlany po zakończeniu sesji nauki. Prezentuje podsumowanie sesji, gratulacje oraz opcje dalszych działań (nowa sesja, powrót do dashboardu, przegląd statystyk).

**Główne elementy:**
- `<Card>` (shadcn/ui) jako kontener
- Nagłówek z gratulacjami i ikoną sukcesu
- Podsumowanie: liczba przejrzanych fiszek
- Statystyki sesji (opcjonalnie)
- Przyciski akcji:
  - "Rozpocznij nową sesję"
  - "Wróć do listy fiszek"
  - "Zobacz statystyki"

**Obsługiwane interakcje:**
- Kliknięcie "Rozpocznij nową sesję" -> wywołanie `onRestartSession`
- Kliknięcie "Wróć do listy fiszek" -> nawigacja do `/flashcards`
- Kliknięcie "Zobacz statystyki" -> nawigacja do widoku statystyk (przyszła funkcjonalność)

**Obsługiwana walidacja:**
- Walidacja, że sesja rzeczywiście się zakończyła
- Sprawdzenie dostępności akcji (czy możliwa jest nowa sesja)

**Typy:**
- Prymitywne typy dla statystyk

**Propsy:**
```typescript
interface SessionCompleteProps {
  totalReviewed: number;
  onRestartSession: () => void;
}
```

## 5. Typy

### 5.1. Typy z types.ts (już zdefiniowane)

**LearningSessionResponseDto**
```typescript
interface LearningSessionResponseDto {
  session_id: string;              // UUID sesji dla tracking
  flashcards: FlashcardWithLearningStateDto[];  // Fiszki do nauki
  total_due: number;               // Całkowita liczba fiszek do powtórki
  new_cards: number;               // Liczba nowych fiszek
  review_cards: number;            // Liczba fiszek do powtórki
}
```

**FlashcardWithLearningStateDto**
```typescript
interface FlashcardWithLearningStateDto extends FlashcardDto {
  learning_state: LearningStateDto;
}

// Gdzie:
interface FlashcardDto {
  id: number;
  front: string;                   // Przód fiszki (pytanie)
  back: string;                    // Tył fiszki (odpowiedź)
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
  created_at: string;              // ISO 8601
  updated_at: string;              // ISO 8601
}

interface LearningStateDto {
  id: number;
  flashcard_id: number;
  status: LearningStatus;          // 'new' | 'learning' | 'review' | 'relearning'
  easiness_factor: number;         // SM-2 easiness factor
  interval: number;                // Interwał w dniach
  repetitions: number;             // Liczba poprawnych powtórzeń
  lapses: number;                  // Liczba zapomnianych
  next_review_date: string;        // ISO 8601
}
```

**ReviewSubmitCommand**
```typescript
interface ReviewSubmitCommand {
  flashcard_id: number;            // ID fiszki do oceny
  rating: RatingValue;             // Ocena: 0 | 1 | 2 | 3
  review_duration_ms?: number;     // Opcjonalny czas recenzji w ms
}
```

**ReviewResponseDto**
```typescript
interface ReviewResponseDto {
  flashcard_id: number;
  previous_state: {
    status: LearningStatus;
    easiness_factor: number;
    interval: number;
    repetitions: number;
    next_review_date: string;
  };
  new_state: {
    status: LearningStatus;
    easiness_factor: number;
    interval: number;
    repetitions: number;
    next_review_date: string;
  };
  review_recorded: boolean;
}
```

**RatingValue i RATING_MAP**
```typescript
type RatingValue = 0 | 1 | 2 | 3;

const RATING_MAP = {
  again: 0,  // Nie pamiętam, powtórz
  hard: 1,   // Trudne
  good: 2,   // Dobre
  easy: 3,   // Łatwe
} as const;
```

### 5.2. Nowe typy ViewModels (do zdefiniowania)

**SessionState** (wewnętrzny stan komponentu LearningSession)
```typescript
interface SessionState {
  session: LearningSessionResponseDto | null;
  currentCardIndex: number;        // 0-indexed, pozycja w tablicy flashcards
  isCardRevealed: boolean;         // Czy tył fiszki jest widoczny
  isSubmitting: boolean;           // Czy trwa wysyłanie oceny
  isLoading: boolean;              // Czy trwa ładowanie sesji
  error: string | null;            // Komunikat błędu (jeśli wystąpił)
}
```

**SessionError** (typy błędów)
```typescript
type SessionError = 
  | { type: 'NO_CARDS_DUE'; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'UNAUTHORIZED'; message: string }
  | { type: 'UNKNOWN'; message: string };
```

## 6. Zarządzanie stanem

### 6.1. Stan lokalny w LearningSession.tsx

Komponent `LearningSession` zarządza całym stanem sesji przy użyciu React hooks:

```typescript
const [session, setSession] = useState<LearningSessionResponseDto | null>(null);
const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
const [isCardRevealed, setIsCardRevealed] = useState<boolean>(false);
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
```

### 6.2. Custom Hook: useLearningSession (zalecane)

Dla lepszej organizacji kodu i możliwości ponownego użycia, logika sesji może być wydzielona do custom hooka:

**Lokalizacja:** `src/components/hooks/useLearningSession.ts`

**Interfejs:**
```typescript
interface UseLearningSessionReturn {
  // Stan
  session: LearningSessionResponseDto | null;
  currentCard: FlashcardWithLearningStateDto | null;
  currentCardIndex: number;
  isCardRevealed: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  isSessionComplete: boolean;
  
  // Akcje
  fetchSession: (params?: LearningSessionQueryParams) => Promise<void>;
  revealCard: () => void;
  submitRating: (rating: RatingValue) => Promise<void>;
  restartSession: () => Promise<void>;
}

function useLearningSession(): UseLearningSessionReturn {
  // Implementacja zarządzania stanem i logiki
}
```

**Odpowiedzialności hooka:**
- Pobieranie sesji z API przy inicjalizacji
- Zarządzanie indeksem bieżącej fiszki
- Obsługa odkrywania odpowiedzi
- Wysyłanie oceny do API
- Automatyczne przejście do kolejnej fiszki po ocenie
- Wykrywanie zakończenia sesji
- Obsługa błędów i stanów ładowania
- Śledzenie czasu rozpoczęcia wyświetlenia fiszki (dla review_duration_ms)

### 6.3. Przepływ stanu

1. **Inicjalizacja:**
   - `isLoading = true`
   - Wywołanie `GET /api/learning/session`
   - Po sukcesie: `session = data, isLoading = false, currentCardIndex = 0`
   - Po błędzie: `error = message, isLoading = false`

2. **Odkrywanie fiszki:**
   - User klika "Pokaż odpowiedź"
   - `isCardRevealed = true`

3. **Ocena fiszki:**
   - User klika przycisk oceny (np. "Dobre")
   - `isSubmitting = true`
   - Wywołanie `POST /api/learning/review` z `flashcard_id` i `rating`
   - Po sukcesie:
     - `isSubmitting = false`
     - `currentCardIndex++`
     - `isCardRevealed = false`
     - Jeśli `currentCardIndex >= session.flashcards.length`: sesja zakończona
   - Po błędzie:
     - `isSubmitting = false`
     - `error = message`
     - Pozostanie na bieżącej fiszce, możliwość ponowienia

4. **Zakończenie sesji:**
   - `currentCardIndex >= session.flashcards.length`
   - Wyświetlenie komponentu `SessionComplete`

## 7. Integracja API

### 7.1. GET /api/learning/session

**Cel:** Pobranie fiszek do nauki w ramach bieżącej sesji.

**Wywołanie:**
```typescript
const fetchSession = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/learning/session?limit=20&include_new=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Przekierowanie do logowania
        window.location.href = '/login';
        return;
      }
      if (response.status === 404) {
        // Brak fiszek do powtórki
        const data = await response.json();
        setError(data.message || 'Brak fiszek do powtórki');
        return;
      }
      throw new Error('Nie udało się pobrać sesji');
    }
    
    const data: LearningSessionResponseDto = await response.json();
    setSession(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Wystąpił błąd');
  } finally {
    setIsLoading(false);
  }
};
```

**Typ żądania:** Brak body (GET)

**Typ odpowiedzi:** `LearningSessionResponseDto`

**Query parametry (opcjonalne):**
- `limit` (default: 20) - maksymalna liczba fiszek w sesji
- `status` - filtrowanie po statusie ('new' | 'learning' | 'review' | 'relearning')
- `include_new` (default: true) - czy uwzględniać nowe fiszki

**Obsługa odpowiedzi:**
- **200 OK:** Sesja pobrana pomyślnie, zapisanie w `session`
- **401 Unauthorized:** Przekierowanie do `/login`
- **404 Not Found:** Brak fiszek do powtórki, wyświetlenie komunikatu
- **500 Server Error:** Wyświetlenie komunikatu o błędzie, możliwość ponowienia

### 7.2. POST /api/learning/review

**Cel:** Przesłanie oceny użytkownika dla fiszki i aktualizacja stanu nauki.

**Wywołanie:**
```typescript
const submitRating = async (rating: RatingValue) => {
  if (!session || !session.flashcards[currentCardIndex]) {
    return;
  }
  
  setIsSubmitting(true);
  setError(null);
  
  const flashcard = session.flashcards[currentCardIndex];
  const reviewCommand: ReviewSubmitCommand = {
    flashcard_id: flashcard.id,
    rating: rating,
    review_duration_ms: calculateReviewDuration(), // Opcjonalne
  };
  
  try {
    const response = await fetch('/api/learning/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewCommand),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (response.status === 404) {
        throw new Error('Fiszka nie została znaleziona');
      }
      throw new Error('Nie udało się zapisać oceny');
    }
    
    const result: ReviewResponseDto = await response.json();
    
    // Przejście do kolejnej fiszki
    setCurrentCardIndex(prev => prev + 1);
    setIsCardRevealed(false);
    
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Wystąpił błąd');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Typ żądania:** `ReviewSubmitCommand`
```typescript
{
  flashcard_id: number;
  rating: 0 | 1 | 2 | 3;
  review_duration_ms?: number;
}
```

**Typ odpowiedzi:** `ReviewResponseDto`
```typescript
{
  flashcard_id: number;
  previous_state: { ... };
  new_state: { ... };
  review_recorded: boolean;
}
```

**Obsługa odpowiedzi:**
- **200 OK:** Ocena zapisana, przejście do kolejnej fiszki
- **400 Bad Request:** Nieprawidłowe dane (nie powinno wystąpić przy prawidłowej walidacji UI)
- **401 Unauthorized:** Przekierowanie do `/login`
- **404 Not Found:** Fiszka nie istnieje lub nie należy do użytkownika
- **500 Server Error:** Wyświetlenie błędu, pozostanie na bieżącej fiszce, możliwość ponowienia

### 7.3. Śledzenie czasu przeglądu (review_duration_ms)

Opcjonalnie, można śledzić czas spędzony na przeglądzie fiszki:

```typescript
const [cardStartTime, setCardStartTime] = useState<number>(Date.now());

// Przy przejściu do nowej fiszki:
const moveToNextCard = () => {
  setCurrentCardIndex(prev => prev + 1);
  setIsCardRevealed(false);
  setCardStartTime(Date.now()); // Reset czasu
};

// Przy wysyłaniu oceny:
const calculateReviewDuration = () => {
  return Date.now() - cardStartTime;
};
```

## 8. Interakcje użytkownika

### 8.1. Rozpoczęcie sesji

**Trigger:** Użytkownik nawiguje do `/session`

**Przepływ:**
1. Sprawdzenie uwierzytelnienia (middleware Astro)
2. Jeśli niezalogowany: przekierowanie do `/login`
3. Jeśli zalogowany: załadowanie strony `session.astro`
4. Montowanie komponentu `<LearningSession>`
5. Automatyczne wywołanie `fetchSession()` w `useEffect`
6. Wyświetlenie loading state (spinner lub skeleton)
7. Po pobraniu danych: wyświetlenie pierwszej fiszki

**UI feedback:**
- Loading spinner z komunikatem "Przygotowuję sesję..."
- Skeleton loader dla layoutu fiszki

### 8.2. Wyświetlenie fiszki

**Stan początkowy:**
- Widoczny przód fiszki (pole `front`)
- Przycisk "Pokaż odpowiedź"
- Brak przycisków oceny
- Wskaźnik postępu: "Fiszka 1 z 10"

**Elementy UI:**
- Card z pytaniem w dużej, czytelnej czcionce
- Wyraźny przycisk "Pokaż odpowiedź" w centrum lub na dole
- Minimalistyczny design, brak rozpraszaczy

### 8.3. Odkrywanie odpowiedzi

**Trigger:** Użytkownik klika "Pokaż odpowiedź"

**Przepływ:**
1. Wywołanie `revealCard()`
2. Zmiana stanu: `isCardRevealed = true`
3. Animacja odkrycia (fade in / slide down)
4. Wyświetlenie tyłu fiszki (pole `back`)
5. Wyświetlenie 4 przycisków oceny

**UI feedback:**
- Płynna animacja CSS transition (np. fade in 200-300ms)
- Tył fiszki pojawia się pod spodem przodu (nie zastępuje, tylko rozszerza)
- Przyciski oceny pojawiają się z lekkim opóźnieniem (stagger animation)

### 8.4. Ocena fiszki

**Trigger:** Użytkownik klika jeden z przycisków oceny

**Dostępne opcje:**
- **"Powtórz" (Again - 0):** Nie pamiętam odpowiedzi, chcę zobaczyć tę fiszkę ponownie wkrótce
- **"Trudne" (Hard - 1):** Pamiętam, ale z trudnością
- **"Dobre" (Good - 2):** Pamiętam dobrze
- **"Łatwe" (Easy - 3):** Pamiętam bardzo łatwo

**Przepływ:**
1. Użytkownik klika przycisk (np. "Dobre")
2. Wywołanie `submitRating(2)`
3. Zmiana stanu: `isSubmitting = true`
4. Wyłączenie wszystkich przycisków oceny
5. Wyświetlenie loadera na klikniętym przycisku
6. Wysłanie `POST /api/learning/review` z `rating: 2`
7. Po sukcesie:
   - `isSubmitting = false`
   - Krótka animacja przejścia (opcjonalnie)
   - Przejście do kolejnej fiszki lub ekranu zakończenia
8. Po błędzie:
   - `isSubmitting = false`
   - Wyświetlenie komunikatu błędu
   - Możliwość ponowienia oceny

**UI feedback:**
- Kliknięty przycisk pokazuje spinner
- Pozostałe przyciski są wyszarzone (disabled)
- Po sukcesie: krótka animacja (np. checkmark) i przejście
- Po błędzie: Alert z komunikatem i przyciskiem "Spróbuj ponownie"

### 8.5. Przejście do kolejnej fiszki

**Automatyczne po ocenie:**
1. Zmiana `currentCardIndex++`
2. Reset `isCardRevealed = false`
3. Wyświetlenie przodu nowej fiszki
4. Aktualizacja wskaźnika postępu: "Fiszka 2 z 10"
5. Płynna animacja przejścia między fiszkami (opcjonalnie)

**UI feedback:**
- Slide/fade animation przy zmianie fiszki
- Aktualizacja progress bar
- Zachowanie spójnego layoutu między fiszkami

### 8.6. Zakończenie sesji

**Trigger:** `currentCardIndex >= session.flashcards.length`

**Przepływ:**
1. Wykrycie zakończenia sesji
2. Renderowanie komponentu `<SessionComplete>`
3. Wyświetlenie podsumowania:
   - "Gratulacje! Ukończyłeś sesję!"
   - "Przejrzałeś X fiszek"
   - Opcjonalnie: statystyki (ile ocen każdego typu)

**Dostępne akcje:**
- "Rozpocznij nową sesję" -> ponowne wywołanie `fetchSession()`
- "Wróć do moich fiszek" -> nawigacja do `/flashcards`
- "Zobacz statystyki" -> nawigacja do widoku statystyk (future)

**UI feedback:**
- Animacja sukcesu (confetti, checkmark)
- Wyraźne przyciski akcji
- Pozytywny, motywujący komunikat

### 8.7. Opuszczenie sesji

**Trigger:** Użytkownik klika przycisk powrotu lub nawiguje poza `/session`

**Zachowanie:**
- Sesja jest zachowana po stronie serwera (stan nauki)
- Użytkownik może wrócić i kontynuować z tego miejsca (nowe wywołanie API zwróci aktualne fiszki do nauki)
- Brak lokalnego state persistence - każde odwiedzenie `/session` to nowa sesja

## 9. Warunki i walidacja

### 9.1. Walidacja uwierzytelnienia

**Gdzie:** Strona `session.astro` (server-side)

**Warunek:**
```typescript
const user = Astro.locals.user;
if (!user) {
  return Astro.redirect('/login');
}
```

**Wpływ na UI:** Brak dostępu do widoku dla niezalogowanych użytkowników

### 9.2. Walidacja dostępności sesji

**Gdzie:** Komponent `LearningSession` po pobraniu danych

**Warunek:** Sprawdzenie, czy API zwróciło fiszki
```typescript
if (session.flashcards.length === 0) {
  // Wyświetlenie komunikatu: "Brak fiszek do powtórki"
  // + link do widoku generowania lub listy fiszek
}
```

**Wpływ na UI:** Wyświetlenie przyjaznego komunikatu zamiast pustego widoku

### 9.3. Walidacja odkrycia fiszki przed oceną

**Gdzie:** Komponent `LearningSession` i `RatingButtons`

**Warunek:** Przyciski oceny są renderowane tylko gdy `isCardRevealed === true`
```typescript
{isCardRevealed && (
  <RatingButtons 
    onRate={submitRating} 
    isSubmitting={isSubmitting}
  />
)}
```

**Wpływ na UI:** User nie może ocenić fiszki bez zobaczenia odpowiedzi

### 9.4. Walidacja wartości rating

**Gdzie:** Funkcja `submitRating`, komponenty przycisków

**Warunek:** TypeScript type guard dla `RatingValue`
```typescript
const submitRating = (rating: RatingValue) => {
  // TypeScript zapewnia, że rating jest 0 | 1 | 2 | 3
  if (rating < 0 || rating > 3) {
    console.error('Invalid rating value');
    return;
  }
  // ...
}
```

**Wpływ na UI:** Tylko poprawne wartości są wysyłane do API

### 9.5. Walidacja indeksu fiszki

**Gdzie:** Komponent `LearningSession` przed renderowaniem

**Warunek:**
```typescript
const currentCard = session?.flashcards[currentCardIndex];
if (!currentCard) {
  // Sesja zakończona lub błąd
  return <SessionComplete />;
}
```

**Wpływ na UI:** Ochrona przed out-of-bounds errors

### 9.6. Walidacja podczas przesyłania oceny

**Gdzie:** Komponent `RatingButtons`

**Warunek:** Przyciski są disabled podczas `isSubmitting`
```typescript
<Button 
  disabled={isSubmitting}
  onClick={() => onRate(2)}
>
  {isSubmitting ? <Spinner /> : 'Dobre'}
</Button>
```

**Wpływ na UI:** Zapobieganie wielokrotnemu wysłaniu tej samej oceny

## 10. Obsługa błędów

### 10.1. Błąd pobierania sesji (GET /api/learning/session)

**Scenariusze:**
- **401 Unauthorized:** Wygasła sesja użytkownika
  - **Obsługa:** Automatyczne przekierowanie do `/login`
  
- **404 Not Found:** Brak fiszek do nauki
  - **Obsługa:** Wyświetlenie przyjaznego komunikatu:
    ```
    "Nie masz fiszek do powtórki!"
    "Wszystkie fiszki są aktualne. Wróć później lub dodaj nowe fiszki."
    [Przycisk: "Dodaj fiszki"] [Przycisk: "Generuj z AI"]
    ```
  
- **500 Server Error:** Błąd serwera
  - **Obsługa:** Wyświetlenie komunikatu:
    ```
    "Wystąpił problem z załadowaniem sesji."
    [Przycisk: "Spróbuj ponownie"]
    ```
  
- **Network Error:** Brak połączenia
  - **Obsługa:** Wyświetlenie komunikatu:
    ```
    "Brak połączenia z internetem."
    [Przycisk: "Spróbuj ponownie"]
    ```

**Implementacja:**
```typescript
if (error) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <AlertCircle className="w-16 h-16 text-destructive" />
      <h2 className="text-2xl font-bold">Ups! Coś poszło nie tak</h2>
      <p className="text-muted-foreground">{error}</p>
      <Button onClick={fetchSession}>Spróbuj ponownie</Button>
    </div>
  );
}
```

### 10.2. Błąd przesyłania oceny (POST /api/learning/review)

**Scenariusze:**
- **400 Bad Request:** Nieprawidłowe dane (teoretycznie niemożliwe przy prawidłowej implementacji)
  - **Obsługa:** Logowanie błędu, komunikat "Wystąpił nieoczekiwany błąd"
  
- **401 Unauthorized:** Wygasła sesja
  - **Obsługa:** Przekierowanie do `/login`
  
- **404 Not Found:** Fiszka nie istnieje lub nie należy do użytkownika
  - **Obsługa:** Komunikat błędu, możliwość pominięcia fiszki
  
- **500 Server Error:** Błąd serwera
  - **Obsługa:** 
    ```
    "Nie udało się zapisać oceny."
    [Przycisk: "Spróbuj ponownie"] [Przycisk: "Pomiń"]
    ```

**Implementacja:**
```typescript
try {
  await submitReview(...);
} catch (error) {
  setError(error.message);
  // Pozostanie na bieżącej fiszce
  // Użytkownik może spróbować ponownie lub pominąć (opcjonalne)
}
```

### 10.3. Przypadki brzegowe

**Pusta sesja:**
- **Gdy:** API zwraca `flashcards: []`
- **Obsługa:** Wyświetlenie ekranu "Brak fiszek do nauki" (jak 404)

**Jedna fiszka w sesji:**
- **Gdy:** `session.flashcards.length === 1`
- **Obsługa:** Po ocenie natychmiastowe przejście do `SessionComplete`

**Przerwa w trakcie sesji:**
- **Gdy:** Użytkownik opuszcza `/session` w trakcie
- **Obsługa:** Stan nauki jest zachowany po stronie serwera, przy następnym wejściu otrzyma zaktualizowaną listę fiszek

**Wolne połączenie:**
- **Gdy:** API odpowiada wolno
- **Obsługa:** 
  - Timeout dla fetch (np. 30s)
  - Loading indicators
  - Możliwość anulowania i ponowienia

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików
```
src/pages/session.astro
src/components/learning/LearningSession.tsx
src/components/learning/FlashcardDisplay.tsx
src/components/learning/RatingButtons.tsx
src/components/learning/SessionProgress.tsx
src/components/learning/SessionComplete.tsx
src/components/hooks/useLearningSession.ts
```

### Krok 2: Implementacja strony session.astro
- Sprawdzenie uwierzytelnienia w middleware/server-side
- Przekierowanie do `/login` jeśli niezalogowany
- Renderowanie layoutu z komponentem `<LearningSession client:load>`
- Dodanie podstawowych meta tagów (title, description)

### Krok 3: Implementacja custom hooka useLearningSession.ts
- Zdefiniowanie wszystkich potrzebnych stanów
- Implementacja `fetchSession()` - wywołanie GET /api/learning/session
- Implementacja `revealCard()` - zmiana stanu odkrycia
- Implementacja `submitRating()` - wywołanie POST /api/learning/review
- Implementacja logiki przejścia do kolejnej fiszki
- Implementacja wykrywania zakończenia sesji
- Obsługa błędów dla wszystkich operacji API
- Export interfejsu hooka

### Krok 4: Implementacja komponentu LearningSession.tsx
- Użycie hooka `useLearningSession()`
- Implementacja warunkowego renderowania:
  - Loading state (isLoading === true)
  - Error state (error !== null)
  - Empty state (no cards due)
  - Session content (sesja aktywna)
  - Complete state (sesja zakończona)
- Montowanie komponentów potomnych z odpowiednimi propsami
- Styling layoutu z Tailwind CSS
- Responsywność (mobile-first)

### Krok 5: Implementacja komponentu SessionProgress.tsx
- Przyjęcie propsów: currentCard, totalCards, newCards, reviewCards
- Wyświetlenie licznika: "Fiszka X z Y"
- Implementacja progress bar (shadcn/ui Progress)
- Wyświetlenie informacji o typach fiszek
- Styling z Tailwind
- Responsywność

### Krok 6: Implementacja komponentu FlashcardDisplay.tsx
- Przyjęcie propsów: flashcard, isRevealed, onReveal
- Użycie Card, CardHeader, CardContent z shadcn/ui
- Warunkowe renderowanie tyłu fiszki (gdy isRevealed)
- Renderowanie przycisku "Pokaż odpowiedź" (gdy !isRevealed)
- Implementacja animacji przejścia (CSS transitions)
- Styling z Tailwind
- Responsywność - czytelna czcionka, odpowiednie odstępy

### Krok 7: Implementacja komponentu RatingButtons.tsx
- Przyjęcie propsów: onRate, isSubmitting, disabled
- Renderowanie 4 przycisków z Button (shadcn/ui):
  - "Powtórz" (Again) - wariant destructive, rating: 0
  - "Trudne" (Hard) - wariant secondary/warning, rating: 1
  - "Dobre" (Good) - wariant default/success, rating: 2
  - "Łatwe" (Easy) - wariant primary, rating: 3
- Obsługa kliknięcia - wywołanie onRate z odpowiednim RatingValue
- Wyświetlenie loadera podczas isSubmitting
- Wyłączenie przycisków podczas isSubmitting
- Layout: grid 2x2 lub flex row
- Responsywność - duże, łatwe do kliknięcia przyciski
- Opcjonalnie: ikony dla każdego przycisku

### Krok 8: Implementacja komponentu SessionComplete.tsx
- Przyjęcie propsów: totalReviewed, onRestartSession
- Wyświetlenie komunikatu gratulacyjnego
- Wyświetlenie podsumowania sesji
- Renderowanie przycisków akcji:
  - "Rozpocznij nową sesję" -> onRestartSession()
  - "Wróć do moich fiszek" -> nawigacja do /flashcards
- Opcjonalnie: animacja sukcesu (confetti)
- Styling z Tailwind
- Layout na środku ekranu

### Krok 9: Stylowanie i responsywność
- Dostosowanie wszystkich komponentów do różnych rozmiarów ekranu
- Mobile-first approach
- Breakpoints: sm, md, lg
- Touch-friendly przyciski (min. 44x44px)
- Czytelne czcionki (min. 16px na mobile)
- Wysokie kontrasty dla dostępności
- Focus states dla nawigacji klawiaturą
- Test na różnych urządzeniach

### Krok 10: Integracja z Tailwind 4 i Shadcn/ui
- Upewnienie się, że wszystkie komponenty shadcn/ui są zainstalowane:
  - Button
  - Card (CardHeader, CardContent)
  - Progress
  - Alert (dla komunikatów błędów)
- Dostosowanie theme w tailwind.config jeśli potrzeba
- Wykorzystanie zmiennych CSS dla kolorów (zgodnie z shadcn/ui)

### Krok 11: Obsługa błędów i edge cases
- Implementacja try-catch dla wszystkich wywołań API
- Wyświetlanie przyjaznych komunikatów błędów
- Możliwość ponowienia po błędzie
- Obsługa timeoutów
- Obsługa braku fiszek
- Obsługa pustej sesji
- Loading states dla wszystkich asynchronicznych operacji

### Krok 12: Optymalizacja UX
- Dodanie animacji przejść między fiszkami
- Płynne animacje odkrywania odpowiedzi
- Feedback przy kliknięciach (ripple effects)
- Skróty klawiaturowe (opcjonalnie):
  - Spacja - odkryj odpowiedź
  - 1-4 - wybór oceny
- Autofocus na przyciskach
- Preload kolejnej fiszki (jeśli potrzeba)

### Krok 13: Dodanie do nawigacji
- Aktualizacja komponentu Header.astro lub głównego menu
- Dodanie linku do `/session`
- Wyróżnienie aktywnej strony w nawigacji

### Krok 14: Testowanie manualne
- Test pełnego flow: start sesji -> odkrycie -> ocena -> kolejna fiszka -> zakończenie
- Test wszystkich typów błędów
- Test na różnych przeglądarkach
- Test na urządzeniach mobilnych
- Test responsywności
- Test dostępności (nawigacja klawiaturą, screen reader)
- Test z różną liczbą fiszek (1, 5, 20, 100)
- Test z pustą sesją

### Krok 15: Testy automatyczne (opcjonalnie, w przyszłości)
- Unit testy dla useLearningSession hook
- Component testy dla komponentów UI
- Integration testy dla pełnego flow
- E2E testy z Playwright

### Krok 16: Dokumentacja
- Dodanie komentarzy JSDoc do funkcji i komponentów
- Aktualizacja README jeśli potrzeba
- Dokumentacja API (już istnieje w endpoint implementation)

### Krok 17: Code review i refactoring
- Sprawdzenie zgodności z coding practices z .ai rules
- Usunięcie console.log i debug code
- Optymalizacja performance jeśli potrzeba
- Sprawdzenie typów TypeScript
- Linting i formatting

### Krok 18: Deploy i monitoring
- Test na środowisku staging
- Deploy na produkcję
- Monitorowanie błędów (jeśli skonfigurowane)
- Zbieranie feedbacku od użytkowników

---

## Podsumowanie

Ten plan implementacji dostarcza kompleksowy przewodnik do stworzenia widoku sesji nauki zgodnego z wymaganiami PRD i historyjką użytkownika US-008. Kluczowe aspekty to:

- **Minimalistyczny, skupiony interfejs** oparty na fiszce jako centralnym elemencie
- **Intuicyjna interakcja** - odkryj odpowiedź, oceń, przejdź dalej
- **Solidna integracja z API** learning system
- **Kompleksowa obsługa błędów** i edge cases
- **Responsywny design** działający na wszystkich urządzeniach
- **Wysoka dostępność** dla wszystkich użytkowników

Implementacja powinna zająć około 2-3 dni dla doświadczonego programisty frontendowego, wliczając testowanie i dopracowanie UX.

