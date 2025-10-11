# Sample Request Bodies

This directory contains example JSON request bodies for testing the API endpoints.

## Files

### ✅ Valid Requests

1. **`sample-generation-minimal.json`** (~1,150 characters)
   - Meets minimum requirement (1,000 chars)
   - Content: TypeScript overview
   - Use for testing minimum valid input

2. **`sample-generation-request.json`** (~2,473 characters)
   - Mid-range example
   - Content: JavaScript overview
   - Use for standard testing

### ❌ Invalid Request

3. **`sample-generation-invalid.json`** (~90 characters)
   - **WILL FAIL** validation (< 1,000 chars)
   - Use for testing error handling
   - Expected response: `400 Bad Request`

## Usage Examples

### Using cURL (Windows PowerShell)

```powershell
# Valid request (mid-range)
curl -X POST http://localhost:3000/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-request.json"

# Valid request (minimal)
curl -X POST http://localhost:3000/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-minimal.json"

# Invalid request (will return 400 error)
curl -X POST http://localhost:3000/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-invalid.json"
```

### Using cURL (Linux/macOS)

```bash
# Valid request
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d @examples/sample-generation-request.json

# Invalid request
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d @examples/sample-generation-invalid.json
```

### Using Fetch API (JavaScript)

```javascript
// Valid request
const response = await fetch('http://localhost:3000/api/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source_text: "Your learning material here... (1000-10000 characters)"
  })
});

const data = await response.json();
console.log(data);
```

### Using Postman or Thunder Client

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/generations`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body**: 
   - Select "raw" and "JSON"
   - Copy contents from any example file

## Expected Responses

### Success (201 Created)

```json
{
  "generation_id": 123,
  "flashcards_proposals": [
    {
      "front": "What is the main concept discussed in the text?",
      "back": "Based on the provided source text, this is a generated answer from AI.",
      "source": "ai-full"
    },
    // ... more flashcards
  ],
  "generated_count": 5
}
```

### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "message": "Invalid request data",
  "details": [
    {
      "field": "source_text",
      "message": "Source text must be at least 1000 characters long"
    }
  ]
}
```

### Invalid JSON (400 Bad Request)

```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "An error occurred while generating flashcards"
}
```

## Validation Rules

- **`source_text`** (required):
  - Type: `string`
  - Minimum length: **1,000 characters**
  - Maximum length: **10,000 characters**
  - Content: Any text you want to generate flashcards from

## Tips

- Use educational content, articles, or study materials as `source_text`
- The AI will analyze the text and generate question-answer flashcard pairs
- Longer, well-structured content typically produces better flashcards
- Current implementation uses a mock AI service (returns 5 sample cards)

---

# Sample Request Bodies for POST /api/flashcards

This section contains example JSON request bodies for testing the `/api/flashcards` endpoint.

## Files

### ✅ Valid Requests

1. **`flashcards-manual-minimal.json`**
   - Single manually created flashcard
   - Use for testing minimum valid input
   - Source: `manual` with `generation_id: null`

2. **`flashcards-manual-multiple.json`**
   - Multiple manually created flashcards
   - Use for testing batch creation
   - All cards have source: `manual` with `generation_id: null`

3. **`flashcards-ai-generated.json`**
   - Flashcards directly from AI generation (not edited)
   - Source: `ai-full` with valid `generation_id`
   - Use for testing AI-generated cards acceptance

4. **`flashcards-ai-edited.json`**
   - AI-generated flashcards that were edited by user
   - Source: `ai-edited` with valid `generation_id`
   - Use for testing edited AI cards

5. **`flashcards-mixed-sources.json`**
   - Combination of all source types in one request
   - Tests handling multiple sources simultaneously

### ❌ Invalid Requests

6. **`flashcards-invalid.json`**
   - **WILL FAIL** validation
   - Contains multiple validation errors:
     - Empty `front` field
     - `front` exceeding 200 character limit
     - Missing `generation_id` for AI sources
     - Invalid source type
     - `generation_id` provided for manual source
   - Use for testing error handling
   - Expected response: `400 Bad Request`

