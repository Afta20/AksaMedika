<div align="center">

  <div style="background-color:#2563EB;width:72px;height:72px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  </div>

  <h1>Aksamedika</h1>

  <p><strong>Platform Rekam Medis Elektronik Berprinsip Zero-Trust</strong><br/>
  <em>Bukan rumah sakit yang menguasai data Anda — tapi Anda sendiri.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
    <img src="https://img.shields.io/badge/Go-1.22-00ADD8?style=for-the-badge&logo=go" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" />
    <img src="https://img.shields.io/badge/AI-Groq_Llama3-F55036?style=for-the-badge&logo=meta" />
    <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel" />
  </p>

  <p>
    <a href="https://aksa-medika.vercel.app"><strong>🌐 Demo Live</strong></a> ·
    <a href="apps/web/README.md">📱 Frontend Docs</a> ·
    <a href="apps/api/README.md">⚙️ Backend Docs</a>
  </p>

</div>

---

## 🎯 Tentang Proyek

**Aksamedika** adalah platform rekam medis elektronik (EMR) generasi baru yang membalikkan paradigma sistem kesehatan konvensional. Di sistem tradisional, rumah sakit memegang kendali penuh atas data pasien. Di Aksamedika, **pasien adalah pemilik sahnya**.

### Masalah yang Diselesaikan

| # | Masalah | Solusi Aksamedika |
|---|---|---|
| 1 | **Data Silo** — Rekam medis terpencar di berbagai server faskes | Satu akun terpusat untuk semua riwayat medis |
| 2 | **Privasi Rendah** — Staf bisa mengintip rekam medis tanpa sepengetahuan pasien | Zero-Trust: setiap akses butuh izin aktif dari pasien |
| 3 | **Keamanan Terpusat** — Server tunggal = target empuk peretas | JWT + bcrypt + token sementara 30 menit |
| 4 | **Tidak Ada Transparansi** — Pasien tidak tahu siapa yang membaca datanya | Audit Trail real-time dengan notifikasi SSE |

---

## ✨ Fitur Unggulan

### 🔐 1. Akses Token Sementara (30-Menit Dynamic Token)
Pasien men-*generate* **PIN 6-digit** atau **QR Code dinamis** yang hanya berlaku 30 menit. Setelah waktu habis, akses dokter otomatis terkunci tanpa perlu tindakan apa pun dari pasien.

### 📡 2. Notifikasi Real-Time (Server-Sent Events)
Setiap kali dokter mengakses data, **notifikasi langsung muncul** di layar pasien secara *real-time* via SSE stream. Pasien dapat langsung mencabut akses dengan satu klik (*Kill Switch*).

### 🤖 3. AI Medical Insights (Groq + Llama 3)
Setelah akses diberikan, **AI merangkum seluruh riwayat medis pasien** menjadi poin-poin klinis kritis (kondisi kronis, interaksi obat) dalam bahasa Indonesia — dalam hitungan detik.

### 🚨 4. Protokol Darurat Break-Glass
Untuk kondisi UGD di mana pasien tidak sadar, dokter dapat melakukan *override* darurat via NIK. Akses ini **tidak dapat disembunyikan** — sistem langsung mencatat log merah permanen dan mengirim alarm ke akun pasien.

### 📄 5. Ekspor PDF Rekam Medis
Dokter dapat mengekspor rekam medis pasien menjadi **dokumen PDF profesional** berisi watermark resmi Aksamedika, detail dokter, dan seluruh riwayat kunjungan.

### 🌙 6. Dark Mode System-Aware
Platform mendukung **tema gelap adaptif** yang mengikuti preferensi sistem OS pengguna — penting untuk kenyamanan tenaga medis yang berjaga malam.

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                      PENGGUNA (Browser)                     │
│    Pasien (HP/PC)          Dokter (Laptop)                  │
└────────────┬────────────────────┬───────────────────────────┘
             │  HTTPS             │  HTTPS + JWT Bearer
             ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND — Next.js 15 (Vercel)                 │
