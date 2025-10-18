# API Endpoint Implementation Plan: Flashcards Management

> **Status dokumentu**: Zaktualizowano 2025-10-18 na podstawie analizy redundancji  
> **Postęp implementacji**: ~25% (1/5 endpointów + typy + częściowy service layer)

---

## 0. Status Implementacji (Current Status)

### ✅ Zaimplementowane

**Typy i DTOs** (`src/types.ts`):
- ✅ `FlashcardDto` - kompletny
- ✅ `FlashcardsListResponseDto` - kompletny
- ✅ `PaginationDto` - kompletny
- ✅ `Source` - kompletny
- ✅ `FlashcardCreateDto` - kompletny
- ✅ `FlashcardsCreateCommand` - kompletny
- ✅ `FlashcardUpdateDto` - kompletny

**Service Layer** (`src/lib/services/flashcard.service.ts`):
- ✅ `createFlashcards()` - w pełni funkcjonalny
  - Walidacja generation_id ownership (batch query)
  - Bulk insert optimization
  - Pełna obsługa błędów
  - Mapowanie na FlashcardDto

**API Endpoints**:
- ✅ **POST /api/flashcards** (`src/pages/api/flashcards.ts`) - w pełni funkcjonalny
  - Uwierzytelnianie użytkownika
  - Walidacja Zod (inline)
  - Obsługa błędów (400, 401, 500)
  - Response 201 Created

**Walidacja** (inline w `src/pages/api/flashcards.ts`):
- ✅ `FlashcardCreateSchema` (linie 19-53)
- ✅ `FlashcardsCreateCommandSchema` (linie 59-64)

### ❌ Brakujące Implementacje

**Service Layer** (wymagane w `src/lib/services/flashcard.service.ts`):
- ❌ `getFlashcards()` - lista z paginacją, filtrowaniem, sortowaniem
- ❌ `getFlashcardById()` - pojedyncza fiszka
- ❌ `updateFlashcard()` - aktualizacja fiszki
- ❌ `deleteFlashcard()` - usuwanie fiszki
- 🟡 `validateGenerationOwnership()` - istnieje inline w `createFlashcards()`, należy wydzielić

**API Endpoints**:
- ❌ **GET /api/flashcards** - lista (paginacja, filtrowanie, sortowanie)
- ❌ **GET /api/flashcards/{id}** - pojedyncza fiszka
- ❌ **PUT /api/flashcards/{id}** - aktualizacja ⚠️ **KRYTYCZNE dla US-005**
- ❌ **DELETE /api/flashcards/{id}** - usuwanie ⚠️ **KRYTYCZNE dla US-006**

**Walidacja** (należy utworzyć `src/lib/validation/flashcard.validation.ts`):
- 🟡 `flashcardCreateSchema` - przenieść z inline
- 🟡 `flashcardsCreateSchema` - przenieść z inline
- ❌ `flashcardsQuerySchema` - dla GET /flashcards
- ❌ `flashcardUpdateSchema` - dla PUT /flashcards/{id}
- ❌ `flashcardIdSchema` - dla path params

**Testy**:
- ❌ `tests/unit/flashcard.validation.test.ts`
- ❌ `tests/unit/flashcard.service.test.ts`
- ❌ `tests/e2e/flashcards-api.spec.ts`

### 🎯 Priorytety Implementacji

**P0 - KRYTYCZNE** (wymagane dla MVP zgodnego z PRD):
1. PUT /api/flashcards/{id} - edycja fiszek (US-005)
2. DELETE /api/flashcards/{id} - usuwanie fiszek (US-006)
3. GET /api/flashcards - lista fiszek (wymagane przez frontend)

**P1 - WAŻNE** (jakość i kompletność):
4. Testy E2E dla wszystkich endpointów
5. Refaktor walidacji do osobnego pliku

**P2 - NICE TO HAVE**:
6. GET /api/flashcards/{id} - można obejść przez lista + filter
7. Testy jednostkowe
8. Wydzielenie helper functions

### 📊 Postęp według kroków:

| Krok | Opis | Status | Postęp |
|------|------|--------|---------|
| Krok 1 | Walidacja Zod | 🟡 Częściowo | 40% (2/5 schematów, inline) |
| Krok 2 | Service Layer | 🟡 Częściowo | 20% (1/5 funkcji) |
| Krok 3 | GET /api/flashcards | ❌ Nie rozpoczęty | 0% |
| Krok 4 | GET /api/flashcards/{id} | ❌ Nie rozpoczęty | 0% |
| Krok 5 | POST /api/flashcards | ✅ Gotowe | 100% |
| Krok 6 | PUT /api/flashcards/{id} | ❌ Nie rozpoczęty | 0% ⚠️ |
| Krok 7 | DELETE /api/flashcards/{id} | ❌ Nie rozpoczęty | 0% ⚠️ |
| Krok 8 | Testy | ❌ Nie rozpoczęty | 0% |
| Krok 9 | Deployment | ❌ Nie dotyczy | - |

**Łączny postęp**: ~25% (endpoint POST + typy + serwis create)

---

## 1. Przegląd punktów końcowych

Ten plan wdrożeniowy obejmuje kompletny zestaw operacji CRUD dla fiszek (flashcards) w aplikacji 10xCards. System umożliwia użytkownikom tworzenie, odczytywanie, aktualizowanie i usuwanie fiszek, które mogą pochodzić z trzech źródeł: całkowicie wygenerowane przez AI (`ai-full`), edytowane po generowaniu AI (`ai-edited`), lub utworzone ręcznie (`manual`).

### Punkty końcowe do implementacji:

1. ❌ **GET `/api/flashcards`** - Pobieranie stronicowanej, filtrowanej i sortowanej listy fiszek ⚠️ **P0**
2. ❌ **GET `/api/flashcards/{id}`** - Pobieranie szczegółów pojedynczej fiszki (P2)
3. ✅ **POST `/api/flashcards`** - Tworzenie jednej lub wielu fiszek (ZAIMPLEMENTOWANE)
4. ❌ **PUT `/api/flashcards/{id}`** - Aktualizacja istniejącej fiszki ⚠️ **P0 KRYTYCZNE (US-005)**
5. ❌ **DELETE `/api/flashcards/{id}`** - Usuwanie fiszki ⚠️ **P0 KRYTYCZNE (US-006)**

