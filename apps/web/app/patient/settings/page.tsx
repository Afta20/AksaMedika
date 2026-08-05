"use client";

import { useState, useEffect } from "react";
import { Shield, Save, CheckCircle, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { getPatientSettings, updatePatientSettings } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientSettingsPage() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem("cg_token");
        const userStr = localStorage.getItem("cg_user");
        if (userStr) {
          const u = JSON.parse(userStr);
          setUserName(u.name || "");
        }
        
        if (token) {
          const res = await getPatientSettings(token);
          if (res.nik) {
            setNik(res.nik);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nik.length !== 16) {
      setMessage({ type: "error", text: "NIK harus terdiri dari 16 digit angka." });
      return;
    }
    
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("cg_token");
      if (token) {
        await updatePatientSettings(token, nik);
        setMessage({ type: "success", text: "Pengaturan keamanan berhasil diperbarui." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menyimpan NIK." });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cg_token");
    localStorage.removeItem("cg_user");
    router.push("/");
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "?";

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Memuat pengaturan...</div>;
  }

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
            {userName && (
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-900">{userName}</span>
                <span className="text-[10px] text-slate-500 font-medium">Pasien</span>
              </div>
            )}
            {userName && (
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shadow-inner border border-blue-200 mr-2">
                <span className="text-blue-700 text-xs font-bold">{getInitials(userName)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
              <button onClick={handleLogout}
                className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-xl hover:bg-rose-50">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link href="/patient/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengaturan Keamanan</h1>
            <p className="text-slate-500">Kelola identitas darurat dan privasi akun Anda</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Akses Darurat (Emergency Override)</h2>
          <p className="text-sm text-slate-600 mb-6">
            Masukkan 16 digit Nomor Induk Kependudukan (NIK) Anda. NIK ini akan digunakan oleh pihak IGD Rumah Sakit untuk membuka rekam medis Anda <strong>hanya dalam kondisi gawat darurat</strong> (misal: Anda tidak sadarkan diri). Otorisasi dokter tetap diwajibkan.
          </p>

          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Nomor Induk Kependudukan (NIK)</label>
              <div className="relative">
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Masukkan 16 digit NIK"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all font-mono text-lg tracking-widest placeholder:tracking-normal placeholder:font-sans"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                  {nik.length}/16
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || nik.length !== 16}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Simpan Pengaturan
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
