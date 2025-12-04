# 🔧 Troubleshooting Your .env.local

## Current Status
✅ Environment variables ARE loaded correctly (we just checked!)
❌ Still getting "permission denied" error

## The Problem
The error happens because your dev server was already running BEFORE you added the new environment variables. Next.js only loads .env variables when the server starts.

## ✅ Solution: Restart Your Dev Server

### Step 1: Stop the Current Server
In your terminal running `npm run dev`:
- Press **Ctrl + C** to stop it

### Step 2: Start Fresh
```bash
npm run dev
```

### Step 3: Test
Visit: `http://localhost:3000/admin/interviews`

---

## 📋 Verify Your .env.local Has These Variables

Your `.env.local` should contain (we verified these are set):

```bash
# ShoreAgents Database
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://..."
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="eyJ..."
SHOREAGENTS_SERVICE_ROLE_KEY="eyJ..."

# BPOC Database (already exists)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

---

## 🔍 How to Get Service Role Key (Most Important!)

The `SHOREAGENTS_SERVICE_ROLE_KEY` is what fixes the "permission denied" error.

### Get it from Supabase:
1. Go to **ShoreAgents** Supabase Dashboard
2. Click **Settings** (gear icon) → **API**
3. Scroll down to **Project API keys**
4. Find **service_role** key (⚠️ Secret key - keep it safe!)
5. Click to reveal and copy it
6. Add to `.env.local`:
   ```bash
   SHOREAGENTS_SERVICE_ROLE_KEY="paste-the-key-here"
   ```

---

## 🎯 Quick Checklist

- [x] Environment variables are set (✅ confirmed)
- [ ] Dev server has been restarted (MUST DO!)
- [ ] `SHOREAGENTS_SERVICE_ROLE_KEY` is the service_role key (not anon key)
- [ ] No extra spaces or quotes issues in .env.local

---

## 🚨 Common Mistakes

### ❌ Wrong: Using anon key for service role
```bash
# Don't use the same key for both!
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="eyJ..."
SHOREAGENTS_SERVICE_ROLE_KEY="eyJ..."  # ← Must be different key!
```

### ✅ Correct: Different keys
```bash
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="eyJhbG...short-key"
SHOREAGENTS_SERVICE_ROLE_KEY="eyJhbG...longer-different-key"
```

The service_role key is usually **longer** and has more permissions!

---

## 🧪 Test After Restart

Once you restart, run this to confirm it's working:

```bash
node check-env.js
```

Should show all ✅

Then check your app: `http://localhost:3000/admin/interviews`

---

## 💡 Still Not Working?

If you still get errors after restarting:

1. **Check the service_role key is correct**
   - Go to ShoreAgents Supabase → Settings → API
   - Copy the **service_role** key (bottom of the page)
   - Make sure it's the long one, not the anon key

2. **Verify the URL is correct**
   - Should be: `https://xxx.supabase.co` (no trailing slash)

3. **Check terminal for NEW errors**
   - After restart, what error do you see?
   - Share it and I'll help fix it!

---

## 🎉 Expected Result

After restart with correct keys, you should see:
- ✅ No "permission denied" errors
- ✅ Interviews loaded in admin tab
- ✅ Stats showing (pending, scheduled, etc.)
- ✅ Can see interview cards with candidate info

Let me know what happens after you restart! 🚀

