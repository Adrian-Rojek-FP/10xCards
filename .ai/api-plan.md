# REST API Plan

## 1. Resources

- **Users**
  - *Database Table*: `users`
  - Managed through Supabase Auth; operations such as registration and login may be handled via Supabase or custom endpoints if needed.

- **Flashcards**
  - *Database Table*: `flashcards`
  - Fields include: `id`, `front`, `back`, `source`, `created_at`, `updated_at`, `generation_id`, `user_id`.

- **Generations**
  - *Database Table*: `generations`
  - Stores metadata and results of AI generation requests (e.g., `model`, `generated_count`, `source_text_hash`, `source_text_length`, `generation_duration`).

- **Generation Error Logs**
  - *Database Table*: `generation_error_logs`
  - Used for logging errors encountered during AI flashcard generation.

- **Learning State**
  - *Database Table*: `learning_state`
  - Stores learning progress for each flashcard using SM-2 (SuperMemo 2) algorithm.
  - Fields include: `id`, `flashcard_id`, `user_id`, `status`, `easiness_factor`, `interval`, `repetitions`, `lapses`, `next_review_date`, `created_at`, `updated_at`.
  - Automatically created via database trigger when a flashcard is inserted.
  - Unique constraint: `(flashcard_id, user_id)` - one learning state per flashcard per user.

- **Review History**
  - *Database Table*: `review_history`
  - Immutable history of all user review sessions for analytics and audit purposes.
  - Fields include: `id`, `flashcard_id`, `user_id`, `rating`, `review_duration_ms`, `previous_interval`, `new_interval`, `previous_easiness_factor`, `new_easiness_factor`, `reviewed_at`.
  - Records cannot be updated or deleted (immutable), only inserted.

## 2. Endpoints

### 2.2. Flashcards

- **GET `/flashcards`**
  - **Description**: Retrieve a paginated, filtered, and sortable list of flashcards for the authenticated user.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 10)
    - `sort` (e.g., `created_at`)
    - `order` (`asc` or `desc`)
    - Optional filters (e.g., `source`, `generation_id`).
  - **Response JSON**:
    ```json
    {
      "data": [
        { "id": 1, "front": "Question", "back": "Answer", "source": "manual", "created_at": "...", "updated_at": "..." }
      ],
      "pagination": { "page": 1, "limit": 10, "total": 100 }
    }
    ```
  - **Errors**: 401 Unauthorized if token is invalid.

- **GET `/flashcards/{id}`**
  - **Description**: Retrieve details for a specific flashcard.
  - **Response JSON**: Flashcard object.
  - **Errors**: 404 Not Found, 401 Unauthorized.

- **POST `/flashcards`**
  - **Description**: Create one or more flashcards (manually or from AI generation).
  - **Request JSON**:
    ```json
    {
      "flashcards": [
        {
          "front": "Question 1",
          "back": "Answer 1",
          "source": "manual",
          "generation_id": null
        },
        {
          "front": "Question 2",
          "back": "Answer 2",
          "source": "ai-full",
          "generation_id": 123
        }
      ]
    }
    ```
  - **Response JSON**:
    ```json
    {
      "flashcards": [
        { "id": 1, "front": "Question 1", "back": "Answer 1", "source": "manual", "generation_id": null },
        { "id": 2, "front": "Question 2", "back": "Answer 2", "source": "ai-full", "generation_id": 123 }
      ]
    }
    ```
  - **Validations**:
    - `front` maximum length: 200 characters.
    - `back` maximum length: 500 characters.
    - `source`: Must be one of `ai-full`, `ai-edited`, or `manual`.
    - `generation_id`: Required for `ai-full` and `ai-edited` sources, must be null for `manual` source.
  - **Errors**: 400 for invalid inputs, including validation errors for any flashcard in the array.

- **PUT `/flashcards/{id}`**
  - **Description**: Edit an existing flashcard.
  - **Request JSON**: Fields to update.
  - **Response JSON**: Updated flashcard object.
  - **Errors**: 400 for invalid input, 404 if flashcard not found, 401 Unauthorized.

- **DELETE `/flashcards/{id}`**
  - **Description**: Delete a flashcard.
  - **Response JSON**: Success message.
  - **Errors**: 404 if flashcard not found, 401 Unauthorized.

### 2.3. Generations

