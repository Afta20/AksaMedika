"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export default function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true
        },
        false
      );
      
      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
          }
          onScanSuccess(decodedText);
        },
        (error) => {
          // Ignore routine frame-reading warnings when QR is not in view
          if (typeof error === 'string' && (
            error.includes("No MultiFormat Readers") ||
            error.includes("NotFoundException") ||
            error.includes("No QR code found")
          )) {
            return;
          }
          if (onScanFailure) {
            onScanFailure(error);
          }
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [onScanSuccess, onScanFailure]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
    onScanSuccess(manualCode.trim());
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
      <div id="qr-reader" className="w-full mx-auto overflow-hidden rounded-xl border-0" />
      
      {/* Friendly Camera Permission Helper Banner */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-center">
        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
          💡 Tips Scanner Kamera
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
          Posisikan QR Code di dalam kotak. Jika kamera tidak aktif, pastikan Anda menekan <strong className="text-slate-800 dark:text-slate-200">"Allow / Izinkan"</strong> pada browser.
        </p>
      </div>

      {/* Manual Input Fallback */}
      <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 text-center">
          Atau Masukkan Kode / Payload QR Manual:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste / ketik payload QR..."
            className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            Gunakan
          </button>
        </div>
      </form>

      <style jsx global>{`
        #qr-reader { border: none !important; }
        #qr-reader img { display: none !important; }
        #qr-reader__dashboard_section_csr span { display: none !important; }
        #qr-reader__dashboard_section_swaplink { display: none !important; }
        #qr-reader__status_span { display: none !important; }
      `}</style>
    </div>
  );
}
