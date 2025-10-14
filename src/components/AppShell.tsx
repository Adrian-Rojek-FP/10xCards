// src/components/AppShell.tsx
import { ThemeProvider } from "@/components/theme";
import { Header } from "@/components/Header";

import type { User } from "@supabase/supabase-js";

interface AppShellProps {
  children: React.ReactNode;
  user: User | null;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <ThemeProvider>
      <Header user={user} />
      {children}
    </ThemeProvider>
  );
}
