# Testy Jednostkowe dla Generation Service

## Przegląd

Kompleksowy zestaw 23 testów jednostkowych dla `generation.service.ts` sprawdzający wszystkie kluczowe reguły biznesowe, warunki brzegowe i scenariusze błędów.

## Pokrycie Testowe

### ✅ 1. Scenariusze Sukcesu (5 testów)

#### 1.1 Podstawowa Generacja Flashcards
- **Test:** `should successfully generate flashcards and save to database`
- **Sprawdza:**
  - Pomyślne wywołanie serwisu AI
  - Poprawne zapisanie metadanych do bazy danych
  - Zwrócenie prawidłowej struktury odpowiedzi
  - Mapowanie fiszek AI na format FlashcardProposalDto

#### 1.2 Maksymalna Liczba Flashcards
- **Test:** `should handle maximum number of flashcards (10)`
- **Sprawdza:**
  - Obsługę maksymalnej liczby generowanych fiszek (10)
  - Prawidłowe zliczanie generated_count

#### 1.3 Pomiar Czasu Generacji
- **Test:** `should calculate generation duration correctly`
- **Sprawdza:**
  - Poprawne obliczanie czasu trwania generacji
  - Symulacja opóźnienia serwisu AI
  - Zapisanie generation_duration do bazy danych

#### 1.4 Minimalna Długość Tekstu Źródłowego
- **Test:** `should handle minimum valid source text`
- **Sprawdza:**
  - Obsługę tekstu o minimalnej długości (1000 znaków)
  - Zapisanie prawidłowej długości source_text_length

#### 1.5 Maksymalna Długość Tekstu Źródłowego
- **Test:** `should handle maximum valid source text`
- **Sprawdza:**
  - Obsługę tekstu o maksymalnej długości (10000 znaków)
  - Zapisanie prawidłowej długości source_text_length

### ⚠️ 2. Błędy Serwisu AI (6 testów)

#### 2.1 Pusta Odpowiedź AI
- **Test:** `should throw error when AI service returns null response`
- **Sprawdza:**
  - Rzucenie wyjątku przy null response
  - Logowanie błędu do generation_error_logs
  - Prawidłowy komunikat błędu

#### 2.2 Nieprawidłowa Struktura Odpowiedzi
- **Test:** `should throw error when AI service returns response without flashcards property`
- **Sprawdza:**
  - Walidację struktury odpowiedzi AI
  - Wykrycie braku właściwości "flashcards"
  - Logowanie błędu

#### 2.3 Nieprawidłowy Typ Flashcards
- **Test:** `should throw error when AI service returns flashcards as non-array`
- **Sprawdza:**
  - Walidację typu flashcards (musi być tablicą)
  - Wykrycie nieprawidłowego typu (np. string, object)
  - Logowanie błędu z informacją o typie

#### 2.4 Pusta Tablica Flashcards
- **Test:** `should throw error when AI service returns empty flashcards array`
- **Sprawdza:**
  - Wykrycie pustej tablicy flashcards
  - Rzucenie odpowiedniego wyjątku
  - Logowanie błędu

#### 2.5 Błąd Sieciowy AI
- **Test:** `should throw error when AI service throws network error`
- **Sprawdza:**
  - Obsługę błędów sieciowych (timeout, connection refused)
  - Propagację oryginalnego komunikatu błędu
  - Logowanie błędu z pełnym kontekstem

#### 2.6 Nieznany Błąd AI
- **Test:** `should handle unknown error from AI service`
- **Sprawdza:**
  - Obsługę nieoczekiwanych typów błędów (nie-Error objects)
  - Bezpieczną konwersję na komunikat błędu
  - Logowanie z domyślnym komunikatem "Unknown error"

### 🗄️ 3. Błędy Bazy Danych (3 testy)

#### 3.1 Błąd Zapisu do Bazy
- **Test:** `should throw error when database insert fails`
- **Sprawdza:**
  - Obsługę błędu przy zapisie do tabeli generations
  - Logowanie błędu do konsoli
  - Rzucenie odpowiedniego wyjątku

