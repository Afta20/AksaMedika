# 📱 Aksamedika — Frontend

> Antarmuka pengguna platform rekam medis Aksamedika berbasis **Next.js 15** dengan dukungan Dark Mode, animasi Framer Motion, dan integrasi real-time via SSE.

---

## ✅ Prasyarat

| Tool | Versi Minimum |
|---|---|
| Node.js | 18.x atau lebih baru |
| npm | 9.x atau lebih baru |

---

## 🚀 Menjalankan Secara Lokal

### 1. Masuk ke direktori frontend

```bash
cd apps/web
```

### 2. Install semua dependensi

```bash
npm install
```

### 3. Buat file environment

```bash
# Buat file .env.local di root apps/web/
touch .env.local
```

Isi `.env.local` dengan:

```env
# URL backend API (sesuaikan jika backend berjalan di port berbeda)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Jalankan development server

```bash
npm run dev
```

Aplikasi akan berjalan di: **http://localhost:3000**

### 5. Build untuk produksi (opsional)

```bash
npm run build
npm start
```

---

## 🗂️ Struktur Direktori

```
apps/web/
├── app/                        ← Next.js App Router
│   ├── layout.tsx              ← Root layout (ThemeProvider, font)
│   ├── globals.css             ← Design system & CSS variables
│   ├── page.tsx                ← Landing Page (/)
│   ├── not-found.tsx           ← Custom 404 Page
│   ├── auth/
│   │   ├── login/page.tsx      ← Halaman Login (Pasien & Dokter)
│   │   └── register/page.tsx   ← Halaman Registrasi
│   ├── patient/
│   │   ├── dashboard/page.tsx  ← Dashboard Utama Pasien
│   │   ├── consent/page.tsx    ← Halaman Buat Token Akses (PIN & QR)
│   │   └── settings/page.tsx   ← Pengaturan Akun Pasien (NIK)
│   ├── doctor/
│   │   └── dashboard/page.tsx  ← Portal Dokter (PIN, QR, Records)
│   └── kiosk/
│       └── page.tsx            ← Terminal Kiosk Darurat
│
├── components/
│   ├── ui/                     ← Shadcn UI components (Button, Card, etc.)
│   ├── ThemeToggle.tsx         ← Tombol ganti tema Light/Dark
│   └── QRScanner.tsx           ← Komponen webcam QR scanner
│
├── lib/
│   ├── api.ts                  ← HTTP client (semua API call ke backend)
│   └── utils.ts                ← Helper functions
│
├── types/
│   └── api.ts                  ← TypeScript interfaces mirroring Go structs
│
└── public/
    └── aksamedika.svg          ← Logo SVG
```

---

## 🖥️ Halaman & Fitur

### `/` — Landing Page
Halaman utama yang menjelaskan visi, fitur, dan cara kerja Aksamedika kepada calon pengguna. Dilengkapi:
- Hero section dengan animasi Framer Motion
- Section "Masalah" dan "Solusi"
- Section fitur interaktif
- Mobile-responsive navbar dengan hamburger menu

### `/auth/login` — Login
Halaman login dengan dua tab peran:
- **Pasien** — mengarahkan ke `/patient/dashboard`
- **Dokter** — mengarahkan ke `/doctor/dashboard`

Dilengkapi kotak *Demo Credentials* untuk kemudahan testing.

### `/auth/register` — Registrasi
Form registrasi dinamis. Saat memilih role **Dokter**, field tambahan (Spesialisasi & Nomor SIP) akan muncul secara otomatis.

### `/patient/dashboard` — Dashboard Pasien
Fitur lengkap:
- 📊 Kartu statistik (total dokumen, status akses)
- 🔐 Kartu Identitas Digital dengan QR Code personal
- 📋 Linimasa Rekam Medis (masked untuk privasi)
- 🔔 Audit Trail real-time — log semua akses yang pernah terjadi
- ⚡ Kill Switch — cabut semua akses aktif dalam satu klik

### `/patient/consent` — Buat Token Akses
- Generate PIN 6-digit
- Generate QR Code yang bisa di-scan dokter
- Countdown timer 30 menit visual

### `/patient/settings` — Pengaturan
- Input dan simpan NIK (di-hash di backend menggunakan bcrypt)

### `/doctor/dashboard` — Portal Dokter
- **Statistik akses** (total, hari ini, akses terakhir)
- **Sidebar** riwayat pasien yang pernah diakses
- **Input PIN** 6-digit dari pasien
- **QR Scanner** via webcam (html5-qrcode)
- **Protokol Darurat Break-Glass** (input NIK + alasan)
- Setelah akses berhasil:
  - Profil pasien + status sesi aktif
  - **AI Medical Summary** (ringkasan Groq/Llama)
  - Daftar rekam medis lengkap
  - Form tambah rekam medis baru
  - Tombol **Export PDF** tiap rekam

### `/kiosk` — Terminal Darurat
Terminal publik untuk kondisi darurat. Dokter login dengan kredensial sendiri dan input NIK pasien.

---

## 🎨 Design System

Proyek menggunakan **CSS Custom Properties** di `globals.css` untuk tema yang konsisten:

```css
/* Light Mode */
:root {
  --background: oklch(99% 0.005 240);
  --foreground: oklch(15% 0.01 240);
  /* ... */
}

/* Dark Mode */
.dark {
  --background: oklch(10% 0.015 240);
  --foreground: oklch(95% 0.005 240);
  /* ... */
}
```

Dark Mode dikelola oleh library `next-themes` dengan `ThemeProvider` di root layout.

---

## 🌐 Environment Variables

| Variabel | Wajib | Default | Keterangan |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:8080` | URL backend API |

---

## 🧰 Script npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server (Turbopack) |
| `npm run build` | Build produksi |
| `npm start` | Jalankan build produksi |
| `npm run lint` | Cek kode dengan ESLint |

---

## 📦 Dependensi Utama

| Package | Versi | Fungsi |
|---|---|---|
| `next` | 16.x | Framework utama |
| `react` | 19.x | UI library |
| `framer-motion` | latest | Animasi |
| `tailwindcss` | 4.x | Styling |
| `@radix-ui/*` | latest | Accessible UI primitives |
| `next-themes` | latest | Dark/Light mode |
| `jspdf` + `html2canvas` | latest | Export PDF |
| `qrcode.react` | latest | Generate QR Code |
| `html5-qrcode` | latest | Scan QR via webcam |
| `date-fns` | latest | Format tanggal |
| `sonner` | latest | Toast notifications |

---

## 🚢 Deployment ke Vercel

1. Push kode ke GitHub
2. Import repository di [vercel.com](https://vercel.com)
3. Set **Root Directory** ke `apps/web`
4. Tambahkan environment variable `NEXT_PUBLIC_API_URL` yang mengarah ke backend production
5. Deploy otomatis setiap `git push` ke `main`

**URL Produksi:** https://aksa-medika.vercel.app
