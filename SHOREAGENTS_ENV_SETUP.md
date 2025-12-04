# Interview System - Environment Setup

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```bash
# ShoreAgents Database (where interview data is stored)
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY="your-anon-key"

# BPOC Candidate Database (for fetching candidate details - already exists)
BPOC_DATABASE_URL="postgresql://user:password@host:port/bpoc_database"
# OR if BPOC is also on Supabase:
# NEXT_PUBLIC_BPOC_SUPABASE_URL="https://your-bpoc-project.supabase.co"
# NEXT_PUBLIC_BPOC_SUPABASE_ANON_KEY="your-bpoc-anon-key"
```

## How to Get Your Supabase Credentials

1. Go to your ShoreAgents Supabase project dashboard
2. Click on **Settings** (gear icon on the left)
3. Click on **API** in the settings menu
4. Copy these values:
   - **URL**: This is your `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_URL`
   - **anon public key**: This is your `NEXT_PUBLIC_SHOREAGENTS_SUPABASE_ANON_KEY`

## What Tables Should Exist in ShoreAgents Database

The system expects these tables in your ShoreAgents Supabase database:

1. **interview_requests** - Should have columns like:
   - `id`
   - `client_user_id`
   - `bpoc_candidate_id`
   - `candidate_first_name`
   - `preferred_times` (JSONB)
   - `client_notes`
   - `admin_notes`
   - `status`
   - `scheduled_time`
   - `meeting_link`
   - `created_at`
   - `updated_at`
   - etc.

2. **job_acceptances** (optional, for hiring flow)

## Quick Test

Once you add the environment variables, navigate to:
```
http://localhost:3000/admin/interviews
```

The page should load and fetch interview data from your ShoreAgents database!

## No SQL Migration Needed!

Since the data already exists in ShoreAgents, you can **ignore** or **delete** these files:
- `create-interview-system-tables.sql` (not needed)
- We're now using Supabase client instead of raw SQL

## What's Changed

✅ Removed SQL database migrations
✅ Using Supabase client to connect to ShoreAgents database
✅ Reading existing interview data
✅ Can update interview statuses through the admin UI
✅ Fetches candidate details from BPOC database