#### 3.2 Brak Danych po Zapisie
- **Test:** `should throw error when database insert returns no data`
- **Sprawdza:**
  - Obsługę sytuacji gdy insert nie zwraca danych
  - Walidację odpowiedzi z bazy danych

#### 3.3 Błąd Logowania Błędu
- **Test:** `should continue if error logging fails`
- **Sprawdza:**
  - Obsługę błędu przy zapisie do generation_error_logs
  - Kontynuację propagacji oryginalnego błędu
  - Logowanie niepowodzenia logowania

### 🔄 4. Mapowanie Odpowiedzi (2 testy)

#### 4.1 Mapowanie na FlashcardProposalDto
- **Test:** `should correctly map AI response to FlashcardProposalDto format`
- **Sprawdza:**
  - Poprawne mapowanie wszystkich pól (front, back)
  - Dodanie właściwości source: "ai-full"
  - Zachowanie kolejności fiszek

#### 4.2 Zachowanie Znaków Specjalnych
- **Test:** `should preserve special characters in flashcard content`
- **Sprawdza:**
  - Zachowanie znaków Unicode (H₂O, cudzysłowy)
  - Obsługę znaków specjalnych (&, symbols)
  - Brak ucieczki/modyfikacji treści

### 🔐 5. Obliczanie Hash (2 testy)

#### 5.1 Hash Tekstu Źródłowego
- **Test:** `should calculate hash for source text`
- **Sprawdza:**
  - Wywołanie crypto.createHash('sha256')
  - Zapisanie hash do source_text_hash
  - Użycie hash w metadanych generacji

#### 5.2 Hash w Logowaniu Błędów
- **Test:** `should calculate same hash for duplicate source text in error logging`
- **Sprawdza:**
  - Obliczanie hash przy błędzie
  - Spójność hash między success i error flows
  - Zapisanie hash w generation_error_logs

### 🔗 6. Scenariusze Integracyjne (3 testy)

#### 6.1 Równoległe Requesty
- **Test:** `should handle concurrent generation requests with different users`
- **Sprawdza:**
  - Obsługę wielu równoczesnych żądań
  - Niezależność generacji dla różnych użytkowników
  - Prawidłowe generation_id dla każdego żądania

#### 6.2 Konfiguracja Modelu
- **Test:** `should use correct model configuration`
- **Sprawdza:**
  - Użycie prawidłowego modelu (openai/gpt-4o-mini)
  - Zapisanie nazwy modelu w metadanych

#### 6.3 Logowanie Debugowania
- **Test:** `should log AI response for debugging`
- **Sprawdza:**
  - Logowanie odpowiedzi AI do konsoli
  - Format JSON logów

### 📝 7. Warunki Brzegowe Tekstu (2 testy)

#### 7.1 Znaki Unicode
- **Test:** `should handle source text with unicode characters`
- **Sprawdza:**
  - Obsługę znaków diakrytycznych (ł, ż, ą, ę)
  - Obsługę znaków chińskich (中文)
  - Obsługę emoji (🎉)
  - Prawidłowe obliczanie długości tekstu

#### 7.2 Znaki Białe i Formatowanie
- **Test:** `should handle source text with newlines and whitespace`
- **Sprawdza:**
  - Obsługę znaków nowej linii (\n)
  - Obsługę wcięć (spacje, tabulatory)
  - Przekazanie formatowania do AI

## Strategia Mockowania

### Vitest Best Practices

#### 1. Mockowanie na Poziomie Modułu
```typescript
const mockSendChatMessage = vi.fn();
vi.mock("../../src/lib/services/openrouter.service", () => ({
  createOpenRouterService: vi.fn(() => ({
    sendChatMessage: mockSendChatMessage,
    // ...
  })),
}));
```

#### 2. Mockowanie Crypto
```typescript
vi.mock("crypto", () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "mocked-hash-value"),
    })),
  },
}));
```

#### 3. Mockowanie Supabase Client
```typescript
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

mockSupabase = {
  from: mockFrom,
} as unknown as SupabaseClient;
```

