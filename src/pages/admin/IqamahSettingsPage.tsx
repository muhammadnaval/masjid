import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hourglass, Save, Check, Compass, RefreshCw, Clock,
  ToggleLeft, ToggleRight, Eye
} from 'lucide-react';
import { IqamahSettings } from '../../types';

type PrayerKey = 'subuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

const PRAYER_CONFIG: { key: PrayerKey; label: string; icon: string; color: string }[] = [
  { key: 'subuh',   label: 'Subuh',   icon: '🌙', color: 'indigo' },
  { key: 'dzuhur',  label: 'Dzuhur',  icon: '☀️', color: 'emerald' },
  { key: 'ashar',   label: 'Ashar',   icon: '🌤️', color: 'yellow' },
  { key: 'maghrib', label: 'Maghrib', icon: '🌅', color: 'orange' },
  { key: 'isya',    label: 'Isya',    icon: '⭐', color: 'violet' },
];

const colorMap: Record<string, string> = {
  indigo:  'border-indigo-500/40 bg-indigo-900/20 text-indigo-300',
  emerald: 'border-emerald-500/40 bg-emerald-900/20 text-emerald-300',
  yellow:  'border-yellow-500/40 bg-yellow-900/20 text-yellow-300',
  orange:  'border-orange-500/40 bg-orange-900/20 text-orange-300',
  violet:  'border-violet-500/40 bg-violet-900/20 text-violet-300',
};

