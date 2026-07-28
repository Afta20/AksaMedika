import type {
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  RecordsResponse,
  GenerateConsentResponse,
  ValidateAccessPayload,
  ValidateAccessResponse,
  AuditLogResponse,
  DoctorStats,
  DoctorHistoryResponse,
  DoctorProfile,
  CreateRecordPayload,
  CreateRecordResponse,
  EmergencyAccessPayload,
  SummaryResponse
} from '@/types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data as T;
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ============================================================================
// Patient API
// ============================================================================

export const patientApi = {
  getRecords: (token: string) =>
    apiFetch<RecordsResponse>('/api/patient/records', {}, token),

  generateConsent: (token: string) =>
    apiFetch<GenerateConsentResponse>('/api/patient/consent/generate', {
      method: 'POST',
    }, token),

  getAuditLog: (token: string) =>
    apiFetch<AuditLogResponse>('/api/patient/audit', {}, token),

  revokeAccess: (token: string) =>
    apiFetch<{ message: string }>('/api/patient/revoke-access', {
      method: 'POST',
    }, token),
};

// ============================================================================
// Doctor API
// ============================================================================

export const doctorApi = {
  validateAccess: (payload: ValidateAccessPayload, token: string) =>
    apiFetch<ValidateAccessResponse>('/api/doctor/access', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  emergencyAccess: (payload: EmergencyAccessPayload, token: string) =>
    apiFetch<ValidateAccessResponse>('/api/doctor/emergency-access', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  getPatientRecords: (patientId: string, token: string) =>
    apiFetch<RecordsResponse>(`/api/doctor/records/${patientId}`, {}, token),

  getPatientSummaryAI: (patientId: string, token: string) =>
    apiFetch<SummaryResponse>(`/api/doctor/records/${patientId}/summary`, {}, token),

  createRecord: (patientId: string, payload: CreateRecordPayload, token: string) =>
    apiFetch<CreateRecordResponse>(`/api/doctor/records/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, token),

  getStats: (token: string) =>
    apiFetch<DoctorStats>('/api/doctor/stats', {}, token),

  getHistory: (token: string) =>
    apiFetch<DoctorHistoryResponse>('/api/doctor/my-history', {}, token),

  getProfile: (token: string) =>
    apiFetch<DoctorProfile>('/api/doctor/profile', {}, token),
};

// ============================================================================
// Settings & Kiosk API
// ============================================================================

export const getPatientSettings = (token: string) =>
  apiFetch<any>('/api/patient/settings', {}, token);

export const updatePatientSettings = (token: string, nik: string) =>
  apiFetch<any>('/api/patient/settings', {
    method: 'PUT',
    body: JSON.stringify({ nik }),
  }, token);

export const kioskEmergencyAccess = (payload: { nik: string, doctor_email: string, doctor_password: string }) =>
  apiFetch<any>('/api/kiosk/emergency-access', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

