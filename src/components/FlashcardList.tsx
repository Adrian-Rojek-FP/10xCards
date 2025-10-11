import * as React from "react";
import { FlashcardListItem } from "./FlashcardListItem";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardListProps {
  flashcards: FlashcardProposalViewModel[];
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export function FlashcardList({ flashcards, onAccept, onEdit, onReject }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Brak wygenerowanych fiszek</p>
      </div>
    );
  }

  const acceptedCount = flashcards.filter((f) => f.accepted).length;
  const editedCount = flashcards.filter((f) => f.edited).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Wygenerowane fiszki ({flashcards.length})</h2>
        <div className="flex gap-3 text-sm">
          {acceptedCount > 0 && (
            <span className="text-green-700 dark:text-green-400 font-medium">Zaakceptowane: {acceptedCount}</span>
          )}
          {editedCount > 0 && (
            <span className="text-blue-700 dark:text-blue-400 font-medium">Edytowane: {editedCount}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((flashcard, index) => (
          <FlashcardListItem
            key={index}
            flashcard={flashcard}
            index={index}
            onAccept={onAccept}
            onEdit={onEdit}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}
