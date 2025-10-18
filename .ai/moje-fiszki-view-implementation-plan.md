# Plan implementacji widoku: Moje Fiszki

## 1. Przegląd
Widok "Moje Fiszki" jest centralnym miejscem dla zalogowanego użytkownika do zarządzania swoją kolekcją fiszek. Umożliwia przeglądanie, dodawanie nowych, edytowanie istniejących oraz usuwanie niepotrzebnych fiszek. Widok musi być intuicyjny i zapewniać płynną interakcję z danymi, obsługując paginację oraz potencjalnie sortowanie i filtrowanie w przyszłości.

## 2. Routing widoku
- **Ścieżka URL**: `/flashcards`
- **Plik strony**: `src/pages/flashcards.astro`
- **Dostęp**: Wymaga uwierzytelnienia użytkownika. Użytkownicy nieautoryzowani powinni być przekierowani na stronę logowania.

## 3. Struktura komponentów
Hierarchia komponentów React, które będą renderowane wewnątrz strony Astro z dyrektywą `client:load`.

```
src/pages/flashcards.astro
└── FlashcardsView.tsx (Główny komponent kliencki)
    ├── Header.tsx (Współdzielony komponent nawigacyjny)
    ├── AddFlashcardButton.tsx (Przycisk otwierający modal dodawania)
    ├── FlashcardList.tsx (Komponent listy)
    │   └── FlashcardListItem.tsx (Element listy, renderowany w pętli)
    ├── PaginationControls.tsx (Komponent do obsługi paginacji)
    ├── FlashcardFormModal.tsx (Modal do tworzenia/edycji fiszki, renderowany warunkowo)
    └── DeleteConfirmationDialog.tsx (Modal potwierdzenia usunięcia, renderowany warunkowo)
```

## 4. Szczegóły komponentów

### `FlashcardsView.tsx`
- **Opis komponentu**: Główny kontener widoku, który zarządza stanem, obsługuje logikę pobierania danych oraz koordynuje interakcje między komponentami podrzędnymi.
- **Główne elementy**: Wykorzystuje customowy hook `useFlashcards` do zarządzania danymi. Renderuje `FlashcardList`, `PaginationControls` oraz modale w zależności od stanu aplikacji.
- **Obsługiwane interakcje**: Inicjalizacja pobierania danych, obsługa zmiany strony, otwieranie modali do tworzenia, edycji i usuwania fiszek.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardViewModel`, `Pagination`.
- **Propsy**: Brak.

### `FlashcardList.tsx`
- **Opis komponentu**: Odpowiedzialny za renderowanie listy fiszek. Wyświetla komunikat o ładowaniu, błędzie lub braku danych.
- **Główne elementy**: Mapuje tablicę fiszek na komponenty `FlashcardListItem`.
- **Obsługiwane interakcje**: Przekazuje zdarzenia `onEdit` i `onDelete` od `FlashcardListItem` do `FlashcardsView`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardViewModel[]`.
- **Propsy**:
  - `flashcards: FlashcardViewModel[]`
  - `isLoading: boolean`
  - `onEdit: (flashcard: FlashcardViewModel) => void`
  - `onDelete: (flashcard: FlashcardViewModel) => void`

### `FlashcardListItem.tsx`
- **Opis komponentu**: Reprezentuje pojedynczą fiszkę na liście. Wyświetla jej treść (przód i tył) oraz przyciski akcji.
- **Główne elementy**: Elementy `<div>` lub `<Card>` z Shadcn/ui do wyświetlania tekstu, oraz komponenty `<Button>` dla akcji "Edytuj" i "Usuń".
- **Obsługiwane interakcje**: Kliknięcie przycisków "Edytuj" i "Usuń".
- **Obsługiwana walidacja**: Brak.
- **Typy**: `FlashcardViewModel`.
- **Propsy**:
  - `flashcard: FlashcardViewModel`
  - `onEdit: (flashcard: FlashcardViewModel) => void`
  - `onDelete: (flashcard: FlashcardViewModel) => void`

