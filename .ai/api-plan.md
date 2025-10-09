# REST API Plan

This document outlines the REST API for the 10x-cards application, designed based on the product requirements, database schema, and technical stack. The API will be implemented using Supabase Edge Functions, which act as the backend, interacting with the Supabase PostgreSQL database and external AI services.

## 1. Resources

-   **Flashcards**: Represents individual flashcards. Corresponds to the `flashcards` table.
-   **Generations**: Represents the process of generating flashcards from a source text using an AI model. Corresponds to the `generations` table.
-   **Learning**: Represents the user's learning session and progress. It doesn't map to a single table but orchestrates interactions between users and flashcards based on a spaced repetition algorithm.
-   **Statistics**: Provides aggregated data about user activity, primarily related to flashcard generation.
-   **Users**: Represents user accounts and data, primarily managed by Supabase Auth but with a dedicated endpoint for data deletion.

## 2. Endpoints

All endpoints are prefixed with `/api` and require authentication unless otherwise specified.

---

### 2.1. Flashcards

#### **GET** `/api/flashcards`

-   **Description**: Retrieves a list of all flashcards for the authenticated user.
-   **Query Parameters**:
    -   `page` (optional, integer, default: 1): For pagination.
    -   `pageSize` (optional, integer, default: 20): Number of items per page.
    -   `sortBy` (optional, string, default: 'created_at'): Field to sort by (e.g., 'created_at', 'updated_at').
    -   `order` (optional, string, default: 'desc'): Sort order ('asc' or 'desc').
