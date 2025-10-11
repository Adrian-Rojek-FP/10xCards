// src/components/theme/types.ts

// Typ reprezentujący dostępne motywy
export type Theme = "dark" | "light";

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
