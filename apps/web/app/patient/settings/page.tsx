"use client";

import { useState, useEffect } from "react";
import { Shield, Save, CheckCircle, AlertCircle } from "lucide-react";
import { getPatientSettings, updatePatientSettings } from "@/lib/api";

export default function PatientSettingsPage() {
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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

  if (loading) {
    return <div className="p-8 text-slate-500">Memuat pengaturan...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
    </div>
  );
}
