import React, { useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Sun, AlertTriangle, Clock } from 'lucide-react';

export const SyuruqOverlay: React.FC = () => {
  const { setSimulatorMode, getAdjustedSchedule, syuruqSetting } = useApp();
  const adjustedSchedule = getAdjustedSchedule();
  
  const totalSeconds = (syuruqSetting?.durationMinutes || 10) * 60;
  const [remainingSeconds, setRemainingSeconds] = useState<number>(totalSeconds);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      setSimulatorMode('normal');
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSimulatorMode('normal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, setSimulatorMode]);

  const formatCountdown = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-between p-8 text-center animate-fade-in">
      <div className="flex items-center justify-between w-full max-w-5xl border-b border-amber-500/30 pb-4">
        <div className="flex items-center gap-3">
          <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />
          <span className="text-sm lg:text-base uppercase tracking-widest text-amber-400 font-bold">
            Pengingat Waktu Syuruq (Terbit Matahari)
          </span>
        </div>

        <button
          onClick={() => setSimulatorMode('normal')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs shadow transition border border-slate-700"
        >
          Tutup Layar →
        </button>
      </div>

      <div className="my-auto max-w-3xl flex flex-col items-center">
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 mb-6 animate-pulse">
          <Sun className="w-20 h-20" />
        </div>

        <h2 className="text-4xl lg:text-6xl font-black font-display text-white mb-3 tracking-wide">
          MEMASUKI WAKTU SYURUQ ({adjustedSchedule.syuruq})
        </h2>

        {/* Countdown Timer Badge */}
        <div className="flex items-center gap-2 px-5 py-2 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 font-bold text-base mb-6 shadow-lg shadow-amber-950/50">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Layar Berakhir Dalam: {formatCountdown(remainingSeconds)}</span>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-300 font-bold text-sm lg:text-base mb-6">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>DILARANG MENUNAIKAN SHALAT PADA SAAT TERBIT MATAHARI</span>
        </div>

        <p className="text-sm lg:text-base text-slate-300 leading-relaxed font-medium bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          Diriwayatkan dari Uqbah bin Amir r.a: "Ada tiga waktu di mana Rasulullah ﷺ melarang kami shalat atau menguburkan jenazah: saat matahari terbit sampai meninggi, saat matahari tepat di tengah langit, dan saat matahari hampir terbenam." (HR. Muslim)
        </p>
      </div>

      <div className="w-full max-w-5xl border-t border-slate-800 pt-4 text-xs lg:text-sm text-slate-400 font-medium">
        Tunggu 15-20 menit setelah Syuruq untuk menunaikan Shalat Dhuha (Waktu Isyraq).
      </div>
    </div>
  );
};

export const SyuruqReminderScreen = SyuruqOverlay;
