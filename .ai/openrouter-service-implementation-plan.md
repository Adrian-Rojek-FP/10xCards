# Przewodnik Implementacji Usługi OpenRouter

## 1. Opis Usługi

`OpenRouterService` to klasa TypeScript zaprojektowana do hermetyzacji interakcji z API OpenRouter. Umożliwia ona wysyłanie zapytań do różnych modeli językowych (LLM), zarządzanie kluczami API i parametrami oraz obsługę odpowiedzi, w tym strukturyzowanych danych JSON. Usługa ta będzie działać w środowisku serwerowym (np. w endpointach API Astro).

## 2. Opis Konstruktora

Konstruktor inicjalizuje usługę, pobierając klucz API OpenRouter ze zmiennych środowiskowych.

```typescript
/**
 * Tworzy instancję OpenRouterService.
 *
 * @param {object} [options] - Opcje konfiguracyjne.
 * @param {string} [options.apiKey] - Klucz API OpenRouter. Jeśli nie zostanie podany, zostanie pobrany ze zmiennej środowiskowej `OPENROUTER_API_KEY`.
 * @throws {Error} Jeśli klucz API nie zostanie znaleziony.
 */
constructor(options?: { apiKey?: string });
```

## 3. Metody i Pola Publiczne

### Metody

#### `getChatCompletion<T>(options: ChatCompletionOptions): Promise<ChatCompletionResponse<T>>`

Główna metoda do uzyskiwania odpowiedzi z modelu językowego.

-   **`options`**: Obiekt `ChatCompletionOptions` zawierający wszystkie parametry żądania.
-   **Zwraca**: Obietnicę (`Promise`), która rozwiązuje się do obiektu `ChatCompletionResponse<T>`, gdzie `T` jest typem oczekiwanej odpowiedzi (domyślnie `string`).

### Typy Danych

```typescript
// src/lib/services/openrouter.service.ts

// Definicja schematu JSON dla formatu odpowiedzi
export interface JsonSchema {
    name: string;
    strict?: boolean;
    schema: object;
}

// Format odpowiedzi (obsługujemy tylko json_schema)
export interface ResponseFormat {
    type: 'json_schema';
    json_schema: JsonSchema;
}

// Rola w wiadomości
export type MessageRole = 'system' | 'user' | 'assistant';

// Struktura wiadomości
export interface Message {
    role: MessageRole;
    content: string;
}

// Opcje dla żądania uzupełnienia czatu
export interface ChatCompletionOptions {
    messages: Message[];
    model?: string; // np. 'anthropic/claude-3.5-sonnet'
    response_format?: ResponseFormat;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
}

// Odpowiedź z usługi
export interface ChatCompletionResponse<T> {
    content: T; // Parsowana odpowiedź, jeśli użyto schematu JSON, w przeciwnym razie string
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
```

## 4. Metody i Pola Prywatne

### Pola

-   `#apiKey: string`: Przechowuje klucz API OpenRouter.
-   `#defaultModel: string`: Domyślny model do użycia, jeśli nie zostanie podany (`'anthropic/claude-3.5-sonnet'`).
-   `#apiBaseUrl: string`: Bazowy URL API OpenRouter (`'https://openrouter.ai/api/v1'`).

### Metody

-   `#buildRequestBody(options: ChatCompletionOptions): object`: Tworzy ciało żądania na podstawie dostarczonych opcji, łącząc je z domyślnymi ustawieniami.
-   `#executeRequest(body: object): Promise<any>`: Wykonuje żądanie `fetch` do API OpenRouter, dodając nagłówki autoryzacji.
-   `#handleResponse<T>(apiResponse: any, response_format?: ResponseFormat): ChatCompletionResponse<T>`: Przetwarza odpowiedź z API, parsuje zawartość (w tym JSON, jeśli jest wymagany) i formatuje ją do obiektu `ChatCompletionResponse`.

## 5. Obsługa Błędów

Usługa będzie implementować niestandardowe klasy błędów w celu zapewnienia szczegółowych informacji o problemach.

-   `OpenRouterError`: Podstawowa klasa dla wszystkich błędów usługi.
-   `ConfigurationError`: Rzucany, gdy brakuje klucza API.
-   `NetworkError`: Rzucany w przypadku problemów z połączeniem sieciowym.
-   `ApiError`: Rzucany, gdy API zwraca błąd (np. 4xx, 5xx). Będzie zawierać status HTTP i komunikat błędu z API.
-   `SchemaValidationError`: Rzucany, gdy model nie zwróci poprawnego JSON-a zgodnie z wymaganym `response_format`.

**Przykład obsługi błędów w kodzie:**

```typescript
try {
    const response = await openRouterService.getChatCompletion(...);
} catch (error) {
    if (error instanceof ApiError) {
        console.error(`API Error: ${error.status} ${error.message}`);
    } else if (error instanceof NetworkError) {
        console.error(`Network Error: ${error.message}`);
    } else {
        console.error(`An unexpected error occurred: ${error.message}`);
    }
}
```

## 6. Kwestie Bezpieczeństwa

1.  **Zarządzanie Kluczem API**: Klucz API **musi** być przechowywany jako zmienna środowiskowa (`OPENROUTER_API_KEY`) i nigdy nie może być umieszczany bezpośrednio w kodzie. Plik `.env.example` powinien zawierać wpis dla tej zmiennej.
2.  **Walidacja Danych Wejściowych**: Chociaż usługa nie musi sama w sobie walidować treści od użytkownika, kod wywołujący (np. endpoint API) powinien używać Zod do walidacji i sanityzacji wszelkich danych wejściowych od klienta przed przekazaniem ich do usługi.
3.  **Zapobieganie Wyciekom Danych**: Należy uważać, aby nie logować pełnych obiektów żądań/odpowiedzi w środowisku produkcyjnym, ponieważ mogą one zawierać wrażliwe dane.

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Konfiguracja Środowiska

