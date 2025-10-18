// src/lib/validation/learning.validation.ts
import { z } from "zod";

/**
 * Zod schema for GET /learning/session query parameters
 */
export const learningSessionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).catch(20),
  status: z.enum(["new", "learning", "review", "relearning"]).nullable().optional(),
  include_new: z
    .union([z.literal("true"), z.literal("false"), z.literal(null)])
    .transform((val) => {
      if (val === null) return true; // Default to true when not provided
      return val === "true"; // Convert string "true"/"false" to boolean
    }),
});

/**
 * Zod schema for POST /learning/review request body
 */
export const reviewSubmitSchema = z.object({
  flashcard_id: z.number().int().positive({
    message: "flashcard_id must be a positive integer",
  }),
  rating: z.number().int().min(0).max(3, {
    message: "rating must be between 0 and 3 (0=again, 1=hard, 2=good, 3=easy)",
  }),
  review_duration_ms: z.number().int().positive().optional(),
});

/**
 * Zod schema for GET /learning/history query parameters
 */
export const reviewHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(100).catch(50),
  flashcard_id: z.coerce.number().int().positive().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
});

/**
 * Type exports for convenience
 */
export type LearningSessionQuery = z.infer<typeof learningSessionQuerySchema>;
export type ReviewSubmit = z.infer<typeof reviewSubmitSchema>;
export type ReviewHistoryQuery = z.infer<typeof reviewHistoryQuerySchema>;
