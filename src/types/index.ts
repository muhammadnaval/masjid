export type PrayerName = 'subuh' | 'syuruq' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export interface MosqueProfile {
  name: string;
  address: string;
  contact: string;
  logoPath: string;
  backgroundPath: string;
  timezone: string;
  hijriCorrection?: number;
}

export interface HijriDateInfo {
  hijri_day: number;
  hijri_month: number;
  hijri_month_name: string;
  hijri_year: number;
  formatted_hijri: string;
  formatted_masehi: string;
  day_name_id: string;
  correction_days: number;
}

export interface PrayerLocation {
  provinceName: string;
  cityCode: string;
  cityName: string;
}

export interface PrayerSchedule {
  date: string; // YYYY-MM-DD
  imsak?: string;
  subuh: string;
  syuruq: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  source: string;
}

export interface PrayerCorrections {
  imsak: number;
  subuh: number;
  syuruq: number;
  dzuhur: number;
  ashar: number;
  maghrib: number;
  isya: number;
}

export interface IqamahSettings {
  subuh: { enabled: boolean; durationMinutes: number };
  dzuhur: { enabled: boolean; durationMinutes: number };
  ashar: { enabled: boolean; durationMinutes: number };
  maghrib: { enabled: boolean; durationMinutes: number };
  isya: { enabled: boolean; durationMinutes: number };
  fridayModeDisabled: boolean;
}

export interface SyuruqSetting {
  isEnabled: boolean;
  durationMinutes: number;
}

export type MediaType = 'image' | 'video' | 'youtube' | 'livestream' | 'text' | 'table' | 'donation' | 'hadith' | 'doa';

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  content?: string; // Text, HTML, YouTube URL, or JSON data
  filePath?: string;
  durationSeconds: number;
  sortOrder: number;
  isActive: boolean;
  tableData?: { headers: string[]; rows: string[][] };
}

export interface RunningTextItem {
  id: string;
  text: string;
  speed: 'slow' | 'normal' | 'fast';
  isActive: boolean;
  category?: 'umum' | 'donasi' | 'kajian' | 'himbauan';
}

export interface AudioSettings {
  adzanAudioUrl: string;
  volumeAdzan: number;
  adzanDurationSeconds: number; // How long the Adzan overlay is shown before auto-transition
  enabledPrayersForAdzan: PrayerName[]; // Per-prayer adzan toggle
  murottalEnabled: boolean;
  murottalBeforeMinutes: number;
  murottalAudioUrl: string;
  volumeMurottal: number;
  enabledPrayersForMurottal?: PrayerName[]; // Per-prayer murottal toggle
  dzikirPagiEnabled: boolean;
  dzikirPagiAfterMinutes?: number;
  dzikirPagiAudioUrl?: string;
  dzikirPetangEnabled: boolean;
  dzikirPetangAfterMinutes?: number;
  dzikirPetangAudioUrl?: string;
  volumeDzikir: number;
}

export interface DonationSetting {
  id: string;
  title: string;
  description: string;
  qrCodePath: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  isActive: boolean;
}

export interface ThemeSetting {
  id: string;
  name: string;
  primaryColor: string; // e.g. emerald-600
  accentColor: string;  // e.g. amber-400
  bgColor: string;      // e.g. slate-950
  cardBg: string;       // e.g. slate-900/80
  textColor: string;    // e.g. text-white
  fontFamily: 'outfit' | 'inter' | 'amiri';
  customCss?: string;
}

export type DisplayStateMode = 'normal' | 'murottal' | 'adzan' | 'iqamah' | 'syuruq' | 'friday_khutbah';

export interface SimulatorState {
  currentMode: DisplayStateMode;
  activePrayerForMode?: PrayerName;
  iqamahRemainingSeconds: number;
  isFriday: boolean;
  isAudioMuted: boolean;
  simulatorBarVisible: boolean;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  description: string;
  isIslamicHoliday?: boolean;
  isActive: boolean;
}

export type LayoutMode = 'default' | 'hero' | 'media_focus' | 'media_focused' | 'minimal' | 'minimal_clock';
