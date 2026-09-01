import React, { useState } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  maxSizeMB = 5
}) => {
  const [error, setError] = useState<string>('');

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file terlalu besar! Maksimal ${maxSizeMB} MB.`);
      return;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      setError(`Format file tidak didukung! Format yang diperbolehkan: JPG, PNG, WebP, SVG.`);
      return;
    }

    setError('');
    // Create blob URL for immediate preview prototype
    const previewUrl = URL.createObjectURL(file);
    onChange(previewUrl);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>

      {error && (
        <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value ? (
        <div className="relative group rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 p-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src={value} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">{value}</span>
              <span className="text-[11px] text-emerald-400 font-semibold">File Berhasil Dimuat</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white rounded-lg transition"
            title="Hapus / Ganti File"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-950/60 p-5 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center group">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 group-hover:text-emerald-400 mb-2 transition">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-200">Klik atau tarik file ke sini untuk mengunggah</span>
          <span className="text-[11px] text-slate-500 mt-0.5">Format: JPG, PNG, WebP, SVG (Maksimal {maxSizeMB} MB)</span>

          <input
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleSimulatedUpload}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};
