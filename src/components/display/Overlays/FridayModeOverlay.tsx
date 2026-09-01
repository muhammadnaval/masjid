import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Compass, PhoneOff, MessageSquareOff, UserCheck, User, VolumeX } from 'lucide-react';

export const FridayModeOverlay: React.FC = () => {
  const { setSimulatorMode, profile } = useApp();

  const khatib = 'Ustadz Dr. H. Ahmad Fauzi, M.A.';
  const imam = 'Ustadz Muhammad Ridwan';
  const title = "Khutbah & Shalat Jum'at";

  const [secondsLeft, setSecondsLeft] = useState(35 * 60); // 35 mins

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSimulatorMode('normal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setSimulatorMode]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-between p-8 text-center">
      {/* Header Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl border-b border-emerald-500/30 pb-4">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-emerald-400" />
          <span className="text-sm uppercase tracking-widest text-emerald-400 font-bold">Mode Shalat & Khutbah Jum'at</span>
        </div>

        <button
          onClick={() => setSimulatorMode('normal')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs shadow transition"
        >
          Kembali Ke Display Normal →
        </button>
      </div>

      {/* Main Body */}
      <div className="my-auto max-w-3xl flex flex-col items-center">
        <span className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-emerald-300 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
          <VolumeX className="w-4 h-4 text-emerald-400" />
          {title.toUpperCase()} BERLANGSUNG
        </span>

        <h1 className="text-4xl lg:text-6xl font-black font-display text-white mb-2">
          SELAMAT MENUNAIKAN SHALAT JUM'AT
        </h1>

        {/* Khatib & Imam Info Box */}
        <div className="flex flex-wrap items-center justify-center gap-6 my-4 bg-slate-900/80 border border-amber-500/30 px-6 py-3 rounded-2xl">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Khatib:</span>
            <span className="font-bold text-amber-300">{khatib}</span>
          </div>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Imam:</span>
            <span className="font-bold text-emerald-300">{imam}</span>
          </div>
        </div>

        <p className="text-3xl lg:text-5xl font-arabic text-amber-200 my-3 dir-rtl">
          إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ
        </p>

        {/* Timer countdown badge */}
        <div className="mt-2 text-xs font-mono text-slate-400">
          Sisa Durasi Khutbah: <span className="font-bold text-emerald-400">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
        </div>

        {/* Khutbah Etiquette Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
          <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center text-center">
            <PhoneOff className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Matikan HP</h4>
            <p className="text-xs text-slate-400 mt-1">Nonaktifkan seluruh suara & getar HP.</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center text-center">
            <MessageSquareOff className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Diam & Simak Khutbah</h4>
            <p className="text-xs text-slate-400 mt-1">Dilarang berbicara saat khatib berkhutbah.</p>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl flex flex-col items-center text-center">
            <UserCheck className="w-8 h-8 text-cyan-400 mb-2" />
            <h4 className="text-sm font-bold text-white">Rapatkan Shaf</h4>
            <p className="text-xs text-slate-400 mt-1">Mengisi shaf depan yang masih kosong.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl border-t border-slate-800 pt-4 text-xs text-slate-400">
        {profile.name} — Semoga ibadah Jum'at kita diterima Allah SWT.
      </div>
    </div>
  );
};
