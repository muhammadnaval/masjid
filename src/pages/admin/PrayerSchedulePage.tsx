import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, MapPin, Sliders, Save, Check, Database, Moon, Calendar } from 'lucide-react';
import { PrayerCorrections } from '../../types';
import { formatDates } from '../../utils/hijri';

export const PrayerSchedulePage: React.FC = () => {
  const { location, updateLocation, corrections, updateCorrections, schedule, getAdjustedSchedule, syncFromBackend, profile, updateProfile } = useApp();
  
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>(location.provinceName || 'Sumatera Barat');
  const [selectedCity, setSelectedCity] = useState<string>(location.cityName || 'Kota Padang');
  
  const [formCorrections, setFormCorrections] = useState<PrayerCorrections>(corrections);
  const [hijriCorrection, setHijriCorrection] = useState<number>(profile.hijriCorrection ?? 0);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hijriSavedSuccess, setHijriSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setHijriCorrection(profile.hijriCorrection ?? 0);
  }, [profile.hijriCorrection]);

  // Fetch provinces from backend API on mount
  useEffect(() => {
    fetch('/api/admin/jadwal-sholat/provinsi')
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          setProvinces(data.data);
        }
      })
      .catch(err => console.warn('Gagal memuat provinsi:', err));
  }, []);

  // Fetch cities when selectedProvince changes
  useEffect(() => {
    if (!selectedProvince) return;
    fetch('/api/admin/jadwal-sholat/kabkota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ provinsi: selectedProvince }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.data && Array.isArray(data.data)) {
          const cityList = data.data.map((c: any) => typeof c === 'string' ? c : c.city_name);
          setCities(cityList);
          if (cityList.length > 0 && !cityList.includes(selectedCity)) {
            setSelectedCity(cityList[0]);
          }
        }
      })
      .catch(err => console.warn('Gagal memuat kabupaten/kota:', err));
  }, [selectedProvince]);

  const handleSaveLocation = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/admin/jadwal-sholat/lokasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          province_name: selectedProvince,
          city_name: selectedCity,
          city_code: strToSlug(selectedCity),
        }),
      });
      const data = await res.json();
      updateLocation({
        provinceName: selectedProvince,
        cityName: selectedCity,
        cityCode: strToSlug(selectedCity),
      });
      await syncFromBackend();
      setSyncStatus({ type: 'success', message: data.message || 'Lokasi dan jadwal berhasil disinkronkan dari EQuran.id API.' });
    } catch (e) {
      setSyncStatus({ type: 'error', message: 'Gagal menyambung ke server. Menggunakan jadwal cache.' });
    }
    setIsSyncing(false);
  };

  const handleSyncKemenag = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/admin/jadwal-sholat/sinkronisasi', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      await syncFromBackend();
      setSyncStatus({
        type: data.status === 'error' ? 'error' : 'success',
        message: data.message || 'Sinkronisasi jadwal sholat EQuran.id API berhasil diperbarui.',
      });
    } catch (e) {
      setSyncStatus({ type: 'error', message: 'Sinkronisasi gagal. Pastikan server terhubung ke internet.' });
    }
    setIsSyncing(false);
  };

  const handleCorrectionChange = (key: keyof PrayerCorrections, value: number) => {
    setFormCorrections(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveCorrections = async () => {
    updateCorrections(formCorrections);
    try {
      await fetch('/api/admin/jadwal-sholat/koreksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ corrections: formCorrections }),
      });
    } catch (e) {
      console.warn('API update corrections failed:', e);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveHijriCorrection = async () => {
    updateProfile({ hijriCorrection });
    try {
      await fetch('/api/admin/hijri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ hijri_correction: hijriCorrection }),
      });
    } catch (e) {
      console.warn('API update hijri failed:', e);
    }
    setHijriSavedSuccess(true);
    setTimeout(() => setHijriSavedSuccess(false), 3000);
  };

  const strToSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const adjusted = getAdjustedSchedule();
  const datePreview = formatDates(new Date(), hijriCorrection);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan Jadwal Sholat & Tanggal (Masehi / Hijriyah)</span>
          </h2>
          <p className="text-xs text-slate-400">Jadwal sholat otomatis diambil dari <strong>API Resmi EQuran.id (https://equran.id/apidev/shalat)</strong> seluruh kota/kabupaten di Indonesia.</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Perubahan Tersimpan!</span>
          </div>
        )}
      </div>

      {/* Location Picker & Sync Button */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <MapPin className="w-4 h-4" />
            <h3>Pilihan Wilayah & Kota/Kabupaten (EQuran.id API)</h3>
          </div>

          <button
            type="button"
            onClick={handleSyncKemenag}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang API Kemenag'}</span>
          </button>
        </div>

        {syncStatus && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            syncStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
          }`}>
            <span>{syncStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Provinsi</label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {provinces.length > 0 ? (
                provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))
              ) : (
                <option value={selectedProvince}>{selectedProvince}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Kota / Kabupaten</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              {cities.length > 0 ? (
                cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))
              ) : (
                <option value={selectedCity}>{selectedCity}</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={isSyncing}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Terapkan & Load Jadwal Kota Ini</span>
          </button>
        </div>
      </div>

      {/* Schedule Table Preview */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Pratinjau Jadwal Sholat Hari Ini ({schedule.date})</h3>
            <span className="text-xs text-emerald-400 font-semibold">{location.cityName}, {location.provinceName}</span>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-semibold border border-slate-700">
            Sumber: {schedule.source || 'API Resmi EQuran.id (Kemenag RI)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { key: 'subuh', label: 'Subuh', raw: schedule.subuh, adj: adjusted.subuh },
            { key: 'syuruq', label: 'Syuruq', raw: schedule.syuruq, adj: adjusted.syuruq },
            { key: 'dzuhur', label: 'Dzuhur', raw: schedule.dzuhur, adj: adjusted.dzuhur },
            { key: 'ashar', label: 'Ashar', raw: schedule.ashar, adj: adjusted.ashar },
            { key: 'maghrib', label: 'Maghrib', raw: schedule.maghrib, adj: adjusted.maghrib },
            { key: 'isya', label: 'Isya', raw: schedule.isya, adj: adjusted.isya },
          ].map(p => (
            <div key={p.key} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">{p.label}</span>
              <span className="text-sm font-bold text-emerald-400 block mt-1">{p.adj}</span>
              <span className="text-[10px] text-slate-500 block">Asli: {p.raw}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Correction Form */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4" />
          <h3>Koreksi Menit Manual (Menambah / Mengurangi Menit Waktu Sholat)</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(['subuh', 'syuruq', 'dzuhur', 'ashar', 'maghrib', 'isya'] as (keyof PrayerCorrections)[]).map((prayer) => (
            <div key={prayer} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs uppercase font-bold text-slate-400 mb-1">{prayer}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formCorrections[prayer]}
                  onChange={(e) => handleCorrectionChange(prayer, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white text-center font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-semibold">Menit</span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Hasil:</span>
                <span className="font-bold text-amber-300">{adjusted[prayer]}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={handleSaveCorrections}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Koreksi Sholat</span>
          </button>
        </div>
      </div>

      {/* ─── Hijri Date & Correction Form ─────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
            <Moon className="w-4 h-4" />
            <h3>Pengaturan Tanggal Masehi & Koreksi Tanggal Hijriyah (+/- Hari)</h3>
          </div>

          {hijriSavedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>Koreksi Hijriyah Tersimpan!</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Quick preset buttons */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase">
              Pilih Koreksi Hari Hijriyah (Offset)
            </label>
            <div className="flex flex-wrap gap-2">
              {[-2, -1, 0, 1, 2].map((offset) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => setHijriCorrection(offset)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    hijriCorrection === offset
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  {offset > 0 ? `+${offset} Hari` : offset === 0 ? '0 Hari (Default)' : `${offset} Hari`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Gunakan koreksi ini jika hilal atau pengumuman pemerintah menggeser tanggal Hijriyah 1-2 hari.
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
              Pratinjau Tampilan Tanggal Layar TV
            </span>
            <div className="flex items-center gap-2 text-sm text-slate-200 font-semibold">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{datePreview.formattedMasehi}</span>
            </div>
            <div className="flex items-center gap-2 text-base font-bold text-amber-300 font-arabic">
              <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{datePreview.formattedHijri}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSaveHijriCorrection}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Koreksi Hijriyah</span>
          </button>
        </div>
      </div>
    </div>
  );
};
