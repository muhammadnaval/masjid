import React, { useEffect, useState, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { AlignJustify, PhoneOff, Users, Heart, BookOpen, ArrowRight } from 'lucide-react';
import { PrayerName } from '../../../types';

const PRAYER_LABELS: Record<string, string> = {
  subuh:   'Subuh',
  dzuhur:  'Dzuhur',
  ashar:   'Ashar',
  maghrib: 'Maghrib',
  isya:    'Isya',
};

// Color scheme per prayer
const PRAYER_COLORS: Record<string, { ring: string; glow: string; badge: string; bg: string }> = {
  subuh:   { ring: '#818cf8', glow: 'rgba(129,140,248,0.3)', badge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300',  bg: 'from-indigo-950/80' },
  dzuhur:  { ring: '#34d399', glow: 'rgba(52,211,153,0.3)',  badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300', bg: 'from-emerald-950/80' },
  ashar:   { ring: '#facc15', glow: 'rgba(250,204,21,0.3)',  badge: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300',   bg: 'from-yellow-950/80' },
  maghrib: { ring: '#fb923c', glow: 'rgba(251,146,60,0.3)',  badge: 'bg-orange-500/20 border-orange-400/40 text-orange-300',   bg: 'from-orange-950/80' },
  isya:    { ring: '#a78bfa', glow: 'rgba(167,139,250,0.3)', badge: 'bg-violet-500/20 border-violet-400/40 text-violet-300',   bg: 'from-violet-950/80' },
};

// Reminder cards shown during countdown
const REMINDERS = [
  { icon: AlignJustify, title: 'Luruskan & Rapatkan Shaf',        desc: 'Kesempurnaan shaf merupakan bagian dari kesempurnaan shalat berjamaah.' },
  { icon: PhoneOff,     title: 'Matikan Nada Dering HP',           desc: 'Mohon menonaktifkan HP demi kekhusyu\'an bersama di dalam masjid.' },
  { icon: Users,        title: 'Ajak Keluarga & Tetangga',         desc: 'Beritahu mereka yang belum hadir untuk segera menuju masjid.' },
  { icon: Heart,        title: 'Niatkan Ikhlas Karena Allah',      desc: 'Hadirkan hati dan luruskan niat semata-mata karena Allah SWT.' },
  { icon: BookOpen,     title: 'Baca Doa Menunggu Iqamah',         desc: 'Gunakan waktu ini untuk berzikir, membaca Al-Qur\'an, atau berdoa.' },
];

// Shown when countdown reaches 0
const COMPLETION_MESSAGES: Record<string, string> = {
  subuh:   'Subhanallah! Iqamah Subuh telah berkumandang. Tegakkanlah shalat dengan khusyu\'.',
  dzuhur:  'Alhamdulillah! Saatnya menunaikan Shalat Dzuhur berjamaah. Rapatkan shaf!',
  ashar:   'Allahu Akbar! Shalat Ashar — shalat wustha yang ditekankan. Mari berjamaah!',
  maghrib: 'Alhamdulillah! Waktu Maghrib tiba. Segera berdiri dan tegakkan shalat.',
  isya:    'Bismillah! Tutuplah hari dengan Shalat Isya berjamaah. Semoga diterima.',
};

export const IqamahOverlay: React.FC = () => {
  const { simulator, setSimulatorMode, setIqamahSeconds, iqamah, profile } = useApp();

  const prayerName = (simulator.activePrayerForMode || 'subuh') as PrayerName;
  const prayerLabel = PRAYER_LABELS[prayerName] ?? prayerName;
  const colors = PRAYER_COLORS[prayerName] ?? PRAYER_COLORS.dzuhur;

  // Determine total duration from iqamah settings
  const iqamahSetting  = iqamah[prayerName as keyof typeof iqamah];
  const totalMinutes   = (iqamahSetting as any)?.durationMinutes ?? 7;
  const totalOrigSecs  = totalMinutes * 60;

  // "Done" state
  const [isDone, setIsDone] = useState(false);
  const prevMode = useRef(simulator.currentMode);

  // Rotating reminder index — cycles every 30 seconds
  const [reminderIndex, setReminderIndex] = useState(0);

  // Reset done state & reminder whenever mode re-enters iqamah
  useEffect(() => {
    if (prevMode.current !== 'iqamah' && simulator.currentMode === 'iqamah') {
      setIsDone(false);
      setReminderIndex(0);
    }
    prevMode.current = simulator.currentMode;
  }, [simulator.currentMode]);

  // Reminder rotation — advance every 30 seconds
  useEffect(() => {
    if (isDone) return;
    const rotator = setInterval(() => {
      setReminderIndex(prev => (prev + 1) % REMINDERS.length);
    }, 30000);
    return () => clearInterval(rotator);
  }, [isDone]);

  // Countdown tick
  useEffect(() => {
    if (isDone) return;

    const timer = setInterval(() => {
      setIqamahSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDone]);

  // Auto-return to normal after 10 s post-completion
  useEffect(() => {
    if (!isDone) return;
    const timeout = setTimeout(() => {
      setSimulatorMode('normal');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isDone]);

  const totalSecs = simulator.iqamahRemainingSeconds;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const progressPct = totalOrigSecs > 0 ? Math.max(0, Math.min(1, totalSecs / totalOrigSecs)) : 0;

  // SVG ring
  const radius       = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDash   = circumference * (1 - progressPct);

  const currentReminder = REMINDERS[reminderIndex];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between select-none overflow-hidden`}
      style={{ background: `linear-gradient(135deg, #020617 0%, #0f172a 50%, #080f1a 100%)` }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-10"
             style={{ background: `radial-gradient(circle, ${colors.ring}, transparent)` }} />
      </div>

      {/* ─── Top Header ──────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between w-full px-8 pt-6">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${colors.badge}`}>
            Countdown Iqamah — {prayerLabel}
          </span>
        </div>

        <span className="text-sm font-semibold text-slate-400 tracking-wide">{profile.name}</span>

        <button
          onClick={() => setSimulatorMode('normal')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition"
        >
          Kembali Normal
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-8 px-8 text-center">

        {isDone ? (
          /* ─ Completion Screen ─────────────────────────────── */
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="text-6xl lg:text-8xl">🕌</div>
            <h1 className="text-4xl lg:text-6xl font-black text-white tracking-wide">
              IQAMAH!
            </h1>
            <p className="text-xl lg:text-2xl text-amber-200 font-arabic leading-relaxed">
              قَدْ قَامَتِ الصَّلَاةُ
            </p>
            <p className="text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed">
              {COMPLETION_MESSAGES[prayerName] ?? 'Shalat telah ditegakkan. Semoga diterima Allah SWT.'}
            </p>
            <div className="text-xs text-slate-500 animate-pulse">
              Kembali ke tampilan utama dalam beberapa detik…
            </div>
          </div>

        ) : (
          /* ─ Active Countdown ──────────────────────────────── */
          <>
            {/* Large progress ring + countdown */}
            <div className="relative w-64 h-64 lg:w-80 lg:h-80 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r={radius} fill="none"
                        stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                {/* Secondary glow ring */}
                <circle cx="50" cy="50" r={radius} fill="none"
                        stroke={colors.ring} strokeWidth="1.5" opacity="0.2"
                        strokeDasharray={circumference} />
                {/* Progress */}
                <circle cx="50" cy="50" r={radius} fill="none"
                        stroke={colors.ring} strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDash}
                        style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${colors.glow})` }} />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-1">Menuju Iqamah</span>
                <div
                  className="text-5xl lg:text-7xl font-black font-mono tracking-tight text-white"
                  style={{ textShadow: `0 0 40px ${colors.glow}` }}
                >
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <span className="text-xs font-semibold mt-2" style={{ color: colors.ring }}>
                  Menit : Detik
                </span>
              </div>
            </div>

            {/* Progress bar text */}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(1 - progressPct) * 100}%`, backgroundColor: colors.ring }}
                />
              </div>
              <span>{Math.round((1 - progressPct) * 100)}% selesai</span>
            </div>

            {/* Rotating reminder card */}
            <div className="max-w-xl w-full">
              {/* Card body */}
              <div
                key={reminderIndex}
                className="p-4 bg-slate-900/80 border border-slate-700/50 rounded-2xl flex items-start gap-4 text-left"
                style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
              >
                <div className="p-2.5 bg-slate-800 rounded-xl flex-shrink-0">
                  <currentReminder.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{currentReminder.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{currentReminder.desc}</p>
                </div>
              </div>

              {/* Navigation: dots + arrows */}
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  onClick={() => setReminderIndex(prev => (prev - 1 + REMINDERS.length) % REMINDERS.length)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                >
                  ‹
                </button>

                {/* Dot indicators */}
                <div className="flex items-center gap-1.5">
                  {REMINDERS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setReminderIndex(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === reminderIndex
                          ? 'w-4 h-2 bg-amber-400'
                          : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setReminderIndex(prev => (prev + 1) % REMINDERS.length)}
                  className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                >
                  ›
                </button>
              </div>

              <p className="text-center text-[10px] text-slate-700 mt-1">
                {reminderIndex + 1} / {REMINDERS.length} • Berganti otomatis setiap 30 detik
              </p>
            </div>
          </>
        )}
      </div>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-8 pb-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-600">
        <span>{profile.address}</span>
        <span>
          {isDone
            ? 'Shalat telah ditegakkan • قَدْ قَامَتِ الصَّلَاةُ'
            : `Iqamah akan berkumandang saat timer mencapai 00:00 • Durasi: ${totalMinutes} menit`
          }
        </span>
      </div>
    </div>
  );
};
