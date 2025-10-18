// src/types.ts
import type { Database } from "./db/database.types";

// ------------------------------------------------------------------------------------------------
// Aliases for base database types extracted from the Database model definitions
// ------------------------------------------------------------------------------------------------
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLog = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// ------------------------------------------------------------------------------------------------
// 1. Flashcard DTO
//    Represents a flashcard as returned by the API endpoints (GET /flashcards, GET /flashcards/{id})
// ------------------------------------------------------------------------------------------------
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// ------------------------------------------------------------------------------------------------
// 2. Pagination DTO
//    Contains pagination details used in list responses
// ------------------------------------------------------------------------------------------------
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

// ------------------------------------------------------------------------------------------------
// 3. Flashcards List Response DTO
//    Combines an array of flashcards with pagination metadata (GET /flashcards)
// ------------------------------------------------------------------------------------------------
export interface FlashcardsListResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

// ------------------------------------------------------------------------------------------------
// 4. Flashcard Create DTO & Command Model
//    Used in the POST /flashcards endpoint to create one or more flashcards.
//    Validation rules:
//      - front: maximum length 200 characters
//      - back: maximum length 500 characters
//      - source: must be one of "ai-full", "ai-edited", or "manual"
//      - generation_id: required for "ai-full" and "ai-edited", must be null for "manual"
// ------------------------------------------------------------------------------------------------
export type Source = "ai-full" | "ai-edited" | "manual";

export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: Source;
  generation_id: number | null;
}

export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// ------------------------------------------------------------------------------------------------
// 5. Flashcard Update DTO (Command Model)
//    For the PUT /flashcards/{id} endpoint to update existing flashcards.
//    This model is a partial update of flashcard fields.
// ------------------------------------------------------------------------------------------------
export type FlashcardUpdateDto = Partial<{
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  generation_id: number | null;
}>;

// ------------------------------------------------------------------------------------------------
// 6. Generate Flashcards Command
//    Used in the POST /generations endpoint to initiate the AI flashcard generation process.
//    The "source_text" must be between 1000 and 10000 characters.
// ------------------------------------------------------------------------------------------------
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// ------------------------------------------------------------------------------------------------
// 7. Flashcard Proposal DTO
//    Represents a single flashcard proposal generated from AI, always with source "ai-full".
// ------------------------------------------------------------------------------------------------
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: "ai-full";
}

// ------------------------------------------------------------------------------------------------
// 8. Generation Create Response DTO
//    This type describes the response from the POST /generations endpoint.
// ------------------------------------------------------------------------------------------------
export interface GenerationCreateResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}

// ------------------------------------------------------------------------------------------------
// 9. Generation Detail DTO
//    Provides detailed information for a generation request (GET /generations/{id}),
//    including metadata from the generations table and optionally, the associated flashcards.
// ------------------------------------------------------------------------------------------------
export type GenerationDetailDto = Generation & {
  flashcards?: FlashcardDto[];
};

// ------------------------------------------------------------------------------------------------
// 10. Generation Error Log DTO
//     Represents an error log entry for the AI flashcard generation process (GET /generation-error-logs).
// ------------------------------------------------------------------------------------------------
export type GenerationErrorLogDto = Pick<
  GenerationErrorLog,
  "id" | "error_code" | "error_message" | "model" | "source_text_hash" | "source_text_length" | "created_at" | "user_id"
>;

// ------------------------------------------------------------------------------------------------
// 11. Flashcard Proposal View Model
//     Extended model for flashcard proposals with UI state (accepted, edited flags).
//     Used in the frontend to manage the state of flashcard proposals before saving.
// ------------------------------------------------------------------------------------------------
export interface FlashcardProposalViewModel {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  accepted: boolean;
  edited: boolean;
}

// ------------------------------------------------------------------------------------------------
// 12. Flashcard View Model
//     View model for flashcards in the "My Flashcards" view.
//     Converts database DTOs to UI-friendly format with Date objects.
// ------------------------------------------------------------------------------------------------
export interface FlashcardViewModel {
  id: number;
  front: string;
  back: string;
  source: "ai-full" | "ai-edited" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

// ------------------------------------------------------------------------------------------------
// Learning System Types - Base Database Aliases
// ------------------------------------------------------------------------------------------------
export type LearningState = Database["public"]["Tables"]["learning_state"]["Row"];
export type LearningStateInsert = Database["public"]["Tables"]["learning_state"]["Insert"];
export type LearningStateUpdate = Database["public"]["Tables"]["learning_state"]["Update"];

export type ReviewHistory = Database["public"]["Tables"]["review_history"]["Row"];
export type ReviewHistoryInsert = Database["public"]["Tables"]["review_history"]["Insert"];

// ------------------------------------------------------------------------------------------------
// Learning System Enums
// ------------------------------------------------------------------------------------------------
export type FlashcardSource = Database["public"]["Enums"]["flashcard_source"];
export type LearningStatus = Database["public"]["Enums"]["learning_status"];
export type ReviewRating = Database["public"]["Enums"]["review_rating"];

// Rating as integer (0-3) for API and calculations
export type RatingValue = 0 | 1 | 2 | 3;

// Mapping between rating names and values
export const RATING_MAP = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 3,
} as const;

