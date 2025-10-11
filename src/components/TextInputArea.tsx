import * as React from "react";
import { cn } from "@/lib/utils";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInputArea({
  value,
  onChange,
  placeholder = "Wklej tutaj tekst do wygenerowania fiszek...",
  minLength = 1000,
  maxLength = 10000,
  disabled = false,
}: TextInputAreaProps) {
  const currentLength = value.length;
  const isValid = currentLength >= minLength && currentLength <= maxLength;
  const isTooShort = currentLength > 0 && currentLength < minLength;
  const isTooLong = currentLength > maxLength;

  const getValidationMessage = () => {
    if (currentLength === 0) {
      return `Tekst musi mieć od ${minLength} do ${maxLength} znaków`;
    }
    if (isTooShort) {
      return `Za mało znaków: ${currentLength}/${minLength}`;
    }
    if (isTooLong) {
      return `Za dużo znaków: ${currentLength}/${maxLength}`;
    }
    return `Liczba znaków: ${currentLength}/${maxLength}`;
  };

  const getValidationColor = () => {
    if (isTooLong) return "text-destructive";
    if (isTooShort) return "text-yellow-600 dark:text-yellow-500";
    if (isValid) return "text-green-600 dark:text-green-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-2 w-full">
      <label htmlFor="source-text" className="block text-sm font-medium">
        Tekst źródłowy
      </label>
      <textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-xs",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          isTooLong && "border-destructive focus-visible:ring-destructive/20",
          isValid && "border-green-500 focus-visible:ring-green-500/20"
        )}
        aria-invalid={!isValid && currentLength > 0}
        aria-describedby="text-validation"
      />
      <div
        id="text-validation"
        className={cn("text-sm font-medium transition-colors", getValidationColor())}
        role="status"
        aria-live="polite"
      >
        {getValidationMessage()}
      </div>
    </div>
  );
}
