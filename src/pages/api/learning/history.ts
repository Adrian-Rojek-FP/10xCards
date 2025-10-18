// src/pages/api/learning/history.ts
import type { APIRoute } from "astro";
import { getReviewHistory } from "../../../lib/services/learning.service";
import { reviewHistoryQuerySchema } from "../../../lib/validation/learning.validation";

export const prerender = false;

/**
 * GET /api/learning/history
 *
 * Retrieves review history for analytics and progress tracking
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - flashcard_id: number (optional)
 * - from_date: string ISO 8601 (optional)
 * - to_date: string ISO 8601 (optional)
 *
 * Response (200):
 * - data: ReviewHistoryDto[]
 * - pagination: { page, limit, total }
 *
 * Error Responses:
 * - 400: Invalid query parameters
 * - 401: Unauthorized
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
          message: "You must be logged in to view review history",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate query parameters
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      flashcard_id: url.searchParams.get("flashcard_id"),
      from_date: url.searchParams.get("from_date"),
      to_date: url.searchParams.get("to_date"),
    };

    const validationResult = reviewHistoryQuerySchema.safeParse(queryParams);

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

    const { page, limit, flashcard_id, from_date, to_date } = validationResult.data;

    // Fetch review history
    const history = await getReviewHistory(supabase, user.id, {
      page,
      limit,
      flashcard_id,
      from_date,
      to_date,
    });

    // Return successful response
    return new Response(JSON.stringify(history), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/history:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching review history";

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
