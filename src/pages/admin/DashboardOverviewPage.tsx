import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import {
  Tv,
  Clock,
  ImageIcon,
  Type,
  Palette,
  MapPin,
  CheckCircle,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const DashboardOverviewPage: React.FC = () => {
  const { profile, location, getAdjustedSchedule, mediaItems, runningTexts, theme } = useApp();
  const schedule = getAdjustedSchedule();

  const [latestLog, setLatestLog] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/logs/latest')
      .then(r => r.json())
      .then(d => {
        if (d.latest) setLatestLog(d.latest);
      })
      .catch(() => {});
  }, []);

  const activeMediaCount = mediaItems.filter(m => m.isActive).length;
  const activeTextCount = runningTexts.filter(t => t.isActive).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 p-6 lg:p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-semibold mb-3">
            <CheckCircle className="w-3.5 h-3.5" />
            Sistem Jam Digital Masjid Siap Digunakan
          </span>
          <h2 className="text-2xl lg:text-3xl font-black text-white">{profile.name}</h2>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">{profile.address}</p>
        </div>

        <Link
          to="/display"
          target="_blank"
          className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-2xl flex items-center gap-2 shadow-xl shrink-0 transition"
        >
          <Tv className="w-5 h-5" />
          <span>Lihat Tampilan TV Display</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Status Log & System Health */}
      {latestLog && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs font-semibold ${
          latestLog.status === 'failed'
            ? 'bg-red-950/40 border-red-500/40 text-red-300'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {latestLog.status === 'failed' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>
              <strong>Status Log Sinkronisasi:</strong> {latestLog.message}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            {new Date(latestLog.created_at || Date.now()).toLocaleTimeString('id-ID')} WIB
          </span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Kota / Lokasi Aktif</span>
            <h4 className="text-lg font-bold text-white mt-1">{location.cityName}</h4>
            <span className="text-[11px] text-emerald-400 font-semibold">{location.provinceName}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Slide Media Aktif</span>
            <h4 className="text-2xl font-black text-white mt-1">{activeMediaCount} Slide</h4>
            <span className="text-[11px] text-amber-400 font-semibold">Total {mediaItems.length} Konten</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ImageIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Running Text</span>
            <h4 className="text-2xl font-black text-white mt-1">{activeTextCount} Teks</h4>
            <span className="text-[11px] text-cyan-400 font-semibold">Berjalan di TV Footer</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Type className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Tema Tampilan</span>
            <h4 className="text-base font-bold text-white mt-1 truncate max-w-[140px]">{theme.name}</h4>
            <span className="text-[11px] text-emerald-400 font-semibold">Presisi TV 16:9</span>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <Palette className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Today's Prayer Schedule Summary */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Clock className="w-5 h-5" />
            <h3>Jadwal Sholat Hari Ini (Setelah Koreksi Waktu)</h3>
          </div>
          <Link to="/admin/jadwal-sholat" className="text-xs font-bold text-emerald-400 hover:underline">
            Ubah Lokasi & Koreksi →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Subuh</span>
            <span className="text-xl font-bold text-emerald-300 font-display mt-1 block">{schedule.subuh}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Syuruq</span>
            <span className="text-xl font-bold text-amber-300 font-display mt-1 block">{schedule.syuruq}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Dzuhur</span>
            <span className="text-xl font-bold text-emerald-300 font-display mt-1 block">{schedule.dzuhur}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Ashar</span>
            <span className="text-xl font-bold text-emerald-300 font-display mt-1 block">{schedule.ashar}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Maghrib</span>
            <span className="text-xl font-bold text-emerald-300 font-display mt-1 block">{schedule.maghrib}</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Isya</span>
            <span className="text-xl font-bold text-emerald-300 font-display mt-1 block">{schedule.isya}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
