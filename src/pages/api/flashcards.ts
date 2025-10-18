// src/pages/api/flashcards.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { FlashcardsCreateCommand, FlashcardDto } from "../../types";
import { createFlashcards } from "../../lib/services/flashcard.service";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * Zod schema for validating a single flashcard creation request
 *
 * Validation rules:
 * - front: maximum 200 characters
 * - back: maximum 500 characters
 * - source: must be one of "ai-full", "ai-edited", or "manual"
 * - generation_id: required (not null) for "ai-full" and "ai-edited", must be null for "manual"
 */
const FlashcardCreateSchema = z
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
 * Zod schema for validating the complete request body
 * Expects an array of flashcards
 */
const FlashcardsCreateCommandSchema = z.object({
  flashcards: z
    .array(FlashcardCreateSchema)
    .min(1, "At least one flashcard is required")
    .max(100, "Cannot create more than 100 flashcards at once"),
});

/**
 * POST /api/flashcards
 *
 * Creates one or more flashcards. Supports both manually created and AI-generated flashcards.
 *
 * Request Body:
 * - flashcards: FlashcardCreateDto[] (array of flashcard objects)
 *   Each flashcard must contain:
 *   - front: string (max 200 characters)
 *   - back: string (max 500 characters)
 *   - source: "ai-full" | "ai-edited" | "manual"
 *   - generation_id: number | null (required for ai-full/ai-edited, null for manual)
 *
 * Response (201):
 * - flashcards: FlashcardDto[] (array of created flashcards with IDs)
 *
 * Error Responses:
 * - 400: Invalid input data (validation errors)
 * - 401: Unauthorized (user not authenticated)
 * - 500: Server error (database error)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to create flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Validate input data using Zod schema
    const validationResult = FlashcardsCreateCommandSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid request data",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: FlashcardsCreateCommand = validationResult.data;

    // Step 3: Call flashcard service to create the flashcards
    const createdFlashcards: FlashcardDto[] = await createFlashcards(command.flashcards, user.id, supabase);

    // Step 4: Return successful response
    return new Response(
      JSON.stringify({
        flashcards: createdFlashcards,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Step 5: Handle unexpected errors
    console.error("Error in POST /api/flashcards:", error);

    // Check if error is related to generation_id validation
    const errorMessage = error instanceof Error ? error.message : "An error occurred while creating flashcards";

    // Return appropriate error based on error type
    if (errorMessage.includes("generation") || errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Invalid generation_id",
          message: errorMessage,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Avoid exposing internal error details to the client
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An error occurred while creating flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
