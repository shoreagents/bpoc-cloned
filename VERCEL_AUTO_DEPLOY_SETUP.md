# Vercel Auto-Deployment Setup Guide

## Step 1: Connect GitHub Repository to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `shoreagents/bpoc-cloned`
4. Vercel will detect it's a Next.js project automatically

## Step 2: Configure Production Branch

1. In Vercel project settings, go to **Settings** → **Git**
2. Set **Production Branch** to: `main`
3. Ensure **Auto-deploy** is enabled (should be by default)

## Step 3: Verify GitHub Integration

1. Go to your GitHub repo: https://github.com/shoreagents/bpoc-cloned
2. Go to **Settings** → **Webhooks**
3. Look for Vercel webhook (should be there automatically)
4. Verify it's **Active** and receiving events

## Step 4: Check Webhook Events

The Vercel webhook should listen for:
- ✅ Push events
- ✅ Pull request events (optional)

## Step 5: Test Auto-Deployment

1. Make a small change to any file
2. Commit and push to `main` branch:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Check Vercel dashboard - deployment should start automatically within seconds

## Troubleshooting

### If deployments don't trigger automatically:

1. **Check Vercel Dashboard**:
   - Go to project → Settings → Git
   - Verify repository is connected
   - Check if "Auto-deploy" toggle is ON

2. **Check GitHub Webhooks**:
   - GitHub repo → Settings → Webhooks
   - Find Vercel webhook
   - Check "Recent Deliveries" tab
   - Look for failed deliveries (red X)
   - Click on failed delivery to see error

3. **Reconnect Repository**:
   - Vercel Dashboard → Settings → Git
   - Click "Disconnect" then "Connect" again
   - This recreates the webhook

4. **Manual Trigger**:
   - Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment
   - Or click "Deploy" → "Deploy from GitHub" → Select `main` branch

5. **Check Branch Protection**:
   - GitHub repo → Settings → Branches
   - Ensure `main` branch doesn't have restrictions blocking webhooks

## Current Setup Status

- ✅ Repository: `shoreagents/bpoc-cloned`
- ✅ Production Branch: `main`
- ✅ Latest Commit: Check with `git log -1 --oneline`
- ✅ Webhook: Should be auto-created by Vercel

## Quick Test Command

```bash
# Create empty commit to trigger deployment
git commit --allow-empty -m "Test auto-deploy"
git push origin main
```

Then check Vercel dashboard - deployment should start automatically!