1.  Dodaj `OPENROUTER_API_KEY` do pliku `.env.example`.
2.  Dodaj `OPENROUTER_API_KEY=""` do swojego lokalnego pliku `.env`.

### Krok 2: Utworzenie Pliku Usługi i Definicja Typów

1.  Utwórz nowy plik: `src/lib/services/openrouter.service.ts`.
2.  Zdefiniuj w nim wszystkie publiczne typy i interfejsy (`JsonSchema`, `ResponseFormat`, `Message`, `ChatCompletionOptions`, `ChatCompletionResponse`).
3.  Zdefiniuj niestandardowe klasy błędów (`OpenRouterError`, `ConfigurationError`, itd.).

### Krok 3: Implementacja Klasy `OpenRouterService`

1.  W pliku `openrouter.service.ts` utwórz klasę `OpenRouterService`.
2.  Zaimplementuj konstruktor, który pobiera klucz API ze zmiennej środowiskowej `process.env.OPENROUTER_API_KEY` i rzuca `ConfigurationError`, jeśli go brakuje.
3.  Zdefiniuj pola prywatne (`#apiKey`, `#defaultModel`, `#apiBaseUrl`).

### Krok 4: Implementacja Metod Prywatnych

1.  **`#buildRequestBody`**:
    -   Akceptuje `ChatCompletionOptions`.
    -   Tworzy obiekt z `model` (używając `options.model` lub `#defaultModel`), `messages`.
    -   Dodaje opcjonalne parametry (`temperature`, `max_tokens`, `response_format` itd.), jeśli są obecne w opcjach.
    -   Zwraca gotowy obiekt ciała żądania.

2.  **`#executeRequest`**:
    -   Akceptuje obiekt ciała żądania.
    -   Używa `fetch` do wysłania żądania `POST` na adres `this.#apiBaseUrl + '/chat/completions'`.
    -   W `try...catch` opakowuje `fetch`, aby przechwycić błędy sieciowe i rzucić `NetworkError`.
    -   Ustawia nagłówki:
        -   `Authorization: `Bearer ${this.#apiKey}``
        -   `Content-Type: 'application/json'`
    -   Sprawdza `response.ok`. Jeśli jest `false`, odczytuje treść błędu z `response.json()`, a następnie rzuca `ApiError` ze statusem i komunikatem.
    -   Zwraca sparsowaną odpowiedź JSON z API.

3.  **`#handleResponse`**:
    -   Akceptuje odpowiedź z API i opcjonalny `response_format`.
    -   Wyodrębnia `content`, `model` i `usage` z odpowiedzi.
    -   **Jeśli `response_format` został użyty**:
        -   Opakowuje `JSON.parse(apiResponse.choices[0].message.content)` w `try...catch`.
        -   W przypadku błędu parsowania rzuca `SchemaValidationError`.
        -   Przypisuje sparsowany obiekt do `content`.
    -   **W przeciwnym razie**:
        -   Przypisuje `apiResponse.choices[0].message.content` (string) do `content`.
    -   Zwraca obiekt `ChatCompletionResponse<T>`.

### Krok 5: Implementacja Metody Publicznej `getChatCompletion`

1.  Metoda powinna być asynchroniczna (`async`).
2.  Wywołuje `#buildRequestBody` z przekazanymi opcjami.
3.  Wywołuje `#executeRequest` z wynikiem poprzedniego kroku.
4.  Wywołuje `#handleResponse` z odpowiedzią API.
5.  Zwraca ostateczny wynik.

### Krok 6: Integracja i Użycie

1.  Utwórz przykładowy endpoint API w `src/pages/api/test-openrouter.ts`, aby przetestować usługę.
2.  W endpoincie:
    -   Zaimportuj i utwórz instancję `OpenRouterService`.
    -   Zdefiniuj `messages` i `response_format` (używając `zod-to-json-schema` do konwersji schematu Zod na JSON Schema, zgodnie z dobrymi praktykami projektu).
    -   Wywołaj `getChatCompletion` w bloku `try...catch`.
    -   Zwróć wynik lub błąd jako odpowiedź API.

**Przykład użycia `response_format` z Zod:**

```typescript
// W pliku endpointu API
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { OpenRouterService } from 'src/lib/services/openrouter.service';

// 1. Definicja schematu Zod
const FlashcardSchema = z.object({
  question: z.string().describe("The question for the flashcard."),
  answer: z.string().describe("The answer to the question."),
});

// 2. Konwersja do JSON Schema
const flashcardJsonSchema = zodToJsonSchema(FlashcardSchema, "flashcard");

// 3. Użycie w usłudze
const service = new OpenRouterService();

const response = await service.getChatCompletion({
    messages: [
        { role: 'system', content: 'You are a helpful assistant that creates flashcards.' },
        { role: 'user', content: 'Create a flashcard about TypeScript.' }
    ],
    model: 'anthropic/claude-3.5-sonnet',
    response_format: {
        type: 'json_schema',
        json_schema: {
            name: 'flashcard',
            strict: true,
            schema: flashcardJsonSchema.definitions.flashcard,
        }
    }
});

// response.content będzie teraz obiektem typu { question: string, answer: string }
```
