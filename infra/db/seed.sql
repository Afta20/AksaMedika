-- =============================================================================
-- Seed Data for Aksamedika Demo
-- Passwords are bcrypt hashes of "password123"
-- =============================================================================

-- Demo Patients
INSERT INTO users (id, email, name, role, password_hash) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'budi.santoso@demo.com',   'Budi Santoso',   'patient', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'sari.dewi@demo.com',      'Sari Dewi',      'patient', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa'),
  ('a1b2c3d4-0003-0003-0003-000000000003', 'ahmad.rifai@demo.com',    'Ahmad Rifai',    'patient', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa')
ON CONFLICT (email) DO NOTHING;

-- Demo Doctors
INSERT INTO users (id, email, name, role, password_hash, specialty, license_no) VALUES
  ('b1b2c3d4-0001-0001-0001-000000000001', 'dr.andi@demo.com',    'Dr. Andi Prasetyo',   'doctor', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa', 'General Practitioner',  'STR-GP-001234'),
  ('b1b2c3d4-0002-0002-0002-000000000002', 'dr.rini@demo.com',    'Dr. Rini Wulandari',  'doctor', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa', 'Cardiologist',          'STR-CA-005678'),
  ('b1b2c3d4-0003-0003-0003-000000000003', 'dr.kevin@demo.com',   'Dr. Kevin Hartono',   'doctor', '$2a$10$k4ujqDxtMb1SfnvRbU8Guebs77eYzcUv2MrOh/YFdHM.NNSmEffAa', 'Internal Medicine',     'STR-IM-009012')
ON CONFLICT (email) DO NOTHING;

-- Medical Records for Budi Santoso
INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, visit_date, icd_code) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001',
   'Hypertension Stage 1', 'Amlodipine 5mg once daily', 'Patient reports occasional headaches. BP: 145/90 mmHg. Advised low-sodium diet and regular exercise.', '2025-06-15', 'I10'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0002-0002-0002-000000000002',
   'Mild Cardiac Arrhythmia', 'Bisoprolol 2.5mg', 'ECG shows occasional PVCs. Referred for Holter monitoring. Follow-up in 4 weeks.', '2025-04-22', 'I49.3'),

  ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001',
   'Acute Upper Respiratory Tract Infection', 'Amoxicillin 500mg 3x/day, Paracetamol 500mg PRN', 'Fever 38.2°C. Throat erythema. Full recovery expected in 5-7 days.', '2025-01-08', 'J06.9');

-- Medical Records for Sari Dewi
INSERT INTO medical_records (patient_id, doctor_id, diagnosis, prescription, notes, visit_date, icd_code) VALUES
  ('a1b2c3d4-0002-0002-0002-000000000002', 'b1b2c3d4-0003-0003-0003-000000000003',
   'Type 2 Diabetes Mellitus', 'Metformin 500mg twice daily', 'HbA1c: 7.8%. Fasting glucose: 195 mg/dL. Dietary counseling provided. Recheck in 3 months.', '2025-07-01', 'E11'),

  ('a1b2c3d4-0002-0002-0002-000000000002', 'b1b2c3d4-0001-0001-0001-000000000001',
   'Migraine without Aura', 'Sumatriptan 50mg PRN, Ibuprofen 400mg', 'Recurrent attacks 2-3x/month. Stress and sleep identified as triggers. Advised migraine diary.', '2025-05-18', 'G43.009')
ON CONFLICT DO NOTHING;

-- Audit Log Samples (historical access events)
INSERT INTO audit_logs (patient_id, doctor_id, doctor_name, access_method, ip_address, accessed_at) VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0001-0001-0001-000000000001', 'Dr. Andi Prasetyo', 'PIN', '192.168.1.10', now() - interval '2 days'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'b1b2c3d4-0002-0002-0002-000000000002', 'Dr. Rini Wulandari', 'QR', '10.0.0.55', now() - interval '7 days'),
  ('a1b2c3d4-0002-0002-0002-000000000002', 'b1b2c3d4-0003-0003-0003-000000000003', 'Dr. Kevin Hartono', 'PIN', '172.16.0.20', now() - interval '1 day');
