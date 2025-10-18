# Password Reset - Troubleshooting Summary 🔍

## Original Problem

User clicked password reset link from email and got error:
```
Link resetowania hasła jest nieprawidłowy lub wygasł.
Linki resetowania są ważne przez 1 godzinę i mogą być użyte tylko raz.
```

## Initial Configuration Check

**Supabase Settings:**
- ✅ Site URL: `https://10xcards-dq7.pages.dev`
- ✅ Redirect URLs: 
  - `https://10xcards-dq7.pages.dev/**`
  - `https://10xcards-dq7.pages.dev/update-password`

## Attempt 1: Client-Side Session Check ❌

**Hypothesis:** Server-side session check was happening before tokens could be exchanged.

**What We Tried:**
```typescript
// src/pages/update-password.astro
// Removed server-side session check
// Let client handle token exchange
```

**Result:** ❌ Still failed - tokens in URL but no session established

**Log Output:**
```
URL Hash:  (empty)
URL Search: ?code=xxx
Session: false
```

---

## Attempt 2: Client-Side PKCE Code Exchange ❌

**Hypothesis:** Need to manually exchange PKCE code on client-side.

**What We Tried:**
```typescript
// src/components/auth/UpdatePasswordForm.tsx
const code = urlParams.get("code");
const { data, error } = await supabase.auth.exchangeCodeForSession(code);
```

**Result:** ❌ Failed with error:
```
POST /auth/v1/token?grant_type=pkce 400 (Bad Request)
Error: invalid request: both auth code and code verifier should be non-empty
```

**Why It Failed:** Client-side JavaScript doesn't have access to `code_verifier` which is stored in httpOnly cookies.

---

## Attempt 3: Server-Side PKCE Code Exchange ✅

**Hypothesis:** PKCE code exchange must happen server-side where we have access to httpOnly cookies containing `code_verifier`.

**What We Tried:**
```typescript
// src/pages/update-password.astro (SSR)
const code = url.searchParams.get("code");

if (code) {
  const supabase = createSupabaseServerClient(
    { cookies: Astro.cookies, headers: Astro.request.headers }
  );
  
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  // ✅ Has access to code_verifier in cookies!
}
```

**Result:** ⚠️ Partially working - session created but not visible to browser

**Log Output:**
```
Server: hasSession: true ✅
Client: hasSession: false ❌
```

---

## Attempt 4: Redirect After Code Exchange ✅

**Hypothesis:** Cookies set during SSR might not be sent to browser in the same response. Need redirect to ensure cookies are sent.

**What We Tried:**
```typescript
// src/pages/update-password.astro
if (data.session) {
  // Redirect to same page without code parameter
  return Astro.redirect("/update-password");
}
```

**Result:** ✅ Redirect worked, cookies sent

**Log Output:**
```
Request 1: /update-password?code=xxx
  → 302 Redirect
  → Set-Cookie: sb-access-token=...
  
Request 2: /update-password (auto-redirect)
  → 200 OK
  → Cookie: sb-access-token=...
```

**But:** User was logged in (middleware saw session) but form didn't show!

---

## Attempt 5: Configure Browser Client to Use Cookies ❌

**Hypothesis:** Browser client uses localStorage by default, need to configure it to use cookies.

**What We Tried:**
```typescript
// src/db/supabase.client.ts
export function getSupabaseBrowserClient() {
  return createBrowserClient({
    cookies: {
      get(name) { return document.cookie... },
      set(name, value) { document.cookie = ... },
      remove(name) { ... }
    }
  });
}
```

**Result:** ❌ Still no session visible to client

**Log Output:**
```
All cookies:  (empty!)
Has Supabase cookies: false
```

**Why It Failed:** Cookies are **httpOnly** - JavaScript cannot read them via `document.cookie`!

---

## Attempt 6: Server-Side Session Validation ✅✅✅

**Hypothesis:** Since cookies are httpOnly, only server can read them. Need to validate session server-side and pass result to component.

**What We Tried:**

### 1. Server-Side Session Check
```typescript
// src/pages/update-password.astro
let hasValidSession = false;
if (!code && !authError) {
  const supabase = createSupabaseServerClient(
    { cookies: Astro.cookies, headers: Astro.request.headers }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  // ✅ Server can read httpOnly cookies!
  
  if (session) {
    hasValidSession = true;
  } else {
    authError = "Sesja wygasła...";
  }
}
```

