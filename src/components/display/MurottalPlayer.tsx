import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Music, Volume2 } from 'lucide-react';
import { PrayerName } from '../../types';

export const MurottalPlayer: React.FC = () => {
  const { audio, simulator, getAdjustedSchedule } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [upcomingPrayer, setUpcomingPrayer] = useState<{ name: PrayerName; label: string; timeStr: string; minsRemaining: number } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkTimer = setInterval(() => {
      const adjustedSchedule = getAdjustedSchedule();
      const now = new Date();
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const PRAYER_LIST: { key: PrayerName; label: string }[] = [
        { key: 'subuh', label: 'Subuh' },
        { key: 'dzuhur', label: 'Dzuhur' },
        { key: 'ashar', label: 'Ashar' },
        { key: 'maghrib', label: 'Maghrib' },
        { key: 'isya', label: 'Isya' },
      ];

      let foundNext: { name: PrayerName; label: string; timeStr: string; minsRemaining: number } | null = null;

      for (const p of PRAYER_LIST) {
        const timeStr = adjustedSchedule[p.key];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(':').map(Number);
        const pSeconds = h * 3600 + m * 60;
        const diffSecs = pSeconds - nowSeconds;

        if (diffSecs > 0) {
          foundNext = {
            name: p.key,
            label: p.label,
            timeStr,
            minsRemaining: Math.ceil(diffSecs / 60),
          };
          break;
        }
      }

      setUpcomingPrayer(foundNext);

      // Murottal Eligibility Checks
      if (!foundNext) {
        stopAudio();
        return;
      }

      const murottalEnabled = audio.murottalEnabled ?? true;
      const enabledPrayers = audio.enabledPrayersForMurottal ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
      const isPrayerEnabled = enabledPrayers.includes(foundNext.name);
      const isModeNormal = simulator.currentMode === 'normal';
      const isMuted = simulator.isAudioMuted;
      const beforeMins = audio.murottalBeforeMinutes ?? 5;
      const isWithinWindow = foundNext.minsRemaining <= beforeMins && foundNext.minsRemaining > 0;

      const shouldPlay = murottalEnabled && isPrayerEnabled && isModeNormal && !isMuted && isWithinWindow;

      if (shouldPlay) {
        startAudio();
      } else {
        stopAudio();
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [audio, simulator, getAdjustedSchedule]);

  const startAudio = () => {
    const url = audio.murottalAudioUrl || 'https://server8.mp3quran.net/afs/018.mp3';

    if (!audioRef.current || audioRef.current.src !== url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioEl = new Audio(url);
      audioEl.loop = true;
      audioRef.current = audioEl;
    }

    audioRef.current.volume = (audio.volumeMurottal ?? 80) / 100;

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked by browser
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!isPlaying || !upcomingPrayer) return null;

  return (
    <div className="fixed bottom-16 right-6 z-40 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl shadow-xl text-cyan-300 animate-pulse">
      <Music className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
      <div className="text-xs">
        <span className="font-bold text-white block">Murottal Menjelang Adzan {upcomingPrayer.label}</span>
        <span className="text-[10px] text-cyan-400">Adzan pukul {upcomingPrayer.timeStr} ({upcomingPrayer.minsRemaining}m lagi)</span>
      </div>
      <Volume2 className="w-4 h-4 text-cyan-400 ml-1" />
    </div>
  );
};
