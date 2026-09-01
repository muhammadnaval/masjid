import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Volume2 } from 'lucide-react';

export const DzikirPlayer: React.FC = () => {
  const { audio, simulator, getAdjustedSchedule } = useApp();

  const [activeDzikir, setActiveDzikir] = useState<'pagi' | 'petang' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkTimer = setInterval(() => {
      const adjustedSchedule = getAdjustedSchedule();
      const now = new Date();
      const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const parseTimeToSecs = (tStr?: string) => {
        if (!tStr) return 0;
        const [h, m] = tStr.split(':').map(Number);
        return h * 3600 + m * 60;
      };

      const subuhSecs = parseTimeToSecs(adjustedSchedule.subuh);
      const asharSecs = parseTimeToSecs(adjustedSchedule.ashar);

      const pagiDelay = (audio.dzikirPagiAfterMinutes ?? 10) * 60;
      const petangDelay = (audio.dzikirPetangAfterMinutes ?? 10) * 60;

      const dzikirPagiStart = subuhSecs + pagiDelay;
      const dzikirPagiEnd = dzikirPagiStart + 20 * 60; // 20 mins duration

      const dzikirPetangStart = asharSecs + petangDelay;
      const dzikirPetangEnd = dzikirPetangStart + 20 * 60; // 20 mins duration

      let targetDzikir: 'pagi' | 'petang' | null = null;

      if (
        audio.dzikirPagiEnabled &&
        subuhSecs > 0 &&
        nowSeconds >= dzikirPagiStart &&
        nowSeconds < dzikirPagiEnd
      ) {
        targetDzikir = 'pagi';
      } else if (
        audio.dzikirPetangEnabled &&
        asharSecs > 0 &&
        nowSeconds >= dzikirPetangStart &&
        nowSeconds < dzikirPetangEnd
      ) {
        targetDzikir = 'petang';
      }

      const isModeNormal = simulator.currentMode === 'normal';
      const isMuted = simulator.isAudioMuted;

      if (targetDzikir && isModeNormal && !isMuted) {
        startAudio(targetDzikir);
      } else {
        stopAudio();
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [audio, simulator, getAdjustedSchedule]);

  const startAudio = (type: 'pagi' | 'petang') => {
    const url = type === 'pagi'
      ? (audio.dzikirPagiAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3')
      : (audio.dzikirPetangAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3');

    if (!audioRef.current || audioRef.current.src !== url) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioEl = new Audio(url);
      audioEl.loop = false;
      audioRef.current = audioEl;
    }

    audioRef.current.volume = (audio.volumeDzikir ?? 80) / 100;

    if (audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setActiveDzikir(type);
      }).catch(() => {
        setActiveDzikir(null);
      });
    } else {
      setActiveDzikir(type);
    }
  };

  const stopAudio = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActiveDzikir(null);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (!activeDzikir) return null;

  return (
    <div className="fixed bottom-16 left-6 z-40 flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border border-violet-500/40 rounded-2xl shadow-xl text-violet-300 animate-pulse">
      {activeDzikir === 'pagi' ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
      ) : (
        <Moon className="w-4 h-4 text-violet-400 animate-pulse" />
      )}
      <div className="text-xs">
        <span className="font-bold text-white block">
          {activeDzikir === 'pagi' ? "Dzikir Pagi Ba'da Subuh" : "Dzikir Petang Ba'da Ashar"}
        </span>
        <span className="text-[10px] text-violet-400">Sedang Diputar Otomatis</span>
      </div>
      <Volume2 className="w-4 h-4 text-violet-400 ml-1" />
    </div>
  );
};
