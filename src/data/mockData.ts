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
  AgendaItem
} from '../types';

export const initialMosqueProfile: MosqueProfile = {
  name: 'MASJID AL-HIDAYAH SITEBA',
  address: 'Jl. Raya Siteba No. 15, Surau Gadang, Kec. Nanggalo, Kota Padang, Sumatera Barat',
  contact: 'Telp/WA: 0812-6789-0123 | Instagram: @masjid_alhidayah_siteba',
  logoPath: 'https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=300&auto=format&fit=crop&q=80',
  backgroundPath: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&auto=format&fit=crop&q=80',
  timezone: 'Asia/Jakarta',
};

export const availableLocations: PrayerLocation[] = [
  { provinceName: 'Sumatera Barat', cityCode: 'padang', cityName: 'Kota Padang' },
  { provinceName: 'DKI Jakarta', cityCode: 'jakarta', cityName: 'Kota Jakarta' },
  { provinceName: 'Jawa Barat', cityCode: 'bandung', cityName: 'Kota Bandung' },
  { provinceName: 'Jawa Tengah', cityCode: 'semarang', cityName: 'Kota Semarang' },
  { provinceName: 'Jawa Timur', cityCode: 'surabaya', cityName: 'Kota Surabaya' },
  { provinceName: 'DI Yogyakarta', cityCode: 'yogyakarta', cityName: 'Kota Yogyakarta' },
];

export const initialPrayerSchedule: PrayerSchedule = {
  date: new Date().toISOString().split('T')[0],
  imsak: '04:54',
  subuh: '05:04',
  syuruq: '06:20',
  dzuhur: '12:28',
  ashar: '15:51',
  maghrib: '18:30',
  isya: '19:42',
  source: 'API Resmi EQuran.id (Kemenag RI)',
};

export const initialCorrections: PrayerCorrections = {
  imsak: 0,
  subuh: 0,
  syuruq: 0,
  dzuhur: 0,
  ashar: 0,
  maghrib: 0,
  isya: 0,
};

export const initialIqamahSettings: IqamahSettings = {
  subuh: { enabled: true, durationMinutes: 10 },
  dzuhur: { enabled: true, durationMinutes: 7 },
  ashar: { enabled: true, durationMinutes: 7 },
  maghrib: { enabled: true, durationMinutes: 5 },
  isya: { enabled: true, durationMinutes: 7 },
  fridayModeDisabled: true,
};

export const initialSyuruqSetting = {
  isEnabled: true,
  durationMinutes: 10,
};

export const initialMediaItems: MediaItem[] = [
  {
    id: '1',
    title: 'Doa Harian Otomatis (equran.id API)',
    type: 'doa',
    durationSeconds: 15,
    sortOrder: 1,
    isActive: true,
  },
];

export const initialRunningTexts: RunningTextItem[] = [
  {
    id: '1',
    text: 'Selamat datang di Masjid Al-Hidayah Siteba. Luruskan dan rapatkan shaf demi kesempurnaan shalat berjamaah.',
    speed: 'normal',
    isActive: true,
    category: 'umum',
  },
];

export const initialAudioSettings: AudioSettings = {
  adzanAudioUrl: 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3',
  volumeAdzan: 80,
  adzanDurationSeconds: 150, // 2.5 minutes default
  enabledPrayersForAdzan: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
  murottalEnabled: true,
  murottalBeforeMinutes: 5,
  murottalAudioUrl: 'https://server8.mp3quran.net/afs/018.mp3',
  volumeMurottal: 80,
  enabledPrayersForMurottal: ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
  dzikirPagiEnabled: true,
  dzikirPagiAfterMinutes: 10,
  dzikirPagiAudioUrl: 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
  dzikirPetangEnabled: true,
  dzikirPetangAfterMinutes: 10,
  dzikirPetangAudioUrl: 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3',
  volumeDzikir: 80,
};

export const initialDonationSetting: DonationSetting = {
  id: '1',
  title: 'Infaq & Sedekah Operasional Masjid',
  description: 'Salurkan infaq dan sedekah terbaik Anda untuk memakmurkan masjid dan kegiatan dakwah.',
  qrCodePath: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://masjid.test/donasi',
  bankName: 'Bank Syariah Indonesia (BSI)',
  accountName: 'Masjid Al-Hidayah Siteba',
  accountNumber: '7123-4567-8901',
  isActive: true,
};

export const presetThemes: ThemeSetting[] = [
  {
    id: 'emerald-gold',
    name: 'Emerald Gold (Klasik Masjid)',
    primaryColor: '#10b981',
    accentColor: '#f59e0b',
    bgColor: '#020617',
    cardBg: 'bg-slate-900/80',
    textColor: '#ecfdf5',
    fontFamily: 'outfit',
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue (Modern Minimalis)',
    primaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    bgColor: '#0f172a',
    cardBg: 'bg-slate-900/80',
    textColor: '#eff6ff',
    fontFamily: 'inter',
  },
  {
    id: 'dark-amber',
    name: 'Midnight Amber (Gelap Elegan)',
    primaryColor: '#d97706',
    accentColor: '#f97316',
    bgColor: '#18181b',
    cardBg: 'bg-zinc-900/80',
    textColor: '#fffbeb',
    fontFamily: 'outfit',
  },
  {
    id: 'teal-masjid',
    name: 'Teal Mosque (Khas Islami)',
    primaryColor: '#14b8a6',
    accentColor: '#eab308',
    bgColor: '#042f2e',
    cardBg: 'bg-teal-950/80',
    textColor: '#f0fdfa',
    fontFamily: 'inter',
  },
];

export const initialAgendaItems: AgendaItem[] = [];