**Legenda**:
- ✅ = Zaimplementowane i gotowe do użycia
- ❌ = Nie zaimplementowane
- ⚠️ P0 = Priorytet krytyczny (wymagane dla MVP zgodnego z PRD)
- P2 = Nice to have

Wszystkie punkty końcowe wymagają uwierzytelnienia użytkownika za pomocą Supabase Auth i przestrzegają zasad Row-Level Security (RLS) zapewniających, że użytkownicy mają dostęp tylko do własnych danych.

## 2. Szczegóły żądań

### 2.1. GET `/api/flashcards`

**Metoda HTTP**: GET

**Struktura URL**: `/api/flashcards?page=1&limit=10&sort=created_at&order=desc&source=manual&generation_id=123`

**Parametry zapytania**:
- **Opcjonalne**:
  - `page` (number, domyślnie: 1) - Numer strony
  - `limit` (number, domyślnie: 10, maksymalnie: 100) - Liczba wyników na stronę
  - `sort` (string, domyślnie: "created_at") - Pole sortowania: `created_at`, `updated_at`, `front`, `back`
  - `order` (string, domyślnie: "desc") - Kolejność sortowania: `asc`, `desc`
  - `source` (string) - Filtrowanie po źródle: `ai-full`, `ai-edited`, `manual`
  - `generation_id` (number) - Filtrowanie po ID generacji

**Nagłówki**:
- `Authorization: Bearer <token>` - Wymagany token Supabase Auth

**Treść żądania**: Brak

---

### 2.2. GET `/api/flashcards/{id}`

**Metoda HTTP**: GET

**Struktura URL**: `/api/flashcards/{id}`

**Parametry**:
- **Wymagane**:
  - `id` (number, path parameter) - ID fiszki do pobrania

**Nagłówki**:
- `Authorization: Bearer <token>` - Wymagany token Supabase Auth

**Treść żądania**: Brak

---

### 2.3. POST `/api/flashcards`

**Metoda HTTP**: POST

**Struktura URL**: `/api/flashcards`

**Parametry**: Brak

**Nagłówki**:
- `Authorization: Bearer <token>` - Wymagany token Supabase Auth
- `Content-Type: application/json`

**Treść żądania**:
```json
{
  "flashcards": [
    {
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null
    },
    {
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123
    }
  ]
}
```

**Reguły walidacji**:
- `flashcards` - tablica, wymagana, minimum 1 element
- `front` - string, wymagany, maksymalnie 200 znaków, nie może być pusty
- `back` - string, wymagany, maksymalnie 500 znaków, nie może być pusty
- `source` - enum: `"ai-full"`, `"ai-edited"`, `"manual"`, wymagany
- `generation_id`:
  - Dla `source: "manual"` - musi być `null`
  - Dla `source: "ai-full"` lub `"ai-edited"` - wymagany, musi być liczbą, musi należeć do użytkownika

---

### 2.4. PUT `/api/flashcards/{id}`

**Metoda HTTP**: PUT

**Struktura URL**: `/api/flashcards/{id}`

**Parametry**:
- **Wymagane**:
  - `id` (number, path parameter) - ID fiszki do aktualizacji

**Nagłówki**:
- `Authorization: Bearer <token>` - Wymagany token Supabase Auth
- `Content-Type: application/json`

**Treść żądania** (wszystkie pola opcjonalne):
```json
{
  "front": "Updated question",
  "back": "Updated answer",
  "source": "ai-edited",
  "generation_id": 123
}
```

**Reguły walidacji**:
- Co najmniej jedno pole musi być dostarczone
- `front` - string, maksymalnie 200 znaków (jeśli podany)
- `back` - string, maksymalnie 500 znaków (jeśli podany)
- `source` - enum: `"ai-full"`, `"ai-edited"`, `"manual"` (jeśli podany)
- `generation_id`:
  - Jeśli `source` zmieniane na `"manual"` - musi być `null`
  - Jeśli `source` zmieniane na `"ai-full"` lub `"ai-edited"` - wymagany, musi należeć do użytkownika

---

### 2.5. DELETE `/api/flashcards/{id}`

**Metoda HTTP**: DELETE

**Struktura URL**: `/api/flashcards/{id}`

**Parametry**:
- **Wymagane**:
  - `id` (number, path parameter) - ID fiszki do usunięcia

**Nagłówki**:
- `Authorization: Bearer <token>` - Wymagany token Supabase Auth

**Treść żądania**: Brak

## 3. Wykorzystywane typy

### 3.1. Istniejące typy z `src/types.ts`

```typescript
// Typ bazowy z bazy danych
type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];

// DTO dla pojedynczej fiszki w odpowiedziach
type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// DTO dla listy fiszek z paginacją
interface FlashcardsListResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

// Metadane paginacji
interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

// Typ źródła fiszki
type Source = "ai-full" | "ai-edited" | "manual";

// DTO dla tworzenia pojedynczej fiszki
interface FlashcardCreateDto {
  front: string;
  back: string;
  source: Source;
  generation_id: number | null;
}

// Command model dla tworzenia fiszek (bulk)
interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// DTO dla aktualizacji fiszki (partial)
type FlashcardUpdateDto = Partial<{
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
}>;
```

### 3.2. Nowe typy do zdefiniowania (opcjonalne, dla czytelności kodu)

```typescript
// Parametry zapytania dla GET /flashcards
interface FlashcardsQueryParams {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "front" | "back";
  order?: "asc" | "desc";
  source?: Source;
  generation_id?: number;
}

// Wewnętrzny typ dla filtrów Supabase
interface FlashcardsFilters {
  source?: Source;
  generation_id?: number;
}
```

## 4. Szczegóły odpowiedzi

### 4.1. GET `/api/flashcards`

**Status Code**: 200 OK

