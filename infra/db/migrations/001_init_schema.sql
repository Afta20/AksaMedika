-- =============================================================================
-- Migration 001: Initial Schema for Aksamedika
-- Target: Neon PostgreSQL
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: users
-- Stores both patients and doctors. Role field differentiates access level.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('patient', 'doctor')),
  password_hash TEXT NOT NULL,
  specialty     TEXT,        -- Doctor only: e.g. "Cardiologist", "General Practitioner"
  license_no    TEXT,        -- Doctor only: Medical license number
  nik           VARCHAR(16) UNIQUE, -- Patient only: 16-digit National ID
  avatar_url    TEXT,        -- Optional profile photo
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Table: medical_records
-- Stores patient medical visit records. API-masked unless consent is granted.
-- Production Roadmap: Migrate to AES-GCM field-level encryption per patient key.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  diagnosis     TEXT NOT NULL,
  prescription  TEXT,
  notes         TEXT,
  visit_date    DATE NOT NULL,
  icd_code      TEXT,        -- Optional: ICD-10 diagnosis code for structured data
  data_integrity_hash TEXT,  -- Web3-ready: SHA-256 hash of patient_id+diagnosis+visit_date
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(patient_id, visit_date DESC);

-- Enable Row-Level Security (RLS)
-- NOTE: For hackathon MVP, RLS is enforced but relies on app_user role.
-- The Go backend sets session variables before queries in production.
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records FORCE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Table: access_tokens
-- Stores QR payloads and 6-digit PINs with 30-minute TTL.
-- Tokens are single-use (is_used flag) to prevent replay attacks.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS access_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin         CHAR(6) NOT NULL,       -- 6-digit numeric PIN (cryptographically random)
  qr_payload  TEXT NOT NULL UNIQUE,  -- UUID-based, encoded in QR code
  is_used     BOOLEAN DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL,  -- Always: created_at + 30 minutes
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Optimized index for fast PIN lookup (only on active, unexpired tokens)
CREATE INDEX IF NOT EXISTS idx_access_tokens_pin_active
  ON access_tokens(pin)
  WHERE is_used = false;

CREATE INDEX IF NOT EXISTS idx_access_tokens_expiry
  ON access_tokens(expires_at)
  WHERE is_used = false;

-- Auto-cleanup: mark expired tokens (run via Go cron or pg_cron)
-- CREATE EXTENSION IF NOT EXISTS pg_cron; -- Enable if using Neon's pg_cron
-- SELECT cron.schedule('cleanup-expired-tokens', '*/5 * * * *',
--   $$UPDATE access_tokens SET is_used = true WHERE expires_at < now() AND is_used = false$$
-- );

-- -----------------------------------------------------------------------------
-- Table: audit_logs
-- Immutable append-only log of every doctor access event.
-- HIPAA-aligned: never delete, never update.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES users(id),
  doctor_id     UUID NOT NULL REFERENCES users(id),
  doctor_name   TEXT NOT NULL,        -- Denormalized for query performance
  access_method TEXT NOT NULL CHECK (access_method IN ('PIN', 'QR', 'EMERGENCY')),
  ip_address    TEXT,                  -- Doctor's client IP at time of access
  accessed_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patient_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_doctor  ON audit_logs(doctor_id, accessed_at DESC);

-- Prevent updates/deletes on audit_logs to ensure immutability
-- Production: Add trigger to enforce append-only behavior
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. Modification is not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
