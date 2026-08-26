"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

type Tab = "camera" | "upload";

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("camera");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Silence ZXing frame-level noise from the console
  const silentFailure = useCallback((err: unknown) => {
    if (typeof err === "string" && (
      err.includes("No MultiFormat Readers") ||
      err.includes("NotFoundException") ||
      err.includes("No QR code found") ||
      err.includes("IndexSizeError")
    )) return;
  }, []);

  // --- Camera Tab ---
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsScanning(false);

    // Clean up any previous instance
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
      scannerRef.current = null;
    }

    try {
      const qr = new Html5Qrcode("qr-camera-viewport");
      scannerRef.current = qr;

      await qr.start(
        { facingMode: "environment" },
        {
          fps: 12,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          qr.stop().catch(() => {});
          setIsScanning(true);
          onScanSuccess(decodedText);
        },
        silentFailure
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
        setCameraError("Izin kamera ditolak. Mohon klik Allow/Izinkan pada pop-up browser.");
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("devicenotfound")) {
        setCameraError("Kamera tidak ditemukan pada perangkat ini.");
      } else {
        setCameraError("Kamera tidak dapat dibuka. Coba tab Upload Foto.");
      }
    }
  }, [onScanSuccess, silentFailure]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (_) {}
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [activeTab, startCamera, stopCamera]);

  // --- Upload Tab ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("loading");
    setUploadMsg("Membaca QR dari foto...");

    let qrInstance: Html5Qrcode | null = null;
    try {
      qrInstance = new Html5Qrcode("qr-upload-worker");
      const result = await qrInstance.scanFile(file, true);
      setUploadStatus("success");
      setUploadMsg("QR Code berhasil terbaca!");
      onScanSuccess(result);
    } catch (err: unknown) {
      console.error("QR scan from file failed:", err);
      setUploadStatus("error");
      setUploadMsg("QR Code tidak terdeteksi. Coba foto yang lebih jelas / pencahayaan lebih baik.");
    } finally {
      try { await qrInstance?.clear(); } catch (_) {}
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- Manual Tab ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 transition-colors">

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {(["camera", "upload"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
              activeTab === tab
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab === "camera" ? "Kamera Langsung" : "Upload Foto QR"}
          </button>
        ))}
      </div>

      {/* Camera Tab */}
      {activeTab === "camera" && (
        <div className="p-4 space-y-3">
          {/* Viewport — html5-qrcode mounts the <video> inside this div */}
          <div
            id="qr-camera-viewport"
            className="w-full rounded-xl overflow-hidden bg-slate-950"
            style={{ minHeight: 280 }}
          />

          {cameraError ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-center space-y-2">
              <p className="text-xs font-bold text-rose-700 dark:text-rose-300">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              Arahkan kamera ke QR Code pada layar pasien. Pastikan QR berada di dalam kotak dan pencahayaan cukup.
            </p>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="p-4 space-y-4">
          {/* Hidden worker div for scanFile — must be in DOM */}
          <div id="qr-upload-worker" style={{ display: "none" }} />

          <label
            htmlFor="qr-file-upload"
            className={`flex flex-col items-center justify-center w-full h-44 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              uploadStatus === "loading"
                ? "border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
                : uploadStatus === "error"
                ? "border-rose-300 bg-rose-50/50 dark:bg-rose-950/20"
                : uploadStatus === "success"
                ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-950 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30"
            }`}
          >
            {uploadStatus === "loading" && (
              <>
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{uploadMsg}</p>
              </>
            )}
            {uploadStatus === "success" && (
              <>
                <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{uploadMsg}</p>
              </>
            )}
            {uploadStatus === "error" && (
              <>
                <svg className="w-8 h-8 text-rose-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-bold text-rose-500 dark:text-rose-400 text-center px-4">{uploadMsg}</p>
                <button
                  type="button"
                  onClick={() => { setUploadStatus("idle"); setUploadMsg(""); }}
                  className="mt-2 text-[11px] text-slate-400 underline"
                >
                  Coba lagi
                </button>
              </>
            )}
            {uploadStatus === "idle" && (
              <>
                <svg className="w-9 h-9 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ketuk untuk pilih foto</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, WEBP — Foto screenshot QR pasien</p>
              </>
            )}
          </label>
          <input
            id="qr-file-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            Upload screenshot atau foto QR Code dari layar HP pasien.
          </p>
        </div>
      )}

      {/* Manual Fallback — always visible below tabs */}
      <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleManualSubmit} className="flex gap-2 items-center">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Atau paste payload / ID QR manual..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm shrink-0"
          >
            Pakai
          </button>
        </form>
      </div>

    </div>
  );
}