**Treść odpowiedzi**:
```json
{
  "data": [
    {
      "id": 1,
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-18T10:00:00Z",
      "updated_at": "2025-10-18T10:00:00Z"
    },
    {
      "id": 2,
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123,
      "created_at": "2025-10-18T11:00:00Z",
      "updated_at": "2025-10-18T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

---

### 4.2. GET `/api/flashcards/{id}`

**Status Code**: 200 OK

**Treść odpowiedzi**:
```json
{
  "id": 1,
  "front": "Question 1",
  "back": "Answer 1",
  "source": "manual",
  "generation_id": null,
  "created_at": "2025-10-18T10:00:00Z",
  "updated_at": "2025-10-18T10:00:00Z"
}
```

---

### 4.3. POST `/api/flashcards`

**Status Code**: 201 Created

**Treść odpowiedzi**:
```json
{
  "flashcards": [
    {
      "id": 1,
      "front": "Question 1",
      "back": "Answer 1",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-18T10:00:00Z",
      "updated_at": "2025-10-18T10:00:00Z"
    },
    {
      "id": 2,
      "front": "Question 2",
      "back": "Answer 2",
      "source": "ai-full",
      "generation_id": 123,
      "created_at": "2025-10-18T10:00:00Z",
      "updated_at": "2025-10-18T10:00:00Z"
    }
  ]
}
```

---

### 4.4. PUT `/api/flashcards/{id}`

**Status Code**: 200 OK

**Treść odpowiedzi**:
```json
{
  "id": 1,
  "front": "Updated Question",
  "back": "Updated Answer",
  "source": "ai-edited",
  "generation_id": 123,
  "created_at": "2025-10-18T10:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```

---

### 4.5. DELETE `/api/flashcards/{id}`

**Status Code**: 200 OK

**Treść odpowiedzi**:
```json
{
  "message": "Flashcard deleted successfully",
  "id": 1
}
```

## 5. Przepływ danych

### 5.1. GET `/api/flashcards` - Pobieranie listy

```
1. Request arrives → Astro API endpoint
   ↓
2. Extract & validate query parameters (page, limit, sort, order, filters)
   ↓
3. Get authenticated user from context.locals.supabase
   ↓
4. Call flashcardService.getFlashcards(userId, filters, pagination, sorting)
   ↓
5. Service layer:
   - Build Supabase query with filters
   - Apply RLS (automatic via user_id)
   - Apply sorting
   - Calculate offset from page/limit
   - Execute query with range()
   - Get total count for pagination
   ↓
6. Transform database results to FlashcardDto[]
   ↓
7. Build FlashcardsListResponseDto with pagination metadata
   ↓
8. Return JSON response with 200 status
```

### 5.2. GET `/api/flashcards/{id}` - Pobieranie pojedynczej fiszki

```
1. Request arrives → Astro API endpoint
   ↓
2. Extract & validate id from path parameter
   ↓
3. Get authenticated user from context.locals.supabase
   ↓
4. Call flashcardService.getFlashcardById(id, userId)
   ↓
5. Service layer:
   - Query flashcard by id
   - RLS ensures user_id match
   - Check if result exists
   ↓
6. If not found → throw 404 error
   ↓
7. Transform to FlashcardDto
   ↓
8. Return JSON response with 200 status
```

### 5.3. POST `/api/flashcards` - Tworzenie fiszek

```
1. Request arrives → Astro API endpoint
   ↓
2. Parse & validate request body with Zod schema
   ↓
3. Get authenticated user from context.locals.supabase
   ↓
4. For each flashcard with generation_id:
   - Validate generation belongs to user
   ↓
5. Call flashcardService.createFlashcards(flashcards, userId)
   ↓
6. Service layer:
   - Prepare insert objects with user_id
   - Execute bulk insert to database
   - Retrieve inserted records
   ↓
7. Transform results to FlashcardDto[]
   ↓
8. Return JSON response with 201 status
```

### 5.4. PUT `/api/flashcards/{id}` - Aktualizacja fiszki

```
1. Request arrives → Astro API endpoint
   ↓
2. Extract & validate id from path parameter
   ↓
3. Parse & validate request body with Zod schema
   ↓
4. Get authenticated user from context.locals.supabase
   ↓
5. If generation_id provided:
   - Validate generation belongs to user
   ↓
6. Call flashcardService.updateFlashcard(id, updates, userId)
   ↓
7. Service layer:
   - Execute update query (RLS ensures user_id match)
   - Check if record was updated (affected rows)
   - Retrieve updated record
   ↓
8. If not found → throw 404 error
   ↓
9. Transform to FlashcardDto
   ↓
10. Return JSON response with 200 status
```

### 5.5. DELETE `/api/flashcards/{id}` - Usuwanie fiszki

```
1. Request arrives → Astro API endpoint
   ↓
2. Extract & validate id from path parameter
   ↓
3. Get authenticated user from context.locals.supabase
   ↓
4. Call flashcardService.deleteFlashcard(id, userId)
   ↓
5. Service layer:
   - Execute delete query (RLS ensures user_id match)
   - Check if record was deleted (affected rows)
   ↓
6. If not found → throw 404 error
   ↓
7. Return success message with 200 status
```

## 6. Względy bezpieczeństwa

### 6.1. Uwierzytelnianie

- **Mechanizm**: Token-based authentication przez Supabase Auth
- **Implementacja**:
  - Token JWT przesyłany w nagłówku `Authorization: Bearer <token>`
  - Weryfikacja tokena przez Supabase client w middleware Astro
  - Dostęp do zautoryzowanego użytkownika przez `context.locals.supabase.auth.getUser()`
- **Obsługa błędów**: Brak tokena lub nieprawidłowy token → 401 Unauthorized

### 6.2. Autoryzacja

- **Row-Level Security (RLS)**:
  - Polityki RLS na tabeli `flashcards` zapewniają, że użytkownik ma dostęp tylko do swoich rekordów
  - Każda operacja automatycznie filtruje po `user_id = auth.uid()`
- **Walidacja własności generacji**:
  - Przy tworzeniu/aktualizacji z `generation_id`, weryfikować że generacja należy do użytkownika
  - Query: `SELECT id FROM generations WHERE id = ? AND user_id = ?`
  - Jeśli nie znaleziono → 403 Forbidden lub 400 Bad Request

### 6.3. Walidacja danych wejściowych

- **Ochrona przed atakami**:
  - Wszystkie dane wejściowe walidowane przez Zod schemas
  - Zapobiega SQL injection (Supabase używa parameterized queries)
  - Zapobiega XSS poprzez sanityzację i length limits
- **Limity długości**:
  - `front`: max 200 znaków
  - `back`: max 500 znaków
  - Zapobiega atakom DoS przez nadmierne dane

### 6.4. Rate Limiting (rekomendacja)

- Rozważyć implementację rate limiting na poziomie middleware
- Sugerowane limity:
  - GET endpoints: 100 requests/minute per user
  - POST/PUT/DELETE: 20 requests/minute per user

### 6.5. HTTPS

- Wszystkie endpointy muszą być dostępne tylko przez HTTPS w środowisku produkcyjnym
- Konfiguracja na poziomie infrastruktury (Cloudflare/reverse proxy)

## 7. Obsługa błędów

### 7.1. Katalog błędów

| Kod | Scenariusz | Komunikat | Dodatkowe informacje |
|-----|-----------|-----------|---------------------|
| 400 | Brak wymaganych parametrów | "Validation error" | Lista błędów walidacji |
| 400 | Nieprawidłowy format danych | "Invalid input format" | Szczegóły błędu Zod |
| 400 | `front` > 200 znaków | "Front text exceeds maximum length of 200 characters" | Pole i limit |
| 400 | `back` > 500 znaków | "Back text exceeds maximum length of 500 characters" | Pole i limit |
| 400 | Nieprawidłowy `source` | "Source must be one of: ai-full, ai-edited, manual" | Dozwolone wartości |
| 400 | `generation_id` null dla AI source | "generation_id is required for ai-full and ai-edited sources" | - |
| 400 | `generation_id` nie-null dla manual | "generation_id must be null for manual source" | - |
| 400 | Pusta tablica flashcards | "At least one flashcard is required" | - |
| 400 | Brak pól do aktualizacji (PUT) | "At least one field must be provided for update" | - |
| 401 | Brak tokena autoryzacji | "Authentication required" | - |
| 401 | Nieprawidłowy/wygasły token | "Invalid or expired token" | - |
| 403 | `generation_id` nie należy do usera | "Generation not found or access denied" | - |
| 404 | Fiszka nie istnieje | "Flashcard not found" | ID fiszki |
| 404 | Fiszka należy do innego usera | "Flashcard not found" | (nie ujawniamy istnienia) |
| 500 | Błąd bazy danych | "Internal server error" | Log szczegółów po stronie serwera |
| 500 | Nieoczekiwany błąd | "An unexpected error occurred" | Log stack trace |

### 7.2. Format odpowiedzi błędu

**Pojedynczy błąd**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Front text exceeds maximum length of 200 characters",
    "details": {
      "field": "front",
      "maxLength": 200,
      "actualLength": 250
    }
  }
}
```

**Wiele błędów walidacji**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "flashcards.0.front",
        "message": "Front text is required"
      },
      {
        "field": "flashcards.1.back",
        "message": "Back text exceeds maximum length of 500 characters"
      }
    ]
  }
}
```

