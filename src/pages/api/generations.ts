// src/pages/api/generations.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerationCreateResponseDto, GenerateFlashcardsCommand } from "../../types";
import { generateFlashcards } from "../../lib/services/generation.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

// Disable prerendering for this API endpoint
export const prerender = false;

// Zod schema for validating the request body
const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Source text must be at least 1000 characters long")
    .max(10000, "Source text must not exceed 10000 characters"),
});

/**
 * POST /api/generations
 *
 * Initiates AI flashcard generation process based on user-provided text.
 *
 * Request Body:
 * - source_text: string (1000-10000 characters)
 *
 * Response (201):
 * - generation_id: number
 * - flashcards_proposals: FlashcardProposalDto[]
 * - generated_count: number
 *
 * Error Responses:
 * - 400: Invalid input data
 * - 500: Server error (AI service failure or database error)
 *
 * Note: Authentication will be added later
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    // Get runtime context for environment variables (Cloudflare)
    const runtime = locals.runtime as { env?: { OPENROUTER_API_KEY?: string } } | undefined;

    // Step 1: Parse and validate request body
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
    const validationResult = GenerateFlashcardsSchema.safeParse(body);

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

    const command: GenerateFlashcardsCommand = validationResult.data;

    // Step 3: Call generation service to process the request
    // TODO: Replace DEFAULT_USER_ID with actual authenticated user ID
    const result: GenerationCreateResponseDto = await generateFlashcards(
      command.source_text,
      DEFAULT_USER_ID,
      supabase,
      runtime // Pass runtime context for Cloudflare environment variables
    );

    // Step 4: Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    console.error("Error in POST /api/generations:", error);

    // Avoid exposing internal error details to the client
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An error occurred while generating flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
