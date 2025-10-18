import { useState, useEffect, useCallback } from "react";
import type {
  FlashcardDto,
  FlashcardViewModel,
  FlashcardsListResponseDto,
  FlashcardCreateDto,
  FlashcardUpdateDto,
  PaginationDto,
} from "@/types";

interface QueryParams {
  page: number;
  limit: number;
}

interface UseFlashcardsResult {
  flashcards: FlashcardViewModel[];
  pagination: PaginationDto | null;
  isLoading: boolean;
  error: Error | null;
  fetchFlashcards: (params?: Partial<QueryParams>) => Promise<void>;
  createFlashcard: (data: FlashcardCreateDto) => Promise<void>;
  updateFlashcard: (id: number, data: FlashcardUpdateDto) => Promise<void>;
  deleteFlashcard: (id: number) => Promise<void>;
  setPage: (page: number) => void;
}

/**
 * Custom hook for managing flashcards data and API interactions.
 * Provides centralized state management and API calls for the flashcards view.
 */
export function useFlashcards(): UseFlashcardsResult {
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 12,
  });

  /**
   * Converts FlashcardDto to FlashcardViewModel
   */
  const mapDtoToViewModel = useCallback((dto: FlashcardDto): FlashcardViewModel => {
    return {
      id: dto.id,
      front: dto.front,
      back: dto.back,
      source: dto.source as "ai-full" | "ai-edited" | "manual",
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }, []);

  /**
   * Fetches flashcards from the API
   */
  const fetchFlashcards = useCallback(
    async (params?: Partial<QueryParams>) => {
      setIsLoading(true);
      setError(null);

      try {
        const currentParams = { ...queryParams, ...params };
        const searchParams = new URLSearchParams({
          page: currentParams.page.toString(),
          limit: currentParams.limit.toString(),
        });

        const response = await fetch(`/api/flashcards?${searchParams}`);

        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
        }

        const data: FlashcardsListResponseDto = await response.json();
        setFlashcards(data.data.map(mapDtoToViewModel));
        setPagination(data.pagination);

        // Update query params if they were changed
        if (params) {
          setQueryParams(currentParams);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [queryParams, mapDtoToViewModel]
  );

  /**
   * Creates a new flashcard
   */
  const createFlashcard = useCallback(
    async (data: FlashcardCreateDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ flashcards: [data] }),
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to create flashcard: ${response.statusText}`);
        }

        // Refresh the flashcards list
        await fetchFlashcards();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error; // Re-throw to allow component to handle
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Updates an existing flashcard
   */
  const updateFlashcard = useCallback(
    async (id: number, data: FlashcardUpdateDto) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to update flashcard: ${response.statusText}`);
        }

        // Refresh the flashcards list
        await fetchFlashcards();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Deletes a flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to delete flashcard: ${response.statusText}`);
        }

        // Refresh the flashcards list
        await fetchFlashcards();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFlashcards]
  );

  /**
   * Changes the current page
   */
  const setPage = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  // Fetch flashcards on mount and when query params change
  useEffect(() => {
    const loadFlashcards = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const searchParams = new URLSearchParams({
          page: queryParams.page.toString(),
          limit: queryParams.limit.toString(),
        });

        const response = await fetch(`/api/flashcards?${searchParams}`);

        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
        }

        const data: FlashcardsListResponseDto = await response.json();
        setFlashcards(data.data.map(mapDtoToViewModel));
        setPagination(data.pagination);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadFlashcards();
  }, [queryParams.page, queryParams.limit, mapDtoToViewModel]);

  return {
    flashcards,
    pagination,
    isLoading,
    error,
    fetchFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    setPage,
  };
}
