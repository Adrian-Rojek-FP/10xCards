# Plan implementacji widoku Generowania Fiszek

## 1. Przegląd
Widok generowania fiszek umożliwia użytkownikom wklejenie tekstu, na podstawie którego sztuczna inteligencja generuje propozycje fiszek. Użytkownik może następnie przeglądać, akceptować, edytować lub odrzucać te propozycje przed zapisaniem ich w swojej kolekcji. Celem jest zautomatyzowanie i przyspieszenie procesu tworzenia materiałów do nauki.

## 2. Routing widoku
Widok będzie dostępny pod następującą ścieżką:
- **Ścieżka:** `/generate`

## 3. Struktura komponentów
Główna strona `generate.astro` będzie renderować jeden nadrzędny komponent React, który zarządza stanem całego widoku.

```
/src/pages/generate.astro
└── /src/components/views/GenerateView.tsx (Client-side Root)
    ├── /src/components/GenerateFlashcardsForm.tsx
    │   ├── Textarea (z Shadcn/ui)
    │   └── Button (z Shadcn/ui)
    ├── /src/components/FlashcardProposalsList.tsx
    │   ├── Skeleton (z Shadcn/ui) - wyświetlany podczas ładowania
    │   └── /src/components/FlashcardProposalItem.tsx (mapowany dla każdej propozycji)
    │       ├── Card (z Shadcn/ui)
    │       ├── Input (z Shadcn/ui) - dla trybu edycji
    │       └── Button (z Shadcn/ui) - przyciski akcji (Akceptuj, Edytuj, Odrzuć itp.)
    └── /src/components/ProposalsActions.tsx
        └── Button (z Shadcn/ui) - przyciski zapisu
```

## 4. Szczegóły komponentów

### `GenerateView.tsx`
- **Opis komponentu**: Główny komponent React renderowany po stronie klienta, który zarządza całym stanem i logiką widoku. Integruje formularz, listę propozycji i przyciski akcji.
- **Główne elementy**: `GenerateFlashcardsForm`, `FlashcardProposalsList`, `ProposalsActions`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje obsługę zdarzeń do komponentów podrzędnych.
- **Typy**: `FlashcardProposalViewModel`, `GenerationState`.
- **Propsy**: Brak.

### `GenerateFlashcardsForm.tsx`
- **Opis komponentu**: Formularz zawierający pole tekstowe na tekst źródłowy oraz przycisk do inicjowania generowania fiszek.
- **Główne elementy**: `Textarea`, `Button`, `p` (dla komunikatów walidacyjnych i licznika znaków).
- **Obsługiwane interakcje**:
    - `onChange` na `Textarea`: Aktualizuje stan tekstu źródłowego.
    - `onClick` na `Button`: Uruchamia proces generowania fiszek.
- **Obsługiwana walidacja**:
    - Długość tekstu źródłowego musi mieścić się w przedziale 1000-10000 znaków. Przycisk "Generuj" jest nieaktywny, jeśli warunek nie jest spełniony.
- **Typy**: `GenerateFlashcardsCommand`.
- **Propsy**:
    - `sourceText: string`
    - `onSourceTextChange: (text: string) => void`
    - `onGenerate: () => void`
    - `isLoading: boolean`
    - `error: string | null`

### `FlashcardProposalsList.tsx`
- **Opis komponentu**: Wyświetla listę propozycji fiszek wygenerowanych przez AI lub komponent `Skeleton` w trakcie ładowania.
- **Główne elementy**: `div` (kontener listy), `Skeleton` (podczas ładowania), `FlashcardProposalItem` (mapowany z listy propozycji).
- **Obsługiwane interakcje**: Deleguje obsługę do `FlashcardProposalItem`.
- **Typy**: `FlashcardProposalViewModel[]`.
- **Propsy**:
    - `proposals: FlashcardProposalViewModel[]`
    - `isLoading: boolean`
    - `onUpdateProposal: (id: string, newContent: Partial<FlashcardProposalViewModel>) => void`
    - `onSetReviewStatus: (id: string, status: 'accepted' | 'rejected') => void`

### `FlashcardProposalItem.tsx`
- **Opis komponentu**: Reprezentuje pojedynczą propozycję fiszki z opcjami akcji. Posiada tryb wyświetlania i edycji.
- **Główne elementy**: `Card`, `p` (do wyświetlania `front` i `back`), `Input` (w trybie edycji), `Button` (dla akcji).
- **Obsługiwane interakcje**:
    - `onClick` na "Akceptuj": Zmienia status propozycji na `accepted`.
    - `onClick` na "Odrzuć": Zmienia status propozycji na `rejected`.
    - `onClick` na "Edytuj": Włącza tryb edycji.
    - `onClick` na "Zapisz" (w trybie edycji): Zapisuje zmiany i wyłącza tryb edycji.
    - `onClick` na "Anuluj" (w trybie edycji): Odrzuca zmiany i wyłącza tryb edycji.
