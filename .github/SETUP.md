# Setup CI/CD i Środowiska Testowego

## 🚀 Szybki Start

### 1. Lokalne środowisko

#### Krok 1: Zainstaluj zależności

```bash
npm install
```

#### Krok 2: Skonfiguruj zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key-here

# Optional - dla generowania flashcards
OPENROUTER_API_KEY=your-openrouter-api-key-here
```

#### Krok 3: Skonfiguruj środowisko testowe

Utwórz plik `.env.test` dla testów E2E:

```env
# Supabase Test Configuration
PUBLIC_SUPABASE_URL=https://your-test-project-id.supabase.co
PUBLIC_SUPABASE_KEY=your-test-anon-key-here

# Base URL dla testów E2E
BASE_URL=http://localhost:3000
```

**Uwaga**: Zaleca się używanie oddzielnej instancji Supabase dla testów.

#### Krok 4: Uruchom testy lokalnie

```bash
# Linting
npm run lint

# Testy jednostkowe
npm run test:run

# Build produkcyjny
npm run build

# Testy E2E (wymaga uruchomionego dev server)
npm run test:e2e
```

### 2. GitHub Actions CI/CD

#### Krok 1: Uzyskaj credentials Supabase

1. Przejdź do [Supabase Dashboard](https://supabase.com/dashboard)
2. Wybierz projekt (lub utwórz nowy dla testów)
3. Przejdź do: Settings → API
4. Skopiuj:
   - **Project URL** (to będzie `PUBLIC_SUPABASE_URL`)
   - **anon/public key** (to będzie `PUBLIC_SUPABASE_KEY`)

#### Krok 2: Dodaj secrets w GitHub

1. Przejdź do swojego repozytorium na GitHub
2. Kliknij **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**
4. Dodaj następujące secrets:

| Nazwa | Wartość | Wymagane |
|-------|---------|----------|
| `PUBLIC_SUPABASE_URL` | URL projektu Supabase | ✅ Tak |
| `PUBLIC_SUPABASE_KEY` | Klucz anon/public Supabase | ✅ Tak |
| `OPENROUTER_API_KEY` | Klucz API OpenRouter | ❌ Opcjonalnie |

#### Krok 3: Zweryfikuj workflow

1. Wykonaj push do brancha `main`
2. Przejdź do zakładki **Actions** w GitHub
3. Sprawdź czy workflow "CI" działa poprawnie

### 3. Manualne uruchomienie CI

1. Przejdź do zakładki **Actions**
2. Wybierz workflow **CI**
3. Kliknij **Run workflow**
4. Wybierz branch (domyślnie `main`)
5. Kliknij **Run workflow**

## 🔧 Konfiguracja Zaawansowana

### Własna instancja Supabase dla testów

Zaleca się utworzenie oddzielnej instancji Supabase dla testów:

1. Utwórz nowy projekt w Supabase Dashboard
2. Nazwij go np. "10xCards-Test"
3. Uruchom migracje bazy danych:

```bash
# Zainstaluj Supabase CLI jeśli jeszcze nie masz
npm install -g supabase

# Link do projektu testowego
supabase link --project-ref your-test-project-ref

# Uruchom migracje
supabase db push
```

4. Użyj credentials z tego projektu w `.env.test` i GitHub secrets

### Własny OpenRouter API Key

Jeśli planujesz testować generowanie flashcards:

1. Przejdź do [OpenRouter.ai](https://openrouter.ai/)
2. Zaloguj się i przejdź do Settings → Keys
3. Utwórz nowy klucz API
4. Ustaw limity finansowe (zalecane dla testów: $5-10)
5. Dodaj klucz do `.env` i jako GitHub secret

### Dostosowanie workflow

Plik workflow znajduje się w `.github/workflows/ci.yml`. Możesz dostosować:

- **Timeout**: Zmień `timeout-minutes` jeśli testy trwają dłużej
- **Node.js version**: Zmień zawartość pliku `.nvmrc`
- **Cache**: Domyślnie używany jest cache npm
- **Artifacts**: Domyślnie przechowywane 7 dni

## 📋 Checklist przed uruchomieniem CI

- [ ] Zainstalowano wszystkie zależności (`npm install`)
- [ ] Utworzono plik `.env` z wartościami Supabase
- [ ] Utworzono plik `.env.test` dla testów E2E
- [ ] Testy jednostkowe przechodzą lokalnie (`npm run test:run`)
- [ ] Testy E2E przechodzą lokalnie (`npm run test:e2e`)
- [ ] Build produkcyjny działa lokalnie (`npm run build`)
- [ ] Dodano secrets `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_KEY` w GitHub
- [ ] Wykonano pierwszy push i zweryfikowano workflow w GitHub Actions

## 🐛 Troubleshooting

### Problem: Brak plików .env

**Objawy**: Błędy "Cannot read property of undefined" lub "SUPABASE_URL is not defined"

**Rozwiązanie**:
```bash
# Utwórz pliki .env
touch .env .env.test

# Wypełnij wartościami zgodnie z instrukcjami powyżej
```

### Problem: Testy E2E failują z "Connection refused"

**Objawy**: Playwright nie może połączyć się z aplikacją

**Rozwiązanie**:
- Sprawdź czy `BASE_URL` w `.env.test` jest poprawny
- Upewnij się że port 3000 nie jest zajęty przez inną aplikację
- W CI workflow automatycznie uruchamia dev server

### Problem: GitHub Actions failują z "Unauthorized"

**Objawy**: 401 errors w testach E2E na CI

**Rozwiązanie**:
- Sprawdź czy secrets są poprawnie ustawione w GitHub
- Zweryfikuj że `PUBLIC_SUPABASE_KEY` to klucz **anon/public**, nie service role
- Sprawdź czy URL projektu Supabase jest poprawny

### Problem: Timeout w CI

**Objawy**: Workflow przerywa się po 15 minutach

**Rozwiązanie**:
- Zwiększ `timeout-minutes` w `.github/workflows/ci.yml`
- Sprawdź czy testy nie zawierają nieskończonych pętli
- Zoptymalizuj testy E2E (zmniejsz liczbę, użyj parallel execution)

## 📚 Dodatkowe Zasoby

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Documentation](https://supabase.com/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

---

**Pytania?** Sprawdź dokumentację lub otwórz issue w repozytorium.