### 7.3. Zasady logowania błędów

- **401/403/404**: Log na poziomie INFO (normalne przypadki biznesowe)
- **400**: Log na poziomie WARN z danymi wejściowymi (potencjalnie złośliwe dane)
- **500**: Log na poziomie ERROR z pełnym stack trace
- **Nie logować**: Tokenów, haseł, danych osobowych
- **Logować**: User ID, timestamp, endpoint, błąd, request ID

## 8. Rozważania dotyczące wydajności

### 8.1. Potencjalne wąskie gardła

1. **Stronicowanie dużych zbiorów danych**:
   - Problem: Offset-based pagination może być wolny dla dużych offsetów
   - Rozwiązanie: 
     - Limit maksymalny `limit` do 100
     - W przyszłości rozważyć cursor-based pagination

2. **N+1 queries przy walidacji generation_id**:
   - Problem: Sprawdzanie każdego generation_id osobno przy bulk create
   - Rozwiązanie: Batch query dla wszystkich unikalnych generation_ids

3. **Brak indeksów**:
   - Wymagane indeksy (z db-plan.md):
     - `flashcards(user_id)` - dla filtrowania RLS
     - `flashcards(generation_id)` - dla filtrowania po generacji
     - Dodatkowe: `flashcards(source)` - jeśli często filtrowane

4. **Bulk insert performance**:
   - Problem: Wstawianie dużej liczby fiszek naraz
   - Rozwiązanie: Limit maksymalnej liczby fiszek w jednym request (np. 50)

### 8.2. Strategie optymalizacji

1. **Caching** (przyszłość):
   - Cache dla często pobieranych list fiszek
   - Invalidacja przy POST/PUT/DELETE
   - Redis lub in-memory cache

2. **Database connection pooling**:
   - Supabase client automatycznie zarządza poolingiem
   - Sprawdzić konfigurację w supabase.client.ts

3. **Selective field fetching**:
   - `.select()` tylko potrzebnych pól
   - Unikać `SELECT *` jeśli nie wszystkie pola są używane

4. **Query optimization**:
   - Użyć `.count('exact')` tylko gdy potrzebne (pagination)
   - Rozważyć `.count('estimated')` dla dużych tabel

5. **Batch operations**:
   - Wykorzystać bulk insert dla wielu fiszek
   - Jedna transakcja zamiast wielu pojedynczych inserts

### 8.3. Monitoring i metryki

- Monitorować czas odpowiedzi dla każdego endpointu
- Śledzić liczby zapytań do bazy danych
- Alerty dla response time > 1s
- Metryki: p50, p95, p99 latency

## 9. Kroki implementacji

### Krok 1: Przygotowanie walidacji (Zod schemas)

> **Status**: 🟡 Częściowo (40%) - schematy istnieją inline, wymagany refaktor  
> **Priorytet**: P1 (refaktor), P0 (nowe schematy dla PUT/DELETE/GET)

**Plik**: `src/lib/validation/flashcard.validation.ts` (utworzyć nowy)

**Zadania**:

1. **✅ JUŻ ISTNIEJE** (w `src/pages/api/flashcards.ts`): Schematy dla POST
   - `FlashcardCreateSchema` (linie 19-53)
   - `FlashcardsCreateCommandSchema` (linie 59-64)
   
2. **🔄 REFAKTOR**: Przenieść istniejące schematy do nowego pliku walidacji:
   ```typescript
   // Przenieść z src/pages/api/flashcards.ts
   export const flashcardCreateSchema = z.object({
     front: z.string().min(1, "Front text is required").max(200, "Front text exceeds maximum length of 200 characters"),
     back: z.string().min(1, "Back text is required").max(500, "Back text exceeds maximum length of 500 characters"),
     source: z.enum(["ai-full", "ai-edited", "manual"]),
     generation_id: z.number().int().positive().nullable(),
   }).refine(/* walidacja generation_id - skopiować z istniejącego */);

   export const flashcardsCreateSchema = z.object({
     flashcards: z.array(flashcardCreateSchema).min(1).max(100),
   });
   ```

