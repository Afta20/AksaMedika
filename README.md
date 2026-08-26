<div align="center">

  <div style="background-color:#2563EB;width:72px;height:72px;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);">
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>
    </svg>
  </div>

  <h1>Aksamedika</h1>

  <p><strong>Platform Rekam Medis Elektronik Berbasis Zero-Trust untuk Masyarakat 5.0</strong><br/>
  <em>Mengembalikan Kedaulatan Data Kesehatan Sepenuhnya ke Tangan Pasien.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15_(App_Router)-000000?style=for-the-badge&logo=next.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon_Serverless-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img src="https://img.shields.io/badge/AI_Engine-Groq_Llama_3.3_70B-F55036?style=for-the-badge&logo=meta&logoColor=white" />
    <img src="https://img.shields.io/badge/Security-Zero--Trust_Protocol-10B981?style=for-the-badge&logo=shield&logoColor=white" />
    <img src="https://img.shields.io/badge/Deploy-Vercel_Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  </p>

  <p>
    <a href="https://aksa-medika.vercel.app"><strong>🌐 Live Demo</strong></a> ·
    <a href="#-fitur-unggulan">✨ Fitur Unggulan</a> ·
    <a href="#-arsitektur-sistem">🏗️ Arsitektur</a> ·
    <a href="#-cara-menjalankan-lokal">💻 Local Setup</a> ·
    <a href="#-kepatuhan-hukum--regulasi">⚖️ Regulasi</a>
  </p>

</div>

---

## 💡 Filosofi Arsitektur & Latar Belakang

Di sebagian besar fasilitas kesehatan modern, rekam medis dikelola dengan pendekatan **Hospital-Centric**: data pasien tersimpan di silo server internal rumah sakit tanpa transparansi. Pasien tidak memiliki salinan datanya sendiri, tidak mengetahui siapa saja staf yang mengintip berkas medisnya, dan dipaksa mengulang prosedur tes diagnostik setiap kali berpindah klinik.

**Aksamedika** merombak total paradigma ini. Melalui pendekatan **Patient-Centric Zero-Trust Architecture**:
- 🔑 **Pasien adalah Pemilik Utama Data**: Dokter maupun pihak medis *tidak memiliki akses bawaan* ke rekam medis pasien.
- ⏱️ **Akses Sementara Berbasis Consent**: Akses hanya terbuka jika pasien membagikan PIN 6-digit atau QR Code yang berlaku **tepat 30 menit** (*single-use TTL*).
- 📜 **Audit Trail Mutlak & Imutabel**: Setiap detik sesi dokter tercatat dalam audit log permanen di level database yang tidak dapat diubah atau dihapus (*Append-Only*).

---

## ⚡ Key Features (Fitur Unggulan)

### 1. 🔑 Dynamic Consent Token Engine (PIN 6-Digit & QR Code)
Pasien dapat meng-generate token otorisasi sementara langsung dari HP mereka. Token berupa PIN 6-digit (kriptografis `crypto/rand`) dan QR Code dinamis dengan durasi **TTL 30 menit**. Sekali dokter menggunakannya untuk membuka sesi, token langsung mati (*Single-Use*) untuk mencegah *replay attack*.

### 2. 🤖 Sub-Second AI Clinical Summarizer (Groq Llama 3.3 70B)
Untuk efisiensi anamnesis di ruang periksa, AI merangkum seluruh riwayat medis pasien yang kompleks menjadi **4 poin klinis ringkas** (Diagnosis Utama, Obat Terakhir, Catatan Alergi, & Saran Anamnesis) dengan kecepatan respon **< 1 detik** (840ms).

### 3. 🚨 Break-Glass Protocol (Terminal Kiosk UGD)
Dalam situasi gawat darurat (misal: pasien tidak sadar di UGD), dokter dapat melakukan *override* darurat melalui NIK 16-digit di terminal Kiosk. Akses ini diautentikasi ganda dan langsung memicu log audit berstatus 🚨 `EMERGENCY` serta notifikasi ke akun pasien.

### 4. 📺 CCTV Audit Log & Instant Revoke (Kill Switch)
Pasien memiliki dashboard pengawas layaknya CCTV. Pasien dapat melihat nama dokter, jam akses, dan metode yang digunakan secara *real-time*. Jika mendeteksi aktivitas mencurigakan, pasien dapat mencabut izin akses secara instan via tombol **"Cabut Izin Akses"**.

