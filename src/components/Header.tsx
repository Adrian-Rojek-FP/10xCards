// src/components/Header.tsx
import { ThemeToggleButton } from "@/components/theme";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">10xCards</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Strona główna
            </a>
            <a href="/generate" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Generuj fiszki
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
