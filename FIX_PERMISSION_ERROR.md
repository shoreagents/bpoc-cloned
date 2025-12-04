# 🔧 Fixing "Permission Denied" Error

## Problem
You're getting: `permission denied for schema public`

This means ShoreAgents database has **Row Level Security (RLS)** enabled, and your API key doesn't have permission to read the tables.

---

## ✅ Solution 1: Add RLS Policies (Recommended for Development)

### Step 1: Go to ShoreAgents Supabase Dashboard
1. Open your **ShoreAgents** project in Supabase
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this into the SQL editor and click **Run**:

```sql
-- Enable RLS (if not already enabled)
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_acceptances ENABLE ROW LEVEL SECURITY;

-- Allow reading interview_requests
CREATE POLICY "Allow public read access to interview_requests" 
ON interview_requests 
FOR SELECT 
USING (true);

-- Allow updating interview_requests
CREATE POLICY "Allow public update to interview_requests" 
ON interview_requests 
FOR UPDATE 
USING (true);

-- Allow reading job_acceptances
CREATE POLICY "Allow public read access to job_acceptances" 
ON job_acceptances 
FOR SELECT 
USING (true);

-- Allow inserting job_acceptances
CREATE POLICY "Allow public insert to job_acceptances" 
ON job_acceptances 
FOR INSERT 
WITH CHECK (true);
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Test Again
Go to `http://localhost:3000/admin/interviews` - it should work now!

---

## ✅ Solution 2: Use Service Role Key (More Secure - Production)

### Step 1: Get Service Role Key
1. Go to ShoreAgents Supabase Dashboard
2. Click **Settings** → **API**
3. Copy the **service_role** key (⚠️ Keep this secret!)

### Step 2: Add to Environment Variables

Add this to your `.env.local`:

```bash
# ShoreAgents Service Role Key (bypasses RLS)
SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key-here"
```

⚠️ **Important**: 
- Service role key has FULL database access
- Never expose it in client-side code
- Only use in server-side API routes (we already handle this)
- Don't commit it to git

### Step 3: Restart Dev Server
```bash
npm run dev
```

The code will automatically use the service role key if it's available!

---

## 🔍 Which Solution Should I Use?

### Development / Testing:
✅ **Solution 1** (RLS Policies) - Simple and works fine

### Production:
✅ **Solution 2** (Service Role Key) - More secure, full control

You can even use **both**:
- Service role key for admin operations
- RLS policies as backup

---

## 🧪 Test the Fix

Once you've applied either solution:

```bash
# 1. Restart dev server
npm run dev

# 2. Go to admin interviews
http://localhost:3000/admin/interviews

# 3. You should see interviews loaded!
```

If you still get errors, check the terminal and let me know what error message you see.

---

## 📝 Files Created

I've created:
- `shoreagents-rls-policies.sql` - SQL policies to run
- Updated `shoreagents-db.ts` - Now supports service role key

---

## ❓ Still Having Issues?

Check:
1. ✅ Environment variables are correct
2. ✅ ShoreAgents database URL is correct
3. ✅ Tables `interview_requests` and `job_acceptances` exist
4. ✅ RLS policies are created OR service role key is set

Run this in ShoreAgents SQL Editor to check if tables exist:
```sql
SELECT * FROM interview_requests LIMIT 1;
```

If you get errors, share them and I'll help fix it!

