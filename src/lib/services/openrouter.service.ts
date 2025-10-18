// src/lib/services/openrouter.service.ts

/**
 * OpenRouter Service
 *
 * Integrates communication with LLM models via OpenRouter API.
 * Enables automatic response generation based on system and user messages,
 * with support for structured JSON responses.
 */

// ------------------------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------------------------

/**
 * Model parameters for controlling LLM behavior
 */
export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
}

/**
 * JSON Schema for structured output
 */
export interface JSONSchema {
  name: string;
  strict?: boolean;
  schema: Record<string, unknown>;
}

/**
 * Chat message role
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * Chat message structure
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * Request payload for OpenRouter API
 */
interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object";
    schema?: JSONSchema;
  };
}

/**
 * API Response from OpenRouter
 */
interface ApiResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Response metadata for monitoring and logging
 */
export interface ResponseMetadata {
  requestId: string;
  model: string;
  finishReason: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  duration: number; // in milliseconds
  timestamp: Date;
}

/**
 * Enhanced response with metadata
 */
export interface EnhancedResponse<T = unknown> {
  data: T;
  metadata: ResponseMetadata;
}

/**
 * Logger callback for monitoring requests and responses
 */
export type LoggerCallback = (level: "info" | "warn" | "error", message: string, data?: unknown) => void;

/**
 * Service initialization options
 */
export interface OpenRouterServiceOptions {
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  logger?: LoggerCallback;
  enableMetrics?: boolean;
  runtime?: {
    env?: {
      OPENROUTER_API_KEY?: string;
    };
  };
}

// ------------------------------------------------------------------------------------------------
// Custom Error Classes
// ------------------------------------------------------------------------------------------------

/**
 * Base error class for OpenRouter service
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Authentication error (invalid API key)
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message = "Authentication failed. Invalid API key.") {
    super(message, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * Rate limit error (API quota exceeded)
 */
