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
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
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
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white">
        <div className="max-w-sm mx-auto w-full">
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center p-1 shadow-md shadow-blue-600/20">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="text-slate-900 font-bold text-xl">Aksa<span className="text-blue-600">medika</span></span>
          </Link>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-slate-900">Selamat datang kembali</h1>
              <p className="text-slate-500 text-sm mt-1">Masuk ke akun Anda untuk melanjutkan</p>
            </div>

            {/* Role Selector */}
            <div className="flex rounded-xl border border-slate-200 p-1 mb-7 bg-slate-50">
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

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">Email</Label>
                <Input id="email" type="email" placeholder="nama@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white transition-colors" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPass ? "text" : "password"} placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="h-11 rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white pr-11 transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
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
                className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-blue-700 text-xs font-bold mb-2">🧪 Demo Credentials</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <p><span className="font-semibold text-slate-800">Pasien:</span> budi.santoso@demo.com / password123</p>
                  <p><span className="font-semibold text-slate-800">Dokter:</span> dr.andi@demo.com / password123</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-slate-500 text-sm mt-6">
              Belum punya akun?{" "}
              <Link href={`/auth/register?role=${role}`} className="text-blue-600 hover:text-blue-700 font-bold">
                Daftar di sini
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
