# Sample Request Bodies for POST /api/generations

This directory contains example JSON request bodies for testing the `/api/generations` endpoint.

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
curl -X POST http://localhost:4321/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-request.json"

# Valid request (minimal)
curl -X POST http://localhost:4321/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-minimal.json"

# Invalid request (will return 400 error)
curl -X POST http://localhost:4321/api/generations `
  -H "Content-Type: application/json" `
  -d "@examples/sample-generation-invalid.json"
```

### Using cURL (Linux/macOS)

```bash
# Valid request
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @examples/sample-generation-request.json

# Invalid request
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @examples/sample-generation-invalid.json
```

### Using Fetch API (JavaScript)

```javascript
// Valid request
const response = await fetch('http://localhost:4321/api/generations', {
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
2. **URL**: `http://localhost:4321/api/generations`
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

