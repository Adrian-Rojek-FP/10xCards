// src/components/learning/SessionComplete.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, BookOpen, RotateCcw } from "lucide-react";

interface SessionCompleteProps {
  totalReviewed: number;
  onRestartSession: () => void;
  onResetProgress: () => void;
  isResetting?: boolean;
}

export default function SessionComplete({
  totalReviewed,
  onRestartSession,
  onResetProgress,
  isResetting = false,
}: SessionCompleteProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        {/* Success icon with animation */}
        <div className="animate-in zoom-in duration-500">
          <CheckCircle className="w-24 h-24 text-green-600" />
        </div>

        {/* Congratulations card */}
        <Card className="w-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              Gratulacje! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="text-center space-y-2">
              <p className="text-xl text-muted-foreground">
                Ukończyłeś sesję nauki!
              </p>
              <p className="text-2xl font-bold">
                Przejrzałeś{" "}
                <span className="text-primary">
                  {totalReviewed} {totalReviewed === 1 ? "fiszkę" : "fiszek"}
                </span>
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={onRestartSession}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Rozpocznij nową sesję
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => (window.location.href = "/flashcards")}
                  className="flex-1 gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Wróć do fiszek
                </Button>
              </div>
              
              {/* Reset progress button */}
              <div className="border-t pt-3 mt-2 flex flex-col items-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={onResetProgress}
                  disabled={isResetting}
                  className="gap-2"
                >
                  <RotateCcw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Resetowanie...' : 'Zresetuj postępy i rozpocznij od początku'}
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  Przywróć wszystkie fiszki do stanu początkowego
                </p>
              </div>
            </div>

            {/* Optional: Future stats button */}
            {/* <Button
              size="lg"
              variant="ghost"
              onClick={() => (window.location.href = "/stats")}
              className="w-full gap-2"
            >
              <BarChart className="w-5 h-5" />
              Zobacz statystyki
            </Button> */}
          </CardContent>
        </Card>

        {/* Motivational message */}
        <p className="text-center text-muted-foreground max-w-md">
          Świetna robota! Regularne powtórki są kluczem do długotrwałego zapamiętywania.
          Wróć jutro, aby kontynuować naukę.
        </p>
      </div>
    </div>
  );
}

