"use client";

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
}

export default function QRScanner({ onScanSuccess, onScanFailure }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
          }
          onScanSuccess(decodedText);
        },
        onScanFailure || (() => {})
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess, onScanFailure]);

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
      <div id="qr-reader" className="w-full mx-auto overflow-hidden rounded-xl border-0" />
      
      {/* Friendly Camera Permission Helper Banner */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl text-center">
        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
          💡 Tips Scanner Kamera
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
          Posisikan QR Code di dalam kotak di atas. Jika kamera tidak aktif, pastikan Anda telah menekan tombol <strong className="text-slate-800 dark:text-slate-200">"Allow" / "Izinkan"</strong> pada pop-up izin browser.
        </p>
      </div>

      <style jsx global>{`
        #qr-reader { border: none !important; }
        #qr-reader img { display: none !important; }
        #qr-reader__dashboard_section_csr span { display: none !important; }
        #qr-reader__dashboard_section_swaplink { display: none !important; }
        #qr-reader__status_span { font-size: 12px !important; font-weight: 600 !important; color: #475569 !important; }
      `}</style>
    </div>
  );
}
