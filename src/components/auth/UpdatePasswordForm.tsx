import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UpdatePasswordForm() {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Client-side validation
  const isPasswordValid = password.length === 0 || password.length >= 6;
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const canSubmit =
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    isPasswordValid &&
    passwordsMatch &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!canSubmit) return;

    setIsLoading(true);

    // TODO: Implement Supabase password update
    // This will be implemented in the next phase
    console.log("Password update attempt");

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Hasło zostało pomyślnie zmienione. Za chwilę zostaniesz przekierowany...");

      // Simulate redirect after success
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
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
            <svg
              className="size-5 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
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
          Wprowadź nowe hasło dla swojego konta. Hasło musi zawierać co najmniej 6 znaków.
        </p>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Nowe hasło
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-10",
                "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !isPasswordValid && password.length > 0 && "border-destructive"
              )}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              aria-invalid={!isPasswordValid && password.length > 0}
              aria-describedby={!isPasswordValid && password.length > 0 ? "password-error" : undefined}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors"
              aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  className="size-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="size-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {!isPasswordValid && password.length > 0 && (
            <p id="password-error" className="text-xs text-destructive">
              Hasło musi mieć co najmniej 6 znaków
            </p>
          )}
          {isPasswordValid && password.length > 0 && (
            <p className="text-xs text-muted-foreground">Hasło spełnia wymagania</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="block text-sm font-medium">
            Potwierdź nowe hasło
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pr-10",
                "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                !passwordsMatch && confirmPassword.length > 0 && "border-destructive"
              )}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              aria-invalid={!passwordsMatch && confirmPassword.length > 0}
              aria-describedby={!passwordsMatch && confirmPassword.length > 0 ? "confirm-password-error" : undefined}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors"
              aria-label={showConfirmPassword ? "Ukryj hasło" : "Pokaż hasło"}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <svg
                  className="size-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  className="size-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {!passwordsMatch && confirmPassword.length > 0 && (
            <p id="confirm-password-error" className="text-xs text-destructive">
              Hasła nie są identyczne
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={!canSubmit} className="w-full" size="lg">
        {isLoading ? (
          <>
            <svg
              className="animate-spin size-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Zmiana hasła...
          </>
        ) : (
          "Zmień hasło"
        )}
      </Button>
    </form>
  );
}

