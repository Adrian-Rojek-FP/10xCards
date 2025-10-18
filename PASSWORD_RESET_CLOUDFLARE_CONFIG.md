# Password Reset Configuration for Cloudflare Deployment

## 📋 Overview

This guide explains how to properly configure password reset functionality when deploying to Cloudflare Pages. The password reset flow uses email magic links from Supabase, which require proper URL configuration.

## ✅ Recent Fix

**Issue:** Password reset links were expiring or showing "access_denied" errors on Cloudflare.

**Root Cause:** 
- Supabase was redirecting with error parameters that weren't being handled
- The auth code exchange flow wasn't properly implemented in the page
- Missing validation of the session before showing the password reset form

**Solution:** Updated `src/pages/update-password.astro` to:
1. Parse and handle error parameters from Supabase redirects
2. Validate the user session before showing the form
3. Display user-friendly error messages with recovery options

## 🔧 Required Supabase Configuration

### 1. Configure Redirect URLs in Supabase Dashboard

**⚠️ CRITICAL:** You must add your Cloudflare deployment URL to Supabase's allowed redirect URLs.

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to: **Authentication** → **URL Configuration**
4. Add the following URLs:

#### Site URL
```
https://your-app-name.pages.dev
```

#### Redirect URLs (Add these to the list)
```
https://your-app-name.pages.dev/update-password
https://your-app-name.pages.dev/**
```

**Note:** Replace `your-app-name` with your actual Cloudflare Pages project name.

### 2. Email Template Configuration (Optional)

By default, Supabase sends password reset emails with a link that expires after 1 hour. To customize:

1. Go to **Authentication** → **Email Templates** → **Reset Password**
2. Ensure the link uses: `{{ .ConfirmationURL }}`
3. You can customize the email template text, but keep the confirmation URL intact

Example template:
```html
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

## 🔍 How the Password Reset Flow Works

1. **User requests password reset** (`/password-reset`)
   - Enters email address
   - App calls Supabase `resetPasswordForEmail()`
   - Supabase sends email with magic link

2. **User clicks link in email**
   - Link contains auth code: `https://your-app.pages.dev/update-password#access_token=...`
   - Or link expired: `https://your-app.pages.dev/update-password?error=access_denied&error_code=otp_expired`

3. **`update-password.astro` page loads**
   - Checks for error parameters in URL
   - If no errors, validates session with Supabase
   - If session valid, shows password reset form
   - If session invalid, shows error with link to request new reset

4. **User submits new password**
   - Form calls `/api/auth/update-password` API endpoint
   - API validates session and updates password
   - User redirected to login page

## 🐛 Common Issues and Solutions

### Issue 1: "Link expired" Error

**Symptoms:**
```
error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

**Causes:**
- Link was used after 1 hour (default expiry time)
- Link was already used once (single-use)
- User waited too long before clicking the link

**Solution:**
- Request a new password reset link
- Click the link within 1 hour of receiving the email
- Don't reuse old reset links

### Issue 2: "Invalid redirect URL" Error

**Symptoms:**
- Email is sent but link doesn't work
- Redirect goes to localhost instead of production URL

**Solution:**
1. Verify your Cloudflare deployment URL is added to Supabase redirect URLs
2. Check that the URL exactly matches (including `https://`)
3. Redeploy your Cloudflare Pages site after updating Supabase configuration

### Issue 3: Session Not Established

**Symptoms:**
- Page shows: "Sesja wygasła lub link resetowania jest nieprawidłowy"
- Even though link was just clicked

**Solution:**
1. Ensure cookies are enabled in browser
2. Check browser's cookie settings for third-party cookies
3. Verify Supabase URL and API keys are correct in Cloudflare environment variables
4. Check Cloudflare function logs for any server-side errors

### Issue 4: CORS Errors

**Symptoms:**
- Network errors in browser console
- Failed to fetch from Supabase

**Solution:**
1. Verify your Cloudflare domain is added to Supabase allowed origins
2. Go to: **Authentication** → **URL Configuration** → **Additional Redirect URLs**
3. Add: `https://your-app-name.pages.dev`

## 🧪 Testing the Password Reset Flow

### Local Testing (Development)

1. Start local Supabase:
   ```bash
   npx supabase start
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. Check Inbucket for emails:
   - Open: http://localhost:54324
   - Request password reset
   - Click link in Inbucket

### Production Testing (Cloudflare)

1. Ensure all Supabase redirect URLs are configured
2. Request password reset with a real email address
3. Check email inbox (may take 1-2 minutes)
4. Click the link within 1 hour
5. Verify password update works
6. Test login with new password

## 📝 Environment Variables Checklist

Ensure these are set in **Cloudflare Pages** → **Settings** → **Environment variables**:

- [ ] `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `PUBLIC_SUPABASE_KEY` - Your Supabase anon key
- [ ] `SUPABASE_URL` - Same as PUBLIC_SUPABASE_URL (for server-side)
- [ ] `SUPABASE_KEY` - Same as PUBLIC_SUPABASE_KEY (for server-side)

Ensure these are set in **Supabase Dashboard**:

- [ ] Site URL matches your Cloudflare deployment URL
- [ ] Redirect URLs include `/update-password` path
- [ ] Email templates use `{{ .ConfirmationURL }}`

## 🔒 Security Best Practices

1. **Never extend OTP expiry beyond 1 hour** - Keeps links secure
2. **Use HTTPS only** - Supabase requires secure connections
3. **Don't log or store reset links** - They contain sensitive tokens
4. **Implement rate limiting** - Prevent abuse (configured in `supabase/config.toml`)
5. **Validate password strength** - Minimum 6 characters (configurable)

## 📊 Debugging Tips

### Check Cloudflare Function Logs

1. Go to Cloudflare Dashboard
2. Navigate to: **Workers & Pages** → **Your site** → **Functions**
3. Check recent invocations for `/api/auth/update-password`

### Check Supabase Auth Logs

1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Logs**
3. Filter by "password reset" events
4. Look for failed authentication attempts

### Browser DevTools

1. Open Network tab
2. Request password reset
3. Check API response from `/api/auth/password-reset`
4. Verify email was sent (200 response)
5. After clicking email link, check if session cookies are set

## 🆘 Still Having Issues?

1. **Verify Supabase configuration:**
   ```bash
   # Check if redirect URLs are correct
   # In Supabase Dashboard → Authentication → URL Configuration
   ```

2. **Check environment variables:**
   ```bash
   # In Cloudflare Dashboard → Settings → Environment variables
   # Verify all 4 Supabase variables are set
   ```

3. **Test with a fresh email:**
   ```bash
   # Old reset links won't work after being used
   # Request a new reset link
   ```

4. **Check browser console:**
   ```bash
   # Look for JavaScript errors
   # Check if cookies are being set
   ```

5. **Review Cloudflare logs:**
   ```bash
   # Check for server-side errors
   # Look for failed authentication attempts
   ```

## 📚 Related Files

- `src/pages/update-password.astro` - Password reset page with error handling
- `src/pages/api/auth/update-password.ts` - API endpoint for password updates
- `src/pages/api/auth/password-reset.ts` - API endpoint for requesting reset
- `src/components/auth/UpdatePasswordForm.tsx` - Password reset form component
- `supabase/config.toml` - Supabase local configuration (auth settings)

## 📖 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Password Reset Guide](https://supabase.com/docs/guides/auth/passwords)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/)

