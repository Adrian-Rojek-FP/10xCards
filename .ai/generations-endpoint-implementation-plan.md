# API Endpoint Implementation Plan: POST /generations

## 1. Przegląd punktu końcowego

Ten endpoint inicjuje proces generowania propozycji fiszek przez AI na podstawie tekstu dostarczonego przez użytkownika. Endpoint wykonuje następujące operacje:
- Waliduje dane wejściowe (długość tekstu źródłowego)
- Komunikuje się z usługą AI (OpenRouter) w celu wygenerowania propozycji fiszek
- Zapisuje metadane generacji w bazie danych
- Loguje błędy w dedykowanej tabeli w przypadku problemów z usługą AI
- Zwraca propozycje fiszek do klienta bez zapisywania ich do bazy (użytkownik zdecyduje, które zaakceptować)

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - **Wymagane**: Brak parametrów URL ani query string
  - **Opcjonalne**: Brak
- **Request Body** (JSON):
  ```json
  {
    "source_text": "Tekst źródłowy o długości między 1000 a 10000 znaków"
  }
  ```
- **Headers**:
  - `Content-Type: application/json`
  - Wymagana sesja Supabase (cookie/token)

## 3. Wykorzystywane typy

### Command Model (Input)
  ```typescript
// Z src/types.ts
  export interface GenerateFlashcardsCommand {
    source_text: string;
  }
  ```

### Response DTO (Output)
  ```typescript
// Z src/types.ts
  export interface GenerationCreateResponseDto {
    generation_id: number;
    flashcards_proposals: FlashcardProposalDto[];
    generated_count: number;
  }

  export interface FlashcardProposalDto {
    front: string;
    back: string;
    source: "ai-full";
  }
  ```

### Typy bazodanowe
```typescript
// Z src/types.ts
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLog = Database["public"]["Tables"]["generation_error_logs"]["Row"];
```

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)
  ```json
  {
    "generation_id": 123,
    "flashcards_proposals": [
    {
      "front": "Pytanie wygenerowane przez AI",
      "back": "Odpowiedź wygenerowana przez AI",
      "source": "ai-full"
    },
    {
      "front": "Drugie pytanie",
      "back": "Druga odpowiedź",
      "source": "ai-full"
    }
    ],
    "generated_count": 2
  }
  ```

### Błędy

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "source_text": "String must contain at least 1000 character(s)"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "AI generation failed",
  "message": "Failed to generate flashcards. Please try again later."
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Klient → POST /api/generations { source_text }
2. Astro Middleware → Weryfikacja sesji Supabase
   ├─ Brak sesji → 401 Unauthorized
   └─ Sesja OK → Przekazanie do handlera
3. API Handler → Walidacja Zod
   ├─ Błąd walidacji → 400 Bad Request
   └─ Walidacja OK → Wywołanie GenerationService
4. GenerationService:
   ├─ Rozpoczęcie pomiaru czasu (performance.now())
   ├─ Obliczenie SHA256 hash z source_text
   ├─ Wywołanie OpenRouter API
   │  ├─ Sukces:
   │  │  ├─ Parsowanie odpowiedzi AI
   │  │  ├─ Zakończenie pomiaru czasu
   │  │  ├─ Zapis do tabeli generations:
   │  │  │  - user_id
   │  │  │  - model (nazwa modelu AI)
   │  │  │  - generated_count
   │  │  │  - source_text_hash
   │  │  │  - source_text_length
   │  │  │  - generation_duration (ms)
   │  │  └─ Zwrócenie: { generation_id, proposals }
   │  └─ Błąd:
   │     ├─ Zapis do tabeli generation_error_logs:
   │     │  - user_id
   │     │  - model
   │     │  - source_text_hash
   │     │  - source_text_length
   │     │  - error_code
   │     │  - error_message
   │     └─ Rzucenie wyjątku
5. API Handler:
   ├─ Sukces → 201 Created + GenerationCreateResponseDto
   └─ Błąd → 500 Internal Server Error
