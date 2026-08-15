"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, ArrowLeft, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2.5 mb-12"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm p-1">
            <img
              src="/aksamedika.svg"
              alt="Aksamedika"
              className="w-full h-full object-contain invert brightness-0"
            />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">
            Aksa<span className="text-blue-600">medika</span>
          </span>
        </motion.div>

        {/* 404 Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          {/* Lock icon in a card, representing a forbidden/missing page */}
          <div className="w-32 h-32 bg-white rounded-3xl shadow-lg border border-slate-200 flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 to-slate-50" />
            <Shield className="w-16 h-16 text-slate-200 relative z-10" />
            <div className="absolute top-3 right-3 w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center">
              <Search className="w-3 h-3 text-rose-500" />
            </div>
          </div>

          {/* 404 Number */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-8xl font-black text-slate-100 tracking-tight select-none leading-none">4</span>
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-3xl font-black text-white">0</span>
            </div>
            <span className="text-8xl font-black text-slate-100 tracking-tight select-none leading-none">4</span>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
            Sepertinya halaman yang Anda cari tidak ada, sudah dipindahkan, atau membutuhkan izin akses khusus.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Halaman Sebelumnya
          </button>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-xs text-slate-400 font-medium mt-10"
        >
          Kode Error: 404 · Aksamedika Zero-Trust Platform
        </motion.p>
      </div>
    </div>
  );
}