export const IqamahSettingsPage: React.FC = () => {
  const { iqamah, updateIqamah, getAdjustedSchedule, setSimulatorMode } = useApp();
  const [formData, setFormData] = useState<IqamahSettings>(iqamah);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [previewPrayer, setPreviewPrayer] = useState<PrayerKey | null>(null);

  const [fridayState, setFridayState] = useState({
    isEnabled: true,
    disableIqamahOnFriday: true,
    khutbahTitle: "Khutbah & Shalat Jum'at",
    khutbahKhatib: "Ustadz Dr. H. Ahmad Fauzi, M.A.",
    khutbahImam: "Ustadz Muhammad Ridwan",
    khutbahDurationMinutes: 35,
  });

  // Keep form in sync if context changes externally
  useEffect(() => { setFormData(iqamah); }, [iqamah]);

  useEffect(() => {
    fetch('/api/admin/friday')
      .then(r => r.json())
      .then(d => {
        if (d.friday) {
          setFridayState({
            isEnabled: d.friday.is_enabled ?? true,
            disableIqamahOnFriday: d.friday.disable_iqamah_on_friday ?? true,
            khutbahTitle: d.friday.khutbah_title || "Khutbah & Shalat Jum'at",
            khutbahKhatib: d.friday.khutbah_khatib || "Ustadz Dr. H. Ahmad Fauzi, M.A.",
            khutbahImam: d.friday.khutbah_imam || "Ustadz Muhammad Ridwan",
            khutbahDurationMinutes: d.friday.khutbah_duration_minutes ?? 35,
          });
        }
      })
      .catch(() => {});
  }, []);

  const schedule = getAdjustedSchedule();

  const handleToggle = (prayer: PrayerKey) => {
    setFormData(prev => ({
      ...prev,
      [prayer]: { ...prev[prayer], enabled: !prev[prayer].enabled }
    }));
  };

  const handleDuration = (prayer: PrayerKey, mins: number) => {
    const clamped = Math.min(60, Math.max(1, mins));
    setFormData(prev => ({
      ...prev,
      [prayer]: { ...prev[prayer], durationMinutes: clamped }
    }));
  };

  // Compute iqamah time from adjusted schedule + duration
  const getIqamahTime = (prayer: PrayerKey): string => {
    const timeStr = schedule[prayer as keyof typeof schedule] as string;
    if (!timeStr || typeof timeStr !== 'string') return '--:--';
    const [h, m] = timeStr.split(':').map(Number);
    const dur = formData[prayer].durationMinutes;
    const total = h * 60 + m + dur;
    const rh = Math.floor(total / 60) % 24;
    const rm = total % 60;
    return `${String(rh).padStart(2, '0')}:${String(rm).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    updateIqamah(formData);

    // Persist to backend
    try {
      const payload = PRAYER_CONFIG.map(p => ({
        prayer_name:      p.key,
        duration_minutes: formData[p.key].durationMinutes,
        is_enabled:       formData[p.key].enabled,
      }));

      await fetch('/api/admin/iqamah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ iqamah: payload, friday_mode_disabled: formData.fridayModeDisabled }),
      });

      await fetch('/api/admin/friday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          is_enabled: fridayState.isEnabled,
          disable_iqamah_on_friday: fridayState.disableIqamahOnFriday,
          khutbah_title: fridayState.khutbahTitle,
          khutbah_khatib: fridayState.khutbahKhatib,
          khutbah_imam: fridayState.khutbahImam,
          khutbah_duration_minutes: fridayState.khutbahDurationMinutes,
        }),
      });
    } catch (_) {
      // Offline — saved to localStorage via context
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSyncFromBackend = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/iqamah', { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.iqamah) {
          const iq = data.iqamah;
          const merged: IqamahSettings = {
            ...formData,
            subuh:   iq.subuh   ? { enabled: !!iq.subuh.is_enabled,   durationMinutes: iq.subuh.duration_minutes   } : formData.subuh,
            dzuhur:  iq.dzuhur  ? { enabled: !!iq.dzuhur.is_enabled,  durationMinutes: iq.dzuhur.duration_minutes  } : formData.dzuhur,
            ashar:   iq.ashar   ? { enabled: !!iq.ashar.is_enabled,   durationMinutes: iq.ashar.duration_minutes   } : formData.ashar,
            maghrib: iq.maghrib ? { enabled: !!iq.maghrib.is_enabled, durationMinutes: iq.maghrib.duration_minutes } : formData.maghrib,
            isya:    iq.isya    ? { enabled: !!iq.isya.is_enabled,    durationMinutes: iq.isya.duration_minutes    } : formData.isya,
          };
          setFormData(merged);
          updateIqamah(merged);
        }
      }
    } catch (_) {}
    setIsSyncing(false);
  };

  // Toggle helper
  const Toggle: React.FC<{ checked: boolean; onChange: () => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      onClick={!disabled ? onChange : undefined}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors focus:outline-none ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`}
    >
      <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="max-w-4xl space-y-6">

      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-amber-400" />
            <span>Pengaturan Countdown Iqamah</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur durasi hitung mundur dan aktifkan/nonaktifkan iqamah untuk setiap waktu sholat.
            Tampilan akan otomatis beralih ke mode normal setelah countdown selesai.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSyncFromBackend}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sinkron...' : 'Sinkron DB'}
          </button>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>Tersimpan!</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Per-Prayer Iqamah Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRAYER_CONFIG.map(prayer => {
          const setting  = formData[prayer.key];
          const enabled  = setting.enabled;
          const iqTime   = getIqamahTime(prayer.key);
          const adznTime = schedule[prayer.key as keyof typeof schedule] as string;
          const isPreviewing = previewPrayer === prayer.key;

          return (
            <div
              key={prayer.key}
              className={`relative p-5 rounded-3xl border transition ${
                enabled
                  ? `${colorMap[prayer.color]} border`
                  : 'bg-slate-950 border-slate-800 opacity-60'
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{prayer.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{prayer.label}</h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                      {enabled ? 'Iqamah Aktif' : 'Iqamah Nonaktif'}
                    </span>
                  </div>
                </div>
                <Toggle checked={enabled} onChange={() => handleToggle(prayer.key)} />
              </div>

              {/* Adzan → Iqamah timeline */}
              <div className="mb-4 p-3 bg-black/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Adzan</span>
                  <span className="text-white font-mono font-bold">{adznTime}</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (setting.durationMinutes / 15) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-semibold">Iqamah</span>
                  <span className={`font-mono font-bold ${enabled ? 'text-amber-300' : 'text-slate-500'}`}>
                    {enabled ? iqTime : '--:--'}
                  </span>
                </div>
              </div>

              {/* Duration input */}
              <div className={`transition ${!enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Durasi Countdown
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuration(prayer.key, setting.durationMinutes - 1)}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition flex items-center justify-center text-lg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={setting.durationMinutes}
                    onChange={(e) => handleDuration(prayer.key, parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-black text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleDuration(prayer.key, setting.durationMinutes + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold hover:bg-slate-800 transition flex items-center justify-center text-lg"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400 whitespace-nowrap">Menit</span>
                </div>
              </div>

              {/* Preview button */}
              <button
                onClick={() => setPreviewPrayer(isPreviewing ? null : prayer.key)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 rounded-xl transition"
              >
                <Eye className="w-3 h-3" />
                {isPreviewing ? 'Tutup Preview' : 'Lihat Preview'}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─── Inline Preview Panel ───────────────────────────────── */}
      {previewPrayer && (
        <div className="relative bg-slate-950 border border-amber-500/30 rounded-3xl p-6 flex flex-col items-center gap-4 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
          </div>
          <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> Preview Layar Iqamah — {previewPrayer.toUpperCase()}
          </span>

          {/* Mini countdown ring */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="#f59e0b" strokeWidth="6"
                      strokeLinecap="round" strokeDasharray="276" strokeDashoffset="69" />
            </svg>
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-white">
                {String(formData[previewPrayer].durationMinutes).padStart(2, '0')}:00
              </div>
              <div className="text-[10px] text-amber-300 font-semibold uppercase tracking-wide mt-1">
                Menuju Iqamah
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-base font-bold text-white">Countdown Iqamah {previewPrayer.charAt(0).toUpperCase() + previewPrayer.slice(1)}</p>
            <p className="text-xs text-slate-400 mt-1">
              Adzan {schedule[previewPrayer as keyof typeof schedule] as string} →
              Iqamah {getIqamahTime(previewPrayer)} ({formData[previewPrayer].durationMinutes} menit)
            </p>
          </div>
        </div>
      )}

      {/* ─── Friday Mode Settings ───────────────────────────────────────── */}
      <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-3xl space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-900/40 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pengaturan Fitur & Mode Shalat Jum'at</h3>
              <p className="text-xs text-slate-400">
                Atur pengalihan layar khusus saat Khutbah & Shalat Jum'at serta penonaktifan countdown iqamah Dzuhur.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFridayState(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
              className="text-emerald-400 focus:outline-none"
            >
              {fridayState.isEnabled ? (
                <ToggleRight className="w-10 h-10 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold text-white">Nonaktifkan Countdown Iqamah Dzuhur di Hari Jum'at</h4>
              <p className="text-[11px] text-slate-400">Saat Hari Jum'at, countdown iqamah Dzuhur ditiadakan dan langsung masuk mode layar Khutbah.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFridayState(prev => ({ ...prev, disableIqamahOnFriday: !prev.disableIqamahOnFriday }));
                setFormData(prev => ({ ...prev, fridayModeDisabled: !prev.fridayModeDisabled }));
              }}
              className="text-emerald-400 focus:outline-none"
            >
              {fridayState.disableIqamahOnFriday ? (
                <ToggleRight className="w-8 h-8 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Khutbah Jum'at</label>
              <input
                type="text"
                value={fridayState.khutbahTitle}
                onChange={(e) => setFridayState({ ...fridayState, khutbahTitle: e.target.value })}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi Layar Khutbah (Menit)</label>
              <input
                type="number"
                value={fridayState.khutbahDurationMinutes}
                onChange={(e) => setFridayState({ ...fridayState, khutbahDurationMinutes: parseInt(e.target.value) || 35 })}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold text-center"
                min="5"
                max="120"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Khatib Jum'at</label>
              <input
                type="text"
                value={fridayState.khutbahKhatib}
                onChange={(e) => setFridayState({ ...fridayState, khutbahKhatib: e.target.value })}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ustadz Dr. H. Ahmad Fauzi, M.A."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Imam Shalat Jum'at</label>
              <input
                type="text"
                value={fridayState.khutbahImam}
                onChange={(e) => setFridayState({ ...fridayState, khutbahImam: e.target.value })}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Ustadz Muhammad Ridwan"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSimulatorMode('friday_khutbah');
                window.open('/display', '_blank');
              }}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Uji Coba Tampilan Mode Jum'at (Buka Display Mode Khutbah)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Info Box ──────────────────────────────────────────── */}
      <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300/80 flex items-start gap-2">
        <Hourglass className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300">Alur Display:</strong> Adzan berkumandang → Layar Adzan tampil selama durasi audio adzan →
          Otomatis beralih ke <em>Layar Countdown Iqamah</em> dengan timer hitung mundur →
          Setelah 00:00, kembali ke tampilan normal atau mode Khutbah (Jum'at).
        </div>
      </div>

      {/* ─── Save Button ───────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Iqamah'}</span>
        </button>
      </div>
    </div>
  );
};
