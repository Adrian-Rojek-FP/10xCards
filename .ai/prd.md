# Dokument wymagań produktu (PRD) - 10xCards
## 1. Przegląd produktu
10xCards to webowa aplikacja do szybkiego tworzenia i nauki fiszek z wykorzystaniem prostego algorytmu powtórek. MVP redukuje tarcie przy przygotowywaniu materiału do nauki, umożliwiając generowanie fiszek z dowolnego wklejonego tekstu, ich przegląd, edycję i zapis w zestawach przypisanych do konta użytkownika.

Persona: student uniwersytetu przygotowujący się do kolokwiów/egzaminów, dysponujący ograniczonym czasem, preferujący efektywne, niskotarciowe narzędzia nauki.

Cele MVP:
- Zmniejszyć czas potrzebny na przygotowanie fiszek poprzez generację AI i prosty przegląd/edycję przed zapisem.
- Zapewnić prosty mechanizm uczenia się oparty o istniejący, nieskomplikowany algorytm open‑source (Leitner).
- Zapewnić minimalny, bezpieczny system kont (rejestracja, logowanie) do przechowywania prywatnych zestawów fiszek.

Najważniejsze założenia:
- Fiszka składa się wyłącznie z pól: „Przód” (pytanie) i „Tył” (odpowiedź).
- Tekst wejściowy do generacji: 1000–10 000 znaków; wskaźnik ładowania podczas generacji.
- Zapis zestawu po przeglądzie oznacza akceptację znajdujących się w nim fiszek (nieusuniętych).
- Algorytm powtórek: prosty system Leitnera (5 pudełek) z interakcją „Pokaż odpowiedź” → „Znam / Nie znam”.
- System kont: wyłącznie e‑mail i hasło (brak SSO, brak resetu hasła w MVP).
- Model AI: pluggable; rekomendacja użycia ekonomicznego modelu obsługującego język polski (np. model klasy ekonomicznej w chmurze lub sprawdzona alternatywa open‑source via API). Konkret wybierany wg budżetu.

Definicje:
- Akceptacja fiszki: każda fiszka, która nie została usunięta w fazie przeglądu przed zapisem.
- Źródło fiszki: ai lub manual.

Kluczowe zależności:
- Biblioteka/implementacja algorytmu Leitnera (open‑source).
- Dostawca modelu AI do generacji fiszek.

## 2. Problem użytkownika
Manualne tworzenie fiszek jest czasochłonne i nużące, co zniechęca do stosowania powtórek rozłożonych w czasie. Istniejące narzędzia często wymagają znacznego nakładu początkowego: ręcznego przepisywania notatek, projektowania pytań i odpowiedzi, organizowania w zestawy. Studenci chcą szybko zamienić swoje notatki w materiał do nauki, zachowując kontrolę jakości (szybka korekta) i mieć prosty tryb nauki, który nie wymaga dogłębnej konfiguracji.

## 3. Wymagania funkcjonalne
3.1 Konta i uwierzytelnianie
- Rejestracja konta przy użyciu e‑maila i hasła; weryfikacje: unikalność e‑maila, hasło min. 8 znaków.
- Logowanie i wylogowanie; utrzymanie sesji użytkownika; automatyczne wylogowanie po wygaśnięciu sesji.
- Autoryzacja: użytkownik ma dostęp wyłącznie do własnych zestawów i fiszek.
- Brak resetu hasła i SSO w MVP.

3.2 Zestawy i fiszki
- Struktura fiszki: pola przód/tył; metadane minimalne: id, deckId, ownerId, source (ai/manual), createdAt, updatedAt.
- Struktura zestawu (deck): id, name, ownerId, counts (opcjonalnie), createdAt, updatedAt.
- Tworzenie manualne: dodanie pojedynczej fiszki do nowego lub istniejącego zestawu.
- Edycja i usuwanie fiszek w zapisanym zestawie.
- Nazewnictwo zestawu wymagane przy zapisie; walidacja unikalności nazwy w obrębie użytkownika nie jest wymagana w MVP.
- Potwierdzenie usunięcia całego zestawu przed operacją.

3.3 Generator fiszek AI
- Wejście: pole tekstowe przyjmujące 1000–10 000 znaków; walidacja klient/serwer; informacja o liczbie znaków.
- Akcja generacji: po wysłaniu tekstu wyświetla się wskaźnik ładowania; po sukcesie pojawia się lista wygenerowanych fiszek.
- Przegląd przed zapisem: użytkownik może edytować treść przodu/tyłu każdej fiszki lub ją usunąć; po zapisie fiszki są przypisane do nowego zestawu.
- Obsługa błędów: informacja o niepowodzeniu generacji oraz możliwość ponowienia próby bez utraty wprowadzonego tekstu.

