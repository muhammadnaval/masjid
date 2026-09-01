import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Volume2, Save, Check, Music, Radio, Upload, Play, Pause,
  Clock, ToggleLeft, ToggleRight, AlertCircle, X, Sun, Moon
} from 'lucide-react';
import { AudioSettings, PrayerName } from '../../types';

const PRAYERS: { key: PrayerName; label: string; icon: string }[] = [
  { key: 'subuh',   label: 'Subuh',   icon: '🌙' },
  { key: 'dzuhur',  label: 'Dzuhur',  icon: '☀️' },
  { key: 'ashar',   label: 'Ashar',   icon: '🌤️' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌅' },
  { key: 'isya',    label: 'Isya',    icon: '⭐' },
];

export const AudioSettingsPage: React.FC = () => {
  const { audio, updateAudio } = useApp();

  // Ensure backwards-compatible defaults for older localStorage data
  const safeAudio: AudioSettings = {
    adzanAudioUrl: audio.adzanAudioUrl || 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3',
    volumeAdzan: audio.volumeAdzan ?? 80,
    adzanDurationSeconds: audio.adzanDurationSeconds ?? 150,
    enabledPrayersForAdzan: audio.enabledPrayersForAdzan ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
    murottalEnabled: audio.murottalEnabled ?? true,
    murottalBeforeMinutes: audio.murottalBeforeMinutes ?? 5,
    murottalAudioUrl: audio.murottalAudioUrl || 'https://server8.mp3quran.net/afs/018.mp3',
    volumeMurottal: audio.volumeMurottal ?? 80,
    enabledPrayersForMurottal: audio.enabledPrayersForMurottal ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
    dzikirPagiEnabled: audio.dzikirPagiEnabled ?? true,
    dzikirPagiAfterMinutes: audio.dzikirPagiAfterMinutes ?? 10,
    dzikirPagiAudioUrl: audio.dzikirPagiAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
    dzikirPetangEnabled: audio.dzikirPetangEnabled ?? true,
    dzikirPetangAfterMinutes: audio.dzikirPetangAfterMinutes ?? 10,
    dzikirPetangAudioUrl: audio.dzikirPetangAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3',
    volumeDzikir: audio.volumeDzikir ?? 80,
  };

  const [formData, setFormData] = useState<AudioSettings>(safeAudio);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedMurottalFileName, setUploadedMurottalFileName] = useState<string | null>(null);
  const [uploadedDzikirPagiFileName, setUploadedDzikirPagiFileName] = useState<string | null>(null);
  const [uploadedDzikirPetangFileName, setUploadedDzikirPetangFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isMurottalPreviewPlaying, setIsMurottalPreviewPlaying] = useState(false);
  const [isDzikirPagiPreviewPlaying, setIsDzikirPagiPreviewPlaying] = useState(false);
  const [isDzikirPetangPreviewPlaying, setIsDzikirPetangPreviewPlaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const murottalFileInputRef = useRef<HTMLInputElement>(null);
  const dzikirPagiFileInputRef = useRef<HTMLInputElement>(null);
  const dzikirPetangFileInputRef = useRef<HTMLInputElement>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewMurottalAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewDzikirPagiAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewDzikirPetangAudioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Save handler ─────────────────────────────────────────────────────
  const handleSave = async () => {
    updateAudio(formData);

    try {
      await fetch('/api/admin/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          adzan_audio_url: formData.adzanAudioUrl,
          volume_adzan: formData.volumeAdzan,
          adzan_duration_seconds: formData.adzanDurationSeconds,
          enabled_prayers_for_adzan: formData.enabledPrayersForAdzan,
          murottal_enabled: formData.murottalEnabled,
          murottal_before_minutes: formData.murottalBeforeMinutes,
          murottal_audio_url: formData.murottalAudioUrl,
          volume_murottal: formData.volumeMurottal,
          enabled_prayers_for_murottal: formData.enabledPrayersForMurottal,
          dzikir_pagi_enabled: formData.dzikirPagiEnabled,
          dzikir_pagi_after_minutes: formData.dzikirPagiAfterMinutes,
          dzikir_pagi_audio_url: formData.dzikirPagiAudioUrl,
          dzikir_petang_enabled: formData.dzikirPetangEnabled,
          dzikir_petang_after_minutes: formData.dzikirPetangAfterMinutes,
          dzikir_petang_audio_url: formData.dzikirPetangAudioUrl,
          volume_dzikir: formData.volumeDzikir,
        }),
      });
    } catch (_) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // ─── Per-prayer adzan toggle ─────────────────────────────────────────
  const togglePrayerAdzan = (prayerKey: PrayerName) => {
    const current = formData.enabledPrayersForAdzan ?? [];
    const updated = current.includes(prayerKey)
      ? current.filter(p => p !== prayerKey)
      : [...current, prayerKey];
    setFormData({ ...formData, enabledPrayersForAdzan: updated });
  };

  // ─── Per-prayer murottal toggle ───────────────────────────────────────
  const togglePrayerMurottal = (prayerKey: PrayerName) => {
    const current = formData.enabledPrayersForMurottal ?? [];
    const updated = current.includes(prayerKey)
      ? current.filter(p => p !== prayerKey)
      : [...current, prayerKey];
    setFormData({ ...formData, enabledPrayersForMurottal: updated });
  };

  // ─── File upload handlers ─────────────────────────────────────────────
  const validateAudioFile = (file: File): boolean => {
    setUploadError(null);
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
    const validExtensions = ['.mp3', '.wav', '.ogg'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setUploadError('Format tidak didukung. Gunakan file MP3, WAV, atau OGG.');
      return false;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran file terlalu besar. Maksimum 20MB.');
      return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateAudioFile(file)) return;
    const objectUrl = URL.createObjectURL(file);
    setFormData({ ...formData, adzanAudioUrl: objectUrl });
    setUploadedFileName(file.name);

    const fd = new FormData();
    fd.append('adzan_file', file);
    fetch('/api/admin/audio/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.file_url) setFormData(prev => ({ ...prev, adzanAudioUrl: d.file_url })); })
      .catch(() => {});
  };

  const handleMurottalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateAudioFile(file)) return;
    const objectUrl = URL.createObjectURL(file);
    setFormData({ ...formData, murottalAudioUrl: objectUrl });
    setUploadedMurottalFileName(file.name);

    const fd = new FormData();
    fd.append('murottal_file', file);
    fetch('/api/admin/audio/upload-murottal', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.file_url) setFormData(prev => ({ ...prev, murottalAudioUrl: d.file_url })); })
      .catch(() => {});
  };

  const handleDzikirPagiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateAudioFile(file)) return;
    const objectUrl = URL.createObjectURL(file);
    setFormData({ ...formData, dzikirPagiAudioUrl: objectUrl });
    setUploadedDzikirPagiFileName(file.name);

    const fd = new FormData();
    fd.append('dzikir_file', file);
    fetch('/api/admin/audio/upload-dzikir-pagi', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.file_url) setFormData(prev => ({ ...prev, dzikirPagiAudioUrl: d.file_url })); })
      .catch(() => {});
  };

  const handleDzikirPetangFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateAudioFile(file)) return;
    const objectUrl = URL.createObjectURL(file);
    setFormData({ ...formData, dzikirPetangAudioUrl: objectUrl });
    setUploadedDzikirPetangFileName(file.name);

    const fd = new FormData();
    fd.append('dzikir_file', file);
    fetch('/api/admin/audio/upload-dzikir-petang', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => { if (d.file_url) setFormData(prev => ({ ...prev, dzikirPetangAudioUrl: d.file_url })); })
      .catch(() => {});
  };

  // ─── Preview handlers ─────────────────────────────────────────────────
  const togglePreview = async () => {
    if (isPreviewPlaying) { previewAudioRef.current?.pause(); setIsPreviewPlaying(false); return; }
    try {
      const audioEl = new Audio(formData.adzanAudioUrl);
      audioEl.volume = formData.volumeAdzan / 100;
      previewAudioRef.current = audioEl;
      audioEl.addEventListener('ended', () => setIsPreviewPlaying(false));
      await audioEl.play();
      setIsPreviewPlaying(true);
    } catch { setUploadError('Autoplay diblokir browser - klik tombol lagi.'); }
  };

  const toggleMurottalPreview = async () => {
    if (isMurottalPreviewPlaying) { previewMurottalAudioRef.current?.pause(); setIsMurottalPreviewPlaying(false); return; }
    try {
      const audioEl = new Audio(formData.murottalAudioUrl);
      audioEl.volume = formData.volumeMurottal / 100;
      previewMurottalAudioRef.current = audioEl;
      audioEl.addEventListener('ended', () => setIsMurottalPreviewPlaying(false));
      await audioEl.play();
      setIsMurottalPreviewPlaying(true);
    } catch { setUploadError('Autoplay diblokir browser - klik tombol lagi.'); }
  };

  const toggleDzikirPagiPreview = async () => {
    if (isDzikirPagiPreviewPlaying) { previewDzikirPagiAudioRef.current?.pause(); setIsDzikirPagiPreviewPlaying(false); return; }
    try {
      const audioEl = new Audio(formData.dzikirPagiAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3');
      audioEl.volume = formData.volumeDzikir / 100;
      previewDzikirPagiAudioRef.current = audioEl;
      audioEl.addEventListener('ended', () => setIsDzikirPagiPreviewPlaying(false));
      await audioEl.play();
      setIsDzikirPagiPreviewPlaying(true);
    } catch { setUploadError('Autoplay diblokir browser - klik tombol lagi.'); }
  };

  const toggleDzikirPetangPreview = async () => {
    if (isDzikirPetangPreviewPlaying) { previewDzikirPetangAudioRef.current?.pause(); setIsDzikirPetangPreviewPlaying(false); return; }
    try {
      const audioEl = new Audio(formData.dzikirPetangAudioUrl || 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3');
      audioEl.volume = formData.volumeDzikir / 100;
      previewDzikirPetangAudioRef.current = audioEl;
      audioEl.addEventListener('ended', () => setIsDzikirPetangPreviewPlaying(false));
      await audioEl.play();
      setIsDzikirPetangPreviewPlaying(true);
    } catch { setUploadError('Autoplay diblokir browser - klik tombol lagi.'); }
  };

  // Duration presets (seconds)
  const durationPresets = [
    { label: '1 Menit', value: 60 },
    { label: '1.5 Menit', value: 90 },
    { label: '2 Menit', value: 120 },
    { label: '2.5 Menit', value: 150 },
    { label: '3 Menit', value: 180 },
    { label: '5 Menit', value: 300 },
  ];

  // Toggle helper component
  const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-emerald-600' : 'bg-slate-700'
      }`}
    >
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="max-w-4xl space-y-6">

      {/* ─── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan Audio Adzan, Murottal & Dzikir</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur audio adzan otomatis, murottal sebelum adzan, serta pemutaran dzikir pagi dan petang.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Pengaturan Tersimpan!</span>
          </div>
        )}
      </div>

      {/* ─── Section 1: Adzan Audio ─────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Radio className="w-4 h-4" />
          <span>Sumber Audio Adzan</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Audio Adzan (MP3/Streaming)</label>
              <input
                type="text"
                value={formData.adzanAudioUrl}
                onChange={(e) => {
                  setFormData({ ...formData, adzanAudioUrl: e.target.value });
                  setUploadedFileName(null);
                }}
                placeholder="https://cdn.islamicfinder.org/audios/adhan/makkah.mp3"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
              />
            </div>

            <button
              type="button"
              onClick={togglePreview}
              className={`mt-5 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isPreviewPlaying
                  ? 'bg-red-600/80 text-white hover:bg-red-600'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isPreviewPlaying ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Preview</>}
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-4 cursor-pointer flex items-center gap-3 transition group"
          >
            <Upload className="w-8 h-8 text-slate-600 group-hover:text-emerald-400 transition" />
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {uploadedFileName ? <span className="text-emerald-400">✓ {uploadedFileName}</span> : <>Unggah file audio adzan lokal</>}
              </p>
              <p className="text-[11px] text-slate-500">Format: MP3, WAV, OGG — Maks. 20MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/50 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Volume Adzan — <span className="text-emerald-400">{formData.volumeAdzan}%</span>
          </label>
          <input
            type="range" min="0" max="100"
            value={formData.volumeAdzan}
            onChange={(e) => setFormData({ ...formData, volumeAdzan: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Durasi Layar Adzan sebelum Iqamah — <span className="text-amber-400">
              {Math.floor(formData.adzanDurationSeconds / 60)} menit {formData.adzanDurationSeconds % 60} detik
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {durationPresets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData({ ...formData, adzanDurationSeconds: p.value })}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  formData.adzanDurationSeconds === p.value
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Section 2: Per-Prayer Adzan Enable/Disable ─────────────── */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-2">
          <ToggleLeft className="w-4 h-4" />
          <span>Aktifkan Adzan Per Waktu Sholat</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRAYERS.map(prayer => {
            const enabled = (formData.enabledPrayersForAdzan ?? []).includes(prayer.key);
            return (
              <div
                key={prayer.key}
                onClick={() => togglePrayerAdzan(prayer.key)}
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                  enabled ? 'bg-emerald-900/20 border-emerald-700/40' : 'bg-slate-950 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{prayer.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{prayer.label}</p>
                    <p className="text-[10px] text-slate-500">{enabled ? 'Audio Aktif' : 'Audio Nonaktif'}</p>
                  </div>
                </div>
                {enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Section 3: Murottal Pre-Adzan ─────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <Music className="w-4 h-4" />
            <span>Murottal Sebelum Adzan</span>
          </h3>
          <Toggle
            checked={formData.murottalEnabled}
            onChange={() => setFormData({ ...formData, murottalEnabled: !formData.murottalEnabled })}
          />
        </div>

        <div className={`space-y-6 transition ${!formData.murottalEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Aktifkan Murottal Per Waktu Sholat
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRAYERS.map(prayer => {
                const enabled = (formData.enabledPrayersForMurottal ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya']).includes(prayer.key);
                return (
                  <div
                    key={prayer.key}
                    onClick={() => togglePrayerMurottal(prayer.key)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                      enabled ? 'bg-cyan-950/30 border-cyan-700/50 text-cyan-200' : 'bg-slate-950 border-slate-800 opacity-60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{prayer.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{prayer.label}</p>
                        <p className="text-[10px] text-slate-400">{enabled ? 'Murottal Aktif' : 'Murottal Nonaktif'}</p>
                      </div>
                    </div>
                    {enabled ? <ToggleRight className="w-5 h-5 text-cyan-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mulai Sebelum Adzan</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="1" max="60"
                  value={formData.murottalBeforeMinutes}
                  onChange={(e) => setFormData({ ...formData, murottalBeforeMinutes: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-bold text-center"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">Menit</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Audio Murottal</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.murottalAudioUrl}
                  onChange={(e) => { setFormData({ ...formData, murottalAudioUrl: e.target.value }); setUploadedMurottalFileName(null); }}
                  placeholder="https://server8.mp3quran.net/afs/018.mp3"
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={toggleMurottalPreview}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                    isMurottalPreviewPlaying ? 'bg-red-600/80 text-white hover:bg-red-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {isMurottalPreviewPlaying ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Preview</>}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <div
                onClick={() => murottalFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-4 cursor-pointer flex items-center gap-3 transition group"
              >
                <Upload className="w-8 h-8 text-slate-600 group-hover:text-cyan-400 transition" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {uploadedMurottalFileName ? <span className="text-cyan-400">✓ {uploadedMurottalFileName}</span> : <>Unggah file audio murottal lokal</>}
                  </p>
                  <p className="text-[11px] text-slate-500">Format: MP3, WAV, OGG — Maks. 20MB</p>
                </div>
                <input
                  ref={murottalFileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                  className="hidden"
                  onChange={handleMurottalFileUpload}
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Volume Murottal — <span className="text-cyan-400">{formData.volumeMurottal}%</span>
              </label>
              <input
                type="range" min="0" max="100"
                value={formData.volumeMurottal}
                onChange={(e) => setFormData({ ...formData, volumeMurottal: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 4: Dzikir Pagi & Petang ─────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <h3 className="text-sm font-bold text-violet-400 border-b border-slate-800 pb-2">
          Dzikir Pagi & Petang Otomatis
        </h3>

        {/* Dzikir Pagi Sub-Section */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Dzikir Pagi Ba'da Subuh</h4>
                <span className="text-[11px] text-slate-400">Diputar otomatis setelah Shalat Subuh</span>
              </div>
            </div>
            <Toggle
              checked={formData.dzikirPagiEnabled}
              onChange={() => setFormData({ ...formData, dzikirPagiEnabled: !formData.dzikirPagiEnabled })}
            />
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition ${!formData.dzikirPagiEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mulai Setelah Subuh</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="1" max="120"
                  value={formData.dzikirPagiAfterMinutes ?? 10}
                  onChange={(e) => setFormData({ ...formData, dzikirPagiAfterMinutes: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-bold text-center"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">Menit</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Audio Dzikir Pagi</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.dzikirPagiAudioUrl ?? ''}
                  onChange={(e) => { setFormData({ ...formData, dzikirPagiAudioUrl: e.target.value }); setUploadedDzikirPagiFileName(null); }}
                  placeholder="https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={toggleDzikirPagiPreview}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                    isDzikirPagiPreviewPlaying ? 'bg-red-600/80 text-white hover:bg-red-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {isDzikirPagiPreviewPlaying ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Preview</>}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <div
                onClick={() => dzikirPagiFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 rounded-2xl p-3 cursor-pointer flex items-center gap-3 transition group"
              >
                <Upload className="w-6 h-6 text-slate-600 group-hover:text-amber-400 transition" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {uploadedDzikirPagiFileName ? <span className="text-amber-400">✓ {uploadedDzikirPagiFileName}</span> : <>Unggah file audio dzikir pagi lokal</>}
                  </p>
                  <p className="text-[10px] text-slate-500">Format: MP3, WAV, OGG — Maks. 20MB</p>
                </div>
                <input
                  ref={dzikirPagiFileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                  className="hidden"
                  onChange={handleDzikirPagiFileUpload}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dzikir Petang Sub-Section */}
        <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-violet-400" />
              <div>
                <h4 className="text-xs font-bold text-white">Dzikir Petang Ba'da Ashar</h4>
                <span className="text-[11px] text-slate-400">Diputar otomatis setelah Shalat Ashar</span>
              </div>
            </div>
            <Toggle
              checked={formData.dzikirPetangEnabled}
              onChange={() => setFormData({ ...formData, dzikirPetangEnabled: !formData.dzikirPetangEnabled })}
            />
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition ${!formData.dzikirPetangEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mulai Setelah Ashar</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="1" max="120"
                  value={formData.dzikirPetangAfterMinutes ?? 10}
                  onChange={(e) => setFormData({ ...formData, dzikirPetangAfterMinutes: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white font-bold text-center"
                />
                <span className="text-xs text-slate-400 whitespace-nowrap">Menit</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">URL Audio Dzikir Petang</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.dzikirPetangAudioUrl ?? ''}
                  onChange={(e) => { setFormData({ ...formData, dzikirPetangAudioUrl: e.target.value }); setUploadedDzikirPetangFileName(null); }}
                  placeholder="https://cdn.islamicfinder.org/audios/dzikir_petang.mp3"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={toggleDzikirPetangPreview}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                    isDzikirPetangPreviewPlaying ? 'bg-red-600/80 text-white hover:bg-red-600' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {isDzikirPetangPreviewPlaying ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Preview</>}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <div
                onClick={() => dzikirPetangFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-violet-500/60 rounded-2xl p-3 cursor-pointer flex items-center gap-3 transition group"
              >
                <Upload className="w-6 h-6 text-slate-600 group-hover:text-violet-400 transition" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {uploadedDzikirPetangFileName ? <span className="text-violet-400">✓ {uploadedDzikirPetangFileName}</span> : <>Unggah file audio dzikir petang lokal</>}
                  </p>
                  <p className="text-[10px] text-slate-500">Format: MP3, WAV, OGG — Maks. 20MB</p>
                </div>
                <input
                  ref={dzikirPetangFileInputRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                  className="hidden"
                  onChange={handleDzikirPetangFileUpload}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Volume Dzikir — <span className="text-violet-400">{formData.volumeDzikir}%</span>
          </label>
          <input
            type="range" min="0" max="100"
            value={formData.volumeDzikir}
            onChange={(e) => setFormData({ ...formData, volumeDzikir: parseInt(e.target.value) })}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
        </div>
      </div>

      {/* ─── Save Button ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Semua Pengaturan Audio</span>
        </button>
      </div>
    </div>
  );
};
