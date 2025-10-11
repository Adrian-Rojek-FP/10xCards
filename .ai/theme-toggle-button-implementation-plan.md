# Plan implementacji widoku: Przycisk Zmiany Motywu

## 1. Przegląd
Celem jest implementacja komponentu pozwalającego użytkownikowi na przełączanie motywu interfejsu użytkownika pomiędzy trybem jasnym (light) a ciemnym (dark). Wybór użytkownika będzie zapamiętywany w `localStorage`, a domyślnym motywem aplikacji jest tryb ciemny. Implementacja zostanie oparta o standardowe mechanizmy `shadcn/ui` i Tailwind CSS.

## 2. Routing widoku
Komponent nie będzie osobnym widokiem (stroną), lecz globalnym elementem UI. Zostanie umieszczony w głównym layoucie aplikacji (`src/layouts/Layout.astro`), aby był dostępny na każdej podstronie.

## 3. Struktura komponentów
Implementacja będzie wymagała stworzenia dwóch głównych komponentów React oraz modyfikacji głównego layoutu Astro.

```
src/layouts/Layout.astro
└── ThemeProvider (nowy komponent React)
    └── ... (reszta aplikacji renderowana przez <slot />)
        └── Header / Navbar (istniejący lub nowy komponent)
            └── ThemeToggleButton (nowy komponent React)
```

1.  **`ThemeProvider.tsx`**: Komponent typu "provider" oparty na React Context, który będzie zarządzał stanem motywu.
2.  **`ThemeToggleButton.tsx`**: Komponent przycisku, który będzie konsumował kontekst z `ThemeProvider` i umożliwiał zmianę motywu.

## 4. Szczegóły komponentów
### `ThemeProvider.tsx`
- **Opis komponentu**: Komponent-wrapper, który dostarcza kontekst (aktualny motyw i funkcję do jego zmiany) do wszystkich komponentów potomnych. Odpowiada za odczyt i zapis preferencji motywu w `localStorage` oraz za dodawanie/usuwanie klasy `.dark` do elementu `<html>`.
- **Główne elementy**: Komponent będzie wykorzystywał `React.createContext` do stworzenia kontekstu i `React.Provider` do jego udostępnienia. Nie będzie renderował żadnego widocznego HTML.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji. Udostępnia funkcję `setTheme` do zmiany stanu.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `Theme`, `ThemeProviderProps`, `ThemeProviderState`.
- **Propsy**:
    - `children: React.ReactNode`
    - `defaultTheme?: Theme` (domyślnie `'dark'`)
    - `storageKey?: string` (klucz do `localStorage`, np. `'ui-theme'`)

### `ThemeToggleButton.tsx`
- **Opis komponentu**: Przycisk z ikoną (księżyc/słońce), który po kliknięciu przełącza motyw aplikacji. Jego stan (wyświetlana ikona) zależy od aktualnie aktywnego motywu.
- **Główne elementy**: Komponent `Button` z biblioteki `shadcn/ui`. Wewnątrz przycisku znajdą się ikony `Sun` i `Moon` (np. z biblioteki `lucide-react`).
- **Obsługiwane interakcje**: `onClick`.
- **Obsługiwana walidacja**: Brak.
- **Typy**: Korzysta z kontekstu `useTheme`.
- **Propsy**: Komponent może przyjmować standardowe propsty dla elementu `button`, które zostaną przekazane do komponentu `Button` z `shadcn/ui`.

## 5. Typy
Wymagane będzie zdefiniowanie następujących typów, najlepiej w nowym pliku `src/components/theme/types.ts` lub podobnym.

```typescript
// Typ reprezentujący dostępne motywy
export type Theme = 'dark' | 'light';

// Propsy dla komponentu ThemeProvider
export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Kształt stanu udostępnianego przez kontekst
export interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
```

## 6. Zarządzanie stanem
Zarządzanie stanem będzie realizowane za pomocą React Context API.

1.  **`ThemeProvider`**:
    - Użyje `useState` do przechowywania aktualnego motywu (`theme`).
    - W `useEffect` odczyta początkową wartość z `localStorage` przy pierwszym renderowaniu. Jeśli brak wartości, ustawi `defaultTheme` (czyli `'dark'`).
    - Inny `useEffect` będzie reagował na zmianę stanu `theme`, aby:
        - Zaktualizować klasę na elemencie `document.documentElement`.
        - Zapisać nową wartość w `localStorage`.
