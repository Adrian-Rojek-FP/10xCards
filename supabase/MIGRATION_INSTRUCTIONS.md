# Instrukcja wykonania migracji RLS

## Utworzona migracja

**Plik:** `supabase/migrations/20251015140000_enable_rls_policies.sql`

**Cel:** Ponowne włączenie Row Level Security (RLS) na wszystkich tabelach z granularnymi politykami dla operacji CRUD.

**Tabele objęte zmianami:**
- `flashcards`
- `generations`
- `generation_error_logs`

---

## Krok 1: Sprawdzenie statusu migracji

Przed wykonaniem migracji sprawdź, które migracje zostały już zaaplikowane:

```bash
# Sprawdź status migracji w lokalnej bazie
supabase migration list

# lub sprawdź status w konkretnym środowisku zdalnym
supabase migration list --db-url "postgresql://..."
```

---

## Krok 2: Wykonanie migracji lokalnie (opcjonalnie)

Jeśli używasz lokalnego Supabase, najpierw przetestuj migrację lokalnie:

```bash
# Uruchom lokalny Supabase (jeśli nie działa)
supabase start

# Wykonaj migracje (wszystkie oczekujące)
supabase db push

# lub wykonaj bezpośrednio z pliku
supabase db push --include-all
```

### Weryfikacja lokalna

Możesz sprawdzić czy RLS został włączony przez:

```bash
# Połącz się z lokalną bazą
supabase db connect

# W psql wykonaj:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('flashcards', 'generations', 'generation_error_logs');

# Sprawdź polityki RLS:
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## Krok 3: Wykonanie migracji na bazie zdalnej (produkcja/staging)

### Opcja A: Użycie Supabase CLI (zalecane)

```bash
# Zaloguj się do Supabase
supabase login

# Podłącz się do projektu (jeśli jeszcze nie zrobione)
supabase link --project-ref <your-project-ref>

# Wykonaj migrację na zdalnej bazie
supabase db push
```

### Opcja B: Użycie panelu Supabase Dashboard

1. Przejdź do **Supabase Dashboard** → Twój projekt
2. Otwórz zakładkę **SQL Editor**
3. Otwórz plik `supabase/migrations/20251015140000_enable_rls_policies.sql`
4. Skopiuj całą zawartość pliku
5. Wklej do SQL Editor
6. Kliknij **RUN** aby wykonać migrację

### Opcja C: Bezpośrednie połączenie przez psql

```bash
# Pobierz connection string z Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# W psql wykonaj zawartość pliku:
\i supabase/migrations/20251015140000_enable_rls_policies.sql
```

---

## Krok 4: Weryfikacja poprawności migracji

### 4.1 Sprawdzenie czy RLS jest włączony

Użyj **SQL Editor** w Supabase Dashboard lub lokalnie w `psql`:

```sql
-- Sprawdź status RLS na tabelach
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
  and tablename in ('flashcards', 'generations', 'generation_error_logs');
```

**Oczekiwany rezultat:** Wszystkie trzy tabele powinny mieć `rowsecurity = true`

### 4.2 Sprawdzenie polityk RLS

```sql
-- Wyświetl wszystkie polityki RLS
select 
  schemaname,
  tablename, 
  policyname, 
  cmd,
  roles,
  qual,
  with_check
from pg_policies 
where schemaname = 'public'
order by tablename, cmd;
```

**Oczekiwany rezultat:** Powinno być **12 polityk** (4 dla każdej tabeli: SELECT, INSERT, UPDATE, DELETE)

### 4.3 Test funkcjonalności

Przetestuj czy aplikacja działa poprawnie:

```sql
-- Test jako zalogowany użytkownik (w aplikacji)
-- 1. Sprawdź czy użytkownik widzi tylko swoje dane
select * from flashcards; -- powinno zwrócić tylko flashcards użytkownika

-- 2. Spróbuj wstawić nową kartę
insert into flashcards (front, back, source, user_id) 
values ('Test', 'Test back', 'manual', auth.uid());

-- 3. Sprawdź czy można zaktualizować swoją kartę
update flashcards set front = 'Updated' where id = [your_card_id];

-- 4. Sprawdź czy można usunąć swoją kartę
delete from flashcards where id = [your_card_id];
```

---

## Krok 5: Monitoring po migracji

### 5.1 Sprawdź logi błędów

W Supabase Dashboard → Logs → Database:
- Sprawdź czy nie ma błędów związanych z RLS
- Zwróć uwagę na `permission denied` errors - mogą wskazywać na problemy z politykami

### 5.2 Test E2E aplikacji

```bash
# Uruchom testy E2E aby sprawdzić czy wszystko działa
npm run test:e2e
```

---

## Rollback (w razie problemów)

Jeśli migracja spowoduje problemy, możesz cofnąć zmiany:

```sql
-- Wyłącz RLS (tymczasowo)
alter table public.flashcards disable row level security;
alter table public.generations disable row level security;
alter table public.generation_error_logs disable row level security;

-- Usuń polityki
drop policy if exists "flashcards_select_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_insert_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_update_policy_authenticated" on public.flashcards;
drop policy if exists "flashcards_delete_policy_authenticated" on public.flashcards;

drop policy if exists "generations_select_policy_authenticated" on public.generations;
drop policy if exists "generations_insert_policy_authenticated" on public.generations;
drop policy if exists "generations_update_policy_authenticated" on public.generations;
drop policy if exists "generations_delete_policy_authenticated" on public.generations;

drop policy if exists "generation_error_logs_select_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_insert_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_update_policy_authenticated" on public.generation_error_logs;
drop policy if exists "generation_error_logs_delete_policy_authenticated" on public.generation_error_logs;
```

---

## Uwagi końcowe

### Bezpieczeństwo
- RLS zapewnia izolację danych między użytkownikami na poziomie bazy danych
- Każdy użytkownik ma dostęp tylko do swoich własnych rekordów
- Polityki są granularne - oddzielna polityka dla każdej operacji (SELECT, INSERT, UPDATE, DELETE)

### Performance
- RLS policies są sprawdzane przy każdym zapytaniu
- Dodane indeksy (`idx_flashcards_user_id`, etc.) pomagają w optymalizacji zapytań z filtrowaniem po `user_id`

### Service Role
- Service role (używany w funkcjach backend) **omija RLS**
- Używaj service role tylko w zaufanym kodzie backend
- W zapytaniach klienckich używaj `anon` lub `authenticated` role

---

## Potrzebujesz pomocy?

- 📚 [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- 📚 [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- 🐛 W razie problemów sprawdź logi w Supabase Dashboard

