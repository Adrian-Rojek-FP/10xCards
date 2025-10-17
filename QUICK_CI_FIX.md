# Quick CI Fix Reference

## ⚡ TL;DR

**Problem:** E2E tests would fail in CI due to missing server-side environment variables.

**Solution:** Updated `.github/workflows/ci.yml` to include `SUPABASE_URL` and `SUPABASE_KEY` (in addition to `PUBLIC_*` versions).

**Status:** ✅ FIXED

---

## 🔑 Required GitHub Secrets

Only 2 secrets needed (same values for both PUBLIC_ and non-PUBLIC_ vars):

```
PUBLIC_SUPABASE_URL    → Your Supabase project URL
PUBLIC_SUPABASE_KEY    → Your Supabase anon/public key
```

Optional:
```
OPENROUTER_API_KEY     → For AI flashcard generation
```

Get them from: [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API

---

## 📝 Local .env Setup

Create `.env`:
```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-anon-key
OPENROUTER_API_KEY=optional
```

Create `.env.test`:
```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_KEY=your-test-anon-key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-test-anon-key
BASE_URL=http://localhost:3000
```

---

## ✅ Quick Verification

```bash
# 1. Test locally
npm run lint          # Should pass
npm run test:run      # Should pass
npm run build         # Should succeed
npm run test:e2e      # Should pass

# 2. Commit and push
git add .
git commit -m "fix: Add server-side env vars to CI"
git push

# 3. Check GitHub Actions
# Go to: GitHub → Actions → Watch workflow run
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `SUPABASE_URL is not defined` | Add `PUBLIC_SUPABASE_URL` secret in GitHub |
| `Invalid API credentials` | Use **anon** key, not **service_role** key |
| E2E tests timeout | Not an env issue - check dev server |

---

## 📚 Full Documentation

- [CI_VERIFICATION_SUMMARY.md](./CI_VERIFICATION_SUMMARY.md) - Complete overview
- [CI_ENV_VERIFICATION.md](./CI_ENV_VERIFICATION.md) - Detailed guide
- [.github/SETUP.md](./.github/SETUP.md) - Setup instructions

---

**Fixed:** 2025-10-17 ✅