3.4 Zapis i akceptacja
- Zapis zestawu jest równoznaczny z akceptacją wszystkich pozostałych (nieusuniętych) fiszek.
- Zestaw wymaga nazwy nadanej przez użytkownika w momencie zapisu.
- System rejestruje źródło każdej fiszki (ai/manual) do raportowania metryk.

3.5 Nauka (algorytm powtórek)
- Algorytm: system Leitnera (5 pudełek). Start każdej fiszki w pudełku 1.
- Interakcja w sesji: Pokaż odpowiedź → użytkownik wybiera Znam lub Nie znam.
- Aktualizacja stanu: Znam przenosi fiszkę do kolejnego pudełka; Nie znam cofa do pudełka 1.
- Planowanie: do nauki wybierane są fiszki, których termin jest wymagalny (na potrzeby MVP: pudełko 1 codziennie, 2 co 2 dni, 3 co 4 dni, 4 co 7 dni, 5 co 14 dni; uproszczone okna czasowe). Termin aktualizowany po interakcji.
- Zakończenie sesji: komunikat o braku fiszek wymagających nauki; możliwość powrotu do listy zestawów.

3.6 Telemetria i metryki
- Rejestrowane zdarzenia: generation.started, generation.succeeded {generatedCount}, generation.failed; review.cardEdited, review.cardDeleted; deck.saved {savedCount}; card.created {source}; study.answer {known:boolean, deckId, cardId, box}.
- Przechowywanie prostej agregacji wskaźników w raportach wewnętrznych (nie w UI).

3.7 Walidacje i limity
- Długość wejścia do generacji: min 1000, max 10 000 znaków.
- Długość pól fiszki: sugerowane ograniczenia techniczne, np. przód ≤ 200 znaków, tył ≤ 600 znaków (walidacje miękkie – komunikaty ostrzegawcze zamiast twardego blokowania, jeśli to możliwe).
- Nazwa zestawu: 1–80 znaków.

3.8 Stany i błędy
- Puste stany: brak zestawów, brak fiszek do nauki, brak wyników generacji.
- Komunikaty błędów: generacja nieudana, zbyt krótki/długi tekst, błąd sieci, brak uprawnień.
- Wskaźnik ładowania podczas generacji AI oraz krótkie spinnery przy zapisie i rozpoczęciu sesji nauki.

## 4. Granice produktu
- Brak własnego, zaawansowanego algorytmu powtórek (wyłącznie prosty Leitner).
- Brak importu z wielu formatów (PDF, DOCX, itp.); wyłącznie wklejony tekst.
- Brak współdzielenia zestawów między użytkownikami.
- Brak integracji z zewnętrznymi platformami edukacyjnymi.
- Brak aplikacji mobilnych; tylko web (desktop/mobile web responsywnie, bez PWA/offline).
- Brak samouczka/onboardingu w MVP.
- Brak resetu hasła i SSO.
- Brak moderacji treści i zaawansowanych polityk bezpieczeństwa treści (poza podstawowymi limitami i komunikatami błędów).

## 5. Historyjki użytkowników
US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik chcę zarejestrować się przy użyciu e‑maila i hasła, aby móc tworzyć prywatne zestawy fiszek.
Kryteria akceptacji:
- Formularz akceptuje e‑mail i hasło (min. 8 znaków); walidacje klient/serwer.
- Po sukcesie konto zostaje utworzone i użytkownik jest zalogowany lub przekierowany do logowania.
- Próba rejestracji istniejącego e‑maila zwraca czytelny komunikat.

US-002
Tytuł: Logowanie
Opis: Jako użytkownik chcę zalogować się przy użyciu e‑maila i hasła, aby uzyskać dostęp do moich zestawów.
Kryteria akceptacji:
- Poprawne dane logują użytkownika i prowadzą do strony listy zestawów.
- Błędne dane wyświetlają komunikat bez ujawniania, czy e‑mail istnieje.
- Sesja jest utrzymywana między przeładowaniami do czasu wylogowania/wygaśnięcia.

US-003
Tytuł: Wylogowanie
Opis: Jako użytkownik chcę się wylogować, aby zakończyć sesję na współdzielonym urządzeniu.
Kryteria akceptacji:
- Po wylogowaniu przekierowanie do ekranu logowania.
- Zasoby wymagające autoryzacji są niedostępne po wylogowaniu.

