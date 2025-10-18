# 10xCards Database Schema

## 0. ENUM Types

### 0.1. flashcard_source
```sql
CREATE TYPE flashcard_source AS ENUM ('ai-full', 'ai-edited', 'manual');
```

### 0.2. learning_status
```sql
CREATE TYPE learning_status AS ENUM ('new', 'learning', 'review', 'relearning');
```

### 0.3. review_rating
```sql
CREATE TYPE review_rating AS ENUM ('again', 'hard', 'good', 'easy');
```

## 1. Tabele

### 1.1. users

This table is managed by Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### 1.2. flashcards

- id: BIGSERIAL PRIMARY KEY
- front: VARCHAR(200) NOT NULL
- back: VARCHAR(500) NOT NULL
- source: flashcard_source NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- generation_id: BIGINT REFERENCES generations(id) ON DELETE SET NULL
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE

*Trigger: Automatically update the `updated_at` column on record updates.*  
*Trigger: Automatically create initial learning_state after INSERT.*

### 1.3. generations

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- model: VARCHAR(100) NOT NULL
- generated_count: INTEGER NOT NULL CHECK (generated_count >= 0)
- accepted_unedited_count: INTEGER DEFAULT 0 CHECK (accepted_unedited_count >= 0)
- accepted_edited_count: INTEGER DEFAULT 0 CHECK (accepted_edited_count >= 0)
- source_text_hash: VARCHAR(64) NOT NULL
- source_text_length: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- generation_duration: INTEGER NOT NULL CHECK (generation_duration > 0 AND generation_duration <= 300000)
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()

*Note: source_text_hash uses SHA-256 algorithm.*  
*Note: generation_duration is in milliseconds (max 5 minutes).*  
*Trigger: Automatically update the `updated_at` column on record updates.*  
*Trigger: Automatically update accepted_unedited_count and accepted_edited_count when flashcards are inserted.*

### 1.4. generation_error_logs

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- model: VARCHAR(100) NOT NULL
- source_text_hash: VARCHAR(64) NOT NULL
- source_text_length: INTEGER NOT NULL CHECK (source_text_length BETWEEN 1000 AND 10000)
- error_code: VARCHAR(100) NOT NULL
- error_message: TEXT NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()

### 1.5. learning_state

Przechowuje stan nauki każdej fiszki dla algorytmu SM-2 (SuperMemo 2).

- id: BIGSERIAL PRIMARY KEY
- flashcard_id: BIGINT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- status: learning_status NOT NULL DEFAULT 'new'
- easiness_factor: DECIMAL(3,2) NOT NULL DEFAULT 2.50 CHECK (easiness_factor >= 1.30 AND easiness_factor <= 3.00)
- interval: INTEGER NOT NULL DEFAULT 0 CHECK (interval >= 0)
- repetitions: INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0)
- lapses: INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0)
- next_review_date: TIMESTAMPTZ NOT NULL DEFAULT now()
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- UNIQUE(flashcard_id, user_id)

*Note: easiness_factor - współczynnik łatwości z algorytmu SM-2 (1.30-3.00)*  
*Note: interval - liczba dni do następnego przeglądu*  
*Note: repetitions - liczba udanych kolejnych powtórzeń*  
*Note: lapses - liczba niepowodzeń (zapomnienia fiszki)*  
*Trigger: Automatically update the `updated_at` column on record updates.*

### 1.6. review_history

Immutable historia wszystkich odpowiedzi użytkownika. Rekordy nie mogą być modyfikowane ani usuwane (tylko przez CASCADE przy usunięciu użytkownika/fiszki).

- id: BIGSERIAL PRIMARY KEY
- flashcard_id: BIGINT NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- rating: INTEGER NOT NULL CHECK (rating IN (0, 1, 2, 3))
- review_duration_ms: INTEGER NULLABLE CHECK (review_duration_ms > 0)
- previous_interval: INTEGER NOT NULL CHECK (previous_interval >= 0)
- new_interval: INTEGER NOT NULL CHECK (new_interval >= 0)
- previous_easiness_factor: DECIMAL(3,2) NOT NULL CHECK (previous_easiness_factor >= 1.30 AND previous_easiness_factor <= 3.00)
- new_easiness_factor: DECIMAL(3,2) NOT NULL CHECK (new_easiness_factor >= 1.30 AND new_easiness_factor <= 3.00)
- reviewed_at: TIMESTAMPTZ NOT NULL DEFAULT now()