- **POST `/generations`**
  - **Description**: Initiate the AI generation process for flashcards proposals based on user-provided text.
  - **Request JSON**:
    ```json
    {
      "source_text": "User provided text (1000 to 10000 characters)",
    }
    ```
  - **Business Logic**:
    - Validate that `source_text` length is between 1000 and 10000 characters.
    - Call the AI service to generate flashcards proposals.
    - Store the generation metadata and return flashcard proposals to the user.
  - **Response JSON**:
    ```json
    {
      "generation_id": 123,
      "flashcards_proposals": [
         { "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
      ],
      "generated_count": 5
    }
    ```
  - **Errors**:
    - 400: Invalid input.
    - 500: AI service errors (logs recorded in `generation_error_logs`).

- **GET `/generations`**
  - **Description**: Retrieve a list of generation requests for the authenticated user.
  - **Query Parameters**: Supports pagination as needed.
  - **Response JSON**: List of generation objects with metadata.

- **GET `/generations/{id}`**
  - **Description**: Retrieve detailed information of a specific generation including its flashcards.
  - **Response JSON**: Generation details and associated flashcards.
  - **Errors**: 404 Not Found.

### 2.4. Generation Error Logs

*(Typically used internally or by admin users)*

- **GET `/generation-error-logs`**
  - **Description**: Retrieve error logs for AI flashcard generation for the authenticated user or admin.
  - **Response JSON**: List of error log objects.
  - **Errors**:
    - 401 Unauthorized if token is invalid.
    - 403 Forbidden if access is restricted to admin users.

### 2.5. Learning Sessions (Spaced Repetition)

- **GET `/learning/session`**
  - **Description**: Retrieve flashcards that are due for review to start a learning session (US-008).
  - **Query Parameters**:
    - `limit` (default: 20) - Maximum number of flashcards to return for the session.
    - `status` (optional) - Filter by learning status: `new`, `learning`, `review`, `relearning`.
    - `include_new` (default: true) - Whether to include new flashcards (status='new') in the session.
  - **Business Logic**:
    - Query `learning_state` where `next_review_date <= now()` and `user_id = authenticated user`.
    - Order by: `status` (prioritize 'learning' and 'relearning'), then `next_review_date` ASC.
    - Join with `flashcards` table to return complete flashcard data.
    - Apply limit to control session size.
  - **Response JSON**:
    ```json
    {
      "session_id": "generated-session-uuid",
      "flashcards": [
        {
          "id": 1,
          "front": "Question",
          "back": "Answer",
          "source": "manual",
          "learning_state": {
            "status": "learning",
            "easiness_factor": 2.50,
            "interval": 1,
            "repetitions": 0,
            "lapses": 0,
            "next_review_date": "2025-10-17T12:00:00Z"
          }
        }
      ],
      "total_due": 45,
      "new_cards": 10,
      "review_cards": 35
    }
    ```
  - **Errors**:
    - 401 Unauthorized if token is invalid.
    - 404 Not Found if no flashcards are due for review.

- **POST `/learning/review`**
  - **Description**: Submit a review response for a flashcard and update learning progress using SM-2 algorithm.
  - **Request JSON**:
    ```json
    {
      "flashcard_id": 1,
      "rating": 2,
      "review_duration_ms": 3500
    }
    ```
  - **Validations**:
    - `flashcard_id`: Required, must exist and belong to authenticated user.
    - `rating`: Required, must be integer 0-3 (0=again, 1=hard, 2=good, 3=easy).
    - `review_duration_ms`: Optional, positive integer if provided.
  - **Business Logic (SM-2 Algorithm)**:
    1. Fetch current `learning_state` for the flashcard.
    2. Calculate new values based on SM-2:
       - **Rating 0 (again)**: Reset repetitions to 0, set interval to 0, decrease easiness_factor by 0.2, increment lapses, set status to 'relearning'.
       - **Rating 1 (hard)**: Minimal interval increase, slight easiness_factor decrease (-0.15), maintain or adjust status.
       - **Rating 2 (good)**: Normal interval increase using SM-2 formula, standard easiness_factor adjustment, progress status if applicable.
       - **Rating 3 (easy)**: Maximum interval increase, easiness_factor increase (+0.15), progress status if applicable.
    3. Update `learning_state` with new values.
    4. Insert record into `review_history` (immutable audit log).
    5. Calculate `next_review_date` based on new interval.
  - **Response JSON**:
    ```json
    {
      "flashcard_id": 1,
      "previous_state": {
        "status": "learning",
        "easiness_factor": 2.50,
        "interval": 1,
        "repetitions": 0,
        "next_review_date": "2025-10-17T12:00:00Z"
      },
      "new_state": {
        "status": "review",
        "easiness_factor": 2.60,
        "interval": 6,
        "repetitions": 1,
        "next_review_date": "2025-10-24T12:00:00Z"
      },
      "review_recorded": true
    }
    ```
  - **Errors**:
    - 400 Bad Request: Invalid rating value or flashcard_id.
    - 401 Unauthorized: Token is invalid.
    - 404 Not Found: Flashcard does not exist or does not belong to user.

