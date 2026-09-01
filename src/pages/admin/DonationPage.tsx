import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCode, Save, Check, Upload, ToggleLeft, ToggleRight, Eye } from 'lucide-react';

export const DonationPage: React.FC = () => {
  const { donation, updateDonation } = useApp();
  const [formData, setFormData] = useState(donation);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(donation);
  }, [donation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateDonation(formData);

    try {
      await fetch('/api/admin/donasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          bank_name: formData.bankName,
          account_name: formData.accountName,
          account_number: formData.accountNumber,
          qr_code_path: formData.qrCodePath,
          is_active: formData.isActive ?? true,
        }),
      });
    } catch (_) {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Ukuran file QR code terlalu besar. Maksimum 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, qrCodePath: previewUrl }));
    setUploadedFileName(file.name);

    const fd = new FormData();
    fd.append('qr_file', file);

    fetch('/api/admin/donasi/upload-qr', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => {
        if (d.file_url) {
          setFormData(prev => ({ ...prev, qrCodePath: d.file_url }));
        }
      })
      .catch(() => {});
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan QR Code Donasi & Infaq Digital</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur program donasi, nomor rekening bank/e-wallet, serta QR Code QRIS yang tampil di rotasi display TV.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Donasi Tersimpan!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Settings */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          {/* Master Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div>
              <h4 className="text-sm font-bold text-white">Status Tampil Donasi</h4>
              <p className="text-xs text-slate-400">Aktifkan agar slide QR Donasi muncul di rotasi TV display.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className="text-emerald-400 focus:outline-none"
            >
              {formData.isActive ? (
                <ToggleRight className="w-10 h-10 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Program Donasi</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Himbauan Donasi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Bank / E-Wallet</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Rekening</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Atas Nama (a.n.)</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">URL Gambar QR Code QRIS</label>
                <input
                  type="text"
                  value={formData.qrCodePath}
                  onChange={(e) => setFormData({ ...formData, qrCodePath: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-2xl p-4 cursor-pointer flex items-center gap-3 transition group bg-slate-950/60"
              >
                <Upload className="w-7 h-7 text-slate-600 group-hover:text-emerald-400 transition" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    {uploadedFileName ? <span className="text-emerald-400">✓ {uploadedFileName}</span> : <>Unggah file QR Code lokal (QRIS)</>}
                  </p>
                  <p className="text-[10px] text-slate-500">Format: JPG, PNG, WebP — Maks. 10MB</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQrFileUpload}
              />

              {uploadError && (
                <p className="text-xs text-red-400">{uploadError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Donasi</span>
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-emerald-400" /> Live Preview Tampilan TV Display
          </div>

          <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-3xl shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold">
                <QrCode className="w-3.5 h-3.5" /> Infaq & Sedekah Digital
              </span>

              <h3 className="text-xl font-black text-white">{formData.title || 'Judul Program Donasi'}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{formData.description || 'Deskripsi program donasi...'}</p>

              <div className="bg-slate-950/80 border border-amber-500/20 p-3.5 rounded-2xl space-y-1 text-xs">
                <span className="text-slate-400 block">Transfer Rekening:</span>
                <span className="text-xs font-bold text-amber-300 block">{formData.bankName}</span>
                <span className="text-base font-black font-mono text-white tracking-wider block">{formData.accountNumber}</span>
                <span className="text-slate-300 text-[11px] block">a.n. {formData.accountName}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-3 rounded-2xl border-4 border-amber-400 shadow-xl">
              <img
                src={formData.qrCodePath}
                alt="QR Code Preview"
                className="w-36 h-36 object-contain"
              />
              <span className="text-[10px] font-black text-slate-900 mt-1 uppercase tracking-wider">Scan QRIS Untuk Donasi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
