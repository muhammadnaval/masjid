import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../../context/AppContext';
import { Volume2, VolumeX, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { PrayerName } from '../../../types';

// Map prayer keys to display labels in Indonesian
const PRAYER_LABELS: Record<PrayerName, string> = {
  subuh:   'SUBUH',
  syuruq:  'SYURUQ',
  dzuhur:  'DZUHUR',
  ashar:   'ASHAR',
  maghrib: 'MAGHRIB',
  isya:    'ISYA',
};

// Arabic calligraphy for each prayer time call
const PRAYER_ARABIC: Record<PrayerName, string> = {
  subuh:   'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ',
  syuruq:  'حَيَّ عَلَى الصَّلَاةِ',
  dzuhur:  'حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ',
  ashar:   'حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ',
  maghrib: 'حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ',
  isya:    'حَيَّ عَلَى الصَّلَاةِ • حَيَّ عَلَى الْفَلَاحِ',
};

// Adzan messages per prayer
const ADZAN_MESSAGES: Record<PrayerName, string> = {
  subuh:   'Bangunlah dari tidur, shalat lebih baik dari tidur. Mari tunaikan Shalat Subuh berjamaah.',
  syuruq:  'Matahari telah terbit. Perbanyak dzikir dan doa di waktu syuruq yang penuh berkah ini.',
  dzuhur:  'Waktu tengah hari telah tiba. Tinggalkan semua kesibukan, mari menunaikan Shalat Dzuhur.',
  ashar:   'Shalat Ashar adalah shalat wustha yang sangat ditekankan. Jangan sampai terlewat.',
  maghrib: 'Matahari telah terbenam. Segera berwudhu dan tunaikan Shalat Maghrib berjamaah.',
  isya:    'Tutup hari dengan ibadah. Mari tunaikan Shalat Isya berjamaah sebelum istirahat malam.',
};

// Accent colors per prayer
const PRAYER_ACCENTS: Record<PrayerName, { primary: string; glow: string; badge: string }> = {
  subuh:   { primary: 'from-indigo-400 via-blue-300 to-white',  glow: 'shadow-indigo-500/30',  badge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-300' },
  syuruq:  { primary: 'from-amber-400 via-orange-300 to-white', glow: 'shadow-amber-500/30',   badge: 'bg-amber-500/20 border-amber-400/40 text-amber-300' },
  dzuhur:  { primary: 'from-emerald-400 via-teal-300 to-white', glow: 'shadow-emerald-500/30', badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' },
  ashar:   { primary: 'from-yellow-400 via-lime-300 to-white',  glow: 'shadow-yellow-500/30',  badge: 'bg-yellow-500/20 border-yellow-400/40 text-yellow-300' },
  maghrib: { primary: 'from-orange-400 via-rose-300 to-white',  glow: 'shadow-orange-500/30',  badge: 'bg-orange-500/20 border-orange-400/40 text-orange-300' },
  isya:    { primary: 'from-violet-400 via-purple-300 to-white',glow: 'shadow-violet-500/30',  badge: 'bg-violet-500/20 border-violet-400/40 text-violet-300' },
};

export const AdzanOverlay: React.FC = () => {
  const { simulator, setSimulatorMode, audio, profile } = useApp();

  const prayerName: PrayerName = (simulator.activePrayerForMode as PrayerName) || 'subuh';
  const prayerLabel  = PRAYER_LABELS[prayerName];
  const prayerArabic = PRAYER_ARABIC[prayerName];
  const prayerMsg    = ADZAN_MESSAGES[prayerName];
  const accent       = PRAYER_ACCENTS[prayerName];

  // Countdown state: starts from configured adzan duration
  const totalDuration = audio.adzanDurationSeconds ?? 150;
  const [remainingSeconds, setRemainingSeconds] = useState(totalDuration);

  // Audio state
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'playing' | 'paused' | 'blocked' | 'error'>('loading');

  // Determine if this prayer has adzan audio enabled
  const isAdzanEnabledForPrayer = (audio.enabledPrayersForAdzan ?? [
    'subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'
  ]).includes(prayerName);

  // ─── Audio Playback ──────────────────────────────────────────────────────
  const tryPlayAudio = useCallback(async (audioEl: HTMLAudioElement) => {
    try {
      audioEl.volume = (audio.volumeAdzan ?? 80) / 100;
      await audioEl.play();
      setAudioStatus('playing');
    } catch (err: unknown) {
      // Browser autoplay restriction — show interaction prompt
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setAudioStatus('blocked');
      } else {
        setAudioStatus('error');
      }
    }
  }, [audio.volumeAdzan]);

  useEffect(() => {
    if (!isAdzanEnabledForPrayer || simulator.isAudioMuted) {
      setAudioStatus('paused');
      return;
    }

    const audioUrl = audio.adzanAudioUrl || 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3';
    const audioEl  = new Audio(audioUrl);
    audioEl.preload = 'auto';
    audioRef.current = audioEl;

    audioEl.addEventListener('error', () => setAudioStatus('error'));
    audioEl.addEventListener('ended', () => setAudioStatus('paused'));

    setAudioStatus('loading');
    tryPlayAudio(audioEl);

    return () => {
      audioEl.pause();
      audioEl.src = '';
      audioRef.current = null;
    };
  }, [simulator.currentMode, isAdzanEnabledForPrayer, simulator.isAudioMuted]);

  // Update volume in real time if slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = (audio.volumeAdzan ?? 80) / 100;
    }
  }, [audio.volumeAdzan]);

  // ─── Countdown Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    setRemainingSeconds(totalDuration);
  }, [simulator.currentMode, totalDuration]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      // Stop audio before transitioning
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setSimulatorMode('iqamah', prayerName);
      return;
    }

    const timer = setTimeout(() => setRemainingSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remainingSeconds, prayerName]);

  // Format seconds → MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Progress ring radius
  const progressPct = remainingSeconds / totalDuration;
  const radius      = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDash  = circumference * (1 - progressPct);

  // Handle blocked autoplay: user clicks to unblock
  const handleUnblockAudio = async () => {
    if (audioRef.current) {
      await tryPlayAudio(audioRef.current);
    }
  };

  const handleSkipToIqamah = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setSimulatorMode('iqamah', prayerName);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between select-none overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #0d1f12 100%)' }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 animate-pulse"
             style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 animate-pulse"
             style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
      </div>

      {/* ─── Top Header ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between w-full px-8 pt-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-bold">
            Waktu Shalat Telah Tiba
          </span>
        </div>

        {/* Mosque Name */}
        <div className="text-sm font-semibold text-slate-300 tracking-wide">
          {profile.name}
        </div>

        {/* Auto-progress skip button */}
        <button
          onClick={handleSkipToIqamah}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/30 transition"
        >
          <span>Ke Iqamah</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-6 px-8 text-center">

        {/* Prayer badge */}
        <div className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${accent.badge}`}>
          WAKTU ADZAN
        </div>

        {/* Big prayer name */}
        <h1 className={`text-7xl lg:text-9xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${accent.primary} drop-shadow-2xl`}
            style={{ textShadow: '0 0 80px rgba(16,185,129,0.3)' }}>
          {prayerLabel}
        </h1>

        {/* Arabic text */}
        <p className="text-3xl lg:text-5xl font-arabic text-amber-200 leading-loose tracking-wider opacity-90 dir-rtl">
          {prayerArabic}
        </p>

        {/* Adzan message */}
        <p className="text-base lg:text-lg text-slate-300 max-w-2xl leading-relaxed font-medium opacity-80">
          {prayerMsg}
        </p>

        {/* ─── Audio Status + Countdown Row ─────────── */}
        <div className="flex items-center gap-6 mt-2">

          {/* Countdown progress ring */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              {/* Track */}
              <circle cx="50" cy="50" r={radius}
                      fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              {/* Progress */}
              <circle cx="50" cy="50" r={radius}
                      fill="none" stroke="#10b981" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDash}
                      style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="text-center">
              <div className="text-xl font-black text-white font-mono">{formatTime(remainingSeconds)}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">Iqamah</div>
            </div>
          </div>

          {/* Audio indicator */}
          <div className="flex flex-col gap-2">
            {simulator.isAudioMuted ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-400">
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Audio Dibungkam (Simulasi)</span>
              </div>
            ) : !isAdzanEnabledForPrayer ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-400">
                <VolumeX className="w-4 h-4 text-amber-400" />
                <span>Adzan audio tidak aktif untuk waktu ini</span>
              </div>
            ) : audioStatus === 'playing' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-300">
                <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                <span>Memutar Audio Adzan — Vol {audio.volumeAdzan}%</span>
              </div>
            ) : audioStatus === 'blocked' ? (
              <button
                onClick={handleUnblockAudio}
                className="flex items-center gap-2 px-4 py-2 bg-amber-900/40 border border-amber-500/40 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-800/50 transition cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Klik untuk izinkan audio (autoplay diblokir)</span>
              </button>
            ) : audioStatus === 'error' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-900/30 border border-red-500/30 rounded-xl text-xs font-semibold text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Gagal memutar audio — periksa URL sumber</span>
              </div>
            ) : audioStatus === 'loading' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-400">
                <Volume2 className="w-4 h-4 text-slate-400 animate-pulse" />
                <span>Memuat audio adzan…</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-400">
                <VolumeX className="w-4 h-4" />
                <span>Audio selesai diputar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Footer ─────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-8 pb-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/60 pt-4">
        <span>{profile.address}</span>
        <span className="text-slate-600">
          Tampilan akan beralih ke Iqamah secara otomatis dalam {formatTime(remainingSeconds)}
        </span>
      </div>
    </div>
  );
};
