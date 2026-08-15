"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Home, ShieldOff, Wifi } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/20 dark:bg-violet-600/20 rounded-full blur-3xl"
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2.5 mb-16"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/30">
            <img src="/aksamedika.svg" alt="Aksamedika" className="w-full h-full object-contain invert brightness-0" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
            Aksa<span className="text-blue-600 dark:text-blue-400">medika</span>
          </span>
        </motion.div>

        {/* Central icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex justify-center"
        >
          <div className="relative">
            {/* Pulsing ring */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-blue-500/20"
            />
            <div className="w-24 h-24 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl">
              <ShieldOff className="w-10 h-10 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <p
            className="text-[120px] font-black leading-none tracking-tighter select-none"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </p>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto text-sm">
            Akses ke halaman ini tidak tersedia — mungkin sudah dipindahkan, atau membutuhkan izin khusus untuk masuk.
          </p>
        </motion.div>

        {/* Divider with icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          className="flex items-center gap-3 justify-center mb-10"
        >
          <div className="h-px w-16 bg-slate-200 dark:bg-white/10" />
          <Wifi className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
          <div className="h-px w-16 bg-slate-200 dark:bg-white/10" />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 dark:hover:text-white font-semibold rounded-xl border border-slate-200 dark:border-white/10 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Halaman Sebelumnya
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 dark:text-slate-600 text-xs font-medium mt-14 tracking-wide"
        >
          Error 404 · Aksamedika Zero-Trust Security Platform
        </motion.p>
      </div>
    </div>
  );
}
