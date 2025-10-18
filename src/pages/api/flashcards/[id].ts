// src/pages/api/flashcards/[id].ts
import type { APIRoute } from "astro";
import type { FlashcardDto, FlashcardUpdateDto } from "../../../types";
import { getFlashcardById, updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcard.service";
import { flashcardIdSchema, flashcardUpdateSchema } from "../../../lib/validation/flashcard.validation";

// Disable prerendering for this API endpoint
export const prerender = false;

/**
 * GET /api/flashcards/{id}
 *
 * Retrieves a single flashcard by ID
 * RLS ensures only the owner can access their flashcard
 *
 * Path Parameters:
 * - id: number (required) - The flashcard ID
 *
 * Response (200):
 * - FlashcardDto (single flashcard object)
 *
 * Error Responses:
 * - 400: Invalid flashcard ID
 * - 401: Unauthorized (user not authenticated)
 * - 404: Flashcard not found
 * - 500: Server error
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Step 1: Validate flashcard ID from path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      const errors = idValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid flashcard ID",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Step 2: Fetch flashcard from service
    const flashcard: FlashcardDto = await getFlashcardById(supabase, flashcardId, user.id);

    // Step 3: Return successful response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards/{id}:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching flashcard";

    // Check if it's a not found error
    if (errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
 * PUT /api/flashcards/{id}
 *
 * Updates an existing flashcard
 * RLS ensures only the owner can update their flashcard
 *
 * Path Parameters:
 * - id: number (required) - The flashcard ID to update
 *
 * Request Body (all fields optional, at least one required):
 * - front: string (max 200 characters)
 * - back: string (max 500 characters)
 * - source: "ai-full" | "ai-edited" | "manual"
 * - generation_id: number | null
 *
 * Response (200):
 * - FlashcardDto (updated flashcard object)
 *
 * Error Responses:
 * - 400: Invalid input data or flashcard ID
 * - 401: Unauthorized (user not authenticated)
 * - 403: Forbidden (invalid generation_id ownership)
 * - 404: Flashcard not found
 * - 500: Server error
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to update flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Validate flashcard ID from path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      const errors = idValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid flashcard ID",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Step 2: Parse request body
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

    // Step 3: Validate update data using Zod schema
    const validationResult = flashcardUpdateSchema.safeParse(body);

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

    const updates: FlashcardUpdateDto = validationResult.data;

    // Step 4: Call service to update the flashcard
    const updatedFlashcard: FlashcardDto = await updateFlashcard(supabase, flashcardId, updates, user.id);

    // Step 5: Return successful response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PUT /api/flashcards/{id}:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while updating flashcard";

    // Check for specific error types
    if (errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (errorMessage.includes("access denied") || errorMessage.includes("Generation not found")) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: errorMessage,
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An error occurred while updating flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/flashcards/{id}
 *
 * Deletes a flashcard by ID
 * RLS ensures only the owner can delete their flashcard
 *
 * Path Parameters:
 * - id: number (required) - The flashcard ID to delete
 *
 * Response (200):
 * - message: string
 * - id: number (the deleted flashcard ID)
 *
 * Error Responses:
 * - 400: Invalid flashcard ID
 * - 401: Unauthorized (user not authenticated)
 * - 404: Flashcard not found
 * - 500: Server error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to delete flashcards",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Validate flashcard ID from path parameter
    const idValidation = flashcardIdSchema.safeParse(params.id);

    if (!idValidation.success) {
      const errors = idValidation.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Invalid flashcard ID",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const flashcardId = idValidation.data;

    // Step 2: Call service to delete the flashcard
    await deleteFlashcard(supabase, flashcardId, user.id);

    // Step 3: Return successful response
    return new Response(
      JSON.stringify({
        message: "Flashcard deleted successfully",
        id: flashcardId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in DELETE /api/flashcards/{id}:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while deleting flashcard";

    // Check if it's a not found error
    if (errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An error occurred while deleting flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

