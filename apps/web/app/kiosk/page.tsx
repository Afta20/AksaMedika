"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TriangleAlert, ShieldAlert, LogIn, Loader2, ArrowLeft } from "lucide-react";
import { kioskEmergencyAccess } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

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
      setError("NIK Pasien harus 16 digit.");
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
      
      // Simpan token sementara untuk melihat rekam medis
      localStorage.setItem("cg_token", res.token);
      localStorage.setItem("cg_user", JSON.stringify({
        id: res.doctor_id || "ER-KIOSK",
        name: res.doctor_name || "Doctor Kiosk",
        role: "doctor",
        is_kiosk: true
      }));
      
      toast.success(res.message);
      // Pindah ke dashboard dokter untuk melihat pasien tersebut
      router.push(`/doctor/dashboard?emergency=${res.patient_id}&name=${encodeURIComponent(res.patient_name)}&nik=${nik}`);
    } catch (err: any) {
      setError(err.message || "Akses Darurat Ditolak.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Portal
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/20"
      >
        <div className="bg-rose-600 p-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 border border-white/30 shadow-inner">
            <TriangleAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">MODE GAWAT DARURAT (IGD)</h1>
          <p className="text-rose-100 text-sm font-medium">Fasilitas Akses Paksa Rekam Medis Pasien</p>
        </div>

        <div className="p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-8">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Penggunaan portal ini memicu <strong className="text-amber-700">Audit Trail Tertinggi</strong>. Otorisasi ganda menggunakan Identitas Pasien (NIK) dan Kredensial Medis (Dokter/Admin) diwajibkan. Segala akses tercatat permanen.
            </p>
          </div>

          <form onSubmit={handleAccess} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">NIK Pasien (16 Digit)</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                placeholder="0000000000000000"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-mono tracking-widest text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Dokter IGD</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.nama@rs.com"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-600 text-sm font-semibold text-center mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !nik || !email || !password}
              className="w-full mt-4 py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <><LogIn className="w-5 h-5" /> BUKA REKAM MEDIS SEKARANG</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
      
      <div className="mt-8 text-slate-500 text-xs font-medium flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5" /> Kiosk dilindungi oleh Aksamedika Zero-Trust Protocol
      </div>
    </div>
  );
}