## Usage Examples

### Using cURL (Windows PowerShell)

```powershell
# Create manual flashcards
curl -X POST http://localhost:3000/api/flashcards `
  -H "Content-Type: application/json" `
  -d "@examples/flashcards-manual-multiple.json"

# Create AI-generated flashcards
curl -X POST http://localhost:3000/api/flashcards `
  -H "Content-Type: application/json" `
  -d "@examples/flashcards-ai-generated.json"

# Invalid request (will return 400 error)
curl -X POST http://localhost:3000/api/flashcards `
  -H "Content-Type: application/json" `
  -d "@examples/flashcards-invalid.json"
```

### Using cURL (Linux/macOS)

```bash
# Create flashcards
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d @examples/flashcards-manual-multiple.json

# Invalid request
curl -X POST http://localhost:3000/api/flashcards \
  -H "Content-Type: application/json" \
  -d @examples/flashcards-invalid.json
```

### Using Fetch API (JavaScript)

```javascript
// Create flashcards
const response = await fetch('http://localhost:3000/api/flashcards', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    flashcards: [
      {
        front: "What is JavaScript?",
        back: "A high-level programming language",
        source: "manual",
        generation_id: null
      }
    ]
  })
});

const data = await response.json();
console.log(data);
```

### Using Postman or Thunder Client

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/flashcards`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body**: 
   - Select "raw" and "JSON"
   - Copy contents from any example file

## Expected Responses

### Success (201 Created)

```json
{
  "flashcards": [
    {
      "id": 1,
      "user_id": "00000000-0000-0000-0000-000000000000",
      "front": "What is JavaScript?",
      "back": "A high-level, interpreted programming language...",
      "source": "manual",
      "generation_id": null,
      "created_at": "2025-10-11T12:00:00.000Z"
    }
  ]
}
```

### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "message": "Invalid request data",
  "details": [
    {
      "field": "flashcards.0.front",
      "message": "Front side cannot be empty"
    },
    {
      "field": "flashcards.0.generation_id",
      "message": "generation_id is required for source types 'ai-full' and 'ai-edited'"
    }
  ]
}
```

### Invalid Generation ID (400 Bad Request)

```json
{
  "error": "Invalid generation_id",
  "message": "Generation with id 999 not found or does not belong to user"
}
```

### Invalid JSON (400 Bad Request)

```json
{
  "error": "Invalid JSON",
  "message": "Request body must be valid JSON"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "An error occurred while creating flashcards"
}
```

## Validation Rules

### Request Body

- **`flashcards`** (required):
  - Type: `array`
  - Minimum items: **1**
  - Maximum items: **100**
  - Each flashcard object must contain:

### Flashcard Object

- **`front`** (required):
  - Type: `string`
  - Minimum length: **1 character**
  - Maximum length: **200 characters**
  - The question or prompt side of the flashcard

- **`back`** (required):
  - Type: `string`
  - Minimum length: **1 character**
  - Maximum length: **500 characters**
  - The answer or explanation side of the flashcard

- **`source`** (required):
  - Type: `enum`
  - Allowed values: `"ai-full"`, `"ai-edited"`, `"manual"`
  - Indicates origin of the flashcard:
    - `ai-full`: Generated by AI and accepted as-is
    - `ai-edited`: Generated by AI but modified by user
    - `manual`: Created manually by user

- **`generation_id`** (required):
  - Type: `number | null`
  - Conditional requirements:
    - **Must be a number** (not null) for `"ai-full"` and `"ai-edited"` sources
    - **Must be null** for `"manual"` source
  - References the AI generation that created this flashcard (if applicable)

## Tips

- You can create up to 100 flashcards in a single request
- Use `manual` source for user-created cards
- Use `ai-full` for AI-generated cards that weren't edited
- Use `ai-edited` for AI-generated cards that were modified
- Make sure `generation_id` matches an existing generation in the database for AI sources
- Keep front text concise (max 200 chars) - it's the question/prompt
- Back text can be longer (max 500 chars) - it's the detailed answer