3. **❌ NOWY**: Zdefiniować schemat dla query params GET /flashcards:
   ```typescript
   export const flashcardsQuerySchema = z.object({
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(10),
     sort: z.enum(["created_at", "updated_at", "front", "back"]).default("created_at"),
     order: z.enum(["asc", "desc"]).default("desc"),
     source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
     generation_id: z.coerce.number().int().positive().optional(),
   });
   ```

3. Zdefiniować schemat dla pojedynczej fiszki (POST):
   ```typescript
   export const flashcardCreateSchema = z.object({
     front: z.string().min(1, "Front text is required").max(200, "Front text exceeds maximum length of 200 characters"),
     back: z.string().min(1, "Back text is required").max(500, "Back text exceeds maximum length of 500 characters"),
     source: z.enum(["ai-full", "ai-edited", "manual"]),
     generation_id: z.number().int().positive().nullable(),
   }).refine(
     (data) => {
       // Dla manual source, generation_id musi być null
       if (data.source === "manual" && data.generation_id !== null) {
         return false;
       }
       // Dla AI sources, generation_id jest wymagany
       if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
         return false;
       }
       return true;
     },
     {
       message: "generation_id must be null for manual source and required for AI sources",
     }
   );
   ```

4. Zdefiniować schemat dla bulk create:
   ```typescript
   export const flashcardsCreateSchema = z.object({
     flashcards: z.array(flashcardCreateSchema).min(1, "At least one flashcard is required"),
   });
   ```

5. Zdefiniować schemat dla update (PUT):
   ```typescript
   export const flashcardUpdateSchema = z.object({
     front: z.string().min(1).max(200).optional(),
     back: z.string().min(1).max(500).optional(),
     source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
     generation_id: z.number().int().positive().nullable().optional(),
   }).refine(
     (data) => Object.keys(data).length > 0,
     { message: "At least one field must be provided for update" }
   ).refine(
     (data) => {
       // Sprawdź spójność source i generation_id jeśli oba są podane
       if (data.source && data.generation_id !== undefined) {
         if (data.source === "manual" && data.generation_id !== null) return false;
         if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) return false;
       }
       return true;
     },
     { message: "Invalid combination of source and generation_id" }
   );
   ```

6. Zdefiniować schemat dla ID w path param:
   ```typescript
   export const flashcardIdSchema = z.coerce.number().int().positive();
   ```

**Testy jednostkowe**: Utworzyć testy dla każdego schematu w `tests/unit/flashcard.validation.test.ts`

---

### Krok 2: Implementacja warstwy serwisowej

> **Status**: 🟡 Częściowo (20%) - tylko `createFlashcards()` jest gotowy  
> **Priorytet**: P0 (brakujące funkcje dla PUT/DELETE/GET)

**Plik**: `src/lib/services/flashcard.service.ts` (rozszerzyć istniejący)

**Zadania**:

0. **✅ JUŻ ZAIMPLEMENTOWANE**: Funkcja `createFlashcards()` (linie 20-88)
   - ✅ Batch validation generation_ids
   - ✅ Generation ownership check
   - ✅ Bulk insert optimization
   - ✅ FlashcardDto mapping
   - ✅ Error handling

1. **🔄 REFAKTOR (opcjonalny)**: Wydzielić funkcję pomocniczą `validateGenerationOwnership()`:
   ```typescript
   // Wyciągnąć logikę z createFlashcards (linie 26-56)
   async function validateGenerationOwnership(
     supabase: SupabaseClient,
     generationId: number,
     userId: string
   ): Promise<boolean>
   ```
   - Query generations table
   - Zwrócić true/false
   - Reużyć w createFlashcards(), updateFlashcard()

2. **❌ NOWY** (P0 - KRYTYCZNE): Zaimplementować funkcję `getFlashcards`:
   ```typescript
   export async function getFlashcards(
     supabase: SupabaseClient,
     userId: string,
     filters: { source?: Source; generation_id?: number },
     pagination: { page: number; limit: number },
     sorting: { sort: string; order: "asc" | "desc" }
   ): Promise<FlashcardsListResponseDto>
   ```
   - Budować query z filtrami
   - Zastosować sortowanie
   - Pobrać total count
   - Pobrać dane z offset/limit
   - Zwrócić dane + pagination metadata

3. Zaimplementować funkcję `getFlashcardById`:
   ```typescript
   export async function getFlashcardById(
     supabase: SupabaseClient,
     id: number,
     userId: string
   ): Promise<FlashcardDto>
   ```
   - Query po id
   - Sprawdzić czy istnieje
   - Zwrócić lub throw error 404

4. Zaimplementować funkcję pomocniczą `validateGenerationOwnership`:
   ```typescript
   async function validateGenerationOwnership(
     supabase: SupabaseClient,
     generationId: number,
     userId: string
   ): Promise<boolean>
   ```
   - Query generations table
   - Zwrócić true/false

5. Zaimplementować funkcję `createFlashcards`:
   ```typescript
   export async function createFlashcards(
     supabase: SupabaseClient,
     flashcards: FlashcardCreateDto[],
     userId: string
   ): Promise<FlashcardDto[]>
   ```
   - Zebrać unikalne generation_ids
   - Zwalidować ownership (batch query)
   - Przygotować insert objects z user_id
   - Wykonać bulk insert
   - Zwrócić created records

6. Zaimplementować funkcję `updateFlashcard`:
   ```typescript
   export async function updateFlashcard(
     supabase: SupabaseClient,
     id: number,
     updates: FlashcardUpdateDto,
     userId: string
   ): Promise<FlashcardDto>
   ```
   - Jeśli generation_id w updates, zwalidować ownership
   - Wykonać update (RLS automatic)
   - Sprawdzić affected rows
   - Pobrać i zwrócić updated record lub throw 404

7. Zaimplementować funkcję `deleteFlashcard`:
   ```typescript
   export async function deleteFlashcard(
     supabase: SupabaseClient,
     id: number,
     userId: string
   ): Promise<void>
   ```
   - Wykonać delete (RLS automatic)
   - Sprawdzić affected rows
   - Throw 404 jeśli nie usunięto

