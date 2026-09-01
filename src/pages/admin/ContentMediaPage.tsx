import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Image as ImageIcon, Video, Youtube, Radio, Plus, Trash2, Edit2, Eye, EyeOff,
  BookOpen, Table, QrCode, ArrowUp, ArrowDown, Upload, Check, AlertCircle, X, Sparkles
} from 'lucide-react';
import { MediaItem, MediaType } from '../../types';

export const ContentMediaPage: React.FC = () => {
  const { mediaItems, addMediaItem, updateMediaItem, deleteMediaItem } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('image');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [filePath, setFilePath] = useState('');
  const [content, setContent] = useState('');

  // Structured fields for type === 'text' (Dakwah Text)
  const [textSubtitle, setTextSubtitle] = useState('');
  const [textArabic, setTextArabic] = useState('');
  const [textLatin, setTextLatin] = useState('');
  const [textTranslation, setTextTranslation] = useState('');

  // Structured fields for type === 'table' (Table Builder)
  const [tableHeaders, setTableHeaders] = useState<string[]>(['Tanggal', 'Khatib / Acara', 'Imam / Penceramah', 'Keterangan']);
  const [tableRows, setTableRows] = useState<string[][]>([
    ['06 Feb 2026', 'Ustadz Dr. H. Ahmad Fauzi', 'Ustadz Muhammad Ridwan', 'Sholat Jumat'],
    ['13 Feb 2026', 'Ustadz Prof. Dr. Rahmat Hidayat', 'Ustadz Syamsul Bahri', 'Sholat Jumat'],
  ]);

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTextContent = (rawContent?: string) => {
    if (!rawContent) return { subtitle: '', arabic: '', latin: '', translation: '' };
    try {
      const parsed = JSON.parse(rawContent);
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          subtitle: parsed.subtitle || '',
          arabic: parsed.arabic || '',
          latin: parsed.latin || '',
          translation: parsed.translation || parsed.text || rawContent,
        };
      }
    } catch (_) {}
    return { subtitle: '', arabic: '', latin: '', translation: rawContent };
  };

  const addTableColumn = () => {
    const colName = `Kolom ${tableHeaders.length + 1}`;
    setTableHeaders(prev => [...prev, colName]);
    setTableRows(prev => prev.map(row => [...row, '-']));
  };

  const removeTableColumn = (colIdx: number) => {
    if (tableHeaders.length <= 1) return;
    setTableHeaders(prev => prev.filter((_, idx) => idx !== colIdx));
    setTableRows(prev => prev.map(row => row.filter((_, idx) => idx !== colIdx)));
  };

  const updateTableHeader = (colIdx: number, val: string) => {
    setTableHeaders(prev => {
      const next = [...prev];
      next[colIdx] = val;
      return next;
    });
  };

  const addTableRow = () => {
    const newRow = new Array(tableHeaders.length).fill('-');
    setTableRows(prev => [...prev, newRow]);
  };

  const removeTableRow = (rowIdx: number) => {
    setTableRows(prev => prev.filter((_, idx) => idx !== rowIdx));
  };

  const updateTableCell = (rowIdx: number, colIdx: number, val: string) => {
    setTableRows(prev => {
      const next = prev.map((row, rI) => {
        if (rI !== rowIdx) return row;
        const copyRow = [...row];
        copyRow[colIdx] = val;
        return copyRow;
      });
      return next;
    });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setType('image');
    setDurationSeconds(10);
    setFilePath('');
    setContent('');
    setTextSubtitle('');
    setTextArabic('');
    setTextLatin('');
    setTextTranslation('');
    setTableHeaders(['Tanggal', 'Khatib / Acara', 'Imam / Penceramah', 'Keterangan']);
    setTableRows([
      ['06 Feb 2026', 'Ustadz Dr. H. Ahmad Fauzi', 'Ustadz Muhammad Ridwan', 'Sholat Jumat'],
      ['13 Feb 2026', 'Ustadz Prof. Dr. Rahmat Hidayat', 'Ustadz Syamsul Bahri', 'Sholat Jumat'],
    ]);
    setUploadedFileName(null);
    setUploadError(null);
    setShowModal(true);
  };

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setType(item.type);
    setDurationSeconds(item.durationSeconds);
    setFilePath(item.filePath || '');
    setContent(item.content || '');

    const parsed = parseTextContent(item.content);
    setTextSubtitle(parsed.subtitle);
    setTextArabic(parsed.arabic);
    setTextLatin(parsed.latin);
    setTextTranslation(parsed.translation);

    if (item.tableData?.headers?.length) {
      setTableHeaders(item.tableData.headers);
      setTableRows(item.tableData.rows || []);
    }

    setUploadedFileName(null);
    setUploadError(null);
    setShowModal(true);
  };

  // Helper to re-format YouTube URL to embed URL
  const formatYoutubeUrl = (urlStr: string) => {
    if (!urlStr) return '';
    if (urlStr.includes('youtube.com/embed/')) return urlStr;
    const match = urlStr.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&enablejsapi=1&controls=0`;
    }
    return urlStr;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalFilePath = filePath;
    let finalContent = content;

    if (type === 'text') {
      finalContent = JSON.stringify({
        subtitle: textSubtitle,
        arabic: textArabic,
        latin: textLatin,
        translation: textTranslation,
      });
    }

    if (type === 'youtube' && finalFilePath) {
      finalFilePath = formatYoutubeUrl(finalFilePath);
    }

    let tableDataPayload = undefined;

    if (type === 'table') {
      tableDataPayload = {
        headers: tableHeaders,
        rows: tableRows,
      };
    }

    if (editingItem) {
      updateMediaItem(editingItem.id, {
        title,
        type,
        durationSeconds,
        filePath: finalFilePath,
        content: finalContent,
        tableData: tableDataPayload,
      });

      try {
        await fetch(`/api/admin/media/${editingItem.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            title,
            type,
            duration_seconds: durationSeconds,
            file_path: finalFilePath,
            content: finalContent,
            table_data: tableDataPayload,
          }),
        });
      } catch (_) {}
    } else {
      const newItemData = {
        title,
        type,
        durationSeconds,
        filePath: finalFilePath || (type === 'image' ? 'https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=1200&auto=format&fit=crop&q=80' : ''),
        content: finalContent,
        tableData: tableDataPayload,
        isActive: true,
        sortOrder: mediaItems.length + 1,
      };

      addMediaItem(newItemData);

      try {
        await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            title,
            type,
            duration_seconds: durationSeconds,
            file_path: finalFilePath,
            content: finalContent,
            table_data: tableDataPayload,
          }),
        });
      } catch (_) {}
    }

    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('Ukuran file terlalu besar. Maksimum 50MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePath(objectUrl);
    setUploadedFileName(file.name);

    if (file.type.startsWith('video/')) {
      setType('video');
    } else if (file.type.startsWith('image/')) {
      setType('image');
    }

    const fd = new FormData();
    fd.append('file', file);

    fetch('/api/admin/media/upload', { method: 'POST', body: fd })
      .then(r => r.json())
      .then(d => {
        if (d.file_url) {
          setFilePath(d.file_url);
        }
      })
      .catch(() => {});
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const items = [...mediaItems];
    const temp = items[index].sortOrder;
    items[index].sortOrder = items[index - 1].sortOrder;
    items[index - 1].sortOrder = temp;
    updateMediaItem(items[index].id, { sortOrder: items[index].sortOrder });
    updateMediaItem(items[index - 1].id, { sortOrder: items[index - 1].sortOrder });
  };

  const moveDown = (index: number) => {
    if (index === mediaItems.length - 1) return;
    const items = [...mediaItems];
    const temp = items[index].sortOrder;
    items[index].sortOrder = items[index + 1].sortOrder;
    items[index + 1].sortOrder = temp;
    updateMediaItem(items[index].id, { sortOrder: items[index].sortOrder });
    updateMediaItem(items[index + 1].id, { sortOrder: items[index + 1].sortOrder });
  };

  const sortedMediaItems = [...mediaItems].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <span>Manajemen Slide & Konten Media Display</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola poster gambar, video MP4/WebM, YouTube embed, livestream, ayat/hadits, dan slide QR donasi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
              <Check className="w-4 h-4" />
              <span>Tersimpan!</span>
            </div>
          )}

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slide Baru</span>
          </button>
        </div>
      </div>

      {/* Slide List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedMediaItems.map((item, index) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
              item.isActive
                ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                : 'bg-slate-950 border-slate-900 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-emerald-400 rounded-xl">
                  {item.type === 'image' && <ImageIcon className="w-5 h-5" />}
                  {item.type === 'video' && <Video className="w-5 h-5 text-blue-400" />}
                  {item.type === 'youtube' && <Youtube className="w-5 h-5 text-red-400" />}
                  {item.type === 'livestream' && <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />}
                  {item.type === 'text' && <BookOpen className="w-5 h-5 text-amber-400" />}
                  {item.type === 'hadith' && <BookOpen className="w-5 h-5 text-emerald-400" />}
                  {item.type === 'doa' && <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />}
                  {item.type === 'table' && <Table className="w-5 h-5 text-cyan-400" />}
                  {item.type === 'donation' && <QrCode className="w-5 h-5 text-emerald-300" />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="capitalize font-semibold text-emerald-400">{item.type}</span>
                    <span>•</span>
                    <span>Durasi: {item.durationSeconds}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reorder Buttons */}
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                  title="Naikkan Urutan"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === sortedMediaItems.length - 1}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800"
                  title="Turunkan Urutan"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800"
                  title="Edit Slide"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Active Toggle */}
                <button
                  type="button"
                  onClick={() => updateMediaItem(item.id, { isActive: !item.isActive })}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  title={item.isActive ? 'Nonaktifkan Slide' : 'Aktifkan Slide'}
                >
                  {item.isActive ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => deleteMediaItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
                  title="Hapus Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Preview */}
            {item.type === 'image' && item.filePath && (
              <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800">
                <img src={item.filePath} alt={item.title} className="w-full h-full object-cover" />
              </div>
            )}
            {item.type === 'video' && (item.filePath || item.content) && (
              <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
                <video src={item.filePath || item.content} className="w-full h-full object-cover" muted />
              </div>
            )}
            {(item.type === 'youtube' || item.type === 'livestream') && (item.filePath || item.content) && (
              <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-black">
                <iframe src={item.filePath || item.content} title={item.title} className="w-full h-full border-0 pointer-events-none" />
              </div>
            )}
            {item.type === 'doa' && (
              <div className="h-32 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-center items-center text-center space-y-1">
                <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse mb-1" />
                <span className="text-xs font-bold text-white">Doa Harian Otomatis</span>
                <span className="text-[10px] text-emerald-400 font-mono">https://equran.id/api/doa</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">
              {editingItem ? 'Edit Slide Media' : 'Tambah Slide Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Slide / Poster</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Contoh: Kajian Rutin Sabtu Subuh"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Jenis Konten</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MediaType)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="image">Gambar Poster (JPG/PNG/WebP)</option>
                    <option value="video">Video Lokal (MP4/WebM)</option>
                    <option value="youtube">YouTube Video Embed</option>
                    <option value="livestream">Siaran Langsung (Livestream)</option>
                    <option value="text">Mutiara Ayat / Hadits Manual</option>
                    <option value="hadith">Hadits Otomatis (MyQuran API v3)</option>
                    <option value="doa">Doa Harian Otomatis (API equran.id)</option>
                    <option value="table">Tabel Informasi / Kas</option>
                    <option value="donation">Halaman QR Donasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Durasi Tampil (Detik)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-bold text-center"
                    min="3"
                    max="300"
                    required
                  />
                </div>
              </div>

              {/* Dynamic input according to MediaType */}
              {type === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">URL Gambar</label>
                    <input
                      type="text"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-2xl p-3 cursor-pointer flex items-center gap-3 transition group"
                  >
                    <Upload className="w-6 h-6 text-slate-600 group-hover:text-emerald-400 transition" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {uploadedFileName ? <span className="text-emerald-400">✓ {uploadedFileName}</span> : <>Unggah file gambar lokal</>}
                      </p>
                      <p className="text-[10px] text-slate-500">Format: JPG, PNG, WebP — Maks. 50MB</p>
                    </div>
                  </div>
                </div>
              )}

              {type === 'video' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">URL Video MP4/WebM</label>
                    <input
                      type="text"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://.../video.mp4"
                    />
                  </div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-blue-500/60 rounded-2xl p-3 cursor-pointer flex items-center gap-3 transition group"
                  >
                    <Upload className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {uploadedFileName ? <span className="text-blue-400">✓ {uploadedFileName}</span> : <>Unggah file video lokal</>}
                      </p>
                      <p className="text-[10px] text-slate-500">Format: MP4, WebM — Maks. 50MB</p>
                    </div>
                  </div>
                </div>
              )}

              {type === 'youtube' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL Video YouTube</label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Masukkan URL YouTube standar atau embed. URL akan otomatis dikonversi.
                  </p>
                </div>
              )}

              {type === 'livestream' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">URL Siaran Langsung (Livestream)</label>
                  <input
                    type="text"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="https://www.youtube.com/embed/live_stream?channel=..."
                  />
                </div>
              )}

              {type === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sumber / Perujuk (Subtitle)</label>
                    <input
                      type="text"
                      value={textSubtitle}
                      onChange={(e) => setTextSubtitle(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="Contoh: Surah Al-Kahfi: 10 atau HR. Bukhari"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Teks Kaligrafi Arab</label>
                    <textarea
                      rows={2}
                      value={textArabic}
                      onChange={(e) => setTextArabic(e.target.value)}
                      dir="rtl"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-lg text-amber-200 font-arabic focus:outline-none focus:border-amber-500"
                      placeholder="إِنَّ مَعَ الْعُسْرِ يُسْرًا"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Transliterasi Latin (Opsional)</label>
                    <input
                      type="text"
                      value={textLatin}
                      onChange={(e) => setTextLatin(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs italic text-emerald-300 focus:outline-none focus:border-amber-500"
                      placeholder="Contoh: Inna ma'al 'usri yusrā..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Terjemahan / Isi Pesan Dakwah</label>
                    <textarea
                      rows={3}
                      value={textTranslation}
                      onChange={(e) => setTextTranslation(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                      placeholder="Tuliskan terjemahan ayat, hadits, atau nasehat hikmah..."
                      required
                    />
                  </div>
                </div>
              )}

              {type === 'hadith' && (
                <div className="space-y-3 bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Hadits Otomatis (MyQuran API v3)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Slide ini akan mengambil dan menampilkan Hadits Pilihan (Terjemahan Bahasa Indonesia & Takhrij/Derajat) secara acak dan otomatis dari API MyQuran v3 (https://api.myquran.com/v3/hadis/enc/random).
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sumber API Hadits</label>
                    <select
                      value={filePath || 'v3_enc_random'}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="v3_enc_random">MyQuran API v3 Hadis Enc Random (Acak Otomatis)</option>
                    </select>
                  </div>
                </div>
              )}

              {type === 'doa' && (
                <div className="space-y-3 bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Doa Harian Otomatis (API equran.id)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Slide ini akan mengambil dan menampilkan Doa Harian (Teks Arab, Transliterasi Latin, Terjemahan Bahasa Indonesia & Keterangan) secara otomatis dari alamat <span className="text-emerald-400 font-mono">https://equran.id/api/doa</span>.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Endpoint API Doa</label>
                    <input
                      type="text"
                      readOnly
                      value={filePath || 'https://equran.id/api/doa'}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-300 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {type === 'table' && (
                <div className="space-y-4 border border-slate-800 bg-slate-950 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Table className="w-4 h-4" /> Builder Tabel Informasi
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addTableColumn}
                        className="px-2.5 py-1 bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Kolom
                      </button>
                      <button
                        type="button"
                        onClick={addTableRow}
                        className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Baris
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-300 font-semibold">
                        <tr>
                          {tableHeaders.map((header, colIdx) => (
                            <th key={colIdx} className="p-2 border-b border-slate-800 min-w-[120px]">
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={header}
                                  onChange={(e) => updateTableHeader(colIdx, e.target.value)}
                                  className="w-full bg-slate-950 px-2 py-1 border border-slate-800 rounded font-bold text-cyan-300 focus:outline-none"
                                />
                                {tableHeaders.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTableColumn(colIdx)}
                                    className="p-1 text-slate-500 hover:text-red-400"
                                    title="Hapus Kolom"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="p-2 border-b border-slate-800 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-200">
                        {tableRows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-slate-900/40">
                            {row.map((cell, colIdx) => (
                              <td key={colIdx} className="p-1">
                                <input
                                  type="text"
                                  value={cell}
                                  onChange={(e) => updateTableCell(rowIdx, colIdx, e.target.value)}
                                  className="w-full bg-slate-950 px-2 py-1 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                                />
                              </td>
                            ))}
                            <td className="p-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeTableRow(rowIdx)}
                                className="p-1 text-slate-500 hover:text-red-400"
                                title="Hapus Baris"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="hidden"
                onChange={handleFileUpload}
              />

              {uploadError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/50 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                </div>
              )}

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
                  {editingItem ? 'Perbarui Slide' : 'Simpan Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
