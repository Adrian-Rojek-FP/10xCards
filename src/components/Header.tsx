import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme";
import type { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
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
            <a href="/flashcards" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Moje fiszki
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-foreground/80 hidden sm:inline">{user.email}</span>
              <form method="POST" action="/api/auth/logout">
                <Button variant="ghost" size="sm" type="submit">
                  Wyloguj
                </Button>
              </form>
            </>
          ) : (
            <a href="/login">
              <Button variant="ghost" size="sm">
                Zaloguj
              </Button>
            </a>
          )}
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
