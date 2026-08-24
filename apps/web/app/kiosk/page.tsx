"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TriangleAlert, ShieldAlert, LogIn, Loader2, ArrowLeft, ShieldCheck, Lock, Sparkles } from "lucide-react";
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
        doctor_password: password
      });
      
      // Save temporary kiosk session token
      localStorage.setItem("cg_token", res.token);
      localStorage.setItem("cg_user", JSON.stringify({
        id: res.doctor_id || "ER-KIOSK",
        name: res.doctor_name || "Doctor Kiosk",
        role: "doctor",
        is_kiosk: true
      }));
      
      toast.success(res.message);
      router.push(`/doctor/dashboard?emergency=${res.patient_id}&name=${encodeURIComponent(res.patient_name)}&nik=${nik}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Akses Darurat Ditolak.";
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
    toast.success("Kredensial Kiosk UGD diisi!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Dynamic Glowing Orbs Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-20 flex items-center justify-between max-w-5xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group">
          <div className="w-9 h-9 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:border-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-300" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">Kembali ke Beranda</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/60 border border-rose-900/60 text-rose-400 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            UGD / Kios Terminal Gawat Darurat
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 w-full max-w-xl mx-auto my-auto py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-rose-950/40"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-900/80 via-rose-900 to-rose-950 p-6 sm:p-8 text-center text-white border-b border-rose-900/50 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/20 shadow-lg shadow-rose-950/50">
              <TriangleAlert className="w-8 h-8 text-rose-400" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">MODE GAWAT DARURAT (IGD)</h1>
            <p className="text-rose-200 text-xs sm:text-sm font-medium mt-1">Fasilitas Akses Paksa Rekam Medis Pasien (Break-Glass Protocol)</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Security Warning Notice */}
            <div className="bg-rose-950/30 border border-rose-900/50 rounded-2xl p-4 flex items-start gap-3.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
                Penggunaan Kiosk ini akan mentrigger <strong className="text-white font-bold">Audit Trail Tertinggi</strong>. Otorisasi ganda menggunakan NIK Pasien dan Kredensial Dokter diwajibkan. Log dicatat permanen secara immutable.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAccess} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex justify-between">
                  <span>NIK Pasien Target (16 Digit)</span>
                  <span className="text-slate-500 font-mono">{nik.length}/16</span>
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="3171012345670001"
                  autoComplete="off"
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3.5 rounded-xl text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono tracking-widest text-lg placeholder:text-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Email Dokter IGD</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dr.andi@demo.com"
                    autoComplete="email"
                    className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-700 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password Dokter</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder:text-slate-700 text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-400 text-xs font-semibold text-center">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || nik.length !== 16 || !email || !password}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-xl shadow-rose-900/30 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><LogIn className="w-5 h-5" /> BUKA REKAM MEDIS SEKARANG</>
                )}
              </button>
            </form>

            {/* Quick Demo Autofill Helper */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleAutoFill}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold transition-all flex items-center justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  🧪 Demo Credentials Kiosk (Pasien Budi + Dr. Andi)
                </span>
                <span className="text-[10px] text-rose-400 group-hover:translate-x-1 transition-transform">Isi →</span>
              </button>
            </div>

          </div>
        </motion.div>
      </main>

      {/* Footer Security Badge */}
      <footer className="relative z-20 text-center py-4">
        <p className="text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          Kiosk Terminal dilindungi oleh Aksamedika Zero-Trust Protocol & SHA-256 Audit Trail
        </p>
      </footer>
    </div>
  );
}
