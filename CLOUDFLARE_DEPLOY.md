# Cloudflare Pages Deployment Guide

## ✅ Issue Fixed
**Error:** "Missing Supabase environment variables" during Cloudflare Pages build

**Root Cause:** The Supabase client initialization in `lib/supabase.ts` was throwing an error at build time when environment variables were missing. During static site generation, environment variables aren't available by default.

**Solution:** Made Supabase client initialization graceful with fallback stub client for build time.

## Deployment Steps

### 1. Set Up Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages → Create a project**
3. Connect your **GitHub repository**
4. Select the branch to deploy (e.g., `main`)

### 2. Configure Build Settings

In the Cloudflare Pages project settings:

**Build Configuration:**
- **Framework preset:** Next.js
- **Build command:** `npx @cloudflare/next-on-pages`
- **Build output directory:** `.vercel/output/static`
- **Root directory:** `/` (or leave blank)

### 3. Add Environment Variables

In **Settings → Environment Variables**, add **Production** variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase
```

**Optional (for AI features):**
```
GROQ_API_KEY=your-groq-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
```

### 4. Configure Backend API URL (Production)

If your backend is deployed separately (e.g., on Railway, Render, or EC2):

```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

If not set, the frontend defaults to `/api` (relative requests).

### 5. Deploy

Once environment variables are set, Cloudflare will automatically build and deploy your project on every GitHub push.

To manually trigger a deployment:
- Push to your connected GitHub branch
- Or use **Deployments → Retry** in the dashboard

## Verification

After deployment completes:

1. Visit your Cloudflare Pages URL
2. Check the browser console for errors (F12)
3. Verify that:
   - Pages load without "Missing environment variables" error
   - ✅ Build completes successfully
   - Authentication forms appear (if Supabase is configured)
   - API calls work (check Network tab)

## Files Changed

### 1. `lib/supabase.ts`
- Made environment variable checks graceful
- Provides fallback stub client during build (no throw)
- Graceful degradation: warns instead of errors
- Full client created when env vars available

### 2. `contexts/AuthContext.tsx`
- Fixed TypeScript type annotations for auth callbacks
- Added explicit `any` types for event and session parameters

### 3. `.env.example`
- Updated with `NEXT_PUBLIC_*` prefixed variables for frontend
- Added backend-specific variables  
- Clear documentation for each variable

## Backend Deployment

Your FastAPI backend needs to be deployed separately:

**Quick Options:**
- [Railway](https://railway.app/) - 5-min deployment
- [Render](https://render.com/) - Similar to Railway
- [AWS EC2](https://aws.amazon.com/ec2/) - Full control
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform/) - Docker-based

**Backend Environment Variables:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-api-key
PERPLEXITY_API_KEY=your-perplexity-api-key
```

## Troubleshooting

### ✅ Build Now Works! Previous Error Fixed
The "Missing Supabase environment variables" error has been resolved. The build now gracefully handles missing env vars at build time.

### Build Still Fails
- Check Cloudflare Pages build logs in dashboard
- Ensure `wrangler.toml` exists with `compatibility_flags = ["nodejs_compat"]`
- Verify `@cloudflare/next-on-pages` is in `devDependencies`

### "Cannot find module" errors
- Run `npm install` locally and verify `npm run build` works
- Check for Windows-only paths (use forward slashes in imports)

### Environment variables not loading
- Variables must be set in Cloudflare **Settings → Environment variables**
- Use `NEXT_PUBLIC_*` prefix for frontend variables
- Backend-only vars don't need prefix
- Trigger redeploy after adding variables

### API calls failing
- Verify backend `NEXT_PUBLIC_API_URL` is set for production
- Check CORS headers on backend
- Test backend health: `curl https://your-backend/health`

## Local Testing

Before deploying to Cloudflare:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Test production build (this is what CF runs)
npm run build
npm run start
```

## Performance & Monitoring

1. **Caching:** Enable in Cloudflare Settings for static assets
2. **API TTLs:** Implement caching headers on backend
3. **Monitor:** Use Cloudflare Analytics for metrics
4. **Errors:** Check Cloudflare Error Reporting dashboard

## Related Files
- `wrangler.toml` - Cloudflare Workers configuration
- `next.config.mjs` - Next.js configuration
- `package.json` - Dependencies and build scripts
- `SERVER_FIXES.md` - Backend fixes documentation

## Next Steps
1. ✅ Push changes to GitHub
2. ✅ Create Cloudflare Pages project
3. ✅ Set environment variables
4. ✅ Watch deployment complete
5. ✅ Verify at your Cloudflare Pages URL

**You're ready to deploy!** 🚀
