// src/lib/services/learning.service.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  FlashcardWithLearningStateDto,
  LearningSessionResponseDto,
  ReviewSubmitCommand,
  ReviewResponseDto,
  LearningStatsDto,
  ReviewHistoryListResponseDto,
  LearningSessionQueryParams,
  ReviewHistoryQueryParams,
} from "../../types";
import { calculateSM2 } from "./sm2.service";
import { randomUUID } from "node:crypto";

/**
 * Get flashcards due for review (learning session)
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param params - Query parameters (limit, status, include_new)
 * @returns Learning session with flashcards and stats
 */
export async function getLearningSession(
  supabase: SupabaseClient,
  userId: string,
  params: LearningSessionQueryParams
): Promise<LearningSessionResponseDto> {
  const limit = params.limit || 20;
  const includeNew = params.include_new ?? true;

  // Build query for learning_state with flashcards
  let query = supabase
    .from("learning_state")
    .select(
      `
      *,
      flashcards:flashcard_id (
        id,
        front,
        back,
        source,
        generation_id,
        created_at,
        updated_at
      )
    `
    )
    .eq("user_id", userId)
    .lte("next_review_date", new Date().toISOString());

  // Apply status filter if provided
  if (params.status) {
    query = query.eq("status", params.status);
  }

  // Exclude 'new' status if include_new is false
  if (!includeNew) {
    query = query.neq("status", "new");
  }

  // Order by priority: learning/relearning first, then by next_review_date
  query = query
    .order("status", { ascending: false }) // 'review' < 'relearning'
    .order("next_review_date", { ascending: true })
    .limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch learning session: ${error.message}`);
  }

  // Get total counts for stats
  const { count: totalDue } = await supabase
    .from("learning_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lte("next_review_date", new Date().toISOString());

  const { count: newCards } = await supabase
    .from("learning_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "new")
    .lte("next_review_date", new Date().toISOString());

  // Transform data to DTO format
  const flashcards: FlashcardWithLearningStateDto[] =
    data?.map((item) => ({
      id: item.flashcards.id,
      front: item.flashcards.front,
      back: item.flashcards.back,
      source: item.flashcards.source,
      generation_id: item.flashcards.generation_id,
      created_at: item.flashcards.created_at,
      updated_at: item.flashcards.updated_at,
      learning_state: {
        id: item.id,
        flashcard_id: item.flashcard_id,
        status: item.status,
        easiness_factor: item.easiness_factor,
        interval: item.interval,
        repetitions: item.repetitions,
        lapses: item.lapses,
        next_review_date: item.next_review_date,
      },
    })) || [];

  return {
    session_id: randomUUID(),
    flashcards,
    total_due: totalDue || 0,
    new_cards: newCards || 0,
    review_cards: (totalDue || 0) - (newCards || 0),
  };
}

/**
 * Submit a review response and update learning state
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param command - Review submission data
 * @returns Review response with before/after states
 */
export async function submitReview(
  supabase: SupabaseClient,
  userId: string,
  command: ReviewSubmitCommand
): Promise<ReviewResponseDto> {
  // Step 1: Fetch current learning state
  const { data: currentState, error: fetchError } = await supabase
    .from("learning_state")
    .select("*")
    .eq("flashcard_id", command.flashcard_id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !currentState) {
    throw new Error("Learning state not found for this flashcard");
  }

  // Step 2: Calculate new SM-2 state
  const sm2Result = calculateSM2(
    {
      easiness_factor: currentState.easiness_factor,
      interval: currentState.interval,
      repetitions: currentState.repetitions,
      lapses: currentState.lapses,
      status: currentState.status,
    },
    command.rating
  );

  // Step 3: Prepare previous and new states for response
  const previousState = {
    status: currentState.status,
    easiness_factor: currentState.easiness_factor,
    interval: currentState.interval,
    repetitions: currentState.repetitions,
    next_review_date: currentState.next_review_date,
  };

  const newState = {
    status: sm2Result.status,
    easiness_factor: sm2Result.easiness_factor,
    interval: sm2Result.interval,
    repetitions: sm2Result.repetitions,
    next_review_date: sm2Result.next_review_date.toISOString(),
  };

  // Step 4: Update learning_state
  const { error: updateError } = await supabase
    .from("learning_state")
    .update({
      status: sm2Result.status,
      easiness_factor: sm2Result.easiness_factor,
      interval: sm2Result.interval,
      repetitions: sm2Result.repetitions,
      lapses: sm2Result.lapses,
      next_review_date: sm2Result.next_review_date.toISOString(),
    })
    .eq("flashcard_id", command.flashcard_id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Failed to update learning state: ${updateError.message}`);
  }

  // Step 5: Insert review_history (immutable audit log)
  const { error: insertError } = await supabase.from("review_history").insert({
    flashcard_id: command.flashcard_id,
    user_id: userId,
    rating: command.rating,
    review_duration_ms: command.review_duration_ms || null,
    previous_interval: currentState.interval,
    new_interval: sm2Result.interval,
    previous_easiness_factor: currentState.easiness_factor,
    new_easiness_factor: sm2Result.easiness_factor,
    reviewed_at: new Date().toISOString(),
  });

  if (insertError) {
    throw new Error("Failed to record review history");
  }

  return {
    flashcard_id: command.flashcard_id,
    previous_state: previousState,
    new_state: newState,
    review_recorded: true,
  };
}

