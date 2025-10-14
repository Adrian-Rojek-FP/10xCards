import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme";
import { getSupabaseBrowserClient } from "@/db/supabase.client";
import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  const [user, setUser] = useState<User | null>(session?.user ?? null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

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
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-foreground/80">{user.email}</span>
              <form method="POST" action="/api/auth/logout">
                <Button variant="ghost" size="sm" type="submit">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <a href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </a>
          )}
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
