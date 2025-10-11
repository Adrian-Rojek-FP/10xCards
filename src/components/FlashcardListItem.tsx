import * as React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { FlashcardProposalViewModel } from "@/types";

interface FlashcardListItemProps {
  flashcard: FlashcardProposalViewModel;
  index: number;
  onAccept: (index: number) => void;
  onEdit: (index: number, front: string, back: string) => void;
  onReject: (index: number) => void;
}

export function FlashcardListItem({ flashcard, index, onAccept, onEdit, onReject }: FlashcardListItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editFront, setEditFront] = React.useState(flashcard.front);
  const [editBack, setEditBack] = React.useState(flashcard.back);

  const isFrontValid = editFront.length > 0 && editFront.length <= 200;
  const isBackValid = editBack.length > 0 && editBack.length <= 500;
  const canSaveEdit = isFrontValid && isBackValid;

  const handleStartEdit = () => {
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
  };

  const handleSaveEdit = () => {
    if (!canSaveEdit) return;
    onEdit(index, editFront, editBack);
    setIsEditing(false);
  };

  const handleAccept = () => {
    onAccept(index);
  };

  const handleReject = () => {
    onReject(index);
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm transition-all flex flex-col h-full",
        flashcard.accepted && "border-green-500 bg-green-50 dark:bg-green-950/20",
        flashcard.edited && "border-blue-500"
      )}
    >
      <div className="space-y-4 flex-1">
        {/* Front of the card */}
        <div className="space-y-2">
          <label htmlFor={`front-${index}`} className="text-sm font-semibold text-muted-foreground">
            Przód
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <textarea
                id={`front-${index}`}
                value={editFront}
                onChange={(e) => setEditFront(e.target.value)}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "resize-y",
                  !isFrontValid && editFront.length > 0 && "border-destructive"
                )}
                maxLength={200}
                aria-invalid={!isFrontValid}
              />
              <p className={cn("text-xs", isFrontValid ? "text-muted-foreground" : "text-destructive")}>
                {editFront.length}/200 znaków
              </p>
            </div>
          ) : (
            <p className="text-base leading-relaxed">{flashcard.front}</p>
          )}
        </div>

        {/* Back of the card */}
        <div className="space-y-2">
          <label htmlFor={`back-${index}`} className="text-sm font-semibold text-muted-foreground">
            Tył
          </label>
          {isEditing ? (
            <div className="space-y-1">
              <textarea
                id={`back-${index}`}
                value={editBack}
                onChange={(e) => setEditBack(e.target.value)}
                className={cn(
                  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                  "resize-y",
                  !isBackValid && editBack.length > 0 && "border-destructive"
                )}
                maxLength={500}
                aria-invalid={!isBackValid}
              />
              <p className={cn("text-xs", isBackValid ? "text-muted-foreground" : "text-destructive")}>
                {editBack.length}/500 znaków
              </p>
            </div>
          ) : (
            <p className="text-base leading-relaxed">{flashcard.back}</p>
          )}
        </div>

        {/* Status badges */}
        <div className="flex gap-2">
          {flashcard.accepted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
              <svg className="size-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                  clipRule="evenodd"
                />
              </svg>
              Zaakceptowana
            </span>
          )}
          {flashcard.edited && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
              <svg
                className="size-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              Edytowana
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 flex-wrap">
        {isEditing ? (
          <>
            <Button onClick={handleSaveEdit} disabled={!canSaveEdit} size="sm">
              Zapisz
            </Button>
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              Anuluj
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleAccept} variant={flashcard.accepted ? "secondary" : "default"} size="sm">
              {flashcard.accepted ? "Anuluj" : "Zatwierdź"}
            </Button>
            <Button onClick={handleStartEdit} variant="outline" size="sm">
              Edytuj
            </Button>
            <Button onClick={handleReject} variant="destructive" size="sm">
              Odrzuć
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
