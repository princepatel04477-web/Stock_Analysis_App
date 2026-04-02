# 🚀 Railway.app Deployment - Step by Step

## Prerequisites
- ✅ GitHub account (you already have one)
- ✅ Railway.app account (free sign-up takes 1 minute)
- ✅ Your code is pushed to GitHub on `Final_Draft` branch ✅

## Step-by-Step Deployment

### Step 1: Create Railway Account & Login
1. Open https://railway.app in your browser
2. Click "Start a new project" or sign up
3. Click "Deploy with GitHub" or "GitHub" button
4. Authorize Railway to access your GitHub account
5. You'll be redirected to your Railway dashboard

### Step 2: Create New Project
1. Click "Create a new project" (or the big "+" button)
2. You'll see deployment options

### Step 3: Deploy from GitHub
1. Select "Deploy from GitHub repo"
2. Search for "Stock_Analysis_App" repository
3. Click on it to select
4. Railway will automatically detect:
   - ✅ Dockerfile (found!)
   - ✅ railway.json (found!)
   - ✅ Build configuration

### Step 4: Wait for Deploy
- Railway starts building automatically
- Takes ~2-3 minutes
- You'll see deployment logs in real-time
- Status changes from "Building" → "Deploying" → "Success" ✅

### Step 5: Get Your Backend URL
1. After deployment completes, click on the service
2. Look for "Public URL" or "Service URL" at the top
3. It will look like: `https://stock-analysis-api-xxxx.railway.app`
4. **Copy this URL** (you'll need it next)

### Step 6: Add Environment Variables to Railway
1. In Railway dashboard, click on your service
2. Go to "Variables" tab
3. Add each variable:

```
SUPABASE_URL = your_supabase_url_here
SUPABASE_KEY = your_supabase_key_here
GROQ_API_KEY = your_groq_key_here (optional but recommended)
PERPLEXITY_API_KEY = your_perplexity_key_here (optional)
```

4. Click "Save"
5. Railway will auto-redeploy with the new variables ✅

### Step 7: Verify Backend is Running
1. Open your browser and go to: `https://your-backend-url/health`
2. Replace `your-backend-url` with the actual URL from Step 5
3. You should see: `{"status":"OK"}`
4. If you see this → Backend is working! ✅

### Step 8: Connect to Vercel
1. Go to https://vercel.com/dashboard
2. Click on "stock_analysis_app" project
3. Go to "Settings" → "Environment Variables"
4. Click "Add new"
5. Fill in:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Railway backend URL (from Step 5)
   - Example: `https://stock-analysis-api-xxxx.railway.app`
6. Click "Save and Redeploy"
7. Wait for Vercel to rebuild (2-3 minutes)

### Step 9: Test Your App
1. Go to https://stockanalysisapp.vercel.app
2. Search for a stock (e.g., "RELIANCE" or "INFY")
3. Should show stock data without "backend is not connected" error ✅
4. Click analyze to see full analysis
5. Everything working? 🎉 **You're done!**

## Troubleshooting

### Backend won't start
Check Railway logs:
- Go to Railway dashboard → Your service → "Logs" tab
- Look for error messages
- Usually missing environment variables (SUPABASE_URL, SUPABASE_KEY)

### "health" endpoint not responding
- Wait 1-2 minutes for Railway to fully deploy
- Click "Redeploy" button in Railway if it's been stuck
- Check that service shows "Running" status (green)

### Frontend still shows "backend is not connected"
- Check NEXT_PUBLIC_API_URL in Vercel is set correctly (no trailing slash)
- Make sure Vercel redeployed (check deployment history)
- Browser cache: Clear cache (Ctrl+Shift+Del) or use incognito mode
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### CORS errors in browser console
This usually means backend is working but CORS isn't configured correctly. Check railway logs for CORS errors. The backend should handle this automatically.

## Cost

- **Railway:** Free tier includes monthly credits (~$5/month worth)
- **Vercel:** Free tier for Next.js app
- **Total for testing:** Completely free! ✅

## Environment Variables You Need

### For Railway Backend
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
GROQ_API_KEY=gsk_xxx... (optional but recommended)
PERPLEXITY_API_KEY=pplx-xxx... (optional)
```

### For Vercel Frontend  
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co (optional)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key (optional)
NEXT_PUBLIC_API_URL=https://stock-analysis-api-xxxx.railway.app (required!)
```

## Timeline
- Create Railway account: 1 min
- Deploy: 3-5 min
- Get URL: 1 min
- Add env vars: 2 min
- Test: 2 min
- **Total: ~15 minutes** ✅

---

Ready to go? Open https://railway.app now! 🚀
