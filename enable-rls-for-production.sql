-- ============================================
-- RE-ENABLE RLS FOR PRODUCTION
-- ============================================
-- Run this script to re-enable Row Level Security
-- after testing is complete
-- ============================================

-- Enable RLS on all candidate-related tables
ALTER TABLE IF EXISTS candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_disc_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_disc_personality_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_typing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_typing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_ultimate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_cultural_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidate_work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resumes_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS privacy_settings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on job-related tables
ALTER TABLE IF EXISTS jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agency-related tables
ALTER TABLE IF EXISTS agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agency_clients ENABLE ROW LEVEL SECURITY;

-- Enable RLS on BPOC admin tables
ALTER TABLE IF EXISTS bpoc_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bpoc_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assessment tables
ALTER TABLE IF EXISTS assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Note: After enabling RLS, you'll need to ensure policies are in place
-- See: prisma-supabase/migrations/003_setup_rls_policies.sql

