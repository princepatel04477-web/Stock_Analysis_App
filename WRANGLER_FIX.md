# Fixing Cloudflare Pages Deployment Error

## Error Message
```
Failed: error occurred while running deploy command
(Wrangler configuration issue - missing pages_build_output_dir or improper setup)
```

## Root Cause
The Cloudflare Pages build process is trying to deploy but the `wrangler.toml` configuration for the output directory wasn't properly set.

## Solution

### Step 1: Fix wrangler.toml ✅
Updated `wrangler.toml` with:
```toml
name = "niftypulse-frontend"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

# Cloudflare Pages output directory
pages_build_output_dir = ".vercel/output/static"
```

### Step 2: Verify Cloudflare Dashboard Settings
In your Cloudflare Pages project settings:

1. **Build Configuration:**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static` ← This is critical
   - Root directory: `/` (leave as default)

2. **Environment Variables (Production):**
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```

### Step 3: Trigger Redeploy
After updating wrangler.toml:
- Commit changes to GitHub
- Go to Cloudflare Dashboard → Pages → Your project
- Click **Deployments → Retry** on the latest failed deployment

## Expected Build Process

Cloudflare will:
1. ✅ Check out your Git repo
2. ✅ Install dependencies (`npm install`)
3. ✅ Run build command (`npx @cloudflare/next-on-pages`)
   - Creates `.next/` directory
   - Creates `.vercel/output/static/` directory
4. ✅ Deploy static files from `.vercel/output/static/`
5. ✅ Make available at your Cloudflare Pages URL

## Files to Verify

### wrangler.toml ✅
```toml
name = "niftypulse-frontend"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"
```

### package.json ✅
Ensure these scripts exist:
```json
{
  "scripts": {
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages"
  }
}
```

### next.config.mjs ✅
Should exist and be valid ESM syntax.

## Troubleshooting

### Still Failing?
1. **Check build logs:**
   - Go to Cloudflare Dashboard
   - Pages → Your Project → Deployments
   - Click failed deployment → View build logs
   - Look for specific error messages

2. **Verify environment variables:**
   - Go to Settings → Environment variables
   - Make sure all required vars are set for Production

3. **Test locally:**
   ```bash
   npm run build
   npm run start
   ```

### Common Errors

**Error: "Cannot find @cloudflare/next-on-pages"**
- Solution: Run `npm install` in your repo
- Or reinstall: `npm install @cloudflare/next-on-pages --save-dev`

**Error: ".vercel/output/static not found"**
- This means the build command didn't complete successfully
- Check build logs for TypeScript/compilation errors
- Verify wrangler.toml has `pages_build_output_dir = ".vercel/output/static"`

**Error: "Missing environment variables during build"**
- This is FIXED by our previous changes to `lib/supabase.ts`
- The app now gracefully handles missing env vars during build time

## Next.js on Cloudflare Pages Flow

```
GitHub Push
    ↓
Cloudflare detects change
    ↓
Install dependencies (npm install)
    ↓
Run build command (npx @cloudflare/next-on-pages)
    ├─ TypeScript compilation
    ├─ Next.js build
    ├─ Pages prerendering
    └─ Output to .vercel/output/static/
    ↓
Deploy from .vercel/output/static/
    ↓
Available at https://your-project.pages.dev
```

## Success Indicators

✅ Build completes without errors
✅ Build logs show: "Generating static pages (9/9)"
✅ Pages deployed successfully
✅ Your site is accessible at the Pages URL

## Related Documentation
- `CLOUDFLARE_DEPLOY.md` - Full deployment guide
- `DEPLOYMENT_COMPLETE.md` - All fixes summary
- `SERVER_FIXES.md` - Backend fixes

---

**If you still see errors, share the build log output and we can debug further!**