2.  **`useTheme` (Custom Hook)**:
    - Prosty hook, który opakowuje `useContext(ThemeContext)`, aby ułatwić dostęp do stanu w komponentach-konsumentach (np. `ThemeToggleButton`). Zgłosi błąd, jeśli zostanie użyty poza `ThemeProvider`.

## 7. Integracja API
Funkcjonalność jest w pełni po stronie klienta. Integracja z żadnym zewnętrznym API nie jest wymagana.

## 8. Interakcje użytkownika
- **Interakcja**: Użytkownik klika na przycisk zmiany motywu.
- **Akcja**: Wywoływana jest funkcja `onClick`.
- **Logika**:
    - Pobierany jest aktualny motyw z kontekstu `useTheme`.
    - Wywoływana jest funkcja `setTheme` z wartością przeciwną do aktualnej (jeśli `theme === 'dark'`, to `setTheme('light')` i na odwrót).
- **Wynik**:
    - Zmienia się stan w `ThemeProvider`.
    - Zmienia się klasa na tagu `<html>`, co powoduje, że Tailwind CSS aplikuje odpowiednie style (`dark:*`).
    - Zmienia się ikona wewnątrz przycisku `ThemeToggleButton`.
    - Nowa preferencja zostaje zapisana w `localStorage`.

## 9. Warunki i walidacja
Nie ma złożonych warunków ani walidacji. Jedynym sprawdzanym warunkiem jest aktualny stan motywu (`'light'` czy `'dark'`) w celu określenia, jaką ikonę wyświetlić i jaki nowy stan ustawić po kliknięciu.

## 10. Obsługa błędów
Głównym potencjalnym problemem jest niedostępność `localStorage` (np. w trybie prywatnym przeglądarki lub przy starych przeglądarkach).

- **Sposób obsługi**: Dostęp do `localStorage` powinien być opakowany w bloki `try...catch`. Jeśli odczyt lub zapis się nie powiedzie, aplikacja powinna działać dalej bez błędów krytycznych. W takim przypadku motyw będzie resetowany do domyślnego (`'dark'`) przy każdym odświeżeniu strony, a preferencja użytkownika nie zostanie zapamiętana. Standardowa implementacja `shadcn/ui` zazwyczaj obsługuje ten przypadek.

## 11. Kroki implementacji
1.  **Konfiguracja Tailwind CSS**: Upewnij się, że w pliku `astro.config.mjs` (lub `tailwind.config.mjs`) `darkMode` jest ustawiony na `class`.
    ```javascript
    // tailwind.config.mjs
    export default {
      darkMode: "class",
      // ...
    }
    ```
2.  **Stworzenie `ThemeProvider.tsx`**: Zaimplementuj komponent dostawcy kontekstu zgodnie z opisem w sekcji 6. Użyj gotowego szablonu z dokumentacji `shadcn/ui` jako punktu wyjścia.
3.  **Stworzenie `ThemeToggleButton.tsx`**: Zaimplementuj komponent przycisku. Użyj hooka `useTheme` do pobrania motywu i funkcji `setTheme`. Renderuj warunkowo ikony `Sun` i `Moon` (z `lucide-react`).
4.  **Integracja z `Layout.astro`**:
    - Zaimportuj `ThemeProvider` do `src/layouts/Layout.astro`.
    - Owiń tag `<slot />` komponentem `<ThemeProvider client:load>`. Atrybut `client:load` jest kluczowy, aby kontekst był dostępny od razu.
5.  **Dodanie skryptu zapobiegającego FOUC**: Aby uniknąć migotania nieostylowanej treści, dodaj mały skrypt `inline` w sekcji `<head>` pliku `Layout.astro`. Skrypt ten odczyta motyw z `localStorage` i ustawi klasę `.dark` na `<html>` jeszcze przed renderowaniem reszty strony.
    ```html
    <!-- src/layouts/Layout.astro -->
    <head>
      <script is:inline>
        const theme = (() => {
          if (typeof localStorage !== 'undefined' && localStorage.getItem('ui-theme')) {
            return localStorage.getItem('ui-theme');
          }
          return 'dark'; // Domyślny motyw
        })();
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      </script>
      <!-- ... -->
    </head>
    ```
6.  **Umieszczenie przycisku w UI**: Zaimportuj i umieść komponent `<ThemeToggleButton client:visible />` w odpowiednim miejscu, np. w komponencie nagłówka lub nawigacji.
7.  **Testowanie**: Sprawdź działanie przełącznika, odświeżanie strony (czy motyw jest zapamiętany) oraz działanie w trybie incognito (czy aplikacja nie zwraca błędu).
