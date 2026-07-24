"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, FileText, Clock, Activity, LogOut, Zap, ChevronRight, User, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { patientApi } from "@/lib/api";
import type { MaskedRecord, AuditEntry, User as UserType } from "@/types/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [records, setRecords] = useState<MaskedRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Aksa<span className="text-blue-600">medika</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 text-xs font-bold">{getInitials(user.name)}</span>
              </div>
            )}
            <button onClick={handleLogout}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">

        {/* Greeting Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-md shadow-blue-500/20">
            <p className="text-blue-100 text-sm font-medium">{getGreeting()},</p>
            <h1 className="text-xl font-extrabold mt-0.5">
              {user?.name ?? <Skeleton className="h-6 w-40 bg-white/20" />}
            </h1>
            <p className="text-blue-200 text-xs mt-1.5">Pasien · Aksamedika</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-3">
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{loading ? "–" : records.length}</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Rekam Medis</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{loading ? "–" : auditLogs.length}</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Event Akses</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Generate Access CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <Link href="/patient/consent">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm">Buat Token Akses</p>
                  <p className="text-slate-500 text-xs mt-0.5">Buat PIN 30 menit untuk dokter Anda</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </motion.div>

        {/* Recent Records */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 font-bold text-sm">Rekam Medis Terbaru</h2>
            <span className="text-blue-600 text-xs font-semibold">Hanya data Anda</span>
          </div>
          <div className="space-y-2.5">
            {loading ? (
              Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            ) : records.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-10 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-semibold">Belum ada rekam medis</p>
                <p className="text-slate-400 text-xs mt-1">Data rekam medis Anda akan muncul di sini</p>
              </div>
            ) : (
              records.slice(0, 5).map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}>
                  <Card className="bg-white border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-slate-900 font-semibold text-sm">{r.diagnosis}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {new Date(r.visit_date).toLocaleDateString("id-ID", {
                              day: "numeric", month: "long", year: "numeric"
                            })}
                          </p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs shrink-0 shadow-none">
                          Kunjungan
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Access History */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-900 font-bold text-sm">Riwayat Akses Dokter</h2>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <AnimatePresence>
            {loading ? (
              Array.from({length: 2}).map((_, i) =>
                <Skeleton key={i} className="h-16 rounded-2xl mb-2.5" />)
            ) : auditLogs.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-10 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-slate-600 text-sm font-semibold">Belum ada akses</p>
                <p className="text-slate-400 text-xs mt-1">Data Anda aman dan terlindungi</p>
              </div>
            ) : (
              auditLogs.slice(0, 5).map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="mb-2.5">
                  <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="py-4 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            log.access_method === "EMERGENCY" ? "bg-rose-100" : "bg-slate-100"
                          }`}>
                            {log.access_method === "EMERGENCY" ? (
                              <TriangleAlert className="w-4 h-4 text-rose-600" />
                            ) : (
                              <User className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${log.access_method === "EMERGENCY" ? "text-rose-600" : "text-slate-900"}`}>
                              {log.doctor_name}
                            </p>
                            <p className="text-slate-500 text-xs mt-0.5">
                              {formatDistanceToNow(new Date(log.accessed_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] shrink-0 shadow-none ${
                          log.access_method === "PIN"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : log.access_method === "QR"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}>
                          via {log.access_method}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
