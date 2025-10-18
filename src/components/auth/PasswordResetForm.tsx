import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PasswordResetForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Client-side validation
  const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = email.length > 0 && isEmailValid && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) return;

    setIsLoading(true);

    // TODO: Implement Supabase password reset
    // This will be implemented in the next phase

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(
        "Jeśli podany adres e-mail jest zarejestrowany w systemie, otrzymasz instrukcje resetowania hasła."
      );
      setEmail("");
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <svg
              className="size-5 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          className="rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 p-4 text-sm text-green-800 dark:text-green-300"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <svg className="size-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Wprowadź adres e-mail powiązany z Twoim kontem. Wyślemy Ci link do resetowania hasła.
        </p>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Adres e-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !isEmailValid && email.length > 0 && "border-destructive"
            )}
            placeholder="twoj@email.com"
            autoComplete="email"
            required
            aria-invalid={!isEmailValid && email.length > 0}
            aria-describedby={!isEmailValid && email.length > 0 ? "email-error" : undefined}
            disabled={isLoading}
          />
          {!isEmailValid && email.length > 0 && (
            <p id="email-error" className="text-xs text-destructive">
              Wprowadź poprawny adres e-mail
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <>
            <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Wysyłanie...
          </>
        ) : (
          "Wyślij link resetujący"
        )}
      </Button>

      <div className="text-center">
        <a
          href="/login"
          className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          Wróć do logowania
        </a>
      </div>
    </form>
  );
}
