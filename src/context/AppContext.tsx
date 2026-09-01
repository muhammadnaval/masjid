import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MosqueProfile,
  PrayerLocation,
  PrayerSchedule,
  PrayerCorrections,
  IqamahSettings,
  MediaItem,
  RunningTextItem,
  AudioSettings,
  DonationSetting,
  ThemeSetting,
  AgendaItem,
  LayoutMode,
  SimulatorState,
  PrayerName,
  DisplayStateMode,
  SyuruqSetting
} from '../types';
import {
  initialMosqueProfile,
  availableLocations,
  initialPrayerSchedule,
  initialCorrections,
  initialIqamahSettings,
  initialSyuruqSetting,
  initialMediaItems,
  initialRunningTexts,
  initialAudioSettings,
  initialDonationSetting,
  presetThemes,
  initialAgendaItems
} from '../data/mockData';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;

  profile: MosqueProfile;
  updateProfile: (data: Partial<MosqueProfile>) => void;
  
  location: PrayerLocation;
  updateLocation: (loc: PrayerLocation) => void;
  
  schedule: PrayerSchedule;
  updateSchedule: (sch: Partial<PrayerSchedule>) => void;
  
  corrections: PrayerCorrections;
  updateCorrections: (cor: Partial<PrayerCorrections>) => void;
  
  iqamah: IqamahSettings;
  updateIqamah: (iq: Partial<IqamahSettings>) => void;
  
  syuruqSetting: SyuruqSetting;
  updateSyuruqSetting: (sy: Partial<SyuruqSetting>) => void;
  
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id'>) => void;
  updateMediaItem: (id: string, item: Partial<MediaItem>) => void;
  deleteMediaItem: (id: string) => void;
  reorderMediaItems: (items: MediaItem[]) => void;
  
  runningTexts: RunningTextItem[];
  addRunningText: (item: Omit<RunningTextItem, 'id'>) => void;
  updateRunningText: (id: string, item: Partial<RunningTextItem>) => void;
  deleteRunningText: (id: string) => void;

  agendaItems: AgendaItem[];
  addAgendaItem: (item: Omit<AgendaItem, 'id'>) => void;
  updateAgendaItem: (id: string, item: Partial<AgendaItem>) => void;
  deleteAgendaItem: (id: string) => void;
  
  audio: AudioSettings;
  updateAudio: (aud: Partial<AudioSettings>) => void;
  
  donation: DonationSetting;
  updateDonation: (don: Partial<DonationSetting>) => void;
  
  theme: ThemeSetting;
  updateTheme: (th: ThemeSetting) => void;
  presetThemes: ThemeSetting[];

  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  
  simulator: SimulatorState;
  setSimulatorMode: (mode: DisplayStateMode, prayer?: PrayerName) => void;
  setIqamahSeconds: (sec: number | ((prev: number) => number)) => void;
  toggleFridayMode: () => void;
  toggleAudioMute: () => void;
  toggleSimulatorBar: () => void;

  backendOnline: boolean;
  syncFromBackend: () => Promise<void>;
  
  getAdjustedSchedule: () => PrayerSchedule;
  getNextPrayer: () => { name: PrayerName; label: string; time: string; remainingSeconds: number };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('masjid_admin_auth') === 'true';
  });

  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  const login = (email: string, pass: string): boolean => {
    const normalizedEmail = email.trim().toLowerCase();
    const isEmailAllowed = normalizedEmail === 'pengurus@masjid.test' || 
                           normalizedEmail === 'admin@masjid.test' || 
                           normalizedEmail.includes('pengurus') || 
                           normalizedEmail.includes('admin');
    if (isEmailAllowed && pass.length >= 6) {
      setIsAuthenticated(true);
      localStorage.setItem('masjid_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('masjid_admin_auth');
  };

  const [profile, setProfile] = useState<MosqueProfile>(() => {
    const saved = localStorage.getItem('masjid_profile');
    return saved ? JSON.parse(saved) : initialMosqueProfile;
  });

  const [location, setLocation] = useState<PrayerLocation>(() => {
    const saved = localStorage.getItem('masjid_location');
    return saved ? JSON.parse(saved) : availableLocations[0];
  });

  const [schedule, setSchedule] = useState<PrayerSchedule>(() => {
    const saved = localStorage.getItem('masjid_schedule');
    return saved ? JSON.parse(saved) : initialPrayerSchedule;
  });

  const [corrections, setCorrections] = useState<PrayerCorrections>(() => {
    const saved = localStorage.getItem('masjid_corrections');
    return saved ? JSON.parse(saved) : initialCorrections;
  });

  const [iqamah, setIqamah] = useState<IqamahSettings>(() => {
    const saved = localStorage.getItem('masjid_iqamah');
    return saved ? JSON.parse(saved) : initialIqamahSettings;
  });

  const [syuruqSetting, setSyuruqSetting] = useState<SyuruqSetting>(() => {
    const saved = localStorage.getItem('masjid_syuruq');
    return saved ? JSON.parse(saved) : initialSyuruqSetting;
  });

  const updateSyuruqSetting = (sy: Partial<SyuruqSetting>) => {
    setSyuruqSetting(prev => {
      const updated = { ...prev, ...sy };
      localStorage.setItem('masjid_syuruq', JSON.stringify(updated));
      return updated;
    });
  };

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('masjid_media');
    return saved ? JSON.parse(saved) : initialMediaItems;
  });

  const [runningTexts, setRunningTexts] = useState<RunningTextItem[]>(() => {
    const saved = localStorage.getItem('masjid_running_text');
    return saved ? JSON.parse(saved) : initialRunningTexts;
  });

  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(() => {
    const saved = localStorage.getItem('masjid_agenda');
    return saved ? JSON.parse(saved) : initialAgendaItems;
  });

  const [audio, setAudio] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('masjid_audio');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Backwards-compatible defaults for new fields
      return {
        adzanDurationSeconds: 150,
        enabledPrayersForAdzan: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as PrayerName[],
        enabledPrayersForMurottal: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as PrayerName[],
        ...parsed,
      };
    }
    return initialAudioSettings;
  });

  const [donation, setDonation] = useState<DonationSetting>(() => {
    const saved = localStorage.getItem('masjid_donation');
    return saved ? JSON.parse(saved) : initialDonationSetting;
  });

  const [theme, setTheme] = useState<ThemeSetting>(() => {
    const saved = localStorage.getItem('masjid_theme');
    return saved ? JSON.parse(saved) : presetThemes[0];
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    return (localStorage.getItem('masjid_layout_mode') as LayoutMode) || 'default';
  });

  const [simulator, setSimulator] = useState<SimulatorState>(() => {
    const savedMode = localStorage.getItem('masjid_simulator_mode') as DisplayStateMode;
    return {
      currentMode: savedMode || 'normal',
      activePrayerForMode: 'subuh',
      iqamahRemainingSeconds: 600,
      isFriday: new Date().getDay() === 5,
      isAudioMuted: false,
      simulatorBarVisible: true,
    };
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'masjid_simulator_mode' && e.newValue) {
        setSimulator(prev => ({
          ...prev,
          currentMode: e.newValue as DisplayStateMode,
        }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Relative Polling sync function to Laravel API
  const syncFromBackend = async () => {
    try {
      const res = await fetch('/api/display/state', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          setBackendOnline(true);
          if (data.profile) setProfile(prev => ({ ...prev, name: data.profile.name, address: data.profile.address }));
          if (data.location) setLocation({ provinceName: data.location.province_name, cityCode: data.location.city_code, cityName: data.location.city_name });
          if (data.schedule) setSchedule({
            date: data.schedule.date,
            subuh: data.schedule.subuh.substring(0, 5),
            syuruq: data.schedule.syuruq.substring(0, 5),
            dzuhur: data.schedule.dzuhur.substring(0, 5),
            ashar: data.schedule.ashar.substring(0, 5),
            maghrib: data.schedule.maghrib.substring(0, 5),
            isya: data.schedule.isya.substring(0, 5),
            source: data.schedule.source
          });
          if (data.corrections) setCorrections(data.corrections);
          // Sync audio settings if available
          if (data.audio) {
            setAudio(prev => ({
              ...prev,
              adzanAudioUrl: data.audio.adzan_audio_url ?? prev.adzanAudioUrl,
              volumeAdzan: data.audio.volume_adzan ?? prev.volumeAdzan,
              adzanDurationSeconds: data.audio.adzan_duration_seconds ?? prev.adzanDurationSeconds,
              enabledPrayersForAdzan: data.audio.enabled_prayers_for_adzan ?? prev.enabledPrayersForAdzan,
              murottalEnabled: data.audio.murottal_enabled ?? prev.murottalEnabled,
              murottalBeforeMinutes: data.audio.murottal_before_minutes ?? prev.murottalBeforeMinutes,
              murottalAudioUrl: data.audio.murottal_audio_url ?? prev.murottalAudioUrl,
              volumeMurottal: data.audio.volume_murottal ?? prev.volumeMurottal,
              enabledPrayersForMurottal: data.audio.enabled_prayers_for_murottal ?? prev.enabledPrayersForMurottal,
              dzikirPagiEnabled: data.audio.dzikir_pagi_enabled ?? prev.dzikirPagiEnabled,
              dzikirPagiAfterMinutes: data.audio.dzikir_pagi_after_minutes ?? prev.dzikirPagiAfterMinutes ?? 10,
              dzikirPagiAudioUrl: data.audio.dzikir_pagi_audio_url ?? prev.dzikirPagiAudioUrl,
              dzikirPetangEnabled: data.audio.dzikir_petang_enabled ?? prev.dzikirPetangEnabled,
              dzikirPetangAfterMinutes: data.audio.dzikir_petang_after_minutes ?? prev.dzikirPetangAfterMinutes ?? 10,
              dzikirPetangAudioUrl: data.audio.dzikir_petang_audio_url ?? prev.dzikirPetangAudioUrl,
              volumeDzikir: data.audio.volume_dzikir ?? prev.volumeDzikir,
            }));
          }
          // Sync iqamah settings if available
          if (data.iqamah && typeof data.iqamah === 'object' && !Array.isArray(data.iqamah)) {
            const iq = data.iqamah;
            setIqamah(prev => ({
              ...prev,
              subuh:   iq.subuh   ? { enabled: !!iq.subuh.is_enabled,   durationMinutes: iq.subuh.duration_minutes   ?? prev.subuh.durationMinutes }   : prev.subuh,
              dzuhur:  iq.dzuhur  ? { enabled: !!iq.dzuhur.is_enabled,  durationMinutes: iq.dzuhur.duration_minutes  ?? prev.dzuhur.durationMinutes }  : prev.dzuhur,
              ashar:   iq.ashar   ? { enabled: !!iq.ashar.is_enabled,   durationMinutes: iq.ashar.duration_minutes   ?? prev.ashar.durationMinutes }   : prev.ashar,
              maghrib: iq.maghrib ? { enabled: !!iq.maghrib.is_enabled, durationMinutes: iq.maghrib.duration_minutes ?? prev.maghrib.durationMinutes } : prev.maghrib,
              isya:    iq.isya    ? { enabled: !!iq.isya.is_enabled,    durationMinutes: iq.isya.duration_minutes    ?? prev.isya.durationMinutes }    : prev.isya,
            }));
          }
          // Sync syuruq settings if available
          if (data.syuruq) {
            setSyuruqSetting({
              isEnabled: !!data.syuruq.is_enabled,
              durationMinutes: Number(data.syuruq.duration_minutes) || 10,
            });
          }
          if (data.theme) {
            if (data.theme.layout_config?.layout_mode) {
              setLayoutMode(data.theme.layout_config.layout_mode as LayoutMode);
            }
            const match = data.theme.theme_name 
              ? presetThemes.find(p => p.name.toLowerCase() === data.theme.theme_name.toLowerCase()) 
              : null;
            const basePreset = match || presetThemes[0];
            setTheme({
              ...basePreset,
              primaryColor: data.theme.primary_color || basePreset.primaryColor,
              accentColor: data.theme.secondary_color || basePreset.accentColor,
              bgColor: data.theme.background_color || basePreset.bgColor,
              textColor: data.theme.text_color || basePreset.textColor,
            });
          }
        }
      }
    } catch (e) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    syncFromBackend();
    const interval = setInterval(syncFromBackend, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('masjid_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('masjid_location', JSON.stringify(location)); }, [location]);
  useEffect(() => { localStorage.setItem('masjid_schedule', JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => { localStorage.setItem('masjid_corrections', JSON.stringify(corrections)); }, [corrections]);
  useEffect(() => { localStorage.setItem('masjid_iqamah', JSON.stringify(iqamah)); }, [iqamah]);
  useEffect(() => { localStorage.setItem('masjid_media', JSON.stringify(mediaItems)); }, [mediaItems]);
  useEffect(() => { localStorage.setItem('masjid_running_text', JSON.stringify(runningTexts)); }, [runningTexts]);
  useEffect(() => { localStorage.setItem('masjid_agenda', JSON.stringify(agendaItems)); }, [agendaItems]);
  useEffect(() => { localStorage.setItem('masjid_audio', JSON.stringify(audio)); }, [audio]);
  useEffect(() => { localStorage.setItem('masjid_donation', JSON.stringify(donation)); }, [donation]);
  useEffect(() => { localStorage.setItem('masjid_theme', JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem('masjid_layout_mode', layoutMode); }, [layoutMode]);

  // Updaters
  const updateProfile = (data: Partial<MosqueProfile>) => setProfile(prev => ({ ...prev, ...data }));
  const updateLocation = (loc: PrayerLocation) => setLocation(loc);
  const updateSchedule = (sch: Partial<PrayerSchedule>) => setSchedule(prev => ({ ...prev, ...sch }));
  const updateCorrections = (cor: Partial<PrayerCorrections>) => setCorrections(prev => ({ ...prev, ...cor }));
  const updateIqamah = (iq: Partial<IqamahSettings>) => setIqamah(prev => ({ ...prev, ...iq }));

  const addMediaItem = (item: Omit<MediaItem, 'id'>) => {
    setMediaItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const updateMediaItem = (id: string, item: Partial<MediaItem>) => {
    setMediaItems(prev => prev.map(m => m.id === id ? { ...m, ...item } : m));
  };
  const deleteMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };
  const reorderMediaItems = (items: MediaItem[]) => setMediaItems(items);

  const addRunningText = (item: Omit<RunningTextItem, 'id'>) => {
    setRunningTexts(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const updateRunningText = (id: string, item: Partial<RunningTextItem>) => {
    setRunningTexts(prev => prev.map(r => r.id === id ? { ...r, ...item } : r));
  };
  const deleteRunningText = (id: string) => {
    setRunningTexts(prev => prev.filter(r => r.id !== id));
  };

  const addAgendaItem = (item: Omit<AgendaItem, 'id'>) => {
    setAgendaItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
  };
  const updateAgendaItem = (id: string, item: Partial<AgendaItem>) => {
    setAgendaItems(prev => prev.map(a => a.id === id ? { ...a, ...item } : a));
  };
  const deleteAgendaItem = (id: string) => {
    setAgendaItems(prev => prev.filter(a => a.id !== id));
  };

  const updateAudio = (aud: Partial<AudioSettings>) => setAudio(prev => ({ ...prev, ...aud }));
  const updateDonation = (don: Partial<DonationSetting>) => setDonation(prev => ({ ...prev, ...don }));
  const updateTheme = (th: ThemeSetting) => setTheme(th);

  // Simulator controls
  const setSimulatorMode = (mode: DisplayStateMode, prayer: PrayerName = 'subuh') => {
    localStorage.setItem('masjid_simulator_mode', mode);
    // Use actual iqamah settings, fall back to sensible defaults
    const prayerIqamah = iqamah[prayer as keyof IqamahSettings] as { enabled: boolean; durationMinutes: number } | undefined;
    const durationMins  = prayerIqamah?.durationMinutes ?? (prayer === 'maghrib' ? 5 : prayer === 'subuh' ? 10 : 7);
    const dur = durationMins * 60;

    setSimulator((prev: SimulatorState) => ({
      ...prev,
      currentMode: mode,
      activePrayerForMode: prayer,
      iqamahRemainingSeconds: dur,
    }));
  };

  const setIqamahSeconds = (sec: number | ((prev: number) => number)) => {
    setSimulator((prev: SimulatorState) => ({
      ...prev,
      iqamahRemainingSeconds: typeof sec === 'function' ? sec(prev.iqamahRemainingSeconds) : sec,
    }));
  };

  const toggleFridayMode = () => setSimulator((prev: SimulatorState) => ({ ...prev, isFriday: !prev.isFriday }));
  const toggleAudioMute = () => setSimulator((prev: SimulatorState) => ({ ...prev, isAudioMuted: !prev.isAudioMuted }));
  const toggleSimulatorBar = () => setSimulator((prev: SimulatorState) => ({ ...prev, simulatorBarVisible: !prev.simulatorBarVisible }));

  // Calculation helpers
  const addMinutesToTimeStr = (timeStr: string, mins: number = 0): string => {
    if (!timeStr) return '00:00';
    const validMins = Number(mins) || 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '00:00';
    const [h, m] = parts;
    const date = new Date();
    date.setHours(h, m + validMins, 0, 0);
    const resH = String(date.getHours()).padStart(2, '0');
    const resM = String(date.getMinutes()).padStart(2, '0');
    return `${resH}:${resM}`;
  };

  const getAdjustedSchedule = (): PrayerSchedule => {
    return {
      ...schedule,
      subuh: addMinutesToTimeStr(schedule.subuh, corrections.subuh),
      syuruq: addMinutesToTimeStr(schedule.syuruq, corrections.syuruq),
      dzuhur: addMinutesToTimeStr(schedule.dzuhur, corrections.dzuhur),
      ashar: addMinutesToTimeStr(schedule.ashar, corrections.ashar),
      maghrib: addMinutesToTimeStr(schedule.maghrib, corrections.maghrib),
      isya: addMinutesToTimeStr(schedule.isya, corrections.isya),
    };
  };

  const getNextPrayer = () => {
    const adj = getAdjustedSchedule();
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const parseMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const isFridayToday = simulator.isFriday || now.getDay() === 5;

    const list: { name: PrayerName; label: string; time: string; mins: number }[] = [
      { name: 'subuh', label: 'Subuh', time: adj.subuh, mins: parseMins(adj.subuh) },
      { name: 'syuruq', label: 'Syuruq', time: adj.syuruq, mins: parseMins(adj.syuruq) },
      { name: 'dzuhur', label: isFridayToday ? 'Jum\'at' : 'Dzuhur', time: adj.dzuhur, mins: parseMins(adj.dzuhur) },
      { name: 'ashar', label: 'Ashar', time: adj.ashar, mins: parseMins(adj.ashar) },
      { name: 'maghrib', label: 'Maghrib', time: adj.maghrib, mins: parseMins(adj.maghrib) },
      { name: 'isya', label: 'Isya', time: adj.isya, mins: parseMins(adj.isya) },
    ];

    for (const p of list) {
      if (p.mins > currentMins) {
        const diffSecs = (p.mins - currentMins) * 60 - now.getSeconds();
        return { name: p.name, label: p.label, time: p.time, remainingSeconds: Math.max(0, diffSecs) };
      }
    }

    const first = list[0];
    const tomSecs = (24 * 60 - currentMins + first.mins) * 60 - now.getSeconds();
    return { name: first.name, label: first.label, time: first.time, remainingSeconds: tomSecs };
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        profile,
        updateProfile,
        location,
        updateLocation,
        schedule,
        updateSchedule,
        corrections,
        updateCorrections,
        iqamah,
        updateIqamah,
        syuruqSetting,
        updateSyuruqSetting,
        mediaItems,
        addMediaItem,
        updateMediaItem,
        deleteMediaItem,
        reorderMediaItems,
        runningTexts,
        addRunningText,
        updateRunningText,
        deleteRunningText,
        agendaItems,
        addAgendaItem,
        updateAgendaItem,
        deleteAgendaItem,
        audio,
        updateAudio,
        donation,
        updateDonation,
        theme,
        updateTheme,
        presetThemes,
        layoutMode,
        setLayoutMode,
        simulator,
        setSimulatorMode,
        setIqamahSeconds,
        toggleFridayMode,
        toggleAudioMute,
        toggleSimulatorBar,
        backendOnline,
        syncFromBackend,
        getAdjustedSchedule,
        getNextPrayer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