**Obsługa błędów**: Każda funkcja powinna throw odpowiednie błędy (strukturalne error objects)

**Testy jednostkowe**: Utworzyć testy w `tests/unit/flashcard.service.test.ts` z mockowanym Supabase client

---

### Krok 3: Implementacja endpointu GET /flashcards

> **Status**: ❌ Nie rozpoczęty (0%)  
> **Priorytet**: P0 - KRYTYCZNE (wymagane przez frontend i PRD)

**Plik**: `src/pages/api/flashcards/index.ts` (utworzyć lub rozszerzyć istniejący `flashcards.ts`)

**Zadania**:

1. Utworzyć endpoint handler:
   ```typescript
   import type { APIRoute } from "astro";
   import { flashcardsQuerySchema } from "../../../lib/validation/flashcard.validation";
   import { getFlashcards } from "../../../lib/services/flashcard.service";
   
   export const prerender = false;
   
   export const GET: APIRoute = async ({ request, locals, url }) => {
     // Implementation
   };
   ```

2. Zaimplementować logikę GET:
   - Pobrać user z `locals.supabase.auth.getUser()`
   - Sprawdzić autentykację (401 jeśli brak)
   - Sparsować i zwalidować query params przez `flashcardsQuerySchema`
   - Wydzielić filters, pagination, sorting
   - Wywołać `getFlashcards` service
   - Zwrócić Response z JSON (200)

3. Obsługa błędów:
   - Catch Zod validation errors → 400
   - Catch auth errors → 401
   - Catch service errors → odpowiedni status
   - Catch unexpected errors → 500

4. Format odpowiedzi zgodny z specyfikacją

**Test E2E**: Utworzyć test w `tests/e2e/flashcards-api.spec.ts`

---

### Krok 4: Implementacja endpointu GET /flashcards/{id}

> **Status**: ❌ Nie rozpoczęty (0%)  
> **Priorytet**: P2 - Nice to have (można obejść przez GET lista + filter na froncie)

**Plik**: `src/pages/api/flashcards/[id].ts` (utworzyć nowy)

**Zadania**:

1. Utworzyć endpoint handler z dynamic route:
   ```typescript
   export const GET: APIRoute = async ({ params, locals }) => {
     // Implementation
   };
   ```

2. Zaimplementować logikę GET:
   - Pobrać user z `locals.supabase.auth.getUser()`
   - Sprawdzić autentykację (401 jeśli brak)
   - Sparsować i zwalidować `params.id` przez `flashcardIdSchema`
   - Wywołać `getFlashcardById` service
   - Zwrócić Response z JSON (200)

3. Obsługa błędów:
   - Catch validation errors → 400
   - Catch auth errors → 401
   - Catch 404 from service → 404
   - Catch unexpected errors → 500

**Test E2E**: Dodać testy do `tests/e2e/flashcards-api.spec.ts`

---

### Krok 5: Implementacja endpointu POST /flashcards

> **Status**: ✅ Gotowe (100%)  
> **Lokalizacja**: `src/pages/api/flashcards.ts`

**Plik**: `src/pages/api/flashcards.ts` (już zaimplementowany, linie 87-193)

**Status zadań**:

1. ✅ **GOTOWE**: POST handler (linia 87):
   ```typescript
   export const POST: APIRoute = async ({ request, locals }) => {
     // Pełna implementacja
   };
   ```

2. ✅ **GOTOWE**: Logika POST:
   - ✅ Pobranie user z `locals.user` (linia 90)
   - ✅ Sprawdzenie autentykacji (linie 93-104)
   - ✅ Parsowanie request body (linie 107-121)
   - ✅ Walidacja przez inline schema (linie 124-143)
   - ✅ Wywołanie `createFlashcards` service (linia 148)
   - ✅ Response z JSON (status 201, linie 151-159)

3. ✅ **GOTOWE**: Obsługa błędów:
   - ✅ Zod validation errors → 400 (linie 126-143)
   - ✅ Auth errors → 401 (linie 93-104)
   - ✅ Generation ownership errors → 400 (linie 168-179)
   - ✅ Unexpected errors → 500 (linie 182-191)

4. ✅ **GOTOWE**: Format odpowiedzi: `{ flashcards: FlashcardDto[] }`

**Uwagi**:
- **🔄 OPCJONALNIE**: Przenieść ten handler do `src/pages/api/flashcards/index.ts` (razem z GET)
- **🔄 REFAKTOR**: Zamienić inline schematy na import z validation file (po implementacji Kroku 1)
- **❌ BRAK**: Testy E2E (wymagane w Kroku 8)

**Test E2E**: ❌ Dodać testy do `tests/e2e/flashcards-api.spec.ts` (P1)

---

### Krok 6: Implementacja endpointu PUT /flashcards/{id}

> **Status**: ❌ Nie rozpoczęty (0%)  
> **Priorytet**: P0 - KRYTYCZNE (US-005: Edycja fiszek - wymagane w PRD)

**Plik**: `src/pages/api/flashcards/[id].ts` (ten sam co GET {id})

**Zadania**:

1. Dodać PUT handler:
   ```typescript
   export const PUT: APIRoute = async ({ params, request, locals }) => {
     // Implementation
   };
   ```

2. Zaimplementować logikę PUT:
   - Pobrać user z `locals.supabase.auth.getUser()`
   - Sprawdzić autentykację (401 jeśli brak)
   - Sparsować i zwalidować `params.id`
   - Sparsować request body (JSON)
   - Zwalidować przez `flashcardUpdateSchema`
   - Wywołać `updateFlashcard` service
   - Zwrócić Response z JSON (200)

3. Obsługa błędów:
   - Catch validation errors → 400
   - Catch auth errors → 401
   - Catch 404 from service → 404
   - Catch generation ownership errors → 403 lub 400
   - Catch unexpected errors → 500

**Test E2E**: Dodać testy do `tests/e2e/flashcards-api.spec.ts`

---

### Krok 7: Implementacja endpointu DELETE /flashcards/{id}

> **Status**: ❌ Nie rozpoczęty (0%)  
> **Priorytet**: P0 - KRYTYCZNE (US-006: Usuwanie fiszek - wymagane w PRD)

**Plik**: `src/pages/api/flashcards/[id].ts` (ten sam co GET i PUT)

