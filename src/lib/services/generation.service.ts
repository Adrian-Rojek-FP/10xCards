// src/lib/services/generation.service.ts
import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { GenerationCreateResponseDto, FlashcardProposalDto } from "../../types";
import { createOpenRouterService, type JSONSchema } from "./openrouter.service";

/**
 * JSON Schema for flashcard generation response
 */
const FLASHCARD_GENERATION_SCHEMA: JSONSchema = {
  name: "flashcard_generation",
  strict: true,
  schema: {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        description: "Array of generated flashcards",
        items: {
          type: "object",
          properties: {
            front: {
              type: "string",
              description: "The question or front side of the flashcard (max 200 characters)",
              maxLength: 200,
            },
            back: {
              type: "string",
              description: "The answer or back side of the flashcard (max 500 characters)",
              maxLength: 500,
            },
          },
          required: ["front", "back"],
          additionalProperties: false,
        },
      },
    },
    required: ["flashcards"],
    additionalProperties: false,
  },
};

/**
 * System message for flashcard generation
 */
const FLASHCARD_GENERATION_SYSTEM_MESSAGE = `You are an expert educational content creator specializing in creating effective flashcards for active learning.

Your task is to analyze the provided text and generate high-quality flashcards that:
1. Focus on key concepts, definitions, and important facts
2. Have clear, focused questions on the front
3. Provide comprehensive but concise answers on the back
4. Cover different aspects of the material (concepts, definitions, relationships, examples)
5. Are suitable for spaced repetition learning

Guidelines:
- Front side: Keep questions clear and specific (max 200 characters)
- Back side: Provide complete answers with context (max 500 characters)
- Generate 5-10 flashcards depending on content length and complexity
- Avoid yes/no questions; prefer "what", "how", "why" questions
- Each flashcard should be self-contained and test one specific piece of knowledge

Return your response as a JSON object with a "flashcards" array containing objects with "front" and "back" properties.`;

/**
 * Generate flashcards using OpenRouter AI service
 *
 * @param sourceText - The input text to generate flashcards from
 * @param runtime - Optional runtime context with environment variables
 * @returns Array of generated flashcard proposals
 * @throws Error if AI service fails
 */
async function aiServiceGenerateFlashcards(
  sourceText: string,
  runtime?: { env?: { OPENROUTER_API_KEY?: string } }
): Promise<FlashcardProposalDto[]> {
  try {
    // Create OpenRouter service instance with logging
    const openRouter = createOpenRouterService({
      enableMetrics: true,
      runtime, // Pass runtime context for Cloudflare environment variables
      logger: (level, message, data) => {
        // eslint-disable-next-line no-console
        console.log(`[OpenRouter ${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
      },
    });

    // Configure model and parameters
    // Using gpt-4o-mini for better reliability with structured JSON output
    openRouter.setModel("openai/gpt-4o-mini", {
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Set system message
    openRouter.setSystemMessage(FLASHCARD_GENERATION_SYSTEM_MESSAGE);

    // Set response format schema
    openRouter.setResponseFormat(FLASHCARD_GENERATION_SCHEMA);

    // Generate flashcards
    const userMessage = `Generate flashcards from the following text:\n\n${sourceText}`;

    interface AIResponse {
      flashcards: {
        front: string;
        back: string;
      }[];
    }

    const response = await openRouter.sendChatMessage<AIResponse>(userMessage);

    // Log response for debugging
    // eslint-disable-next-line no-console
    console.log("AI Response:", JSON.stringify(response, null, 2));

    // Validate response structure
    if (!response) {
      throw new Error("AI service returned no response");
    }

    if (!response.flashcards) {
      throw new Error(`AI service returned invalid response structure. Response: ${JSON.stringify(response)}`);
    }

    if (!Array.isArray(response.flashcards)) {
      throw new Error(
        `AI service returned flashcards that is not an array. Type: ${typeof response.flashcards}, Value: ${JSON.stringify(response.flashcards)}`
      );
    }

    if (response.flashcards.length === 0) {
      throw new Error("AI service returned no flashcards");
    }

    // Map response to FlashcardProposalDto format
    const flashcardProposals: FlashcardProposalDto[] = response.flashcards.map((card) => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const,
    }));

    return flashcardProposals;
  } catch (error) {
    // Log error details
    // eslint-disable-next-line no-console
    console.error("AI service error:", error);

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to generate flashcards: ${error.message}`);
    }

    throw new Error("Failed to generate flashcards: Unknown error");
  }
}

/**
 * Calculate SHA-256 hash of the source text using Web Crypto API
 * Compatible with Cloudflare Workers
 */
async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Generate flashcards from source text using AI service
 *
 * @param sourceText - The input text (1000-10000 characters)
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @param runtime - Optional runtime context with environment variables (for Cloudflare)
 * @returns Generation response with flashcard proposals
 * @throws Error if AI service fails or database operation fails
 */
export async function generateFlashcards(
  sourceText: string,
  userId: string,
  supabase: SupabaseClientType<Database>,
  runtime?: { env?: { OPENROUTER_API_KEY?: string } }
): Promise<GenerationCreateResponseDto> {
  const startTime = Date.now();

  try {
    // Step 1: Call AI service to generate flashcard proposals
    const flashcardsProposals = await aiServiceGenerateFlashcards(sourceText, runtime);
    const generatedCount = flashcardsProposals.length;

    // Step 2: Calculate generation metadata
    const endTime = Date.now();
    const generationDuration = endTime - startTime;
    const sourceTextHash = await calculateHash(sourceText);
    const sourceTextLength = sourceText.length;

    // Step 3: Save generation metadata to database
    const { data: generationData, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        model: "openai/gpt-4o-mini",
        generated_count: generatedCount,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generation_duration: generationDuration,
      })
      .select()
      .single();

    if (insertError || !generationData) {
      // eslint-disable-next-line no-console
      console.error("Database insert error:", insertError);
      throw new Error("Failed to save generation metadata to database");
    }

    // Step 4: Return response with generation ID and flashcard proposals
    return {
      generation_id: generationData.id,
      flashcards_proposals: flashcardsProposals,
      generated_count: generatedCount,
    };
  } catch (error) {
    // Step 5: Log error to generation_error_logs table
    const sourceTextHash = await calculateHash(sourceText);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = "AI_SERVICE_ERROR"; // Could be more specific based on error type

    try {
      await supabase.from("generation_error_logs").insert({
        user_id: userId,
        error_code: errorCode,
        error_message: errorMessage,
        model: "openai/gpt-4o-mini",
        source_text_hash: sourceTextHash,
        source_text_length: sourceText.length,
      });
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", logError);
    }

    // Re-throw the original error
    throw error;
  }
}