US-004
Tytuł: Dostęp wyłącznie do własnych danych
Opis: Jako użytkownik chcę, aby moje fiszki i zestawy były prywatne.
Kryteria akceptacji:
- Próba dostępu do zasobów innego użytkownika zwraca błąd 403 i nie ujawnia danych.
- Zapytania listujące zwracają wyłącznie zasoby zalogowanego użytkownika.

US-005
Tytuł: Walidacja długości tekstu do generacji
Opis: Jako użytkownik chcę wiedzieć, czy tekst spełnia limity 1000–10 000 znaków.
Kryteria akceptacji:
- Licznik znaków widoczny przy polu tekstowym.
- Próba wysłania zbyt krótkiego/długiego tekstu blokowana z komunikatem.

US-006
Tytuł: Generowanie fiszek z tekstu
Opis: Jako użytkownik chcę wygenerować fiszki z wklejonego tekstu, aby przyspieszyć przygotowanie materiału.
Kryteria akceptacji:
- Po wysłaniu poprawnego tekstu pojawia się wskaźnik ładowania do czasu zakończenia.
- Po sukcesie wyświetla się lista wygenerowanych fiszek (min. 1).
- W przypadku błędu wyświetla się komunikat i opcja ponów.

US-007
Tytuł: Przegląd wygenerowanych fiszek
Opis: Jako użytkownik chcę przejrzeć wszystkie wygenerowane fiszki przed zapisem.
Kryteria akceptacji:
- Lista prezentuje przód/tył każdej fiszki.
- Można przejść do edycji lub usunięcia poszczególnych pozycji.

US-008
Tytuł: Edycja fiszki w przeglądzie
Opis: Jako użytkownik chcę poprawić treść przodu/tyłu przed zapisem.
Kryteria akceptacji:
- Edycja w miejscu lub w modalu zapisuje zmiany lokalnie przed finalnym zapisem zestawu.
- Walidacje długości pól są stosowane.

US-009
Tytuł: Usuwanie fiszki w przeglądzie
Opis: Jako użytkownik chcę usunąć niepasujące fiszki przed zapisem.
Kryteria akceptacji:
- Usunięta fiszka znika z listy przeglądu.
- Licznik pozostałych pozycji aktualizuje się.

US-010
Tytuł: Zapis zestawu i nadanie nazwy
Opis: Jako użytkownik chcę zapisać zaakceptowane fiszki jako nowy zestaw z nazwą.
Kryteria akceptacji:
- Nazwa zestawu jest wymagana; przy braku nazwy komunikat.
- Po zapisie zestaw jest widoczny na liście zestawów użytkownika.
- Wszystkie pozostałe fiszki w przeglądzie są oznaczone jako zaakceptowane i zapisane z source=ai.

US-011
Tytuł: Tworzenie fiszki manualnie
Opis: Jako użytkownik chcę dodać pojedynczą fiszkę do wybranego zestawu.
Kryteria akceptacji:
- Formularz przód/tył pozwala zapisać fiszkę w istniejącym lub nowym zestawie.
- Zapisana fiszka ma source=manual.

US-012
Tytuł: Edycja i usuwanie fiszek po zapisie
Opis: Jako użytkownik chcę móc poprawiać lub usuwać fiszki w zapisanym zestawie.
Kryteria akceptacji:
- Edycja aktualizuje treść; usunięcie usuwa fiszkę z zestawu.
- Zmiany są widoczne przy kolejnym otwarciu zestawu i w sesjach nauki.

US-013
Tytuł: Lista moich zestawów
Opis: Jako użytkownik chcę przeglądać swoje zestawy.
Kryteria akceptacji:
- Widok listy wyświetla nazwy zestawów i podstawowe informacje (liczba fiszek).
- Kliknięcie pozycji prowadzi do szczegółów zestawu.

US-014
Tytuł: Szczegóły zestawu
Opis: Jako użytkownik chcę zobaczyć fiszki w wybranym zestawie.
Kryteria akceptacji:
- Widok prezentuje listę fiszek z opcjami edycji/usuwania.
- Przycisk rozpoczęcia sesji nauki jest dostępny.

US-015
Tytuł: Zmiana nazwy zestawu
Opis: Jako użytkownik chcę zmienić nazwę istniejącego zestawu.
Kryteria akceptacji:
- Edycja nazwy zapisywana jest po potwierdzeniu.
- Nowa nazwa widoczna na liście zestawów i w szczegółach.

