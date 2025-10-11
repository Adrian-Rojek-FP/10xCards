# API Endpoint Implementation Plan: GET /flashcards

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia pobieranie listy fiszek (`flashcards`) dla uwierzytelnionego użytkownika. Obsługuje paginację, sortowanie oraz filtrowanie wyników, aby zapewnić elastyczność i wydajność.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/flashcards`
- **Parametry zapytania (Query)**:
  - **Opcjonalne**:
    - `page: number` (Domyślnie: `1`) - Numer strony do pobrania.
    - `limit: number` (Domyślnie: `10`) - Liczba wyników na stronie.
    - `sort: string` (Domyślnie: `created_at`) - Nazwa kolumny do sortowania (np. `created_at`, `updated_at`, `source`).
    - `order: 'asc' | 'desc'` (Domyślnie: `desc`) - Kierunek sortowania.
    - `source: string` - Filtr na podstawie źródła fiszki (np. `manual`, `ai-full`).
    - `generation_id: number` - Filtr na podstawie identyfikatora generacji.
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **`GetFlashcardsQueryDto` (Zod Schema)**: Do walidacji parametrów zapytania.
  ```typescript
  import { z } from 'zod';

  export const GetFlashcardsQueryDto = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    sort: z.string().default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
    source: z.string().optional(),
    generation_id: z.coerce.number().int().positive().optional(),
  });
  ```
- **`FlashcardDto`**: Reprezentacja fiszki w odpowiedzi.
  ```typescript
  type FlashcardDto = {
    id: number;
    front: string;
    back: string;
    source: string;
    created_at: string;
    updated_at: string;
  };
  ```
- **`PaginationDto`**: Metadane paginacji.
  ```typescript
  type PaginationDto = {
    page: number;
    limit: number;
    total: number;
  };
  ```

## 4. Szczegóły odpowiedzi
- **Sukces (200 OK)**:
  ```json
  {
    "data": [
      { "id": 1, "front": "Question", "back": "Answer", "source": "manual", "created_at": "...", "updated_at": "..." }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 100 }
  }
  ```
- **Błędy**:
  - `400 Bad Request`: Nieprawidłowe parametry zapytania.
  - `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniający.
  - `500 Internal Server Error`: Błędy serwera lub bazy danych.

## 5. Przepływ danych
1.  Żądanie `GET /api/flashcards` trafia do serwera Astro.
2.  Middleware (`src/middleware/index.ts`) weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. Jeśli jest prawidłowy, dołącza `user` i `supabase` do `context.locals`.
3.  Handler `GET` w `src/pages/api/flashcards.ts` jest wykonywany.
4.  Parametry zapytania są parsowane i walidowane przy użyciu schematu `GetFlashcardsQueryDto` (zod). W przypadku błędu walidacji zwracany jest `400 Bad Request`.
5.  Handler wywołuje metodę `getFlashcards` z nowo utworzonego serwisu `FlashcardService`, przekazując zweryfikowane parametry oraz ID użytkownika z `context.locals.user`.
6.  `FlashcardService` buduje zapytanie do Supabase:
    - Używa `supabase.from('flashcards').select('*', { count: 'exact' })`.
    - Dodaje filtr `.eq('user_id', userId)`.
    - Warunkowo dodaje filtry `.eq('source', source)` i/lub `.eq('generation_id', generationId)`, jeśli zostały podane.
    - Aplikuje sortowanie `.order(sort, { ascending: order === 'asc' })`.
    - Aplikuje paginację `.range((page - 1) * limit, page * limit - 1)`.
7.  Serwis wykonuje zapytanie i otrzymuje listę fiszek oraz całkowitą liczbę pasujących rekordów (`count`).
8.  Serwis zwraca dane (`data`) i obiekt paginacji (`pagination`) do handlera API.
9.  Handler formatuje odpowiedź JSON i wysyła ją do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest chroniony. Middleware musi zweryfikować ważność tokenu JWT (Supabase Auth).
- **Autoryzacja**: Polityki RLS (Row-Level Security) na tabeli `flashcards` w Supabase zapewnią, że użytkownik ma dostęp wyłącznie do swoich własnych fiszek. Polityka musi być oparta na `auth.uid() = user_id`.
- **Walidacja wejścia**: Wszystkie parametry wejściowe z zapytania są ściśle walidowane za pomocą `zod`, aby zapobiec nieoczekiwanemu zachowaniu i potencjalnym atakom (np. injection).

## 7. Rozważania dotyczące wydajności
- **Paginacja**: Paginacja jest obowiązkowa, aby uniknąć przesyłania dużych ilości danych i nadmiernego obciążania bazy danych. Maksymalny `limit` zostanie ograniczony do `100`.
- **Indeksowanie**: Aby zapewnić szybkie wykonywanie zapytań, na kolumnach `user_id`, `source`, `generation_id` oraz `created_at` w tabeli `flashcards` powinny istnieć indeksy. Plan bazy danych (`db-plan.md`) już przewiduje indeksy na `user_id` i `generation_id`.

## 8. Etapy wdrożenia
1.  **Utworzenie pliku serwisu**: Stwórz plik `src/lib/services/flashcard.service.ts`.
2.  **Implementacja `FlashcardService`**:
    - Zdefiniuj klasę `FlashcardService`.
    - Wewnątrz klasy stwórz metodę `getFlashcards(query, userId)`, która będzie przyjmować zweryfikowane parametry zapytania i ID użytkownika.
    - Zaimplementuj logikę budowania i wykonywania zapytania do Supabase, jak opisano w sekcji "Przepływ danych".
    - Metoda powinna zwracać obiekt `{ data, pagination }`.
3.  **Utworzenie pliku API endpoint**: Stwórz plik `src/pages/api/flashcards.ts`.
4.  **Implementacja handlera `GET`**:
    - W `src/pages/api/flashcards.ts` wyeksportuj funkcję `GET({ request, locals })`.
    - Użyj `URLSearchParams` do odczytania parametrów z `request.url`.
    - Zwaliduj parametry za pomocą `GetFlashcardsQueryDto.safeParse()`. W przypadku błędu zwróć odpowiedź `400`.
    - Pobierz `user` z `locals`. Jeśli nie istnieje, zwróć `401` (chociaż middleware powinien to już obsłużyć).
    - Utwórz instancję `FlashcardService`.
    - Wywołaj `flashcardService.getFlashcards(...)` z poprawnymi danymi.
    - Zwróć odpowiedź JSON (`Astro.Response`) z pobranymi danymi i kodem `200 OK`.
    - Dodaj `export const prerender = false;` na końcu pliku.
5.  **Weryfikacja Middleware**: Upewnij się, że middleware w `src/middleware/index.ts` poprawnie obsługuje ścieżki `/api/*`, weryfikuje token i dołącza `user` oraz `supabase` do `locals`.
6.  **Weryfikacja RLS**: Sprawdź w panelu Supabase, czy polityka RLS dla tabeli `flashcards` jest aktywna i poprawnie skonfigurowana, aby umożliwić odczyt tylko właścicielowi rekordów.