### `FlashcardFormModal.tsx`
- **Opis komponentu**: Modal oparty na `<Dialog>` z Shadcn/ui, zawierający formularz do tworzenia lub edycji fiszki.
- **Główne elementy**: Pola `<Textarea>` dla przodu i tyłu fiszki, przycisk "Zapisz".
- **Obsługiwane interakcje**: Wprowadzanie tekstu, zatwierdzenie formularza.
- **Obsługiwana walidacja**:
  - `front`: pole wymagane, maksymalnie 200 znaków.
  - `back`: pole wymagane, maksymalnie 500 znaków.
- **Typy**: `FlashcardViewModel`, `FlashcardCreateDto`, `FlashcardUpdateDto`.
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onSave: (data: FlashcardCreateDto | FlashcardUpdateDto) => void`
  - `initialData?: FlashcardViewModel` (do wypełnienia formularza w trybie edycji)

### `DeleteConfirmationDialog.tsx`
- **Opis komponentu**: Modal oparty na `<AlertDialog>` z Shadcn/ui, proszący o potwierdzenie operacji usunięcia.
- **Główne elementy**: Tekst ostrzegawczy, przyciski "Potwierdź" i "Anuluj".
- **Obsługiwane interakcje**: Kliknięcie przycisków.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Brak.
- **Propsy**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onConfirm: () => void`

## 5. Typy