/**
 * Get learning statistics for user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @returns Learning statistics
 */
export async function getLearningStats(supabase: SupabaseClient, userId: string): Promise<LearningStatsDto> {
  // Get total flashcards count
  const { count: totalFlashcards } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get counts by status
  const { data: statusCounts } = await supabase.from("learning_state").select("status").eq("user_id", userId);

  const byStatus = {
    new: 0,
    learning: 0,
    review: 0,
    relearning: 0,
  };

  statusCounts?.forEach((item) => {
    if (item.status in byStatus) {
      byStatus[item.status as keyof typeof byStatus]++;
    }
  });

  // Get due today count
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dueToday } = await supabase
    .from("learning_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("next_review_date", todayStart.toISOString())
    .lte("next_review_date", today.toISOString());

  // Get overdue count
  const { count: overdue } = await supabase
    .from("learning_state")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .lt("next_review_date", todayStart.toISOString());

  // Calculate retention rate (reviews with rating >= 2 / total reviews)
  const { data: reviewHistory } = await supabase.from("review_history").select("rating").eq("user_id", userId);

  const totalReviews = reviewHistory?.length || 0;
  const successfulReviews = reviewHistory?.filter((r) => r.rating >= 2).length || 0;
  const retentionRate = totalReviews > 0 ? successfulReviews / totalReviews : 0;

  // Get reviews today
  const { count: reviewsToday } = await supabase
    .from("review_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("reviewed_at", todayStart.toISOString());

  // Calculate average easiness factor
  const { data: learningStates } = await supabase
    .from("learning_state")
    .select("easiness_factor")
    .eq("user_id", userId);

  const avgEF = learningStates?.length
    ? learningStates.reduce((sum, ls) => sum + ls.easiness_factor, 0) / learningStates.length
    : 2.5;

  // Calculate streak days (simplified - would need more complex logic for production)
  // For MVP, set to 0 or implement basic version
  const streakDays = 0; // TODO: Implement streak calculation

  return {
    total_flashcards: totalFlashcards || 0,
    by_status: byStatus,
    due_today: dueToday || 0,
    overdue: overdue || 0,
    retention_rate: Math.round(retentionRate * 100) / 100,
    total_reviews: totalReviews,
    reviews_today: reviewsToday || 0,
    average_easiness_factor: Math.round(avgEF * 100) / 100,
    streak_days: streakDays,
  };
}

/**
 * Get review history for user
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param params - Query parameters (pagination, filters)
 * @returns Paginated review history
 */
export async function getReviewHistory(
  supabase: SupabaseClient,
  userId: string,
  params: ReviewHistoryQueryParams
): Promise<ReviewHistoryListResponseDto> {
  const page = params.page || 1;
  const limit = params.limit || 50;

  // Build query
  let query = supabase.from("review_history").select("*", { count: "exact" }).eq("user_id", userId);

  // Apply filters
  if (params.flashcard_id) {
    query = query.eq("flashcard_id", params.flashcard_id);
  }

  if (params.from_date) {
    query = query.gte("reviewed_at", params.from_date);
  }

  if (params.to_date) {
    query = query.lte("reviewed_at", params.to_date);
  }

  // Apply sorting and pagination
  query = query.order("reviewed_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch review history: ${error.message}`);
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  };
}
