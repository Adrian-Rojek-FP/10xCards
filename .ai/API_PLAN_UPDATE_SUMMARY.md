# Podsumowanie aktualizacji API Plan

**Data**: 2025-10-18  
**Status**: ✅ Zakończono

## Przegląd zmian

Plan API został zaktualizowany i rozszerzony o funkcjonalność algorytmu SM-2 (SuperMemo 2) oraz sesji nauki, która była wymagana w `PRD.md` (US-008) i wspierana przez nowe tabele w `db-plan.md`.

---

## 1. Nowe zasoby (Resources)

Dodano 2 nowe zasoby API:

### 1.1. Learning State
- **Tabela**: `learning_state`
- **Opis**: Stan nauki każdej fiszki dla algorytmu SM-2
- **Pola**: status, easiness_factor, interval, repetitions, lapses, next_review_date
- **Uwagi**: Automatycznie tworzony przez trigger przy dodawaniu fiszki

### 1.2. Review History
- **Tabela**: `review_history`
- **Opis**: Immutable historia wszystkich sesji przeglądu
- **Pola**: rating, review_duration_ms, previous/new intervals i easiness_factors
- **Uwagi**: Tylko do odczytu (INSERT), nie można modyfikować ani usuwać

---

## 2. Nowe endpointy

### 2.5. Learning Sessions (Spaced Repetition)

#### GET `/learning/session`
- **Cel**: Pobranie fiszek gotowych do przeglądu dla sesji nauki
- **Parametry**: limit (default: 20), status, include_new
- **Logika**: 
  - Filtrowanie po `next_review_date <= now()`
  - Priorytetyzacja statusów (learning, relearning najpierw)
  - JOIN z tabelą flashcards dla pełnych danych
- **Response**: Lista fiszek z learning_state + statystyki (total_due, new_cards, review_cards)

#### POST `/learning/review`
- **Cel**: Zapisanie odpowiedzi użytkownika i aktualizacja stanu nauki
- **Request**: flashcard_id, rating (0-3), review_duration_ms (opcjonalnie)
- **Walidacja**: 
  - rating: 0=again, 1=hard, 2=good, 3=easy
  - flashcard_id musi należeć do użytkownika
- **Logika SM-2**:
  - Rating 0: Reset, interval=0, status='relearning'
  - Rating 1: Minimalny wzrost interwału, lekki spadek EF
  - Rating 2: Normalny wzrost według SM-2, EF bez zmian
  - Rating 3: Maksymalny wzrost, wzrost EF
- **Operacje**: 
  - UPDATE learning_state (transakcja)
  - INSERT review_history (audit log)

#### GET `/learning/stats`
- **Cel**: Statystyki nauki użytkownika
- **Dane**: 
  - Liczba fiszek po statusach
  - Fiszki do przeglądu (due_today, overdue)
  - Retention rate, średni easiness_factor
  - Total reviews, streak_days

#### GET `/learning/history`
- **Cel**: Historia przeglądów dla analityki
- **Parametry**: page, limit, flashcard_id, from_date, to_date
- **Response**: Paginowana lista rekordów review_history

---

## 3. Rozszerzenia walidacji i logiki biznesowej

### 3.1. Nowe reguły walidacji

**Learning State**:
- status: ENUM ('new', 'learning', 'review', 'relearning')
- easiness_factor: 1.30 - 3.00 (DECIMAL(3,2))
- interval: ≥ 0 (dni)
- repetitions, lapses: ≥ 0

**Review History**:
- rating: 0-3 (INTEGER)
- review_duration_ms: > 0 (opcjonalnie)

### 3.2. Algorytm SM-2 - szczegółowa implementacja

Dodano kompletną specyfikację algorytmu SM-2 z dokładnymi zasadami dla każdego ratingu:

**Rating 0 (Again)**:
```
repetitions = 0
interval = 0
easiness_factor = max(1.30, EF - 0.20)
lapses = lapses + 1
status = 'relearning'
```

**Rating 1 (Hard)**:
```
interval: 1 → 1 → 1.2x (dla repetitions: 0 → 1 → 2+)
easiness_factor = max(1.30, EF - 0.15)
status = 'learning'
```

**Rating 2 (Good)**:
```
interval: 1 → 6 → EF*previous (dla repetitions: 0 → 1 → 2+)
easiness_factor = EF (bez zmian)
repetitions = repetitions + 1
status = 'review' (gdy repetitions >= 2)
```

**Rating 3 (Easy)**:
```
interval: 4 → 10 → EF*1.3*previous (dla repetitions: 0 → 1 → 2+)
easiness_factor = min(3.00, EF + 0.15)
repetitions = repetitions + 1
status = 'review'
```

### 3.3. Triggery bazy danych

Dodano dokumentację wpływu triggerów na API:

1. **create_initial_learning_state**: Automatyczne tworzenie learning_state przy INSERT flashcard
2. **update_generation_accepted_counts**: Automatyczne liczniki akceptacji fiszek AI
3. **update_updated_at_column**: Automatyczna aktualizacja timestampów

---

## 4. Dodatkowe uwagi implementacyjne (Sekcja 5)

