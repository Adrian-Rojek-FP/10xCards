// src/pages/api/learning/reset.ts
import type { APIRoute } from "astro";
import { resetLearningProgress } from "../../../lib/services/learning.service";

export const prerender = false;

/**
 * POST /api/learning/reset
 *
 * Resets all learning progress for the authenticated user.
 * All flashcards will be returned to initial state (status='new', EF=2.50, etc.)
 * This allows users to start fresh with all their flashcards.
 *
 * Request Body: None
 *
 * Response (200):
 * {
 *   "message": "Learning progress reset successfully",
 *   "reset_count": number
 * }
 *
 * Error Responses:
 * - 401: Unauthorized
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to reset learning progress",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Reset learning progress
    const result = await resetLearningProgress(supabase, user.id);

    return new Response(
      JSON.stringify({
        message: "Learning progress reset successfully",
        reset_count: result.reset_count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/learning/reset:", error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : "An error occurred while resetting learning progress";

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

