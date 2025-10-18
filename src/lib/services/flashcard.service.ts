// src/lib/services/flashcard.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardCreateDto,
  FlashcardDto,
  FlashcardsListResponseDto,
  FlashcardUpdateDto,
  Source,
} from "../../types";

/**
 * Helper function to validate that a generation_id belongs to the specified user
 *
 * @param supabase - Supabase client instance
 * @param generationId - The generation ID to validate
 * @param userId - The user ID to check ownership against
 * @returns Promise<boolean> - true if generation belongs to user, false otherwise
 * @throws Error if database query fails
 */
async function validateGenerationOwnership(
  supabase: SupabaseClient,
  generationId: number,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase.from("generations").select("id, user_id").eq("id", generationId).single();

  if (error) {
    throw new Error("Failed to validate generation ownership");
  }

  return data !== null && data.user_id === userId;
}

/**
 * Retrieves a paginated, filtered, and sorted list of flashcards for the authenticated user
 *
 * @param supabase - Supabase client instance
 * @param userId - The authenticated user's ID
 * @param filters - Optional filters (source, generation_id)
 * @param pagination - Pagination params (page, limit)
 * @param sorting - Sorting params (sort field, order)
 * @returns Promise<FlashcardsListResponseDto> - Paginated list with metadata
 * @throws Error if database operation fails
 */
export async function getFlashcards(
  supabase: SupabaseClient,
  userId: string,
  filters: { source?: Source | null | undefined; generation_id?: number | null | undefined },
  pagination: { page: number; limit: number },
  sorting: { sort: string; order: "asc" | "desc" }
): Promise<FlashcardsListResponseDto> {
  // Build base query
  let query = supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId);

  // Apply filters
  if (filters.source) {
    query = query.eq("source", filters.source);
  }
  if (filters.generation_id !== undefined && filters.generation_id !== null) {
    query = query.eq("generation_id", filters.generation_id);
  }

  // Apply sorting
  query = query.order(sorting.sort, { ascending: sorting.order === "asc" });

  // Apply pagination
  const offset = (pagination.page - 1) * pagination.limit;
  query = query.range(offset, offset + pagination.limit - 1);

  // Execute query
  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase error in getFlashcards:", error);
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }

  // Return paginated response
  return {
    data: data || [],
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: count || 0,
    },
  };
}

/**
 * Retrieves a single flashcard by ID
 * RLS ensures that only the owner can access their flashcard
 *
 * @param supabase - Supabase client instance
 * @param id - The flashcard ID
 * @param userId - The authenticated user's ID (used for RLS)
 * @returns Promise<FlashcardDto> - The requested flashcard
 * @throws Error if flashcard not found or database operation fails
 */
export async function getFlashcardById(supabase: SupabaseClient, id: number, userId: string): Promise<FlashcardDto> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new Error("Flashcard not found");
  }

  return data;
}

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

/**
 * Updates an existing flashcard
 * RLS ensures that only the owner can update their flashcard
 *
 * @param supabase - Supabase client instance
 * @param id - The flashcard ID to update
 * @param updates - Partial flashcard data to update
 * @param userId - The authenticated user's ID
 * @returns Promise<FlashcardDto> - The updated flashcard
 * @throws Error if flashcard not found, validation fails, or database operation fails
 */
export async function updateFlashcard(
  supabase: SupabaseClient,
  id: number,
  updates: FlashcardUpdateDto,
  userId: string
): Promise<FlashcardDto> {
  // Step 1: Validate generation_id ownership if provided
  if (updates.generation_id !== undefined && updates.generation_id !== null) {
    const isValid = await validateGenerationOwnership(supabase, updates.generation_id, userId);
    if (!isValid) {
      throw new Error("Generation not found or access denied");
    }
  }

  // Step 2: Perform update (RLS ensures user_id match)
  const { data, error } = await supabase
    .from("flashcards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, front, back, source, generation_id, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error("Flashcard not found");
  }

  return data;
}

/**
 * Deletes a flashcard by ID
 * RLS ensures that only the owner can delete their flashcard
 *
 * @param supabase - Supabase client instance
 * @param id - The flashcard ID to delete
 * @param userId - The authenticated user's ID
 * @returns Promise<void>
 * @throws Error if flashcard not found or database operation fails
 */
export async function deleteFlashcard(supabase: SupabaseClient, id: number, userId: string): Promise<void> {
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error("Failed to delete flashcard");
  }

  // Check if any row was deleted
  if (count === 0) {
    throw new Error("Flashcard not found");
  }
}