**Zadania**:

1. Dodać DELETE handler:
   ```typescript
   export const DELETE: APIRoute = async ({ params, locals }) => {
     // Implementation
   };
   ```

2. Zaimplementować logikę DELETE:
   - Pobrać user z `locals.supabase.auth.getUser()`
   - Sprawdzić autentykację (401 jeśli brak)
   - Sparsować i zwalidować `params.id`
   - Wywołać `deleteFlashcard` service
   - Zwrócić Response z JSON (200)

3. Format odpowiedzi: `{ message: "Flashcard deleted successfully", id: number }`

4. Obsługa błędów:
   - Catch validation errors → 400
   - Catch auth errors → 401
   - Catch 404 from service → 404
   - Catch unexpected errors → 500

**Test E2E**: Dodać testy do `tests/e2e/flashcards-api.spec.ts`

---

### Krok 8: Weryfikacja i testy integracyjne

**Zadania**:

1. **Testy jednostkowe**:
   - Przetestować wszystkie schematy walidacji Zod
   - Przetestować wszystkie funkcje serwisowe z mockowanym Supabase
   - Pokrycie kodu > 80%

2. **Testy E2E**:
   - Scenariusze happy path dla każdego endpointu
   - Scenariusze błędów (401, 400, 404, 403)
   - Test paginacji i filtrowania
   - Test bulk create z wieloma fiszkami
   - Test walidacji generation_id ownership
   - Test RLS (próba dostępu do cudzych fiszek)

3. **Testy manualne** (opcjonalne, ale zalecane):
   - Testowanie przez Postman/Insomnia
   - Weryfikacja w lokalnym środowisku Supabase

4. **Dokumentacja**:
   - Zaktualizować API documentation (jeśli istnieje)
   - Dodać przykłady request/response do README

5. **Linting i formatting**:
   - Uruchomić ESLint
   - Uruchomić Prettier
   - Naprawić wszystkie błędy i warningi

---

### Krok 9: Deployment i monitoring

**Zadania**:

1. **Przygotowanie do deployment**:
   - Sprawdzić zmienne środowiskowe
   - Weryfikacja konfiguracji Supabase (RLS policies, indeksy)
   - Build aplikacji i weryfikacja braku błędów

2. **Deployment**:
   - Deploy na środowisko staging/preview
   - Smoke tests na staging
   - Deploy na produkcję

3. **Monitoring** (post-deployment):
   - Monitorować logi błędów
   - Sprawdzić metryki wydajności
   - Weryfikować response times
   - Śledzić usage patterns

4. **Dokumentacja użytkownika** (jeśli dotyczy):
   - Zaktualizować dokumentację API dla użytkowników
   - Przygotować przykłady integracji

---

## 10. Uwagi końcowe i best practices

### 10.1. Kwestie do rozważenia w przyszłości

1. **Cursor-based pagination**: Jeśli tabela flashcards urośnie znacząco, rozważyć migrację z offset-based na cursor-based pagination dla lepszej wydajności.

2. **Soft delete**: Zamiast trwałego usuwania, rozważyć dodanie kolumny `deleted_at` i implementację soft delete dla możliwości odzyskania danych.

3. **Audit log**: Dla celów compliance, rozważyć logowanie wszystkich operacji CRUD (kto, kiedy, co zmienił).

4. **Versioning**: Jeśli fiszki będą często edytowane, rozważyć system wersjonowania zmian.

5. **Full-text search**: Implementacja wyszukiwania pełnotekstowego w `front` i `back` dla lepszego UX.

6. **Bulk operations endpoint**: Dedykowany endpoint dla bulk update/delete jeśli taka potrzeba się pojawi.

### 10.2. Best practices

1. **Spójność typów**: Zawsze używać typów z `src/types.ts`, nie duplikować definicji.

2. **Error handling**: Używać strukturalnych error objects zamiast zwykłych string messages.

3. **Logging**: Logować wszystkie operacje z odpowiednim poziomem (INFO, WARN, ERROR).

4. **Validation**: Walidacja na wszystkich poziomach (schema, business logic, database constraints).

5. **Security**: Nigdy nie ufać danym wejściowym, zawsze walidować i sanitize.

6. **Performance**: Monitorować query performance, dodawać indeksy gdzie potrzeba.

7. **Testing**: Pisać testy przed lub równolegle z kodem (TDD approach).

8. **Documentation**: Dokumentować nietypowe rozwiązania i business logic w komentarzach.

---

## 11. Checklist implementacji

### Krok 1: Schematy walidacji Zod (40% - częściowo inline)

**Utworzyć plik**: `src/lib/validation/flashcard.validation.ts`

- [x] flashcardCreateSchema (istniejący inline w `src/pages/api/flashcards.ts:19-53`)
- [x] flashcardsCreateSchema (istniejący inline w `src/pages/api/flashcards.ts:59-64`)
- [ ] **🔄 REFAKTOR**: Przenieść powyższe schematy do validation file
- [ ] flashcardsQuerySchema (nowy - dla GET lista)
- [ ] flashcardUpdateSchema (nowy - dla PUT)
- [ ] flashcardIdSchema (nowy - dla path params)
- [ ] Testy jednostkowe dla walidacji (`tests/unit/flashcard.validation.test.ts`)

### Krok 2: Flashcard service (20% - tylko create)

**Plik**: `src/lib/services/flashcard.service.ts`

- [x] createFlashcards() (istniejący, linie 20-88, w pełni funkcjonalny)
- [ ] **🔄 REFAKTOR**: Wydzielić validateGenerationOwnership() z createFlashcards()
- [ ] getFlashcards() (nowy - z paginacją, filtrowaniem, sortowaniem) ⚠️ **P0**
- [ ] getFlashcardById() (nowy - pojedyncza fiszka)
- [ ] updateFlashcard() (nowy - aktualizacja) ⚠️ **P0 KRYTYCZNE**
- [ ] deleteFlashcard() (nowy - usuwanie) ⚠️ **P0 KRYTYCZNE**
- [ ] Testy jednostkowe dla service (`tests/unit/flashcard.service.test.ts`)

### Krok 3: Endpoint GET /api/flashcards (0%)

**Plik**: `src/pages/api/flashcards/index.ts` (przeznaczyć lub refaktor istniejącego)

