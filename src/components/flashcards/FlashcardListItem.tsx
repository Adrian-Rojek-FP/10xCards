import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FlashcardViewModel } from "@/types";

interface FlashcardListItemProps {
  flashcard: FlashcardViewModel;
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcard: FlashcardViewModel) => void;
}

/**
 * Displays a single flashcard item with its content and action buttons.
 */
export function FlashcardListItem({ flashcard, onEdit, onDelete }: FlashcardListItemProps) {
  const handleEdit = () => {
    onEdit(flashcard);
  };

  const handleDelete = () => {
    onDelete(flashcard);
  };

  // Format source label
  const sourceLabel = {
    "ai-full": "AI",
    "ai-edited": "AI (edytowana)",
    manual: "Ręcznie",
  }[flashcard.source];

  return (
    <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="p-6 flex flex-col flex-1 space-y-4">
        {/* Front of the card */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Przód</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{sourceLabel}</span>
          </div>
          <p className="text-base leading-relaxed min-h-[3rem]">{flashcard.front}</p>
        </div>

        {/* Back of the card */}
        <div className="space-y-2 flex-1">
          <span className="text-sm font-semibold text-muted-foreground">Tył</span>
          <p className="text-base leading-relaxed min-h-[4rem]">{flashcard.back}</p>
        </div>

        {/* Metadata */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>Utworzono: {flashcard.createdAt.toLocaleDateString("pl-PL")}</p>
          {flashcard.updatedAt.getTime() !== flashcard.createdAt.getTime() && (
            <p>Zaktualizowano: {flashcard.updatedAt.toLocaleDateString("pl-PL")}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleEdit} variant="outline" size="sm" className="flex-1">
            Edytuj
          </Button>
          <Button onClick={handleDelete} variant="destructive" size="sm" className="flex-1">
            Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
