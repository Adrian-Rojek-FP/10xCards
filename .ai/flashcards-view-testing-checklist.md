# Checklist testowania widoku "Moje Fiszki"

## Przed rozpoczęciem testów
- [ ] Uruchomiony serwer deweloperski (`npm run dev`)
- [ ] Użytkownik jest zalogowany
- [ ] Otwórz stronę `/flashcards` w przeglądarce

## 1. Test początkowego ładowania strony

### Scenariusz 1.1: Pierwsza wizyta (brak fiszek)
- [ ] Strona ładuje się poprawnie
- [ ] Wyświetla się nagłówek "Moje Fiszki"
- [ ] Wyświetla się przycisk "Dodaj fiszkę"
- [ ] Wyświetla się komunikat: "Nie masz jeszcze żadnych fiszek. Stwórz pierwszą!"
- [ ] Brak komponentu paginacji
- [ ] Header zawiera link "Moje fiszki"

### Scenariusz 1.2: Użytkownik z istniejącymi fiszkami
- [ ] Strona ładuje się poprawnie
- [ ] Wyświetla się lista fiszek w siatce (1/2/3 kolumny w zależności od szerokości ekranu)
- [ ] Każda fiszka pokazuje przód i tył
- [ ] Każda fiszka ma etykietę źródła (AI, AI edytowana, Ręcznie)
- [ ] Każda fiszka pokazuje datę utworzenia
- [ ] Wyświetla się licznik: "Łącznie: X fiszek"
- [ ] Przyciski "Edytuj" i "Usuń" są widoczne na każdej fiszce

## 2. Test dodawania nowej fiszki

### Scenariusz 2.1: Otwieranie modalu
- [ ] Kliknięcie przycisku "Dodaj fiszkę" otwiera modal
- [ ] Modal ma tytuł "Dodaj nową fiszkę"
- [ ] Formularz zawiera dwa pola textarea: "Przód fiszki" i "Tył fiszki"
- [ ] Oba pola są wymagane (oznaczone gwiazdką)
- [ ] Liczniki znaków pokazują "0/200" i "0/500"
- [ ] Przycisk "Utwórz fiszkę" jest dezaktywowany

### Scenariusz 2.2: Walidacja formularza
- [ ] Wpisanie tekstu w polu "Przód" aktualizuje licznik znaków
- [ ] Wpisanie tekstu w polu "Tył" aktualizuje licznik znaków
- [ ] Po wpisaniu 201 znaków w pole "Przód", licznik staje się czerwony i pokazuje błąd
- [ ] Po wpisaniu 501 znaków w pole "Tył", licznik staje się czerwony i pokazuje błąd
- [ ] Przycisk "Utwórz fiszkę" jest aktywny tylko gdy oba pola są poprawne

### Scenariusz 2.3: Pomyślne dodanie fiszki
- [ ] Wypełnienie obu pól poprawnymi danymi
- [ ] Kliknięcie "Utwórz fiszkę"
- [ ] Przycisk zmienia się na "Zapisywanie..."
- [ ] Modal zamyka się po pomyślnym zapisaniu
- [ ] Nowa fiszka pojawia się na liście
- [ ] Fiszka ma źródło "Ręcznie"
- [ ] Lista odświeża się automatycznie

### Scenariusz 2.4: Anulowanie dodawania
- [ ] Wpisanie danych w formularz
- [ ] Kliknięcie "Anuluj"
- [ ] Modal zamyka się
- [ ] Dane nie zostają zapisane
- [ ] Lista nie zmienia się

### Scenariusz 2.5: Obsługa błędów API
- [ ] (Symulować błąd serwera)
- [ ] Wyświetla się komunikat o błędzie w modalu
- [ ] Modal pozostaje otwarty
- [ ] Użytkownik może spróbować ponownie

## 3. Test edycji fiszki

### Scenariusz 3.1: Otwieranie modalu edycji
- [ ] Kliknięcie przycisku "Edytuj" na fiszce
- [ ] Modal otwiera się z tytułem "Edytuj fiszkę"
- [ ] Pola są wypełnione aktualnymi danymi fiszki
- [ ] Liczniki znaków pokazują prawidłowe wartości
- [ ] Przycisk ma tekst "Zapisz zmiany"

