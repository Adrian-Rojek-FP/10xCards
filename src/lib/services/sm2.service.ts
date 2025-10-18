// src/lib/services/sm2.service.ts
import type { LearningStatus, RatingValue } from "../../types";

/**
 * SM-2 Algorithm Constants
 * Based on SuperMemo 2 algorithm
 */
export const SM2_CONSTANTS = {
  MIN_EASINESS_FACTOR: 1.3,
  MAX_EASINESS_FACTOR: 3.0,
  DEFAULT_EASINESS_FACTOR: 2.5,

  // Intervals for different ratings and repetition counts
  RATING_INTERVALS: {
    AGAIN: { rep0: 0, rep1: 0, rep2plus: 0 },
    HARD: { rep0: 1, rep1: 1, rep2plus_multiplier: 1.2 },
    GOOD: { rep0: 1, rep1: 6, rep2plus_multiplier: 1.0 },
    EASY: { rep0: 4, rep1: 10, rep2plus_multiplier: 1.3 },
  },

  // Easiness factor changes
  EF_CHANGE: {
    AGAIN: -0.2,
    HARD: -0.15,
    GOOD: 0.0,
    EASY: 0.15,
  },
} as const;

/**
 * SM-2 Algorithm State
 */
export interface SM2State {
  easiness_factor: number;
  interval: number;
  repetitions: number;
  lapses: number;
  status: LearningStatus;
}

/**
 * SM-2 Algorithm Result
 */
export interface SM2Result extends SM2State {
  next_review_date: Date;
}

/**
 * Calculate new SM-2 state based on user rating
 *
 * @param currentState - Current learning state
 * @param rating - User rating (0=again, 1=hard, 2=good, 3=easy)
 * @returns New SM-2 state with next review date
 */
export function calculateSM2(currentState: SM2State, rating: RatingValue): SM2Result {
  let newEF = currentState.easiness_factor;
  let newInterval = currentState.interval;
  let newRepetitions = currentState.repetitions;
  let newLapses = currentState.lapses;
  let newStatus = currentState.status;

  switch (rating) {
    case 0: // AGAIN - Complete failure
      newEF = Math.max(SM2_CONSTANTS.MIN_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.AGAIN);
      newInterval = 0;
      newRepetitions = 0;
      newLapses = currentState.lapses + 1;
      newStatus = "relearning";
      break;

    case 1: // HARD - Difficult recall
      newEF = Math.max(SM2_CONSTANTS.MIN_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.HARD);

      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.HARD.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.HARD.rep1;
      } else {
        newInterval = Math.ceil(currentState.interval * SM2_CONSTANTS.RATING_INTERVALS.HARD.rep2plus_multiplier);
      }

      if (currentState.status === "new" || currentState.status === "relearning") {
        newStatus = "learning";
      }

      if (newRepetitions >= 2) {
        newRepetitions++;
      } else {
        newRepetitions = 1;
      }
      break;

    case 2: // GOOD - Correct recall
      // EF stays the same

      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.GOOD.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.GOOD.rep1;
      } else {
        newInterval = Math.ceil(currentState.interval * newEF);
      }

      newRepetitions++;

      if (newRepetitions >= 2) {
        newStatus = "review";
      } else {
        newStatus = "learning";
      }
      break;

    case 3: // EASY - Perfect recall
      newEF = Math.min(SM2_CONSTANTS.MAX_EASINESS_FACTOR, newEF + SM2_CONSTANTS.EF_CHANGE.EASY);

      if (newRepetitions === 0) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.EASY.rep0;
      } else if (newRepetitions === 1) {
        newInterval = SM2_CONSTANTS.RATING_INTERVALS.EASY.rep1;
      } else {
        newInterval = Math.ceil(
          currentState.interval * newEF * SM2_CONSTANTS.RATING_INTERVALS.EASY.rep2plus_multiplier
        );
      }

      newRepetitions++;
      newStatus = "review";
      break;
  }

  const nextReviewDate = calculateNextReviewDate(newInterval);

  return {
    easiness_factor: newEF,
    interval: newInterval,
    repetitions: newRepetitions,
    lapses: newLapses,
    status: newStatus,
    next_review_date: nextReviewDate,
  };
}

/**
 * Helper: Calculate next review date
 *
 * @param intervalDays - Number of days to add to current date
 * @returns Next review date
 */
function calculateNextReviewDate(intervalDays: number): Date {
  const now = new Date();
  now.setDate(now.getDate() + intervalDays);
  return now;
}
