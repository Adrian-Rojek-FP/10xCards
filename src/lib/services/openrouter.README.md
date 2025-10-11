# OpenRouter Service

Serwis do integracji z API OpenRouter dla komunikacji z modelami LLM. Umożliwia generowanie odpowiedzi z wykorzystaniem różnych modeli językowych, z pełną obsługą strukturalnych odpowiedzi JSON, metryk i zarządzania błędami.

## Funkcjonalności

### Podstawowe

- ✅ Komunikacja z API OpenRouter
- ✅ Wsparcie dla wielu modeli LLM (OpenAI, Anthropic, Google, Meta, etc.)
- ✅ Strukturalne odpowiedzi JSON z walidacją schematu
- ✅ Konfiguracja parametrów modelu (temperature, top_p, etc.)
- ✅ System promptów (system message + user message)

### Zaawansowane

- ✅ Automatyczne retry z exponential backoff
- ✅ Timeout dla żądań
- ✅ Szczegółowe typy błędów (AuthenticationError, RateLimitError, NetworkError, ValidationError)
- ✅ Metryki i monitoring (czas odpowiedzi, token usage)
- ✅ Opcjonalne logowanie z callback
- ✅ Type-safe API z TypeScript

## Instalacja i konfiguracja

### 1. Konfiguracja zmiennych środowiskowych

Dodaj klucz API OpenRouter do zmiennych środowiskowych:

```env
OPENROUTER_API_KEY=your_api_key_here
```

### 2. Import serwisu

```typescript
import { createOpenRouterService } from "@/lib/services/openrouter.service";
```

## Użycie

### Podstawowy przykład

```typescript
const openRouter = createOpenRouterService();

// Ustaw komunikat systemowy
openRouter.setSystemMessage("You are a helpful assistant.");

// Wyślij wiadomość
const response = await openRouter.sendChatMessage<string>(
  "What is the capital of France?"
);

console.log(response); // "Paris is the capital of France..."
```

### Strukturalne odpowiedzi JSON

```typescript
import { type JSONSchema } from "@/lib/services/openrouter.service";

const openRouter = createOpenRouterService();

// Zdefiniuj schemat odpowiedzi
const schema: JSONSchema = {
  name: "flashcard_generation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["flashcards"],
  },
};

openRouter.setResponseFormat(schema);
openRouter.setSystemMessage("Generate educational flashcards.");

interface Response {
  flashcards: { front: string; back: string }[];
}

const response = await openRouter.sendChatMessage<Response>(
  "Create flashcards about TypeScript"
);

console.log(response.flashcards);
```

### Konfiguracja modelu

```typescript
const openRouter = createOpenRouterService();

// Wybierz model i ustaw parametry
openRouter.setModel("openai/gpt-4o-mini", {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2000,
  frequency_penalty: 0.5,
  presence_penalty: 0.5,
});
```

### Dostępne modele

Serwis wspiera wszystkie modele dostępne w OpenRouter, w tym:

- `openai/gpt-4o` - Najnowszy model GPT-4
- `openai/gpt-4o-mini` - Szybszy i tańszy GPT-4
- `openai/gpt-3.5-turbo` - GPT-3.5 Turbo
- `anthropic/claude-3-opus` - Claude 3 Opus
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- `google/gemini-pro` - Google Gemini Pro
- `meta-llama/llama-3-70b` - Meta Llama 3

