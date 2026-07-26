-- =============================================================================
-- Migration 003: Advanced Security (Web3-Ready & NIK Override)
-- Target: Neon PostgreSQL
-- =============================================================================

-- 1. Add NIK column to users table for Emergency Override via Kiosk
ALTER TABLE users ADD COLUMN IF NOT EXISTS nik VARCHAR(16) UNIQUE;

-- 2. Add Data Integrity Hash for Web3-Ready Immutability
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS data_integrity_hash TEXT;