- **GET `/learning/stats`**
  - **Description**: Retrieve learning statistics and progress overview for the authenticated user.
  - **Business Logic**:
    - Aggregate data from `learning_state` grouped by status.
    - Count flashcards due today, overdue, and upcoming.
    - Calculate retention rate from `review_history`.
  - **Response JSON**:
    ```json
    {
      "total_flashcards": 150,
      "by_status": {
        "new": 25,
        "learning": 40,
        "review": 75,
        "relearning": 10
      },
      "due_today": 20,
      "overdue": 5,
      "retention_rate": 0.82,
      "total_reviews": 450,
      "reviews_today": 15,
      "average_easiness_factor": 2.45,
      "streak_days": 7
    }
    ```
  - **Errors**:
    - 401 Unauthorized if token is invalid.

- **GET `/learning/history`**
  - **Description**: Retrieve review history for analytics and progress tracking.
  - **Query Parameters**:
    - `page` (default: 1)
    - `limit` (default: 50)
    - `flashcard_id` (optional) - Filter history for specific flashcard.
    - `from_date` (optional) - Start date for history range.
    - `to_date` (optional) - End date for history range.
  - **Response JSON**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "flashcard_id": 5,
          "rating": 2,
          "review_duration_ms": 3500,
          "previous_interval": 1,
          "new_interval": 6,
          "previous_easiness_factor": 2.50,
          "new_easiness_factor": 2.60,
          "reviewed_at": "2025-10-18T14:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 50,
        "total": 450
      }
    }
    ```
  - **Errors**:
    - 401 Unauthorized if token is invalid.

## 3. Authentication and Authorization

- **Mechanism**: Token-based authentication using Supabase Auth.
- **Process**:
  - Users authenticate via `/auth/login` or `/auth/register`, receiving a bearer token.
  - Protected endpoints require the token in the `Authorization` header.
  - Database-level Row-Level Security (RLS) ensures that users access only records with matching `user_id`.
- **Additional Considerations**: Use HTTPS, rate limiting, and secure error messaging to mitigate security risks.

## 4. Validation and Business Logic

- **Validation Rules**:
  - **Flashcards**:
    - `front`: Maximum length of 200 characters.
    - `back`: Maximum length of 500 characters.
    - `source`: Must be one of `ai-full`, `ai-edited`, or `manual` (ENUM type).
    - `generation_id`: Required for `ai-full` and `ai-edited` sources, must be null for `manual` source.
  - **Generations**:
    - `source_text`: Must have a length between 1000 and 10000 characters.
    - `source_text_hash`: Computed using SHA-256 for duplicate detection.
    - `generation_duration`: Must be positive integer, max 300000 ms (5 minutes).
  - **Learning State**:
    - `status`: Must be one of `new`, `learning`, `review`, `relearning` (ENUM type).
    - `easiness_factor`: Must be between 1.30 and 3.00 (DECIMAL(3,2)).
    - `interval`: Must be non-negative integer (days).
    - `repetitions`: Must be non-negative integer.
    - `lapses`: Must be non-negative integer.
  - **Review History**:
    - `rating`: Must be integer 0-3 (0=again, 1=hard, 2=good, 3=easy).
    - `review_duration_ms`: Optional, must be positive integer if provided.
    - All interval and easiness_factor values must match learning_state constraints.

- **Business Logic Implementation**:
  
  - **AI Generation**:
    - Validate inputs and call the AI service upon POST `/generations`.
    - Record generation metadata (model, generated_count, duration) and send generated flashcards proposals to the user.
    - Log any errors in `generation_error_logs` for auditing and debugging.
  
  - **Flashcard Management**:
    - Automatic update of the `updated_at` field via database triggers when flashcards are modified.
    - Automatic creation of initial `learning_state` via database trigger when flashcard is inserted:
      - `status`: 'new'
      - `easiness_factor`: 2.50
      - `interval`: 0
      - `repetitions`: 0
      - `lapses`: 0
      - `next_review_date`: now() (immediately available)
  
  - **SM-2 Spaced Repetition Algorithm** (POST `/learning/review`):
    
    **Core Formula**:
    ```
    EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    where:
    - EF' = new easiness factor
    - EF = old easiness factor
    - q = quality of response (0-5 scale, we map our 0-3 to this)
    ```
    
    **Implementation Details**:
    
    1. **Rating 0 (Again)** - Complete failure:
       - `repetitions` = 0 (reset)
       - `interval` = 0 (relearn immediately)
       - `easiness_factor` = max(1.30, EF - 0.20)
       - `lapses` = lapses + 1
       - `status` = 'relearning'
       - `next_review_date` = now()
    
    2. **Rating 1 (Hard)** - Difficult recall:
       - If repetitions = 0: `interval` = 1 day
       - If repetitions = 1: `interval` = 1 day
       - If repetitions >= 2: `interval` = ceil(previous_interval * 1.2)
       - `easiness_factor` = max(1.30, EF - 0.15)
       - `repetitions` = repetitions (no change if < 2, else increment)
       - `status` = 'learning' (if was 'new' or 'relearning')
       - `next_review_date` = now() + interval days
    
    3. **Rating 2 (Good)** - Correct recall with effort:
       - If repetitions = 0: `interval` = 1 day
       - If repetitions = 1: `interval` = 6 days
       - If repetitions >= 2: `interval` = ceil(previous_interval * EF)
       - `easiness_factor` = EF (no change)
       - `repetitions` = repetitions + 1
       - `status` = 'review' (if repetitions >= 2), else 'learning'
       - `next_review_date` = now() + interval days
    
    4. **Rating 3 (Easy)** - Perfect recall:
       - If repetitions = 0: `interval` = 4 days
       - If repetitions = 1: `interval` = 10 days
       - If repetitions >= 2: `interval` = ceil(previous_interval * EF * 1.3)
       - `easiness_factor` = min(3.00, EF + 0.15)
       - `repetitions` = repetitions + 1
       - `status` = 'review'
       - `next_review_date` = now() + interval days
    
    **Additional Rules**:
    - Minimum `easiness_factor`: 1.30 (enforced by CHECK constraint)
    - Maximum `easiness_factor`: 3.00 (enforced by CHECK constraint)
    - Minimum `interval`: 0 (same day review)
    - Maximum `interval`: No hard limit, but practically capped at ~365 days in MVP
    - Status transitions: new → learning → review ↔ relearning
    
  - **Review History Recording**:
    - Every review creates an immutable record in `review_history`.
    - Captures both previous and new state for complete audit trail.
    - Optional `review_duration_ms` for performance analytics.
    - Records cannot be modified or deleted (except via CASCADE on user/flashcard deletion).
  
  - **Generation Accepted Counts**:
    - Automatic update via database trigger when flashcards are inserted.
    - `accepted_unedited_count` increments when `source = 'ai-full'`.
    - `accepted_edited_count` increments when `source = 'ai-edited'`.
    - Used for analytics and quality metrics (US-006 success metrics).

## 5. Additional Implementation Notes

### 5.1. Database Triggers Impact on API

The following database triggers affect API responses and behavior:

1. **`create_initial_learning_state` trigger** (flashcards table):
   - Automatically creates a `learning_state` record when a flashcard is inserted.
   - POST `/flashcards` response could optionally include the created `learning_state` data.
   - Ensures data consistency - every flashcard always has a learning state.

2. **`update_generation_accepted_counts` trigger** (flashcards table):
   - Automatically increments counters in `generations` table when flashcards are saved.
   - Affects GET `/generations/{id}` response - counts are always current.
   - No additional API logic needed for analytics tracking.

3. **`update_updated_at_column` trigger** (multiple tables):
   - Automatically updates `updated_at` timestamp on every UPDATE operation.
   - API doesn't need to handle timestamp updates manually.
   - Applies to: `flashcards`, `learning_state`, `generations`.

### 5.2. Response Format Considerations

- **POST `/flashcards` Extended Response** (optional enhancement):
  ```json
  {
    "flashcards": [
      {
        "id": 1,
        "front": "Question",
        "back": "Answer",
        "source": "manual",
        "generation_id": null,
        "created_at": "2025-10-18T12:00:00Z",
        "learning_state": {
          "status": "new",
          "next_review_date": "2025-10-18T12:00:00Z"
        }
      }
    ]
  }
  ```
  Including `learning_state` in response provides complete data without additional GET request.

### 5.3. Error Handling Best Practices

- **Immutable Tables** (`review_history`, `generation_error_logs`):
  - Return 405 Method Not Allowed for UPDATE/DELETE attempts.
  - Clear error messages: "Review history is immutable and cannot be modified."

- **SM-2 Algorithm Errors**:
  - Handle edge cases: missing learning_state, concurrent updates.
  - Use database transactions for review submissions to ensure data consistency.
  - Rollback on failure to prevent partial state updates.

- **Rate Limiting Considerations**:
  - POST `/generations`: Expensive AI calls, consider rate limit (e.g., 10/hour per user).
  - POST `/learning/review`: High frequency, light limit (e.g., 1000/hour per user).
  - GET endpoints: Standard rate limits (e.g., 100/minute per user).

### 5.4. Performance Optimization

- **GET `/learning/session` Optimization**:
  - Leverage composite index: `idx_learning_state_next_review` on `(user_id, next_review_date, status)`.
  - Consider caching session data for 1-5 minutes to reduce database load.
  - Pre-fetch flashcard content in single JOIN query, not N+1 queries.

- **GET `/learning/stats` Optimization**:
  - Expensive aggregation query, consider caching for 5-15 minutes.
  - Could use materialized view in future for better performance.
  - Query complexity: O(n) where n = user's total flashcards.

- **POST `/learning/review` Transaction**:
  - Must be atomic: UPDATE learning_state + INSERT review_history.
  - Use database transaction to ensure consistency.
  - Consider optimistic locking if concurrent reviews are possible.

### 5.5. GDPR and Data Privacy

All endpoints respect Row-Level Security (RLS) policies:

- **Learning State**: Users can only access their own learning progress.
- **Review History**: Immutable audit trail, users can read but not modify.
- **Data Deletion**: Deleting user account cascades to all related data:
  - flashcards → learning_state (CASCADE)
  - flashcards → review_history (CASCADE)
  - generations, generation_error_logs (CASCADE)

### 5.6. Future API Enhancements (Post-MVP)

Not included in current plan but worth considering:

- **PATCH `/flashcards/{id}`**: Partial updates instead of full PUT.
- **POST `/learning/session/complete`**: Mark session as complete, track session stats.
- **GET `/learning/calendar`**: Heatmap data for study streaks and activity.
- **GET `/flashcards/search`**: Full-text search by keywords.
- **POST `/flashcards/import`**: Bulk import from various formats.
- **GET `/generations/deduplicate`**: Check if text was already processed before generation.
- **WebSocket `/learning/live`**: Real-time session updates for potential multiplayer features.

### 5.7. API Versioning Strategy

For MVP, no versioning needed. Future considerations:

- URL versioning: `/api/v1/flashcards`, `/api/v2/flashcards`
- Header versioning: `Accept: application/vnd.10xcards.v1+json`
- Deprecation policy: Support v1 for 12 months after v2 release

### 5.8. Testing Considerations

Key test scenarios for new endpoints:

- **Learning Session Flow**:
  1. Create flashcards → Verify learning_state created automatically
  2. GET `/learning/session` → Verify new flashcards appear
  3. POST `/learning/review` with each rating (0-3) → Verify SM-2 calculations
  4. Verify next_review_date updates correctly
  5. Verify review_history records created

- **Edge Cases**:
  - Review non-existent flashcard (404)
  - Review another user's flashcard (403)
  - Invalid rating values (-1, 4, "abc")
  - Concurrent reviews of same flashcard
  - Session with no due flashcards (404 or empty array)

- **Performance Tests**:
  - GET `/learning/session` with 10,000+ user flashcards
  - Bulk review submission (sequential POST `/learning/review`)
  - Stats calculation with large review_history

### 5.9. Monitoring and Observability

Recommended metrics to track:

- **Learning Engagement**:
  - Daily active reviewers
  - Average reviews per session
  - Review completion rate
  - Distribution of ratings (0-3)

- **SM-2 Algorithm Performance**:
  - Average retention rate by interval
  - Distribution of easiness_factors
  - Lapse rate (% of "again" ratings)
  - Optimal interval accuracy

- **API Performance**:
  - Response times for `/learning/session` (p50, p95, p99)
  - Transaction time for `/learning/review`
  - Cache hit rate for stats endpoints

- **Error Tracking**:
  - Failed review submissions
  - Missing learning_state errors
  - Algorithm calculation errors
