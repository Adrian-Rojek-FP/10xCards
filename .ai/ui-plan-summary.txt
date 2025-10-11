<conversation_summary>
<decisions>
1. Widok "Moje fiszki" będzie domyślnie przedstawiał jedną, chronologiczną listę fiszek (od najnowszych), z opcjonalnymi przyciskami do filtrowania (`Wszystkie`, `Ręczne`, `AI`).
2. W widoku "Sesja nauki" do oceny fiszek zostaną użyte proste przyciski, takie jak "Powtórz", "Trudne" i "Dobrze", dostosowane do zewnętrznego algorytmu powtórek.
3. MVP nie będzie zawierać operacji masowych (np. jednoczesnego usuwania) w widoku "Moje fiszki".
4. Podczas generowania fiszek przez AI, interfejs użytkownika zablokuje formularz i przycisk, wyświetlając wskaźnik ładowania (spinner).
5. Formularze logowania i rejestracji zostaną zaimplementowane jako jedna strona z zakładkami lub przełącznikiem.
6. Walidacja długości tekstu źródłowego (1000-10000 znaków) będzie realizowana po stronie klienta z licznikiem znaków i komunikatem błędu w czasie rzeczywistym.
</decisions>
<matched_recommendations>
1. Główna nawigacja dla zalogowanych użytkowników będzie oparta o stały boczny pasek (sidebar) z linkami do "Generuj", "Moje fiszki" i "Sesja nauki".
2. Po pomyślnym zapisaniu wygenerowanych fiszek, użytkownik zostanie przekierowany do widoku "Moje fiszki" z komunikatem potwierdzającym.
3. Na urządzeniach mobilnych interfejs propozycji fiszek będzie używał kart z ikonami do akceptacji/odrzucenia oraz modala do edycji.
4. Aplikacja zaimplementuje mechanizm cichego odświeżania tokenu autoryzacyjnego, a w razie niepowodzenia przekieruje użytkownika na stronę logowania.
5. Zarządzanie stanem w MVP będzie oparte na wbudowanych narzędziach React (`useState`, `useContext`), bez zewnętrznych bibliotek.
6. Błędy API będą komunikowane za pomocą powiadomień typu "toast", z dodatkowym wyróżnieniem pól formularza przy błędach walidacji.
7. Ręczne dodawanie nowej fiszki będzie odbywać się poprzez formularz w modalu, otwierany z widoku "Moje fiszki".
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie przeprowadzonych analiz i dyskusji, architektura UI dla MVP aplikacji 10x-cards została zaplanowana w następujący sposób:

a. Główne wymagania dotyczące architektury UI:
Architektura będzie oparta na frameworku Astro dla statycznych widoków i React dla komponentów interaktywnych. Stylizacja zostanie zrealizowana za pomocą Tailwind CSS, a biblioteka komponentów Shadcn/ui posłuży jako fundament dla spójnego i dostępnego interfejsu. Priorytetem jest stworzenie prostego, intuicyjnego i responsywnego doświadczenia użytkownika.

b. Kluczowe widoki, ekrany i przepływy użytkownika:
- **Nawigacja**: Zalogowani użytkownicy będą korzystać z bocznego paska nawigacyjnego (sidebar) do poruszania się między głównymi sekcjami.
- **Uwierzytelnianie**: Logowanie i rejestracja będą dostępne na jednej stronie z przełącznikiem między formularzami. Po pomyślnym zalogowaniu użytkownik jest przekierowywany do widoku generowania fiszek.
- **Widok Generowania**: Centralny punkt aplikacji. Użytkownik wkleja tekst, a po kliknięciu "Generuj" (z obsługą stanu ładowania) otrzymuje listę propozycji fiszek. Może je akceptować, odrzucać lub edytować. Po zapisaniu następuje przekierowanie do "Moich fiszek".
- **Widok "Moje fiszki"**: Wyświetla listę wszystkich zapisanych fiszek w porządku chronologicznym, z opcją filtrowania. Umożliwia ręczne dodawanie (przez modal), edycję i usuwanie pojedynczych fiszek.
- **Widok "Sesja nauki"**: Interfejs do nauki z wykorzystaniem zewnętrznego algorytmu, gdzie użytkownik odsłania odpowiedzi i ocenia swoją wiedzę za pomocą prostych przycisków.

c. Strategia integracji z API i zarządzania stanem:
- **Zarządzanie stanem**: MVP będzie polegać na wbudowanych hookach React (`useState`, `useContext`) do zarządzania lokalnym i współdzielonym stanem (np. stanem propozycji fiszek przed zapisem).
- **Komunikacja z API**: Wszystkie zapytania do API będą obsługiwane z uwzględnieniem stanów ładowania (np. blokowanie UI i wyświetlanie spinnerów).
- **Obsługa błędów**: Błędy API będą komunikowane za pomocą powiadomień "toast". Błędy walidacji (400) dodatkowo wskażą problematyczne pola, a błędy serwera (500) wyświetlą ogólny komunikat.

d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa:
- **Responsywność**: Interfejs będzie w pełni responsywny, ze szczególnym uwzględnieniem widoków generowania i przeglądania fiszek na urządzeniach mobilnych (karty + modale).
- **Dostępność**: Komponenty z biblioteki Shadcn/ui oraz stosowanie semantycznego HTML mają zapewnić wysoki poziom dostępności (zgodność z WCAG AA).
- **Bezpieczeństwo**: Aplikacja wdroży mechanizm cichego odświeżania tokenów JWT (Supabase), aby zapewnić ciągłość sesji. W przypadku ostatecznego wygaśnięcia sesji, użytkownik zostanie bezpiecznie przekierowany do strony logowania.

e. Wszelkie nierozwiązane kwestie lub obszary wymagające dalszego wyjaśnienia:
Użytkownik podjął decyzję o nieimplementowaniu na tym etapie zaawansowanego mechanizmu buforowania po stronie klienta (np. za pomocą `TanStack Query`). Jest to świadoma decyzja techniczna na rzecz uproszczenia MVP, a nie nierozwiązany problem. Kwestia ta może zostać ponownie rozważona w przyszłych iteracjach produktu w celu dalszej optymalizacji wydajności.
</ui_architecture_planning_summary>
<unresolved_issues>
Na obecnym etapie planowania architektury UI dla MVP nie zidentyfikowano żadnych nierozwiązanych kwestii blokujących dalsze prace. Wszystkie postawione pytania zostały wyjaśnione, a rekomendacje zaakceptowane.
</unresolved_issues>
</conversation_summary>