Pełna lista: [https://openrouter.ai/models](https://openrouter.ai/models)

### Metryki i monitoring

```typescript
const openRouter = createOpenRouterService({
  enableMetrics: true,
  logger: (level, message, data) => {
    console.log(`[${level}] ${message}`, data);
  },
});

// Użyj metody z metadanymi
const response = await openRouter.sendChatMessageWithMetadata<string>(
  "Hello!"
);

console.log("Response:", response.data);
console.log("Metadata:", {
  requestId: response.metadata.requestId,
  model: response.metadata.model,
  duration: response.metadata.duration, // w milisekundach
  usage: response.metadata.usage, // token usage
  timestamp: response.metadata.timestamp,
});
```

### Obsługa błędów

```typescript
import {
  AuthenticationError,
  RateLimitError,
  NetworkError,
  ValidationError,
} from "@/lib/services/openrouter.service";

try {
  const response = await openRouter.sendChatMessage("Hello!");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded");
  } else if (error instanceof NetworkError) {
    console.error("Network error");
  } else if (error instanceof ValidationError) {
    console.error("Invalid request or response");
  }
}
```

## API Reference

### `createOpenRouterService(options?)`

Tworzy instancję serwisu OpenRouter.

**Parametry:**

```typescript
interface OpenRouterServiceOptions {
  apiKey?: string; // Klucz API (domyślnie z env)
  apiUrl?: string; // URL API (domyślnie OpenRouter)
  timeout?: number; // Timeout w ms (domyślnie 30000)
  maxRetries?: number; // Liczba prób (domyślnie 3)
  retryDelay?: number; // Opóźnienie retry w ms (domyślnie 1000)
  logger?: LoggerCallback; // Callback do logowania
  enableMetrics?: boolean; // Włącz metryki (domyślnie true)
}
```

### Metody publiczne

#### `setSystemMessage(message: string): void`

Ustawia komunikat systemowy definiujący zachowanie modelu.

#### `setUserMessage(message: string): void`

Ustawia komunikat użytkownika (opcjonalne, można przekazać w `sendChatMessage`).

#### `setResponseFormat(schema: JSONSchema): void`

Konfiguruje schemat JSON dla strukturalnych odpowiedzi.

#### `setModel(name: string, parameters?: ModelParameters): void`

Ustawia model i jego parametry.

**Parametry modelu:**

```typescript
interface ModelParameters {
  temperature?: number; // 0-2, kontrola kreatywności
  top_p?: number; // 0-1, nucleus sampling
  frequency_penalty?: number; // -2 do 2, karanie powtórzeń
  presence_penalty?: number; // -2 do 2, zachęta do nowych tematów
  max_tokens?: number; // Maksymalna liczba tokenów
}
```

#### `sendChatMessage<T>(userMessage?: string): Promise<T>`

Wysyła wiadomość do API i zwraca odpowiedź.

#### `sendChatMessageWithMetadata<T>(userMessage?: string): Promise<EnhancedResponse<T>>`

Wysyła wiadomość i zwraca odpowiedź z metadanymi (metryki, usage, czas).

## Integracja z generation.service.ts

Serwis OpenRouter jest używany w `generation.service.ts` do generowania fiszek:

```typescript
import { createOpenRouterService } from "./openrouter.service";

async function generateFlashcards(sourceText: string) {
  const openRouter = createOpenRouterService();

  openRouter.setModel("openai/gpt-4o-mini", {
    temperature: 0.7,
    max_tokens: 2000,
  });

  openRouter.setSystemMessage("You are an expert at creating flashcards...");
  openRouter.setResponseFormat(flashcardSchema);

  const response = await openRouter.sendChatMessage(
    `Generate flashcards from: ${sourceText}`
  );

  return response.flashcards;
}
```

## Bezpieczeństwo

- ✅ Klucze API przechowywane w zmiennych środowiskowych
- ✅ Brak logowania poufnych danych (API key)
- ✅ Walidacja wszystkich odpowiedzi z API
- ✅ Timeout dla zapobiegania zawieszeniom
- ✅ Rate limiting obsługiwany przez retry logic

## Testowanie

Serwis został zaprojektowany z myślą o testowaniu:

```typescript
// Mock dla testów jednostkowych
const mockOpenRouter = createOpenRouterService({
  apiKey: "test-key",
  enableMetrics: false,
  logger: jest.fn(),
});
```

## Przykłady użycia

Zobacz plik `openrouter.service.example.ts` dla pełnych przykładów użycia, w tym:

1. Podstawowy chat completion
2. Strukturalne odpowiedzi JSON
3. Konfiguracja modelu
4. Obsługa błędów
5. Reużywalny serwis z zarządzaniem stanem
6. Metryki i monitoring

## Wsparcie

W przypadku problemów:

1. Sprawdź czy `OPENROUTER_API_KEY` jest poprawnie ustawiony
2. Sprawdź logi błędów w konsoli
3. Zweryfikuj limity API w dashboardzie OpenRouter
4. Zobacz dokumentację: [https://openrouter.ai/docs](https://openrouter.ai/docs)