│  /              → Landing Page                              │
│  /auth/login    → Login Pasien & Dokter                     │
│  /patient/*     → Dashboard Pasien                         │
│  /doctor/*      → Portal Dokter                            │
│  /kiosk         → Terminal Darurat                         │
└──────────────────────────┬──────────────────────────────────┘
                           │  REST API + SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           BACKEND — Golang + Gin (Render/Railway)           │
│  ├── Auth Handler       → /api/auth/*                       │
│  ├── Patient Handler    → /api/patient/*                    │
│  ├── Doctor Handler     → /api/doctor/*                     │
│  ├── Kiosk Handler      → /api/kiosk/*                     │
│  └── Middleware         → JWT Validator, RBAC, CORS         │
└──────────────────────────┬──────────────────────────────────┘
                           │  pgx/v5 driver
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE — PostgreSQL (Neon Serverless)        │
│  users · medical_records · consent_tokens · audit_logs      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Frontend** | Next.js 15, React 19 | App Router, Server Components |
| **Styling** | Tailwind CSS, Shadcn UI | Radix Primitives |
| **Animasi** | Framer Motion | Micro-interactions & page transitions |
| **Backend** | Golang 1.22, Gin | Clean Architecture, blazing-fast REST API |
| **Database** | PostgreSQL @ Neon | Serverless, connection pooling |
| **Auth** | JWT (golang-jwt/v5) | Stateless, 24-jam expiry |
| **Enkripsi** | bcrypt (golang.org/x/crypto) | Hash NIK/password |
| **Real-Time** | Server-Sent Events (SSE) | Push notifikasi ke pasien |
| **AI** | Groq API, Llama 3.1 | AI medical summary |
| **PDF** | jspdf + html2canvas | Client-side export |
| **QR** | qrcode.react, html5-qrcode | Generate & scan QR |
| **Deploy FE** | Vercel | Edge Network, CI/CD otomatis |
| **Deploy BE** | Render / Railway via Docker | Container deployment |

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat

- Node.js **18+**
- Go **1.22+**
- PostgreSQL (atau akun [Neon](https://neon.tech) gratis)
- [Groq API Key](https://console.groq.com) (gratis)

### 1. Clone Repository

```bash
git clone https://github.com/Afta20/AksaMedika.git
cd AksaMedika
```

### 2. Setup Database

```bash
# Jalankan migrasi schema di database PostgreSQL Anda
psql -U postgres -d your_db_name -f infra/db/migrations/001_init_schema.sql
```

### 3. Setup Backend

```bash
cd apps/api

# Buat file .env
cp .env.example .env
# Isi DATABASE_URL dan GROQ_API_KEY di file .env

go mod tidy
go run cmd/server/main.go
# ✅ Backend berjalan di http://localhost:8080
```

### 4. Setup Frontend

```bash
cd apps/web

# Buat file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

npm install
npm run dev
# ✅ Frontend berjalan di http://localhost:3000
```

---

## 🎮 Demo Credentials (Akun Uji Coba)

Gunakan akun ini untuk mencoba aplikasi **tanpa perlu mendaftar**:

| Peran | Email | Password |
|---|---|---|
| 👤 **Pasien** | `budi.santoso@demo.com` | `password123` |
| 👨‍⚕️ **Dokter** | `dr.andi@demo.com` | `password123` |

---

## 🎬 Alur Demo "Wow" untuk Presentasi

> Gunakan **dua perangkat** (HP untuk Pasien, Laptop untuk Dokter) untuk efek maksimal.

**Langkah 1 — Pasien Generate Akses:**
Login sebagai Pasien → Klik **"Buat Token Akses"** → Pilih QR Code → Tunjukkan QR ke Dokter.

**Langkah 2 — Dokter Scan QR:**
Login sebagai Dokter → Klik **"Scan QR Code via Kamera"** → Arahkan ke QR pasien → Akses terbuka instan.

**Langkah 3 — AI Summary muncul:**
Rekam medis lengkap tampil + panel **"AI Medical Insights"** merangkum kondisi pasien dalam detik.

**Langkah 4 — Kill Switch:**
Kembali ke akun Pasien → Klik **"Cabut Izin Akses"** → Layar Dokter langsung terkunci.

**Langkah 5 — Break-Glass (Efek Paling Dramatis):**
Di Dashboard Dokter → Klik **"Akses Darurat"** → Isi NIK + alasan → Di akun Pasien, Audit Log langsung muncul badge merah 🚨 EMERGENCY.

---

## 📁 Struktur Monorepo

```
aksa-medika/
├── apps/
│   ├── api/          ← Backend Golang
│   │   ├── cmd/      ← Entry point server
│   │   ├── api/      ← Route handlers
│   │   └── pkg/      ← Business logic, DB, middleware
│   └── web/          ← Frontend Next.js
│       ├── app/      ← App Router pages
│       ├── components/  ← UI components
│       ├── lib/      ← API client, utilities
│       └── types/    ← TypeScript type definitions
├── infra/
│   └── db/migrations/  ← SQL schema migrations
├── docker-compose.yml
└── Makefile
```

---

## 🔒 Keamanan

- ✅ **JWT Stateless** — Token tidak disimpan di server, expired 24 jam
- ✅ **bcrypt** — NIK/KTP dan password di-hash sebelum masuk database
- ✅ **RBAC** — Endpoint `/patient/*` dan `/doctor/*` dipisah ketat
- ✅ **Token Sementara** — Consent token hanya berlaku 30 menit
- ✅ **Immutable Audit Log** — Log akses tidak dapat diedit atau dihapus
- ✅ **API Masking** — Pasien hanya melihat rekam medis miliknya dalam format masked

---

<div align="center">
  <strong>Dikembangkan oleh Afta20</strong><br/>
  <em>Membangun Masa Depan Layanan Kesehatan Indonesia yang Lebih Aman & Transparan</em><br/><br/>
  <a href="https://aksa-medika.vercel.app">🌐 aksa-medika.vercel.app</a>
</div>