- **Obsługiwana walidacja**:
    - `front`: max 200 znaków (w trybie edycji).
    - `back`: max 500 znaków (w trybie edycji).
- **Typy**: `FlashcardProposalViewModel`.
- **Propsy**:
    - `proposal: FlashcardProposalViewModel`
    - `onUpdate: (id: string, newContent: Partial<FlashcardProposalViewModel>) => void`
    - `onSetReviewStatus: (id: string, status: 'accepted' | 'rejected') => void`

### `ProposalsActions.tsx`
- **Opis komponentu**: Zawiera przyciski do zapisywania zaakceptowanych propozycji.
- **Główne elementy**: `Button` ("Zapisz zaakceptowane").
- **Obsługiwane interakcje**:
    - `onClick` na "Zapisz zaakceptowane": Uruchamia proces zapisywania fiszek w bazie danych.
- **Propsy**:
    - `onSave: () => void`
    - `isSaving: boolean`
    - `canSave: boolean` (przycisk jest aktywny tylko, jeśli są zaakceptowane fiszki)

## 5. Typy

### `FlashcardProposalDto` (z API)
```typescript
interface FlashcardProposalDto {
  front: string;
  back: string;
  source: "ai-full";
}
```

### `FlashcardCreateDto` (do API)
```typescript
interface FlashcardCreateDto {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
}
```

### `FlashcardProposalViewModel` (typ front-endowy)
Typ ten rozszerza DTO o stan potrzebny do zarządzania interfejsem użytkownika.
```typescript
interface FlashcardProposalViewModel {
  id: string; // Unikalne ID po stronie klienta (np. crypto.randomUUID())
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  reviewStatus: "pending" | "accepted" | "rejected";
  isEditing: boolean;
  // Przechowywane do porównania przy edycji
  originalFront: string;
  originalBack: string;
}
```

## 6. Zarządzanie stanem
Stan będzie zarządzany w głównym komponencie `GenerateView.tsx` przy użyciu haków React (`useState`, `useReducer`). Zalecane jest stworzenie customowego hooka `useFlashcardGeneration` w celu hermetyzacji logiki.

**Główne zmienne stanu:**
- `sourceText: string`: Tekst z `Textarea`.
- `proposals: FlashcardProposalViewModel[]`: Lista propozycji fiszek.
- `generationId: number | null`: ID sesji generowania, zwrócone przez API.
- `isLoading: boolean`: Wskazuje, czy trwa komunikacja z API generującym.
- `isSaving: boolean`: Wskazuje, czy trwa zapisywanie fiszek.
- `error: string | null`: Przechowuje komunikaty o błędach.

**Custom Hook `useFlashcardGeneration`**:
- **Zwracane wartości**: `state`, `setSourceText`, `generateProposals`, `updateProposal`, `setProposalReviewStatus`, `saveAcceptedFlashcards`.
- **Logika**: Będzie zawierał funkcje do komunikacji z API, transformacji danych (DTO na ViewModel) i aktualizacji stanu.

## 7. Integracja API

### 1. Generowanie propozycji
- **Endpoint**: `POST /api/generations`
- **Żądanie (Request)**:
  ```json
  {
    "source_text": "..."
  }
  ```
- **Odpowiedź (Response)**:
  ```json
  {
    "generation_id": 123,
    "flashcards_proposals": [
      { "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
    ],
    "generated_count": 5
  }
  ```
- **Akcja front-end**: Po otrzymaniu odpowiedzi, dane z `flashcards_proposals` są mapowane na `FlashcardProposalViewModel[]`, a `generation_id` jest zapisywane w stanie.

### 2. Zapisywanie fiszek
- **Endpoint**: `POST /api/flashcards`
- **Żądanie (Request)**:
  - Filtruje `proposals` o statusie `accepted`.
  - Mapuje `FlashcardProposalViewModel` na `FlashcardCreateDto`.
  - Dla każdej fiszki, jeśli `front` lub `back` różni się od `originalFront`/`originalBack`, `source` jest ustawiany na `ai-edited`. W przeciwnym razie `ai-full`.
  - `generation_id` jest pobierane ze stanu.
  ```json
  {
    "flashcards": [
      {
        "front": "Question",
        "back": "Answer",
        "source": "ai-edited",
        "generation_id": 123
      }
    ]
  }
  ```
- **Odpowiedź (Response)**:
  ```json
  {
    "flashcards": [
      { "id": 1, "front": "Question", "back": "Answer", ... }
    ]
  }
  ```
