"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LogOut, Stethoscope, Users, Search, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, FileText, Calendar, Pill,
  ClipboardList, Lock, Activity, Plus, X, User as UserIcon, Clock,
  QrCode, Zap, Sparkles, TriangleAlert, Download, ShieldCheck, Moon, Sun,
  RotateCcw, PlusCircle, Tag
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { doctorApi } from "@/lib/api";
import QRScanner from "@/components/QRScanner";
import type { MedicalRecord, ValidateAccessResponse, DoctorProfile, DoctorStats, DoctorHistoryEntry, User as UserType } from "@/types/api";

type PortalState = "idle" | "loading" | "success" | "error";

// ✨ Tier 2.1 — PDF Export helper
async function exportRecordToPDF(record: MedicalRecord, patientName: string, doctorName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin = 20;
  const pageW = 210;
  const col = pageW - margin * 2;
  let y = margin;

  // — Header bar
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Aksamedika", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Zero-Trust Electronic Medical Record", margin, 19);
  doc.setFontSize(7);
  doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}`, pageW - margin, 19, { align: "right" });

  y = 40;

  // — Patient Info box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, col, 22, 3, 3, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("INFORMASI PASIEN", margin + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nama: ${patientName}`, margin + 5, y + 14);
  doc.text(`Dokter: dr. ${doctorName}`, margin + 90, y + 14);
  y += 30;

  // — Section: Diagnosis
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(record.diagnosis, margin, y);
  if (record.icd_code) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`ICD: ${record.icd_code}`, margin, y + 6);
    y += 6;
  }
  y += 8;

  // — Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // — Visit date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Tanggal Kunjungan", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(record.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
    margin + 45, y
  );
  y += 10;

  // — Prescription
  if (record.prescription) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Resep", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const presLines = doc.splitTextToSize(record.prescription, col - 45);
    doc.text(presLines, margin + 45, y);
    y += presLines.length * 5 + 5;
  }

  // — Notes
  if (record.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Catatan Medis", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const noteLines = doc.splitTextToSize(record.notes, col - 45);
    doc.text(noteLines, margin + 45, y);
    y += noteLines.length * 5 + 5;
  }

  // — Watermark (subtle)
  doc.setTextColor(226, 232, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.text("AKSAMEDIKA", pageW / 2, 180, { align: "center", angle: 45 });

  // — Footer
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Dokumen ini dihasilkan secara digital oleh Aksamedika · Zero-Trust Medical Platform", margin, 285);
  doc.text("Dokumen ini sah tanpa tanda tangan jika diverifikasi melalui sistem Aksamedika.", margin, 289);

  doc.save(`rekam-medis-${patientName.replace(/\s+/g, "-").toLowerCase()}-${record.id.slice(0, 8)}.pdf`);
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emergencyParam = searchParams?.get("emergency");
  const emergencyName = searchParams?.get("name");
  
  const { setTheme } = useTheme();
  const [autoNightShift, setAutoNightShift] = useState(false);
  const nightShiftCheckedRef = useRef(false);

  // 🌙 Smart Auto Night Shift (18:00 - 06:00 WIB) — Runs only once when enabled
  useEffect(() => {
    if (autoNightShift && !nightShiftCheckedRef.current) {
      nightShiftCheckedRef.current = true;
      const hour = new Date().getHours();
      if (hour >= 18 || hour < 6) {
        setTheme("dark");
        toast("🌙 Mode Jaga Malam Aktif", {
          description: "Beralih ke Dark Mode (18:00 - 06:00) demi kenyamanan mata dokter saat piket malam.",
        });
      }
    }
  }, [autoNightShift, setTheme]);

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
    record_type: "rutin",
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
      const fetchedRecords = recRes.records as MedicalRecord[];
      setRecords(fetchedRecords);
      
      // Fetch AI Summary from backend (Groq)
      setLoadingAi(true);
      try {
        const aiRes = await doctorApi.getPatientSummaryAI(patientId, token);
        setAiSummary(aiRes.summary);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[AI Summary Error]", errMsg);
        setAiSummary(`Gagal memuat ringkasan AI: ${errMsg}`);
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
      let formattedDiagnosis = newRecord.diagnosis.trim();
      if (newRecord.record_type === "revisi" && !formattedDiagnosis.startsWith("[REVISI]")) {
        formattedDiagnosis = `[REVISI] ${formattedDiagnosis}`;
      } else if (newRecord.record_type === "addendum" && !formattedDiagnosis.startsWith("[ADDENDUM]")) {
        formattedDiagnosis = `[ADDENDUM] ${formattedDiagnosis}`;
      }

      const payload = {
        diagnosis: formattedDiagnosis,
        prescription: newRecord.prescription,
        notes: newRecord.notes,
        icd_code: newRecord.icd_code,
        visit_date: newRecord.visit_date
      };

      await doctorApi.createRecord(patient.patient_id, payload, token);
      toast.success(newRecord.record_type === "revisi" ? "Catatan revisi rekam medis berhasil disimpan!" : "Rekam medis berhasil ditambahkan!");
      setShowAddForm(false);
      
      setNewRecord({
        diagnosis: "", prescription: "", notes: "", icd_code: "", record_type: "rutin",
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ===== SIDEBAR ===== */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed top-0 left-0 bottom-0 z-40 hidden lg:flex shadow-sm overflow-y-auto transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight transition-colors">
                Aksa<span className="text-blue-600 dark:text-blue-400">medika</span>
              </span>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-col items-center bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/50 text-center transition-colors">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-md mb-3">
              <span className="text-white text-xl font-extrabold">
                {profile ? getInitials(profile.name) : "?"}
              </span>
            </div>
            <p className="text-slate-900 dark:text-white font-bold transition-colors">{profile?.name ?? "Memuat..."}</p>
            {profile?.specialty && (
              <Badge className="mt-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-none hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                {profile.specialty}
              </Badge>
            )}
            {profile?.license_no && (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 font-mono transition-colors">{profile.license_no}</p>
            )}
          </div>
        </div>

        <div className="flex-1 p-5">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 transition-colors">Riwayat Akses Terakhir</h3>
          {history.length === 0 ? (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm transition-colors">Belum ada riwayat akses.</div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    entry.access_method === 'EMERGENCY' ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  } transition-colors`}>
                    {entry.access_method === 'EMERGENCY' 
                      ? <TriangleAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      : <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold truncate ${entry.access_method === 'EMERGENCY' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'} transition-colors`}>
                      {entry.patient_name}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs transition-colors">
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
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-bold transition-colors w-full px-4 py-2.5 rounded-xl">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 lg:ml-80 p-6 lg:p-10 pt-20 lg:pt-10 transition-colors duration-300">
        
        {!patient && (
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center transition-colors">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">{stats?.total_accesses ?? 0}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">Total Pasien Diakses</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center transition-colors">
                  <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">{stats?.today_accesses ?? 0}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">Akses Hari Ini</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-900 shadow-sm border-slate-200 dark:border-slate-800 md:col-span-1 transition-colors">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-xl flex items-center justify-center transition-colors">
                  <Clock className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
                    {stats?.last_accessed_at ? new Date(stats.last_accessed_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : "-"}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium transition-colors">Akses Terakhir</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white transition-colors">
              {patient ? "Rekam Medis Pasien" : "Portal Akses Pasien"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 transition-colors">
              {patient 
                ? "Akses eksklusif sementara diaktifkan."
                : "Masukkan PIN 6-digit dari pasien atau Scan QR Code."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                const next = !autoNightShift;
                setAutoNightShift(next);
                nightShiftCheckedRef.current = false;
                if (next) {
                  const hour = new Date().getHours();
                  if (hour >= 18 || hour < 6) setTheme("dark");
                  toast.success("Mode Jaga Malam Otomatis diaktifkan (18:00 - 06:00)");
                } else {
                  toast("Mode Jaga Malam Otomatis dimatikan");
                }
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                autoNightShift
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
              }`}
              title="Otomatis beralih ke Dark Mode antara jam 18:00 - 06:00 demi kenyamanan mata dokter piket malam"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Jaga Malam: {autoNightShift ? "Auto (18-06)" : "Off"}</span>
              <span className="sm:hidden">{autoNightShift ? "Auto" : "Off"}</span>
            </button>

            {patient && (
              <Button onClick={resetSession} variant="outline" size="sm"
                className="text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold shrink-0">
                Sesi Baru
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* === ACCESS PORTAL === */}
          {!patient && !showQR && !showEmergency && (
            <motion.div key="pin-entry" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: PIN Form */}
              <div className="lg:col-span-5 space-y-6">
                <Card className={`border shadow-sm transition-all bg-white dark:bg-slate-900 ${
                  state === "error" ? "border-rose-300 dark:border-rose-800 shadow-rose-100 dark:shadow-none" : "border-slate-200 dark:border-slate-800"
                }`}>
                  <CardContent className="pt-8 pb-8 px-8">
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                        state === "loading" ? "bg-blue-50 dark:bg-blue-900/20"
                        : state === "error" ? "bg-rose-50 dark:bg-rose-900/20"
                        : "bg-slate-100 dark:bg-slate-800"
                      }`}>
                        {state === "loading"
                          ? <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                          : state === "error"
                          ? <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                          : <Lock className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        }
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white transition-colors">Masukkan PIN Pasien</h2>
                    </div>

                    <div className={`flex gap-2 sm:gap-3 justify-center mb-6 ${shaking ? "shake" : ""}`}>
                      {pin.map((digit, i) => (
                        <input key={i}
                          ref={(el) => inputRefs(el, i)}
                          type="password" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handlePinChange(e.target.value, i)}
                          onKeyDown={(e) => handlePinKeyDown(e, i)}
                          disabled={state === "loading"}
                          className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-extrabold rounded-xl border-2 outline-none transition-all
                            ${state === "error"
                              ? "border-rose-400 dark:border-rose-800 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                              : digit
                              ? "border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                              : "border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:border-blue-400 dark:focus:border-blue-700 focus:bg-blue-50/30 dark:focus:bg-blue-900/10"
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
                        className="w-full h-12 border-blue-200 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold rounded-xl shadow-sm text-sm">
                        <QrCode className="w-4 h-4 mr-2" /> Scan QR Code via Kamera
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Break-Glass Emergency Access CTA */}
                <div className="text-center">
                  <button onClick={() => setShowEmergency(true)} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer">
                    <TriangleAlert className="w-4 h-4 text-rose-500" />
                    Akses Darurat UGD (Break-Glass Override)
                  </button>
                </div>
              </div>

              {/* Right Column: Security Telemetry & Quick Access Guide */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Zero-Trust Telemetry Suite */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                  <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-blue-400/30">
                        <ShieldCheck className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">Protokol Keamanan Aksamedika</h3>
                        <p className="text-blue-300 text-xs font-medium">Standard Medik Digital Zero-Trust</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-1">Aktif & Terverifikasi</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Enkripsi Rekam</p>
                      <p className="text-white font-mono font-bold text-sm mt-1">AES-256 GCM</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">End-to-End Encrypted</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Durasi Akses</p>
                      <p className="text-white font-mono font-bold text-sm mt-1">30 Menit</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Single-Use Token</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                      <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Jejak Audit</p>
                      <p className="text-white font-mono font-bold text-sm mt-1">SHA-256 Hash</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Immutable Ledger</p>
                    </div>
                  </div>
                </div>

                {/* Quick Access Guide */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Panduan Akses Pasien Bagi Dokter
                  </h3>
                  <div className="space-y-3.5">
                    {[
                      { step: "01", title: "Minta PIN 6-Digit dari Pasien", desc: "Pasien meng-generate PIN dari menu 'Buat Token Akses' di aplikasi pasien." },
                      { step: "02", title: "Atau Scan QR Code Langsung", desc: "Ketuk 'Scan QR Code' dan arahkan kamera ke Kartu Identitas Digital pada HP pasien." },
                      { step: "03", title: "Break-Glass Protocol UGD", desc: "Jika pasien tidak sadarkan diri di UGD, gunakan fitur Akses Darurat dengan NIK pasien." },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 transition-colors">
                        <span className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {item.step}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
              <Card className="border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-blue-50 dark:from-blue-950 to-white dark:to-slate-900 shadow-sm overflow-hidden transition-colors">
                <CardContent className="py-6 px-6 relative">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-blue-100/50 dark:from-blue-900/20 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                        <span className="text-white text-xl font-extrabold">
                          {getInitials(patient.patient_name)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-slate-900 dark:text-white font-extrabold text-2xl transition-colors">{patient.patient_name}</p>
                          <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-bold shadow-none px-2 py-0.5 transition-colors">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Sesi Aktif
                          </Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5 transition-colors">
                          <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          {patient.message === "EMERGENCY ACCESS GRANTED" 
                            ? <span className="text-rose-600 dark:text-rose-400 font-bold">AKSES DARURAT DIGUNAKAN</span>
                            : "Sesi aman sedang berlangsung. Anda memiliki izin baca dan tulis."}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI MEDICAL SUMMARY (Tier 1 Wow Feature) */}
              <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50 dark:from-purple-950/30 to-white dark:to-slate-900 shadow-sm overflow-hidden relative transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/50 dark:bg-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <CardHeader className="pb-3 border-b border-purple-100/50 dark:border-purple-900/30">
                  <CardTitle className="text-purple-900 dark:text-purple-300 flex items-center gap-2 text-lg transition-colors">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Riwayat Rekam Medis
                  {!loadingRecords && (
                    <Badge variant="secondary" className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-none transition-colors">
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
                    <Card className="border-2 border-blue-200 dark:border-blue-900/50 shadow-md bg-blue-50/30 dark:bg-slate-900 transition-colors">
                      <CardHeader className="border-b border-blue-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                        <CardTitle className="text-base text-slate-900 dark:text-white transition-colors">Tambah Rekam Medis Baru</CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 bg-white dark:bg-slate-900 transition-colors">
                        <form onSubmit={handleAddRecord} className="space-y-4">
                          {/* Label Category Selector */}
                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors text-xs uppercase tracking-wider flex items-center gap-1.5">
                              <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Kategori Entri Catatan Medis (Status Medikolegal)
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              {[
                                { id: "rutin", label: "Kunjungan Rutin", icon: Stethoscope, desc: "Catatan diagnosis utama baru" },
                                { id: "revisi", label: "Koreksi / Revisi", icon: RotateCcw, desc: "Perbaikan atas kesalahan input sebelumnya" },
                                { id: "addendum", label: "Addendum Tambahan", icon: PlusCircle, desc: "Catatan resep/observasi susulan" },
                              ].map((item) => {
                                const IconComp = item.icon;
                                const isSelected = newRecord.record_type === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setNewRecord({ ...newRecord, record_type: item.id })}
                                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                                      isSelected
                                        ? item.id === "revisi"
                                          ? "bg-amber-50/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20"
                                          : item.id === "addendum"
                                          ? "bg-purple-50/80 dark:bg-purple-950/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-300 ring-2 ring-purple-500/20"
                                          : "bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-300 ring-2 ring-blue-500/20"
                                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                                      <span>{item.label}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{item.desc}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">
                                {newRecord.record_type === "revisi" ? "Diagnosis (Judul Koreksi) *" : newRecord.record_type === "addendum" ? "Diagnosis (Judul Addendum) *" : "Diagnosis Utama *"}
                              </Label>
                              <Input required value={newRecord.diagnosis} onChange={e => setNewRecord({...newRecord, diagnosis: e.target.value})} placeholder={newRecord.record_type === "revisi" ? "cth. Koreksi Resep Dosis Hipertensi" : "cth. Hipertensi"} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-colors" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">Kode ICD-10 (Opsional)</Label>
                              <Input value={newRecord.icd_code} onChange={e => setNewRecord({...newRecord, icd_code: e.target.value})} placeholder="cth. I10" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-mono transition-colors" />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">Resep Obat</Label>
                            <Input value={newRecord.prescription} onChange={e => setNewRecord({...newRecord, prescription: e.target.value})} placeholder="cth. Amlodipine 5mg 1x1" className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 transition-colors" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">Catatan Dokter</Label>
                            <Textarea value={newRecord.notes} onChange={e => setNewRecord({...newRecord, notes: e.target.value})} placeholder="Tambahkan catatan keluhan atau observasi klinis..." className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 min-h-[100px] transition-colors" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="font-semibold text-slate-700 dark:text-slate-300 transition-colors">Tanggal Kunjungan *</Label>
                            <Input type="date" required value={newRecord.visit_date} onChange={e => setNewRecord({...newRecord, visit_date: e.target.value})} className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 max-w-[200px] transition-colors" />
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
                      <Card key={i} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1 space-y-3 w-full">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-2/5 rounded-md dark:bg-slate-800" />
                                <Skeleton className="h-5 w-14 rounded-full dark:bg-slate-800" />
                              </div>
                              <Skeleton className="h-4 w-3/5 rounded-md dark:bg-slate-800" />
                              <Skeleton className="h-4 w-4/5 rounded-md dark:bg-slate-800" />
                            </div>
                            <div className="text-right shrink-0 w-full md:w-auto space-y-2">
                              <Skeleton className="h-4 w-28 rounded-md ml-auto dark:bg-slate-800" />
                              <Skeleton className="h-3 w-20 rounded-md ml-auto dark:bg-slate-800" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                      <FileText className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold transition-colors">Belum ada rekam medis</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-sm mx-auto transition-colors">Silakan tambahkan rekam medis baru untuk pasien ini menggunakan tombol di atas.</p>
                  </div>
                ) : (
                  records.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all">
                        <CardContent className="p-5 md:p-6">
                          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {r.diagnosis.startsWith("[REVISI]") ? (
                                  <>
                                    <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 text-xs font-bold shadow-none inline-flex items-center gap-1">
                                      <RotateCcw className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Koreksi / Revisi
                                    </Badge>
                                    <h3 className="text-slate-900 dark:text-white font-extrabold text-lg transition-colors">
                                      {r.diagnosis.replace(/^\[REVISI\]\s*/, "")}
                                    </h3>
                                  </>
                                ) : r.diagnosis.startsWith("[ADDENDUM]") ? (
                                  <>
                                    <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60 text-xs font-bold shadow-none inline-flex items-center gap-1">
                                      <PlusCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Addendum
                                    </Badge>
                                    <h3 className="text-slate-900 dark:text-white font-extrabold text-lg transition-colors">
                                      {r.diagnosis.replace(/^\[ADDENDUM\]\s*/, "")}
                                    </h3>
                                  </>
                                ) : (
                                  <h3 className="text-slate-900 dark:text-white font-extrabold text-lg transition-colors">{r.diagnosis}</h3>
                                )}
                                {r.icd_code && (
                                  <Badge variant="outline" className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 shadow-none border-slate-200 dark:border-slate-700 transition-colors">
                                    {r.icd_code}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                {r.prescription && (
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-900/30 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                      <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed transition-colors">{r.prescription}</p>
                                  </div>
                                )}
                                {r.notes && (
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-6 h-6 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                                      <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-colors">{r.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-left md:text-right shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-slate-100 dark:border-slate-800 mt-2 md:mt-0 space-y-2 transition-colors">
                              <div className="flex items-center md:justify-end gap-1.5 text-slate-900 dark:text-white font-bold text-sm transition-colors">
                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                {new Date(r.visit_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                              </div>
                              {r.doctor_name && (
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center md:justify-end gap-1.5 transition-colors">
                                  <Stethoscope className="w-3 h-3" /> dr. {r.doctor_name}
                                </p>
                              )}
                              {/* ✨ Tier 2.1 — Export PDF Button */}
                              <button
                                onClick={() => {
                                  toast.promise(
                                    exportRecordToPDF(r, patient?.patient_name ?? "Pasien", profile?.name ?? "Dokter"),
                                    {
                                      loading: "Menyiapkan PDF...",
                                      success: "PDF berhasil diunduh!",
                                      error: "Gagal mengekspor PDF.",
                                    }
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 md:ml-auto"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Export PDF
                              </button>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 transition-colors duration-300">Memuat Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
