
# CI Environment Variables Verification Report

## ✅ Issues Fixed

### Problem Identified
The CI workflow was missing critical server-side environment variables required by the application's middleware and API routes. This would cause E2E tests to fail with 500 errors.

### Root Cause
The application uses **two sets** of Supabase credentials:

1. **Browser-side** (Client-side React components):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_KEY`

2. **Server-side** (Astro middleware & API routes):
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

The CI workflow was only providing the `PUBLIC_*` variables, causing the server-side code to fail.

### Files Using Server-Side Variables
- `src/middleware/index.ts` - Authentication middleware
- `src/pages/api/auth/login.ts` - Login API endpoint
- `src/pages/api/auth/logout.ts` - Logout API endpoint
- `src/pages/api/auth/register.ts` - Registration API endpoint

## 🔧 Changes Made

### Updated `.github/workflows/ci.yml`

#### Build Job (lines 72-81)
```yaml
env:
  NODE_ENV: production
  # Public env vars (browser-side)
  PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
  PUBLIC_SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
  # Server-side env vars (middleware & API routes)
  SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
  # Optional: OpenRouter API for flashcard generation
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

#### E2E Tests Job (lines 113-123)
```yaml
env:
  NODE_ENV: test
  CI: true
  # Public env vars (browser-side)
  PUBLIC_SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
  PUBLIC_SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
  # Server-side env vars (middleware & API routes)
  SUPABASE_URL: ${{ secrets.PUBLIC_SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.PUBLIC_SUPABASE_KEY }}
  # Optional: OpenRouter API for flashcard generation
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

## 📋 Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### Mandatory Secrets

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `PUBLIC_SUPABASE_URL` | Supabase Project URL | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |

### Optional Secrets

| Secret Name | Description | When Needed |
|-------------|-------------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API Key | Only if E2E tests generate flashcards |

### How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value
5. Click **Add secret**

## ✅ Verification Checklist

Use this checklist to verify your CI setup:

### GitHub Repository Setup
- [ ] `PUBLIC_SUPABASE_URL` secret is configured
- [ ] `PUBLIC_SUPABASE_KEY` secret is configured
- [ ] (Optional) `OPENROUTER_API_KEY` secret is configured

### Local Environment Setup
Create a `.env` file with:
```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key-here
OPENROUTER_API_KEY=your-openrouter-api-key (optional)
```

Create a `.env.test` file with:
```env
PUBLIC_SUPABASE_URL=https://your-test-project-id.supabase.co
PUBLIC_SUPABASE_KEY=your-test-anon-key-here
SUPABASE_URL=https://your-test-project-id.supabase.co
SUPABASE_KEY=your-test-anon-key-here
BASE_URL=http://localhost:3000
```

### Testing Locally Before CI
- [ ] `npm run lint` passes
- [ ] `npm run test:run` passes
- [ ] `npm run build` succeeds
- [ ] `npm run test:e2e` passes (with dev server running)

### CI Pipeline Verification
- [ ] Push changes to trigger CI
- [ ] **Lint** job passes
- [ ] **Unit Tests** job passes
- [ ] **Build** job passes (check for env var errors)
- [ ] **E2E Tests** job passes

## 🚀 Testing the Fix

### Step 1: Verify Secrets
```bash
# You cannot view secrets directly, but you can verify they're set
# by checking the GitHub Actions UI after a run
```

### Step 2: Trigger a Workflow Run
```bash
git add .github/workflows/ci.yml
git commit -m "fix: Add missing server-side env vars to CI"
git push origin main
```

### Step 3: Monitor the Workflow
1. Go to GitHub → **Actions** tab
2. Watch the workflow run
3. Check each job for success:
   - ✅ Lint
   - ✅ Unit Tests
   - ✅ Build
   - ✅ E2E Tests

### Step 4: Check for Errors
If E2E tests still fail:
1. Click on the failed job
2. Expand the **Run E2E tests** step
3. Look for environment variable errors:
   - ❌ `SUPABASE_URL is not defined` → Secret not configured
   - ❌ `Invalid API key` → Wrong key value
   - ❌ `Connection refused` → Different issue (not env vars)

## 🐛 Troubleshooting

### Problem: "SUPABASE_URL is not defined"
**Solution:** 
- Verify `PUBLIC_SUPABASE_URL` secret is set in GitHub
- The value should be your full Supabase project URL
- Format: `https://xxxxxxxxxxxxx.supabase.co`

### Problem: "Invalid API credentials"
**Solution:**
- Verify `PUBLIC_SUPABASE_KEY` is the **anon/public** key, not the service role key
- Copy the key again from Supabase Dashboard → Settings → API
- Make sure there are no extra spaces or newlines

### Problem: E2E tests timeout
**Solution:**
- This is not an env var issue
- Check if Playwright can connect to the dev server
- Increase `timeout-minutes` in the workflow if needed

### Problem: OpenRouter errors in logs
**Solution:**
- If you're not using flashcard generation in E2E tests, ignore these
- If you need it, add the `OPENROUTER_API_KEY` secret
- Get your key from: https://openrouter.ai/keys

## 📊 Expected Behavior

### Before the Fix
```
❌ Build job: Succeeded (but shouldn't - env vars undefined)
❌ E2E Tests: Failed with 500 errors
❌ Middleware: Cannot read SUPABASE_URL of undefined
❌ API Routes: Authentication failures
```

### After the Fix
```
✅ Build job: Succeeds with all env vars available
✅ E2E Tests: Pass successfully
✅ Middleware: Authenticates users correctly
✅ API Routes: Process requests normally
```

## 📚 Additional Notes

### Why Both PUBLIC_* and Non-PUBLIC_* Variables?

**Astro's Environment Variable Convention:**
- `PUBLIC_*` variables are exposed to both server and client (browser)
- Non-prefixed variables are server-only (more secure)

**Our Setup:**
- We use the **same Supabase credentials** for both
- In CI, we map: `SUPABASE_URL` → `PUBLIC_SUPABASE_URL` value
- In CI, we map: `SUPABASE_KEY` → `PUBLIC_SUPABASE_KEY` value
- This is safe because we're using the anon/public key (not service role)

### Security Considerations

✅ **Safe to use anon/public key on both sides:**
- Protected by Row Level Security (RLS) in Supabase
- Limited permissions (can't access admin functions)
- Designed to be exposed to browsers

❌ **Never use service_role key in browser:**
- Has full database access
- Bypasses RLS policies
- Should only be used in secure server environments

## ✨ Summary

The CI workflow has been updated to include all required environment variables for both browser-side and server-side code. The fix ensures that:

1. ✅ Middleware can authenticate users
2. ✅ API routes can process requests
3. ✅ E2E tests can run successfully
4. ✅ Build process completes without errors

**Next Steps:**
1. Verify GitHub secrets are configured
2. Push the updated workflow file
3. Monitor the CI pipeline
4. Confirm all jobs pass

---

**Questions or Issues?** Check the troubleshooting section or review the workflow logs in GitHub Actions.

