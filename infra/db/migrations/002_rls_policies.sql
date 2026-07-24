-- =============================================================================
-- Migration 002: RLS Policies & Application Role Setup
-- =============================================================================

-- Create a dedicated application role (never use postgres superuser in app)
-- Run this ONCE as superuser, then set DATABASE_URL to use app_user credentials
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    CREATE ROLE app_user WITH LOGIN PASSWORD 'change_this_in_production';
  END IF;
END
$$;

-- Grant minimal privileges
GRANT CONNECT ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
GRANT SELECT, INSERT, UPDATE ON medical_records TO app_user;
GRANT SELECT, INSERT, UPDATE ON access_tokens TO app_user;
GRANT SELECT, INSERT ON audit_logs TO app_user;  -- no UPDATE/DELETE on audit

-- -----------------------------------------------------------------------------
-- RLS Policies for medical_records
-- In Go, before each query set: SET LOCAL app.current_user_id = '<uuid>'
-- -----------------------------------------------------------------------------

-- Policy: Patients can always see their own records
CREATE POLICY patient_own_records_select ON medical_records
  FOR SELECT
  USING (
    patient_id::text = current_setting('app.current_user_id', true)
  );

-- Policy: Go backend (service role) can insert records on behalf of doctors
-- The backend validates consent before performing the insert
CREATE POLICY service_insert_records ON medical_records
  FOR INSERT
  WITH CHECK (true);  -- Enforced at application layer via consent validation

-- Policy: Allow backend to update its own inserted records
CREATE POLICY service_update_records ON medical_records
  FOR UPDATE
  USING (true);  -- Enforced at application layer

-- -----------------------------------------------------------------------------
-- RLS Policies for access_tokens
-- Patients can only see/manage their own tokens
-- -----------------------------------------------------------------------------
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_own_tokens ON access_tokens
  FOR ALL
  USING (
    patient_id::text = current_setting('app.current_user_id', true)
  );

-- -----------------------------------------------------------------------------
-- RLS for audit_logs — patients see their own, doctors see logs where they accessed
-- -----------------------------------------------------------------------------
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_see_own_audit ON audit_logs
  FOR SELECT
  USING (
    patient_id::text = current_setting('app.current_user_id', true)
    OR
    doctor_id::text = current_setting('app.current_user_id', true)
  );

CREATE POLICY service_insert_audit ON audit_logs
  FOR INSERT WITH CHECK (true);
