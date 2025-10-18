# Cloudflare Pages Deployment Guide

## ✅ Fixed Issues

1. **Incorrect Adapter**: Changed from `@astrojs/node` to `@astrojs/cloudflare`
2. **Build Configuration**: Updated `astro.config.mjs` to use Cloudflare adapter
3. **Runtime Environment Variables**: Fixed server-side code to access environment variables from Cloudflare's runtime context instead of build-time `import.meta.env`

## 🚀 Deployment Steps

### 1. Prerequisites

Make sure you have:
- A Cloudflare account
- Your Supabase credentials ready
- (Optional) OpenRouter API key for AI flashcard generation

### 2. Configure Environment Variables in Cloudflare Pages

Go to your Cloudflare Pages project dashboard:

**Navigate to:** Settings → Environment variables

Add the following variables for both **Production** and **Preview** environments:

#### Required Variables

| Variable Name | Value | Where to Get It |
|--------------|-------|-----------------|
| `PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` | Supabase Dashboard → Settings → API |
| `PUBLIC_SUPABASE_KEY` | Your anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_URL` | Same as `PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `SUPABASE_KEY` | Same as `PUBLIC_SUPABASE_KEY` | Supabase Dashboard → Settings → API |

#### Optional Variables

| Variable Name | Value | When Needed |
|--------------|-------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key | For AI flashcard generation feature |

**Important Notes:**
- Use the **anon/public** key, NOT the service_role key
- `SUPABASE_URL` and `PUBLIC_SUPABASE_URL` should have the same value
- `SUPABASE_KEY` and `PUBLIC_SUPABASE_KEY` should have the same value
- The duplication is required because the app uses both client-side and server-side Supabase clients

### 3. Build Settings

Configure the following build settings in Cloudflare Pages:

| Setting | Value |
|---------|-------|
| **Framework preset** | Astro |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node version** | 18 or higher |

### 4. Deploy

#### Option A: Git Integration (Recommended)

1. Connect your GitHub/GitLab repository to Cloudflare Pages
2. Push your changes:
   ```bash
   git add .
   git commit -m "fix: Configure Cloudflare adapter"
   git push
   ```
3. Cloudflare will automatically build and deploy

#### Option B: Manual Deployment

1. Build locally:
   ```bash
   npm run build
   ```
2. Upload the `dist` folder to Cloudflare Pages using Wrangler CLI:
   ```bash
   npx wrangler pages deploy dist
   ```

### 5. Verify Deployment

After deployment, check:

1. **Homepage loads** - Visit your deployment URL
2. **Authentication works** - Try to login/register
3. **API endpoints work** - Check the network tab for API calls
4. **Flashcard generation** - Test creating flashcards

## 🐛 Common Issues and Solutions

### Issue: "Invalid binding `SESSION`" error

**Solution:** The adapter automatically enables KV sessions. If you see this error:
1. Go to Cloudflare Dashboard → Workers & Pages → Your site → Settings → Bindings
2. Add a KV Namespace binding named `SESSION`
3. Or, disable sessions in `astro.config.mjs`:
   ```js
   adapter: cloudflare({
     mode: 'directory',
     platformProxy: {
       enabled: true,
     },
   }),
   ```

### Issue: Environment variables not working

**Solution:**
- Verify all variables are set in Cloudflare Pages dashboard
- Check both Production and Preview environments
- Redeploy after adding/changing variables

### Issue: "SUPABASE_URL is not defined" error

**Solution:**
- Make sure you added BOTH `PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
- They should have the SAME value
- Check if you're using the correct environment (Production vs Preview)

### Issue: Authentication fails with 401/403

**Solution:**
- Verify you're using the **anon** key, not the service_role key
- Check if RLS (Row Level Security) is enabled in Supabase
- Verify your Supabase project URL is correct

### Issue: Image optimization warning

**Solution:** The warning about sharp is informational only. If you need image optimization:
```js
// astro.config.mjs
export default defineConfig({
  image: {
    service: "compile"
  },
  // ... rest of config
});
```

## 📝 Post-Deployment Checklist

- [ ] All environment variables are set in Cloudflare Pages
- [ ] Both `PUBLIC_*` and non-`PUBLIC_*` Supabase variables are configured
- [ ] Supabase redirect URLs configured (see below)
- [ ] Build completes successfully
- [ ] Homepage loads without errors
- [ ] Login/Register functionality works
- [ ] Password reset functionality works (see PASSWORD_RESET_CLOUDFLARE_CONFIG.md)
- [ ] Flashcard creation works
- [ ] API endpoints respond correctly

### Configure Supabase Redirect URLs

**⚠️ IMPORTANT:** After deploying to Cloudflare, you must configure Supabase to allow redirects from your deployment URL.

1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://your-app-name.pages.dev`
3. Add to **Redirect URLs**:
   - `https://your-app-name.pages.dev/update-password`
   - `https://your-app-name.pages.dev/**`

**Why this is needed:**
- Password reset emails contain links that redirect to your app
- Without proper configuration, reset links will fail with "access_denied" errors
- See [PASSWORD_RESET_CLOUDFLARE_CONFIG.md](./PASSWORD_RESET_CLOUDFLARE_CONFIG.md) for detailed configuration guide

## 🔄 Continuous Deployment

With Git integration enabled:
1. Push changes to your repository
2. Cloudflare automatically builds and deploys
3. Preview deployments are created for pull requests
4. Production deploys on merge to main branch

## 📚 Additional Resources

- [Astro Cloudflare Adapter Docs](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Supabase Documentation](https://supabase.com/docs)

## 🆘 Still Having Issues?

Check the Cloudflare Pages deployment logs:
1. Go to Cloudflare Dashboard → Workers & Pages → Your site
2. Click on the latest deployment
3. View the build logs and function logs

Common log locations:
- **Build logs**: Shows npm install and build output
- **Function logs**: Shows runtime errors from your API endpoints

