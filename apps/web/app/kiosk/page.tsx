"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TriangleAlert, ShieldAlert, LogIn, Loader2, ArrowLeft,
  ShieldCheck, Stethoscope, KeyRound
} from "lucide-react";
import { kioskEmergencyAccess } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function KioskPage() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nik.length !== 16) {
      setError("NIK Pasien harus persis 16 digit angka.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await kioskEmergencyAccess({
        nik,
        doctor_email: email,
        doctor_password: password,
      });

      localStorage.setItem("cg_token", res.token);
      localStorage.setItem(
        "cg_user",
        JSON.stringify({
          id: res.doctor_id || "ER-KIOSK",
          name: res.doctor_name || "Doctor Kiosk",
          role: "doctor",
          is_kiosk: true,
        })
      );

      toast.success(res.message);
      router.push(
        `/doctor/dashboard?emergency=${res.patient_id}&name=${encodeURIComponent(res.patient_name)}&nik=${nik}`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Akses Darurat Ditolak.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setNik("3171012345670001");
    setEmail("dr.andi@demo.com");
    setPassword("password123");
    setError("");
    toast.success("Data demo kiosk berhasil diisi.");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Topbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              Terminal Gawat Darurat
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Page Identity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl mb-4">
            <TriangleAlert className="w-7 h-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Akses Darurat IGD
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 max-w-xs mx-auto leading-relaxed">
            Break-Glass Protocol — digunakan saat pasien tidak dapat memberikan consent secara langsung.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors"
        >
          
          {/* Warning Strip */}
          <div className="px-5 py-3.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-px" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Akses ini memicu <strong>Audit Trail permanen</strong>. Identitas dokter dan NIK pasien wajib diisi. Penyalahgunaan dapat dikenai sanksi.
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <form onSubmit={handleAccess} className="space-y-4">
              
              {/* NIK Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    NIK Pasien
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {nik.length} / 16
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nik}
                  onChange={(e) =>
                    setNik(e.target.value.replace(/\D/g, "").slice(0, 16))
                  }
                  placeholder="Nomor Induk Kependudukan (16 digit)"
                  autoComplete="off"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-3.5 py-3 rounded-xl font-mono tracking-widest text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Doctor Credentials */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Verifikasi Identitas Dokter
                  </span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email terdaftar dokter"
                  autoComplete="email"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-3.5 py-3 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white pl-10 pr-3.5 py-3 rounded-xl text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold">
                  <TriangleAlert className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || nik.length !== 16 || !email || !password}
                className="w-full mt-1 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Buka Rekam Medis Darurat
                  </>
                )}
              </button>
            </form>

            {/* Demo Autofill */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleAutoFill}
                className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium py-2.5 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex items-center justify-between"
              >
                <span>🧪 Isi Data Demo (Budi + Dr. Andi)</span>
                <span className="text-slate-400 dark:text-slate-500">Isi →</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-6 flex items-center justify-center gap-5 text-slate-400 dark:text-slate-500"
        >
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero-Trust
          </div>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            SHA-256 Audit Trail
          </div>
          <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Immutable Log
          </div>
        </motion.div>
      </main>
    </div>
  );
}
