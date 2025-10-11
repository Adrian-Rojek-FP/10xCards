// src/components/AppShell.tsx
import { ThemeProvider } from "@/components/theme";
import { Header } from "@/components/Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ThemeProvider>
      <Header />
      {children}
    </ThemeProvider>
  );
}
