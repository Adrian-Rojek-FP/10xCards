import * as React from "react";
import { Button } from "./ui/button";
import type { FlashcardProposalViewModel, FlashcardsCreateCommand } from "@/types";

interface BulkSaveButtonProps {
  flashcards: FlashcardProposalViewModel[];
  generationId: number | null;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

export function BulkSaveButton({ flashcards, generationId, onSaveSuccess, onSaveError }: BulkSaveButtonProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const acceptedFlashcards = flashcards.filter((f) => f.accepted);
  const canSaveAll = flashcards.length > 0 && generationId !== null && !isSaving;
  const canSaveAccepted = acceptedFlashcards.length > 0 && generationId !== null && !isSaving;

  const validateFlashcard = (flashcard: FlashcardProposalViewModel): boolean => {
    return (
      flashcard.front.length > 0 &&
      flashcard.front.length <= 200 &&
      flashcard.back.length > 0 &&
      flashcard.back.length <= 500
    );
  };

  const saveFlashcards = async (flashcardsToSave: FlashcardProposalViewModel[]) => {
    if (!generationId) {
      onSaveError?.("Brak ID generacji");
      return;
    }

    // Validate all flashcards before saving
    const invalidFlashcards = flashcardsToSave.filter((f) => !validateFlashcard(f));
    if (invalidFlashcards.length > 0) {
      onSaveError?.(`Niektóre fiszki nie spełniają wymagań walidacji (front: max 200 znaków, back: max 500 znaków)`);
      return;
    }

    setIsSaving(true);

    try {
      const command: FlashcardsCreateCommand = {
        flashcards: flashcardsToSave.map((f) => ({
          front: f.front,
          back: f.back,
          source: f.source,
          generation_id: generationId,
        })),
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Błąd HTTP: ${response.status}`);
      }

      onSaveSuccess?.();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving flashcards:", error);
      onSaveError?.(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas zapisu fiszek");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = () => {
    saveFlashcards(flashcards);
  };

  const handleSaveAccepted = () => {
    saveFlashcards(acceptedFlashcards);
  };

  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 flex-wrap items-center">
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">
          {acceptedFlashcards.length > 0 ? (
            <>
              Zaakceptowano <strong>{acceptedFlashcards.length}</strong> z <strong>{flashcards.length}</strong> fiszek
            </>
          ) : (
            <>Nie zaakceptowano żadnych fiszek</>
          )}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSaveAccepted} disabled={!canSaveAccepted} variant="default">
          {isSaving ? "Zapisywanie..." : `Zapisz zaakceptowane (${acceptedFlashcards.length})`}
        </Button>
        <Button onClick={handleSaveAll} disabled={!canSaveAll} variant="outline">
          {isSaving ? "Zapisywanie..." : `Zapisz wszystkie (${flashcards.length})`}
        </Button>
      </div>
    </div>
  );
}