```

### Szczegółowy przepływ krok po kroku

1. **Żądanie klienta**: Klient wysyła POST na `/api/generations` z `source_text` w body
2. **Middleware**: `src/middleware/index.ts` przechwytuje żądanie
   - Weryfikuje sesję użytkownika przez `supabase.auth.getUser()`
   - Jeśli brak uwierzytelnienia → zwraca 401
   - Jeśli OK → dodaje `user` do `Astro.locals` i przekazuje dalej
3. **Handler API**: `src/pages/api/generations.ts` otrzymuje żądanie
   - Pobiera `user_id` z `Astro.locals.user`
   - Parsuje body żądania
   - Waliduje dane wejściowe przez schema Zod
   - Jeśli walidacja niepomyślna → zwraca 400 z szczegółami błędu
4. **Wywołanie serwisu**: Handler wywołuje `GenerationService.generateFlashcards()`
   - Przekazuje: `source_text`, `user_id`, `supabase client`
5. **GenerationService - logika biznesowa**:
   - Rozpoczyna pomiar czasu: `const startTime = performance.now()`
   - Oblicza hash: `const hash = await createHash('sha256').update(source_text).digest('hex')`
   - Wywołuje OpenRouter API z `source_text`
   - **Przypadek sukcesu**:
     - Parsuje odpowiedź JSON z AI (lista fiszek)
     - Oblicza czas: `const duration = Math.round(performance.now() - startTime)`
     - Zapisuje do `generations`:
       ```typescript
       const { data, error } = await supabase
         .from('generations')
         .insert({
           user_id,
           model: 'model-name',
           generated_count: proposals.length,
           source_text_hash: hash,
           source_text_length: source_text.length,
           generation_duration: duration
         })
         .select()
         .single()
       ```
     - Zwraca obiekt z `generation_id` i `proposals`
   - **Przypadek błędu**:
     - Przechwytuje błąd z OpenRouter
     - Zapisuje do `generation_error_logs`:
       ```typescript
       await supabase
         .from('generation_error_logs')
         .insert({
           user_id,
           model: 'model-name',
           source_text_hash: hash,
           source_text_length: source_text.length,
           error_code: errorCode,
           error_message: errorMessage
         })
       ```
     - Rzuca wyjątek dalej
6. **Odpowiedź API**:
   - **Sukces**: Zwraca 201 z `GenerationCreateResponseDto`
   - **Błąd serwisu**: Łapie wyjątek i zwraca 500 z komunikatem

## 6. Względy bezpieczeństwa

### Uwierzytelnianie
- **Mechanizm**: Supabase Session Authentication
- **Implementacja**: Middleware Astro weryfikuje token sesji dla wszystkich tras `/api/*`
- **Guard**: Jeśli `Astro.locals.user` jest `null`, zwracamy 401 Unauthorized
- **Storage**: Session token przechowywany w HTTP-only cookie (zarządzane przez Supabase)

### Autoryzacja
- **Poziom**: Każdy uwierzytelniony użytkownik może generować fiszki
- **Izolacja danych**: Wszystkie operacje bazodanowe zawierają `user_id` w WHERE/INSERT
- **Row Level Security**: Możliwość włączenia RLS w przyszłości (obecnie wyłączone zgodnie z migracjami)

### Walidacja danych wejściowych
```typescript
import { z } from 'zod';

const generateFlashcardsSchema = z.object({
  source_text: z.string()
    .min(1000, 'Text must be at least 1000 characters')
    .max(10000, 'Text must not exceed 10000 characters')
});
```

### Ochrona API Keys
- **OpenRouter API Key**: Przechowywany w zmiennych środowiskowych
- **Dostęp**: `import.meta.env.OPENROUTER_API_KEY` (tylko po stronie serwera)
- **Eksponowanie**: Nigdy nie wysyłany do klienta (używany tylko w API endpoints)

### Rate Limiting (zalecane do przyszłej implementacji)
- Ograniczenie liczby generacji na użytkownika/minutę
- Można zrealizować przez middleware lub dedykowany serwis

### Sanityzacja danych
- Tekst źródłowy jest hashowany przed zapisem (nie przechowujemy pełnego tekstu)
- Brak możliwości SQL injection (używamy Supabase client z parametryzowanymi zapytaniami)

## 7. Obsługa błędów

### Katalog błędów

| Kod | Scenariusz | Przyczyna | Odpowiedź | Logowanie |
|-----|-----------|-----------|-----------|-----------|
| 400 | Walidacja nie powiodła się | `source_text` < 1000 lub > 10000 znaków | JSON z szczegółami błędu Zod | Nie |
| 400 | Nieprawidłowy JSON | Body żądania nie jest poprawnym JSON | `{ "error": "Invalid JSON" }` | Nie |
| 401 | Brak uwierzytelnienia | Brak lub nieprawidłowy token sesji | `{ "error": "Unauthorized" }` | Nie |
| 500 | Błąd OpenRouter API | Timeout, rate limit, błąd modelu | `{ "error": "AI generation failed" }` | TAK → `generation_error_logs` |
| 500 | Błąd zapisu do DB | Problem z połączeniem do Supabase | `{ "error": "Database error" }` | Console.error |
| 500 | Nieprzewidziany błąd | Inne wyjątki | `{ "error": "Internal server error" }` | Console.error |

### Implementacja obsługi błędów w API Handler

```typescript
export async function POST({ request, locals }: APIContext) {
  // Guard: Sprawdzenie uwierzytelnienia
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parsowanie body
    const body = await request.json();
    
    // Walidacja Zod
    const validationResult = generateFlashcardsSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Wywołanie serwisu
    const result = await generationService.generateFlashcards(
      validationResult.data.source_text,
      locals.user.id,
      locals.supabase
    );

    // Sukces
    return new Response(
      JSON.stringify(result),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    // Logowanie błędu
    console.error('Generation endpoint error:', error);
    
    // Zwrócenie 500
    return new Response(
      JSON.stringify({ 
        error: 'AI generation failed',
        message: 'Failed to generate flashcards. Please try again later.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Logowanie błędów AI do bazy danych

```typescript
// W GenerationService
async function logAIError(
  supabase: SupabaseClient,
  userId: string,
  model: string,
  textHash: string,
  textLength: number,
  errorCode: string,
  errorMessage: string
) {
  try {
    await supabase.from('generation_error_logs').insert({
      user_id: userId,
      model,
      source_text_hash: textHash,
      source_text_length: textLength,
      error_code: errorCode,
      error_message: errorMessage
    });
  } catch (dbError) {
    // Jeśli nawet logowanie nie działa, zapisz w konsoli
    console.error('Failed to log AI error to database:', dbError);
  }
}
```

## 8. Rozważania dotyczące wydajności

### Identyfikacja wąskich gardeł

1. **OpenRouter API Call** (główne wąskie gardło)
   - Czas odpowiedzi: 5-30 sekund (w zależności od modelu i długości tekstu)
   - Nie można przewidzieć dokładnego czasu
   - Brak możliwości cache'owania (każdy tekst jest unikalny)

2. **Obliczanie SHA256 hash**
   - Czas: < 10ms dla tekstu 10000 znaków
   - Wpływ: minimalny

3. **Zapis do bazy danych Supabase**
   - Czas: < 100ms
   - Wpływ: niski

### Strategie optymalizacji

#### Obecne (MVP)
- **Mierzenie czasu**: Zapisywanie `generation_duration` dla monitorowania
- **Async/await**: Używanie asynchronicznych operacji
- **Early returns**: Szybkie zwracanie błędów walidacji bez wywoływania AI

#### Przyszłe ulepszenia
- **Wybór modelu**: Umożliwienie użytkownikowi wyboru szybszego modelu (za cenę jakości)
- **Deduplikacja**: Sprawdzanie `source_text_hash` przed wywołaniem AI (czy użytkownik nie wysłał tego samego tekstu)
  ```typescript
  // Sprawdź czy już generowano dla tego hashu
  const existing = await supabase
    .from('generations')
    .select('id, generated_count')
    .eq('source_text_hash', hash)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (existing && isRecent(existing.created_at)) {
    // Można rozważyć ponowne użycie lub ostrzeżenie
  }
  ```
- **Streaming response**: W przyszłości można rozważyć streaming API, gdzie fiszki są zwracane w miarę generowania
- **Background processing**: Dla bardzo długich tekstów, rozważyć model asynchroniczny:
  1. Zwróć natychmiast `generation_id` ze statusem "processing"
  2. Przetwarzaj w tle
  3. Klient odpytuje endpoint `/api/generations/{id}` o status

### Monitoring
- **Metryki do śledzenia**:
  - Średni `generation_duration` per model
  - Success rate (generacje vs. błędy)
  - Najczęstsze `error_code` w `generation_error_logs`
  - Rozkład `source_text_length`

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska i konfiguracja
- [ ] Dodaj zmienną środowiskową `OPENROUTER_API_KEY` do `.env`
- [ ] Dodaj typy zmiennych środowiskowych do `src/env.d.ts`:
  ```typescript
  interface ImportMetaEnv {
    readonly OPENROUTER_API_KEY: string;
  }
  ```
- [ ] Zweryfikuj, że migracje bazy danych są zaaplikowane (`generations`, `generation_error_logs`)

### Krok 2: Aktualizacja middleware (jeśli potrzebna)
- [ ] Otwórz `src/middleware/index.ts`
- [ ] Upewnij się, że middleware:
  - Weryfikuje sesję użytkownika dla tras `/api/*`
  - Dodaje `user` do `Astro.locals`
  - Dodaje `supabase` do `Astro.locals`
- [ ] Przykładowa implementacja:
  ```typescript
  export async function onRequest(context: MiddlewareContext, next: MiddlewareNext) {
    const { request, locals, cookies } = context;
    
    // Inicjalizacja Supabase client
    locals.supabase = createSupabaseClient(/* ... */);
    
    // Pobranie użytkownika
    const { data: { user } } = await locals.supabase.auth.getUser();
    locals.user = user;
    
    // Dla API routes, wymagaj uwierzytelnienia
    if (request.url.includes('/api/') && !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return next();
  }
  ```

### Krok 3: Utworzenie Generation Service
- [ ] Utwórz plik `src/lib/services/generationService.ts`
- [ ] Zdefiniuj interfejs serwisu:
  ```typescript
  export interface GenerationResult {
    generation_id: number;
    flashcards_proposals: FlashcardProposalDto[];
    generated_count: number;
  }
  ```
- [ ] Zaimplementuj funkcję `generateFlashcards()`:
  ```typescript
  export async function generateFlashcards(
    sourceText: string,
    userId: string,
    supabase: SupabaseClient
  ): Promise<GenerationResult>
  ```

### Krok 4: Implementacja komunikacji z OpenRouter API
- [ ] W `generationService.ts` utwórz funkcję `callOpenRouterAPI()`:
  ```typescript
  async function callOpenRouterAPI(sourceText: string): Promise<any> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'YOUR_SITE_URL',
        'X-Title': '10xCards'
      },
      body: JSON.stringify({
        model: 'MODEL_NAME', // np. 'openai/gpt-3.5-turbo'
        messages: [
          {
            role: 'system',
            content: 'You are a flashcard generator. Generate flashcards from the provided text...'
          },
          {
            role: 'user',
            content: sourceText
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    return response.json();
  }
  ```
- [ ] Zaimplementuj parsowanie odpowiedzi AI do formatu `FlashcardProposalDto[]`
- [ ] Dodaj error handling dla różnych kodów błędów OpenRouter

### Krok 5: Implementacja logiki zapisu do bazy danych
- [ ] W `generationService.ts` dodaj funkcję obliczania hashu:
  ```typescript
  import { createHash } from 'crypto';
  
  function calculateHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }
  ```
- [ ] Zaimplementuj zapis do tabeli `generations`:
  ```typescript
  const { data: generation, error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      model: modelName,
      generated_count: proposals.length,
      source_text_hash: hash,
      source_text_length: sourceText.length,
      generation_duration: duration
    })
    .select()
    .single();
  
  if (error) throw error;
  ```
- [ ] Zaimplementuj zapis do tabeli `generation_error_logs`:
  ```typescript
  async function logError(
    supabase: SupabaseClient,
    userId: string,
    model: string,
    hash: string,
    length: number,
    errorCode: string,
    errorMessage: string
  ) {
    await supabase.from('generation_error_logs').insert({
      user_id: userId,
      model,
      source_text_hash: hash,
      source_text_length: length,
      error_code: errorCode,
      error_message: errorMessage
    });
  }
  ```

### Krok 6: Utworzenie API endpoint
- [ ] Utwórz plik `src/pages/api/generations.ts`
- [ ] Dodaj na początku: `export const prerender = false;`
- [ ] Zaimportuj potrzebne typy i zależności:
  ```typescript
  import type { APIContext } from 'astro';
  import { z } from 'zod';
  import type { GenerateFlashcardsCommand, GenerationCreateResponseDto } from '../../types';
  import { generateFlashcards } from '../../lib/services/generationService';
  ```

### Krok 7: Implementacja walidacji Zod
- [ ] W `src/pages/api/generations.ts` zdefiniuj schemę:
  ```typescript
  const generateFlashcardsSchema = z.object({
    source_text: z.string()
      .min(1000, 'Text must be at least 1000 characters')
      .max(10000, 'Text must not exceed 10000 characters')
  });
  ```

### Krok 8: Implementacja handlera POST
- [ ] Zaimplementuj funkcję `POST`:
  ```typescript
  export async function POST({ request, locals }: APIContext) {
    // 1. Guard: Sprawdzenie uwierzytelnienia
    if (!locals.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // 2. Parsowanie body
      const body = await request.json();
      
      // 3. Walidacja
      const validationResult = generateFlashcardsSchema.safeParse(body);
      if (!validationResult.success) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed', 
            details: validationResult.error.format() 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 4. Wywołanie serwisu
      const result = await generateFlashcards(
        validationResult.data.source_text,
        locals.user.id,
        locals.supabase
      );

      // 5. Zwrócenie sukcesu
      return new Response(
        JSON.stringify(result),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
      
    } catch (error) {
      console.error('Generation endpoint error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'AI generation failed',
          message: 'Failed to generate flashcards. Please try again later.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  ```

### Krok 9: Testowanie
- [ ] **Testy jednostkowe serwisu**:
  - Test: Poprawne obliczanie hashu SHA256
  - Test: Poprawne parsowanie odpowiedzi OpenRouter
  - Test: Zapis do `generations` przy sukcesie
  - Test: Zapis do `generation_error_logs` przy błędzie
  - Test: Pomiar czasu generacji

- [ ] **Testy integracyjne endpoint**:
  - Test: 401 gdy brak uwierzytelnienia
  - Test: 400 gdy `source_text` < 1000 znaków
  - Test: 400 gdy `source_text` > 10000 znaków
  - Test: 400 gdy nieprawidłowy JSON
  - Test: 201 przy poprawnym żądaniu (z mockowaniem OpenRouter)
  - Test: 500 przy błędzie OpenRouter (z mockowaniem błędu)

- [ ] **Testy manualne**:
  - Test z prawdziwym API OpenRouter
  - Weryfikacja zapisów w bazie danych
  - Test z różnymi długościami tekstu
  - Test z różnymi modelami AI

### Krok 10: Dokumentacja i finalizacja
- [ ] Dodaj komentarze JSDoc do funkcji publicznych
- [ ] Zaktualizuj README.md o informacje dotyczące endpointu
- [ ] Przygotuj przykłady użycia (curl, fetch)
- [ ] Dodaj endpoint do dokumentacji API (jeśli istnieje)
- [ ] Code review
- [ ] Merge do głównej gałęzi

### Krok 11: Monitoring i obserwacja (post-deploy)
- [ ] Monitoruj logi błędów w `generation_error_logs`
- [ ] Sprawdź średnie czasy `generation_duration`
- [ ] Monitoruj success rate
- [ ] Zbieraj feedback od użytkowników

---

## Dodatkowe uwagi implementacyjne

### Prompt dla OpenRouter
Przykładowy system prompt dla generowania fiszek:

```
You are an expert flashcard creator. Your task is to generate high-quality flashcards from the provided text.

Rules:
1. Generate 5-10 flashcards based on the most important concepts
2. Each flashcard should have:
   - Front: A clear, concise question (max 200 characters)
   - Back: A comprehensive answer (max 500 characters)
3. Focus on key facts, definitions, and concepts
4. Make questions specific and unambiguous
5. Ensure answers are complete and self-contained

Output format: Return a JSON array of objects with "front" and "back" properties.

Example:
[
  {
    "front": "What is photosynthesis?",
    "back": "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce oxygen and energy in the form of glucose."
  }
]
```

### Wybór modelu AI
Zalecane modele dla MVP:
- **OpenAI GPT-3.5 Turbo**: Dobry balans cena/jakość
- **OpenAI GPT-4**: Wyższa jakość, wyższy koszt
- **Anthropic Claude**: Dobra alternatywa

### Przykład użycia endpoint (client-side)

```typescript
async function generateFlashcards(sourceText: string) {
  const response = await fetch('/api/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include', // Ważne dla cookies sesji
    body: JSON.stringify({ source_text: sourceText })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate flashcards');
  }

  const data = await response.json();
  return data; // GenerationCreateResponseDto
}
```
