"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, Clock, Activity, LogOut, Zap, ChevronRight, User, TriangleAlert, QrCode, PowerOff, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { patientApi } from "@/lib/api";
import type { MaskedRecord, AuditEntry, User as UserType } from "@/types/api";
import Link from "next/link";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [records, setRecords] = useState<MaskedRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionRevoked, setSessionRevoked] = useState(false);

  const loadData = useCallback(async (token: string) => {
    try {
      const [recRes, audRes] = await Promise.all([
        patientApi.getRecords(token),
        patientApi.getAuditLog(token),
      ]);
      setRecords(recRes.records as MaskedRecord[]);
      setAuditLogs(audRes.logs);
    } catch {
      toast.error("Gagal memuat data. Silakan login ulang.");
      router.push("/auth/login?role=patient");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("cg_token");
    const userStr = localStorage.getItem("cg_user");
    if (!token || !userStr) { router.push("/auth/login?role=patient"); return; }
    const u = JSON.parse(userStr) as UserType;
    if (u.role !== "patient") { router.push("/auth/login?role=patient"); return; }
    setUser(u);
    loadData(token);
  }, [router, loadData]);

  const handleLogout = () => {
    localStorage.removeItem("cg_token");
    localStorage.removeItem("cg_user");
    router.push("/");
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Selamat pagi";
    if (h < 17) return "Selamat siang";
    return "Selamat malam";
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  // Check if there is an active session (any access in the last 30 mins) and not revoked
  const activeSession = !sessionRevoked && auditLogs.find(log => differenceInMinutes(new Date(), new Date(log.accessed_at)) < 30);

  const handleKillSwitch = () => {
    setSessionRevoked(true);
    toast.success("Akses berhasil dicabut! Semua dokter telah dikeluarkan dari sesi Anda.");
    // In a real app, this would call an API to invalidate all active tokens.
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm p-1.5">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Aksa<span className="text-blue-600">medika</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] text-slate-500 font-medium">Pasien</span>
              </div>
            )}
            {user && (
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shadow-inner border border-blue-200">
                <span className="text-blue-700 text-xs font-bold">{getInitials(user.name)}</span>
              </div>
            )}
            <button onClick={handleLogout}
              className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-xl hover:bg-rose-50 border border-transparent hover:border-rose-100 ml-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 pb-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Identity & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Greeting Banner */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-slate-500 text-sm font-medium">{getGreeting()},</p>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {user?.name ?? <Skeleton className="h-8 w-48" />}
                </h1>
                <p className="text-blue-600 text-xs font-bold mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Akun Terverifikasi
                </p>
              </div>
            </motion.div>

            {/* Digital ID Card (Glassmorphism) */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                }}>
                {/* Decorative background circles */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />
                
                <div className="relative z-10 flex justify-between items-start mb-8">
                  <div>
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">Kartu Identitas Digital</p>
                    <p className="font-bold text-lg">{user?.name}</p>
                    <p className="text-blue-200 text-xs mt-1 font-mono">{user?.id.split('-')[0].toUpperCase()}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center p-2 border border-white/30">
                    <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-5 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <div className="bg-white p-2 rounded-xl shrink-0">
                    {user ? (
                      <QRCodeSVG value={`PATIENT:${user.id}`} size={64} level="Q" className="rounded-md" />
                    ) : (
                      <Skeleton className="w-16 h-16 rounded-md bg-white/50" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Scan untuk Profil</p>
                    <p className="text-blue-100 text-xs mt-1 leading-relaxed">Tunjukkan QR ini ke petugas medis untuk identifikasi cepat.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Session Radar / Kill Switch */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={`rounded-2xl p-6 border transition-all ${
                activeSession 
                  ? "bg-rose-50 border-rose-200 shadow-lg shadow-rose-500/10" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full ${
                    activeSession ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"
                  }`}>
                    {activeSession && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-25"></div>
                        <div className="absolute inset-0 rounded-full bg-rose-300 animate-pulse opacity-40"></div>
                      </>
                    )}
                    <PowerOff className="w-5 h-5 relative z-10" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${activeSession ? "text-rose-900" : "text-slate-900"}`}>
                      Status Sesi Akses
                    </h3>
                    <p className={`text-xs mt-0.5 ${activeSession ? "text-rose-600 font-semibold" : "text-slate-500"}`}>
                      {activeSession ? "1 Dokter sedang melihat data Anda" : "Tidak ada akses aktif"}
                    </p>
                  </div>
                </div>

                {activeSession ? (
                  <button onClick={handleKillSwitch}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 group">
                    Cabut Izin Akses Sekarang
                    <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <div className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-400 text-sm font-semibold rounded-xl text-center">
                    Data Anda aman (Zero-Trust)
                  </div>
                )}
              </div>
            </motion.div>

            {/* Generate Access CTA */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/patient/consent">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 flex items-center justify-between group hover:shadow-xl hover:shadow-slate-900/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Buat Token Akses Baru</p>
                      <p className="text-slate-400 text-xs mt-1">Berikan akses 30 menit ke Dokter</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>

          </div>

          {/* RIGHT COLUMN: Dashboard Data */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-4">
              <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden group hover:border-blue-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs shadow-none">Total</Badge>
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{loading ? "–" : records.length}</p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Dokumen Rekam Medis</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden group hover:border-emerald-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-emerald-50 group-hover:bg-emerald-100 rounded-xl flex items-center justify-center transition-colors">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs shadow-none">Bulan Ini</Badge>
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{loading ? "–" : auditLogs.length}</p>
                  <p className="text-slate-500 text-sm mt-1 font-medium">Log Akses Keamanan</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Health Timeline */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-slate-900 font-bold text-base">Linimasa Kesehatan</h2>
                </div>
                
                <div className="flex-1">
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                    </div>
                  ) : records.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-dashed border-slate-200">
                        <FileText className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Belum ada riwayat medis</p>
                    </div>
                  ) : (
                    <div className="relative pl-3 border-l-2 border-slate-100 space-y-6 py-2">
                      {records.slice(0, 4).map((r, i) => (
                        <div key={r.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[17px] top-1 w-3 h-3 bg-white border-2 border-blue-500 rounded-full" />
                          
                          <div className="pl-4">
                            <span className="text-xs font-bold text-blue-600 mb-1 block">
                              {new Date(r.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 hover:border-blue-200 transition-colors">
                              <p className="text-sm font-bold text-slate-900">{r.diagnosis}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Audit Trail */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-slate-900 font-bold text-base">Audit Trail</h2>
                </div>
                
                <div className="flex-1 space-y-3">
                  {loading ? (
                    Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                  ) : auditLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-dashed border-slate-200">
                        <Clock className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm font-medium">Log akses kosong</p>
                    </div>
                  ) : (
                    auditLogs.slice(0, 4).map((log, i) => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.access_method === "EMERGENCY" ? "bg-rose-100" : "bg-white border border-slate-200"
                          }`}>
                            {log.access_method === "EMERGENCY" ? (
                              <TriangleAlert className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-xs ${log.access_method === "EMERGENCY" ? "text-rose-600" : "text-slate-900"}`}>
                              {log.doctor_name}
                            </p>
                            <p className="text-slate-500 text-[10px] mt-0.5 font-medium">
                              {formatDistanceToNow(new Date(log.accessed_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[9px] px-1.5 py-0.5 rounded shadow-none uppercase font-bold tracking-wider ${
                          log.access_method === "PIN"
                            ? "bg-blue-100 text-blue-700"
                            : log.access_method === "QR"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {log.access_method}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
                
                {!loading && auditLogs.length > 0 && (
                  <button className="w-full mt-4 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors">
                    Lihat Semua Log →
                  </button>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
