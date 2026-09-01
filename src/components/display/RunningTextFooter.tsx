import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell } from 'lucide-react';

export const RunningTextFooter: React.FC = () => {
  const { runningTexts } = useApp();
  const activeTexts = runningTexts.filter(t => t.isActive);

  if (activeTexts.length === 0) return null;

  // Determine marquee speed duration (seconds) based on active items
  const hasSlow = activeTexts.some(t => t.speed === 'slow');
  const hasFast = activeTexts.some(t => t.speed === 'fast');

  let speedSeconds = 30; // Normal default
  if (hasSlow && !hasFast) {
    speedSeconds = 60; // Lambat
  } else if (hasFast && !hasSlow) {
    speedSeconds = 15; // Cepat
  }

  return (
    <div className="w-full bg-slate-900 border-t border-emerald-500/30 px-4 py-2 lg:py-2.5 flex items-center shadow-2xl relative z-20 overflow-hidden shrink-0">
      {/* Left Badge Label */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow-md shrink-0 mr-4 z-10">
        <Bell className="w-4 h-4 animate-bounce" />
        <span>Pengumuman</span>
      </div>

      {/* Running Marquee Container */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="animate-marquee font-medium text-sm lg:text-base text-slate-100 flex items-center gap-6"
          style={{ animationDuration: `${speedSeconds}s` }}
        >
          {activeTexts.map((item, idx) => (
            <span key={item.id} className="inline-flex items-center gap-3">
              {item.category === 'himbauan' && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold">
                  Himbauan
                </span>
              )}
              {item.category === 'kajian' && (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-xs font-semibold">
                  Agenda Kajian
                </span>
              )}
              {item.category === 'donasi' && (
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold">
                  Donasi
                </span>
              )}

              <span>{item.text}</span>
              {idx < activeTexts.length - 1 && <span className="text-amber-400 font-bold mx-2">✦</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