*Note: rating - 0=again, 1=hard, 2=good, 3=easy (zgodnie z algorytmem SM-2)*  
*Note: review_duration_ms - opcjonalny czas odpowiedzi w milisekundach*  
*Note: Historia jest immutable - brak UPDATE/DELETE w RLS policies (tylko SELECT i INSERT)*

## 2. Relacje

### 2.1. Relacje users (1:N)
- users → flashcards (1:N, CASCADE)
- users → learning_state (1:N, CASCADE)
- users → review_history (1:N, CASCADE)
- users → generations (1:N, CASCADE)
- users → generation_error_logs (1:N, CASCADE)

### 2.2. Relacje flashcards
- flashcards → learning_state (1:1 per user, CASCADE)
  - Każda fiszka ma dokładnie jeden rekord learning_state per użytkownik (UNIQUE constraint)
- flashcards → review_history (1:N, CASCADE)
  - Każda fiszka może mieć wiele rekordów w historii odpowiedzi
- flashcards → generations (N:1, SET NULL)
  - Fiszki wygenerowane przez AI odnoszą się do generacji (opcjonalne)

### 2.3. Zgodność z RODO
Wszystkie relacje do tabeli users używają `ON DELETE CASCADE`, co zapewnia możliwość pełnego usunięcia konta użytkownika wraz ze wszystkimi powiązanymi danymi (fiszki, stany nauki, historia odpowiedzi, generacje, logi błędów).

## 3. Indeksy

### 3.1. Indeksy dla flashcards
- `idx_flashcards_user_id` na `user_id` - szybkie pobieranie fiszek użytkownika
- `idx_flashcards_generation_id` na `generation_id` - pobieranie fiszek z konkretnej generacji

### 3.2. Indeksy dla learning_state (zoptymalizowane pod algorytm powtórek)
- `idx_learning_state_user_id` na `user_id` - szybkie pobieranie stanów nauki użytkownika
- `idx_learning_state_flashcard_id` na `flashcard_id` - szybkie pobieranie stanu konkretnej fiszki
- `idx_learning_state_next_review` na `(user_id, next_review_date, status)` - COMPOSITE INDEX dla zapytań o fiszki do przeglądu
  - Najbardziej krytyczny indeks dla wydajności sesji nauki
  - Pozwala szybko znaleźć fiszki użytkownika, które są gotowe do przeglądu
- `idx_learning_state_status` na `(user_id, status)` - filtrowanie po statusie nauki

### 3.3. Indeksy dla review_history
- `idx_review_history_user_id` na `user_id` - szybkie pobieranie historii użytkownika
- `idx_review_history_flashcard_id` na `flashcard_id` - historia konkretnej fiszki
- `idx_review_history_reviewed_at` na `(user_id, reviewed_at DESC)` - sortowanie po dacie dla analityki
- `idx_review_history_flashcard_reviewed` na `(flashcard_id, reviewed_at DESC)` - historia fiszki w kolejności chronologicznej

### 3.4. Indeksy dla generations
- `idx_generations_user_id` na `user_id` - szybkie pobieranie generacji użytkownika
- `idx_generations_hash_lookup` na `(user_id, source_text_hash)` - COMPOSITE INDEX dla deduplikacji
  - Szybkie sprawdzanie, czy użytkownik już generował fiszki dla tego samego tekstu
  - Umożliwia potencjalne cache'owanie wyników

### 3.5. Indeksy dla generation_error_logs
- `idx_generation_error_logs_user_id` na `user_id` - szybkie pobieranie logów użytkownika
- `idx_generation_error_logs_created_at` na `created_at DESC` - sortowanie po dacie dla diagnostyki

## 4. Zasady RLS (Row-Level Security)

### 4.1. Polityki dla flashcards
Tabela: `flashcards`  
Funkcja Supabase Auth: `auth.uid()`

**Polityki:**
- **SELECT**: `auth.uid() = user_id` - użytkownik może odczytywać tylko swoje fiszki
- **INSERT**: `auth.uid() = user_id` - użytkownik może tworzyć fiszki tylko dla siebie
- **UPDATE**: `auth.uid() = user_id` - użytkownik może edytować tylko swoje fiszki
- **DELETE**: `auth.uid() = user_id` - użytkownik może usuwać tylko swoje fiszki

### 4.2. Polityki dla learning_state
Tabela: `learning_state`

