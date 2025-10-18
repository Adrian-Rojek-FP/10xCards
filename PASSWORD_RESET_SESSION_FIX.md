# Password Reset Session Fix 🔧

## The Problem

When users clicked the password reset link from their email, they saw an error message:
> "Sesja wygasła lub link resetowania jest nieprawidłowy"

Even though:
- ✅ Supabase Site URL was configured correctly: `https://10xcards-dq7.pages.dev`
- ✅ Redirect URLs were configured correctly
- ✅ The email was being sent successfully

## Root Cause

The password reset flow works like this:

1. User clicks email link → Supabase verifies token
2. Supabase redirects to your app with tokens in URL hash: `#access_token=...&refresh_token=...`
3. **Client-side** Supabase SDK needs to exchange these tokens for a session
4. Only then can you verify the session exists

The bug: The `update-password.astro` page was trying to verify the session **on the server-side** before the client had a chance to exchange the tokens from the URL. This always failed because the tokens hadn't been processed yet!

## The Solution

### Changes Made

**1. `src/pages/update-password.astro`**
- ✅ Removed server-side session check
- ✅ Only checks for explicit error parameters from Supabase
- ✅ Always shows the form (unless there's an error in URL params)
- ✅ Let the client-side handle token exchange

**2. `src/components/auth/UpdatePasswordForm.tsx`**
- ✅ Added `useEffect` to check session after component mounts
- ✅ Gives Supabase time to exchange tokens from URL
- ✅ Shows loading state while verifying: "Weryfikacja linku resetowania..."
- ✅ Shows friendly error if session is invalid/expired
- ✅ Provides "Poproś o nowy link" button when session fails
- ✅ Only enables form submission when valid session is confirmed

### How It Works Now

```
1. User clicks email link
   ↓
2. Supabase redirects to /update-password with tokens in URL
   ↓
3. Page loads → Shows "Weryfikacja linku resetowania..."
   ↓
4. Client-side Supabase SDK exchanges tokens
   ↓
5. UpdatePasswordForm checks for valid session
   ↓
6a. ✅ Valid session → Shows password form
6b. ❌ Invalid/expired → Shows error + "Request new link" button
```

## Testing the Fix

### 1. Request Password Reset
```
1. Go to: https://10xcards-dq7.pages.dev/password-reset
2. Enter email address
3. Click "Wyślij link resetujący"
4. Wait for email (1-2 minutes)
```

### 2. Click Reset Link
```
1. Open email
2. Click the reset link
3. ✅ Should see: "Weryfikacja linku resetowania..." (briefly)
4. ✅ Should see: Password form with two fields
5. Enter new password (min 6 characters)
6. Click "Zmień hasło"
7. ✅ Should redirect to login page
```

### 3. Test Edge Cases

**Expired Link (after 1 hour):**
- ❌ Shows: "Link resetowania hasła jest nieprawidłowy lub wygasł..."
- ✅ Shows: "Poproś o nowy link" button

**Already Used Link:**
- ❌ Shows: Same error as expired link
- ✅ Shows: "Poproś o nowy link" button

**Invalid Link:**
- ❌ Shows: Same error as expired link
- ✅ Shows: "Poproś o nowy link" button

## Deployment

The code is ready! Just deploy:

```bash
git add .
git commit -m "fix: Handle password reset session token exchange properly"
git push
```

Cloudflare will automatically build and deploy (takes ~2-3 minutes).

## Why This Is Better

### Before ❌
- Server checked for session before tokens were exchanged
- Always failed with confusing error
- No loading feedback
- No helpful error messages

### After ✅
- Client-side token exchange happens first
- Shows loading state while verifying
- Clear, actionable error messages
- "Request new link" button when needed
- Proper session validation

## Technical Details

### Token Exchange Flow

Supabase password reset uses a **PKCE flow** (Proof Key for Code Exchange):

1. **Email link format:**
   ```
   https://your-project.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://yourapp.com/update-password
   ```

2. **After Supabase verification:**
   ```
   https://yourapp.com/update-password#access_token=xxx&expires_in=3600&refresh_token=xxx&token_type=bearer&type=recovery
   ```

3. **Client-side SDK processes:**
   - Reads tokens from URL hash
   - Stores them in cookies/localStorage
   - Creates a session
   - Removes tokens from URL

4. **Then you can:**
   - Call `getSession()` to verify
   - Call `updateUser()` to change password

### Why Server-Side Check Failed

```typescript
// ❌ This fails because tokens haven't been exchanged yet
const { data: { user } } = await supabase.auth.getUser();

// ✅ This works because client-side SDK exchanges tokens first
useEffect(() => {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
}, []);
```

## Supabase Configuration

Your current configuration is correct:

**Site URL:**
```
https://10xcards-dq7.pages.dev
```

**Redirect URLs:**
```
https://10xcards-dq7.pages.dev/**
https://10xcards-dq7.pages.dev/update-password
```

No changes needed! ✅

## Common Issues & Solutions

### Issue: Still seeing error after deploying
**Solution:** Request a NEW password reset link. Old links won't work because they were generated before the fix.

### Issue: "Weryfikacja linku" shows forever
**Solution:** Check browser console for errors. Could be:
- CORS issue (check Supabase CORS settings)
- Wrong Supabase keys in environment variables

### Issue: Form submits but password doesn't change
**Solution:** Check Cloudflare logs. The API endpoint validates session separately.

## Files Changed

1. `src/pages/update-password.astro` - Removed premature session check
2. `src/components/auth/UpdatePasswordForm.tsx` - Added proper token exchange handling

## Related Documentation

- [PASSWORD_RESET_CLOUDFLARE_QUICKFIX.md](./PASSWORD_RESET_CLOUDFLARE_QUICKFIX.md) - Quick configuration guide
- [PASSWORD_RESET_CLOUDFLARE_CONFIG.md](./PASSWORD_RESET_CLOUDFLARE_CONFIG.md) - Detailed Supabase setup
- [Supabase Password Reset Docs](https://supabase.com/docs/guides/auth/passwords#reset-password-email)

---

**Status: ✅ FIXED** - Ready to deploy!

