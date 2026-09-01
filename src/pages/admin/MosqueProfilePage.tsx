import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Save, Building2, Check } from 'lucide-react';
import { FileUpload } from '../../components/admin/FileUpload';

export const MosqueProfilePage: React.FC = () => {
  const { profile, updateProfile } = useApp();
  const [formData, setFormData] = useState(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    updateProfile(formData);

    // Live API update to Laravel backend
    try {
      await fetch('/api/admin/profil-masjid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          contact: formData.contact,
          timezone: formData.timezone,
          logo_path: formData.logoPath,
          background_path: formData.backgroundPath,
        }),
      });
    } catch (err) {
      console.warn('Backend update failed, saved to local state:', err);
    }

    setIsSubmitting(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan Identitas & Profil Masjid</span>
          </h2>
          <p className="text-xs text-slate-400">Atur nama masjid, alamat lengkap, kontak, serta logo dan foto background TV.</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Profil Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Masjid / Musholla *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Lengkap *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Informasi Kontak / Sosial Media</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Zona Waktu</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Asia/Jakarta">WIB — Asia/Jakarta</option>
                <option value="Asia/Makassar">WITA — Asia/Makassar</option>
                <option value="Asia/Jayapura">WIT — Asia/Jayapura</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div>
              <FileUpload
                label="Upload Logo Masjid (PNG / SVG / JPG)"
                value={formData.logoPath}
                onChange={(url) => setFormData({ ...formData, logoPath: url })}
                allowedTypes={['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']}
                maxSizeMB={5}
              />
              <input
                type="text"
                value={formData.logoPath}
                onChange={(e) => setFormData({ ...formData, logoPath: e.target.value })}
                placeholder="atau masukkan URL Logo"
                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <FileUpload
                label="Upload Background foto Masjid (16:9 HD)"
                value={formData.backgroundPath}
                onChange={(url) => setFormData({ ...formData, backgroundPath: url })}
                allowedTypes={['image/png', 'image/jpeg', 'image/webp']}
                maxSizeMB={10}
              />
              <input
                type="text"
                value={formData.backgroundPath}
                onChange={(e) => setFormData({ ...formData, backgroundPath: e.target.value })}
                placeholder="atau masukkan URL Background"
                className="w-full mt-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