```typescript
// DTO - surowy obiekt z API
interface FlashcardDto {
  id: number;
  user_id: string;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// ViewModel - obiekt używany w komponentach, może zawierać przetworzone dane
interface FlashcardViewModel {
  id: number;
  front: string;
  back:string;
  source: "ai-full" | "ai-edited" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

// DTO do tworzenia nowej fiszki
interface FlashcardCreateDto {
  front: string;
  back: string;
  source: "manual";
  generation_id: null;
}

// DTO do aktualizacji istniejącej fiszki
interface FlashcardUpdateDto {
  front?: string;
  back?: string;
}

// Typ dla danych paginacji
interface Pagination {
  page: number;
  limit: number;
  total: number;
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem zostanie scentralizowane w customowym hooku `useFlashcards.ts`.

**`useFlashcards.ts`**
- **Cel**: Abstrakcja logiki komunikacji z API i zarządzania stanem danych fiszek.
- **Zarządzany stan**:
  - `flashcards: FlashcardViewModel[]`
  - `pagination: Pagination | null`
  - `isLoading: boolean`
  - `error: Error | null`
  - `queryParams: { page: number, limit: number, ... }`
- **Udostępniane funkcje**:
  - `fetchFlashcards(params)`
  - `createFlashcard(data)`
  - `updateFlashcard(id, data)`
  - `deleteFlashcard(id)`
  - `setPage(pageNumber)`

Komponent `FlashcardsView.tsx` będzie zarządzał stanem UI, takim jak widoczność modali i aktualnie wybrana fiszka do edycji/usunięcia.

## 7. Integracja API
Komunikacja z API będzie odbywać się za pośrednictwem `fetch` wewnątrz hooka `useFlashcards`.

- **`GET /api/flashcards`**:
  - **Cel**: Pobranie listy fiszek.
  - **Parametry zapytania**: `page`, `limit`, `sort`, `order`.
  - **Typ odpowiedzi**: `{ data: FlashcardDto[], pagination: Pagination }`.
- **`POST /api/flashcards`**:
  - **Cel**: Utworzenie nowej fiszki.
  - **Typ body**: `{ flashcards: [FlashcardCreateDto] }`.
  - **Typ odpowiedzi**: `{ flashcards: FlashcardDto[] }`.
- **`PUT /api/flashcards/{id}`** (założenie istnienia):
  - **Cel**: Aktualizacja istniejącej fiszki.
  - **Typ body**: `FlashcardUpdateDto`.
  - **Typ odpowiedzi**: `FlashcardDto`.
- **`DELETE /api/flashcards/{id}`** (założenie istnienia):
  - **Cel**: Usunięcie fiszki.
  - **Typ odpowiedzi**: `204 No Content` lub `{ success: true }`.

## 8. Interakcje użytkownika
- **Przeglądanie listy**: Użytkownik widzi listę fiszek. Może użyć paginacji, aby przejść do kolejnych stron.
- **Dodawanie fiszki**: Użytkownik klika "Dodaj fiszkę", co otwiera modal. Wypełnia formularz i klika "Zapisz". Modal się zamyka, a lista odświeża, pokazując nową fiszkę.
- **Edycja fiszki**: Użytkownik klika "Edytuj" przy fiszce. Otwiera się modal z wypełnionymi danymi. Po zmianie i zapisaniu, modal się zamyka, a zaktualizowana fiszka jest widoczna na liście.
- **Usuwanie fiszki**: Użytkownik klika "Usuń". Otwiera się dialog potwierdzający. Po potwierdzeniu, fiszka znika z listy.

## 9. Warunki i walidacja
- **Dostęp do widoku**: Sprawdzany po stronie serwera (`.astro` lub middleware); w przypadku braku sesji, następuje przekierowanie do `/login`.
- **Walidacja formularza (`FlashcardFormModal`)**:
  - Walidacja po stronie klienta (np. przy użyciu Zod) sprawdzi, czy pola `front` i `back` nie są puste i nie przekraczają limitów znaków (200 dla `front`, 500 dla `back`).
  - Przycisk "Zapisz" jest nieaktywny, dopóki formularz nie jest poprawny.
  - Komunikaty o błędach wyświetlane są pod odpowiednimi polami.

## 10. Obsługa błędów
- **Błąd pobierania danych (np. błąd serwera 500)**: Na liście fiszek wyświetlany jest komunikat o błędzie, np. "Nie udało się załadować fiszek. Spróbuj ponownie później."
- **Brak autoryzacji (401)**: Hook `useFlashcards` (lub globalna obsługa `fetch`) powinien przechwycić ten status i przekierować użytkownika na stronę logowania.
- **Błąd sieci**: Wyświetlany jest ogólny komunikat o problemie z połączeniem.
- **Stan pusty**: Jeśli API zwróci pustą listę, komponent `FlashcardList` wyświetli informację, np. "Nie masz jeszcze żadnych fiszek. Stwórz pierwszą!".
- **Błąd zapisu/edycji/usunięcia**: Pod modalem lub jako globalne powiadomienie (toast) wyświetlany jest komunikat o niepowodzeniu operacji.

## 11. Kroki implementacji
1.  **Utworzenie strony Astro**: Stworzenie pliku `src/pages/flashcards.astro`, który będzie renderował główny komponent React `FlashcardsView.tsx` z dyrektywą `client:load`.
2.  **Struktura komponentów**: Utworzenie pustych plików `.tsx` dla wszystkich zdefiniowanych komponentów (`FlashcardsView`, `FlashcardList`, `FlashcardListItem`, `FlashcardFormModal`, `DeleteConfirmationDialog`, `PaginationControls`).
3.  **Definicja typów**: Zdefiniowanie wszystkich wymaganych typów (`FlashcardDto`, `FlashcardViewModel`, `Pagination` etc.) w pliku `src/types.ts` lub dedykowanym pliku dla widoku.
4.  **Implementacja hooka `useFlashcards`**: Zaimplementowanie logiki pobierania danych (`GET`), tworzenia (`POST`), aktualizacji (`PUT`) i usuwania (`DELETE`) wraz z zarządzaniem stanem `isLoading`, `error` i `data`.
5.  **Implementacja `FlashcardsView`**: Połączenie hooka `useFlashcards` z komponentem. Implementacja logiki zarządzania widocznością modali.
6.  **Implementacja `FlashcardList` i `FlashcardListItem`**: Zbudowanie komponentów do wyświetlania danych. Podpięcie akcji `onEdit` i `onDelete`.
7.  **Implementacja `FlashcardFormModal`**: Zbudowanie formularza z użyciem komponentów Shadcn/ui i implementacja walidacji po stronie klienta.
8.  **Implementacja `DeleteConfirmationDialog`**: Zbudowanie modalu potwierdzającego.
9.  **Implementacja `PaginationControls`**: Zbudowanie komponentu paginacji i podpięcie go do funkcji `setPage` z hooka `useFlashcards`.
10. **Styling i obsługa stanów**: Dopracowanie wyglądu, dodanie wskaźników ładowania, obsługi błędów i pustych stanów.
11. **Testowanie manualne**: Przetestowanie wszystkich interakcji użytkownika, w tym przypadków brzegowych i obsługi błędów.
