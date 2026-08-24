"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Stethoscope, Eye, EyeOff, Loader2, Lock, Activity, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultRole = (params.get("role") as "patient" | "doctor") || "patient";

  const [role, setRole] = useState<"patient" | "doctor">(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.user.role !== role) {
        toast.error(`Akun ini terdaftar sebagai ${res.user.role === "patient" ? "pasien" : "dokter"}.`);
        setLoading(false);
        return;
      }
      localStorage.setItem("cg_token", res.token);
      localStorage.setItem("cg_user", JSON.stringify(res.user));
      toast.success(`Selamat datang kembali, ${res.user.name}!`);
      router.push(role === "patient" ? "/patient/dashboard" : "/doctor/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Login gagal. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ===== LEFT: Brand Panel ===== */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-blue-600 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-800/40 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 p-1">
            <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-white font-bold text-2xl">Aksamedika</span>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-6">
          <p className="text-blue-100 text-sm font-semibold uppercase tracking-widest">Keunggulan Platform</p>
          {[
            { icon: Lock, text: "Zero-Trust Architecture — Tidak ada akses tanpa izin Anda" },
            { icon: Activity, text: "Audit Trail Lengkap — Pantau setiap akses ke data Anda" },
            { icon: CheckCircle2, text: "Token 30 Menit — Keamanan berlapis untuk privasi Anda" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-blue-50 text-sm leading-relaxed font-medium">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <blockquote className="text-white/80 text-sm italic leading-relaxed border-l-2 border-white/30 pl-4">
            &ldquo;Sistem pertama yang benar-benar memberikan kontrol penuh kepada pasien atas rekam medis mereka.&rdquo;
          </blockquote>
          <p className="text-blue-200 text-xs mt-2 pl-4">— Hackathon Healthcare Society 5.0</p>
        </div>
      </div>

      {/* ===== RIGHT: Form Panel ===== */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-sm mx-auto w-full">
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center p-1 shadow-md shadow-blue-600/20">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="text-slate-900 dark:text-white font-bold text-xl transition-colors">Aksa<span className="text-blue-600 dark:text-blue-400">medika</span></span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white transition-colors">Selamat datang kembali</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">Masuk ke portal Aksamedika untuk melanjutkan</p>
            </div>

            {/* Role Selector */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 mb-6 bg-slate-50 dark:bg-slate-900 transition-colors">
              {(["patient", "doctor"] as const).map((r) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    role === r
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}>
                  {r === "patient" ? <User className="w-4 h-4" /> : <Stethoscope className="w-4 h-4" />}
                  {r === "patient" ? "Pasien" : "Dokter"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-slate-700 dark:text-slate-300 font-bold transition-colors">Email</Label>
                  <Input type="email" placeholder="nama@email.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600 dark:text-white transition-colors" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-700 dark:text-slate-300 font-bold transition-colors">Password</Label>
                    <a href="#" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Lupa password?</a>
                  </div>
                  <div className="relative">
                    <Input type={showPass ? "text" : "password"} placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-blue-600 pr-10 dark:text-white transition-colors" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              <Button type="submit" disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 text-sm mt-2 transition-all">
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Masuk...</>
                ) : (
                  `Masuk sebagai ${role === "patient" ? "Pasien" : "Dokter"}`
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <AnimatePresence>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
                <p className="text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">🧪 Demo Credentials (Klik untuk Isi Otomatis)</p>
                <div className="space-y-2 text-xs">
                  <button type="button" onClick={() => { setRole("patient"); setEmail("budi.santoso@demo.com"); setPassword("password123"); }}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 hover:border-blue-400 transition-colors flex justify-between items-center group">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Pasien: </span>
                      <span className="text-slate-500">budi.santoso@demo.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Isi →</span>
                  </button>
                  <button type="button" onClick={() => { setRole("doctor"); setEmail("dr.andi@demo.com"); setPassword("password123"); }}
                    className="w-full text-left p-2 rounded-lg bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 hover:border-blue-400 transition-colors flex justify-between items-center group">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">Dokter: </span>
                      <span className="text-slate-500">dr.andi@demo.com</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Isi →</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium mt-6 transition-colors">
              Belum punya akun?{" "}
              <Link href={`/auth/register?role=${role}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Daftar sekarang
              </Link>
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

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