### 5. 📄 Client-Side PDF Export Engine
Dokumen rekam medis dapat diunduh menjadi berkas PDF resmi terformat rapi yang dilengkapi header keamanan dan *SHA-256 Data Integrity Hash* secara langsung dari browser tanpa beban komputasi server.

### 6. 🌙 Smart Auto Night Shift (Doctor UI Engine)
Mengakomodasi jam kerja dokter piket malam, interface Dokter secara cerdas mengaktifkan **Dark Mode otomatis pada jam 18:00 - 06:00 WIB** dengan kendali manual override pill toggle di header.

---

## 🏗️ Arsitektur Sistem & Data Flow

### Monorepo Topologi

```
                               ┌─────────────────────────────────────────┐
                               │            CLIENT LAYER                 │
                               │  Pasien (Mobile) · Dokter (Desktop/Kiosk)│
                               └────────────────────┬────────────────────┘
                                                    │ HTTPS / TLS 1.3
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │       VERCEL EDGE NETWORK (FRONTEND)    │
                               │       Next.js 15 App Router             │
                               └────────────────────┬────────────────────┘
                                                    │ REST API / JWT / SSE
                                                    ▼
                               ┌─────────────────────────────────────────┐
                               │     VERCEL SERVERLESS ENGINE (BACKEND)  │
                               │     Go (Gin Framework) · Cold Start < 85ms│
                               └──────────┬───────────────────┬──────────┘
                                          │                   │
                     pgx/v5 Pool (SSL)    │                   │ Groq REST Client
                                          ▼                   ▼
┌───────────────────────────────────────────┐       ┌───────────────────────────┐
│        DATABASE LAYER (NEON DB)           │       │    AI INFERENCE ENGINE    │
│  PostgreSQL 16 · Serverless · RLS Policies│       │  Groq (Llama 3.3 70B)     │
│  Immutable Audit Logs (DB Triggers)       │       │  Sub-second Processing    │
└───────────────────────────────────────────┘       └───────────────────────────┘
```

### End-to-End Consent Flow (Pasien ➔ Dokter)

```
[Pasien] Klik "Buat Akses" ──► POST /api/patient/consent/generate ──► Invalidate Token Lama
                                                                  │
[Tampil PIN & QR (30m)] ◄─────────────────────────────────────────┘
        │
        ▼ (Tunjukkan/Scan QR)
[Dokter] Input PIN / Scan ──► POST /api/doctor/access ──► Verify & Set Token Used (is_used=true)
                                                       │
[Rekam Medis Terbuka] ◄────────────────────────────────┼──► INSERT INTO audit_logs
                                                       │
                                                       └──► SSE Push Event to Patient Browser
```

---

## 🛠️ Stack Teknologi & Keputusan Teknikal

| Layer | Teknologi | Rationale / Alasan Pemilihan |
|---|---|---|
| **Frontend Framework** | Next.js 15 (React 19) | App Router, SSR, performa tinggi, & integrasi Vercel Edge. |
| **Backend Runtime** | Go 1.21+ (Gin Framework) | Binary ultra-ringan, cold start serverless < 85ms, type-safety ketat. |
| **Database** | PostgreSQL 16 (Neon) | Managed Serverless DB, dukungan Row-Level Security (RLS) & Native Triggers. |
| **AI Model** | Groq API (`llama-3.3-70b-versatile`) | Latensi inferensi tercepat di industri (< 1 detik untuk model 70B parameters). |
| **Real-Time Stream** | Server-Sent Events (SSE) | HTTP-native, ramah baterai mobile, tanpa overhead two-way handshake WebSocket. |
| **Data Integrity** | SHA-256 Hashing | Menjamin catatan medis bebas dari manipulasi pasca-simpan (*tamper-proof*). |
| **Styling & Motion** | Tailwind CSS + Framer Motion | Design system modern klinis, responsif, & animasi parallax subtil. |

---

## 📁 Struktur Repositori (Monorepo)

```
aksa-medika/
├── apps/
│   ├── api/                     # Backend Go (Gin REST API)
│   │   ├── cmd/server/          # Entry point serverless
│   │   └── pkg/
│   │       ├── auth/            # Auth, Register, Login, JWT Middleware
│   │       ├── consent/         # Token Engine (PIN, QR, Revoke, Emergency)
│   │       ├── records/         # Medical Records CRUD & Groq AI Summarizer
│   │       ├── audit/           # Audit Log Queries
│   │       ├── crypto/          # SHA-256 Data Integrity Hashing
│   │       └── notify/          # Server-Sent Events (SSE) Notification Hub
│   └── web/                     # Frontend Next.js 15
│       ├── app/                 # App Router Pages (/patient, /doctor, /kiosk)
│       ├── components/          # Reusable UI Components & QR Scanner
│       └── lib/                 # API Client & PDF Exporter
├── infra/
│   └── db/
│       └── migrations/          # SQL Schema & Immutable Database Triggers
├── Makefile                     # Shortcut perintah build & dev
└── README.md
```

