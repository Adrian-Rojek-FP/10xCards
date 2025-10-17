// tests/unit/generation.service.test.ts
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { generateFlashcards } from "../../src/lib/services/generation.service";
import type { SupabaseClient } from "../../src/db/supabase.client";
import type { FlashcardProposalDto } from "../../src/types";

// Create mock functions at module level
const mockSendChatMessage = vi.fn();
const mockSetModel = vi.fn();
const mockSetSystemMessage = vi.fn();
const mockSetResponseFormat = vi.fn();

// Mock OpenRouter service at the top level
vi.mock("../../src/lib/services/openrouter.service", () => ({
  createOpenRouterService: vi.fn(() => ({
    sendChatMessage: mockSendChatMessage,
    setModel: mockSetModel,
    setSystemMessage: mockSetSystemMessage,
    setResponseFormat: mockSetResponseFormat,
  })),
}));

// Mock crypto module for hash calculation
vi.mock("crypto", () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "mocked-hash-value"),
    })),
  },
}));

describe("generation.service", () => {
  let mockSupabase: SupabaseClient;
  let mockFrom: Mock;
  let mockInsert: Mock;
  let mockSelect: Mock;
  let mockSingle: Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup Supabase mock chain
    mockSingle = vi.fn();
    mockSelect = vi.fn(() => ({ single: mockSingle }));
    mockInsert = vi.fn(() => ({ select: mockSelect }));
    mockFrom = vi.fn(() => ({ insert: mockInsert }));

    mockSupabase = {
      from: mockFrom,
    } as unknown as SupabaseClient;

    // Mock console methods to avoid cluttering test output
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, "log").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("generateFlashcards - Successful Generation", () => {
    it("should successfully generate flashcards and save to database", async () => {
      // Arrange
      const sourceText = "Test content about biology and cells";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [
          { front: "What is a cell?", back: "The basic unit of life" },
          { front: "What is DNA?", back: "Deoxyribonucleic acid" },
        ],
      };

      const mockGenerationData = {
        id: "gen-456",
        user_id: userId,
        model: "openai/gpt-4o-mini",
        generated_count: 2,
        source_text_hash: "mocked-hash-value",
        source_text_length: sourceText.length,
        generation_duration: expect.any(Number),
      };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result).toEqual({
        generation_id: "gen-456",
        flashcards_proposals: [
          { front: "What is a cell?", back: "The basic unit of life", source: "ai-full" },
          { front: "What is DNA?", back: "Deoxyribonucleic acid", source: "ai-full" },
        ],
        generated_count: 2,
      });

      expect(mockFrom).toHaveBeenCalledWith("generations");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        model: "openai/gpt-4o-mini",
        generated_count: 2,
        source_text_hash: "mocked-hash-value",
        source_text_length: sourceText.length,
        generation_duration: expect.any(Number),
      });
    });

    it("should handle maximum number of flashcards (10)", async () => {
      // Arrange
      const sourceText = "Long content with multiple concepts";
      const userId = "user-123";

      const mockFlashcards = Array.from({ length: 10 }, (_, i) => ({
        front: `Question ${i + 1}?`,
        back: `Answer ${i + 1}`,
      }));

      const mockAIResponse = { flashcards: mockFlashcards };
      const mockGenerationData = {
        id: "gen-789",
        user_id: userId,
        generated_count: 10,
      };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.generated_count).toBe(10);
      expect(result.flashcards_proposals).toHaveLength(10);
      expect(result.flashcards_proposals[0]).toEqual({
        front: "Question 1?",
        back: "Answer 1",
        source: "ai-full",
      });
    });

    it("should calculate generation duration correctly", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      // Simulate AI service delay
      mockSendChatMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAIResponse), 100))
      );
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      const startTime = Date.now();

      // Act
      await generateFlashcards(sourceText, userId, mockSupabase);

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      // Assert
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.generation_duration).toBeGreaterThanOrEqual(100);
      expect(insertCall.generation_duration).toBeLessThan(actualDuration + 50); // Some tolerance
    });

    it("should handle minimum valid source text", async () => {
      // Arrange
      const sourceText = "A".repeat(1000); // Minimum 1000 characters
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.generated_count).toBe(1);
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.source_text_length).toBe(1000);
    });

    it("should handle maximum valid source text", async () => {
      // Arrange
      const sourceText = "A".repeat(10000); // Maximum 10000 characters
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.generated_count).toBe(1);
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.source_text_length).toBe(10000);
    });
  });

  describe("generateFlashcards - AI Service Errors", () => {
    it("should throw error when AI service returns null response", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockResolvedValue(null);

      // Setup error logging mock
      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to generate flashcards: AI service returned no response"
      );

      // Verify error was logged
      expect(mockErrorInsert).toHaveBeenCalledWith({
        user_id: userId,
        error_code: "AI_SERVICE_ERROR",
        error_message: "Failed to generate flashcards: AI service returned no response",
        model: "openai/gpt-4o-mini",
        source_text_hash: "mocked-hash-value",
        source_text_length: sourceText.length,
      });
    });

    it("should throw error when AI service returns response without flashcards property", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockResolvedValue({ data: "invalid" });

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "AI service returned invalid response structure"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should throw error when AI service returns flashcards as non-array", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockResolvedValue({
        flashcards: "not an array",
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "AI service returned flashcards that is not an array"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should throw error when AI service returns empty flashcards array", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockResolvedValue({
        flashcards: [],
      });

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to generate flashcards: AI service returned no flashcards"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
    });

    it("should throw error when AI service throws network error", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockRejectedValue(new Error("Network timeout"));

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to generate flashcards: Network timeout"
      );

      expect(mockErrorInsert).toHaveBeenCalledWith({
        user_id: userId,
        error_code: "AI_SERVICE_ERROR",
        error_message: "Failed to generate flashcards: Network timeout",
        model: "openai/gpt-4o-mini",
        source_text_hash: "mocked-hash-value",
        source_text_length: sourceText.length,
      });
    });

    it("should handle unknown error from AI service", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockRejectedValue("string error");

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to generate flashcards: Unknown error"
      );

      expect(mockErrorInsert).toHaveBeenCalled();
    });
  });

  describe("generateFlashcards - Database Errors", () => {
    it("should throw error when database insert fails", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to save generation metadata to database"
      );

      expect(console.error).toHaveBeenCalledWith(
        "Database insert error:",
        expect.objectContaining({ message: "Database connection failed" })
      );
    });

    it("should throw error when database insert returns no data", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: null, error: null });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to save generation metadata to database"
      );
    });

    it("should continue if error logging fails", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockRejectedValue(new Error("AI failed"));

      const mockErrorInsert = vi.fn().mockRejectedValue(new Error("Logging failed"));
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act & Assert
      await expect(generateFlashcards(sourceText, userId, mockSupabase)).rejects.toThrow(
        "Failed to generate flashcards: AI failed"
      );

      expect(console.error).toHaveBeenCalledWith("Failed to log generation error:", expect.any(Error));
    });
  });

  describe("generateFlashcards - Response Mapping", () => {
    it("should correctly map AI response to FlashcardProposalDto format", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [
          { front: "Front 1", back: "Back 1" },
          { front: "Front 2", back: "Back 2" },
          { front: "Front 3", back: "Back 3" },
        ],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 3 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.flashcards_proposals).toEqual([
        { front: "Front 1", back: "Back 1", source: "ai-full" },
        { front: "Front 2", back: "Back 2", source: "ai-full" },
        { front: "Front 3", back: "Back 3", source: "ai-full" },
      ]);

      result.flashcards_proposals.forEach((proposal: FlashcardProposalDto) => {
        expect(proposal.source).toBe("ai-full");
        expect(proposal.front).toBeDefined();
        expect(proposal.back).toBeDefined();
      });
    });

    it("should preserve special characters in flashcard content", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [
          {
            front: "What is H₂O?",
            back: "Water molecule: H₂O = 2 hydrogen + 1 oxygen",
          },
          {
            front: 'What does "DNA" stand for?',
            back: "Deoxyribonucleic acid (with quotes & symbols)",
          },
        ],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 2 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.flashcards_proposals[0].front).toBe("What is H₂O?");
      expect(result.flashcards_proposals[0].back).toBe("Water molecule: H₂O = 2 hydrogen + 1 oxygen");
      expect(result.flashcards_proposals[1].front).toBe('What does "DNA" stand for?');
      expect(result.flashcards_proposals[1].back).toBe("Deoxyribonucleic acid (with quotes & symbols)");
    });
  });

  describe("generateFlashcards - Hash Calculation", () => {
    it("should calculate hash for source text", async () => {
      // Arrange
      const crypto = await import("crypto");
      const sourceText = "Test content for hashing";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(crypto.default.createHash).toHaveBeenCalledWith("sha256");
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.source_text_hash).toBe("mocked-hash-value");
    });

    it("should calculate same hash for duplicate source text in error logging", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      mockSendChatMessage.mockRejectedValue(new Error("AI failed"));

      const mockErrorInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockImplementation((table: string) => {
        if (table === "generation_error_logs") {
          return { insert: mockErrorInsert };
        }
        return { insert: mockInsert };
      });

      // Act
      try {
        await generateFlashcards(sourceText, userId, mockSupabase);
      } catch {
        // Expected to throw
      }

      // Assert
      const errorLogCall = mockErrorInsert.mock.calls[0][0];
      expect(errorLogCall.source_text_hash).toBe("mocked-hash-value");
    });
  });

  describe("generateFlashcards - Integration Scenarios", () => {
    it("should handle concurrent generation requests with different users", async () => {
      // Arrange
      const sourceText = "Test content";
      const user1 = "user-111";
      const user2 = "user-222";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle
        .mockResolvedValueOnce({ data: { id: "gen-111", generated_count: 1 }, error: null })
        .mockResolvedValueOnce({ data: { id: "gen-222", generated_count: 1 }, error: null });

      // Act
      const [result1, result2] = await Promise.all([
        generateFlashcards(sourceText, user1, mockSupabase),
        generateFlashcards(sourceText, user2, mockSupabase),
      ]);

      // Assert
      expect(result1.generation_id).toBe("gen-111");
      expect(result2.generation_id).toBe("gen-222");
      expect(mockInsert).toHaveBeenCalledTimes(2);
    });

    it("should use correct model configuration", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.model).toBe("openai/gpt-4o-mini");
    });

    it("should log AI response for debugging", async () => {
      // Arrange
      const sourceText = "Test content";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(console.log).toHaveBeenCalledWith("AI Response:", expect.stringContaining('"flashcards"'));
    });
  });

  describe("generateFlashcards - Edge Cases with Source Text", () => {
    it("should handle source text with unicode characters", async () => {
      // Arrange
      const sourceText = "Příliš žluťoučký kůň úpěl ďábelské ódy 中文字符 🎉";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.generated_count).toBe(1);
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.source_text_length).toBe(sourceText.length);
    });

    it("should handle source text with newlines and whitespace", async () => {
      // Arrange
      const sourceText = "Line 1\n\nLine 2\n   Indented\n\tTabbed";
      const userId = "user-123";

      const mockAIResponse = {
        flashcards: [{ front: "Q?", back: "A" }],
      };

      const mockGenerationData = { id: "gen-123", generated_count: 1 };

      mockSendChatMessage.mockResolvedValue(mockAIResponse);
      mockSingle.mockResolvedValue({ data: mockGenerationData, error: null });

      // Act
      const result = await generateFlashcards(sourceText, userId, mockSupabase);

      // Assert
      expect(result.generated_count).toBe(1);
      // Verify chat message includes formatted text
      expect(mockSendChatMessage).toHaveBeenCalledWith(expect.stringContaining(sourceText));
    });
  });
});