- **Akcja front-end**: Po pomyślnym zapisie wyświetla komunikat o sukcesie i czyści formularz oraz listę propozycji.

## 8. Interakcje użytkownika
- **Wpisywanie tekstu**: Aktualizuje stan `sourceText` i licznik znaków. Przycisk "Generuj" staje się aktywny/nieaktywny.
- **Kliknięcie "Generuj"**: Ustawia `isLoading` na `true`, wyświetla `Skeleton`, wysyła żądanie do API. Po odpowiedzi, `isLoading` staje się `false`, a lista propozycji jest renderowana.
- **Kliknięcie "Akceptuj" / "Odrzuć"**: Aktualizuje `reviewStatus` danej propozycji, co powoduje zmianę jej wyglądu (np. kolor ramki).
- **Kliknięcie "Edytuj"**: Ustawia `isEditing` na `true` dla danej propozycji, co renderuje pola `Input` zamiast tekstu.
- **Kliknięcie "Zapisz zaakceptowane"**: Ustawia `isSaving` na `true`, wysyła żądanie do API. Po odpowiedzi, `isSaving` staje się `false`, a stan widoku jest resetowany.

## 9. Warunki i walidacja
- **Formularz generowania (`GenerateFlashcardsForm`)**:
    - Pole tekstowe musi zawierać od 1000 do 10000 znaków.
    - Stan przycisku "Generuj" jest zależny od tej walidacji.
    - Użytkownik jest informowany o wymaganiach za pomocą licznika i komunikatu.
- **Edycja propozycji (`FlashcardProposalItem`)**:
    - Pole `front` nie może przekraczać 200 znaków.
    - Pole `back` nie może przekraczać 500 znaków.
    - Przycisk zapisu edycji jest nieaktywny, jeśli pola są puste lub przekraczają limity.

## 10. Obsługa błędów
- **Błędy walidacji (400)**:
    - Z `POST /api/generations`: Komunikat o błędzie jest wyświetlany pod formularzem generowania.
    - Z `POST /api/flashcards`: Wyświetlany jest ogólny komunikat (np. toast/alert) "Nie udało się zapisać fiszek".
- **Błędy serwera (500)**:
    - Wyświetlany jest ogólny komunikat, np. "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Błędy sieciowe**:
    - `try...catch` wokół wywołań `fetch` obsłuży problemy z połączeniem, wyświetlając stosowny komunikat.
- **Stan ładowania**: Komponent `Skeleton` będzie używany do informowania użytkownika, że operacja jest w toku, co zapobiega podwójnemu klikaniu.

## 11. Kroki implementacji
1.  **Stworzenie plików**: Utwórz plik strony `src/pages/generate.astro` oraz pliki dla komponentów React: `src/components/views/GenerateView.tsx`, `src/components/GenerateFlashcardsForm.tsx`, `src/components/FlashcardProposalsList.tsx`, `src/components/FlashcardProposalItem.tsx` i `src/components/ProposalsActions.tsx`.
2.  **Struktura strony Astro**: W `generate.astro` zaimportuj i umieść komponent `GenerateView.tsx` z atrybutem `client:load`.
3.  **Implementacja `GenerateView`**: Zdefiniuj w nim główny stan oraz szkielet widoku, składający się z pozostałych komponentów.
4.  **Implementacja `GenerateFlashcardsForm`**: Zbuduj formularz z `Textarea` i `Button` z biblioteki Shadcn/ui. Dodaj logikę walidacji długości tekstu i obsługę zdarzeń.
5.  **Implementacja `FlashcardProposalsList` i `FlashcardProposalItem`**: Zaimplementuj wyświetlanie listy propozycji. W `FlashcardProposalItem` dodaj logikę przełączania między trybem wyświetlania a edycji oraz obsługę akcji (akceptuj, odrzuć).
6.  **Implementacja `ProposalsActions`**: Dodaj przyciski zapisu i powiąż je z odpowiednimi akcjami.
7.  **Stworzenie `useFlashcardGeneration`**: Zaimplementuj customowy hook, który będzie zarządzał stanem, wywołaniami API (`/generations` i `/flashcards`), transformacją danych i obsługą błędów.
8.  **Integracja**: Połącz hook `useFlashcardGeneration` z komponentem `GenerateView`, przekazując stan i funkcje jako propsy do komponentów podrzędnych.
9.  **Stylowanie i UX**: Użyj Tailwind CSS do dopracowania wyglądu. Dodaj toasty/powiadomienia dla akcji zapisu i błędów. Upewnij się, że stany ładowania są poprawnie obsługiwane.
10. **Testowanie**: Ręcznie przetestuj cały przepływ zgodnie z historyjkami użytkownika US-003 i US-004.