-   **Response (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "front": "What is the capital of Poland?",
          "back": "Warsaw",
          "source": "manual",
          "created_at": "2025-10-09T12:00:00Z",
          "updated_at": "2025-10-09T12:00:00Z",
          "generation_id": null
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 100,
        "totalPages": 5
      }
    }
    ```
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

#### **POST** `/api/flashcards`

-   **Description**: Creates a new flashcard (either manually or from an AI generation).
-   **Request Body**:
    ```json
    {
      "front": "What is 2 + 2?",
      "back": "4",
      "source": "manual", // 'manual', 'ai-full', or 'ai-edited'
      "generation_id": null // Optional: ID of the generation process
    }
    ```
-   **Response (201 Created)**:
    ```json
    {
      "id": 2,
      "front": "What is 2 + 2?",
      "back": "4",
      "source": "manual",
      "created_at": "2025-10-09T13:00:00Z",
      "updated_at": "2025-10-09T13:00:00Z",
      "generation_id": null,
      "user_id": "user-uuid-goes-here"
    }
    ```
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., missing fields, `front` > 200 chars, `back` > 500 chars).
    -   `401 Unauthorized`: User is not authenticated.

#### **PUT** `/api/flashcards/{id}`

-   **Description**: Updates an existing flashcard.
-   **Request Body**:
    ```json
    {
      "front": "Updated question?",
      "back": "Updated answer.",
      "source": "ai-edited" // Source might change if an AI card is edited
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "id": 2,
      "front": "Updated question?",
      "back": "Updated answer.",
      "source": "ai-edited",
      "created_at": "2025-10-09T13:00:00Z",
      "updated_at": "2025-10-09T13:05:00Z",
      "generation_id": 1,
      "user_id": "user-uuid-goes-here"
    }
    ```
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed.
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Flashcard with the given ID does not exist or user does not have access.

#### **DELETE** `/api/flashcards/{id}`

-   **Description**: Deletes a specific flashcard.
-   **Response (204 No Content)**: Empty body on successful deletion.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Flashcard with the given ID does not exist or user does not have access.

---

### 2.2. Generations

#### **POST** `/api/generate-flashcards`

-   **Description**: Generates a list of flashcard suggestions from a provided text. This is a long-running operation; the client should handle the asynchronous nature. The response returns the generated cards directly. A `generations` record is created in the background.
-   **Request Body**:
    ```json
    {
      "source_text": "A long piece of text between 1,000 and 10,000 characters...",
      "model": "gpt-4"
    }
    ```
-   **Response (200 OK)**:
    ```json
    {
      "generation_id": 1,
      "generated_flashcards": [
        {
          "front": "Suggested question 1?",
          "back": "Suggested answer 1."
        },
        {
          "front": "Suggested question 2?",
          "back": "Suggested answer 2."
        }
      ]
    }
    ```
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., `source_text` length is out of the 1000-10000 character range).
    -   `401 Unauthorized`: User is not authenticated.
    -   `500 Internal Server Error`: Error communicating with the external LLM API. A `generation_error_logs` record is created.

---

### 2.3. Learning

#### **GET** `/api/learning-session`

-   **Description**: Fetches a set of flashcards for a new learning session, selected by a spaced repetition algorithm.
-   **Response (200 OK)**:
    ```json
    {
      "session_id": "session-uuid",
      "flashcards": [
        {
          "id": 5,
          "front": "Front of the first card to review",
          "back": "Back of the first card to review"
        }
        // ...other cards for the session
      ]
    }
    ```
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: No flashcards are due for review.

#### **POST** `/api/learning-session/responses`

-   **Description**: Submits the user's self-assessed performance for a flashcard in a session. This updates the card's scheduling for future reviews.
-   **Request Body**:
    ```json
    {
      "session_id": "session-uuid",
      "flashcard_id": 5,
      "response_quality": "good" // e.g., 'again', 'hard', 'good', 'easy' - based on the algorithm's needs
    }
    ```
-   **Response (204 No Content)**: Empty body on success.
-   **Error Codes**:
    -   `400 Bad Request`: Invalid input (e.g., missing fields, invalid `response_quality`).
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Session or flashcard not found.

---

### 2.4. Statistics

#### **GET** `/api/statistics`

-   **Description**: Retrieves generation statistics for the authenticated user.
-   **Response (200 OK)**:
    ```json
    {
      "total_generations": 15,
      "total_flashcards_generated": 150,
      "total_flashcards_accepted": 120,
      "acceptance_rate": 0.8
    }
    ```
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

---

### 2.5. Users

#### **DELETE** `/api/users/me`

-   **Description**: Deletes the authenticated user's account and all associated data (flashcards, generation history, etc.) in compliance with GDPR. This action is irreversible.
-   **Response (204 No Content)**: Empty body on successful deletion.
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `500 Internal Server Error`: If data deletion fails partially.

## 3. Authentication and Authorization

-   **Authentication**: The API will use JSON Web Tokens (JWTs) provided by Supabase Auth. The client is responsible for acquiring, storing, and sending the JWT in the `Authorization` header with every request (e.g., `Authorization: Bearer <SUPABASE_JWT>`).
-   **Authorization**: All data access is governed by PostgreSQL's Row-Level Security (RLS) policies, as defined in the database schema. These policies ensure that a user can only access records where the `user_id` column matches their own `auth.uid()`. This is the primary mechanism for preventing unauthorized data access between users.

## 4. Validation and Business Logic

-   **Validation**:
    -   Input validation will be performed at the API level (in the Edge Function) before any database operation.
    -   **Flashcards**:
        -   `front`: Required, string, max 200 characters.
        -   `back`: Required, string, max 500 characters.
        -   `source`: Required, must be one of `ai-full`, `ai-edited`, `manual`.
    -   **Generations**:
        -   `source_text`: Required, string, length between 1000 and 10000 characters.
-   **Business Logic**:
    -   **Flashcard Generation**: The `POST /api/generate-flashcards` endpoint encapsulates the logic of communicating with the external LLM API, creating a `generations` record for statistics, and logging any errors to `generation_error_logs`.
    -   **Statistics**: The `GET /api/statistics` endpoint will aggregate data from the `generations` table for the authenticated user to provide relevant metrics.
    -   **User Deletion**: The `DELETE /api/users/me` endpoint will orchestrate a two-step deletion: first, it will call the Supabase management API to delete the user from the `auth.users` table, and second, it will rely on database `ON DELETE CASCADE` constraints (or a manual cleanup process) to remove all associated data from other tables.
