import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Type, Plus, Trash2, Eye, EyeOff, Edit2, Check, Bell, Save } from 'lucide-react';
import { RunningTextItem } from '../../types';

export const RunningTextPage: React.FC = () => {
  const { runningTexts, addRunningText, updateRunningText, deleteRunningText } = useApp();

  const [text, setText] = useState('');
  const [category, setCategory] = useState<'umum' | 'donasi' | 'kajian' | 'himbauan'>('umum');
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  const [editingItem, setEditingItem] = useState<RunningTextItem | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (editingItem) {
      updateRunningText(editingItem.id, {
        text,
        category,
        speed,
      });

      try {
        await fetch(`/api/admin/running-text/${editingItem.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            text,
            category,
            speed,
          }),
        });
      } catch (_) {}

      setEditingItem(null);
    } else {
      const newItemData = {
        text,
        speed,
        category,
        isActive: true,
      };

      addRunningText(newItemData);

      try {
        await fetch('/api/admin/running-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            text,
            speed,
            category,
            is_active: true,
          }),
        });
      } catch (_) {}
    }

    setText('');
    setCategory('umum');
    setSpeed('normal');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleEdit = (item: RunningTextItem) => {
    setEditingItem(item);
    setText(item.text);
    setCategory(item.category || 'umum');
    setSpeed(item.speed || 'normal');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setText('');
    setCategory('umum');
    setSpeed('normal');
  };

  const activeTexts = runningTexts.filter(t => t.isActive);
  const hasSlow = activeTexts.some(t => t.speed === 'slow');
  const hasFast = activeTexts.some(t => t.speed === 'fast');

  let speedSeconds = 30;
  if (hasSlow && !hasFast) {
    speedSeconds = 60;
  } else if (hasFast && !hasSlow) {
    speedSeconds = 15;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Type className="w-5 h-5 text-emerald-400" />
            <span>Manajemen Running Text Footer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Atur teks running pengumuman, himbauan HP, jadwal kajian, dan donasi yang berjalan di bagian bawah TV display.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Running Text Tersimpan!</span>
          </div>
        )}
      </div>

      {/* Live Preview Bar */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-amber-400" /> Live Preview Running Text Display
        </span>
        <div className="w-full bg-slate-900 border border-emerald-500/40 p-3 rounded-2xl flex items-center overflow-hidden shadow-xl">
          <div className="flex items-center gap-2 bg-emerald-600 px-3 py-1 rounded-lg text-white font-bold text-xs uppercase shrink-0 mr-4">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>Preview</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <div
              className="animate-marquee text-sm text-slate-100 flex items-center gap-6 whitespace-nowrap font-medium"
              style={{ animationDuration: `${speedSeconds}s` }}
            >
              {activeTexts.length > 0 ? (
                activeTexts.map((item, idx) => (
                  <span key={item.id} className="inline-flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-semibold uppercase">
                      {item.category || 'umum'}
                    </span>
                    <span>{item.text}</span>
                    {idx < activeTexts.length - 1 && <span className="text-amber-400 font-bold mx-2">✦</span>}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">Belum ada running text aktif</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Add / Edit */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-emerald-400">
          {editingItem ? 'Edit Running Text' : 'Tambah Running Text Baru'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Isi Teks Running</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik isi pengumuman running text..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kategori Pengumuman</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="umum">Umum</option>
              <option value="himbauan">Himbauan</option>
              <option value="kajian">Agenda Kajian</option>
              <option value="donasi">Donasi</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Kecepatan</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="slow">Lambat</option>
              <option value="normal">Normal</option>
              <option value="fast">Cepat</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {editingItem && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
            >
              Batal
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            {editingItem ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingItem ? 'Simpan Perubahan' : 'Tambah Running Text'}</span>
          </button>
        </div>
      </form>

      {/* Item List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Daftar Running Text</h3>

        <div className="space-y-3">
          {runningTexts.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 ${
                item.isActive ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-950/40 border-slate-900 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold uppercase shrink-0">
                  {item.category || 'umum'}
                </span>
                <p className="text-sm text-slate-200 truncate font-medium">{item.text}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                  title="Edit Teks"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => updateRunningText(item.id, { isActive: !item.isActive })}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {item.isActive ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRunningText(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