### Scenariusz 3.2: Edycja bez zmian
- [ ] Otwarcie modalu edycji
- [ ] Kliknięcie "Zapisz zmiany" bez wprowadzania zmian
- [ ] Modal zamyka się
- [ ] Nie wysyłane są żadne żądania do API (lub wysyłane tylko zmienione pola)

### Scenariusz 3.3: Pomyślna edycja
- [ ] Zmiana tekstu w polu "Przód"
- [ ] Zmiana tekstu w polu "Tył"
- [ ] Kliknięcie "Zapisz zmiany"
- [ ] Przycisk zmienia się na "Zapisywanie..."
- [ ] Modal zamyka się
- [ ] Zaktualizowana fiszka wyświetla nowe dane
- [ ] Data "Zaktualizowano" jest widoczna i aktualna

### Scenariusz 3.4: Walidacja podczas edycji
- [ ] Usunięcie całej treści z pola "Przód"
- [ ] Przycisk "Zapisz zmiany" staje się nieaktywny
- [ ] Wpisanie 201 znaków pokazuje błąd walidacji
- [ ] Przywrócenie poprawnych danych aktywuje przycisk

## 4. Test usuwania fiszki

### Scenariusz 4.1: Otwieranie dialogu potwierdzenia
- [ ] Kliknięcie przycisku "Usuń" na fiszce
- [ ] Otwiera się AlertDialog z tytułem "Czy na pewno chcesz usunąć tę fiszkę?"
- [ ] Wyświetla się ostrzeżenie o nieodwracalności operacji
- [ ] Dostępne przyciski "Anuluj" i "Usuń fiszkę" (czerwony)

### Scenariusz 4.2: Anulowanie usuwania
- [ ] Kliknięcie "Anuluj"
- [ ] Dialog zamyka się
- [ ] Fiszka pozostaje na liście

### Scenariusz 4.3: Pomyślne usunięcie
- [ ] Kliknięcie "Usuń fiszkę"
- [ ] Przycisk zmienia się na "Usuwanie..."
- [ ] Dialog zamyka się
- [ ] Fiszka znika z listy
- [ ] Licznik fiszek aktualizuje się
- [ ] Lista odświeża się automatycznie

### Scenariusz 4.4: Usunięcie ostatniej fiszki na stronie
- [ ] Jeśli była to ostatnia fiszka na stronie, a są inne strony
- [ ] Użytkownik zostaje przeniesiony na poprzednią stronę
- [ ] Lub wyświetla się komunikat o braku fiszek (jeśli była to ostatnia fiszka)

## 5. Test paginacji

### Scenariusz 5.1: Podstawowa nawigacja
- [ ] (Wymaga >12 fiszek) Wyświetla się komponent paginacji
- [ ] Pokazuje aktualną stronę i łączną liczbę stron
- [ ] Przycisk "Poprzednia" jest dezaktywowany na pierwszej stronie
- [ ] Przycisk "Następna" jest aktywny gdy są kolejne strony

### Scenariusz 5.2: Przechodzenie między stronami
- [ ] Kliknięcie "Następna" ładuje następną stronę
- [ ] Lista fiszek zmienia się
- [ ] URL nie zmienia się (client-side pagination)
- [ ] Licznik strony aktualizuje się
- [ ] Kliknięcie "Poprzednia" wraca do poprzedniej strony

### Scenariusz 5.3: Numery stron
- [ ] (Wymaga >7 stron) Wyświetlają się elipsy "..." gdy jest wiele stron
- [ ] Kliknięcie numeru strony przenosi na tę stronę
- [ ] Aktualna strona jest podświetlona
- [ ] Przyciski "Pierwsza strona" i "Ostatnia strona" działają poprawnie

### Scenariusz 5.4: Paginacja nie wyświetla się
- [ ] Gdy liczba fiszek <= 12, paginacja jest ukryta

