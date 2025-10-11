import * as React from "react";
import { TextInputArea } from "./TextInputArea";
import { Button } from "./ui/button";
import { SkeletonLoader } from "./SkeletonLoader";
import { FlashcardList } from "./FlashcardList";
import { BulkSaveButton } from "./BulkSaveButton";
import { useGenerateFlashcards } from "./hooks/useGenerateFlashcards";

export default function FlashcardGenerationView() {
  const [sourceText, setSourceText] = React.useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = React.useState<string | null>(null);

  const { flashcards, generationId, isLoading, errorMessage, generateFlashcards, updateFlashcard, removeFlashcard } =
    useGenerateFlashcards();

  const isTextValid = sourceText.length >= 1000 && sourceText.length <= 10000;
  const canGenerate = isTextValid && !isLoading;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    await generateFlashcards(sourceText);
  };

  const handleSaveSuccess = () => {
    setSaveSuccessMessage("Fiszki zostały zapisane pomyślnie!");
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 5000);
  };

  const handleSaveError = (error: string) => {
    // Error will be displayed by BulkSaveButton's parent component
    alert(`Błąd zapisu: ${error}`);
  };

  const handleAccept = (index: number) => {
    updateFlashcard(index, { accepted: !flashcards[index].accepted });
  };

  const handleEdit = (index: number, front: string, back: string) => {
    updateFlashcard(index, {
      front,
      back,
      source: "ai-edited",
      edited: true,
    });
  };

  const handleReject = (index: number) => {
    removeFlashcard(index);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generowanie Fiszek</h1>
          <p className="text-muted-foreground">
            Wklej tekst (1000-10000 znaków), aby wygenerować fiszki przy pomocy AI
          </p>
        </header>

        <div className="space-y-4">
          <TextInputArea value={sourceText} onChange={setSourceText} disabled={isLoading} />

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button onClick={handleGenerate} disabled={!canGenerate} size="lg" className="w-full sm:w-auto">
              {isLoading ? "Generowanie..." : "Generuj fiszki"}
            </Button>

            {!isLoading && flashcards.length > 0 && (
              <div className="sm:ml-auto w-full sm:w-auto">
                <BulkSaveButton
                  flashcards={flashcards}
                  generationId={generationId}
                  onSaveSuccess={handleSaveSuccess}
                  onSaveError={handleSaveError}
                />
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-4" role="alert">
            <div className="flex items-start gap-3">
              <svg
                className="size-5 text-destructive shrink-0 mt-0.5"
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
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-destructive">Błąd generowania</h3>
                <p className="text-sm text-destructive/90">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Generowanie fiszek w toku...</p>
            <SkeletonLoader count={3} />
          </div>
        )}

        {!isLoading && flashcards.length > 0 && (
          <>
            {saveSuccessMessage && (
              <div className="rounded-md border border-green-500 bg-green-50 dark:bg-green-950/20 p-4" role="alert">
                <div className="flex items-start gap-3">
                  <svg
                    className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Sukces</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">{saveSuccessMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <FlashcardList
              flashcards={flashcards}
              onAccept={handleAccept}
              onEdit={handleEdit}
              onReject={handleReject}
            />
          </>
        )}
      </div>
    </div>
  );
}
