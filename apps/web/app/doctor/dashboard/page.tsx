"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogOut, Stethoscope, Users, Search, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, FileText, Calendar, Pill,
  ClipboardList, Lock, Activity, Plus, X, User as UserIcon, Clock,
  QrCode, Zap, Sparkles, TriangleAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { doctorApi } from "@/lib/api";
import QRScanner from "@/components/QRScanner";
import type { MedicalRecord, ValidateAccessResponse, DoctorProfile, DoctorStats, DoctorHistoryEntry, User as UserType } from "@/types/api";

type PortalState = "idle" | "loading" | "success" | "error";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emergencyParam = searchParams?.get("emergency");
  const emergencyName = searchParams?.get("name");
  
  // Doctor Data
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [history, setHistory] = useState<DoctorHistoryEntry[]>([]);
  
  // Patient Access State
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [state, setState] = useState<PortalState>("idle");
  const [shaking, setShaking] = useState(false);
  const [patient, setPatient] = useState<ValidateAccessResponse | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Spectacular Features State
  const [showQR, setShowQR] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [emergencyNik, setEmergencyNik] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // New Record Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingRecord, setAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    diagnosis: "",
    prescription: "",
    notes: "",
    icd_code: "",
    visit_date: new Date().toISOString().split('T')[0]
  });

  const inputRefs = useCallback((el: HTMLInputElement | null, i: number) => {
    if (el) (window as unknown as Record<string, HTMLInputElement>)[`pin_${i}`] = el;
  }, []);

  const loadDoctorData = useCallback(async (token: string) => {
    try {
      const [profRes, statsRes, histRes] = await Promise.all([
        doctorApi.getProfile(token),
        doctorApi.getStats(token),
        doctorApi.getHistory(token)
      ]);
      setProfile(profRes);
      setStats(statsRes);
      setHistory(histRes.history);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat profil dokter.");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("cg_token");
    const userStr = localStorage.getItem("cg_user");
    if (!token || !userStr) { router.push("/auth/login?role=doctor"); return; }
    
    const u = JSON.parse(userStr) as UserType;
    if (u.role !== "doctor") { router.push("/auth/login?role=doctor"); return; }
    
    if (!u.is_kiosk) {
      loadDoctorData(token);
    }
    
    // If redirected from Kiosk with emergency param, auto-load records
    if (emergencyParam) {
      setPatient({
        patient_id: emergencyParam,
        patient_name: emergencyName || "Pasien Darurat (Kiosk)",
        message: "EMERGENCY ACCESS GRANTED"
      });
      fetchRecordsAndAI(emergencyParam, token);
    }
    
    // KIOSK MODE: 60s inactivity auto-logout
    if (u.is_kiosk) {
      let timeout: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          toast.error("Sesi Kiosk Darurat Habis (Auto-Logout)");
          localStorage.removeItem("cg_token");
          localStorage.removeItem("cg_user");
          router.push("/kiosk");
        }, 60000); // 60 seconds
      };
      
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("touchstart", resetTimer);
      resetTimer();
      
      return () => {
        clearTimeout(timeout);
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("touchstart", resetTimer);
      };
    }
  }, [router, loadDoctorData, emergencyParam]);

  const handleLogout = () => {
    localStorage.removeItem("cg_token");
    localStorage.removeItem("cg_user");
    router.push("/");
  };

  const handlePinChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 5) {
      (window as unknown as Record<string, HTMLInputElement>)[`pin_${index + 1}`]?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      (window as unknown as Record<string, HTMLInputElement>)[`pin_${index - 1}`]?.focus();
    }
  };

  const fetchRecordsAndAI = async (patientId: string, token: string) => {
    setLoadingRecords(true);
    try {
      const recRes = await doctorApi.getPatientRecords(patientId, token);
      setRecords(recRes.records as MedicalRecord[]);
      
      // Auto-fetch AI Summary after fetching records
      setLoadingAi(true);
      try {
        const aiRes = await doctorApi.getPatientSummaryAI(patientId, token);
        setAiSummary(aiRes.summary);
      } catch (err) {
        console.error("AI Error", err);
        setAiSummary("Gagal memuat ringkasan AI. Silakan periksa koneksi atau kuota API.");
      } finally {
        setLoadingAi(false);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSubmitPin = async () => {
    const fullPin = pin.join("");
    if (fullPin.length !== 6) { toast.error("Masukkan 6 digit PIN."); return; }
    setState("loading");
    const token = localStorage.getItem("cg_token")!;
    try {
      const res = await doctorApi.validateAccess({ pin: fullPin }, token);
      setPatient(res);
      setState("success");
      toast.success(`Akses diberikan! Melihat rekam medis ${res.patient_name}`);
      loadDoctorData(token);
      fetchRecordsAndAI(res.patient_id, token);
    } catch (err: unknown) {
      setState("error");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      toast.error("Token akses tidak valid atau telah kedaluwarsa");
      setTimeout(() => { setState("idle"); setPin(["", "", "", "", "", ""]); }, 2500);
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setShowQR(false);
    setState("loading");
    const token = localStorage.getItem("cg_token")!;
    try {
      const res = await doctorApi.validateAccess({ qr_payload: decodedText }, token);
      setPatient(res);
      setState("success");
      toast.success(`QR Valid! Mengakses rekam medis ${res.patient_name}`);
      loadDoctorData(token);
      fetchRecordsAndAI(res.patient_id, token);
    } catch (err: unknown) {
      setState("error");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      toast.error("QR Code tidak valid atau telah kedaluwarsa");
      setTimeout(() => { setState("idle"); }, 2500);
    }
  };

  const handleEmergencyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const token = localStorage.getItem("cg_token")!;
    try {
      const res = await doctorApi.emergencyAccess({ patient_nik: emergencyNik, reason: emergencyReason }, token);
      setPatient(res);
      setState("success");
      setShowEmergency(false);
      toast.success(`Akses Darurat Diberikan! Alarm terpicu pada akun ${res.patient_name}.`);
      loadDoctorData(token);
      fetchRecordsAndAI(res.patient_id, token);
    } catch (err: unknown) {
      setState("error");
      toast.error(err instanceof Error ? err.message : "Gagal melakukan akses darurat");
      setTimeout(() => { setState("idle"); }, 2500);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    const token = localStorage.getItem("cg_token")!;
    setAddingRecord(true);
    try {
      await doctorApi.createRecord(patient.patient_id, newRecord, token);
      toast.success("Rekam medis berhasil ditambahkan!");
      setShowAddForm(false);
      
      setNewRecord({
        diagnosis: "", prescription: "", notes: "", icd_code: "",
        visit_date: new Date().toISOString().split('T')[0]
      });

      // Refresh records and AI
      fetchRecordsAndAI(patient.patient_id, token);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah rekam medis");
    } finally {
      setAddingRecord(false);
    }
  };

  const resetSession = () => {
    setState("idle");
    setPin(["", "", "", "", "", ""]);
    setPatient(null);
    setRecords([]);
    setShowAddForm(false);
    setAiSummary(null);
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ===== SIDEBAR ===== */}
      <aside className="w-80 bg-white border-r border-slate-200 flex-col fixed top-0 left-0 bottom-0 z-40 hidden lg:flex shadow-sm overflow-y-auto">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">
              Aksa<span className="text-blue-600">medika</span>
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center bg-blue-50/50 rounded-2xl p-4 border border-blue-100 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-md mb-3">
              <span className="text-white text-xl font-extrabold">
                {profile ? getInitials(profile.name) : "?"}
              </span>
            </div>
            <p className="text-slate-900 font-bold">{profile?.name ?? "Memuat..."}</p>
            {profile?.specialty && (
              <Badge className="mt-2 bg-blue-100 text-blue-700 border-blue-200 shadow-none hover:bg-blue-100">
                {profile.specialty}
              </Badge>
            )}
            {profile?.license_no && (
              <p className="text-slate-500 text-xs mt-2 font-mono">{profile.license_no}</p>
            )}
          </div>
        </div>

        <div className="flex-1 p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Riwayat Akses Terakhir</h3>
          {history.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">Belum ada riwayat akses.</div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.access_method === 'EMERGENCY' ? 'bg-rose-100' : 'bg-white border border-slate-200'
                  }`}>
                    {entry.access_method === 'EMERGENCY' 
                      ? <TriangleAlert className="w-4 h-4 text-rose-600" />
                      : <UserIcon className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${entry.access_method === 'EMERGENCY' ? 'text-rose-600' : 'text-slate-900'}`}>
                      {entry.patient_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(entry.accessed_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shadow-none shrink-0 ${
                    entry.access_method === 'EMERGENCY' ? 'border-rose-200 text-rose-700 bg-rose-50' : ''
                  }`}>
                    {entry.access_method}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-sm font-bold transition-colors w-full px-4 py-2.5 rounded-xl">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 lg:ml-80 p-6 lg:p-10 pt-20 lg:pt-10">
        
        {!patient && (
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats?.total_accesses ?? 0}</p>
                  <p className="text-slate-500 text-sm font-medium">Total Pasien Diakses</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-slate-200">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats?.today_accesses ?? 0}</p>
                  <p className="text-slate-500 text-sm font-medium">Akses Hari Ini</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border-slate-200 md:col-span-1">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {stats?.last_accessed_at ? new Date(stats.last_accessed_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : "-"}
                  </p>
                  <p className="text-slate-500 text-sm font-medium">Akses Terakhir</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {patient ? "Rekam Medis Pasien" : "Portal Akses Pasien"}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              {patient 
                ? "Akses eksklusif sementara diaktifkan."
                : "Masukkan PIN 6-digit dari pasien atau Scan QR Code."}
            </p>
          </div>
          {patient && (
            <Button onClick={resetSession} variant="outline" size="sm"
              className="text-slate-700 border-slate-200 hover:bg-slate-50 font-semibold shrink-0">
              Sesi Baru
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* === ACCESS PORTAL === */}
          {!patient && !showQR && !showEmergency && (
            <motion.div key="pin-entry" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="max-w-md">
              <Card className={`border shadow-sm transition-all ${
                state === "error" ? "border-rose-300 shadow-rose-100" : "border-slate-200"
              }`}>
                <CardContent className="pt-8 pb-8 px-8">
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                      state === "loading" ? "bg-blue-50"
                      : state === "error" ? "bg-rose-50"
                      : "bg-slate-100"
                    }`}>
                      {state === "loading"
                        ? <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        : state === "error"
                        ? <AlertCircle className="w-8 h-8 text-rose-500" />
                        : <Lock className="w-8 h-8 text-slate-400" />
                      }
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Masukkan PIN Pasien</h2>
                  </div>

                  <div className={`flex gap-2 sm:gap-3 justify-center mb-6 ${shaking ? "shake" : ""}`}>
                    {pin.map((digit, i) => (
                      <input key={i}
                        ref={(el) => inputRefs(el, i)}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handlePinChange(e.target.value, i)}
                        onKeyDown={(e) => handlePinKeyDown(e, i)}
                        disabled={state === "loading"}
                        className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-extrabold rounded-xl border-2 outline-none transition-all
                          ${state === "error"
                            ? "border-rose-400 text-rose-500 bg-rose-50"
                            : digit
                            ? "border-blue-500 text-blue-700 bg-blue-50"
                            : "border-slate-200 text-slate-900 bg-white focus:border-blue-400 focus:bg-blue-50/30"
                          }`}
                      />
                    ))}
                  </div>

                  {state === "error" && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-rose-500 text-sm text-center mb-4 font-semibold">
                      PIN tidak valid atau sudah kedaluwarsa.
                    </motion.p>
                  )}

                  <div className="space-y-3">
                    <Button onClick={handleSubmitPin}
                      disabled={state === "loading" || pin.join("").length !== 6}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm">
                      {state === "loading"
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memverifikasi PIN...</>
                        : <>Verifikasi & Akses Rekam Medis <ChevronRight className="w-4 h-4 ml-1" /></>
                      }
                    </Button>

                    <Button onClick={() => setShowQR(true)} variant="outline"
                      disabled={state === "loading"}
                      className="w-full h-12 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-sm text-sm">
                      <QrCode className="w-4 h-4 mr-2" /> Scan QR Code via Kamera
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Break-Glass Button */}
              <div className="mt-8 text-center">
                <button onClick={() => setShowEmergency(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full text-sm font-bold transition-colors">
                  <TriangleAlert className="w-4 h-4" />
                  Akses Darurat (Break-Glass)
                </button>
              </div>
            </motion.div>
          )}

          {/* === QR SCANNER MODAL === */}
          {showQR && !patient && (
            <motion.div key="qr-scanner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
              <Card className="border shadow-md border-blue-200">
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <QrCode className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Scan QR Pasien</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <QRScanner onScanSuccess={handleScanSuccess} />
                  <Button onClick={() => setShowQR(false)} variant="ghost" className="mt-4 text-slate-500">
                    Batal
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === EMERGENCY BREAK-GLASS MODAL === */}
          {showEmergency && !patient && (
            <motion.div key="emergency" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md">
              <Card className="border-2 shadow-xl border-rose-500 shadow-rose-500/20 bg-rose-50/50">
                <CardHeader className="text-center pb-4 border-b border-rose-200 bg-white rounded-t-xl">
                  <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-pulse">
                    <TriangleAlert className="w-8 h-8 text-rose-600" />
                  </div>
                  <CardTitle className="text-xl text-rose-600 font-extrabold uppercase tracking-wide">Protokol Darurat</CardTitle>
                  <p className="text-sm text-slate-600 mt-2 font-medium">Peringatan: Penggunaan akses ini akan memicu alarm pada sistem pasien dan tercatat secara permanen di audit log.</p>
                </CardHeader>
                <CardContent className="pt-6 bg-white rounded-b-xl">
                  <form onSubmit={handleEmergencyAccess} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700">NIK Pasien Target (16 Digit)</Label>
                      <Input type="text" required value={emergencyNik} onChange={e => setEmergencyNik(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="0000000000000000" className="border-rose-200 focus-visible:ring-rose-500 font-mono tracking-widest" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-slate-700">Alasan Darurat Kritis</Label>
                      <Textarea required value={emergencyReason} onChange={e => setEmergencyReason(e.target.value)} placeholder="Contoh: Pasien tidak sadarkan diri di UGD, dicurigai henti jantung..." className="border-rose-200 focus-visible:ring-rose-500 min-h-[100px]" />
                    </div>
                    <div className="pt-4 flex gap-3">
                      <Button type="button" onClick={() => setShowEmergency(false)} variant="outline" className="flex-1 border-slate-200">Batal</Button>
                      <Button type="submit" disabled={state === "loading"} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold">
                        {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "OVERRIDE AKSES"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === RECORDS VIEW === */}
          {patient && (
            <motion.div key="records" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-4xl">

              {/* Patient header */}
              <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-white shadow-sm overflow-hidden">
                <CardContent className="py-6 px-6 relative">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                        <span className="text-white text-xl font-extrabold">
                          {getInitials(patient.patient_name)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-slate-900 font-extrabold text-2xl">{patient.patient_name}</p>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-bold shadow-none px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sesi Aktif
                          </Badge>
                        </div>
                        <p className="text-slate-600 text-sm mt-1 flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-emerald-500" />
                          {patient.message === "EMERGENCY ACCESS GRANTED" 
                            ? <span className="text-rose-600 font-bold">AKSES DARURAT DIGUNAKAN</span>
                            : "Sesi aman sedang berlangsung. Anda memiliki izin baca dan tulis."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI MEDICAL SUMMARY (Tier 1 Wow Feature) */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <CardHeader className="pb-3 border-b border-purple-100/50">
                  <CardTitle className="text-purple-900 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Medical Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {loadingAi ? (
                    <div className="flex items-center gap-3 text-purple-600 text-sm font-medium animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> Menganalisis riwayat medis pasien dengan AI...
                    </div>
                  ) : aiSummary ? (
                    <div className="prose prose-sm prose-purple max-w-none font-medium leading-relaxed">
                      {/* Render line breaks properly */}
                      {aiSummary.split('\n').map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Tidak ada riwayat medis untuk dianalisis.</p>
                  )}
                  
                  {/* AI Clinical Safety Disclaimer */}
                  <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl">
                    <p className="text-amber-800 text-xs font-semibold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      Disclaimer Klinis: Ringkasan AI ini hanya sebagai referensi cepat dan dapat mengalami halusinasi (*AI Hallucinations*). Jangan jadikan panduan utama. Selalu verifikasi dosis obat pada dokumen rekam medis asli di bawah.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Riwayat Rekam Medis
                  {!loadingRecords && (
                    <Badge variant="secondary" className="text-xs bg-slate-200 text-slate-700 shadow-none">
                      {records.length} rekam
                    </Badge>
                  )}
                </h2>
                <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md w-full sm:w-auto">
                  {showAddForm ? <><X className="w-4 h-4 mr-2" /> Batal</> : <><Plus className="w-4 h-4 mr-2" /> Tambah Rekam Medis</>}
                </Button>
              </div>

              {/* Add Record Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <Card className="border-2 border-blue-200 shadow-md bg-blue-50/30">
                      <CardHeader className="border-b border-blue-100 bg-white">
                        <CardTitle className="text-base text-slate-900">Tambah Rekam Medis Baru</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white">
                        <form onSubmit={handleAddRecord} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-slate-700">Diagnosis Utama *</Label>
                              <Input required value={newRecord.diagnosis} onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})} placeholder="cth. Hipertensi" className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-slate-700">Kode ICD-10 (Opsional)</Label>
                              <Input value={newRecord.icd_code} onChange={e => setNewRecord({...newRecord, icd_code: e.target.value})} placeholder="cth. I10" className="bg-slate-50 border-slate-200 font-mono" />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Resep Obat</Label>
                            <Input value={newRecord.prescription} onChange={e => setNewRecord({...newRecord, prescription: e.target.value})} placeholder="cth. Amlodipine 5mg 1x1" className="bg-slate-50 border-slate-200" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Catatan Dokter</Label>
                            <Textarea value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Tambahkan catatan keluhan atau observasi klinis..." className="bg-slate-50 border-slate-200 min-h-[100px]" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700">Tanggal Kunjungan *</Label>
                            <Input type="date" required value={newRecord.visit_date} onChange={e => setNewRecord({...newRecord, visit_date: e.target.value})} className="bg-slate-50 border-slate-200 max-w-[200px]" />
                          </div>

                          <div className="pt-2 flex justify-end">
                            <Button type="submit" disabled={addingRecord} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                              {addingRecord ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan Rekam Medis"}
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Records List */}
              <div className="space-y-3">
                {loadingRecords ? (
                  // ✨ Skeleton loaders — mimic the shape of actual record cards
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="bg-white border-slate-200 shadow-sm">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1 space-y-3 w-full">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-2/5 rounded-md" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                              </div>
                              <Skeleton className="h-4 w-3/5 rounded-md" />
                              <Skeleton className="h-4 w-4/5 rounded-md" />
                            </div>
                            <div className="text-right shrink-0 w-full md:w-auto space-y-2">
                              <Skeleton className="h-4 w-28 rounded-md ml-auto" />
                              <Skeleton className="h-3 w-20 rounded-md ml-auto" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-900 font-bold">Belum ada rekam medis</p>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Silakan tambahkan rekam medis baru untuk pasien ini menggunakan tombol di atas.</p>
                  </div>
                ) : (
                  records.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-white border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-slate-900 font-extrabold text-lg">{r.diagnosis}</h3>
                                {r.icd_code && (
                                  <Badge variant="outline" className="text-xs font-mono text-slate-600 bg-slate-50 shadow-none border-slate-200">
                                    {r.icd_code}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                {r.prescription && (
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                    <p className="text-slate-700 text-sm font-medium leading-relaxed">{r.prescription}</p>
                                  </div>
                                )}
                                {r.notes && (
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 bg-blue-50 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{r.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-left md:text-right shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-100 mt-2 md:mt-0">
                              <div className="flex items-center md:justify-end gap-1.5 text-slate-900 font-bold text-sm">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {new Date(r.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                              </div>
                              {r.doctor_name && (
                                <p className="text-slate-500 text-xs mt-1.5 font-medium flex items-center md:justify-end gap-1.5">
                                  <Stethoscope className="w-3 h-3" /> dr. {r.doctor_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function DoctorDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Memuat Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
