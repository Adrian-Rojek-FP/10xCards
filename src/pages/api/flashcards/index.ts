// src/pages/api/flashcards/index.ts
import type { APIRoute } from "astro";
import type { FlashcardsCreateCommand, FlashcardDto } from "../../../types";
import { createFlashcards, getFlashcards } from "../../../lib/services/flashcard.service";
import { flashcardsCreateSchema, flashcardsQuerySchema } from "../../../lib/validation/flashcard.validation";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated, filtered, and sorted list of flashcards for the authenticated user
 *
 * Query Parameters:
 * - page: number (default: 1) - Page number for pagination
 * - limit: number (default: 10, max: 100) - Number of items per page
 * - sort: string (default: "created_at") - Field to sort by (created_at, updated_at, front, back)
 * - order: string (default: "desc") - Sort order (asc, desc)
 * - source: string (optional) - Filter by source type (ai-full, ai-edited, manual)
 * - generation_id: number (optional) - Filter by generation ID
 *
 * Response (200):
 * - data: FlashcardDto[] (array of flashcards)
 * - pagination: { page, limit, total }
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized (user not authenticated)
 * - 500: Server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to view flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Extract and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      sort: url.searchParams.get("sort"),
      order: url.searchParams.get("order"),
      source: url.searchParams.get("source"),
      generation_id: url.searchParams.get("generation_id"),
    };

    const validationResult = flashcardsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid query parameters",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit, sort, order, source, generation_id } = validationResult.data;

    // Step 2: Call service to fetch flashcards
    const result = await getFlashcards(supabase, user.id, { source, generation_id }, { page, limit }, { sort, order });

    // Step 3: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching flashcards";

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

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
    const validationResult = flashcardsCreateSchema.safeParse(body);

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
