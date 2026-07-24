"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Shield, Lock, Eye, Activity, ArrowRight, CheckCircle2,
  Zap, Database, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm p-1">
              <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">
              Aksa<span className="text-blue-600">medika</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-slate-600 text-sm font-medium">
            <a href="#tentang" className="hover:text-blue-600 transition-colors duration-200">Tentang</a>
            <a href="#cara-kerja" className="hover:text-blue-600 transition-colors duration-200">Cara Kerja</a>
            <a href="#fitur" className="hover:text-blue-600 transition-colors duration-200">Fitur</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login?role=doctor">
              <Button variant="ghost" size="sm" className="text-slate-700 hover:text-blue-700 hover:bg-blue-50 font-semibold">
                Portal Dokter
              </Button>
            </Link>
            <Link href="/auth/login?role=patient">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-md shadow-blue-500/20 rounded-lg">
                Masuk sebagai Pasien
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3">
            <Link href="/auth/login?role=patient" className="block w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">Masuk sebagai Pasien</Button>
            </Link>
            <Link href="/auth/login?role=doctor" className="block w-full">
              <Button variant="outline" className="w-full font-semibold">Portal Dokter</Button>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 bg-gradient-to-b from-blue-50/70 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-6">
                  🏥 Healthcare in Society 5.0
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                Data kesehatan Anda,{" "}
                <span className="text-blue-600 relative">
                  kendali Anda.
                  <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-blue-200 rounded-full" />
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                Aksamedika mengembalikan kedaulatan data kepada pasien. Dokter hanya bisa mengakses rekam medis Anda dengan token waktu terbatas yang Anda buat sendiri.
              </motion.p>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link href="/auth/register?role=patient">
                  <Button size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 text-base rounded-xl shadow-lg shadow-blue-500/25 group w-full sm:w-auto">
                    Daftar Gratis
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/auth/login?role=doctor">
                  <Button size="lg" variant="outline"
                    className="border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-semibold px-8 h-12 text-base rounded-xl w-full sm:w-auto">
                    Portal Dokter →
                  </Button>
                </Link>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="flex flex-wrap gap-5">
                {[
                  "Zero-Trust Security",
                  "Token 30 Menit",
                  "Audit Log Permanen",
                  "Data Milik Pasien",
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    {b}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Illustration */}
            <motion.div variants={fadeIn} initial="hidden" animate="visible"
              className="relative flex justify-center items-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-emerald-100/30 rounded-3xl blur-2xl" />
              <div className="relative w-full aspect-square max-w-lg">
                <Image
                  src="/hero-illustration.png"
                  alt="Doctor and patient healthcare illustration"
                  fill
                  className="object-contain drop-shadow-xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-blue-600 py-8 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "100%", label: "Data Terenkripsi" },
            { value: "30 Mnt", label: "Batas Akses Token" },
            { value: "0", label: "Pelanggaran Data" },
            { value: "∞", label: "Audit Log Tersimpan" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-blue-100 text-sm font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PROBLEM (Alternating) ===== */}
      <section id="tentang" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-3">Masalah yang Ada</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Rekam medis tradisional <br className="hidden sm:block"/>memiliki celah berbahaya.
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Sistem yang berpusat pada rumah sakit membuat pasien tidak punya kendali atas data sensitif mereka.
            </p>
          </motion.div>

          <div className="space-y-16">
            {[
              {
                icon: Eye,
                title: "Tidak Ada Privasi",
                desc: "Anda tidak pernah tahu siapa yang mengakses data kesehatan sensitif Anda, kapan, atau dengan tujuan apa. Rekam medis Anda bisa dibaca oleh staf yang tidak Anda kenal.",
                color: "bg-rose-50",
                iconColor: "text-rose-500",
                iconBg: "bg-rose-100",
                reverse: false,
              },
              {
                icon: Database,
                title: "Data Tersebar di Mana-mana",
                desc: "Riwayat kesehatan Anda tersimpan di berbagai klinik dan rumah sakit berbeda. Tidak ada pandangan terpadu yang bisa Anda akses sebagai pasien.",
                color: "bg-amber-50",
                iconColor: "text-amber-600",
                iconBg: "bg-amber-100",
                reverse: true,
              },
              {
                icon: Lock,
                title: "Rentan Terhadap Kebocoran",
                desc: "EMR yang terpusat di satu server rumah sakit menjadi target menarik bagi peretas. Satu pelanggaran bisa mengekspos data jutaan pasien.",
                color: "bg-violet-50",
                iconColor: "text-violet-600",
                iconBg: "bg-violet-100",
                reverse: false,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className={`flex flex-col ${item.reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-10 items-center`}
              >
                <div className={`flex-1 ${item.color} rounded-3xl p-12 flex items-center justify-center min-h-[200px]`}>
                  <div className={`w-24 h-24 ${item.iconBg} rounded-3xl flex items-center justify-center shadow-sm`}>
                    <item.icon className={`w-12 h-12 ${item.iconColor}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Masalah {i + 1}</span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-4">{item.title}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTION FEATURES ===== */}
      <section id="fitur" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-3">Solusi Aksamedika</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              Arsitektur yang berpusat pada pasien.
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Sistem zero-trust di mana persetujuan Anda adalah kunci dari setiap interaksi.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Zero-Trust Security",
                desc: "Setiap akses membutuhkan persetujuan eksplisit dari pasien. Dokter tidak bisa melihat rekam medis tanpa izin aktif Anda.",
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                accent: "border-t-4 border-blue-500",
              },
              {
                icon: Zap,
                title: "Token Akses 30 Menit",
                desc: "Buat PIN 6-digit + QR Code yang otomatis kedaluwarsa. Tidak ada akses permanen yang diberikan kepada siapapun.",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                accent: "border-t-4 border-emerald-500",
              },
              {
                icon: Activity,
                title: "Audit Trail Lengkap",
                desc: "Setiap akses dokter dicatat secara permanen. Anda bisa melihat siapa, kapan, dan melalui metode apa data Anda diakses.",
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
                accent: "border-t-4 border-violet-500",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 card-hover ${f.accent}`}
              >
                <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-slate-900 font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="cara-kerja" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-3">Cara Kerja</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Mudah. Aman. 3 Langkah.</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                step: "01",
                actor: "Pasien",
                actorColor: "bg-blue-100 text-blue-700",
                title: "Buat Token Akses",
                desc: "Buka Aksamedika → ketuk 'Buat Akses' → dapatkan PIN 6-digit + QR Code yang valid tepat 30 menit.",
              },
              {
                step: "02",
                actor: "Dokter",
                actorColor: "bg-emerald-100 text-emerald-700",
                title: "Masukkan PIN untuk Akses Rekam Medis",
                desc: "Dokter mengetik PIN di portal mereka. Backend memvalidasi token, mencatat event akses, dan menampilkan rekam medis lengkap.",
              },
              {
                step: "03",
                actor: "Pasien",
                actorColor: "bg-violet-100 text-violet-700",
                title: "Pantau Siapa yang Mengakses Data Anda",
                desc: "Dashboard Anda menampilkan audit trail permanen: dokter mana, jam berapa, dan melalui metode apa. Transparansi penuh, selalu.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex flex-col sm:flex-row gap-6 bg-white border border-slate-200 rounded-2xl p-7 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="text-5xl font-black text-slate-100 shrink-0 select-none sm:w-16">{step.step}</div>
                <div className="flex-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${step.actorColor}`}>{step.actor}</span>
                  <h3 className="text-slate-900 font-bold text-xl mt-3 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 px-6 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)`,
          }}
        />
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Siap mengendalikan data kesehatan Anda?
          </h2>
          <p className="text-blue-100 mb-8 text-lg leading-relaxed">
            Bergabung dengan Aksamedika dan rasakan layanan kesehatan yang benar-benar berpusat pada Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=patient">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-10 h-12 text-base rounded-xl shadow-xl w-full sm:w-auto">
                Buat Akun Pasien
              </Button>
            </Link>
            <Link href="/auth/register?role=doctor">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-blue-700 font-semibold px-10 h-12 text-base rounded-xl w-full sm:w-auto">
                Daftar sebagai Dokter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center p-1">
                <img src="/aksamedika.svg" alt="Logo" className="w-full h-full object-contain invert brightness-0" />
              </div>
              <span className="text-white font-bold text-lg">Aksamedika</span>
            </div>
            <div className="flex gap-8 text-slate-400 text-sm font-medium">
              <a href="#tentang" className="hover:text-white transition-colors">Tentang</a>
              <a href="#cara-kerja" className="hover:text-white transition-colors">Cara Kerja</a>
              <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm text-center md:text-left">
              © 2025 Aksamedika. Dibangun untuk Hackathon Healthcare in Society 5.0.
            </p>
            <p className="text-slate-600 text-xs">Zero-Trust Architecture · Pasien Pertama</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
