// src/pages/api/learning/session.ts
import type { APIRoute } from "astro";
import { getLearningSession } from "../../../lib/services/learning.service";
import { learningSessionQuerySchema } from "../../../lib/validation/learning.validation";

export const prerender = false;

/**
 * GET /api/learning/session
 *
 * Retrieves flashcards due for review to start a learning session
 *
 * Query Parameters:
 * - limit: number (default: 20, max: 100)
 * - status: 'new' | 'learning' | 'review' | 'relearning' (optional)
 * - include_new: boolean (default: true)
 *
 * Response (200):
 * - session_id: string (UUID)
 * - flashcards: FlashcardWithLearningStateDto[]
 * - total_due: number
 * - new_cards: number
 * - review_cards: number
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
 * - 404: No flashcards due for review
 * - 500: Server error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to access learning sessions",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit"),
      status: url.searchParams.get("status"),
      include_new: url.searchParams.get("include_new"),
    };

    const validationResult = learningSessionQuerySchema.safeParse(queryParams);

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

    const { limit, status, include_new } = validationResult.data;

    // Fetch learning session
    const session = await getLearningSession(supabase, user.id, {
      limit,
      status,
      include_new,
    });

    // Check if any flashcards are due
    if (session.flashcards.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No flashcards due",
          message: "No flashcards are currently due for review",
          session_id: session.session_id,
          total_due: session.total_due,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return successful response
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/session:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching learning session";

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
