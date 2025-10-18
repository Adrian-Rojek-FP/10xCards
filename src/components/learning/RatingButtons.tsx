// src/components/learning/RatingButtons.tsx
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertCircle, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import type { RatingValue } from "@/types";
import { RATING_MAP } from "@/types";

interface RatingButtonsProps {
  onRate: (rating: RatingValue) => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

export default function RatingButtons({ onRate, isSubmitting, disabled = false }: RatingButtonsProps) {
  // Defensive programming
  if (!onRate) {
    console.error("onRate handler is required");
    return null;
  }

  const handleRate = (rating: RatingValue) => {
    // Validate rating value
    if (rating < 0 || rating > 3) {
      console.error("Invalid rating value", rating);
      return;
    }
    onRate(rating);
  };

  const isDisabled = isSubmitting || disabled;

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-muted-foreground font-medium">Jak dobrze pamiętasz tę fiszkę?</p>

      {/* Rating buttons grid - 2x2 layout on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Again - Red/Destructive */}
        <Button
          variant="destructive"
          size="lg"
          onClick={() => handleRate(RATING_MAP.again)}
          disabled={isDisabled}
          className="flex flex-col gap-2 h-auto py-4 touch-target"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
          <span className="text-sm font-semibold">Powtórz</span>
        </Button>

        {/* Hard - Orange/Warning (using secondary with custom color) */}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => handleRate(RATING_MAP.hard)}
          disabled={isDisabled}
          className="flex flex-col gap-2 h-auto py-4 bg-orange-500 hover:bg-orange-600 text-white touch-target"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">Trudne</span>
        </Button>

        {/* Good - Green/Success */}
        <Button
          variant="default"
          size="lg"
          onClick={() => handleRate(RATING_MAP.good)}
          disabled={isDisabled}
          className="flex flex-col gap-2 h-auto py-4 bg-green-600 hover:bg-green-700 text-white touch-target"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm font-semibold">Dobre</span>
        </Button>

        {/* Easy - Blue/Primary */}
        <Button
          variant="default"
          size="lg"
          onClick={() => handleRate(RATING_MAP.easy)}
          disabled={isDisabled}
          className="flex flex-col gap-2 h-auto py-4 bg-blue-600 hover:bg-blue-700 text-white touch-target"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span className="text-sm font-semibold">Łatwe</span>
        </Button>
      </div>
    </div>
  );
}