// ------------------------------------------------------------------------------------------------
// 13. Learning State DTO
//     Represents learning state as returned by the API
// ------------------------------------------------------------------------------------------------
export type LearningStateDto = Pick<
  LearningState,
  "id" | "flashcard_id" | "status" | "easiness_factor" | "interval" | "repetitions" | "lapses" | "next_review_date"
>;

// ------------------------------------------------------------------------------------------------
// 14. Flashcard with Learning State DTO
//     Extended flashcard DTO that includes learning state (used in GET /learning/session)
// ------------------------------------------------------------------------------------------------
export interface FlashcardWithLearningStateDto extends FlashcardDto {
  learning_state: LearningStateDto;
}

// ------------------------------------------------------------------------------------------------
// 15. Learning Session Response DTO
//     Response from GET /learning/session endpoint
// ------------------------------------------------------------------------------------------------
export interface LearningSessionResponseDto {
  session_id: string; // Generated UUID for tracking
  flashcards: FlashcardWithLearningStateDto[];
  total_due: number;
  new_cards: number;
  review_cards: number;
}

// ------------------------------------------------------------------------------------------------
// 16. Review Submit Command
//     Request body for POST /learning/review endpoint
// ------------------------------------------------------------------------------------------------
export interface ReviewSubmitCommand {
  flashcard_id: number;
  rating: RatingValue;
  review_duration_ms?: number;
}

// ------------------------------------------------------------------------------------------------
// 17. Review Response DTO
//     Response from POST /learning/review endpoint
// ------------------------------------------------------------------------------------------------
export interface ReviewResponseDto {
  flashcard_id: number;
  previous_state: {
    status: LearningStatus;
    easiness_factor: number;
    interval: number;
    repetitions: number;
    next_review_date: string;
  };
  new_state: {
    status: LearningStatus;
    easiness_factor: number;
    interval: number;
    repetitions: number;
    next_review_date: string;
  };
  review_recorded: boolean;
}

// ------------------------------------------------------------------------------------------------
// 18. Learning Stats DTO
//     Response from GET /learning/stats endpoint
// ------------------------------------------------------------------------------------------------
export interface LearningStatsDto {
  total_flashcards: number;
  by_status: {
    new: number;
    learning: number;
    review: number;
    relearning: number;
  };
  due_today: number;
  overdue: number;
  retention_rate: number; // 0.0 - 1.0
  total_reviews: number;
  reviews_today: number;
  average_easiness_factor: number;
  streak_days: number;
}

// ------------------------------------------------------------------------------------------------
// 19. Review History DTO
//     Represents a review history entry as returned by the API
// ------------------------------------------------------------------------------------------------
export type ReviewHistoryDto = Pick<
  ReviewHistory,
  | "id"
  | "flashcard_id"
  | "rating"
  | "review_duration_ms"
  | "previous_interval"
  | "new_interval"
  | "previous_easiness_factor"
  | "new_easiness_factor"
  | "reviewed_at"
>;

// ------------------------------------------------------------------------------------------------
// 20. Review History List Response DTO
//     Paginated list of review history entries (GET /learning/history)
// ------------------------------------------------------------------------------------------------
export interface ReviewHistoryListResponseDto {
  data: ReviewHistoryDto[];
  pagination: PaginationDto;
}

// ------------------------------------------------------------------------------------------------
// 21. Learning Session Query Params
//     Query parameters for GET /learning/session
// ------------------------------------------------------------------------------------------------
export interface LearningSessionQueryParams {
  limit?: number;
  status?: LearningStatus | null;
  include_new?: boolean;
}

// ------------------------------------------------------------------------------------------------
// 22. Review History Query Params
//     Query parameters for GET /learning/history
// ------------------------------------------------------------------------------------------------
export interface ReviewHistoryQueryParams {
  page?: number;
  limit?: number;
  flashcard_id?: number;
  from_date?: string; // ISO 8601
  to_date?: string; // ISO 8601
}

// ------------------------------------------------------------------------------------------------
// 23. Reset Learning Progress Response DTO
//     Response from POST /learning/reset endpoint
// ------------------------------------------------------------------------------------------------
export interface ResetLearningProgressResponseDto {
  message: string;
  reset_count: number;
}
