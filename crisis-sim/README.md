# Crisis Simulation — Deployment Guide

## What's in this folder
A complete React app, ready to deploy to Vercel. Your Supabase URL and key are already wired in (they're safe to expose — Supabase's anon key is meant to be public; access is controlled by row-level security policies you already set up).

## Step 1 — Create a GitHub repository
1. Go to https://github.com/new
2. Name it something like `crisis-sim`
3. Leave it Public or Private (either works for Vercel's free tier)
4. Click "Create repository" — don't add a README, .gitignore, or license (we already have files)

## Step 2 — Push this folder to GitHub
Open a terminal on your own computer (not this sandbox), download this folder, then run:

```bash
cd crisis-sim
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crisis-sim.git
git push -u origin main
```

Replace YOUR_USERNAME with your actual GitHub username.

## Step 3 — Deploy on Vercel
1. Go to https://vercel.com and sign up/log in (you can use your GitHub account to sign in directly)
2. Click "Add New" → "Project"
3. Select your `crisis-sim` repository from the list
4. Vercel auto-detects it's a Vite project — leave all settings as default
5. Click "Deploy"
6. Wait about 60 seconds — you'll get a URL like `crisis-sim-yourname.vercel.app`

## Step 4 — Test it
Open the URL Vercel gives you. You should see the landing page with "Game Master" and "Student" buttons.

## Step 5 — Running a live session
1. You open the URL, click "Game Master," set up your session (roles, teams, scenario context), paste your Anthropic API key
2. Share the same URL with students — they click "Student," pick their team and role
3. Every time you publish an event, it appears instantly on the matching students' screens

## Notes
- Every time you push a change to GitHub, Vercel automatically redeploys — no manual steps needed
- The Anthropic API key is never stored anywhere — you paste it fresh each session in the browser
- If you want a custom domain later (e.g. crisis.yourdomain.com), Vercel supports that for free too
