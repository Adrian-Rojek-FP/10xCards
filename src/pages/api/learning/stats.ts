// src/pages/api/learning/stats.ts
import type { APIRoute } from "astro";
import { getLearningStats } from "../../../lib/services/learning.service";

export const prerender = false;

/**
 * GET /api/learning/stats
 *
 * Retrieves learning statistics and progress overview for the authenticated user
 *
 * Response (200):
 * - total_flashcards: number
 * - by_status: { new, learning, review, relearning }
 * - due_today: number
 * - overdue: number
 * - retention_rate: number (0.0 - 1.0)
 * - total_reviews: number
 * - reviews_today: number
 * - average_easiness_factor: number
 * - streak_days: number
 *
 * Error Responses:
 * - 401: Unauthorized
 * - 500: Server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to view learning stats",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch learning stats
    const stats = await getLearningStats(supabase, user.id);

    // Return successful response
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/learning/stats:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred while fetching learning stats";

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
