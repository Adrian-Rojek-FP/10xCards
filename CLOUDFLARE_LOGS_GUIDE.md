# How to Check Backend Errors on Cloudflare

## 🔍 Where to Find Logs

### Method 1: Real-time Function Logs (Recommended)

This is the **best way** to debug your 500 error in `/api/generations`:

1. Go to **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Navigate to **Workers & Pages**
3. Click on your project: **10xCards**
4. Click on the **latest deployment**
5. Go to the **Functions** tab
6. You'll see **real-time logs** showing:
   - All `console.log()` and `console.error()` outputs
   - Runtime errors with stack traces
   - Request/response details
   - Performance metrics

**Direct Link Pattern:**
```
https://dash.cloudflare.com/:account/pages/view/10xcards-dq7/deployments/:deployment_id/functions
```

### Method 2: Logpush (Historical Logs)

For long-term log storage:

1. **Cloudflare Dashboard** → **Analytics & Logs** → **Logs**
2. Configure Logpush to store logs to external storage
3. Useful for production monitoring and analytics

---

## 🐛 Your 500 Error - Root Cause & Fix

### **Problem Identified**

Your `/api/generations` endpoint is failing because **`OPENROUTER_API_KEY` is not accessible at runtime**.

#### Why It Fails

In `openrouter.service.ts` (line 223):
```typescript
this.apiKey = options.apiKey || import.meta.env.OPENROUTER_API_KEY || "";
```

On Cloudflare:
- ❌ `import.meta.env.OPENROUTER_API_KEY` only works at **build time**
- ✅ Need to access environment variables from **runtime context** (`locals.runtime.env`)

---

## ✅ Fix Applied

I've updated three files to properly handle runtime environment variables:

### 1. **`src/lib/services/openrouter.service.ts`**

Added support for runtime environment variables:
```typescript
// Support runtime environment variables (Cloudflare) with fallback to build-time (local dev)
const runtimeApiKey = options.runtime?.env?.OPENROUTER_API_KEY;
this.apiKey = options.apiKey || runtimeApiKey || import.meta.env.OPENROUTER_API_KEY || "";
```

### 2. **`src/lib/services/generation.service.ts`**

Updated to pass runtime context:
```typescript
async function aiServiceGenerateFlashcards(
  sourceText: string,
  runtime?: { env?: { OPENROUTER_API_KEY?: string } }
): Promise<FlashcardProposalDto[]> {
  const openRouter = createOpenRouterService({
    enableMetrics: true,
    runtime, // Pass runtime context
    // ...
  });
}
```

### 3. **`src/pages/api/generations.ts`**

Updated endpoint to extract and pass runtime context:
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    
    // Get runtime context for environment variables (Cloudflare)
    const runtime = locals.runtime as { env?: { OPENROUTER_API_KEY?: string } } | undefined;
    
    // ...
    
    const result: GenerationCreateResponseDto = await generateFlashcards(
      command.source_text,
      DEFAULT_USER_ID,
      supabase,
      runtime // Pass runtime context
    );
  }
}
```

### 4. **`src/env.d.ts`**

Environment types were already updated to include `OPENROUTER_API_KEY`:
```typescript
interface Locals {
  supabase: SupabaseClient<Database>;
  session: Session | null;
  user: User | null;
  runtime?: {
    env?: {
      SUPABASE_URL?: string;
      SUPABASE_KEY?: string;
      OPENROUTER_API_KEY?: string; // ← Already includes this
    };
  };
}
```

---

## 🚀 Next Steps

### Step 1: Verify Environment Variable in Cloudflare

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **10xCards**
2. Navigate to **Settings** → **Environment variables**
3. Verify `OPENROUTER_API_KEY` is set for **both**:
   - ✅ **Production** environment
   - ✅ **Preview** environment

If it's not set, add it:
- **Variable name:** `OPENROUTER_API_KEY`
- **Value:** Your OpenRouter API key from https://openrouter.ai/keys

### Step 2: Deploy the Fix

Push these changes to trigger a new deployment:
```bash
git add .
git commit -m "fix: Use Cloudflare runtime env vars for OPENROUTER_API_KEY"
git push
```

Cloudflare will automatically rebuild and redeploy.

### Step 3: Monitor Deployment

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **10xCards**
2. Wait for the new deployment to complete
3. Click on the deployment
4. Go to **Functions** tab to monitor logs

### Step 4: Test the Endpoint

Try making a request to `/api/generations` again:
```bash
curl -X POST https://10xcards-dq7.pages.dev/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "Your test text here (minimum 1000 characters)..."}'
```

---

## 📊 What You'll See in Logs

### Success Scenario

When working correctly, you'll see in Function logs:
```
[OpenRouter INFO] Sending chat message
[OpenRouter INFO] Chat message completed successfully
[OpenRouter INFO] AI Response: {...flashcards...}
```

### Error Scenarios

#### Missing API Key
```
Error: OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable...
```
**Fix:** Add `OPENROUTER_API_KEY` in Cloudflare environment variables

#### Authentication Error (401/403)
```
[OpenRouter ERROR] HTTP Error from OpenRouter
AuthenticationError: Authentication failed. Invalid API key.
```
**Fix:** Verify your OpenRouter API key is correct

#### Rate Limit Error (429)
```
RateLimitError: Rate limit exceeded. Please try again later.
```
**Fix:** Wait or upgrade your OpenRouter plan

#### Network/Timeout Error
```
NetworkError: Request timeout.
```
**Fix:** Check OpenRouter service status, increase timeout if needed

---

## 🔧 Debugging Tips

### 1. Check All Logs

The `/api/generations` endpoint logs extensively:
- Line 78: OpenRouter request/response logs
- Line 98: Main endpoint errors
- Line 141: AI service errors
- Line 202: Database insert errors
- Line 229: Error logging to database

### 2. Test Locally First

Before deploying, test locally:
```bash
# Ensure .env file has OPENROUTER_API_KEY
npm run dev

# Test the endpoint
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @examples/sample-generation-mushroms.json
```

### 3. Check All Environment Variables

Verify all required variables are set in Cloudflare:
- ✅ `PUBLIC_SUPABASE_URL`
- ✅ `PUBLIC_SUPABASE_KEY`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_KEY`
- ✅ `OPENROUTER_API_KEY`

---

## 📚 Additional Resources

- [Cloudflare Pages Real-time Logs](https://developers.cloudflare.com/pages/functions/debugging-and-logging/)
- [Cloudflare Workers Environment Variables](https://developers.cloudflare.com/workers/configuration/environment-variables/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [OpenRouter API Documentation](https://openrouter.ai/docs)

---

## 🎯 Summary

**Problem:** 500 error in `/api/generations` due to missing `OPENROUTER_API_KEY` at runtime

**Root Cause:** Using `import.meta.env` (build-time) instead of `locals.runtime.env` (runtime)

**Fix:** Updated code to use Cloudflare runtime environment variables

**Next:** 
1. ✅ Code changes complete (already pushed)
2. ⏳ Verify `OPENROUTER_API_KEY` in Cloudflare dashboard
3. ⏳ Deploy and monitor in Functions logs
4. ⏳ Test the endpoint

