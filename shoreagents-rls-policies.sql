-- ============================================
-- SHOREAGENTS DATABASE RLS POLICIES
-- Run these in your ShoreAgents Supabase SQL Editor
-- ============================================

-- 1. Enable RLS on tables (if not already enabled)
ALTER TABLE interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_acceptances ENABLE ROW LEVEL SECURITY;

-- 2. Create policies to allow reading interview_requests
CREATE POLICY "Allow public read access to interview_requests" 
ON interview_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to interview_requests" 
ON interview_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to interview_requests" 
ON interview_requests 
FOR UPDATE 
USING (true);

-- 3. Create policies to allow reading job_acceptances
CREATE POLICY "Allow public read access to job_acceptances" 
ON job_acceptances 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to job_acceptances" 
ON job_acceptances 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to job_acceptances" 
ON job_acceptances 
FOR UPDATE 
USING (true);

-- 4. If you have client_users table, add policies
CREATE POLICY "Allow public read access to client_users" 
ON client_users 
FOR SELECT 
USING (true);

-- 5. If you have company table, add policies
CREATE POLICY "Allow public read access to company" 
ON company 
FOR SELECT 
USING (true);

-- ============================================
-- ALTERNATIVE: Use Service Role Key (More Secure)
-- ============================================
-- Instead of public policies, you can use service_role key
-- in your environment variables for admin operations
-- 
-- Add to .env.local:
-- SHOREAGENTS_SERVICE_ROLE_KEY="your-service-role-key"
--
-- Service role key bypasses RLS completely
-- Get it from: Supabase Dashboard → Settings → API → service_role key
-- ============================================

