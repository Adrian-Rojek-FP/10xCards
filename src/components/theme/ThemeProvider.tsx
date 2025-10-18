// src/components/theme/ThemeProvider.tsx
import React, { createContext, useEffect, useState } from "react";
import type { Theme, ThemeProviderProps, ThemeProviderState } from "./types";

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Inicjalizacja stanu z localStorage (jeśli jest dostępny)
    if (typeof window !== "undefined") {
      try {
        const storedTheme = localStorage.getItem(storageKey);
        if (storedTheme === "light" || storedTheme === "dark") {
          return storedTheme;
        }
      } catch {
        // Silently fail if localStorage is not available
      }
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Usuń poprzednie klasy motywu
    root.classList.remove("light", "dark");

    // Dodaj aktualny motyw jako klasę
    root.classList.add(theme);

    // Zapisz motyw w localStorage
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook do używania kontekstu motywu
export function useTheme() {
  const context = React.useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme musi być używany wewnątrz ThemeProvider");
  }

  return context;
}