### 5.1. Database Triggers Impact on API
- Dokumentacja jak triggery wpływają na response API
- Sugestia rozszerzenia POST `/flashcards` o learning_state w odpowiedzi

### 5.2. Response Format Considerations
- Propozycja rozszerzonego formatu odpowiedzi dla lepszego UX

### 5.3. Error Handling Best Practices
- Obsługa immutable tables (405 Method Not Allowed)
- Transakcje dla review submissions
- Sugestie rate limiting dla różnych endpointów

### 5.4. Performance Optimization
- Wykorzystanie composite indexes
- Caching strategy (1-5 min dla sessions, 5-15 min dla stats)
- Optymalizacja JOIN queries (unikanie N+1)
- Database transactions dla atomowości

### 5.5. GDPR and Data Privacy
- Potwierdzenie RLS policies dla wszystkich nowych tabel
- CASCADE deletes dla zgodności z RODO

### 5.6. Future API Enhancements (Post-MVP)
- Lista przydatnych rozszerzeń poza MVP:
  - PATCH endpoints
  - Session completion tracking
  - Calendar/heatmap data
  - Full-text search
  - Bulk import
  - Deduplication checks
  - WebSocket dla real-time

### 5.7. API Versioning Strategy
- Strategie wersjonowania dla przyszłości

### 5.8. Testing Considerations
- Kluczowe scenariusze testowe:
  - Learning session flow (create → session → review)
  - Edge cases (non-existent flashcards, invalid ratings, concurrent reviews)
  - Performance tests (10k+ flashcards)

### 5.9. Monitoring and Observability
- Metryki engagement (daily reviewers, completion rate)
- Metryki algorytmu SM-2 (retention rate, easiness distribution)
- Metryki performance (response times, cache hits)
- Error tracking

---

## 5. Zgodność z PRD i DB Plan

### ✅ Zgodność z PRD.md

- **US-008 (Sesja nauki z algorytmem powtórek)**: ✅ Pełna implementacja
  - GET `/learning/session` - przygotowanie sesji
  - POST `/learning/review` - ocena fiszki
  - Algorytm SM-2 zgodny z wymaganiami

- **Wymaganie 4 (Integracja z algorytmem powtórek)**: ✅ Zaimplementowane
  - Harmonogram powtórek (next_review_date)
  - Algorytm SM-2 (zewnętrzny standard)

- **Wymaganie 6 (Statystyki)**: ✅ Rozszerzone
  - Statystyki generowania fiszek (istniejące)
  - Nowe: statystyki nauki i retention rate

### ✅ Zgodność z db-plan.md

Wszystkie nowe tabele z db-plan.md są uwzględnione w API:

- **learning_state** (tabela 1.5): ✅ Pełna integracja
  - GET `/learning/session` - query po learning_state
  - POST `/learning/review` - update learning_state
  - GET `/learning/stats` - agregacja learning_state

- **review_history** (tabela 1.6): ✅ Pełna integracja
  - POST `/learning/review` - INSERT do review_history
  - GET `/learning/history` - query review_history
  - Immutable design - brak UPDATE/DELETE endpoints

- **ENUM types**: ✅ Wszystkie uwzględnione
  - flashcard_source: 'ai-full', 'ai-edited', 'manual'
  - learning_status: 'new', 'learning', 'review', 'relearning'
  - review_rating: mapowanie 0-3 (again, hard, good, easy)

- **Triggery**: ✅ Udokumentowane
  - create_initial_learning_state
  - update_generation_accepted_counts
  - update_updated_at_column

- **RLS Policies**: ✅ Przestrzegane
  - Wszystkie endpointy wymagają auth.uid() = user_id
  - Immutable tables: tylko SELECT i INSERT

---

## 6. Pozostałe akcje

### Wymagane do implementacji:
1. ✅ Aktualizacja `api-plan.md` - **ZAKOŃCZONE**
2. ⏳ Implementacja endpointów `/learning/*` w `src/pages/api/learning/`
3. ⏳ Serwis SM-2 w `src/lib/services/sm2.service.ts`
4. ⏳ Testy jednostkowe dla algorytmu SM-2
5. ⏳ Testy E2E dla learning session flow
6. ⏳ UI dla widoku "Sesja nauki" (zgodnie z ui-plan.md)

### Opcjonalne (Post-MVP):
- Caching layer dla session/stats endpoints
- Rate limiting middleware
- Monitoring i observability
- API versioning

---

## 7. Podsumowanie

**Status**: ✅ `api-plan.md` jest teraz kompletny i spójny z `db-plan.md` oraz `PRD.md`

**Dodane**:
- 2 nowe zasoby (Learning State, Review History)
- 4 nowe endpointy dla sesji nauki
- Kompletna specyfikacja algorytmu SM-2
- 9 podsekcji z uwagami implementacyjnymi

**Zwiększona objętość**: 173 → 585 linii (+412 linii, +238%)

**Gotowość do implementacji**: 
- ✅ Pełna specyfikacja API
- ✅ Szczegółowa logika biznesowa SM-2
- ✅ Walidacje i error handling
- ✅ Wskazówki performance i security
- ✅ Test scenarios

Plan API jest teraz gotowy do implementacji backendu dla sesji nauki (US-008).

