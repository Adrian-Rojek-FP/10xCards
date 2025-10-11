// src/lib/services/openrouter.service.example.ts

/**
 * Usage examples for OpenRouter Service
 *
 * This file demonstrates various ways to use the OpenRouter service
 * for integrating LLM capabilities into the application.
 */

import { createOpenRouterService, type JSONSchema } from "./openrouter.service";

// ------------------------------------------------------------------------------------------------
// Example 1: Basic Chat Completion
// ------------------------------------------------------------------------------------------------

export async function basicChatExample() {
  // Create service instance
  const openRouter = createOpenRouterService();

  // Set system message to define behavior
  openRouter.setSystemMessage("You are a helpful assistant that provides concise answers.");

  // Send user message and get response
  const response = await openRouter.sendChatMessage<string>("What is the capital of France?");

  console.log("Response:", response);
  return response;
}

// ------------------------------------------------------------------------------------------------
// Example 2: Structured JSON Output
// ------------------------------------------------------------------------------------------------

export async function structuredOutputExample() {
  const openRouter = createOpenRouterService();

  // Define JSON schema for response
  const flashcardSchema: JSONSchema = {
    name: "flashcard_generation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                description: "The question or front side of the flashcard",
              },
              back: {
                type: "string",
                description: "The answer or back side of the flashcard",
              },
            },
            required: ["front", "back"],
          },
        },
      },
      required: ["flashcards"],
    },
  };

  // Set response format
  openRouter.setResponseFormat(flashcardSchema);

  // Set system message for flashcard generation
  openRouter.setSystemMessage(
    "You are an expert at creating educational flashcards. " +
      "Generate flashcards based on the provided text. " +
      "Each flashcard should have a clear question and a concise answer."
  );

  // Send source text
  const sourceText = `
    The French Revolution was a period of radical political and societal change in France 
    that began with the Estates General of 1789 and ended with the formation of the French 
    Consulate in November 1799. Many of its ideas are considered fundamental principles of 
    liberal democracy.
  `;

  interface FlashcardResponse {
    flashcards: {
      front: string;
      back: string;
    }[];
  }

  const response = await openRouter.sendChatMessage<FlashcardResponse>(
    `Generate 3 flashcards from this text:\n\n${sourceText}`
  );

  console.log("Generated flashcards:", response.flashcards);
  return response;
}

// ------------------------------------------------------------------------------------------------
// Example 3: Custom Model Configuration
// ------------------------------------------------------------------------------------------------

export async function customModelExample() {
  const openRouter = createOpenRouterService();

  // Set specific model with custom parameters
  openRouter.setModel("openai/gpt-4", {
    temperature: 0.3, // Lower temperature for more focused responses
    top_p: 0.9,
    max_tokens: 1000,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  });

  openRouter.setSystemMessage("You are a professional educator.");

  const response = await openRouter.sendChatMessage<string>("Explain quantum entanglement in simple terms.");

  return response;
}

// ------------------------------------------------------------------------------------------------
// Example 4: Error Handling
// ------------------------------------------------------------------------------------------------

export async function errorHandlingExample() {
  const openRouter = createOpenRouterService();

  try {
    const response = await openRouter.sendChatMessage<string>("Hello!");
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error occurred: ${error.name} - ${error.message}`);

      // Handle specific error types
      switch (error.name) {
        case "AuthenticationError":
          console.error("Invalid API key. Please check your credentials.");
          break;
        case "RateLimitError":
          console.error("Rate limit exceeded. Please try again later.");
          break;
        case "NetworkError":
          console.error("Network issue. Please check your connection.");
          break;
        case "ValidationError":
          console.error("Invalid request or response format.");
          break;
        default:
          console.error("Unexpected error occurred.");
      }
    }
    throw error;
  }
}

// ------------------------------------------------------------------------------------------------
// Example 5: Reusable Service with State Management
// ------------------------------------------------------------------------------------------------

export class FlashcardGenerationService {
  private openRouter;

  constructor() {
    this.openRouter = createOpenRouterService();

    // Set up default configuration
    this.openRouter.setModel("openai/gpt-3.5-turbo", {
      temperature: 0.7,
      max_tokens: 2000,
    });

    this.openRouter.setSystemMessage(
      "You are an expert at creating educational flashcards. " +
        "Generate clear, concise flashcards that help students learn effectively. " +
        "Each flashcard should have a focused question and a comprehensive answer."
    );

    // Define response schema
    const schema: JSONSchema = {
      name: "flashcard_generation",
      strict: true,
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
            },
          },
        },
        required: ["flashcards"],
      },
    };

    this.openRouter.setResponseFormat(schema);
  }

  async generateFlashcards(sourceText: string): Promise<{ front: string; back: string }[]> {
    interface Response {
      flashcards: { front: string; back: string }[];
    }

    const response = await this.openRouter.sendChatMessage<Response>(
      `Generate flashcards from this text:\n\n${sourceText}`
    );

    return response.flashcards;
  }
}

// ------------------------------------------------------------------------------------------------
// Example 6: Using Metadata and Monitoring
// ------------------------------------------------------------------------------------------------

export async function metadataExample() {
  // Create service with custom logger
  const openRouter = createOpenRouterService({
    enableMetrics: true,
    logger: (level, message, data) => {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
    },
  });

  openRouter.setSystemMessage("You are a helpful assistant.");

  // Use sendChatMessageWithMetadata to get response metadata
  const response = await openRouter.sendChatMessageWithMetadata<string>("What is TypeScript?");

  console.log("Response:", response.data);
  console.log("Metadata:", {
    requestId: response.metadata.requestId,
    model: response.metadata.model,
    duration: `${response.metadata.duration}ms`,
    tokenUsage: response.metadata.usage,
    finishReason: response.metadata.finishReason,
    timestamp: response.metadata.timestamp,
  });

  return response;
}
