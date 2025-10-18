# Password Reset Cloudflare - Quick Fix ⚡

## 🎯 The Problem
Password reset links on Cloudflare show: `error=access_denied&error_code=otp_expired`

## ✅ The Solution (3 Steps)

### Step 1: Configure Supabase (5 minutes)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Click on your **10xCards** project
3. Go to: **Authentication** → **URL Configuration**
4. Update these fields:

**Site URL:**
```
https://10xcards-dq7.pages.dev
```

**Redirect URLs** (click "Add URL" for each):
```
https://10xcards-dq7.pages.dev/update-password
https://10xcards-dq7.pages.dev/**
```

5. Click **Save**

### Step 2: Deploy the Code (2 minutes)

The code has already been fixed in this session. Just deploy it:

```bash
git add .
git commit -m "fix: Handle password reset errors on Cloudflare"
git push
```

Cloudflare will automatically build and deploy (takes ~2-3 minutes).

### Step 3: Test It (2 minutes)

1. Go to: https://10xcards-dq7.pages.dev/password-reset
2. Enter your email
3. Check inbox (wait 1-2 minutes)
4. Click the reset link
5. ✅ Should see password form (not error!)
6. Enter new password
7. ✅ Should redirect to login

## 🎉 Done!

If you see the password form after clicking the email link, it's working!

## ❌ Still Not Working?

### Quick Checks:

**1. Supabase URLs Correct?**
- Must be exactly: `https://10xcards-dq7.pages.dev` (no trailing slash)
- Must include both the specific `/update-password` and wildcard `/**`

**2. Environment Variables Set?**
- Go to Cloudflare → Settings → Environment variables
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are there

**3. Link Expired?**
- Reset links expire after 1 hour
- Request a new one if it's been too long

**4. Link Already Used?**
- Reset links are single-use
- Request a new one if you already clicked it

**5. Cache Issues?**
- Try in Incognito/Private browsing mode
- Clear browser cache

## 📞 Need More Help?

See the detailed guides:
- [PASSWORD_RESET_FIX_SUMMARY.md](./PASSWORD_RESET_FIX_SUMMARY.md) - What was fixed
- [PASSWORD_RESET_CLOUDFLARE_CONFIG.md](./PASSWORD_RESET_CLOUDFLARE_CONFIG.md) - Full configuration guide
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - General deployment help

## 🔍 What Changed in the Code?

The `update-password.astro` page now:
- ✅ Detects error parameters from Supabase
- ✅ Shows friendly error messages
- ✅ Validates session before showing form
- ✅ Provides "Request new link" button for errors

## 💡 Pro Tips

1. **Save the reset email link** - You can't reuse it, but good for debugging
2. **Test with real email** - Localhost testing won't show Cloudflare issues
3. **Check Supabase auth logs** - Authentication → Logs in Supabase Dashboard
4. **Use Incognito mode** - Avoids browser cache issues
5. **Reset links expire in 1 hour** - Click them quickly!

---

**That's it!** The fix is already in your code, just configure Supabase and deploy! 🚀

