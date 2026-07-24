<div align="center">
  <div style="background-color: #2563EB; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"></path>
    </svg>
  </div>
  
  <h1 align="center">Aksamedika</h1>
  
  <p align="center">
    <strong>Patient-Centric, Zero-Trust Electronic Medical Records (EMR)</strong>
    <br/>
    <em>Bukan rumah sakit yang menguasai data, tapi pasien.</em>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=for-the-badge&logo=go" alt="Go" />
    <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791?style=for-the-badge&logo=postgresql" alt="Neon Postgres" />
    <img src="https://img.shields.io/badge/AI-Groq_Llama3-F55036?style=for-the-badge&logo=meta" alt="Groq AI" />
  </p>
</div>

---

## 🌟 Visi Proyek

Di era modern, kebocoran data medis sangat rentan terjadi. Sistem rekam medis tradisional memberikan hak akses permanen kepada fasilitas kesehatan (faskes). **Aksamedika** membalikkan paradigma tersebut. Mengadopsi arsitektur keamanan *Zero-Trust*, data rekam medis sepenuhnya berada di bawah kendali pasien. Dokter hanya dapat melihat atau menambah rekam medis apabila diberikan izin sementara (maksimal 30 menit) oleh pasien yang bersangkutan.

## ✨ Fitur Spektakuler (Killer Features)

Aksamedika dilengkapi dengan fitur-fitur kelas enterprise yang dirancang khusus untuk memukau di ajang presentasi atau *hackathon*:

### 1. 🛡️ Akses Berbasis Waktu (Zero-Trust)
Pasien men-generate **PIN 6 digit** atau **QR Code** yang terenkripsi dan otomatis kedaluwarsa dalam 30 menit. Akses akan seketika terputus ketika timer habis.

### 2. ✨ AI Medical Insights (Powered by Groq)
Begitu dokter berhasil mendapatkan izin akses, **AI Llama 3.1** (via Groq API) akan langsung menganalisis seluruh riwayat medis pasien, merangkumnya menjadi poin-poin krusial (kondisi kronis, interaksi obat), dan menampilkannya di *dashboard* dokter dalam hitungan detik.

### 3. 🚨 Protokol Akses Darurat (Break-Glass)
Bagaimana jika pasien tidak sadar di UGD? 
Dokter dapat menekan tombol **"⚠️ Akses Darurat (Break-Glass)"** untuk membobol akses tanpa PIN. Namun, sistem akan langsung memicu alarm berwarna **Merah Terang** di riwayat audit pasien, menjamin transparansi medis yang tidak bisa dimanipulasi (*immutable audit log*).

### 4. 📷 Live Webcam QR Scanner
Fitur akses masa depan. Dokter tidak perlu lagi repot mengetik PIN secara manual. Cukup buka *webcam* (menggunakan library `html5-qrcode`) dan sorot *smartphone* pasien. Akses diberikan secara instan.

---

## 🛠️ Tech Stack & Arsitektur

Proyek ini dibangun menggunakan teknologi mutakhir untuk menjamin skalabilitas dan performa:

- **Frontend:** Next.js 16 (App Router), React, Tailwind CSS, Framer Motion (untuk animasi *micro-interactions*), Shadcn UI.
- **Backend:** Go (Golang) dengan framework Gin untuk performa API yang *blazing fast*.
- **Database:** Neon Serverless PostgreSQL dengan relasi data yang kuat dan *constraint* keamanan ketat pada level schema.
- **AI Engine:** Groq API (`llama-3.1-8b-instant`) memproses ratusan baris data rekam medis dalam hitungan milidetik.

---

## 🚀 Cara Menjalankan (Getting Started)

### Prasyarat
- Go 1.21+
- Node.js 18+
- PostgreSQL (atau akun Neon DB)
- Groq API Key

### 1. Setup Database
Jalankan file migrasi yang berada di `infra/db/migrations/001_init_schema.sql` pada database PostgreSQL Anda.

### 2. Setup Backend (Go)
```bash
cd apps/api
# Buat file .env dan isi dengan DATABASE_URL dan GROQ_API_KEY
go mod tidy
go run cmd/server/main.go
```
*Backend akan berjalan di port `8080`.*

### 3. Setup Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
*Frontend akan berjalan di port `3000`.*

---

## 💡 Alur Demonstrasi (Demo Flow)

Untuk mempresentasikan Aksamedika dengan efek "Wow" yang maksimal:

1. **Pasien (HP):** Login sebagai pasien, tunjukkan tampilan *Dashboard* yang *clean*. Klik "Buat Token Akses" untuk memunculkan halaman persetujuan dengan animasi SVG Countdown dan PIN unik.
2. **Dokter (Laptop):** Login sebagai dokter, tunjukkan *Dashboard* dokter yang rapi dengan statistik pasien dan riwayat akses di *sidebar*.
3. **The Magic:** Klik **"Scan QR Code"** di laptop, hadapkan layar ponsel pasien ke *webcam*. 
4. **AI Summary:** Saksikan rekam medis langsung terbuka dan panel **AI Medical Insights** memunculkan rangkuman klinis pasien secara *real-time*.
5. **Break-Glass:** Tutup sesi dokter. Klik **"Akses Darurat (Break-Glass)"**. Masukkan alasan kritis, lalu perlihatkan ke juri bagaimana *audit log* di akun pasien langsung berubah merah sebagai tanda adanya peringatan akses!

---

<div align="center">
  <b>Developed by Afta20</b><br/>
  <i>Membangun Masa Depan Layanan Kesehatan yang Lebih Aman</i>
</div>
