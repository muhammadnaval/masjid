import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, MapPin, Phone, Moon } from 'lucide-react';
import { formatDates } from '../../utils/hijri';

export const HeaderSection: React.FC = () => {
  const { profile, location, simulator } = useApp();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateInfo = formatDates(currentDate, profile.hijriCorrection || 0);

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 py-2.5 lg:py-3.5 flex items-center justify-between shadow-2xl relative z-10 shrink-0">
      {/* Left: Logo & Mosque Details */}
      <div className="flex items-center gap-3 lg:gap-5 min-w-0 flex-1">
        <div className="relative group shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
          <img
            src={profile.logoPath}
            alt={profile.name}
            className="relative w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 object-cover rounded-xl border border-emerald-500/30 shadow-md"
            onError={(e) => {
              // Fallback SVG icon if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <div className="min-w-0">
          <h1 className="text-lg md:text-xl lg:text-3xl font-black font-display tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 truncate">
            {profile.name}
          </h1>
          <div className="flex items-center gap-3 text-xs lg:text-sm text-slate-300 mt-0.5 min-w-0">
            <span className="flex items-center gap-1.5 font-medium truncate max-w-[280px] sm:max-w-md lg:max-w-2xl">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{profile.address}</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 text-slate-400 shrink-0">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{location.cityName}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Gregorian & Hijri Dates + Location Badge */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        <div className="text-right shrink-0">
          <div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm lg:text-base font-semibold text-slate-100 whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <span>{dateInfo.formattedMasehi}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs lg:text-sm font-medium text-amber-300 mt-0.5 whitespace-nowrap">
            <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
            <span>{dateInfo.formattedHijri}</span>
          </div>
        </div>

        {simulator.isFriday && (
          <div className="hidden sm:flex flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-700 px-3 py-1.5 rounded-lg border border-emerald-400/40 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">Hari Baik</span>
            <span className="text-xs font-black text-white">JUM'AT BERKAH</span>
          </div>
        )}
      </div>
    </header>
  );
};
