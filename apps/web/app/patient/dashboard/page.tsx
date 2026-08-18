"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, Clock, Activity, LogOut, Zap, ChevronRight, User, TriangleAlert, QrCode, PowerOff, ShieldCheck, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { patientApi } from "@/lib/api";
import type { MaskedRecord, AuditEntry, User as UserType } from "@/types/api";
import Link from "next/link";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QRCodeSVG } from "qrcode.react";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [records, setRecords] = useState<MaskedRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionRevoked, setSessionRevoked] = useState(false);
  const [showQRZoom, setShowQRZoom] = useState(false);

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

  // ── Real-time SSE listener ───────────────────────────────────────────────
  const ctrlRef = useRef<AbortController | null>(null);

  const startSSE = useCallback((token: string) => {
    if (typeof window === "undefined") return;
    // Abort any existing fetch stream before opening a new one
    ctrlRef.current?.abort();

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";

    // Use fetch-based SSE so we can attach an Authorization header
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    fetch(`${apiBase}/api/patient/notify/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ctrl.signal,
    }).then(async (res) => {
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Parse SSE frames separated by double newlines
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const lines = frame.split("\n");
          let eventType = "message";
          let data = "";
          for (const line of lines) {
            if (line.startsWith("event:")) eventType = line.slice(6).trim();
            if (line.startsWith("data:")) data = line.slice(5).trim();
          }
          if (eventType === "access" && data) {
            try {
              const payload = JSON.parse(data);
              const method = payload.access_method as string;
              const doctor = payload.doctor_name as string;
              const methodLabel = method === "EMERGENCY"
                ? "🚨 AKSES DARURAT"
                : method === "PIN" ? "PIN" : "QR Code";
              toast.warning(
                `${methodLabel}: ${doctor} baru saja mengakses rekam medis Anda!`,
                { duration: 8000 }
              );
              // Reload audit log to show the new entry immediately
              loadData(token);
            } catch { /* ignore malformed frame */ }
          }
        }
      }
    }).catch(() => { /* stream closed on unmount */ });
  }, [loadData]);
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("cg_token");
    const userStr = localStorage.getItem("cg_user");
    if (!token || !userStr) { router.push("/auth/login?role=patient"); return; }
    const u = JSON.parse(userStr) as UserType;
    if (u.role !== "patient") { router.push("/auth/login?role=patient"); return; }
    setUser(u);
    loadData(token);
    startSSE(token);

    return () => {
      ctrlRef.current?.abort();
    };
  }, [router, loadData, startSSE]);

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

  // Get the most recent access log
  const recentLog = auditLogs[0];
  // Check if there is an active session (any access in the last 30 mins) AND the most recent action is NOT 'REVOKED'
  const activeSession = !sessionRevoked && recentLog && recentLog.access_method !== 'REVOKED' && differenceInMinutes(new Date(), new Date(recentLog.accessed_at)) < 30;

  const handleKillSwitch = async () => {
    try {
      const token = localStorage.getItem("cg_token");
      if (token) {
        await patientApi.revokeAccess(token);
        setSessionRevoked(true);
        toast.success("Akses berhasil dicabut! Semua sesi telah dihentikan paksa.");
        loadData(token); // Reload data to get the new REVOKED audit log
      }
    } catch (err) {
      toast.error("Gagal mencabut akses. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Nav */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm p-1.5">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg transition-colors">Aksa<span className="text-blue-600 dark:text-blue-400">medika</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white transition-colors">{user.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium transition-colors">Pasien</span>
              </div>
            )}
            {user && (
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center shadow-inner border border-blue-200 dark:border-blue-800 mr-2 transition-colors">
                <span className="text-blue-700 dark:text-blue-300 text-xs font-bold">{getInitials(user.name)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-4 transition-colors">
              <ThemeToggle />
              <Link href="/patient/settings"
                className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800">
                <Settings className="w-4 h-4" />
              </Link>
              <button onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-800">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 pb-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Identity & Controls */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Greeting Banner */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-300">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">{getGreeting()},</p>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 transition-colors">
                  {user?.name ?? <Skeleton className="h-8 w-48 dark:bg-slate-800" />}
                </h1>
                <p className="text-blue-600 dark:text-blue-400 text-xs font-bold mt-2 flex items-center gap-1.5 transition-colors">
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
                  <div 
                    className="bg-white p-2 rounded-xl shrink-0 cursor-pointer hover:scale-105 transition-transform" 
                    onClick={() => user && setShowQRZoom(true)}
                  >
                    {user ? (
                      <QRCodeSVG value={`PATIENT:${user.id}`} size={64} level="Q" className="rounded-md" />
                    ) : (
                      <Skeleton className="w-16 h-16 rounded-md bg-white/50" />
                    )}
                  </div>
                  <div onClick={() => user && setShowQRZoom(true)} className="cursor-pointer">
                    <p className="text-white font-semibold text-sm hover:underline">Scan untuk Profil</p>
                    <p className="text-blue-100 text-xs mt-1 leading-relaxed">Ketuk QR ini untuk memperbesar.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Active Session Radar / Kill Switch */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={`rounded-2xl p-6 border transition-all duration-300 ${
                activeSession 
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 shadow-lg shadow-rose-500/10" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
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
                    <h3 className={`font-bold text-sm transition-colors ${activeSession ? "text-rose-900 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                      Status Sesi Akses
                    </h3>
                    <p className={`text-xs mt-0.5 transition-colors ${activeSession ? "text-rose-600 dark:text-rose-500 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
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
                  <div className="w-full py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-sm font-semibold rounded-xl text-center transition-colors">
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
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden group hover:border-blue-200 dark:hover:border-blue-800 transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 rounded-xl flex items-center justify-center transition-colors">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800 text-xs shadow-none transition-colors">Total</Badge>
                  </div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">{loading ? "–" : records.length}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium transition-colors">Dokumen Rekam Medis</p>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 rounded-xl flex items-center justify-center transition-colors">
                      <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 text-xs shadow-none transition-colors">Bulan Ini</Badge>
                  </div>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight transition-colors">{loading ? "–" : auditLogs.length}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium transition-colors">Log Akses Keamanan</p>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Health Timeline */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col h-full transition-colors duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-colors">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-slate-900 dark:text-white font-bold text-base transition-colors">Linimasa Kesehatan</h2>
                </div>
                
                <div className="flex-1">
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl dark:bg-slate-800" />)}
                    </div>
                  ) : records.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                        <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">Belum ada riwayat medis</p>
                    </div>
                  ) : (
                    <div className="relative pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-6 py-2 transition-colors">
                      {records.slice(0, 4).map((r, i) => (
                        <div key={r.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[17px] top-1 w-3 h-3 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-full transition-colors" />
                          
                          <div className="pl-4">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 block transition-colors">
                              {new Date(r.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-3 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{r.diagnosis}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Audit Trail — Vertical Timeline */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 flex flex-col h-full transition-colors duration-300">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center transition-colors">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-base transition-colors">Riwayat Akses</h2>
                  </div>
                  {!loading && auditLogs.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{auditLogs.length} log</span>
                  )}
                </div>

                <div className="flex-1">
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl dark:bg-slate-800" />)}
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                        <Clock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">Belum ada riwayat akses</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 transition-colors">Log akan muncul setelah dokter mengakses data Anda</p>
                    </div>
                  ) : (
                    // ✨ Tier 2.2 — Vertical Timeline View
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-100 dark:bg-slate-800 transition-colors" />

                      <div className="space-y-4">
                        {auditLogs.slice(0, 5).map((log, i) => {
                          const isEmergency = log.access_method === "EMERGENCY";
                          const isRevoked   = log.access_method === "REVOKED";
                          const isQR        = log.access_method === "QR";

                          const dotColor = isEmergency
                            ? "bg-rose-500 ring-rose-200"
                            : isRevoked
                            ? "bg-slate-400 ring-slate-100"
                            : isQR
                            ? "bg-emerald-500 ring-emerald-200"
                            : "bg-blue-500 ring-blue-200";

                          const badgeStyle = isEmergency
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isRevoked
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : isQR
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-blue-50 text-blue-700 border-blue-200";

                          const methodIcon = isEmergency ? (
                            <TriangleAlert className="w-3 h-3" />
                          ) : isQR ? (
                            <QrCode className="w-3 h-3" />
                          ) : isRevoked ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <Activity className="w-3 h-3" />
                          );

                          // ✨ Tier 2.3 — Verified SIP badge: doctor_name without EMERGENCY suffix
                          const rawName = log.doctor_name?.replace(/ \(EMERGENCY:.*\)$/, "") ?? "";

                          return (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="flex gap-4 pl-2"
                            >
                              {/* Timeline dot */}
                              <div className={`relative z-10 w-[14px] h-[14px] rounded-full ring-4 shrink-0 mt-1.5 ${dotColor}`} />

                              {/* Content card */}
                              <div className={`flex-1 rounded-xl border p-3 transition-all hover:shadow-sm ${
                                isEmergency
                                  ? "bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50"
                                  : isRevoked
                                  ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800"
                                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/20"
                              }`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className={`font-bold text-xs truncate transition-colors ${
                                        isEmergency ? "text-rose-700 dark:text-rose-400" : "text-slate-900 dark:text-slate-200"
                                      }`}>
                                        {rawName}
                                      </p>
                                      {/* ✨ Tier 2.3: Verified SIP badge for all non-revoked doctors */}
                                      {!isRevoked && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-[9px] font-bold text-blue-600 dark:text-blue-400 shrink-0 transition-colors">
                                          <ShieldCheck className="w-2.5 h-2.5" /> Terverifikasi
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5 transition-colors">
                                      {formatDistanceToNow(new Date(log.accessed_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider shrink-0 transition-colors ${badgeStyle} dark:bg-slate-900/50`}>
                                    {methodIcon}
                                    {log.access_method}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {!loading && auditLogs.length > 5 && (
                  <button className="w-full mt-4 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Lihat Semua {auditLogs.length} Log →
                  </button>
                )}
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      {/* QR Zoom Modal */}
      <AnimatePresence>
        {showQRZoom && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowQRZoom(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">QR Code Pasien</h2>
              <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl shadow-inner mb-6">
                <QRCodeSVG value={`PATIENT:${user.id}`} size={256} level="Q" />
              </div>
              <p className="text-slate-500 font-medium mb-8 text-center max-w-[250px]">
                Tunjukkan layar ini kepada dokter untuk discan dari perangkat mereka.
              </p>
              <button
                onClick={() => setShowQRZoom(false)}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors w-full"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
