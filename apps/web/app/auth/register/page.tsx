"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, User, Stethoscope, Eye, EyeOff, Loader2, Lock, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import Link from "next/link";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = (params.get("role") as "patient" | "doctor") || "patient";

  const [role, setRole] = useState<"patient" | "doctor">(defaultRole);
  const [form, setForm] = useState({ name: "", email: "", password: "", specialty: "", license_no: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.register({ ...form, role });
      localStorage.setItem("cg_token", res.token);
      localStorage.setItem("cg_user", JSON.stringify(res.user));
      toast.success(`Akun berhasil dibuat! Selamat datang, ${res.user.name}.`);
      router.push(role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Pendaftaran gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ===== LEFT: Brand Panel ===== */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-blue-600 p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-800/40 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 p-1">
            <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-2xl">Aksamedika</span>
        </div>

        <div className="relative z-10 space-y-6">
          <p className="text-blue-100 text-sm font-semibold uppercase tracking-widest">Bergabung dan Dapatkan</p>
          {[
            { icon: Lock, text: "Kontrol penuh atas siapa yang mengakses rekam medis Anda" },
            { icon: Activity, text: "Visibilitas lengkap atas riwayat akses data kesehatan Anda" },
            { icon: CheckCircle2, text: "Perlindungan berlapis dengan token akses yang kedaluwarsa otomatis" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-blue-50 text-sm leading-relaxed font-medium">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <blockquote className="text-white/80 text-sm italic leading-relaxed border-l-2 border-white/30 pl-4">
            &ldquo;Platform pertama di Indonesia yang benar-benar menempatkan pasien sebagai pemilik data kesehatan mereka.&rdquo;
          </blockquote>
          <p className="text-blue-200 text-xs mt-2 pl-4">— Visi Aksamedika 2025</p>
        </div>
      </div>

      {/* ===== RIGHT: Form Panel ===== */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white overflow-y-auto">
        <div className="max-w-sm mx-auto w-full">
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center p-1 shadow-md shadow-blue-600/20">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="text-slate-900 font-bold text-xl">Aksa<span className="text-blue-600">medika</span></span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-slate-900">Buat akun baru</h1>
              <p className="text-slate-500 text-sm mt-1">Bergabung dengan Aksamedika hari ini</p>
            </div>

            {/* Role Selector */}
            <div className="flex rounded-xl border border-slate-200 p-1 mb-6 bg-slate-50">
              {(["patient", "doctor"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === r
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}>
                  {r === "patient" ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  {r === "patient" ? "Pasien" : "Dokter"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm font-semibold">Nama Lengkap</Label>
                <Input placeholder="Nama lengkap Anda" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})} required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm font-semibold">Email</Label>
                <Input type="email" placeholder="nama@email.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700 text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} placeholder="Min. 8 karakter"
                    value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    required minLength={8}
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white pr-11 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {role === "doctor" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-1 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Info Profesional Dokter</p>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-sm font-semibold">Spesialisasi</Label>
                    <Input placeholder="cth. Dokter Umum, Spesialis Jantung" value={form.specialty}
                      onChange={e => setForm({...form, specialty: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-sm font-semibold">Nomor STR/Lisensi</Label>
                    <Input placeholder="STR-GP-XXXXXX" value={form.license_no}
                      onChange={e => setForm({...form, license_no: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white transition-colors" />
                  </div>
                </motion.div>
              )}

              <Button type="submit" disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm mt-2 transition-all">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membuat akun...</> : "Buat Akun"}
              </Button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              Sudah punya akun?{" "}
              <Link href={`/auth/login?role=${role}`} className="text-blue-600 hover:text-blue-700 font-bold">Masuk di sini</Link>
            </p>

            <Link href="/" className="block text-center text-slate-400 hover:text-slate-600 text-xs mt-4 transition-colors">
              ← Kembali ke Beranda
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
