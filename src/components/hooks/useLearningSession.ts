// src/components/hooks/useLearningSession.ts
import { useState, useEffect, useCallback } from "react";
import type {
  LearningSessionResponseDto,
  FlashcardWithLearningStateDto,
  ReviewSubmitCommand,
  ReviewResponseDto,
  RatingValue,
  LearningSessionQueryParams,
  ResetLearningProgressResponseDto,
} from "@/types";

interface UseLearningSessionReturn {
  // State
  session: LearningSessionResponseDto | null;
  currentCard: FlashcardWithLearningStateDto | null;
  currentCardIndex: number;
  isCardRevealed: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
  isSessionComplete: boolean;
  isResetting: boolean;

  // Actions
  fetchSession: (params?: LearningSessionQueryParams) => Promise<void>;
  revealCard: () => void;
  submitRating: (rating: RatingValue) => Promise<void>;
  restartSession: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

export function useLearningSession(): UseLearningSessionReturn {
  // State management
  const [session, setSession] = useState<LearningSessionResponseDto | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardRevealed, setIsCardRevealed] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cardStartTime, setCardStartTime] = useState<number>(Date.now());
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Derived state
  const currentCard = session?.flashcards[currentCardIndex] ?? null;
  const isSessionComplete = session ? currentCardIndex >= session.flashcards.length : false;

  /**
   * Fetch learning session from API
   */
  const fetchSession = useCallback(async (params?: LearningSessionQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.include_new !== undefined) {
        queryParams.append("include_new", params.include_new.toString());
      }

      const url = `/api/learning/session${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          window.location.href = "/login";
          return;
        }

        throw new Error("Nie udało się pobrać sesji");
      }

      const data: LearningSessionResponseDto = await response.json();

      // Set session even if empty - component will handle display
      setSession(data);
      setCurrentCardIndex(0);
      setIsCardRevealed(false);
      setCardStartTime(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reveal the back of the current card
   */
  const revealCard = useCallback(() => {
    setIsCardRevealed(true);
  }, []);

  /**
   * Calculate review duration in milliseconds
   */
  const calculateReviewDuration = useCallback(() => {
    return Date.now() - cardStartTime;
  }, [cardStartTime]);

  /**
   * Submit rating for current card and move to next
   */
  const submitRating = useCallback(
    async (rating: RatingValue) => {
      if (!session || !currentCard) {
        return;
      }

      // Validate rating value
      if (rating < 0 || rating > 3) {
        console.error("Invalid rating value");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      const reviewCommand: ReviewSubmitCommand = {
        flashcard_id: currentCard.id,
        rating: rating,
        review_duration_ms: calculateReviewDuration(),
      };

      try {
        const response = await fetch("/api/learning/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewCommand),
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }

          if (response.status === 404) {
            throw new Error("Fiszka nie została znaleziona");
          }

          throw new Error("Nie udało się zapisać oceny");
        }

        await response.json();

        // Move to next card
        setCurrentCardIndex((prev) => prev + 1);
        setIsCardRevealed(false);
        setCardStartTime(Date.now());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsSubmitting(false);
      }
    },
    [session, currentCard, calculateReviewDuration]
  );

  /**
   * Restart session - fetch new session
   */
  const restartSession = useCallback(async () => {
    setCurrentCardIndex(0);
    setIsCardRevealed(false);
    await fetchSession();
  }, [fetchSession]);

  /**
   * Reset all learning progress - restore all flashcards to initial state
   */
  const resetProgress = useCallback(async () => {
    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch("/api/learning/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        throw new Error("Nie udało się zresetować postępów");
      }

      await response.json();

      // After successful reset, fetch new session with all cards
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsResetting(false);
    }
  }, [fetchSession]);

  // Initialize session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    currentCard,
    currentCardIndex,
    isCardRevealed,
    isSubmitting,
    isLoading,
    error,
    isSessionComplete,
    isResetting,
    fetchSession,
    revealCard,
    submitRating,
    restartSession,
    resetProgress,
  };
}