- [ ] Handler z walidacją query params ⚠️ **P0**
- [ ] Error handling (400, 401, 500)
- [ ] Testy E2E (`tests/e2e/flashcards-api.spec.ts`)

### Krok 4: Endpoint GET /api/flashcards/{id} (0%)

**Plik**: `src/pages/api/flashcards/[id].ts` (utworzyć nowy)

- [ ] Handler z walidacją path param
- [ ] Error handling (400, 401, 404, 500)
- [ ] Testy E2E (`tests/e2e/flashcards-api.spec.ts`)

### Krok 5: Endpoint POST /api/flashcards (100% ✅)

**Plik**: `src/pages/api/flashcards.ts` (istniejący)

- [x] Handler z walidacją (linie 87-193)
- [x] Error handling (400, 401, 500)
- [ ] Testy E2E (`tests/e2e/flashcards-api.spec.ts`)
- [ ] **🔄 OPCJONALNIE**: Przenieść do `src/pages/api/flashcards/index.ts`

### Krok 6: Endpoint PUT /api/flashcards/{id} (0%)

**Plik**: `src/pages/api/flashcards/[id].ts` (ten sam co GET {id})

- [ ] Handler z walidacją ⚠️ **P0 KRYTYCZNE - US-005**
- [ ] Error handling (400, 401, 403, 404, 500)
- [ ] Testy E2E (`tests/e2e/flashcards-api.spec.ts`)

### Krok 7: Endpoint DELETE /api/flashcards/{id} (0%)

**Plik**: `src/pages/api/flashcards/[id].ts` (ten sam co GET {id} i PUT)

- [ ] Handler z walidacją ⚠️ **P0 KRYTYCZNE - US-006**
- [ ] Error handling (400, 401, 404, 500)
- [ ] Testy E2E (`tests/e2e/flashcards-api.spec.ts`)

### Krok 8: Weryfikacja (0%)

- [ ] Wszystkie testy jednostkowe przechodzą
- [ ] Wszystkie testy E2E przechodzą ⚠️ **P1**
- [ ] Linting bez błędów
- [ ] Testy manualne (opcjonalne)
- [ ] Pokrycie kodu > 80% (opcjonalne)

### Krok 9: Deployment (nie dotyczy jeszcze)

- [ ] Deploy na staging
- [ ] Smoke tests
- [ ] Deploy na produkcję
- [ ] Monitoring

### Dokumentacja

- [ ] API documentation zaktualizowana
- [ ] Przykłady dodane do README
- [ ] Komentarze w kodzie

---

## 12. Szybka ścieżka MVP (Quick Path)

Jeśli priorytetem jest szybkie dostarczenie MVP zgodnego z PRD (US-004, US-005, US-006), zalecana kolejność:

### Faza 1: Krytyczne funkcje (2-3 dni)
1. ✅ ~~POST /api/flashcards~~ (już gotowe)
2. **Service**: `updateFlashcard()`, `deleteFlashcard()`, `getFlashcards()`
3. **Validation**: Minimum - `flashcardUpdateSchema`, `flashcardIdSchema`, `flashcardsQuerySchema`
4. **Endpoints**: PUT /flashcards/{id}, DELETE /flashcards/{id}, GET /flashcards

### Faza 2: Testy podstawowe (1 dzień)
5. **E2E Tests**: Happy paths dla CRUD + podstawowe error cases

### Faza 3: Polish (1 dzień)
6. Refaktor walidacji do osobnego pliku
7. Wydzielenie helper functions
8. Testy jednostkowe (coverage > 80%)

**Łączny czas**: 4-5 dni roboczych do pełnego MVP

---

## 13. Wnioski z analizy redundancji

### 13.1. Co zostało dobrze zrobione

✅ **POST /api/flashcards jest doskonale zaimplementowany**:
- Pełna walidacja z Zod
- Batch insert optimization
- Generation ownership validation z batch query
- Dobra obsługa błędów (400, 401, 500)
- Zgodność z planowaną specyfikacją

✅ **Typy są kompletne i dobrze zaprojektowane**:
- Wszystkie DTOs z sekcji 3.1 są już zdefiniowane w `src/types.ts`
- Brak potrzeby dodawania nowych typów

✅ **Service layer ma solidne fundamenty**:
- `createFlashcards()` jest w pełni funkcjonalny
- Łatwo rozbudować o pozostałe funkcje CRUD
- Dobry wzorzec do naśladowania

### 13.2. Co wymaga działania

⚠️ **Brak 4/5 endpointów** - tylko 20% API jest gotowe:
- PUT i DELETE są krytyczne dla US-005 i US-006 (wymagania PRD)
- GET lista jest niezbędne dla frontend

⚠️ **Brak testów** - ryzyko dla jakości:
- Brak testów E2E dla istniejącego POST endpoint
- Brak testów jednostkowych dla service layer
- Może prowadzić do regresji w przyszłości

⚠️ **MVP niekompletne**:
- US-005 (Edycja fiszek) - NIE zrealizowane
- US-006 (Usuwanie fiszek) - NIE zrealizowane

### 13.3. Rekomendacje architektoniczne

**Struktura plików (docelowa)**:
```
src/pages/api/
  flashcards/
    index.ts          <- GET (lista) + POST (istniejący, przenieść)
    [id].ts           <- GET (single) + PUT + DELETE

src/lib/
  validation/
    flashcard.validation.ts  <- Wszystkie schematy Zod (przenieść + nowe)
  services/
    flashcard.service.ts     <- Rozszerzyć o CRUD (już jest create)
```

**Kolejność refaktoringu**:
1. Najpierw dodać nowe funkcje (priorytet: działający MVP)
2. Potem refaktor (przenieść POST, wydzielić walidację)
3. Na końcu testy i polish

### 13.4. Przestarzałe dokumenty

⚠️ **flashcards-endpoint-implementation-plan.md** jest przestarzały:
- Opisuje tylko POST /api/flashcards (już zaimplementowany)
- Mniej szczegółowy niż ten plan
- Może prowadzić do rozbieżności

**Akcja**: Oznaczyć jako przestarzały lub usunąć

---

**Data ostatniej aktualizacji**: 2025-10-18  
**Wersja dokumentu**: 2.0 (zaktualizowana na podstawie analizy redundancji)  
**Status**: Aktywny plan implementacji - 25% gotowe, 75% do zrobienia