---

## 💻 Cara Menjalankan Lokal (Local Setup)

### Prasyarat System
- **Node.js** v18.x atau lebih baru
- **Go** v1.21 atau lebih baru
- **PostgreSQL** (lokal atau akun gratis [Neon.tech](https://neon.tech))
- **Groq API Key** (opsional untuk AI, gratis di [console.groq.com](https://console.groq.com))

### 1. Clone Repositori

```bash
git clone https://github.com/Afta20/AksaMedika.git
cd AksaMedika
```

### 2. Setup Database Schema

Jalankan berkas migrasi SQL pada database PostgreSQL Anda:

```bash
psql -U postgres -d your_db_name -f infra/db/migrations/001_init_schema.sql
```

### 3. Jalankan Backend (Go API)

```bash
cd apps/api

# Salin konfigurasi environment
cp .env.example .env

# Edit .env dan masukkan DATABASE_URL serta GROQ_API_KEY Anda
# Contoh DATABASE_URL=postgres://user:pass@localhost:5432/aksamedika?sslmode=disable

go mod tidy
go run cmd/server/main.go
# 🚀 Backend aktif di http://localhost:8080
```

### 4. Jalankan Frontend (Next.js)

Buka terminal baru:

```bash
cd apps/web

# Salin konfigurasi environment
cp .env.example .env.local

# Pastikan NEXT_PUBLIC_API_URL mengarah ke backend Go lokal
# NEXT_PUBLIC_API_URL=http://localhost:8080

npm install
npm run dev
# 🌐 Frontend aktif di http://localhost:3000
```

---

## 🎮 Kredensial Uji Coba (Demo Credentials)

Untuk mencoba alur aplikasi secara langsung tanpa membuat akun baru:

| Peran User | Email Login | Password | Akses Portal |
|---|---|---|---|
| 👤 **Pasien Demo** | `budi.santoso@demo.com` | `password123` | `/auth/login?role=patient` |
| 👨‍⚕️ **Dokter Demo** | `dr.andi@demo.com` | `password123` | `/auth/login?role=doctor` |

---

## ⚖️ Kepatuhan Hukum & Regulasi

Aksamedika dirancang untuk memenuhi standar kepatuhan regulasi data kesehatan nasional dan internasional:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MATRIKS KEPATUHAN REGULASI                          │
├───────────────────────────┬──────────────────────────────────────────────┤
│ REGULASI                  │ IMPLEMENTASI KONTROL TEKNIS AKSAMEDIKA       │
├───────────────────────────┼──────────────────────────────────────────────┤
│ UU PDP No. 27 Tahun 2022  │ - Pemrosesan berbasis persetujuan eksplisit. │
│ (Pelindungan Data Pribadi)│ - Hak pencabutan izin instan (Instant Revoke)│
│                           │ - Enkripsi data dalam transit & terisolasi.  │
├───────────────────────────┼──────────────────────────────────────────────┤
│ Permenkes No. 24/2022     │ - Keutuhan data RME dijamin Hash SHA-256.    │
│ (Rekam Medis Elektronik)  │ - Audit trail lengkap untuk akuntabilitas.   │
├───────────────────────────┼──────────────────────────────────────────────┤
│ HIPAA Security Rule       │ - Audit Control § 164.312(b): Immutable Log. │
│ (Standar Internasional)   │ - Transmission Security § 164.312(e): TLS 1.3│
│                           │ - Emergency Access § 164.312(a)(2)(ii): Kiosk│
└───────────────────────────┴──────────────────────────────────────────────┘
```

---

<div align="center">

  **Dikembangkan dengan 💙 oleh Afta20**<br/>
  <em>Mewujudkan Transparansi & Kedaulatan Data Kesehatan di Era Society 5.0</em><br/><br/>
  🌐 <a href="https://aksa-medika.vercel.app">aksa-medika.vercel.app</a> · 📁 <a href="https://github.com/Afta20/AksaMedika">GitHub Repository</a>

</div>