US-016
Tytuł: Usunięcie zestawu z potwierdzeniem
Opis: Jako użytkownik chcę bezpiecznie usunąć cały zestaw.
Kryteria akceptacji:
- Przed usunięciem wymagane jest potwierdzenie (modal/okno).
- Po usunięciu zestaw znika z listy, a fiszki nie są dostępne w nauce.

US-017
Tytuł: Rozpoczęcie sesji nauki
Opis: Jako użytkownik chcę rozpocząć naukę z wybranym zestawem.
Kryteria akceptacji:
- System wybiera fiszki wymagalne wg harmonogramu Leitnera.
- Po braku wymagalnych fiszek wyświetlany jest komunikat o zakończeniu sesji.

US-018
Tytuł: Pokaż odpowiedź i ocenienie
Opis: Jako użytkownik chcę najpierw spróbować odpowiedzieć, a potem sprawdzić i ocenić.
Kryteria akceptacji:
- Widok prezentuje pytanie (przód) oraz przycisk Pokaż odpowiedź.
- Po odkryciu odpowiedzi dostępne są przyciski Znam i Nie znam.

US-019
Tytuł: Aktualizacja Leitnera po ocenie
Opis: Jako użytkownik oczekuję aktualizacji planu nauki po mojej ocenie.
Kryteria akceptacji:
- Znam przenosi fiszkę do następnego pudełka i wyznacza nowy termin.
- Nie znam przenosi fiszkę do pudełka 1 i ustawia najbliższy termin.

US-020
Tytuł: Obsługa błędu generacji AI
Opis: Jako użytkownik chcę czytelny komunikat i możliwość ponowienia.
Kryteria akceptacji:
- W razie błędu pojawia się komunikat bez utraty wklejonego tekstu.
- Dostępny jest przycisk ponów; kolejne próby są możliwe.

US-021
Tytuł: Telemetria akceptacji fiszek AI
Opis: Jako właściciel produktu chcę mierzyć odsetek akceptacji.
Kryteria akceptacji:
- Zdarzenia zliczają liczbę wygenerowanych oraz zapisanych fiszek per sesja.
- Raport pozwala obliczyć stosunek zapisanych do wygenerowanych.

US-022
Tytuł: Oznaczenie źródła fiszek
Opis: Jako właściciel produktu chcę wiedzieć, jaki odsetek fiszek pochodzi z AI.
Kryteria akceptacji:
- Każda fiszka ma source=ai lub source=manual.
- Raport pozwala obliczyć udział fiszek AI w całości tworzonych fiszek.

US-023
Tytuł: Wygaśnięcie sesji i ponowne logowanie
Opis: Jako użytkownik chcę zostać poproszony o ponowne logowanie po wygaśnięciu sesji.
Kryteria akceptacji:
- Próba działania wymagającego autoryzacji po wygaśnięciu sesji przekierowuje do logowania.
- Po ponownym zalogowaniu kontynuuję pracę bez utraty danych lokalnych (np. wklejonego tekstu).

US-024
Tytuł: Zakończenie sesji nauki i puste stany
Opis: Jako użytkownik chcę jasny komunikat, gdy nie ma fiszek do nauki.
Kryteria akceptacji:
- Komunikat o braku fiszek oraz przycisk powrotu do listy zestawów.
- Brak błędów przy pustych zestawach.

## 6. Metryki sukcesu
Kryterium 1: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika.
- Definicja: odsetek = liczba fiszek zapisanych w zestawie / liczba fiszek pierwotnie wygenerowanych w danej sesji przeglądu.
- Instrumentacja: generation.succeeded {generatedCount}, deck.saved {savedCount}; agregacja do dziennego/tygodniowego raportu.
- Cel: co najmniej 75% w oknie 14 dni po wdrożeniu.

Kryterium 2: Użytkownicy tworzą 75% fiszek z wykorzystaniem AI.
- Definicja: odsetek = liczba fiszek z source=ai / liczba wszystkich nowych fiszek (ai + manual) w danym okresie.
- Instrumentacja: card.created {source} na zapisie/przeglądzie i przy manualnym tworzeniu.
- Cel: co najmniej 75% w pierwszym miesiącu użycia przez grupę docelową.

Wskaźniki pomocnicze (operacyjne):
- Czas do pierwszego zestawu od rejestracji (<10 min mediany).
- Średnia liczba fiszek na zestaw (cel: 10–30 w generacji AI).
- Odsetek nieudanych generacji (<5%).

