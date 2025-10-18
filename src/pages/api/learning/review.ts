// src/pages/api/learning/review.ts
import type { APIRoute } from "astro";
import { submitReview } from "../../../lib/services/learning.service";
import { reviewSubmitSchema } from "../../../lib/validation/learning.validation";
import type { ReviewSubmitCommand } from "../../../types";

export const prerender = false;

/**
 * POST /api/learning/review
 *
 * Submits a review response for a flashcard and updates learning progress
 *
 * Request Body:
 * - flashcard_id: number (required)
 * - rating: 0 | 1 | 2 | 3 (required) - 0=again, 1=hard, 2=good, 3=easy
 * - review_duration_ms: number (optional)
 *
 * Response (200):
 * - flashcard_id: number
 * - previous_state: LearningState
 * - new_state: LearningState
 * - review_recorded: boolean
 *
 * Error Responses:
 * - 400: Invalid request data
 * - 401: Unauthorized
 * - 404: Flashcard not found
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to submit reviews",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
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

    // Validate request data
    const validationResult = reviewSubmitSchema.safeParse(body);

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

    const command: ReviewSubmitCommand = validationResult.data;

    // Submit review
    const result = await submitReview(supabase, user.id, command);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/learning/review:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while submitting review";

    // Check for specific error types
    if (errorMessage.includes("not found")) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: errorMessage,
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
