# Widok "Moje Fiszki" - Szybki Start

## Jak uruchomić

1. **Uruchom serwer deweloperski**:
   ```bash
   npm run dev
   ```

2. **Zaloguj się** jako użytkownik (lub utwórz nowe konto)

3. **Przejdź do widoku**:
   - Kliknij "Moje fiszki" w nawigacji
   - Lub wejdź bezpośrednio na: `http://localhost:4321/flashcards`

---

## Podstawowe operacje

### ➕ Dodawanie fiszki
1. Kliknij przycisk **"Dodaj fiszkę"**
2. Wypełnij pole **"Przód fiszki"** (max 200 znaków)
3. Wypełnij pole **"Tył fiszki"** (max 500 znaków)
4. Kliknij **"Utwórz fiszkę"**

### ✏️ Edycja fiszki
1. Znajdź fiszkę na liście
2. Kliknij przycisk **"Edytuj"**
3. Zmień treść przodu lub tyłu
4. Kliknij **"Zapisz zmiany"**

### 🗑️ Usuwanie fiszki
1. Znajdź fiszkę na liście
2. Kliknij przycisk **"Usuń"**
3. Potwierdź operację klikając **"Usuń fiszkę"**

### 📄 Paginacja
- Użyj przycisków **"Poprzednia"** i **"Następna"** do nawigacji
- Kliknij konkretny numer strony
- Użyj przycisków **"Pierwsza"** i **"Ostatnia"** (desktop)

---

## Kluczowe funkcje

✅ **Real-time walidacja** - natychmiastowy feedback podczas wypełniania formularzy

✅ **Responsywny design** - działa na desktop, tablet i mobile

✅ **Dark mode** - automatyczne dostosowanie do preferencji systemowych

✅ **Dostępność** - pełna obsługa klawiatury i czytników ekranu

✅ **Auto-refresh** - lista odświeża się automatycznie po każdej operacji

---

## Struktura plików

```
src/
├── pages/
│   └── flashcards.astro              # Strona główna widoku
├── components/
│   ├── flashcards/
│   │   ├── FlashcardsView.tsx        # Główny komponent
│   │   ├── FlashcardList.tsx         # Lista fiszek
│   │   ├── FlashcardListItem.tsx     # Pojedyncza fiszka
│   │   ├── FlashcardFormModal.tsx    # Modal do dodawania/edycji
│   │   ├── DeleteConfirmationDialog.tsx  # Dialog potwierdzenia
│   │   └── PaginationControls.tsx    # Kontrolki paginacji
│   ├── hooks/
│   │   └── useFlashcards.ts          # Hook do zarządzania stanem
│   └── Header.tsx                    # (zaktualizowany)
├── middleware/
│   └── index.ts                      # (zaktualizowany - ochrona trasy)
└── types.ts                          # (zaktualizowany - FlashcardViewModel)
```

---

## API Endpoints

Widok komunikuje się z następującymi endpointami:

- `GET /api/flashcards` - pobieranie listy z paginacją
- `POST /api/flashcards` - tworzenie nowych fiszek
- `PUT /api/flashcards/{id}` - aktualizacja fiszki
- `DELETE /api/flashcards/{id}` - usuwanie fiszki

---

## Testowanie

### Manualne testy
Wykorzystaj checklistę: `.ai/flashcards-view-testing-checklist.md`

### TypeScript check
```bash
npx tsc --noEmit --skipLibCheck
```

### Linter
```bash
npm run lint
```

---

## Rozwiązywanie problemów

### Problem: Strona pokazuje "Unauthorized"
**Rozwiązanie**: Zaloguj się ponownie - sesja mogła wygasnąć

### Problem: Fiszki się nie ładują
**Rozwiązanie**: 
1. Sprawdź konsolę przeglądarki (F12)
2. Sprawdź czy backend jest uruchomiony
3. Sprawdź połączenie z bazą danych (Supabase)

### Problem: Błąd walidacji podczas zapisywania
**Rozwiązanie**: 
- Przód: musi mieć 1-200 znaków
- Tył: musi mieć 1-500 znaków

### Problem: Nie widzę przycisku "Dodaj fiszkę"
**Rozwiązanie**: Sprawdź czy jesteś zalogowany i czy middleware działa poprawnie

---

## Znane ograniczenia

- Brak sortowania fiszek (tylko chronologicznie)
- Brak filtrowania po źródle
- Brak wyszukiwania
- Limit 12 fiszek na stronę (stałe)

---

## Kontakt i wsparcie

W razie problemów:
1. Sprawdź plik `.ai/flashcards-view-implementation-summary.md`
2. Przejrzyj checklistę testową
3. Sprawdź logi w konsoli przeglądarki i terminalu

---

**Wersja**: 1.0.0  
**Data**: 18 października 2025  
**Status**: ✅ Gotowe do testowania