### 2. Conditional Rendering
```astro
<div class="rounded-lg border bg-card p-8 shadow-sm">
  {
    authError ? (
      <div>Error message + "Request new link" button</div>
    ) : hasValidSession ? (
      <UpdatePasswordForm client:load />
    ) : (
      <div>Loading spinner</div>
    )
  }
</div>
```

### 3. Simplified Component
```typescript
// src/components/auth/UpdatePasswordForm.tsx
// Removed all session checking logic
// Just a simple form now!
export function UpdatePasswordForm() {
  // Only form state and submission logic
  return <form>...</form>;
}
```

**Result:** ✅✅✅ **SUCCESS!**

**Log Output:**
```
Server: 
  [Update Password Page] Server-side session check: { hasSession: true, userId: '...' }

Client:
  Form rendered successfully!
```

---

## Final Solution Architecture

### Flow Diagram

```
1. User clicks email link
   ↓
   https://app.com/update-password?code=xxx

2. Server (SSR) - First Request
   ↓
   - Detects ?code=xxx parameter
   - Exchanges code for session (has access to code_verifier in httpOnly cookies)
   - Session created and stored in httpOnly cookies
   - Returns: 302 Redirect to /update-password

3. Browser
   ↓
   - Receives Set-Cookie headers
   - Stores httpOnly cookies (invisible to JavaScript)
   - Automatically follows redirect

4. Server (SSR) - Second Request
   ↓
   - No ?code parameter this time
   - Checks for existing session (reads httpOnly cookies)
   - Session found! ✅
   - Sets hasValidSession = true
   - Renders page with form

5. Browser
   ↓
   - Receives HTML with <UpdatePasswordForm />
   - Form is visible! ✅
   - User can change password
```

### Key Components

#### 1. `src/pages/update-password.astro` (Server-Side)

**Responsibilities:**
- Detect and exchange PKCE code
- Redirect after exchange
- Validate session (can read httpOnly cookies)
- Conditionally render form or error

#### 2. `src/components/auth/UpdatePasswordForm.tsx` (Client-Side)

**Responsibilities:**
- Display password form
- Client-side validation
- Submit to API endpoint
- Show success/error messages

#### 3. `src/pages/api/auth/update-password.ts` (API)

**Responsibilities:**
- Verify session (server-side)
- Update password via Supabase
- Return success/error response

---

## Root Causes Identified

### 1. PKCE Requires Server-Side Code Exchange
**Problem:** Client-side JavaScript cannot access `code_verifier` stored in httpOnly cookies.

**Solution:** Exchange code on server-side where we have full cookie access.

### 2. Cloudflare Workers Cookie Handling
**Problem:** Cookies set in SSR might not be flushed to response headers.

**Solution:** Use redirect pattern to force cookie sending.

### 3. HttpOnly Cookies Invisible to JavaScript
**Problem:** Browser client cannot read httpOnly cookies via `document.cookie`.

**Solution:** Validate session server-side and pass result to component via props/conditional rendering.

---

## What We Learned

### ✅ Correct Approaches

1. **PKCE code exchange MUST happen server-side**
   - Only server has access to `code_verifier`
   - Cannot be done in browser JavaScript

2. **Use redirect after session creation**
   - Ensures Set-Cookie headers are sent
   - Cleans URL (removes ?code parameter)
   - Standard OAuth/PKCE pattern

3. **Validate httpOnly cookies server-side**
   - JavaScript cannot read httpOnly cookies (by design)
   - SSR/middleware is the right place for validation

4. **Keep client components simple**
   - Don't try to replicate server logic client-side
   - Let server handle auth, client handles UI

### ❌ Incorrect Approaches

1. **Client-side PKCE exchange**
   - Missing code_verifier → fails

2. **Relying on browser client to read httpOnly cookies**
   - Security feature prevents this → always fails

3. **Caching Supabase client singleton**
   - Can miss fresh cookies → stale state

4. **Mixing localStorage and httpOnly cookies**
   - Inconsistent state → confusion

---

## Files Modified