**Polityki:**
- **SELECT**: `auth.uid() = user_id` - użytkownik może odczytywać tylko swoje stany nauki
- **INSERT**: `auth.uid() = user_id` - użytkownik może tworzyć stany nauki tylko dla siebie
- **UPDATE**: `auth.uid() = user_id` - użytkownik może aktualizować tylko swoje stany nauki
- **DELETE**: `auth.uid() = user_id` - użytkownik może usuwać tylko swoje stany nauki

### 4.3. Polityki dla review_history (IMMUTABLE)
Tabela: `review_history`

**Polityki:**
- **SELECT**: `auth.uid() = user_id` - użytkownik może odczytywać tylko swoją historię
- **INSERT**: `auth.uid() = user_id` - użytkownik może dodawać wpisy tylko dla siebie
- **UPDATE**: BRAK - historia odpowiedzi jest immutable (nie można modyfikować)
- **DELETE**: BRAK - historia odpowiedzi jest immutable (nie można usuwać, tylko CASCADE)

*Note: Historia odpowiedzi jest niemodyfikowalna dla zachowania integralności danych analitycznych. Rekordy są usuwane tylko przez CASCADE przy usunięciu użytkownika lub fiszki.*

### 4.4. Polityki dla generations
Tabela: `generations`

**Polityki:**
- **SELECT**: `auth.uid() = user_id` - użytkownik może odczytywać tylko swoje generacje
- **INSERT**: `auth.uid() = user_id` - użytkownik może tworzyć generacje tylko dla siebie
- **UPDATE**: `auth.uid() = user_id` - użytkownik może aktualizować tylko swoje generacje
- **DELETE**: `auth.uid() = user_id` - użytkownik może usuwać tylko swoje generacje

### 4.5. Polityki dla generation_error_logs
Tabela: `generation_error_logs`

**Polityki:**
- **SELECT**: `auth.uid() = user_id` - użytkownik może odczytywać tylko swoje logi błędów
- **INSERT**: `auth.uid() = user_id` - użytkownik może tworzyć logi błędów tylko dla siebie
- **UPDATE**: BRAK - logi błędów są immutable
- **DELETE**: BRAK - logi błędów są immutable (tylko CASCADE)

### 4.6. Włączenie RLS
Aby włączyć Row-Level Security dla wszystkich tabel:
```sql
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
```

## 5. Triggery

### 5.1. Trigger: update_updated_at_column
**Cel:** Automatyczna aktualizacja kolumny `updated_at` przy każdej modyfikacji rekordu.

**Tabele:** `flashcards`, `learning_state`, `generations`

**Implementacja:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Flashcards
CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Learning State
CREATE TRIGGER update_learning_state_updated_at BEFORE UPDATE ON learning_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generations
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2. Trigger: create_initial_learning_state
**Cel:** Automatyczne tworzenie początkowego stanu nauki dla każdej nowo utworzonej fiszki.

**Tabela:** `flashcards`

**Implementacja:**
```sql
CREATE OR REPLACE FUNCTION create_initial_learning_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO learning_state (
        flashcard_id,
        user_id,
        status,
        easiness_factor,
        interval,
        repetitions,
        lapses,
        next_review_date
    ) VALUES (
        NEW.id,
        NEW.user_id,
        'new',
        2.50,
        0,
        0,
        0,
        now()
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_learning_state_after_flashcard_insert 
    AFTER INSERT ON flashcards
    FOR EACH ROW EXECUTE FUNCTION create_initial_learning_state();
```

**Wartości domyślne:**
- `status`: 'new' - fiszka jest nowa, nieznana użytkownikowi
- `easiness_factor`: 2.50 - wartość początkowa algorytmu SM-2
- `interval`: 0 - brak interwału, fiszka gotowa do pierwszego przeglądu
- `repetitions`: 0 - brak udanych powtórzeń
- `lapses`: 0 - brak niepowodzeń
- `next_review_date`: now() - fiszka dostępna natychmiast

### 5.3. Trigger: update_generation_accepted_counts
**Cel:** Automatyczne przeliczanie liczników `accepted_unedited_count` i `accepted_edited_count` w tabeli `generations` przy dodawaniu fiszek.

**Tabela:** `flashcards`

**Implementacja:**
```sql
CREATE OR REPLACE FUNCTION update_generation_accepted_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Tylko dla fiszek z generation_id (wygenerowanych przez AI)
    IF NEW.generation_id IS NOT NULL THEN
        -- Jeśli source = 'ai-full', zwiększ accepted_unedited_count
        IF NEW.source = 'ai-full' THEN
            UPDATE generations 
            SET accepted_unedited_count = COALESCE(accepted_unedited_count, 0) + 1
            WHERE id = NEW.generation_id;
        
        -- Jeśli source = 'ai-edited', zwiększ accepted_edited_count
        ELSIF NEW.source = 'ai-edited' THEN
            UPDATE generations 
            SET accepted_edited_count = COALESCE(accepted_edited_count, 0) + 1
            WHERE id = NEW.generation_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accepted_counts_after_flashcard_insert 
    AFTER INSERT ON flashcards
    FOR EACH ROW EXECUTE FUNCTION update_generation_accepted_counts();
```

