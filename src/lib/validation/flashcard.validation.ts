// src/lib/validation/flashcard.validation.ts
import { z } from "zod";

/**
 * Zod schema for validating a single flashcard creation request
 *
 * Validation rules:
 * - front: maximum 200 characters, required
 * - back: maximum 500 characters, required
 * - source: must be one of "ai-full", "ai-edited", or "manual"
 * - generation_id: required (not null) for "ai-full" and "ai-edited", must be null for "manual"
 */
export const flashcardCreateSchema = z
  .object({
    front: z.string().min(1, "Front side cannot be empty").max(200, "Front side must not exceed 200 characters"),
    back: z.string().min(1, "Back side cannot be empty").max(500, "Back side must not exceed 500 characters"),
    source: z.enum(["ai-full", "ai-edited", "manual"], {
      errorMap: () => ({ message: "Source must be one of: ai-full, ai-edited, manual" }),
    }),
    generation_id: z.number().nullable(),
  })
  .refine(
    (data) => {
      // For "ai-full" and "ai-edited", generation_id must be a number (not null)
      if (data.source === "ai-full" || data.source === "ai-edited") {
        return data.generation_id !== null;
      }
      return true;
    },
    {
      message: "generation_id is required for source types 'ai-full' and 'ai-edited'",
      path: ["generation_id"],
    }
  )
  .refine(
    (data) => {
      // For "manual", generation_id must be null
      if (data.source === "manual") {
        return data.generation_id === null;
      }
      return true;
    },
    {
      message: "generation_id must be null for source type 'manual'",
      path: ["generation_id"],
    }
  );

/**
 * Zod schema for validating bulk flashcard creation request body
 * Expects an array of flashcards (1-100 items)
 */
export const flashcardsCreateSchema = z.object({
  flashcards: z
    .array(flashcardCreateSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot create more than 100 flashcards at once"),
});

/**
 * Zod schema for validating flashcard update request
 * All fields are optional, but at least one must be provided
 *
 * Validation rules:
 * - At least one field must be present
 * - If source is changed to "manual", generation_id must be null
 * - If source is changed to "ai-full" or "ai-edited", generation_id is required
 */
export const flashcardUpdateSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front side cannot be empty")
      .max(200, "Front side must not exceed 200 characters")
      .optional(),
    back: z
      .string()
      .min(1, "Back side cannot be empty")
      .max(500, "Back side must not exceed 500 characters")
      .optional(),
    source: z.enum(["ai-full", "ai-edited", "manual"]).optional(),
    generation_id: z.number().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      // If both source and generation_id are provided, validate their relationship
      if (data.source !== undefined && data.generation_id !== undefined) {
        // Manual source requires null generation_id
        if (data.source === "manual" && data.generation_id !== null) {
          return false;
        }
        // AI sources require non-null generation_id
        if ((data.source === "ai-full" || data.source === "ai-edited") && data.generation_id === null) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Invalid combination of source and generation_id",
    }
  );

/**
 * Zod schema for validating flashcard ID in path parameters
 */
export const flashcardIdSchema = z.coerce.number().int().positive({
  message: "Flashcard ID must be a positive integer",
});

/**
 * Zod schema for validating query parameters for GET /api/flashcards
 * All parameters are optional with sensible defaults
 */
export const flashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").catch(1),
  limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").catch(10),
  sort: z.enum(["created_at", "updated_at", "front", "back"]).catch("created_at"),
  order: z.enum(["asc", "desc"]).catch("desc"),
  source: z.enum(["ai-full", "ai-edited", "manual"]).nullish(),
  generation_id: z.coerce.number().int().positive().nullish(),
});
