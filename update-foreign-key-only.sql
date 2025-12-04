-- =====================================================
-- UPDATE FOREIGN KEY CONSTRAINT ONLY
-- =====================================================
-- This script updates the foreign key constraint in the applications table
-- to point to job_requests instead of processed_job_requests
-- 
-- IMPORTANT: This does NOT drop the processed_job_requests table
-- Run this first, then you can safely drop the table later

BEGIN;

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE applications 
  DROP CONSTRAINT IF EXISTS applications_job_id_fkey;

-- Step 2: Add new foreign key constraint pointing to job_requests
ALTER TABLE applications 
  ADD CONSTRAINT applications_job_id_fkey 
  FOREIGN KEY (job_id) 
  REFERENCES job_requests(id) 
  ON DELETE CASCADE;

-- Step 3: Verify the constraint (optional - for checking)
-- SELECT 
--   conname as constraint_name,
--   conrelid::regclass as table_name,
--   confrelid::regclass as referenced_table
-- FROM pg_constraint 
-- WHERE conname = 'applications_job_id_fkey';

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running this, verify with:
-- SELECT 
--   conname as constraint_name,
--   conrelid::regclass as table_name,
--   confrelid::regclass as referenced_table
-- FROM pg_constraint 
-- WHERE conname = 'applications_job_id_fkey';
--
-- Should show: referenced_table = 'job_requests'

