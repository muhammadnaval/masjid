import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Sunset, Moon, Sunrise, Compass } from 'lucide-react';
import { PrayerName } from '../../types';

export const PrayerScheduleCards: React.FC = () => {
  const { getAdjustedSchedule, getNextPrayer, simulator } = useApp();
  const schedule = getAdjustedSchedule();
  const nextPrayer = getNextPrayer();

  const isFriday = simulator.isFriday || new Date().getDay() === 5;

  const items: { key: PrayerName; label: string; time: string; icon: React.ReactNode }[] = [
    { key: 'subuh', label: 'Subuh', time: schedule.subuh, icon: <Sunrise className="w-5 h-5" /> },
    { key: 'syuruq', label: 'Syuruq', time: schedule.syuruq, icon: <Sun className="w-5 h-5" /> },
    { key: 'dzuhur', label: isFriday ? 'Jum\'at' : 'Dzuhur', time: schedule.dzuhur, icon: <Compass className="w-5 h-5" /> },
    { key: 'ashar', label: 'Ashar', time: schedule.ashar, icon: <Sun className="w-5 h-5" /> },
    { key: 'maghrib', label: 'Maghrib', time: schedule.maghrib, icon: <Sunset className="w-5 h-5" /> },
    { key: 'isya', label: 'Isya', time: schedule.isya, icon: <Moon className="w-5 h-5" /> },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 lg:gap-4 w-full shrink-0">
      {items.map((item) => {
        const isNext = nextPrayer.name === item.key;
        return (
          <div
            key={item.key}
            className={`relative rounded-2xl p-2.5 md:p-3 lg:p-4 flex flex-col items-center justify-between text-center transition-all duration-500 overflow-hidden shadow-lg ${
              isNext
                ? 'bg-gradient-to-b from-emerald-600 via-emerald-800 to-slate-900 border-2 border-amber-400 scale-105 shadow-emerald-900/50 z-10'
                : 'bg-slate-900/80 border border-slate-800 backdrop-blur-md hover:border-slate-700'
            }`}
          >
            {isNext && (
              <div className="absolute top-0 right-0 left-0 bg-amber-400 text-slate-950 font-black text-[9px] lg:text-[10px] uppercase tracking-widest py-0.5 shadow">
                Berikutnya
              </div>
            )}

            <div className={`p-1.5 lg:p-2.5 rounded-xl mt-1 ${isNext ? 'bg-amber-400 text-slate-950' : 'bg-slate-800/80 text-emerald-400'}`}>
              {item.icon}
            </div>

            <span className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider mt-1 ${isNext ? 'text-emerald-100' : 'text-slate-400'}`}>
              {item.label}
            </span>

            <span className={`text-lg md:text-xl lg:text-3xl font-black font-display tracking-tight mt-0.5 ${isNext ? 'text-white drop-shadow-md' : 'text-slate-100'}`}>
              {item.time}
            </span>
          </div>
        );
      })}
    </div>
  );
};
