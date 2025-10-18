// src/components/learning/FlashcardDisplay.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import type { FlashcardWithLearningStateDto } from "@/types";

interface FlashcardDisplayProps {
  flashcard: FlashcardWithLearningStateDto;
  isRevealed: boolean;
  onReveal: () => void;
}

export default function FlashcardDisplay({ flashcard, isRevealed, onReveal }: FlashcardDisplayProps) {
  // Defensive programming - validate flashcard
  if (!flashcard || !flashcard.front || !flashcard.back) {
    console.error("Invalid flashcard data", flashcard);
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Błąd: Nieprawidłowe dane fiszki</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-muted-foreground">
            {isRevealed ? "Pytanie i Odpowiedź" : "Pytanie"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Front of the card - always visible */}
          <div className="min-h-[120px] flex items-center justify-center">
            <p className="text-2xl md:text-3xl text-center font-medium leading-relaxed">{flashcard.front}</p>
          </div>

          {/* Back of the card - visible after reveal with animation */}
          {isRevealed && (
            <div
              className="border-t pt-6 animate-in fade-in slide-in-from-top-4 duration-300"
              role="region"
              aria-label="Odpowiedź"
            >
              <div className="min-h-[120px] flex items-center justify-center bg-muted/30 rounded-lg p-6">
                <p className="text-xl md:text-2xl text-center leading-relaxed">{flashcard.back}</p>
              </div>
            </div>
          )}

          {/* Show answer button - only visible before reveal */}
          {!isRevealed && (
            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={onReveal} className="min-w-[200px] gap-2">
                <Eye className="w-5 h-5" />
                Pokaż odpowiedź
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