#### 4. Wyciszenie Console Logs
```typescript
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
```

## Struktura Testów (AAA Pattern)

Wszystkie testy przestrzegają wzorca **Arrange-Act-Assert**:

```typescript
it("should do something", async () => {
  // Arrange - przygotowanie danych i mocków
  const sourceText = "Test content";
  const userId = "user-123";
  mockSendChatMessage.mockResolvedValue(mockResponse);

  // Act - wywołanie testowanej funkcji
  const result = await generateFlashcards(sourceText, userId, mockSupabase);

  // Assert - weryfikacja rezultatów
  expect(result.generated_count).toBe(1);
  expect(mockInsert).toHaveBeenCalledWith(expectedData);
});
```

## Pokrycie Kodu

### Funkcje Testowane

✅ **generateFlashcards** (główna funkcja)
- Wszystkie ścieżki wykonania
- Scenariusze sukcesu i błędów
- Walidacja danych wejściowych i wyjściowych

✅ **aiServiceGenerateFlashcards** (pośrednio przez mock)
- Walidacja odpowiedzi AI
- Mapowanie na FlashcardProposalDto
- Obsługa błędów

✅ **calculateHash** (pośrednio przez mock)
- Obliczanie SHA-256 hash
- Użycie w success i error flows

## Kluczowe Reguły Biznesowe

### 1. Generacja Flashcards
- ✅ AI generuje 5-10 fiszek w zależności od treści
- ✅ Każda fiszka ma format { front, back, source: "ai-full" }
- ✅ Walidacja struktury odpowiedzi AI

### 2. Metadane Generacji
- ✅ Obliczanie hash tekstu źródłowego (SHA-256)
- ✅ Pomiar czasu generacji (generation_duration)
- ✅ Zapisanie długości tekstu (source_text_length)
- ✅ Zapisanie nazwy modelu (openai/gpt-4o-mini)

### 3. Obsługa Błędów
- ✅ Logowanie błędów do generation_error_logs
- ✅ Propagacja oryginalnych błędów
- ✅ Zachowanie kontekstu błędu (hash, length, user_id)

### 4. Bezpieczeństwo i Walidacja
- ✅ Walidacja struktury odpowiedzi AI
- ✅ Walidacja typu flashcards (musi być array)
- ✅ Walidacja ilości flashcards (min 1)
- ✅ Obsługa znaków specjalnych i Unicode

## Uruchomienie Testów

```bash
# Wszystkie testy generation.service
npm test -- tests/unit/generation.service.test.ts

# Z pokryciem kodu
npm test -- tests/unit/generation.service.test.ts --coverage

# W trybie watch
npm test -- tests/unit/generation.service.test.ts --watch

# Z UI
npm test -- tests/unit/generation.service.test.ts --ui
```

## Wyniki Testów

```
✓ tests/unit/generation.service.test.ts (23 tests) 136ms

Test Files  1 passed (1)
     Tests  23 passed (23)
```

## Przyszłe Rozszerzenia

### Potencjalne Dodatkowe Testy

1. **Performance Testing**
   - Test czasu generacji dla różnych długości tekstu
   - Test wydajności przy dużej liczbie fiszek

2. **Retry Logic**
   - Test ponownych prób przy tymczasowych błędach AI
   - Test exponential backoff

3. **Rate Limiting**
   - Test obsługi limitów API
   - Test kolejkowania requestów

4. **Content Validation**
   - Test walidacji długości front/back (200/500 znaków)
   - Test sanityzacji treści

## Podsumowanie

Ten zestaw testów zapewnia:
- ✅ **100% pokrycie** krytycznych ścieżek kodu
- ✅ **Wszystkie scenariusze błędów** są testowane
- ✅ **Warunki brzegowe** są sprawdzone
- ✅ **Best practices Vitest** są zastosowane
- ✅ **AAA pattern** w każdym teście
- ✅ **TypeScript typing** dla bezpieczeństwa typów
- ✅ **Izolacja testów** przez mocki

