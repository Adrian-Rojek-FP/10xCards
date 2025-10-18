# Row-Level Security (RLS) Policy Fix

## Issue Summary

**Error in Production:**
```
Database insert error: {
  "code": "42501",
  "details": null,
  "hint": null,
  "message": "new row violates row-level security policy for table \"generations\""
}
```

## Root Cause

The application was using a hardcoded `DEFAULT_USER_ID` constant instead of the authenticated user's ID when inserting records into the database. The RLS policies require that `auth.uid()` matches the `user_id` being inserted, which failed because:

1. The Supabase client was created with the user's authentication context
2. The RLS policy checked that `auth.uid() = user_id`
3. `DEFAULT_USER_ID` was a hardcoded UUID that didn't match the authenticated user's ID

## Files Fixed

### 1. `src/pages/api/generations.ts`

**Changes:**
- Removed import of `DEFAULT_USER_ID`
- Added authentication check at the start of the endpoint
- Changed from `DEFAULT_USER_ID` to `user.id` when calling `generateFlashcards()`
- Updated API documentation to reflect authentication requirement

**Before:**
```typescript
const result: GenerationCreateResponseDto = await generateFlashcards(
  command.source_text,
  DEFAULT_USER_ID,  // ❌ Wrong: hardcoded UUID
  supabase,
  runtime
);
```

**After:**
```typescript
// Check if user is authenticated
if (!user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "You must be logged in to generate flashcards",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const result: GenerationCreateResponseDto = await generateFlashcards(
  command.source_text,
  user.id,  // ✅ Correct: authenticated user's ID
  supabase,
  runtime
);
```

### 2. `src/pages/api/flashcards.ts`

**Changes:**
- Removed import of `DEFAULT_USER_ID`
- Added authentication check at the start of the endpoint
- Changed from `DEFAULT_USER_ID` to `user.id` when calling `createFlashcards()`
- Updated API documentation to reflect authentication requirement

**Before:**
```typescript
const createdFlashcards: FlashcardDto[] = await createFlashcards(
  command.flashcards,
  DEFAULT_USER_ID,  // ❌ Wrong: hardcoded UUID
  supabase
);
```

**After:**
```typescript
// Check if user is authenticated
if (!user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "You must be logged in to create flashcards",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const createdFlashcards: FlashcardDto[] = await createFlashcards(
  command.flashcards,
  user.id,  // ✅ Correct: authenticated user's ID
  supabase
);
```

## How It Works Now

1. **Middleware** (`src/middleware/index.ts`) already:
   - Creates a Supabase server client with the user's authentication context
   - Gets the authenticated user and stores it in `locals.user`
   - Protects `/generate` route (redirects to `/login` if not authenticated)

2. **API Endpoints** now:
   - Check if `locals.user` exists (extra safety check)
   - Use `user.id` instead of `DEFAULT_USER_ID`
   - Return 401 Unauthorized if user is not authenticated

3. **RLS Policies** (`supabase/migrations/20251015140000_enable_rls_policies.sql`):
   - Check that `auth.uid() = user_id` when inserting/updating records
   - Now succeed because we're using the authenticated user's ID

## Testing

To test the fix in production:
1. Deploy the updated code
2. Log in to the application
3. Try generating flashcards
4. The insert should now succeed because `user.id` matches `auth.uid()`

## Additional Benefits

- **Better Security**: Endpoints now have explicit authentication checks
- **Clearer API Documentation**: Updated to reflect authentication requirements
- **Removed Technical Debt**: Eliminated `DEFAULT_USER_ID` constant that was meant to be temporary
- **Consistent Behavior**: Both `/api/generations` and `/api/flashcards` now handle authentication the same way

## Related Files

- `src/middleware/index.ts` - Sets up authentication context
- `src/db/supabase.client.ts` - Contains `DEFAULT_USER_ID` (can now be removed if not used elsewhere)
- `supabase/migrations/20251015140000_enable_rls_policies.sql` - RLS policies that require matching user IDs