**Logika:**
- Trigger uruchamia się tylko dla fiszek z `generation_id IS NOT NULL`
- `source = 'ai-full'` → zwiększa `accepted_unedited_count`
- `source = 'ai-edited'` → zwiększa `accepted_edited_count`
- `source = 'manual'` → nie zmienia liczników (fiszka stworzona ręcznie)

## 6. Dodatkowe uwagi

### 6.1. Algorytm SM-2 (SuperMemo 2)
Schemat wspiera pełną implementację algorytmu SM-2:
- **easiness_factor**: 1.30 - 3.00 (współczynnik łatwości)
- **interval**: liczba dni do następnego przeglądu
- **repetitions**: liczba udanych kolejnych powtórzeń
- **lapses**: liczba niepowodzeń (zapomnienia fiszki)
- **rating**: 0=again, 1=hard, 2=good, 3=easy

Mapowanie rating na wartości SM-2:
- **0 (again)**: Całkowite zapomnienie, restart interwału
- **1 (hard)**: Trudna odpowiedź, minimalny wzrost interwału
- **2 (good)**: Poprawna odpowiedź, normalny wzrost interwału
- **3 (easy)**: Łatwa odpowiedź, maksymalny wzrost interwału

### 6.2. Optymalizacje wydajności
- **ENUM types** zamiast VARCHAR dla lepszej wydajności i walidacji
- **DECIMAL(3,2)** dla easiness_factor - precyzja bez overhead NUMERIC
- **INTEGER** dla duration w ms (nie BIGINT) - wystarczający zakres do 300s
- **Composite indeksy** zoptymalizowane pod najbardziej krytyczne zapytania
- **Brak denormalizacji** w MVP (np. last_reviewed_at w flashcards)

### 6.3. Bezpieczeństwo i zgodność
- **Row-Level Security (RLS)** na wszystkich tabelach z danymi użytkowników
- **ON DELETE CASCADE** dla zgodności z RODO (prawo do usunięcia danych)
- **Immutable historia** (review_history, generation_error_logs) dla integralności audytu
- **CHECK constraints** na wszystkich polach numerycznych dla walidacji danych

### 6.4. Skalowalność - rozważenia przyszłe (poza MVP)
- **Partycjonowanie review_history** po dacie (przy >10M rekordów)
- **Materialized views** dla analityki i statystyk
- **Archiwizacja** starych danych historii przeglądu
- **Indeksy częściowe** (partial indexes) dla optymalizacji konkretnych zapytań
- **Connection pooling** dla obsługi większej liczby użytkowników

### 6.5. Rozważenia implementacyjne
- **Wielkość pól**: VARCHAR(200) dla `front` i VARCHAR(500) dla `back` może wymagać zwiększenia w przyszłości. Warto monitorować długość zapisywanych treści.
- **Deduplikacja generacji**: Indeks na `source_text_hash` umożliwia wykrycie duplikatów, ale logika obsługi (cache, powiadomienie użytkownika) musi być zaimplementowana na poziomie aplikacji.
- **Rate limiting**: Nie zaimplementowano w bazie, wymaga obsługi na poziomie API lub middleware.
- **Mapowanie ENUM na INTEGER**: ENUM `review_rating` ('again', 'hard', 'good', 'easy') w tabeli `review_history` używa INTEGER (0-3), więc aplikacja musi obsługiwać konwersję.
- **Trigger update counts**: Nie obsługuje scenariusza UPDATE flashcards (zmiana source). Jeśli taka funkcjonalność będzie potrzebna, trigger wymaga rozszerzenia.

### 6.6. Limity i ograniczenia MVP
- **Brak soft delete** - wszystkie usunięcia są trwałe
- **Brak wersjonowania** fiszek (historia zmian front/back)
- **Brak organizacji** w decks/talie
- **Brak tagów/kategorii** dla fiszek
- **Brak konfiguracji algorytmu** per użytkownik
- **Brak współdzielenia** fiszek między użytkownikami
- **Brak limitów** liczby fiszek per użytkownik (wymaga monitorowania)
