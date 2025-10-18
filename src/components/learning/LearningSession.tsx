// src/components/learning/LearningSession.tsx
import { useLearningSession } from "@/components/hooks/useLearningSession";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import SessionProgress from "./SessionProgress";
import FlashcardDisplay from "./FlashcardDisplay";
import RatingButtons from "./RatingButtons";
import SessionComplete from "./SessionComplete";

export default function LearningSession() {
  const {
    session,
    currentCard,
    currentCardIndex,
    isCardRevealed,
    isSubmitting,
    isLoading,
    error,
    isSessionComplete,
    isResetting,
    revealCard,
    submitRating,
    restartSession,
    resetProgress,
  } = useLearningSession();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <h2 className="text-2xl font-bold">Przygotowuję sesję...</h2>
        <p className="text-muted-foreground">Pobieram fiszki do nauki</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Ups! Coś poszło nie tak</h2>
        <p className="text-muted-foreground text-center">{error}</p>
        <div className="flex gap-2">
          <Button onClick={() => restartSession()}>Spróbuj ponownie</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/flashcards")}>
            Wróć do fiszek
          </Button>
        </div>
      </div>
    );
  }

  // Empty state - no cards
  if (!session || session.flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-center space-y-4 max-w-2xl w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold">Świetna robota!</h2>
          <p className="text-muted-foreground text-lg">
            Wszystkie fiszki są aktualne. 
          </p>
          <p className="text-muted-foreground">
            Twoje fiszki zostały zaplanowane zgodnie z algorytmem powtórek rozłożonych w czasie.<br />
            Wróć później, aby kontynuować naukę, lub dodaj nowe fiszki.
          </p>
          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-2 justify-center">
              <Button onClick={() => (window.location.href = "/flashcards")}>
                Moje fiszki
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = "/generate")}>
                Generuj z AI
              </Button>
            </div>
            
            {/* Reset progress button */}
            <div className="border-t pt-4 mt-4 flex flex-col items-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={resetProgress}
                disabled={isResetting}
                className="gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetowanie...' : 'Zresetuj wszystkie postępy'}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Przywróć wszystkie fiszki do stanu początkowego i rozpocznij od nowa
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session complete state
  if (isSessionComplete) {
    return (
      <SessionComplete
        totalReviewed={session.flashcards.length}
        onRestartSession={restartSession}
        onResetProgress={resetProgress}
        isResetting={isResetting}
      />
    );
  }

  // Validate current card
  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>Nie można załadować fiszki</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Active session state
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Session Progress */}
      <SessionProgress
        currentCard={currentCardIndex + 1} // 1-indexed for UI
        totalCards={session.flashcards.length}
        newCards={session.new_cards}
        reviewCards={session.review_cards}
      />

      {/* Flashcard Display */}
      <div className="mt-8">
        <FlashcardDisplay
          flashcard={currentCard}
          isRevealed={isCardRevealed}
          onReveal={revealCard}
        />
      </div>

      {/* Rating Buttons - only visible after reveal */}
      {isCardRevealed && (
        <div className="mt-6">
          <RatingButtons onRate={submitRating} isSubmitting={isSubmitting} />
        </div>
      )}
    </div>
  );
}

