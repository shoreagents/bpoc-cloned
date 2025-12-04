-- ============================================
-- DISABLE RLS FOR TESTING
-- ============================================
-- This script disables Row Level Security on all tables
-- Use this for testing/development only!
-- ============================================

-- Disable RLS on all candidate-related tables
ALTER TABLE IF EXISTS candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_disc_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_disc_personality_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_typing_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_typing_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_ultimate_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_cultural_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_ai_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_educations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_work_experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resumes_generated DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_leaderboard_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS privacy_settings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on job-related tables
ALTER TABLE IF EXISTS jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_skills DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_offers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on agency-related tables
ALTER TABLE IF EXISTS agencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_clients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on BPOC admin tables
ALTER TABLE IF EXISTS bpoc_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bpoc_profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on assessment tables
ALTER TABLE IF EXISTS assessment_sessions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (optional - shows which tables have RLS disabled)
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'candidates',
        'candidate_profiles',
        'candidate_resumes',
        'jobs',
        'job_applications',
        'agencies',
        'bpoc_users'
    )
ORDER BY tablename;

-- ============================================
-- TO RE-ENABLE RLS LATER, RUN:
-- ============================================
-- See: enable-rls-for-production.sql

