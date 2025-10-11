import * as React from "react";
import type { GenerateFlashcardsCommand, GenerationCreateResponseDto, FlashcardProposalViewModel } from "@/types";

interface UseGenerateFlashcardsReturn {
  flashcards: FlashcardProposalViewModel[];
  generationId: number | null;
  isLoading: boolean;
  errorMessage: string | null;
  generateFlashcards: (sourceText: string) => Promise<void>;
  clearError: () => void;
  updateFlashcard: (index: number, updates: Partial<FlashcardProposalViewModel>) => void;
  removeFlashcard: (index: number) => void;
}

export function useGenerateFlashcards(): UseGenerateFlashcardsReturn {
  const [flashcards, setFlashcards] = React.useState<FlashcardProposalViewModel[]>([]);
  const [generationId, setGenerationId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const generateFlashcards = React.useCallback(async (sourceText: string) => {
    // Validate input
    if (sourceText.length < 1000 || sourceText.length > 10000) {
      setErrorMessage("Tekst musi mieć od 1000 do 10000 znaków");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFlashcards([]);
    setGenerationId(null);

    try {
      const command: GenerateFlashcardsCommand = {
        source_text: sourceText,
      };

      const response = await fetch("/api/generations", {
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

      const data: GenerationCreateResponseDto = await response.json();

      // Transform proposals to view models with UI state
      const viewModels: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal) => ({
        front: proposal.front,
        back: proposal.back,
        source: proposal.source,
        accepted: false,
        edited: false,
      }));

      setFlashcards(viewModels);
      setGenerationId(data.generation_id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error generating flashcards:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd podczas generowania fiszek"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setErrorMessage(null);
  }, []);

  const updateFlashcard = React.useCallback((index: number, updates: Partial<FlashcardProposalViewModel>) => {
    setFlashcards((prev) => {
      const newFlashcards = [...prev];
      if (index >= 0 && index < newFlashcards.length) {
        newFlashcards[index] = {
          ...newFlashcards[index],
          ...updates,
        };
      }
      return newFlashcards;
    });
  }, []);

  const removeFlashcard = React.useCallback((index: number) => {
    setFlashcards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    flashcards,
    generationId,
    isLoading,
    errorMessage,
    generateFlashcards,
    clearError,
    updateFlashcard,
    removeFlashcard,
  };
}
