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
    <div className="w-full bg-white p-4 rounded-2xl border border-slate-200">
      <div id="qr-reader" className="w-full mx-auto overflow-hidden rounded-xl" />
      <style jsx global>{`
        #qr-reader { border: none !important; }
        #qr-reader img { display: none !important; }
        #qr-reader__dashboard_section_csr span { display: none !important; }
        #qr-reader__dashboard_section_swaplink { display: none !important; }
      `}</style>
    </div>
  );
}