export class RateLimitError extends OpenRouterError {
  constructor(message = "Rate limit exceeded. Please try again later.") {
    super(message, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
  }
}

/**
 * Network error (timeout, connection issues)
 */
export class NetworkError extends OpenRouterError {
  constructor(message = "Network error occurred.") {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

/**
 * Validation error (invalid response structure)
 */
export class ValidationError extends OpenRouterError {
  constructor(message = "Response validation failed.") {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

// ------------------------------------------------------------------------------------------------
// OpenRouter Service Class
// ------------------------------------------------------------------------------------------------

/**
 * OpenRouter Service
 *
 * Provides integration with OpenRouter API for LLM interactions.
 */
export class OpenRouterService {
  // Public configuration
  public readonly apiUrl: string;
  public readonly apiKey: string;
  public readonly timeout: number;
  public readonly maxRetries: number;
  public readonly retryDelay: number;
  public readonly enableMetrics: boolean;

  // Private state
  private currentSystemMessage: string | null = null;
  private currentUserMessage: string | null = null;
  private currentResponseFormat: JSONSchema | null = null;
  private currentModelName = "openai/gpt-oss-20b";
  private currentModelParameters: ModelParameters = {
    temperature: 0.7,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  };
  private logger: LoggerCallback | null = null;

  /**
   * Constructor
   *
   * @param options - Service initialization options
   * @throws Error if API key is not provided
   */
  constructor(options: OpenRouterServiceOptions = {}) {
    // Initialize API configuration
    // Support runtime environment variables (Cloudflare) with fallback to build-time (local dev)
    const runtimeApiKey = options.runtime?.env?.OPENROUTER_API_KEY;
    this.apiKey = options.apiKey || runtimeApiKey || import.meta.env.OPENROUTER_API_KEY || "";
    this.apiUrl = options.apiUrl || "https://openrouter.ai/api/v1/chat/completions";
    this.timeout = options.timeout || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    this.enableMetrics = options.enableMetrics ?? true;
    this.logger = options.logger || null;

    // Validate API key
    if (!this.apiKey) {
      throw new Error(
        "OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey in options."
      );
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Public Methods
  // ------------------------------------------------------------------------------------------------

  /**
   * Set system message for the conversation
   *
   * @param message - System message content
   */
  public setSystemMessage(message: string): void {
    this.currentSystemMessage = message;
  }

  /**
   * Set user message for the conversation
   *
   * @param message - User message content
   */
  public setUserMessage(message: string): void {
    this.currentUserMessage = message;
  }

  /**
   * Set response format schema for structured output
   *
   * @param schema - JSON schema for response validation
   */
  public setResponseFormat(schema: JSONSchema): void {
    this.currentResponseFormat = schema;
  }

  /**
   * Set model name and parameters
   *
   * @param name - Model name (e.g., "openai/gpt-4")
   * @param parameters - Model parameters
   */
  public setModel(name: string, parameters?: ModelParameters): void {
    this.currentModelName = name;
    if (parameters) {
      this.currentModelParameters = { ...this.currentModelParameters, ...parameters };
    }
  }

  /**
   * Send chat message to OpenRouter API
   *
   * @param userMessage - User message to send (optional if set via setUserMessage)
   * @returns Parsed response content
   * @throws Error if message is not set or API call fails
   */
  public async sendChatMessage<T = unknown>(userMessage?: string): Promise<T> {
    // Set user message if provided
    if (userMessage !== undefined) {
      this.setUserMessage(userMessage);
    }

    // Validate that user message is set
    if (!this.currentUserMessage) {
      throw new ValidationError("User message is required. Call setUserMessage() or pass userMessage parameter.");
    }

    // Build request payload
    const payload = this.buildRequestPayload();

    // Execute request with retry logic
    const response = await this.executeRequest(payload);

    // Parse and return response
    return this.parseResponse<T>(response);
  }

  /**
   * Send chat message with metadata tracking
   *
   * @param userMessage - User message to send (optional if set via setUserMessage)
   * @returns Enhanced response with data and metadata
   * @throws Error if message is not set or API call fails
   */
  public async sendChatMessageWithMetadata<T = unknown>(userMessage?: string): Promise<EnhancedResponse<T>> {
    const startTime = Date.now();

    try {
      // Set user message if provided
      if (userMessage !== undefined) {
        this.setUserMessage(userMessage);
      }

      // Validate that user message is set
      if (!this.currentUserMessage) {
        throw new ValidationError("User message is required. Call setUserMessage() or pass userMessage parameter.");
      }

      this.log("info", "Sending chat message", {
        model: this.currentModelName,
        hasSystemMessage: !!this.currentSystemMessage,
        userMessageLength: this.currentUserMessage.length,
      });

      // Build request payload
      const payload = this.buildRequestPayload();

      // Execute request with retry logic
      const response = await this.executeRequest(payload);

      // Parse response
      const data = this.parseResponse<T>(response);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Build metadata
      const metadata: ResponseMetadata = {
        requestId: response.id,
        model: response.model,
        finishReason: response.choices[0]?.finish_reason || "unknown",
        duration,
        timestamp: new Date(),
      };

      // Add usage information if available
      if (response.usage) {
        metadata.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      this.log("info", "Chat message completed successfully", {
        duration,
        model: metadata.model,
        usage: metadata.usage,
      });

      return { data, metadata };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log("error", "Chat message failed", {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------------
  // Private Methods
  // ------------------------------------------------------------------------------------------------

  /**
   * Build request payload for OpenRouter API
   *
   * @returns Request payload
   */
  private buildRequestPayload(): RequestPayload {
    const messages: ChatMessage[] = [];

    // Add system message if set
    if (this.currentSystemMessage) {
      messages.push({
        role: "system",
        content: this.currentSystemMessage,
      });
    }

    // Add user message (already validated in calling method)
    if (!this.currentUserMessage) {
      throw new ValidationError("User message is required");
    }

    messages.push({
      role: "user",
      content: this.currentUserMessage,
    });

    const payload: RequestPayload = {
      model: this.currentModelName,
      messages,
      ...this.currentModelParameters,
    };

    // Add response format if set
    if (this.currentResponseFormat) {
      payload.response_format = {
        type: "json_object",
      };
    }

    return payload;
  }

  /**
   * Execute HTTP request to OpenRouter API with retry logic
   *
   * @param payload - Request payload
   * @returns API response
   * @throws Error if request fails after all retries
   */
  private async executeRequest(payload: RequestPayload): Promise<ApiResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.apiKey}`,
              "HTTP-Referer": import.meta.env.SITE || "https://localhost",
              "X-Title": "10xCards",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Handle HTTP errors
          if (!response.ok) {
            await this.handleHttpError(response);
          }

          // Parse and return response
          const data = (await response.json()) as ApiResponse;
          return data;
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        lastError = this.normalizeError(error);

        // Don't retry for authentication or validation errors
        if (lastError instanceof AuthenticationError || lastError instanceof ValidationError) {
          throw lastError;
        }

        // If not the last attempt, wait before retrying
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await this.sleep(delay);
          this.log("warn", `Retrying request (attempt ${attempt + 2}/${this.maxRetries})`, {
            attempt: attempt + 2,
            maxRetries: this.maxRetries,
            delay,
          });
        }
      }
    }

    // All retries failed
    throw lastError || new NetworkError("Request failed after all retry attempts.");
  }

  /**
   * Handle HTTP error responses
   *
   * @param response - HTTP response
   * @throws Specific error based on status code
   */
  private async handleHttpError(response: Response): Promise<never> {
    const status = response.status;
    let errorMessage = `HTTP ${status}: ${response.statusText}`;
    let errorDetails = null;

    // Try to get response body as text first (to avoid consuming it)
    try {
      const bodyText = await response.text();

      // Try to parse as JSON
      try {
        const errorData = JSON.parse(bodyText);
        errorDetails = errorData;
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error) {
          errorMessage = JSON.stringify(errorData.error);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Not valid JSON, use the text as is
        if (bodyText) {
          errorMessage = `${errorMessage} - ${bodyText.substring(0, 200)}`;
        }
      }
    } catch {
      // Could not read response body
    }

    // Log error details for debugging
    this.log("error", "HTTP Error from OpenRouter", {
      status,
      statusText: response.statusText,
      errorMessage,
      errorDetails,
    });

    // Throw specific error based on status code
    if (status === 401 || status === 403) {
      throw new AuthenticationError(errorMessage);
    }

    if (status === 429) {
      throw new RateLimitError(errorMessage);
    }

    if (status >= 500) {
      throw new NetworkError(`Server error: ${errorMessage}`);
    }

    throw new OpenRouterError(errorMessage, `HTTP_${status}`);
  }

  /**
   * Normalize error to OpenRouterError
   *
   * @param error - Error to normalize
   * @returns Normalized error
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof OpenRouterError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for abort/timeout errors
      if (error.name === "AbortError") {
        return new NetworkError("Request timeout.");
      }

      // Check for network errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return new NetworkError(error.message);
      }

      return new OpenRouterError(error.message, "UNKNOWN_ERROR");
    }

    return new OpenRouterError(String(error), "UNKNOWN_ERROR");
  }

  /**
   * Clean and fix common JSON issues in AI responses
   *
   * @param jsonString - Raw JSON string from AI
   * @returns Cleaned JSON string
   */
  private cleanJsonString(jsonString: string): string {
    let cleaned = jsonString.trim();

    // Remove markdown code block delimiters if present
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "");

    // Remove any leading/trailing whitespace again after removing code blocks
    cleaned = cleaned.trim();

    // Try to fix common issues:
    // 1. Remove trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

    // 2. Remove comments (single-line and multi-line)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
    cleaned = cleaned.replace(/\/\/.*/g, "");

    // 3. Replace single quotes with double quotes for property names and values
    // This is tricky and might not work for all cases, but handles common patterns
    // Note: This is a simplified approach and may need refinement
    cleaned = cleaned.replace(/'([^']*)':/g, '"$1":');

    // 4. Fix unquoted property names (e.g., {front: "value"} -> {"front": "value"})
    // This regex looks for word characters followed by a colon that aren't already in quotes
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3');

    return cleaned;
  }

  /**
   * Parse API response
   *
   * @param response - API response
   * @returns Parsed response content
   * @throws ValidationError if response is invalid
   */
  private parseResponse<T>(response: ApiResponse): T {
    // Log the full response for debugging
    this.log("info", "Parsing API response", {
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length || 0,
      responsePreview: JSON.stringify(response).substring(0, 500),
    });

    // Validate response structure
    if (!response.choices || response.choices.length === 0) {
      throw new ValidationError(`Invalid API response: no choices returned. Response: ${JSON.stringify(response)}`);
    }

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new ValidationError(`Invalid API response: no message content. Response: ${JSON.stringify(response)}`);
    }

    // If response format is JSON, parse it
    if (this.currentResponseFormat) {
      try {
        // First, try direct parsing
        return JSON.parse(message.content) as T;
      } catch (firstError) {
        // If direct parsing fails, try cleaning the JSON string
        try {
          const cleaned = this.cleanJsonString(message.content);
          this.log("warn", "JSON parsing required cleaning", {
            originalError: firstError instanceof Error ? firstError.message : String(firstError),
          });
          return JSON.parse(cleaned) as T;
        } catch (secondError) {
          // If cleaning also fails, log both errors and the original content
          this.log("error", "Failed to parse JSON even after cleaning", {
            firstError: firstError instanceof Error ? firstError.message : String(firstError),
            secondError: secondError instanceof Error ? secondError.message : String(secondError),
            contentPreview: message.content.substring(0, 500),
          });

          throw new ValidationError(
            `Failed to parse JSON response: ${secondError instanceof Error ? secondError.message : String(secondError)}\n\nOriginal content preview: ${message.content.substring(0, 200)}...`
          );
        }
      }
    }

    // Return raw content
    return message.content as T;
  }

  /**
   * Sleep utility for retry delays
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log message using configured logger
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Additional data to log
   */
  private log(level: "info" | "warn" | "error", message: string, data?: unknown): void {
    if (this.logger && this.enableMetrics) {
      this.logger(level, message, data);
    }
  }
}

// ------------------------------------------------------------------------------------------------
// Factory Function
// ------------------------------------------------------------------------------------------------

/**
 * Create OpenRouter service instance
 *
 * @param options - Service initialization options
 * @returns OpenRouter service instance
 */
export function createOpenRouterService(options?: OpenRouterServiceOptions): OpenRouterService {
  return new OpenRouterService(options);
}
