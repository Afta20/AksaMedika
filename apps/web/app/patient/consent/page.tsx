"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowLeft, Copy, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { patientApi } from "@/lib/api";
import type { GenerateConsentResponse } from "@/types/api";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";

/* ── Circular Countdown Component ───────────────────────── */
function CircularCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(1800);

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const TOTAL = 1800;
  const RADIUS = 36;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = remaining / TOTAL;
  const offset = CIRCUMFERENCE * (1 - progress);
  const isExpiring = remaining < 300;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const color = isExpiring ? "#f43f5e" : "#2563eb";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          {/* Background ring */}
          <circle cx="44" cy="44" r={RADIUS} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          {/* Progress ring */}
          <circle
            cx="44" cy="44" r={RADIUS}
            fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
          />
        </svg>
        {/* Timer text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-slate-900 leading-none">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>
      <p className={`text-xs font-bold uppercase tracking-wider ${isExpiring ? "text-rose-500" : "text-slate-500"}`}>
        {isExpiring ? "⚠ Segera kedaluwarsa" : "Sisa waktu"}
      </p>
    </div>
  );
}

/* ── Main Consent Page ───────────────────────────────────── */
export default function ConsentPage() {
  const router = useRouter();
  const [consent, setConsent] = useState<GenerateConsentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const tokenRef = useRef<string>("");

  const generate = useCallback(async () => {
    const token = localStorage.getItem("cg_token");
    if (!token) { router.push("/auth/login?role=patient"); return; }
    tokenRef.current = token;
    setLoading(true);
    try {
      const res = await patientApi.generateConsent(token);
      setConsent(res);
      toast.success("Token akses baru dibuat! Berlaku 30 menit.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat token");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("cg_token");
    if (!token) { router.push("/auth/login?role=patient"); return; }
    generate();
  }, [generate, router]);

  const copyPin = () => {
    if (!consent) return;
    navigator.clipboard.writeText(consent.pin);
    setCopied(true);
    toast.success("PIN berhasil disalin!");
    setTimeout(() => setCopied(false), 2500);
  };

  const isExpired = consent ? new Date(consent.expires_at).getTime() < Date.now() : false;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/patient/dashboard">
            <button className="text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Buat Token Akses</span>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-5">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-extrabold text-slate-900">Token Akses Dokter</h1>
          <p className="text-slate-600 text-sm mt-1 leading-relaxed">
            Bagikan PIN di bawah ini kepada dokter Anda. Token akan kedaluwarsa otomatis dalam 30 menit.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* Loading state */}
          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <p className="text-slate-600 font-semibold text-sm">Membuat token aman...</p>
            </motion.div>
          )}

          {/* Active token */}
          {!loading && consent && !isExpired && (
            <motion.div key="consent" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="space-y-4">

              {/* PIN + Timer Card */}
              <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  {/* Label */}
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest text-center mb-5">
                    PIN 6-Digit
                  </p>

                  {/* Digits */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {consent.pin.split("").map((digit, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07, type: "spring", stiffness: 300 }}
                        className="w-11 h-14 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center justify-center text-2xl font-extrabold text-blue-700 shadow-sm">
                        {digit}
                      </motion.div>
                    ))}
                  </div>

                  {/* Circular countdown */}
                  <div className="flex justify-center mb-5">
                    <CircularCountdown expiresAt={consent.expires_at} />
                  </div>

                  {/* Copy button */}
                  <Button onClick={copyPin} variant="outline" size="sm"
                    className={`w-full h-11 font-bold rounded-xl transition-all border-2 ${
                      copied
                        ? "border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-50"
                        : "border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                    }`}>
                    {copied
                      ? <><CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> PIN Disalin!</>
                      : <><Copy className="w-4 h-4 mr-2" /> Salin PIN</>
                    }
                  </Button>
                </CardContent>
              </Card>

              {/* QR Code */}
              <Card className="bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">QR Code (Opsional)</p>
                  <div className="inline-block p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <QRCodeSVG
                      value={JSON.stringify({ payload: consent.qr_payload, exp: consent.expires_at })}
                      size={180}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                      level="M"
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-3 font-medium">
                    Minta dokter untuk memindai QR Code ini
                  </p>
                </CardContent>
              </Card>

              {/* Security note */}
              <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-900 font-bold text-sm">Token Sekali Pakai</p>
                  <p className="text-amber-800 text-sm mt-1 leading-relaxed">
                    PIN ini hanya bisa digunakan sekali. Begitu dokter memasukkannya, token langsung tidak berlaku.
                  </p>
                </div>
              </div>

              <Button onClick={generate} variant="outline"
                className="w-full h-11 border-slate-300 text-slate-700 font-bold hover:bg-slate-50 rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" /> Buat Token Baru
              </Button>
            </motion.div>
          )}

          {/* Expired state */}
          {!loading && (!consent || isExpired) && (
            <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white border border-slate-200 rounded-2xl py-14 text-center shadow-sm">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-900 font-extrabold text-lg mb-1">Token Kedaluwarsa</p>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto leading-relaxed">
                Buat token baru untuk memberikan akses kepada dokter Anda.
              </p>
              <Button onClick={generate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-xl shadow-md shadow-blue-500/20">
                Buat Token Baru
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
