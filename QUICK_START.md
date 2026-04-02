# 🚀 QUICK REFERENCE: Cloudflare Deployment

## ⚡ TL;DR - What You Need

### Build Configuration
```
Build Command: npm run build
Build Output:  .next
Root Dir:      /
```

### Environment Variables (Set in Cloudflare Dashboard)
```
NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-key
```

### That's It!
Push to GitHub → Cloudflare automatically deploys

---

## 📱 10-Second Setup

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → Pages
2. Click "Create a project" → Connect GitHub
3. Select your repository and branch
4. When it asks for build settings:
   - Build command: `npm run build`
   - Build output: `.next`
5. Add environment variables
6. Click Deploy ✅

---

## ❌ Common Mistakes to Avoid

❌ Build command: `next build` → Use `npm run build`
❌ Build output: `.vercel/output/static` → Use `.next`
❌ Build output: `./dist` → Use `.next`
❌ Forgetting to set environment variables

✅ Build command: `npm run build`
✅ Build output: `.next`
✅ Set NEXT_PUBLIC_* variables
✅ Push to GitHub

---

## 🧪 Test Locally First

```bash
npm run build

# Should see:
# ✓ Generating static pages (9/9)
# ✓ Finalizing page optimization
```

If it works locally, it will work on Cloudflare!

---

## 📊 Files That Matter

- `package.json` → Has `"build": "next build"` ✅
- `wrangler.toml` → Configured correctly ✅
- `.next/` → Build output (automatically created) ✅
- `next.config.mjs` → Valid ESM syntax ✅

---

## 🎯 One-Time Setup (Already Done)

- ✅ Supabase client graceful initialization
- ✅ Backend imports fixed
- ✅ TypeScript types fixed
- ✅ Wrangler config optimized

---

## 📞 Quick Troubleshooting

**Q: Build fails on Cloudflare but works locally?**
A: Check build logs in Cloudflare → Settings → Environment variables

**Q: Website won't load?**
A: Verify Pages URL, wait 30 seconds after deploy

**Q: API calls fail?**
A: Set NEXT_PUBLIC_API_URL if backend is on different domain

**Q: Can't login/see data?**
A: Set NEXT_PUBLIC_SUPABASE_* variables in Cloudflare

---

## ✅ Success Indicators

- [ ] Cloudflare Pages project created
- [ ] GitHub connected
- [ ] First deployment completed
- [ ] Build logs show "BUILD SUCCESSFUL"
- [ ] Site accessible at provided URL
- [ ] Pages load without errors
- [ ] No console errors (F12)

---

## 🚀 Deploy Now!

1. **Locally verified** ✅
2. **Code pushed** ✅
3. **Configuration correct** ✅
4. **Ready to go!** ✅

Go to Cloudflare and deploy! 🎉

---

**Complete documentation in DEPLOYMENT_STATUS.md**
