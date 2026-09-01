import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, CheckCircle2, Clock, ShieldAlert, Save, Eye, Tv } from 'lucide-react';
import { SyuruqOverlay } from '../../components/display/Overlays/SyuruqOverlay';

export const SyuruqSettingsPage: React.FC = () => {
  const { syuruqSetting, updateSyuruqSetting, getAdjustedSchedule, setSimulatorMode, simulator } = useApp();
  const adjustedSchedule = getAdjustedSchedule();

  const [isEnabled, setIsEnabled] = useState<boolean>(syuruqSetting.isEnabled);
  const [durationMinutes, setDurationMinutes] = useState<number>(syuruqSetting.durationMinutes);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  React.useEffect(() => {
    if (simulator.currentMode !== 'syuruq') {
      setShowPreviewModal(false);
    }
  }, [simulator.currentMode]);

  const handleOpenPreviewModal = () => {
    setSimulatorMode('syuruq');
    setShowPreviewModal(true);
  };

  const handleClosePreviewModal = () => {
    setSimulatorMode('normal');
    setShowPreviewModal(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/admin/syuruq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          is_enabled: isEnabled,
          duration_minutes: durationMinutes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          updateSyuruqSetting({
            isEnabled: data.syuruq.is_enabled,
            durationMinutes: data.syuruq.duration_minutes,
          });
          setToastMessage('Pengaturan Syuruq berhasil disimpan ke database!');
        }
      } else {
        updateSyuruqSetting({ isEnabled, durationMinutes });
        setToastMessage('Pengaturan Syuruq berhasil disimpan!');
      }
    } catch (err) {
      updateSyuruqSetting({ isEnabled, durationMinutes });
      setToastMessage('Pengaturan Syuruq disimpan secara lokal.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Interactive Syuruq Overlay Preview Modal */}
      {(showPreviewModal || simulator.currentMode === 'syuruq') && (
        <div className="relative z-50">
          <SyuruqOverlay />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <Sun className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Pengaturan Pengingat Syuruq</h2>
            <p className="text-xs text-slate-400 mt-1">
              Atur layar pengingat terbit matahari (Syuruq) dan larangan shalat saat syuruq.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPreviewModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Layar Syuruq</span>
          </button>
          
          <a
            href="/display"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setSimulatorMode('syuruq')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 transition"
          >
            <Tv className="w-4 h-4" />
            <span>Buka Layar TV</span>
          </a>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 font-semibold text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Toggle Syuruq */}
        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <label className="text-sm font-bold text-white block">Aktifkan Layar Pengingat Syuruq</label>
              <span className="text-xs text-slate-400">
                Tampilkan layar khusus peringatan waktu terlarang shalat saat terbit matahari.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Durasi Menit */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Durasi Layar Syuruq Tampil (Menit)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={60}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 10)}
              className="w-32 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-amber-500"
              required
            />
            <span className="text-xs text-slate-400">
              (Layar akan otomatis kembali ke display utama setelah {durationMinutes} menit)
            </span>
          </div>
        </div>

        {/* Summary Preview Box */}
        <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Status & Waktu Terkoreksi</h4>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-300">Waktu Syuruq Hari Ini:</span>
            <span className="font-bold text-white font-mono bg-slate-800 px-3 py-1 rounded-lg">
              {adjustedSchedule.syuruq} WIB
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-slate-300">Mode Pengingat:</span>
            <span className={`font-bold ${isEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isEnabled ? `Aktif (${durationMinutes} Menit)` : 'Non-Aktif'}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Syuruq'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