### Core Changes

1. **`src/pages/update-password.astro`**
   - Added PKCE code exchange (server-side)
   - Added redirect after exchange
   - Added server-side session validation
   - Conditional rendering based on session

2. **`src/components/auth/UpdatePasswordForm.tsx`**
   - Removed all session checking logic
   - Simplified to pure form component
   - Removed unnecessary imports

3. **`src/db/supabase.client.ts`**
   - Configured browser client with cookie handlers
   - Removed singleton caching
   - (Note: Not actually needed in final solution)

### API Endpoints (Unchanged)

- `src/pages/api/auth/password-reset.ts` - Request reset email
- `src/pages/api/auth/update-password.ts` - Update password

---

## Testing Checklist

### ✅ Verified Working

- [x] Request password reset email
- [x] Receive email with reset link
- [x] Click link → Redirect → Form appears
- [x] Server logs show: `hasSession: true`
- [x] User can see password form
- [x] User can enter new password
- [x] Password update succeeds
- [x] Redirect to login
- [x] Login with new password works

### Error Cases Handled

- [x] Expired link (>1 hour)
- [x] Already used link (single-use)
- [x] Invalid link format
- [x] Missing code parameter
- [x] Code exchange failure
- [x] Session not found after exchange

---

## Performance Impact

### Before
- Multiple failed API calls trying to exchange code
- Client-side error loops
- Confused state management

### After
- ✅ Single server-side code exchange
- ✅ One redirect (standard pattern)
- ✅ Clean separation of concerns
- ✅ No client-side auth logic needed

---

## Security Improvements

1. **HttpOnly Cookies**
   - Session tokens not accessible to JavaScript
   - Protected from XSS attacks

2. **PKCE Flow**
   - More secure than implicit flow
   - Code verifier protects against interception

3. **Server-Side Validation**
   - All auth decisions made server-side
   - Client cannot bypass security checks

---

## Lessons for Future

### When Implementing OAuth/PKCE:

1. **Always exchange authorization codes server-side**
   - Client cannot access code_verifier
   - PKCE requires both code and verifier

2. **Use redirect pattern for cookie-based auth**
   - Ensures cookies are properly set
   - Cleans up URL parameters
   - Industry standard approach

3. **Don't try to read httpOnly cookies client-side**
   - It's a security feature, not a bug
   - Do auth checks server-side

4. **Keep client components dumb**
   - Let server handle auth complexity
   - Client just displays UI based on server state

### Debugging OAuth Issues:

1. Check both server AND client logs
2. Inspect Network tab for Set-Cookie headers
3. Check Application tab for actual cookies
4. Verify cookie attributes (httpOnly, secure, sameSite)
5. Test with fresh incognito window
6. Use Supabase Auth Logs for detailed flow

---

## Related Documentation

- [Supabase PKCE Flow](https://supabase.com/docs/guides/auth/server-side/pkce-flow)
- [OAuth 2.0 PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- [HTTP Cookies (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Astro SSR](https://docs.astro.build/en/guides/server-side-rendering/)

---

## Timeline

1. **Initial Issue:** Client-side session check too early
2. **First Fix:** Removed server-side check → Still failed
3. **Second Fix:** Client-side PKCE exchange → Error: missing code_verifier
4. **Third Fix:** Server-side PKCE exchange → Session created but not visible
5. **Fourth Fix:** Added redirect → Cookies sent but form still not showing
6. **Fifth Fix:** Configured browser client for cookies → httpOnly blocked access
7. **Final Fix:** Server-side session validation + conditional rendering → ✅ **SUCCESS!**

**Total Attempts:** 6
**Time to Solution:** Multiple iterations over debugging session
**Final Status:** ✅ **WORKING**

---

## Conclusion

The password reset feature now works correctly by:
1. ✅ Exchanging PKCE code server-side (has code_verifier access)
2. ✅ Using redirect pattern to ensure cookies are set
3. ✅ Validating session server-side (can read httpOnly cookies)
4. ✅ Rendering form conditionally based on server validation
5. ✅ Keeping client component simple and focused on UI

The root issue was trying to handle PKCE flow client-side when it fundamentally requires server-side processing due to httpOnly cookies containing the code_verifier.

