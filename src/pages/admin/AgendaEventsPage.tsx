import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Plus, Trash2, Edit2, Check, Sparkles, MapPin, Clock, Save } from 'lucide-react';
import { AgendaItem } from '../../types';

export const AgendaEventsPage: React.FC = () => {
  const { agendaItems, addAgendaItem, updateAgendaItem, deleteAgendaItem } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:30');
  const [location, setLocation] = useState('Masjid Al-Hidayah Siteba');
  const [description, setDescription] = useState('');
  const [isHoliday, setIsHoliday] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setDate('');
    setTime('18:30');
    setLocation('Masjid Al-Hidayah Siteba');
    setDescription('');
    setIsHoliday(false);
    setShowModal(true);
  };

  const openEditModal = (item: AgendaItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time || '18:30');
    setLocation(item.location || 'Masjid Al-Hidayah Siteba');
    setDescription(item.description || '');
    setIsHoliday(item.isIslamicHoliday || false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    if (editingItem) {
      updateAgendaItem(editingItem.id, {
        title,
        date,
        time,
        location,
        description,
        isIslamicHoliday: isHoliday,
      });

      try {
        await fetch(`/api/admin/agenda/${editingItem.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            title,
            date,
            time,
            location,
            description,
            is_islamic_holiday: isHoliday,
          }),
        });
      } catch (_) {}
    } else {
      const newItemData = {
        title,
        date,
        time,
        location,
        description,
        isIslamicHoliday: isHoliday,
        isActive: true,
      };

      addAgendaItem(newItemData);

      try {
        await fetch('/api/admin/agenda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            title,
            date,
            time,
            location,
            description,
            is_islamic_holiday: isHoliday,
            is_active: true,
          }),
        });
      } catch (_) {}
    }

    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <span>Manajemen Agenda Masjid & Hari Besar Islam</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola agenda mendatang, jadwal kegiatan santunan, serta peringatan dan notifikasi hari besar Islam.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
              <Check className="w-4 h-4" />
              <span>Agenda Tersimpan!</span>
            </div>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda Baru</span>
          </button>
        </div>
      </div>

      {/* Agenda List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agendaItems.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 shadow-xl transition ${
              item.isIslamicHoliday
                ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {item.isIslamicHoliday ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] font-bold mb-2">
                    <Sparkles className="w-3 h-3" />
                    Hari Besar Islam
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold mb-2">
                    <Calendar className="w-3 h-3" />
                    Agenda Kegiatan
                  </span>
                )}
                <h4 className="text-base font-bold text-white leading-snug">{item.title}</h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                  title="Edit Agenda"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteAgendaItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                  title="Hapus Agenda"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.description}</p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                {item.date} ({item.time} WIB)
              </span>

              <span className="flex items-center gap-1 text-slate-400 truncate max-w-[180px]">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Agenda / Hari Besar' : 'Tambah Agenda / Hari Besar Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Agenda Kegiatan</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: Tabligh Akbar Menyambut Ramadhan"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Waktu (WIB)</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi Tempat</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Detail penceramah atau rangkaian acara..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="holiday"
                  checked={isHoliday}
                  onChange={(e) => setIsHoliday(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="holiday" className="text-xs font-semibold text-amber-300 cursor-pointer">
                  Tandai Sebagai Hari Besar Islam (Notifikasi Banner Display)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  {editingItem ? 'Perbarui Agenda' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
