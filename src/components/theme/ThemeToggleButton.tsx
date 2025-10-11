// src/components/theme/ThemeToggleButton.tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}
      title={theme === "dark" ? "Przełącz na tryb jasny" : "Przełącz na tryb ciemny"}
    >
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </Button>
  );
}
