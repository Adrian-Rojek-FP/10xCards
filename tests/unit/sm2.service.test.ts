import { describe, it, expect } from "vitest";
import { calculateSM2, SM2_CONSTANTS } from "../../src/lib/services/sm2.service";
import type { SM2State } from "../../src/lib/services/sm2.service";

describe("SM2 Algorithm Service", () => {
  const newState: SM2State = {
    easiness_factor: 2.5,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    status: "new",
  };

  describe("Rating 0 (Again) - Complete Failure", () => {
    it("should reset interval and repetitions", () => {
      const result = calculateSM2(newState, 0);

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.status).toBe("relearning");
    });

    it("should increment lapses", () => {
      const result = calculateSM2(newState, 0);
      expect(result.lapses).toBe(1);
    });

    it("should decrease easiness factor", () => {
      const result = calculateSM2(newState, 0);
      expect(result.easiness_factor).toBe(2.3); // 2.5 - 0.2
    });

    it("should respect minimum easiness factor", () => {
      const lowEFState = { ...newState, easiness_factor: 1.35 };
      const result = calculateSM2(lowEFState, 0);
      expect(result.easiness_factor).toBe(SM2_CONSTANTS.MIN_EASINESS_FACTOR);
    });
  });

  describe("Rating 2 (Good) - Normal Progression", () => {
    it("should set interval to 1 day for first review (rep 0→1)", () => {
      const result = calculateSM2(newState, 2);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe("learning");
    });

    it("should set interval to 6 days for second review (rep 1→2)", () => {
      const learningState: SM2State = { ...newState, repetitions: 1, interval: 1, status: "learning" };
      const result = calculateSM2(learningState, 2);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
      expect(result.status).toBe("review");
    });

    it("should calculate interval using EF for subsequent reviews", () => {
      const reviewState: SM2State = {
        ...newState,
        repetitions: 2,
        interval: 6,
        status: "review",
      };
      const result = calculateSM2(reviewState, 2);
      expect(result.interval).toBe(Math.ceil(6 * 2.5)); // 15 days
      expect(result.repetitions).toBe(3);
    });

    it("should not change easiness factor", () => {
      const result = calculateSM2(newState, 2);
      expect(result.easiness_factor).toBe(2.5);
    });
  });

  describe("Rating 3 (Easy) - Fast Progression", () => {
    it("should set interval to 4 days for first review", () => {
      const result = calculateSM2(newState, 3);
      expect(result.interval).toBe(4);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe("review");
    });

    it("should increase easiness factor", () => {
      const result = calculateSM2(newState, 3);
      expect(result.easiness_factor).toBe(2.65); // 2.5 + 0.15
    });

    it("should respect maximum easiness factor", () => {
      const highEFState = { ...newState, easiness_factor: 2.9 };
      const result = calculateSM2(highEFState, 3);
      expect(result.easiness_factor).toBe(SM2_CONSTANTS.MAX_EASINESS_FACTOR);
    });
  });

  describe("Rating 1 (Hard) - Minimal Progression", () => {
    it("should set interval to 1 day for early reviews", () => {
      const result = calculateSM2(newState, 1);
      expect(result.interval).toBe(1);
    });

    it("should decrease easiness factor", () => {
      const result = calculateSM2(newState, 1);
      expect(result.easiness_factor).toBe(2.35); // 2.5 - 0.15
    });

    it("should transition from new to learning", () => {
      const result = calculateSM2(newState, 1);
      expect(result.status).toBe("learning");
      expect(result.repetitions).toBe(1);
    });
  });

  describe("Next Review Date Calculation", () => {
    it("should calculate correct next review date", () => {
      const result = calculateSM2(newState, 2);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval);

      const diff = Math.abs(result.next_review_date.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000); // Within 1 second
    });

    it("should set immediate review for interval 0", () => {
      const result = calculateSM2(newState, 0);

      const now = new Date();
      const diff = Math.abs(result.next_review_date.getTime() - now.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe("Status Transitions", () => {
    it("should transition: new → learning (rating 1 or 2)", () => {
      const result = calculateSM2(newState, 2);
      expect(result.status).toBe("learning");
    });

    it("should transition: new → review (rating 3)", () => {
      const result = calculateSM2(newState, 3);
      expect(result.status).toBe("review");
    });

    it("should transition: learning → review (rating 2, rep>=2)", () => {
      const learningState: SM2State = { ...newState, repetitions: 1, status: "learning" };
      const result = calculateSM2(learningState, 2);
      expect(result.status).toBe("review");
    });

    it("should transition: any → relearning (rating 0)", () => {
      const reviewState: SM2State = { ...newState, repetitions: 5, status: "review" };
      const result = calculateSM2(reviewState, 0);
      expect(result.status).toBe("relearning");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple failures correctly", () => {
      const state: SM2State = { ...newState };

      // First failure
      const firstFailure = calculateSM2(state, 0);
      expect(firstFailure.lapses).toBe(1);
      expect(firstFailure.easiness_factor).toBeCloseTo(2.3, 2);

      // Second failure
      const secondFailure = calculateSM2(firstFailure, 0);
      expect(secondFailure.lapses).toBe(2);
      expect(secondFailure.easiness_factor).toBeCloseTo(2.1, 2);
    });

    it("should maintain status correctly through learning progression", () => {
      let state: SM2State = { ...newState };

      // First good review
      state = calculateSM2(state, 2);
      expect(state.status).toBe("learning");
      expect(state.repetitions).toBe(1);

      // Second good review
      state = calculateSM2(state, 2);
      expect(state.status).toBe("review");
      expect(state.repetitions).toBe(2);

      // Third good review (still in review)
      state = calculateSM2(state, 2);
      expect(state.status).toBe("review");
      expect(state.repetitions).toBe(3);
    });

    it("should reset properly after failure in review stage", () => {
      const reviewState: SM2State = {
        ...newState,
        repetitions: 5,
        interval: 30,
        status: "review",
      };

      const result = calculateSM2(reviewState, 0);
      expect(result.status).toBe("relearning");
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(0);
    });
  });
});