## 6. Test responsywności

### Scenariusz 6.1: Desktop (>1024px)
- [ ] Siatka fiszek ma 3 kolumny
- [ ] Wszystkie przyciski nawigacji paginacji są widoczne
- [ ] Header pokazuje wszystkie linki nawigacyjne

### Scenariusz 6.2: Tablet (768px - 1024px)
- [ ] Siatka fiszek ma 2 kolumny
- [ ] Przyciski "Pierwsza"/"Ostatnia" w paginacji mogą być ukryte
- [ ] Nagłówek strony przechodzi w układ kolumnowy

### Scenariusz 6.3: Mobile (<768px)
- [ ] Siatka fiszek ma 1 kolumnę
- [ ] Nagłówek strony w układzie kolumnowym
- [ ] Przycisk "Dodaj fiszkę" rozciąga się na pełną szerokość
- [ ] Modale zajmują całą szerokość ekranu

## 7. Test obsługi błędów

### Scenariusz 7.1: Błąd ładowania fiszek
- [ ] (Symulować błąd API przy ładowaniu)
- [ ] Wyświetla się komunikat błędu z ikoną ostrzegawczą
- [ ] Tekst: "Nie udało się załadować fiszek. Spróbuj ponownie później."
- [ ] Szczegóły błędu są widoczne dla debugowania

### Scenariusz 7.2: Błąd autoryzacji (401)
- [ ] (Symulować wygaśnięcie sesji)
- [ ] Użytkownik zostaje przekierowany na stronę logowania
- [ ] Następuje automatyczne przekierowanie

### Scenariusz 7.3: Błąd sieci
- [ ] (Wyłączyć połączenie internetowe)
- [ ] Wyświetla się odpowiedni komunikat o błędzie
- [ ] Użytkownik może odświeżyć stronę po przywróceniu połączenia

## 8. Test dostępności (Accessibility)

### Scenariusz 8.1: Nawigacja klawiaturą
- [ ] Możliwość nawigacji Tab przez wszystkie interaktywne elementy
- [ ] Widoczny focus outline
- [ ] Możliwość otwarcia modali klawiszem Enter
- [ ] Możliwość zamknięcia modali klawiszem Escape

### Scenariusz 8.2: ARIA labels
- [ ] Przyciski paginacji mają aria-label
- [ ] Pola formularza mają aria-describedby dla błędów
- [ ] Alert dialog ma odpowiednie role
- [ ] Spinner ma role="status" i tekst dla czytników ekranu

### Scenariusz 8.3: Kontrast i czytelność
- [ ] Wszystkie teksty są czytelne
- [ ] Kontrast kolorów spełnia standardy WCAG
- [ ] Komunikaty błędów są wyraźnie oznaczone kolorem i ikoną

## 9. Test stanów ładowania

### Scenariusz 9.1: Początkowe ładowanie
- [ ] Wyświetla się spinner z tekstem "Ładowanie fiszek..."
- [ ] Po załadowaniu spinner znika i pojawia się lista

### Scenariusz 9.2: Ładowanie podczas operacji
- [ ] Podczas dodawania/edycji przyciski pokazują "Zapisywanie..."
- [ ] Podczas usuwania przycisk pokazuje "Usuwanie..."
- [ ] Przyciski są dezaktywowane podczas operacji
- [ ] Nie można zamknąć modali podczas zapisywania

## 10. Test dark mode

### Scenariusz 10.1: Przełączanie motywów
- [ ] Przełączenie na dark mode w headerze
- [ ] Wszystkie komponenty poprawnie wyświetlają się w dark mode
- [ ] Karty fiszek mają odpowiedni kontrast
- [ ] Modale wyświetlają się poprawnie
- [ ] Przyciski zachowują czytelność

---

## Podsumowanie testów

**Data testów**: _______________

**Tester**: _______________

**Liczba przeprowadzonych testów**: _____ / 80+

**Liczba wykrytych błędów**: _____

**Krytyczne błędy do naprawy**:
- 
- 

**Uwagi dodatkowe**:
- 
- 

