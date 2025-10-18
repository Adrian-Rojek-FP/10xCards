# Learning System Update - Implementation Plan

**Data utworzenia**: 2025-10-18  
**Status**: 🟡 Do implementacji  
**Autor**: Development Team

---

## 📋 Spis treści

1. [Przegląd zmian](#1-przegląd-zmian)
2. [Weryfikacja statusu migracji](#2-weryfikacja-statusu-migracji)
3. [Regeneracja typów TypeScript](#3-regeneracja-typów-typescript)
4. [Aktualizacja warstwy typów](#4-aktualizacja-warstwy-typów)
5. [Implementacja serwisów](#5-implementacja-serwisów)
6. [Implementacja walidacji](#6-implementacja-walidacji)
7. [Implementacja endpointów API](#7-implementacja-endpointów-api)
8. [Testy](#8-testy)
9. [Checklisty](#9-checklisty)

---

## 1. Przegląd zmian

### 1.1. Nowe elementy w bazie danych

#### Tabele:
- ✅ **`learning_state`** - Stan nauki fiszek (algorytm SM-2)
- ✅ **`review_history`** - Historia przeglądów (immutable)

#### ENUM types:
- ✅ **`flashcard_source`** - Źródło fiszki ('ai-full', 'ai-edited', 'manual')
- ✅ **`learning_status`** - Status nauki ('new', 'learning', 'review', 'relearning')
- ✅ **`review_rating`** - Ocena przeglądu ('again', 'hard', 'good', 'easy')

#### Triggery:
- ✅ **`create_initial_learning_state`** - Automatyczne tworzenie stanu nauki przy INSERT flashcard
- ✅ **`update_learning_state_updated_at`** - Automatyczna aktualizacja timestamp

### 1.2. Nowe endpointy API

- `GET /api/learning/session` - Pobieranie fiszek do przeglądu
- `POST /api/learning/review` - Zapisanie odpowiedzi i aktualizacja stanu SM-2
- `GET /api/learning/stats` - Statystyki nauki użytkownika
- `GET /api/learning/history` - Historia przeglądów

### 1.3. Główne zależności

- Migracje bazy danych: 5 nowych plików SQL
- TypeScript types z Supabase
- Algorytm SM-2 (SuperMemo 2)
- Transakcje bazodanowe (atomowe UPDATE + INSERT)

---

## 2. Weryfikacja statusu migracji

### 2.1. Sprawdzenie migracji lokalnych

**Pliki migracji do weryfikacji:**
```
supabase/migrations/
├── 20251018120000_add_enum_types.sql               ✅ Created
├── 20251018121500_update_existing_tables.sql       ✅ Created
├── 20251018123000_create_learning_state_table.sql  ✅ Created
├── 20251018124500_create_review_history_table.sql  ✅ Created
└── 20251018125500_update_rls_policies_for_immutable_tables.sql ✅ Created
```

### 2.2. Zadania weryfikacyjne

**KROK 1**: Sprawdź status lokalnej bazy Supabase
```bash
# Uruchom Supabase lokalnie (jeśli nie jest uruchomiony)
npx supabase start

# Sprawdź status migracji
npx supabase migration list
```

**KROK 2**: Zastosuj nowe migracje
```bash
# Jeśli migracje nie są zastosowane, uruchom:
npx supabase db reset

# Lub zastosuj tylko nowe migracje:
npx supabase db push
```

**KROK 3**: Zweryfikuj strukturę bazy danych
```bash
# Połącz się z bazą danych
npx supabase db dump --data-only=false --schema public

# Sprawdź czy tabele learning_state i review_history istnieją
```

**OCZEKIWANY WYNIK:**
- ✅ Wszystkie 5 migracji są zastosowane
- ✅ Tabele `learning_state` i `review_history` istnieją
- ✅ ENUM types są utworzone
- ✅ Triggery są aktywne
- ✅ RLS policies są skonfigurowane

---

## 3. Regeneracja typów TypeScript

### 3.1. Aktualna sytuacja

**Obecny stan `src/db/database.types.ts`:**
- ✅ `flashcards` table
- ✅ `generations` table
- ✅ `generation_error_logs` table
- ❌ `learning_state` table - **BRAK**
- ❌ `review_history` table - **BRAK**
- ❌ Enums section - **PUSTY**

### 3.2. Regeneracja typów

**KROK 1**: Wygeneruj nowe typy z Supabase
```bash
# Upewnij się, że Supabase CLI jest zalogowany
npx supabase login

# Wygeneruj typy z lokalnej instancji
npx supabase gen types typescript --local > src/db/database.types.ts

# LUB z produkcji (jeśli migracje są już wdrożone)
npx supabase gen types typescript --project-id <PROJECT_ID> > src/db/database.types.ts
```

**KROK 2**: Zweryfikuj wygenerowane typy

**Oczekiwane zmiany w `database.types.ts`:**

```typescript
export interface Database {
  public: {
    Tables: {
      flashcards: { /* ... */ },
      generations: { /* ... */ },
      generation_error_logs: { /* ... */ },
      learning_state: {  // ✅ NOWA TABELA
        Row: {
          id: number;
          flashcard_id: number;
          user_id: string;
          status: Database['public']['Enums']['learning_status'];
          easiness_factor: number;
          interval: number;
          repetitions: number;
          lapses: number;
          next_review_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      },
      review_history: {  // ✅ NOWA TABELA
        Row: {
          id: number;
          flashcard_id: number;
          user_id: string;
          rating: number;
          review_duration_ms: number | null;
          previous_interval: number;
          new_interval: number;
          previous_easiness_factor: number;
          new_easiness_factor: number;
          reviewed_at: string;
        };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      }
    },
    Enums: {  // ✅ NOWA SEKCJA
      flashcard_source: 'ai-full' | 'ai-edited' | 'manual';
      learning_status: 'new' | 'learning' | 'review' | 'relearning';
      review_rating: 'again' | 'hard' | 'good' | 'easy';
    }
  }
}
```

**KROK 3**: Weryfikacja kompilacji
```bash
# Sprawdź czy TypeScript się kompiluje
npm run build

# Jeśli są błędy, napraw je przed kontynuacją
```

### 3.3. Potencjalne problemy

**Problem 1**: Enum types nie są generowane
```typescript
// WORKAROUND: Ręcznie dodaj do database.types.ts
export type FlashcardSource = 'ai-full' | 'ai-edited' | 'manual';
export type LearningStatus = 'new' | 'learning' | 'review' | 'relearning';
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';
```

**Problem 2**: Decimal types są reprezentowane jako string
```typescript
// W database.types.ts decimal(3,2) będzie jako number lub string
// Sprawdź i dostosuj logikę konwersji w serwisach
```

---

## 4. Aktualizacja warstwy typów

### 4.1. Modyfikacja `src/types.ts`

**KROK 1**: Dodaj aliasy dla nowych tabel

```typescript
// Add after existing imports
export type LearningState = Database["public"]["Tables"]["learning_state"]["Row"];
export type LearningStateInsert = Database["public"]["Tables"]["learning_state"]["Insert"];
export type LearningStateUpdate = Database["public"]["Tables"]["learning_state"]["Update"];

export type ReviewHistory = Database["public"]["Tables"]["review_history"]["Row"];
export type ReviewHistoryInsert = Database["public"]["Tables"]["review_history"]["Insert"];
```

**KROK 2**: Dodaj typy ENUM

```typescript
// Enum type aliases
export type FlashcardSource = Database["public"]["Enums"]["flashcard_source"];
export type LearningStatus = Database["public"]["Enums"]["learning_status"];
export type ReviewRating = Database["public"]["Enums"]["review_rating"];

// Rating as integer (0-3) for API and calculations
export type RatingValue = 0 | 1 | 2 | 3;

// Mapping between rating names and values
export const RATING_MAP = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
} as const;
```

**KROK 3**: Dodaj DTOs dla Learning Session

```typescript
// ------------------------------------------------------------------------------------------------
// 13. Learning State DTO
//     Represents learning state as returned by the API
// ------------------------------------------------------------------------------------------------
export type LearningStateDto = Pick<
  LearningState,
  "id" | "flashcard_id" | "status" | "easiness_factor" | "interval" | "repetitions" | "lapses" | "next_review_date"
>;

// ------------------------------------------------------------------------------------------------
// 14. Flashcard with Learning State DTO
//     Extended flashcard DTO that includes learning state (used in GET /learning/session)
// ------------------------------------------------------------------------------------------------
export interface FlashcardWithLearningStateDto extends FlashcardDto {
  learning_state: LearningStateDto;
}

// ------------------------------------------------------------------------------------------------
// 15. Learning Session Response DTO
//     Response from GET /learning/session endpoint
// ------------------------------------------------------------------------------------------------
export interface LearningSessionResponseDto {
  session_id: string;  // Generated UUID for tracking
  flashcards: FlashcardWithLearningStateDto[];
  total_due: number;
  new_cards: number;
  review_cards: number;
}

// ------------------------------------------------------------------------------------------------
// 16. Review Submit Command
//     Request body for POST /learning/review endpoint
// ------------------------------------------------------------------------------------------------
export interface ReviewSubmitCommand {
  flashcard_id: number;
  rating: RatingValue;
  review_duration_ms?: number;
}

// ------------------------------------------------------------------------------------------------
// 17. Review Response DTO
//     Response from POST /learning/review endpoint
// ------------------------------------------------------------------------------------------------
export interface ReviewResponseDto {
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

// ------------------------------------------------------------------------------------------------
// 18. Learning Stats DTO
//     Response from GET /learning/stats endpoint
// ------------------------------------------------------------------------------------------------
export interface LearningStatsDto {
  total_flashcards: number;
  by_status: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  due_today: number;
  overdue: number;
  retention_rate: number;  // 0.0 - 1.0
  total_reviews: number;
  reviews_today: number;
  average_easiness_factor: number;
  streak_days: number;
}

// ------------------------------------------------------------------------------------------------
// 19. Review History DTO
//     Represents a review history entry as returned by the API
// ------------------------------------------------------------------------------------------------
export type ReviewHistoryDto = Pick<
  ReviewHistory,
  | "id"
  | "flashcard_id"
  | "rating"
  | "review_duration_ms"
  | "previous_interval"
  | "new_interval"
  | "previous_easiness_factor"
  | "new_easiness_factor"
  | "reviewed_at"
>;

// ------------------------------------------------------------------------------------------------
// 20. Review History List Response DTO
//     Paginated list of review history entries (GET /learning/history)
// ------------------------------------------------------------------------------------------------
export interface ReviewHistoryListResponseDto {
  data: ReviewHistoryDto[];
  pagination: PaginationDto;
}
```

**KROK 4**: Dodaj query schema types

```typescript
// ------------------------------------------------------------------------------------------------
// 21. Learning Session Query Params
//     Query parameters for GET /learning/session
// ------------------------------------------------------------------------------------------------
export interface LearningSessionQueryParams {
  limit?: number;
  status?: LearningStatus;
  include_new?: boolean;
}

// ------------------------------------------------------------------------------------------------
// 22. Review History Query Params
//     Query parameters for GET /learning/history
// ------------------------------------------------------------------------------------------------
export interface ReviewHistoryQueryParams {
  page?: number;
  limit?: number;
  flashcard_id?: number;
  from_date?: string;  // ISO 8601
  to_date?: string;    // ISO 8601
}
```

### 4.2. Weryfikacja

**CHECKLIST:**
- [ ] Wszystkie nowe typy są zaimportowane z `database.types.ts`
- [ ] DTOs pokrywają wszystkie endpointy z `api-plan.md`
- [ ] Rating types (0-3) są prawidłowo zdefiniowane
- [ ] Enum types są używane zamiast string literals
- [ ] TypeScript kompiluje się bez błędów

---

## 5. Implementacja serwisów

### 5.1. Serwis SM-2 Algorytm

**Plik**: `src/lib/services/sm2.service.ts`

**Funkcjonalność:**
- Implementacja algorytmu SM-2 (SuperMemo 2)
- Obliczanie nowych wartości: easiness_factor, interval, repetitions
- Określanie statusu nauki
- Pure functions - bez efektów ubocznych

**Struktura:**

```typescript
// src/lib/services/sm2.service.ts
import type { LearningStatus, RatingValue } from "../../types";

/**
 * SM-2 Algorithm Constants
 */
export const SM2_CONSTANTS = {
  MIN_EASINESS_FACTOR: 1.3,
  MAX_EASINESS_FACTOR: 3.0,
  DEFAULT_EASINESS_FACTOR: 2.5,
  
  // Intervals for different ratings and repetition counts
  RATING_INTERVALS: {
    AGAIN: { rep0: 0, rep1: 0, rep2plus: 0 },
    HARD: { rep0: 1, rep1: 1, rep2plus_multiplier: 1.2 },
    GOOD: { rep0: 1, rep1: 6, rep2plus_multiplier: 1.0 },
    EASY: { rep0: 4, rep1: 10, rep2plus_multiplier: 1.3 },
  },
  
  // Easiness factor changes
  EF_CHANGE: {
    AGAIN: -0.2,
    HARD: -0.15,
    GOOD: 0.0,
    EASY: 0.15,
  },
} as const;

/**
 * SM-2 Algorithm State
 */
export interface SM2State {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  status: LearningStatus;
}

/**
 * SM-2 Algorithm Result
 */
export interface SM2Result extends SM2State {
  next_review_date: Date;
}

/**
 * Calculate new SM-2 state based on user rating
 * 
 * @param currentState - Current learning state
 * @param rating - User rating (0=again, 1=hard, 2=good, 3=easy)
 * @returns New SM-2 state with next review date
 */
export function calculateSM2(currentState: SM2State, rating: RatingValue): SM2Result {
  // Implementation will be detailed in next section
  // This is the main algorithm function
}

/**
 * Helper: Calculate new easiness factor
 */
function calculateEasinessFactor(currentEF: number, rating: RatingValue): number {
  // Clamp between MIN and MAX
}

/**
 * Helper: Calculate new interval in days
 */
function calculateInterval(
  currentInterval: number,
  repetitions: number,
  easinessFactor: number,
  rating: RatingValue
): number {
  // Apply SM-2 interval rules
}

/**
 * Helper: Determine learning status
 */
function determineLearningStatus(
  currentStatus: LearningStatus,
  rating: RatingValue,
  repetitions: number
): LearningStatus {
  // Status transitions: new → learning → review ↔ relearning
}

/**
 * Helper: Calculate next review date
 */
function calculateNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now;
}
```

**Szczegółowa implementacja algorytmu SM-2:**

```typescript
export function calculateSM2(currentState: SM2State, rating: RatingValue): SM2Result {
  let newEF = currentState.easiness_factor;
  let newInterval = currentState.interval;
  let newRepetitions = currentState.repetitions;
  let newLapses = currentState.lapses;
  let newStatus = currentState.status;

  switch (rating) {
    case 0: // AGAIN - Complete failure
      newEF = Math.max(SM2_CONSTANTS.MIN_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.AGAIN);
      newInterval = 0;
      newRepetitions = 0;
      newLapses = currentState.lapses + 1;
      newStatus = 'relearning';
      break;

    case 1: // HARD - Difficult recall
      newEF = Math.max(SM2_CONSTANTS.MIN_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.HARD);
      
      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.HARD.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.HARD.rep1;
      } else {
        newInterval = Math.ceil(currentState.interval * SM2_CONSTANTS.RATING_INTERVALS.HARD.rep2plus_multiplier);
      }
      
      if (currentState.status === 'new' || currentState.status === 'relearning') {
        newStatus = 'learning';
      }
      
      if (newRepetitions >= 2) {
        newRepetitions++;
      }
      break;

    case 2: // GOOD - Correct recall
      // EF stays the same
      
      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.GOOD.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.GOOD.rep1;
      } else {
        newInterval = Math.ceil(currentState.interval * newEF);
      }
      
      newRepetitions++;
      
      if (newRepetitions >= 2) {
        newStatus = 'review';
      } else {
        newStatus = 'learning';
      }
      break;

    case 3: // EASY - Perfect recall
      newEF = Math.min(SM2_CONSTANTS.MAX_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.EASY);
      
      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.EASY.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.EASY.rep1;
      } else {
        newInterval = Math.ceil(currentState.interval * newEF * SM2_CONSTANTS.RATING_INTERVALS.EASY.rep2plus_multiplier);
      }
      
      newRepetitions++;
      newStatus = 'review';
      break;
  }

  const nextReviewDate = calculateNextReviewDate(newInterval);

  return {
    easiness_factor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    lapses: newLapses,
    status: newStatus,
    next_review_date: nextReviewDate,
  };
}

function calculateNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now;
}
```

**TESTY JEDNOSTKOWE** (do zaimplementowania w `tests/unit/sm2.service.test.ts`):

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSM2, SM2_CONSTANTS } from '../../src/lib/services/sm2.service';

describe('SM2 Algorithm', () => {
  const initialState = {
    easiness_factor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    status: 'new' as const,
  };

  it('should handle AGAIN rating correctly', () => {
    const result = calculateSM2(initialState, 0);
    
    expect(result.interval).toBe(0);
    expect(result.repetitions).toBe(0);
    expect(result.lapses).toBe(1);
    expect(result.status).toBe('relearning');
    expect(result.easiness_factor).toBe(2.3); // 2.5 - 0.2
  });

  it('should handle GOOD rating progression', () => {
    // First review (repetitions: 0 → 1)
    const firstReview = calculateSM2(initialState, 2);
    expect(firstReview.interval).toBe(1);
    expect(firstReview.repetitions).toBe(1);
    expect(firstReview.status).toBe('learning');

    // Second review (repetitions: 1 → 2)
    const secondReview = calculateSM2({...firstReview}, 2);
    expect(secondReview.interval).toBe(6);
    expect(secondReview.repetitions).toBe(2);
    expect(secondReview.status).toBe('review');

    // Third review (repetitions: 2 → 3)
    const thirdReview = calculateSM2({...secondReview}, 2);
    expect(thirdReview.interval).toBe(Math.ceil(6 * 2.5)); // 15 days
    expect(thirdReview.repetitions).toBe(3);
    expect(thirdReview.status).toBe('review');
  });

  it('should enforce easiness factor bounds', () => {
    // Test minimum
    const lowEFState = { ...initialState, easiness_factor: 1.35 };
    const resultMin = calculateSM2(lowEFState, 0); // -0.2 change
    expect(resultMin.easiness_factor).toBe(SM2_CONSTANTS.MIN_EASINESS_FACTOR);

    // Test maximum
    const highEFState = { ...initialState, easiness_factor: 2.9 };
    const resultMax = calculateSM2(highEFState, 3); // +0.15 change
    expect(resultMax.easiness_factor).toBe(SM2_CONSTANTS.MAX_EASINESS_FACTOR);
  });

  // Add more test cases for all rating combinations
});
```

### 5.2. Serwis Learning

**Plik**: `src/lib/services/learning.service.ts`

**Funkcjonalność:**
- Pobieranie fiszek do przeglądu (sesja nauki)
- Zapisywanie odpowiedzi użytkownika
- Obliczanie statystyk nauki
- Pobieranie historii przeglądów

**Struktura:**

```typescript
// src/lib/services/learning.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardWithLearningStateDto,
  LearningSessionResponseDto,
  ReviewSubmitCommand,
  ReviewResponseDto,
  LearningStatsDto,
  ReviewHistoryListResponseDto,
  LearningSessionQueryParams,
  ReviewHistoryQueryParams,
} from "../../types";
import { calculateSM2 } from "./sm2.service";
import { v4 as uuidv4 } from 'uuid'; // Note: Add uuid to dependencies

/**
 * Get flashcards due for review (learning session)
 * 
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param params - Query parameters (limit, status, include_new)
 * @returns Learning session with flashcards and stats
 */
export async function getLearningSession(
  supabase: SupabaseClient,
  userId: string,
  params: LearningSessionQueryParams
): Promise<LearningSessionResponseDto> {
  // Implementation details below
}

/**
 * Submit a review response and update learning state
 * 
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param command - Review submission data
 * @returns Review response with before/after states
 */
export async function submitReview(
  supabase: SupabaseClient,
  userId: string,
  command: ReviewSubmitCommand
): Promise<ReviewResponseDto> {
  // Implementation details below
}

/**
 * Get learning statistics for user
 * 
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @returns Learning statistics
 */
export async function getLearningStats(
  supabase: SupabaseClient,
  userId: string
): Promise<LearningStatsDto> {
  // Implementation details below
}

/**
 * Get review history for user
 * 
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated review history
 */
export async function getReviewHistory(
  supabase: SupabaseClient,
  userId: string,
  params: ReviewHistoryQueryParams
): Promise<ReviewHistoryListResponseDto> {
  // Implementation details below
}
```

**Szczegółowa implementacja `getLearningSession`:**

```typescript
export async function getLearningSession(
  supabase: SupabaseClient,
  userId: string,
  params: LearningSessionQueryParams
): Promise<LearningSessionResponseDto> {
  const limit = params.limit || 20;
  const includeNew = params.include_new ?? true;
  
  // Build query for learning_state with flashcards
  let query = supabase
    .from('learning_state')
    .select(`
      *,
      flashcards:flashcard_id (
        id,
        front,
        back,
        source,
        generation_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .lte('next_review_date', new Date().toISOString());
  
  // Apply status filter if provided
  if (params.status) {
    query = query.eq('status', params.status);
  }
  
  // Exclude 'new' status if include_new is false
  if (!includeNew) {
    query = query.neq('status', 'new');
  }
  
  // Order by priority: learning/relearning first, then by next_review_date
  query = query
    .order('status', { ascending: false })  // 'review' < 'relearning'
    .order('next_review_date', { ascending: true })
    .limit(limit);
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch learning session: ${error.message}`);
  }
  
  // Get total counts for stats
  const { count: totalDue } = await supabase
    .from('learning_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', new Date().toISOString());
  
  const { count: newCards } = await supabase
    .from('learning_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'new')
    .lte('next_review_date', new Date().toISOString());
  
  // Transform data to DTO format
  const flashcards: FlashcardWithLearningStateDto[] = data?.map(item => ({
    id: item.flashcards.id,
    front: item.flashcards.front,
    back: item.flashcards.back,
    source: item.flashcards.source,
    generation_id: item.flashcards.generation_id,
    created_at: item.flashcards.created_at,
    updated_at: item.flashcards.updated_at,
    learning_state: {
      id: item.id,
      flashcard_id: item.flashcard_id,
      status: item.status,
      easiness_factor: item.easiness_factor,
      interval: item.interval,
      repetitions: item.repetitions,
      lapses: item.lapses,
      next_review_date: item.next_review_date,
    },
  })) || [];
  
  return {
    session_id: uuidv4(),
    flashcards,
    total_due: totalDue || 0,
    new_cards: newCards || 0,
    review_cards: (totalDue || 0) - (newCards || 0),
  };
}
```

**Szczegółowa implementacja `submitReview` (z transakcją):**

```typescript
export async function submitReview(
  supabase: SupabaseClient,
  userId: string,
  command: ReviewSubmitCommand
): Promise<ReviewResponseDto> {
  // Step 1: Fetch current learning state
  const { data: currentState, error: fetchError } = await supabase
    .from('learning_state')
    .select('*')
    .eq('flashcard_id', command.flashcard_id)
    .eq('user_id', userId)
    .single();
  
  if (fetchError || !currentState) {
    throw new Error('Learning state not found for this flashcard');
  }
  
  // Step 2: Calculate new SM-2 state
  const sm2Result = calculateSM2(
    {
      easiness_factor: currentState.easiness_factor,
      interval: currentState.interval,
      repetitions: currentState.repetitions,
      lapses: currentState.lapses,
      status: currentState.status,
    },
    command.rating
  );
  
  // Step 3: Prepare previous and new states for response
  const previousState = {
    status: currentState.status,
    easiness_factor: currentState.easiness_factor,
    interval: currentState.interval,
    repetitions: currentState.repetitions,
    next_review_date: currentState.next_review_date,
  };
  
  const newState = {
    status: sm2Result.status,
    easiness_factor: sm2Result.easiness_factor,
    interval: sm2Result.interval,
    repetitions: sm2Result.repetitions,
    next_review_date: sm2Result.next_review_date.toISOString(),
  };
  
  // Step 4: Execute transaction (UPDATE learning_state + INSERT review_history)
  // NOTE: Supabase doesn't support multi-statement transactions via JS client
  // We'll use RPC function or handle atomicity at application level
  
  // Update learning_state
  const { error: updateError } = await supabase
    .from('learning_state')
    .update({
      status: sm2Result.status,
      easiness_factor: sm2Result.easiness_factor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      lapses: sm2Result.lapses,
      next_review_date: sm2Result.next_review_date.toISOString(),
    })
    .eq('flashcard_id', command.flashcard_id)
    .eq('user_id', userId);
  
  if (updateError) {
    throw new Error(`Failed to update learning state: ${updateError.message}`);
  }
  
  // Insert review_history (immutable audit log)
  const { error: insertError } = await supabase
    .from('review_history')
    .insert({
      flashcard_id: command.flashcard_id,
      user_id: userId,
      rating: command.rating,
      review_duration_ms: command.review_duration_ms || null,
      previous_interval: currentState.interval,
      new_interval: sm2Result.interval,
      previous_easiness_factor: currentState.easiness_factor,
      new_easiness_factor: sm2Result.easiness_factor,
      reviewed_at: new Date().toISOString(),
    });
  
  if (insertError) {
    // Rollback is not straightforward - consider using RPC function for true transaction
    console.error('Failed to insert review history:', insertError);
    throw new Error('Failed to record review history');
  }
  
  return {
    flashcard_id: command.flashcard_id,
    previous_state: previousState,
    new_state: newState,
    review_recorded: true,
  };
}
```

**Implementacja `getLearningStats`:**

```typescript
export async function getLearningStats(
  supabase: SupabaseClient,
  userId: string
): Promise<LearningStatsDto> {
  // Get total flashcards count
  const { count: totalFlashcards } = await supabase
    .from('flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get counts by status
  const { data: statusCounts } = await supabase
    .from('learning_state')
    .select('status')
    .eq('user_id', userId);
  
  const byStatus = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
  };
  
  statusCounts?.forEach(item => {
    byStatus[item.status]++;
  });
  
  // Get due today count
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const { count: dueToday } = await supabase
    .from('learning_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', today.toISOString())
    .gte('next_review_date', new Date().toISOString());
  
  // Get overdue count
  const { count: overdue } = await supabase
    .from('learning_state')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lt('next_review_date', new Date().toISOString());
  
  // Calculate retention rate (reviews with rating >= 2 / total reviews)
  const { data: reviewHistory } = await supabase
    .from('review_history')
    .select('rating')
    .eq('user_id', userId);
  
  const totalReviews = reviewHistory?.length || 0;
  const successfulReviews = reviewHistory?.filter(r => r.rating >= 2).length || 0;
  const retentionRate = totalReviews > 0 ? successfulReviews / totalReviews : 0;
  
  // Get reviews today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { count: reviewsToday } = await supabase
    .from('review_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('reviewed_at', todayStart.toISOString());
  
  // Calculate average easiness factor
  const { data: learningStates } = await supabase
    .from('learning_state')
    .select('easiness_factor')
    .eq('user_id', userId);
  
  const avgEF = learningStates?.length 
    ? learningStates.reduce((sum, ls) => sum + ls.easiness_factor, 0) / learningStates.length
    : 2.5;
  
  // Calculate streak days (simplified - would need more complex logic for production)
  // For MVP, set to 0 or implement basic version
  const streakDays = 0; // TODO: Implement streak calculation
  
  return {
    total_flashcards: totalFlashcards || 0,
    by_status: byStatus,
    due_today: dueToday || 0,
    overdue: overdue || 0,
    retention_rate: retentionRate,
    total_reviews: totalReviews,
    reviews_today: reviewsToday || 0,
    average_easiness_factor: Math.round(avgEF * 100) / 100,
    streak_days: streakDays,
  };
}
```

**Implementacja `getReviewHistory`:**

```typescript
export async function getReviewHistory(
  supabase: SupabaseClient,
  userId: string,
  params: ReviewHistoryQueryParams
): Promise<ReviewHistoryListResponseDto> {
  const page = params.page || 1;
  const limit = params.limit || 50;
  
  // Build query
  let query = supabase
    .from('review_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);
  
  // Apply filters
  if (params.flashcard_id) {
    query = query.eq('flashcard_id', params.flashcard_id);
  }
  
  if (params.from_date) {
    query = query.gte('reviewed_at', params.from_date);
  }
  
  if (params.to_date) {
    query = query.lte('reviewed_at', params.to_date);
  }
  
  // Apply sorting and pagination
  query = query
    .order('reviewed_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch review history: ${error.message}`);
  }
  
  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  };
}
```

### 5.3. Optymalizacja transakcji (opcjonalne)

**Plik**: `supabase/functions/submit_review.sql` (RPC function)

Dla prawdziwej transakcji atomowej, możemy stworzyć RPC function w PostgreSQL:

```sql
-- Create RPC function for atomic review submission
CREATE OR REPLACE FUNCTION public.submit_review_transaction(
  p_flashcard_id BIGINT,
  p_user_id UUID,
  p_rating INTEGER,
  p_review_duration_ms INTEGER,
  p_new_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_state RECORD;
  v_result JSONB;
BEGIN
  -- Fetch current state (with row lock)
  SELECT * INTO v_current_state
  FROM public.learning_state
  WHERE flashcard_id = p_flashcard_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Learning state not found';
  END IF;
  
  -- Update learning_state
  UPDATE public.learning_state
  SET
    status = (p_new_state->>'status')::learning_status,
    easiness_factor = (p_new_state->>'easiness_factor')::DECIMAL(3,2),
    interval = (p_new_state->>'interval')::INTEGER,
    repetitions = (p_new_state->>'repetitions')::INTEGER,
    lapses = (p_new_state->>'lapses')::INTEGER,
    next_review_date = (p_new_state->>'next_review_date')::TIMESTAMPTZ
  WHERE flashcard_id = p_flashcard_id AND user_id = p_user_id;
  
  -- Insert review_history
  INSERT INTO public.review_history (
    flashcard_id,
    user_id,
    rating,
    review_duration_ms,
    previous_interval,
    new_interval,
    previous_easiness_factor,
    new_easiness_factor
  ) VALUES (
    p_flashcard_id,
    p_user_id,
    p_rating,
    p_review_duration_ms,
    v_current_state.interval,
    (p_new_state->>'interval')::INTEGER,
    v_current_state.easiness_factor,
    (p_new_state->>'easiness_factor')::DECIMAL(3,2)
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'previous_state', row_to_json(v_current_state),
    'new_state', p_new_state,
    'success', true
  );
  
  RETURN v_result;
END;
$$;
```

---

## 6. Implementacja walidacji

### 6.1. Plik walidacji

**Plik**: `src/lib/validation/learning.validation.ts`

```typescript
// src/lib/validation/learning.validation.ts
import { z } from "zod";

/**
 * Zod schema for GET /learning/session query parameters
 */
export const learningSessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z.enum(['new', 'learning', 'review', 'relearning']).optional(),
  include_new: z.coerce.boolean().catch(true),
});

/**
 * Zod schema for POST /learning/review request body
 */
export const reviewSubmitSchema = z.object({
  flashcard_id: z.number().int().positive({
    message: 'flashcard_id must be a positive integer',
  }),
  rating: z.number().int().min(0).max(3, {
    message: 'rating must be between 0 and 3 (0=again, 1=hard, 2=good, 3=easy)',
  }),
  review_duration_ms: z.number().int().positive().optional(),
});

/**
 * Zod schema for GET /learning/history query parameters
 */
export const reviewHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(50),
  flashcard_id: z.coerce.number().int().positive().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

/**
 * Type exports for convenience
 */
export type LearningSessionQuery = z.infer<typeof learningSessionQuerySchema>;
export type ReviewSubmit = z.infer<typeof reviewSubmitSchema>;
export type ReviewHistoryQuery = z.infer<typeof reviewHistoryQuerySchema>;
```

---

## 7. Implementacja endpointów API

### 7.1. Struktura katalogów

```
src/pages/api/learning/
├── session.ts         # GET /api/learning/session
├── review.ts          # POST /api/learning/review
├── stats.ts           # GET /api/learning/stats
└── history.ts         # GET /api/learning/history
```

### 7.2. Endpoint: GET /api/learning/session

**Plik**: `src/pages/api/learning/session.ts`

```typescript
// src/pages/api/learning/session.ts
import type { APIRoute } from "astro";
import { getLearningSession } from "../../../lib/services/learning.service";
import { learningSessionQuerySchema } from "../../../lib/validation/learning.validation";

export const prerender = false;

/**
 * GET /api/learning/session
 * 
 * Retrieves flashcards due for review to start a learning session
 * 
 * Query Parameters:
 * - limit: number (default: 20, max: 100)
 * - status: 'new' | 'learning' | 'review' | 'relearning' (optional)
 * - include_new: boolean (default: true)
 * 
 * Response (200):
 * - session_id: string (UUID)
 * - flashcards: FlashcardWithLearningStateDto[]
 * - total_due: number
 * - new_cards: number
 * - review_cards: number
 * 
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 404: No flashcards due for review
 * - 500: Server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to access learning sessions",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit"),
      status: url.searchParams.get("status"),
      include_new: url.searchParams.get("include_new"),
    };

    const validationResult = learningSessionQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid query parameters",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { limit, status, include_new } = validationResult.data;

    // Fetch learning session
    const session = await getLearningSession(supabase, user.id, {
      limit,
      status,
      include_new,
    });

    // Check if any flashcards are due
    if (session.flashcards.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No flashcards due",
          message: "No flashcards are currently due for review",
          session_id: session.session_id,
          total_due: session.total_due,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return successful response
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/session:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while fetching learning session";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### 7.3. Endpoint: POST /api/learning/review

**Plik**: `src/pages/api/learning/review.ts`

```typescript
// src/pages/api/learning/review.ts
import type { APIRoute } from "astro";
import { submitReview } from "../../../lib/services/learning.service";
import { reviewSubmitSchema } from "../../../lib/validation/learning.validation";
import type { ReviewSubmitCommand } from "../../../types";

export const prerender = false;

/**
 * POST /api/learning/review
 * 
 * Submits a review response for a flashcard and updates learning progress
 * 
 * Request Body:
 * - flashcard_id: number (required)
 * - rating: 0 | 1 | 2 | 3 (required) - 0=again, 1=hard, 2=good, 3=easy
 * - review_duration_ms: number (optional)
 * 
 * Response (200):
 * - flashcard_id: number
 * - previous_state: LearningState
 * - new_state: LearningState
 * - review_recorded: boolean
 * 
 * Error Responses:
 * - 400: Invalid request data
 * - 401: Unauthorized
 * - 404: Flashcard not found
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to submit reviews",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request data
    const validationResult = reviewSubmitSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid request data",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: ReviewSubmitCommand = validationResult.data;

    // Submit review
    const result = await submitReview(supabase, user.id, command);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/learning/review:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while submitting review";

    // Check for specific error types
    if (errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: errorMessage,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### 7.4. Endpoint: GET /api/learning/stats

**Plik**: `src/pages/api/learning/stats.ts`

```typescript
// src/pages/api/learning/stats.ts
import type { APIRoute } from "astro";
import { getLearningStats } from "../../../lib/services/learning.service";

export const prerender = false;

/**
 * GET /api/learning/stats
 * 
 * Retrieves learning statistics and progress overview for the authenticated user
 * 
 * Response (200):
 * - total_flashcards: number
 * - by_status: { new, learning, review, relearning }
 * - due_today: number
 * - overdue: number
 * - retention_rate: number (0.0 - 1.0)
 * - total_reviews: number
 * - reviews_today: number
 * - average_easiness_factor: number
 * - streak_days: number
 * 
 * Error Responses:
 * - 401: Unauthorized
 * - 500: Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to view learning stats",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch learning stats
    const stats = await getLearningStats(supabase, user.id);

    // Return successful response
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/stats:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while fetching learning stats";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### 7.5. Endpoint: GET /api/learning/history

**Plik**: `src/pages/api/learning/history.ts`

```typescript
// src/pages/api/learning/history.ts
import type { APIRoute } from "astro";
import { getReviewHistory } from "../../../lib/services/learning.service";
import { reviewHistoryQuerySchema } from "../../../lib/validation/learning.validation";

export const prerender = false;

/**
 * GET /api/learning/history
 * 
 * Retrieves review history for analytics and progress tracking
 * 
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - flashcard_id: number (optional)
 * - from_date: string ISO 8601 (optional)
 * - to_date: string ISO 8601 (optional)
 * 
 * Response (200):
 * - data: ReviewHistoryDto[]
 * - pagination: { page, limit, total }
 * 
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 500: Server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to view review history",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      flashcard_id: url.searchParams.get("flashcard_id"),
      from_date: url.searchParams.get("from_date"),
      to_date: url.searchParams.get("to_date"),
    };

    const validationResult = reviewHistoryQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid query parameters",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit, flashcard_id, from_date, to_date } = validationResult.data;

    // Fetch review history
    const history = await getReviewHistory(supabase, user.id, {
      page,
      limit,
      flashcard_id,
      from_date,
      to_date,
    });

    // Return successful response
    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/history:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An error occurred while fetching review history";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

---

## 8. Testy

### 8.1. Testy jednostkowe

**Priorytet**: WYSOKI

#### 8.1.1. Testy SM-2 Algorytmu

**Plik**: `tests/unit/sm2.service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSM2, SM2_CONSTANTS } from '../../src/lib/services/sm2.service';
import type { SM2State } from '../../src/lib/services/sm2.service';

describe('SM2 Algorithm Service', () => {
  const newState: SM2State = {
    easiness_factor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    status: 'new',
  };

  describe('Rating 0 (Again) - Complete Failure', () => {
    it('should reset interval and repetitions', () => {
      const result = calculateSM2(newState, 0);
      
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.status).toBe('relearning');
    });

    it('should increment lapses', () => {
      const result = calculateSM2(newState, 0);
      expect(result.lapses).toBe(1);
    });

    it('should decrease easiness factor', () => {
      const result = calculateSM2(newState, 0);
      expect(result.easiness_factor).toBe(2.3); // 2.5 - 0.2
    });

    it('should respect minimum easiness factor', () => {
      const lowEFState = { ...newState, easiness_factor: 1.35 };
      const result = calculateSM2(lowEFState, 0);
      expect(result.easiness_factor).toBe(SM2_CONSTANTS.MIN_EASINESS_FACTOR);
    });
  });

  describe('Rating 2 (Good) - Normal Progression', () => {
    it('should set interval to 1 day for first review (rep 0→1)', () => {
      const result = calculateSM2(newState, 2);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe('learning');
    });

    it('should set interval to 6 days for second review (rep 1→2)', () => {
      const learningState = { ...newState, repetitions: 1, interval: 1, status: 'learning' as const };
      const result = calculateSM2(learningState, 2);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
      expect(result.status).toBe('review');
    });

    it('should calculate interval using EF for subsequent reviews', () => {
      const reviewState = {
        ...newState,
        repetitions: 2,
        interval: 6,
        status: 'review' as const,
      };
      const result = calculateSM2(reviewState, 2);
      expect(result.interval).toBe(Math.ceil(6 * 2.5)); // 15 days
      expect(result.repetitions).toBe(3);
    });

    it('should not change easiness factor', () => {
      const result = calculateSM2(newState, 2);
      expect(result.easiness_factor).toBe(2.5);
    });
  });

  describe('Rating 3 (Easy) - Fast Progression', () => {
    it('should set interval to 4 days for first review', () => {
      const result = calculateSM2(newState, 3);
      expect(result.interval).toBe(4);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe('review');
    });

    it('should increase easiness factor', () => {
      const result = calculateSM2(newState, 3);
      expect(result.easiness_factor).toBe(2.65); // 2.5 + 0.15
    });

    it('should respect maximum easiness factor', () => {
      const highEFState = { ...newState, easiness_factor: 2.9 };
      const result = calculateSM2(highEFState, 3);
      expect(result.easiness_factor).toBe(SM2_CONSTANTS.MAX_EASINESS_FACTOR);
    });
  });

  describe('Rating 1 (Hard) - Minimal Progression', () => {
    it('should set interval to 1 day for early reviews', () => {
      const result = calculateSM2(newState, 1);
      expect(result.interval).toBe(1);
    });

    it('should decrease easiness factor', () => {
      const result = calculateSM2(newState, 1);
      expect(result.easiness_factor).toBe(2.35); // 2.5 - 0.15
    });
  });

  describe('Next Review Date Calculation', () => {
    it('should calculate correct next review date', () => {
      const result = calculateSM2(newState, 2);
      
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval);
      
      const diff = Math.abs(result.next_review_date.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });

    it('should set immediate review for interval 0', () => {
      const result = calculateSM2(newState, 0);
      
      const now = new Date();
      const diff = Math.abs(result.next_review_date.getTime() - now.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('Status Transitions', () => {
    it('should transition: new → learning (rating 1 or 2)', () => {
      const result = calculateSM2(newState, 2);
      expect(result.status).toBe('learning');
    });

    it('should transition: new → review (rating 3)', () => {
      const result = calculateSM2(newState, 3);
      expect(result.status).toBe('review');
    });

    it('should transition: learning → review (rating 2, rep>=2)', () => {
      const learningState = { ...newState, repetitions: 1, status: 'learning' as const };
      const result = calculateSM2(learningState, 2);
      expect(result.status).toBe('review');
    });

    it('should transition: any → relearning (rating 0)', () => {
      const reviewState = { ...newState, repetitions: 5, status: 'review' as const };
      const result = calculateSM2(reviewState, 0);
      expect(result.status).toBe('relearning');
    });
  });
});
```

#### 8.1.2. Testy Learning Service (kluczowe funkcje)

**Plik**: `tests/unit/learning.service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getLearningSession, submitReview } from '../../src/lib/services/learning.service';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

describe('Learning Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLearningSession', () => {
    it('should fetch flashcards due for review', async () => {
      // Test implementation
      // Mock supabase queries and verify results
    });

    it('should respect limit parameter', async () => {
      // Test implementation
    });

    it('should filter by status if provided', async () => {
      // Test implementation
    });
  });

  describe('submitReview', () => {
    it('should update learning state and create review history', async () => {
      // Test implementation
      // Mock current state fetch, SM-2 calculation, update, and insert
    });

    it('should handle non-existent flashcard', async () => {
      // Test error handling
    });

    it('should apply SM-2 algorithm correctly', async () => {
      // Test integration with SM-2 service
    });
  });
});
```

### 8.2. Testy integracyjne (API)

**Priorytet**: ŚREDNI

#### 8.2.1. Test: Learning Session Flow

**Plik**: `tests/unit/learning-flow.integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Learning Flow Integration', () => {
  it('should complete full learning cycle', async () => {
    // 1. Create flashcard (POST /api/flashcards)
    // 2. Verify learning_state is created automatically
    // 3. Get learning session (GET /api/learning/session)
    // 4. Submit review (POST /api/learning/review)
    // 5. Verify state is updated
    // 6. Verify history is recorded
  });
});
```

### 8.3. Testy E2E (Playwright)

**Priorytet**: NISKI (Post-MVP)

#### 8.3.1. Test: Learning Session User Flow

**Plik**: `tests/e2e/learning-session.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Learning Session', () => {
  test('user can start learning session and review flashcards', async ({ page }) => {
    // 1. Login
    // 2. Navigate to learning session
    // 3. Verify flashcards are displayed
    // 4. Review flashcard (click "Good")
    // 5. Verify next flashcard is shown
    // 6. Complete session
    // 7. Verify stats are updated
  });
});
```

---

## 9. Checklisty

### 9.1. Pre-Implementation Checklist

**PRZED rozpoczęciem implementacji:**

- [ ] ✅ Migracje bazy danych są przygotowane (5 plików SQL)
- [ ] ✅ Dokumentacja API (`api-plan.md`) jest zaktualizowana
- [ ] ✅ Dokumentacja DB (`db-plan.md`) jest zaktualizowana
- [ ] ⏳ Supabase lokalne jest uruchomione (`npx supabase start`)
- [ ] ⏳ Migracje są zastosowane (`npx supabase db push`)
- [ ] ⏳ Typy TypeScript są zregenerowane (`npx supabase gen types`)
- [ ] ⏳ Projekt kompiluje się bez błędów (`npm run build`)

### 9.2. Implementation Checklist

**Implementacja krok po kroku:**

#### Faza 1: Database & Types (1-2 godziny)
- [ ] Zastosuj migracje do lokalnej bazy Supabase
- [ ] Zweryfikuj strukturę bazy (tabele, ENUM, triggery, RLS)
- [ ] Zregeneruj `database.types.ts`
- [ ] Zaktualizuj `types.ts` (dodaj nowe typy i DTOs)
- [ ] Weryfikuj kompilację TypeScript

#### Faza 2: SM-2 Algorithm (2-3 godziny)
- [ ] Utwórz `src/lib/services/sm2.service.ts`
- [ ] Zaimplementuj funkcję `calculateSM2()`
- [ ] Zaimplementuj helpery (EF, interval, status calculations)
- [ ] Dodaj testy jednostkowe (`tests/unit/sm2.service.test.ts`)
- [ ] Weryfikuj wszystkie edge cases

#### Faza 3: Learning Service (3-4 godziny)
- [ ] Utwórz `src/lib/services/learning.service.ts`
- [ ] Zaimplementuj `getLearningSession()`
- [ ] Zaimplementuj `submitReview()` (z transakcją)
- [ ] Zaimplementuj `getLearningStats()`
- [ ] Zaimplementuj `getReviewHistory()`
- [ ] (Opcjonalnie) Dodaj RPC function dla transakcji atomowej

#### Faza 4: Validation (30 minut - 1 godzina)
- [ ] Utwórz `src/lib/validation/learning.validation.ts`
- [ ] Dodaj schemat dla session query params
- [ ] Dodaj schemat dla review submit
- [ ] Dodaj schemat dla history query params

#### Faza 5: API Endpoints (2-3 godziny)
- [ ] Utwórz katalog `src/pages/api/learning/`
- [ ] Zaimplementuj `session.ts` (GET /api/learning/session)
- [ ] Zaimplementuj `review.ts` (POST /api/learning/review)
- [ ] Zaimplementuj `stats.ts` (GET /api/learning/stats)
- [ ] Zaimplementuj `history.ts` (GET /api/learning/history)
- [ ] Weryfikuj error handling we wszystkich endpointach

#### Faza 6: Testing (3-4 godziny)
- [ ] Uruchom testy jednostkowe SM-2 (`npm run test`)
- [ ] Dodaj testy integracyjne dla learning service
- [ ] Przetestuj endpointy API ręcznie (Postman/Insomnia)
- [ ] Weryfikuj RLS policies (próba dostępu do danych innego użytkownika)
- [ ] Test learning flow: create → session → review → verify

#### Faza 7: Documentation & Cleanup (1 godzina)
- [ ] Dodaj komentarze JSDoc do wszystkich funkcji publicznych
- [ ] Zaktualizuj README jeśli potrzebne
- [ ] Usuń console.log i debug code
- [ ] Uruchom linter (`npm run lint:fix`)
- [ ] Uruchom formatter (`npm run format`)

### 9.3. Post-Implementation Verification

**WERYFIKACJA po implementacji:**

- [ ] Wszystkie migracje są zastosowane w bazie danych
- [ ] Typy TypeScript są aktualne i projekt się kompiluje
- [ ] Wszystkie testy jednostkowe przechodzą (`npm run test`)
- [ ] Wszystkie 4 endpointy API działają poprawnie
- [ ] RLS policies działają (izolacja danych użytkowników)
- [ ] Algorytm SM-2 oblicza poprawnie dla wszystkich ratingów (0-3)
- [ ] Review history jest immutable (brak UPDATE/DELETE)
- [ ] Learning state jest automatycznie tworzony przy INSERT flashcard
- [ ] Transakcja review jest atomowa (UPDATE + INSERT razem)
- [ ] Error handling jest implementowany we wszystkich miejscach
- [ ] Kod jest sformatowany i spełnia standardy projektu

### 9.4. Deployment Checklist

**PRZED wdrożeniem na produkcję:**

- [ ] Wszystkie migracje są przetestowane lokalnie
- [ ] Zastosuj migracje na staging environment
- [ ] Przetestuj API na staging
- [ ] Zregeneruj typy z produkcyjnej bazy danych
- [ ] Zaktualizuj zmienne środowiskowe jeśli potrzebne
- [ ] Wykonaj backup bazy danych przed migracją produkcyjną
- [ ] Zastosuj migracje na produkcji
- [ ] Weryfikuj działanie API na produkcji
- [ ] Monitor logi błędów przez pierwsze 24h

---

## 10. Estymacja czasu

### 10.1. Breakdown czasowy

| Faza | Zadanie | Estymowany czas |
|------|---------|----------------|
| 1 | Database & Types | 1-2h |
| 2 | SM-2 Algorithm + Tests | 2-3h |
| 3 | Learning Service | 3-4h |
| 4 | Validation Schemas | 0.5-1h |
| 5 | API Endpoints | 2-3h |
| 6 | Testing | 3-4h |
| 7 | Documentation & Cleanup | 1h |
| **TOTAL** | | **12-18 godzin** |

### 10.2. Harmonogram sugerowany

**Dla 1 developera:**
- **Dzień 1 (4-6h)**: Fazy 1-3 (Database, Types, SM-2, Learning Service)
- **Dzień 2 (4-6h)**: Fazy 4-5 (Validation, API Endpoints)
- **Dzień 3 (4-6h)**: Fazy 6-7 (Testing, Documentation, Cleanup)

**Dla 2 developerów (parallel):**
- **Developer A**: Fazy 1, 2, 6 (Database, SM-2, Testing)
- **Developer B**: Fazy 3, 4, 5 (Learning Service, Validation, API)
- **Razem**: Faza 7 (Documentation)
- **Czas**: ~8-12 godzin (2 dni robocze)

---

## 11. Potencjalne problemy i rozwiązania

### 11.1. Problem: Brak prawdziwych transakcji w Supabase JS Client

**Symptom**: UPDATE i INSERT nie są atomowe, możliwa niespójność danych

**Rozwiązania:**
1. **Preferowane**: Użyj RPC function w PostgreSQL (sekcja 5.3)
2. **Alternatywa**: Obsłuż błędy i rollback na poziomie aplikacji
3. **Kompromis**: Zaakceptuj niewielkie ryzyko (MVP)

### 11.2. Problem: Decimal types jako string w TypeScript

**Symptom**: `easiness_factor` jest typu `string` zamiast `number`

**Rozwiązanie:**
```typescript
// W serwisie, konwertuj przed obliczeniami
const ef = parseFloat(currentState.easiness_factor);

// W insert/update, użyj number
easiness_factor: parseFloat(newEF.toFixed(2))
```

### 11.3. Problem: Migracje nie są zastosowane

**Symptom**: Tabele `learning_state` lub `review_history` nie istnieją

**Rozwiązanie:**
```bash
# Reset całej bazy
npx supabase db reset

# Lub zastosuj tylko nowe migracje
npx supabase db push
```

### 11.4. Problem: RLS blokuje dostęp do danych

**Symptom**: `new row violates row-level security policy`

**Rozwiązanie:**
```sql
-- Sprawdź policies
SELECT * FROM pg_policies WHERE tablename IN ('learning_state', 'review_history');

-- Upewnij się, że INSERT policy używa auth.uid()
-- Sekcja 4.3 w db-plan.md
```

### 11.5. Problem: Trigger nie działa

**Symptom**: `learning_state` nie jest tworzony automatycznie

**Rozwiązanie:**
```sql
-- Sprawdź czy trigger istnieje
SELECT * FROM pg_trigger WHERE tgname = 'create_learning_state_after_flashcard_insert';

-- Jeśli nie, uruchom ponownie migrację
-- supabase/migrations/20251018123000_create_learning_state_table.sql
```

---

## 12. Zasoby i referencje

### 12.1. Dokumentacja

- [API Plan](.ai/api-plan.md) - Kompletna specyfikacja API
- [Database Plan](.ai/db-plan.md) - Schemat bazy danych
- [PRD](.ai/PRD.md) - Product Requirements Document
- [API Plan Update Summary](.ai/API_PLAN_UPDATE_SUMMARY.md) - Podsumowanie zmian

### 12.2. Algorytm SM-2

- **SuperMemo 2 Algorithm**: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
- **Implementacja referencyjna**: Zobacz sekcję 4 w `api-plan.md` (linie 362-415)

### 12.3. Narzędzia

- **Supabase CLI**: https://supabase.com/docs/guides/cli
- **Zod Validation**: https://zod.dev/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

---

## 13. Podsumowanie

### Status implementacji

| Komponent | Status | Priorytet |
|-----------|--------|-----------|
| Migracje DB | ✅ Gotowe | KRYTYCZNY |
| ENUM types | ✅ Gotowe | KRYTYCZNY |
| Triggery | ✅ Gotowe | KRYTYCZNY |
| RLS Policies | ✅ Gotowe | KRYTYCZNY |
| Database Types | ⏳ Do regeneracji | WYSOKI |
| TypeScript DTOs | ⏳ Do stworzenia | WYSOKI |
| SM-2 Service | ⏳ Do implementacji | KRYTYCZNY |
| Learning Service | ⏳ Do implementacji | KRYTYCZNY |
| Validation Schemas | ⏳ Do implementacji | WYSOKI |
| API Endpoints | ⏳ Do implementacji | KRYTYCZNY |
| Unit Tests | ⏳ Do implementacji | WYSOKI |
| E2E Tests | 🔵 Opcjonalne | NISKI |

### Następne kroki

1. **START**: Zastosuj migracje i zregeneruj typy (Sekcja 2-3)
2. Zaimplementuj SM-2 algorytm z testami (Sekcja 5.1)
3. Zaimplementuj Learning Service (Sekcja 5.2)
4. Dodaj walidacje (Sekcja 6)
5. Stwórz API endpoints (Sekcja 7)
6. Przetestuj kompletny flow (Sekcja 8)
7. **FINISH**: Deploy na produkcję (Checklist 9.4)

---

**Dokument zaktualizowano**: 2025-10-18  
**Wersja**: 1.0  
**Autor**: Development Team  
**Status**: ✅ Gotowy do użycia

