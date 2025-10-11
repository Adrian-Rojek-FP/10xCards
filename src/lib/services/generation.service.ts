// src/lib/services/generation.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerationCreateResponseDto, FlashcardProposalDto } from "../../types";
import crypto from "crypto";
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
 * @returns Array of generated flashcard proposals
 * @throws Error if AI service fails
 */
async function aiServiceGenerateFlashcards(sourceText: string): Promise<FlashcardProposalDto[]> {
  try {
    // Create OpenRouter service instance
    const openRouter = createOpenRouterService({
      enableMetrics: true,
    });

    // Configure model and parameters
    // "openai/gpt-4o-mini"
    openRouter.setModel("openai/gpt-oss-20b", {
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

    // Map response to FlashcardProposalDto format
    const flashcardProposals: FlashcardProposalDto[] = response.flashcards.map((card) => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const,
    }));

    return flashcardProposals;
  } catch (error) {
    // Log error details
    console.error("AI service error:", error);

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to generate flashcards: ${error.message}`);
    }

    throw new Error("Failed to generate flashcards: Unknown error");
  }
}

/**
 * Calculate SHA-256 hash of the source text
 */
function calculateHash(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * Generate flashcards from source text using AI service
 *
 * @param sourceText - The input text (1000-10000 characters)
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Generation response with flashcard proposals
 * @throws Error if AI service fails or database operation fails
 */
export async function generateFlashcards(
  sourceText: string,
  userId: string,
  supabase: SupabaseClient
): Promise<GenerationCreateResponseDto> {
  const startTime = Date.now();

  try {
    // Step 1: Call AI service to generate flashcard proposals
    const flashcardsProposals = await aiServiceGenerateFlashcards(sourceText);
    const generatedCount = flashcardsProposals.length;

    // Step 2: Calculate generation metadata
    const endTime = Date.now();
    const generationDuration = endTime - startTime;
    const sourceTextHash = calculateHash(sourceText);
    const sourceTextLength = sourceText.length;

    // Step 3: Save generation metadata to database
    const { data: generationData, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        //model: "openai/gpt-4o-mini",
        model: "openai/gpt-oss-20b",
        generated_count: generatedCount,
        source_text_hash: sourceTextHash,
        source_text_length: sourceTextLength,
        generation_duration: generationDuration,
      })
      .select()
      .single();

    if (insertError || !generationData) {
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
    const sourceTextHash = calculateHash(sourceText);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = "AI_SERVICE_ERROR"; // Could be more specific based on error type

    try {
      await supabase.from("generation_error_logs").insert({
        user_id: userId,
        error_code: errorCode,
        error_message: errorMessage,
        // "openai/gpt-4o-mini"
        model: "openai/gpt-oss-20b",
        source_text_hash: sourceTextHash,
        source_text_length: sourceText.length,
      });
    } catch (logError) {
      console.error("Failed to log generation error:", logError);
    }

    // Re-throw the original error
    throw error;
  }
}
