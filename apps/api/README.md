# ⚙️ Aksamedika — Backend API

> REST API engine untuk platform Aksamedika, dibangun dengan **Golang 1.22** + **Gin** menggunakan prinsip Clean Architecture. Mengelola autentikasi JWT, logika otorisasi Zero-Trust, enkripsi data sensitif, dan streaming notifikasi real-time via SSE.

---

## ✅ Prasyarat

| Tool | Versi Minimum |
|---|---|
| Go | 1.22 atau lebih baru |
| PostgreSQL | 14+ (atau akun [Neon](https://neon.tech) gratis) |
| Groq API Key | Daftar gratis di [console.groq.com](https://console.groq.com) |

---

## 🚀 Menjalankan Secara Lokal

### 1. Masuk ke direktori backend

```bash
cd apps/api
```

### 2. Install dependensi Go

```bash
go mod tidy
```

### 3. Setup Database

Jalankan file migrasi SQL untuk membuat schema:

```bash
psql -U postgres -d nama_database_anda -f ../../infra/db/migrations/001_init_schema.sql
```

Atau jika menggunakan Neon, buka SQL Editor di dashboard Neon dan paste isi file migrasi tersebut.

### 4. Buat file environment

```bash
cp .env.example .env
```

Isi file `.env`:

```env
# Wajib: Connection string PostgreSQL
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require

# Wajib: API key untuk AI Medical Summary
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Opsional: JWT secret key (jika tidak diisi, pakai default development)
JWT_SECRET=ganti_dengan_secret_yang_kuat_di_produksi

# Opsional: Port server (default: 8080)
PORT=8080
```

### 5. Jalankan server

```bash
go run cmd/server/main.go
```

Server akan berjalan di: **http://localhost:8080**

Untuk development dengan hot-reload, install [Air](https://github.com/air-verse/air):

```bash
go install github.com/air-verse/air@latest
air
```

---

## 🗂️ Struktur Direktori

```
apps/api/
├── cmd/
│   └── server/
│       └── main.go         ← Entry point — init DB, setup router, start server
│
├── api/                    ← HTTP Layer (Handlers & Routes)
│   ├── router.go           ← Definisi semua route & grup middleware
│   ├── auth_handler.go     ← POST /api/auth/register & /login
│   ├── patient_handler.go  ← GET/POST /api/patient/*
│   ├── doctor_handler.go   ← GET/POST /api/doctor/*
│   └── kiosk_handler.go    ← POST /api/kiosk/emergency-access
│
├── pkg/                    ← Core Business Logic
│   ├── db/
│   │   └── postgres.go     ← Koneksi pool pgx/v5
│   ├── middleware/
│   │   ├── auth.go         ← JWT validator middleware
│   │   └── role.go         ← RBAC — cek role patient/doctor
│   ├── service/
│   │   ├── auth_service.go         ← Logika register & login
│   │   ├── patient_service.go      ← Logika rekam medis & consent token
│   │   ├── doctor_service.go       ← Logika validasi akses & audit
│   │   └── ai_service.go           ← Integrasi Groq API
│   └── model/
│       ├── user.go          ← Struct User & Doctor
│       ├── record.go        ← Struct MedicalRecord & MaskedRecord
│       ├── consent.go       ← Struct ConsentToken
│       └── audit.go         ← Struct AuditLog
│
├── Dockerfile               ← Container image untuk deployment
├── go.mod                   ← Go module dependencies
└── go.sum                   ← Dependency lock file
```

---

## 🗃️ Schema Database

```sql
-- Tabel pengguna (Pasien dan Dokter)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,          -- bcrypt hash
    role        TEXT NOT NULL,          -- 'patient' | 'doctor'
    specialty   TEXT,                   -- khusus dokter
    license_no  TEXT,                   -- Nomor SIP dokter
    nik_hash    TEXT,                   -- bcrypt hash NIK (khusus pasien)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Rekam medis
CREATE TABLE medical_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id),
    doctor_id   UUID REFERENCES users(id),
    diagnosis   TEXT NOT NULL,
    prescription TEXT,
    notes       TEXT,
    icd_code    TEXT,
    visit_date  DATE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Token akses sementara (PIN & QR)
CREATE TABLE consent_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id  UUID NOT NULL REFERENCES users(id),
    pin_hash    TEXT NOT NULL,          -- bcrypt hash PIN 6-digit
    qr_payload  TEXT NOT NULL,
    is_used     BOOLEAN DEFAULT FALSE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Log audit semua akses
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES users(id),
    doctor_id       UUID REFERENCES users(id),
    doctor_name     TEXT,
    access_method   TEXT NOT NULL,      -- 'PIN' | 'QR' | 'EMERGENCY' | 'REVOKED'
    ip_address      TEXT,
    accessed_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Daftar Endpoint API

### Auth

| Method | Endpoint | Auth | Deskripsi |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | ❌ | Buat akun baru |
| `POST` | `/api/auth/login` | ❌ | Login & dapatkan JWT |

### Patient

| Method | Endpoint | Auth | Deskripsi |
|---|---|:---:|---|
| `GET` | `/api/patient/records` | ✅ | Ambil rekam medis (masked) |
| `POST` | `/api/patient/consent/generate` | ✅ | Generate PIN & QR Code (30 menit) |
| `GET` | `/api/patient/audit` | ✅ | Riwayat semua akses |
| `POST` | `/api/patient/revoke-access` | ✅ | Cabut semua sesi aktif |
| `GET` | `/api/patient/settings` | ✅ | Ambil setting akun |
| `PUT` | `/api/patient/settings` | ✅ | Update NIK |
| `GET` | `/api/patient/notify/stream` | ✅ | SSE stream notifikasi real-time |

### Doctor

| Method | Endpoint | Auth | Deskripsi |
|---|---|:---:|---|
| `POST` | `/api/doctor/access` | ✅ | Verifikasi PIN/QR akses pasien |
| `POST` | `/api/doctor/emergency-access` | ✅ | Break-Glass override via NIK |
| `GET` | `/api/doctor/records/:patientId` | ✅ | Rekam medis lengkap pasien |
| `POST` | `/api/doctor/records/:patientId` | ✅ | Tambah rekam medis baru |
| `GET` | `/api/doctor/records/:patientId/summary` | ✅ | Ringkasan AI (Groq) |
| `GET` | `/api/doctor/stats` | ✅ | Statistik akses dokter |
| `GET` | `/api/doctor/my-history` | ✅ | Riwayat pasien diakses |
| `GET` | `/api/doctor/profile` | ✅ | Profil dokter |

### Kiosk

| Method | Endpoint | Auth | Deskripsi |
|---|---|:---:|---|
| `POST` | `/api/kiosk/emergency-access` | ❌ | Akses darurat dari terminal publik |

> Dokumentasi lengkap setiap endpoint (request body, response, contoh cURL) tersedia di **[API Documentation](../../docs/API_Documentation.md)**.

---

## 🔒 Arsitektur Keamanan

```
Request Masuk
     │
     ▼
┌─────────────────────┐
│   CORS Middleware   │  ← Hanya izinkan origin yang disetujui
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   JWT Middleware    │  ← Verifikasi & decode Bearer token
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   RBAC Middleware   │  ← Cek role: patient/doctor/public
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│     Handler         │  ← Business logic + DB query
└─────────────────────┘
```

| Mekanisme | Implementasi |
|---|---|
| **JWT** | `golang-jwt/jwt/v5`, secret dari env, expired 24 jam |
| **Password Hash** | `bcrypt` via `golang.org/x/crypto`, cost factor 12 |
| **NIK Hash** | `bcrypt` — NIK tidak pernah disimpan plaintext |
| **PIN Hash** | `bcrypt` — PIN 6-digit di-hash sebelum masuk DB |
| **Token TTL** | Consent token auto-expired 30 menit via `expires_at` |
| **Audit Trail** | Setiap akses dicatat, tidak ada endpoint untuk hapus log |
| **API Masking** | Dokter hanya bisa baca data pasien yang aktif memberikan izin |

---

## 🐳 Docker

### Build image

```bash
docker build -t aksamedika-api .
```

### Jalankan container

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://..." \
  -e GROQ_API_KEY="gsk_..." \
  -e JWT_SECRET="secret" \
  aksamedika-api
```

### Menggunakan docker-compose (dari root monorepo)

```bash
# Di root direktori proyek
docker-compose up --build
```

---

## 🚢 Deployment ke Render / Railway

### Render
1. Buat **Web Service** baru dari GitHub repository
2. Set **Root Directory** ke `apps/api`
3. Set **Build Command**: `go build -o server cmd/server/main.go`
4. Set **Start Command**: `./server`
5. Tambahkan environment variables: `DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`

### Railway
File `railway.toml` sudah tersedia di root repositori. Cukup:
1. Hubungkan repository ke Railway
2. Tambahkan environment variables
3. Deploy otomatis

---

## 🧰 Perintah Makefile

```bash
make run        # Jalankan server development
make build      # Build binary
make migrate    # Jalankan migrasi database
make test       # Jalankan unit tests
```

---

## 📦 Dependensi Utama

| Package | Fungsi |
|---|---|
| `gin-gonic/gin` | HTTP framework performa tinggi |
| `golang-jwt/jwt/v5` | Generate & validasi JWT |
| `jackc/pgx/v5` | PostgreSQL driver dengan connection pooling |
| `golang.org/x/crypto` | bcrypt untuk hash password & NIK |
| `joho/godotenv` | Load environment variables dari `.env` |
| `google/uuid` | Generate UUID v4 untuk primary key |
| `gin-contrib/cors` | CORS middleware untuk Gin |
