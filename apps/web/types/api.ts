// =============================================================================
// TypeScript types mirroring the Go API response structures
// =============================================================================

// -------------------------------- Auth --------------------------------

export interface User {
  id: string;
  name: string;
  role: 'patient' | 'doctor';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
  role: 'patient' | 'doctor';
  specialty?: string;
  license_no?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  license_no?: string;
}

// -------------------------------- Medical Records --------------------------------

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  doctor_name?: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;
  icd_code?: string;
  visit_date: string;
  created_at: string;
}

export interface MaskedRecord {
  id: string;
  visit_date: string;
  diagnosis: string;
  created_at: string;
}

export interface RecordsResponse {
  records: MedicalRecord[] | MaskedRecord[];
  total: number;
}

export interface CreateRecordPayload {
  diagnosis: string;
  prescription?: string;
  notes?: string;
  icd_code?: string;
  visit_date: string; // "YYYY-MM-DD"
}

export interface CreateRecordResponse {
  message: string;
  record_id: string;
}

// -------------------------------- Consent / Access Tokens --------------------------------

export interface GenerateConsentResponse {
  token_id: string;
  pin: string;
  qr_payload: string;
  expires_at: string;
  expires_in_seconds: number;
}

export interface ValidateAccessPayload {
  pin?: string;
  qr_payload?: string;
}

export interface ValidateAccessResponse {
  patient_id: string;
  patient_name: string;
  message: string;
}

// -------------------------------- Audit Logs --------------------------------

export interface AuditEntry {
  id: string;
  doctor_name: string;
  access_method: 'PIN' | 'QR' | 'EMERGENCY';
  ip_address?: string;
  accessed_at: string;
}

export interface AuditLogResponse {
  logs: AuditEntry[];
  total: number;
}

// -------------------------------- Doctor Stats & History --------------------------------

export interface DoctorStats {
  total_accesses: number;
  today_accesses: number;
  last_accessed_at?: string;
}

export interface DoctorHistoryEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  access_method: 'PIN' | 'QR' | 'EMERGENCY';
  accessed_at: string;
}

export interface DoctorHistoryResponse {
  history: DoctorHistoryEntry[];
  total: number;
}

// -------------------------------- Break-Glass / AI --------------------------------

export interface EmergencyAccessPayload {
  patient_nik: string;
  reason: string;
}

export interface SummaryResponse {
  summary: string;
}

// -------------------------------- API Error --------------------------------

export interface ApiError {
  error: string;
}
