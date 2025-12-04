-- Interview System Tables Migration
-- Created for implementing the complete interview request and hiring system

-- 1. Create interview_requests table
CREATE TABLE IF NOT EXISTS interview_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL,
  bpoc_candidate_id UUID NOT NULL,
  candidate_first_name VARCHAR(255) NOT NULL,
  preferred_times JSONB NOT NULL,
  client_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  admin_notes TEXT,
  client_preferred_start TIMESTAMP,
  final_start_date TIMESTAMP,
  hire_requested_at TIMESTAMP,
  hire_requested_by UUID,
  meeting_link TEXT,
  offer_decline_reason TEXT,
  offer_response_at TIMESTAMP,
  offer_sent_at TIMESTAMP,
  scheduled_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'PENDING',
  work_schedule JSONB,
  client_timezone VARCHAR(100)
);

-- Create indexes for interview_requests
CREATE INDEX IF NOT EXISTS idx_interview_requests_client ON interview_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_status ON interview_requests(status);
CREATE INDEX IF NOT EXISTS idx_interview_requests_bpoc_candidate ON interview_requests(bpoc_candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_requests_created_at ON interview_requests(created_at);

-- 2. Create job_acceptances table
CREATE TABLE IF NOT EXISTS job_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_request_id UUID UNIQUE NOT NULL,
  bpoc_candidate_id UUID NOT NULL,
  candidate_email VARCHAR(255) NOT NULL,
  candidate_phone VARCHAR(50),
  position VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL,
  accepted_by_admin_id UUID NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW(),
  signup_email_sent BOOLEAN DEFAULT FALSE,
  signup_email_sent_at TIMESTAMP,
  staff_user_id UUID UNIQUE,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  client_timezone VARCHAR(100) DEFAULT 'UTC',
  is_default_schedule BOOLEAN DEFAULT TRUE,
  work_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  work_end_time VARCHAR(10) DEFAULT '18:00',
  work_start_time VARCHAR(10) DEFAULT '09:00',
  custom_hours JSONB,
  salary DECIMAL(10, 2),
  shift_type VARCHAR(255),
  work_location VARCHAR(255),
  hmo_included BOOLEAN DEFAULT FALSE,
  leave_credits INT DEFAULT 12,
  work_hours TEXT,
  preferred_start_date TIMESTAMP,
  FOREIGN KEY (interview_request_id) REFERENCES interview_requests(id) ON DELETE CASCADE
);

-- Create indexes for job_acceptances
CREATE INDEX IF NOT EXISTS idx_job_acceptances_interview ON job_acceptances(interview_request_id);
CREATE INDEX IF NOT EXISTS idx_job_acceptances_candidate ON job_acceptances(bpoc_candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_acceptances_staff ON job_acceptances(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_job_acceptances_company ON job_acceptances(company_id);

-- 3. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_interview_requests_updated_at ON interview_requests;
CREATE TRIGGER update_interview_requests_updated_at 
    BEFORE UPDATE ON interview_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_acceptances_updated_at ON job_acceptances;
CREATE TRIGGER update_job_acceptances_updated_at 
    BEFORE UPDATE ON job_acceptances 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Add comments to tables
COMMENT ON TABLE interview_requests IS 'Stores all interview requests from clients to hire candidates';
COMMENT ON TABLE job_acceptances IS 'Stores job offer details and tracks the hiring process';

-- 5. Sample insert for testing (optional - remove in production)
-- INSERT INTO interview_requests (
--   client_user_id, 
--   bpoc_candidate_id, 
--   candidate_first_name, 
--   preferred_times, 
--   client_notes,
--   client_timezone,
--   status,
--   updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000'::UUID,
--   '00000000-0000-0000-0000-000000000001'::UUID,
--   'Test Candidate',
--   '[{"datetime": "2025-12-15T09:00", "timezone": "Asia/Manila", "timezoneDisplay": "Philippine Time (PHT)"}]'::JSONB,
--   'Test interview request',
--   'Asia/Manila',
--   'PENDING',
--   NOW()
-- );

COMMENT ON COLUMN interview_requests.status IS 'PENDING, SCHEDULED, RESCHEDULE_REQUESTED, COMPLETED, HIRE_REQUESTED, OFFER_SENT, OFFER_ACCEPTED, OFFER_DECLINED, HIRED, REJECTED, CANCELLED';
COMMENT ON COLUMN interview_requests.preferred_times IS 'JSON array of preferred interview times with timezone info';
COMMENT ON COLUMN interview_requests.work_schedule IS 'JSON object containing work schedule details (days, hours, timezone)';
COMMENT ON COLUMN job_acceptances.shift_type IS 'DAY_SHIFT, NIGHT_SHIFT, or FLEXIBLE';
COMMENT ON COLUMN job_acceptances.work_location IS 'WORK_FROM_HOME, OFFICE, or HYBRID';

