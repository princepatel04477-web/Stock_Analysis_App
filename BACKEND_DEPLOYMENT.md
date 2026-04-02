# Backend Deployment Guide

This guide explains how to deploy the FastAPI backend to production so your Vercel frontend can connect to it.

## Option 1: Deploy to Railway.app (Recommended - Easiest)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended)
3. Click "New Project"

### Step 2: Deploy from GitHub
1. Select "Deploy from GitHub repo"
2. Authorize Railway to access your GitHub
3. Select the `Stock_Analysis_App` repository
4. Click "Deploy"

Railway will automatically detect the `railway.json` and `Dockerfile` and deploy your backend!

### Step 3: Get Your Backend URL
1. After deployment, go to your project
2. Click on the "stock-analysis-api" service
3. Copy the public URL (e.g., `https://stock-analysis-api-xxxx.railway.app`)

### Step 4: Configure Vercel Environment Variable
1. Go to [vercel.com](https://vercel.com) dashboard
2. Select your "stock_analysis_app" project
3. Click "Settings" → "Environment Variables"
4. Add new variable:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** Your Railway backend URL (without trailing slash)
     - Example: `https://stock-analysis-api-xxxx.railway.app`
5. Click "Save and Redeploy"
6. Wait for Vercel to rebuild your frontend

### Step 5: Configure Backend Environment Variables in Railway
1. In Railway dashboard, click on "stock-analysis-api" service
2. Click "Variables" tab
3. Add the required variables:
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_KEY`: Your Supabase anon key
   - `GROQ_API_KEY`: Your Groq API key (optional but recommended)
   - `PERPLEXITY_API_KEY`: Your Perplexity API key (optional)

---

## Option 2: Deploy to Render.com

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"

### Step 2: Deploy from GitHub
1. Select "Build and deploy from Git repository"
2. Authorize Render to access your GitHub
3. Select the repository
4. Choose branch: `Final_Draft`
5. Choose Environment: `Python 3`
6. Build command: `pip install -r requirements.txt` (should auto-detect)
7. Start command: `python -m uvicorn backend.server:app --host 0.0.0.0 --port $PORT` (should auto-detect from render.yaml)

### Step 3: Set Environment Variables in Render
1. In the web service settings, scroll to "Environment"
2. Add variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GROQ_API_KEY` (optional)
   - `PERPLEXITY_API_KEY` (optional)

### Step 4: Get Your Backend URL
After deployment completes, copy the service URL from the Render dashboard.

### Step 5: Configure Vercel
Same as Option 1, Step 4-5, but use your Render service URL.

---

## Option 3: Deploy to Heroku (Legacy - Still Works)

### Step 1: Create Heroku Account & Install CLI
1. Go to [heroku.com](https://heroku.com) and create account
2. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Deploy from GitHub
```bash
heroku login
heroku create stock-analysis-api
git push heroku Final_Draft:main
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_KEY=your_key
heroku config:set GROQ_API_KEY=your_key
```

### Step 3: Get Your Backend URL
Your backend will be at: `https://stock-analysis-api.herokuapp.com`

---

## Troubleshooting

### "Failed to load stock list" Error
This means your Vercel frontend cannot reach the backend API.

**Check:**
1. ✅ Backend service is running (`/health` endpoint responds)
2. ✅ `NEXT_PUBLIC_API_URL` is set correctly in Vercel
3. ✅ Backend URL has no trailing slash
4. ✅ CORS is enabled on backend (it should be by default)

### Backend Won't Start
Check the deployment logs for:
- Missing environment variables (SUPABASE_URL, SUPABASE_KEY)
- Port binding issues
- Python dependency issues

### CORS Errors
If you see CORS errors in browser console, the backend's CORS configuration might need adjustment. Check `backend/server.py` for CORS middleware setup.

---

## Verifying Your Setup

After deployment:

1. **Test Backend Health:**
   ```
   curl https://your-backend-url.com/health
   ```
   Should return: `{"status":"OK"}`

2. **Test Frontend:**
   - Go to your Vercel app URL
   - Search for a stock (e.g., "RELIANCE")
   - Should show stock data without "backend is not connected" error

3. **Check Network Requests:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Search for stock
   - Should see successful API requests to `/api/stocks`, `/api/analyze/*`, etc.

---

## Important Notes

- **Backend must be running 24/7** for your app to work. Railway and Render free tiers may sleep after inactivity.
- **Upgrade to paid plan** if you need guaranteed uptime
- **CORS** is already configured in `backend/server.py` to allow requests from Vercel
- **Environment variables** should never be committed to git (they're in `.gitignore`)
