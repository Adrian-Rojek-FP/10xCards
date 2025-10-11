// src/lib/services/flashcard.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardCreateDto, FlashcardDto } from "../../types";

/**
 * Creates multiple flashcards in a single batch operation
 *
 * This function:
 * 1. Validates that all generation_ids (if provided) exist in the generations table
 * 2. Validates that all generations belong to the requesting user
 * 3. Performs a batch insert of all flashcards
 * 4. Returns the created flashcards with their assigned IDs
 *
 * @param flashcardsData - Array of flashcard data to create
 * @param userId - The authenticated user's ID
 * @param supabase - Supabase client instance
 * @returns Array of created flashcards with IDs
 * @throws Error if validation fails or database operation fails
 */
export async function createFlashcards(
  flashcardsData: FlashcardCreateDto[],
  userId: string,
  supabase: SupabaseClient
): Promise<FlashcardDto[]> {
  // Step 1: Validate generation_ids if any are provided
  const generationIds = flashcardsData.map((fc) => fc.generation_id).filter((id): id is number => id !== null);

  if (generationIds.length > 0) {
    // Get unique generation IDs
    const uniqueGenerationIds = [...new Set(generationIds)];

    // Check if all generation_ids exist and belong to the user
    const { data: generations, error: generationsError } = await supabase
      .from("generations")
      .select("id, user_id")
      .in("id", uniqueGenerationIds);

    if (generationsError) {
      console.error("Error validating generation_ids:", generationsError);
      throw new Error("Failed to validate generation_ids");
    }

    // Check if all requested generation IDs were found
    if (!generations || generations.length !== uniqueGenerationIds.length) {
      const foundIds = generations?.map((g) => g.id) || [];
      const missingIds = uniqueGenerationIds.filter((id) => !foundIds.includes(id));
      throw new Error(`Generation(s) not found: ${missingIds.join(", ")}`);
    }

    // Check if all generations belong to the current user
    const invalidGenerations = generations.filter((g) => g.user_id !== userId);
    if (invalidGenerations.length > 0) {
      const invalidIds = invalidGenerations.map((g) => g.id);
      throw new Error(`Unauthorized: Generation(s) ${invalidIds.join(", ")} do not belong to the current user`);
    }
  }

  // Step 2: Prepare flashcard records for batch insert
  const flashcardsToInsert = flashcardsData.map((flashcard) => ({
    user_id: userId,
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source,
    generation_id: flashcard.generation_id,
  }));

  // Step 3: Perform batch insert
  const { data: createdFlashcards, error: insertError } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select();

  if (insertError || !createdFlashcards) {
    console.error("Database insert error:", insertError);
    throw new Error("Failed to create flashcards in database");
  }

  // Step 4: Return created flashcards (map to FlashcardDto format)
  return createdFlashcards.map((fc) => ({
    id: fc.id,
    front: fc.front,
    back: fc.back,
    source: fc.source,
    generation_id: fc.generation_id,
    created_at: fc.created_at,
    updated_at: fc.updated_at,
  }));
}
