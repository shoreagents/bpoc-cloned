# 🔧 URGENT: Fix Your Environment File

## Problem Found!

You're using **`.env`** but Next.js needs **`.env.local`** for development!

---

## ✅ Quick Fix (2 steps):

### Step 1: Create `.env.local` file

In the `bpoc/` folder, create a new file named `.env.local` (not `.env`)

### Step 2: Add Your Keys

Copy this template and fill in YOUR values:

```bash
# SHOREAGENTS DATABASE
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://your-shoreagents-project.supabase.co"
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="your-anon-key"
SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key"

# BPOC DATABASE (copy from your existing .env)
NEXT_PUBLIC_SUPABASE_URL="https://your-bpoc-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-bpoc-anon-key"

# Copy any other vars from your .env file
```

---

## 📋 How to Get the Keys

### For ShoreAgents Database:

1. Go to **ShoreAgents** Supabase Dashboard
2. Click **Settings** (gear icon) → **API**
3. You'll see:
   
   ```
   Project URL
   https://xxxxx.supabase.co  ← Copy this
   
   Project API keys
   
   anon public  (at top)
   eyJhbGci... ← Copy this for ANON_KEY
   [Reveal/Hide button]
   
   service_role secret  (at bottom) 
   eyJhbGci...longer-key... ← Copy this for SERVICE_ROLE_KEY
   [Reveal/Hide button]
   ```

4. The **service_role** key should be **LONGER** than anon key!

---

## 🎯 Your `.env.local` Should Look Like:

```bash
# ShoreAgents (3 vars)
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://abcdefgh.supabase.co"
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="eyJhbGciOiJIUz...short"
SHOREAGENTS_SERVICE_ROLE_KEY="eyJhbGciOiJIUz...much-longer"

# BPOC (2 vars - from your existing .env)
NEXT_PUBLIC_SUPABASE_URL="https://xyz123.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUz..."
```

---

## ⚠️ Key Differences Between Files

| File | Loaded in Dev? | Committed to Git? |
|------|---------------|-------------------|
| `.env.local` | ✅ YES | ❌ NO (gitignored) |
| `.env` | ❌ NO | ⚠️ Sometimes (dangerous!) |

Next.js **ignores** `.env` in development mode!

---

## 🚀 After Creating `.env.local`:

1. **Restart your dev server**:
   ```bash
   # Stop (Ctrl+C), then:
   npm run dev
   ```

2. **Test the connection**:
   ```bash
   node check-env.js
   ```
   Should show all ✅

3. **Visit your app**:
   ```
   http://localhost:3000/admin/interviews
   ```

---

## 🔒 Security Note

- ✅ `.env.local` is automatically gitignored
- ⚠️ `.env` might be committed - be careful!
- 🚫 NEVER commit service_role keys to git!

---

## Need Help?

Run this to verify your setup:
```bash
node check-env.js
```

It will tell you if all variables are loaded correctly!

