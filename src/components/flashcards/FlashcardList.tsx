import * as React from "react";
import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardViewModel } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  isLoading: boolean;
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcard: FlashcardViewModel) => void;
}

/**
 * Displays a list of flashcards with loading, error, and empty states.
 */
export function FlashcardList({ flashcards, isLoading, onEdit, onDelete }: FlashcardListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
          <span className="sr-only">Ładowanie...</span>
        </div>
        <p className="mt-4 text-muted-foreground">Ładowanie fiszek...</p>
      </div>
    );
  }

  // Empty state
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-lg font-medium">Brak fiszek</h3>
        <p className="text-muted-foreground">Nie masz jeszcze żadnych fiszek. Stwórz pierwszą!</p>
      </div>
    );
  }

  // List with flashcards
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Liczba fiszek: <span className="font-medium">{flashcards.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {flashcards.map((flashcard) => (
          <FlashcardListItem
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

