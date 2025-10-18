import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FlashcardViewModel, FlashcardCreateDto, FlashcardUpdateDto } from "@/types";

interface FlashcardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FlashcardCreateDto | FlashcardUpdateDto) => Promise<void>;
  initialData?: FlashcardViewModel;
}

/**
 * Modal component for creating or editing a flashcard.
 * Provides form validation and handles both create and edit modes.
 */
export function FlashcardFormModal({ isOpen, onClose, onSave, initialData }: FlashcardFormModalProps) {
  const isEditMode = !!initialData;

  // Form state
  const [front, setFront] = React.useState(initialData?.front || "");
  const [back, setBack] = React.useState(initialData?.back || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset form when modal opens/closes or initialData changes
  React.useEffect(() => {
    if (isOpen) {
      setFront(initialData?.front || "");
      setBack(initialData?.back || "");
      setError(null);
    }
  }, [isOpen, initialData]);

  // Validation
  const isFrontValid = front.trim().length > 0 && front.length <= 200;
  const isBackValid = back.trim().length > 0 && back.length <= 500;
  const isFormValid = isFrontValid && isBackValid;

  // Validation error messages
  const frontError = front.length > 0 && !isFrontValid ? "Pole musi zawierać od 1 do 200 znaków" : null;
  const backError = back.length > 0 && !isBackValid ? "Pole musi zawierać od 1 do 500 znaków" : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        // Update mode - only send changed fields
        const updateData: FlashcardUpdateDto = {};
        if (front !== initialData.front) updateData.front = front.trim();
        if (back !== initialData.back) updateData.back = back.trim();
        
        // Only call onSave if there are actual changes
        if (Object.keys(updateData).length > 0) {
          await onSave(updateData);
        }
      } else {
        // Create mode - send full data with manual source
        const createData: FlashcardCreateDto = {
          front: front.trim(),
          back: back.trim(),
          source: "manual",
          generation_id: null,
        };
        await onSave(createData);
      }
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj fiszkę" : "Dodaj nową fiszkę"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Wprowadź zmiany w treści fiszki."
              : "Wypełnij pola poniżej, aby utworzyć nową fiszkę."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front field */}
          <div className="space-y-2">
            <label htmlFor="front" className="text-sm font-medium leading-none">
              Przód fiszki <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Wpisz pytanie lub termin..."
              className={cn(
                "min-h-[100px] resize-y",
                frontError && "border-destructive focus-visible:ring-destructive"
              )}
              maxLength={200}
              disabled={isSubmitting}
              aria-invalid={!!frontError}
              aria-describedby={frontError ? "front-error" : "front-hint"}
            />
            <div className="flex items-center justify-between">
              <p
                id={frontError ? "front-error" : "front-hint"}
                className={cn("text-xs", frontError ? "text-destructive" : "text-muted-foreground")}
              >
                {frontError || `${front.length}/200 znaków`}
              </p>
            </div>
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <label htmlFor="back" className="text-sm font-medium leading-none">
              Tył fiszki <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Wpisz odpowiedź lub definicję..."
              className={cn(
                "min-h-[150px] resize-y",
                backError && "border-destructive focus-visible:ring-destructive"
              )}
              maxLength={500}
              disabled={isSubmitting}
              aria-invalid={!!backError}
              aria-describedby={backError ? "back-error" : "back-hint"}
            />
            <div className="flex items-center justify-between">
              <p
                id={backError ? "back-error" : "back-hint"}
                className={cn("text-xs", backError ? "text-destructive" : "text-muted-foreground")}
              >
                {backError || `${back.length}/500 znaków`}
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <p>{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : isEditMode ? "Zapisz zmiany" : "Utwórz fiszkę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

