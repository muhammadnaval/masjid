import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Hourglass } from 'lucide-react';

export const ClockSection: React.FC = () => {
  const { getNextPrayer } = useApp();
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextPrayer = getNextPrayer();

  const hoursStr = String(time.getHours()).padStart(2, '0');
  const minutesStr = String(time.getMinutes()).padStart(2, '0');
  const secondsStr = String(time.getSeconds()).padStart(2, '0');

  // Format remaining time in HH:MM:SS
  const formatRemaining = (totalSecs: number) => {
    const absSecs = Math.max(0, totalSecs);
    const h = Math.floor(absSecs / 3600);
    const m = Math.floor((absSecs % 3600) / 60);
    const s = absSecs % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 lg:gap-6 bg-slate-900/90 border border-emerald-500/20 p-3.5 md:p-4 lg:p-6 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden shrink-0">
      {/* Background ambient glow */}
      <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Digital Clock Display */}
      <div className="flex items-center gap-3 lg:gap-4">
        <div className="p-2.5 lg:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
          <Clock className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 animate-pulse" />
        </div>

        <div>
          <span className="text-[10px] lg:text-xs uppercase font-bold tracking-widest text-slate-400">Waktu Realtime</span>
          <div className="flex items-baseline gap-1.5 font-display font-black tracking-tight text-slate-100">
            <span className="text-4xl md:text-5xl lg:text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">{hoursStr}</span>
            <span className="text-3xl md:text-4xl lg:text-6xl text-emerald-400 animate-pulse">:</span>
            <span className="text-4xl md:text-5xl lg:text-7xl drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">{minutesStr}</span>
            <span className="text-xl md:text-2xl lg:text-4xl text-amber-400 ml-1.5 font-mono">{secondsStr}</span>
            <span className="text-xs lg:text-sm font-semibold text-slate-400 ml-1">WIB</span>
          </div>
        </div>
      </div>

      {/* Next Prayer Countdown Card */}
      <div className="w-full md:w-auto min-w-[280px] bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 p-4 lg:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl group-hover:bg-amber-400/20 transition duration-500 pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Hourglass className="w-4 h-4 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
            <span>Menuju Shalat Berikutnya</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-black text-white mt-1">
            {nextPrayer.label} <span className="text-amber-300 font-mono text-lg font-bold">({nextPrayer.time})</span>
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hitung Mundur</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-emerald-300">
            {formatRemaining(nextPrayer.remainingSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
