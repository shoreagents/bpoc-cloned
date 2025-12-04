# 🚀 Interview System Setup - Step by Step

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================
# SHOREAGENTS DATABASE (Interview Data)
# ============================================
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://your-shoreagents-project.supabase.co"
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="your-shoreagents-anon-key"

# Optional but recommended: Service Role Key (bypasses RLS)
# Get from: Supabase Dashboard → Settings → API → service_role key
SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key"

# ============================================
# BPOC DATABASE (Candidate Data - Current Database)
# ============================================
# These should already exist in your .env
NEXT_PUBLIC_SUPABASE_URL="https://your-bpoc-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-bpoc-anon-key"
```

## How to Get ShoreAgents Database Credentials

### Step 1: Go to ShoreAgents Supabase Project
1. Log in to Supabase dashboard
2. Open your **ShoreAgents** project (the one with interview data)
3. Click **Settings** (gear icon on left)
4. Click **API**

### Step 2: Copy These Values
- **Project URL** → use as `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL`
- **anon public key** → use as `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY`

## Database Structure

### ShoreAgents Database Contains:
✅ `interview_requests` - All interview requests
✅ `job_acceptances` - Job offers and hiring data
✅ `client_users` - Client accounts
✅ `client_profiles` - Client extended info
✅ `company` - Company information

### BPOC Database Contains (Your Current DB):
✅ `users` - Candidate profiles
✅ `resumes_extracted` - Resume data
✅ `disc_personality_stats` - DISC assessments
✅ `typing_hero_stats` - Typing metrics
✅ `ai_analysis_results` - AI analysis

## What the System Does

1. **Fetches interviews** from ShoreAgents database
2. **Enriches with candidate data** from BPOC database (current DB)
3. **Displays in admin UI** with all details combined

## Admin Interview Tab Features

### View Interviews:
- See all interview requests
- Filter by status (PENDING, SCHEDULED, HIRE_REQUESTED, etc.)
- Search by candidate or client name

### Schedule Interviews:
- Set interview date/time
- Add meeting link (Zoom, Google Meet, etc.)
- Add admin notes

### Complete & Hire:
- Mark interviews as completed
- Send job offers
- Confirm hires and finalize

### Track Status:
- PENDING → SCHEDULED → COMPLETED → HIRE_REQUESTED → OFFER_SENT → HIRED

## No Database Migration Needed!

✅ **Tables already exist** in ShoreAgents database
✅ **Just connecting** to existing data
✅ **No SQL to run** - everything is ready

## Test the Connection

Once you add the environment variables:

```bash
# Restart dev server
npm run dev

# Navigate to admin interviews
http://localhost:3000/admin/interviews
```

You should see interviews fetched from ShoreAgents database! 🎉

## Troubleshooting

### "Failed to fetch interviews"
- Check that `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL` is correct
- Check that `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY` is correct
- Make sure the ShoreAgents database has `interview_requests` table

### "Error fetching candidate"
- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct (BPOC database)
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure Row Level Security (RLS) policies allow reading

### RLS Policies (if needed)

If you get permission errors, you may need to enable these policies in Supabase:

**ShoreAgents Database:**
```sql
-- Allow reading interview_requests
CREATE POLICY "Enable read access for all users" ON interview_requests
  FOR SELECT USING (true);

-- Allow reading job_acceptances
CREATE POLICY "Enable read access for all users" ON job_acceptances
  FOR SELECT USING (true);
```

**BPOC Database (already should be enabled):**
```sql
-- Allow reading users
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);
```

## Summary

1. ✅ Add 2 environment variables for ShoreAgents database
2. ✅ Restart dev server
3. ✅ Go to `/admin/interviews`
4. ✅ See your interview data!

That's it! No SQL migrations, no table creation - just connect and go! 🚀

