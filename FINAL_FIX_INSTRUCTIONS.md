# 🎯 FINAL FIX - Two Possible Solutions

## Issue
Even the service_role key is being denied with code `42501`. This is unusual!

---

## Solution 1: Run These SQL Policies in ShoreAgents

### Step 1: Go to ShoreAgents Supabase Dashboard
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**

### Step 2: Check if Table Exists
Run this first to see if the table exists:

```sql
SELECT * FROM interview_requests LIMIT 1;
```

**If you get an error** → The table doesn't exist! (Go to Solution 2)
**If you get data** → Table exists, continue below!

### Step 3: Add RLS Policies
Copy and paste this entire block, then click **Run**:

```sql
-- Enable RLS
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_acceptances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to interview_requests" ON interview_requests;
DROP POLICY IF EXISTS "Allow public update to interview_requests" ON interview_requests;
DROP POLICY IF EXISTS "Allow public insert to interview_requests" ON interview_requests;
DROP POLICY IF EXISTS "Allow public read access to job_acceptances" ON job_acceptances;
DROP POLICY IF EXISTS "Allow public insert to job_acceptances" ON job_acceptances;
DROP POLICY IF EXISTS "Allow public update to job_acceptances" ON job_acceptances;

-- Create new policies
CREATE POLICY "Allow public read access to interview_requests" 
ON interview_requests FOR SELECT USING (true);

CREATE POLICY "Allow public update to interview_requests" 
ON interview_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public insert to interview_requests" 
ON interview_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to job_acceptances" 
ON job_acceptances FOR SELECT USING (true);

CREATE POLICY "Allow public insert to job_acceptances" 
ON job_acceptances FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to job_acceptances" 
ON job_acceptances FOR UPDATE USING (true);
```

### Step 4: Restart Your Dev Server
```bash
npm run dev
```

### Step 5: Test
Visit: `http://localhost:3000/admin/interviews`

Should work now! ✅

---

## Solution 2: If Table Doesn't Exist - Create It

If the table `interview_requests` doesn't exist, run this in ShoreAgents SQL Editor:

```sql
-- Create interview_requests table
CREATE TABLE interview_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID,
  bpoc_candidate_id UUID NOT NULL,
  candidate_first_name VARCHAR(255) NOT NULL,
  preferred_times JSONB NOT NULL,
  client_notes TEXT,
  admin_notes TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  scheduled_time TIMESTAMPTZ,
  meeting_link TEXT,
  client_preferred_start TIMESTAMPTZ,
  final_start_date TIMESTAMPTZ,
  hire_requested_at TIMESTAMPTZ,
  hire_requested_by UUID,
  offer_sent_at TIMESTAMPTZ,
  offer_response_at TIMESTAMPTZ,
  offer_decline_reason TEXT,
  work_schedule JSONB,
  client_timezone VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_acceptances table
CREATE TABLE job_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_request_id UUID UNIQUE NOT NULL REFERENCES interview_requests(id) ON DELETE CASCADE,
  bpoc_candidate_id UUID NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  candidate_phone VARCHAR(50),
  position VARCHAR(255) NOT NULL,
  company_id UUID,
  accepted_by_admin_id UUID,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  signup_email_sent BOOLEAN DEFAULT FALSE,
  signup_email_sent_at TIMESTAMPTZ,
  staff_user_id UUID UNIQUE,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  client_timezone VARCHAR(100) DEFAULT 'UTC',
  is_default_schedule BOOLEAN DEFAULT TRUE,
  work_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  work_start_time VARCHAR(10) DEFAULT '09:00',
  work_end_time VARCHAR(10) DEFAULT '18:00',
  custom_hours JSONB,
  salary DECIMAL(10, 2),
  shift_type VARCHAR(255),
  work_location VARCHAR(255),
  hmo_included BOOLEAN DEFAULT FALSE,
  leave_credits INT DEFAULT 12,
  work_hours TEXT,
  preferred_start_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_interview_requests_client ON interview_requests(client_user_id);
CREATE INDEX idx_interview_requests_status ON interview_requests(status);
CREATE INDEX idx_interview_requests_bpoc_candidate ON interview_requests(bpoc_candidate_id);

-- Enable RLS
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_acceptances ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow all operations on interview_requests" ON interview_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on job_acceptances" ON job_acceptances FOR ALL USING (true) WITH CHECK (true);
```

Then restart: `npm run dev`

---

## 🧪 Quick Test

After running either solution, test with:

```bash
node diagnose-shoreagents.js
```

Should show ✅ for both tests!

---

## 🎯 Summary

**Most Likely Issue:** Table `interview_requests` doesn't exist in ShoreAgents database yet!

**Try This First:**
1. Go to ShoreAgents Supabase → SQL Editor
2. Run: `SELECT * FROM interview_requests LIMIT 1;`
3. If error → Run Solution 2 (create table)
4. If works → Run Solution 1 (add policies)

Let me know which one you need! 🚀

