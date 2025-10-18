// src/components/learning/SessionProgress.tsx
import { Progress } from "@/components/ui/progress";
import { BookOpen, RefreshCw } from "lucide-react";

interface SessionProgressProps {
  currentCard: number; // 1-indexed for UI
  totalCards: number;
  newCards: number;
  reviewCards: number;
}

export default function SessionProgress({ currentCard, totalCards, newCards, reviewCards }: SessionProgressProps) {
  // Validate props
  if (currentCard < 1 || totalCards < 1 || currentCard > totalCards) {
    console.warn("Invalid SessionProgress props", { currentCard, totalCards });
    return null;
  }

  // Calculate progress percentage
  const progressPercentage = ((currentCard - 1) / totalCards) * 100;

  return (
    <div className="space-y-4">
      {/* Card counter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Fiszka {currentCard} z {totalCards}
        </h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {newCards > 0 && (
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{newCards} nowych</span>
            </div>
          )}
          {reviewCards > 0 && (
            <div className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              <span>{reviewCards} powtórek</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
}
