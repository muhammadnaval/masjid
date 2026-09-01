import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Palette, Check, Tv, Sparkles, Layout, RotateCcw, Save } from 'lucide-react';
import { ThemeSetting, LayoutMode } from '../../types';

const LAYOUT_OPTIONS: { key: LayoutMode; title: string; desc: string; icon: string }[] = [
  { key: 'default', title: 'Default Balanced', desc: 'Tata letak seimbang jam, media rotator, dan kartu waktu sholat.', icon: '📐' },
  { key: 'hero', title: 'Hero Banner Focus', desc: 'Menampilkan latar belakang gambar/masjid lebih besar dan dominan.', icon: '🖼️' },
  { key: 'media_focus', title: 'Media & Streaming Focus', desc: 'Mengutamakan konten slide video, live stream, dan dakwah.', icon: '📺' },
  { key: 'minimal', title: 'Minimalist Clean', desc: 'Tampilan bersih fokus pada jam digital dan waktu sholat.', icon: '✨' },
];

export const DesignThemePage: React.FC = () => {
  const { theme, updateTheme, presetThemes, layoutMode, setLayoutMode } = useApp();

  const [selectedId, setSelectedId] = useState(theme.id);
  const [currentLayout, setCurrentLayout] = useState<LayoutMode>(layoutMode || 'default');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#f59e0b');
  const [bgColor, setBgColor] = useState('#020617');
  const [textColor, setTextColor] = useState('#f8fafc');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/theme')
      .then(r => r.json())
      .then(d => {
        if (d.theme) {
          if (d.theme.theme_name) {
            const match = presetThemes.find(p => p.name.toLowerCase() === d.theme.theme_name.toLowerCase());
            if (match) setSelectedId(match.id);
          }
          if (d.theme.primary_color) setPrimaryColor(d.theme.primary_color);
          if (d.theme.secondary_color) setSecondaryColor(d.theme.secondary_color);
          if (d.theme.background_color) setBgColor(d.theme.background_color);
          if (d.theme.text_color) setTextColor(d.theme.text_color);
          if (d.theme.layout_config?.layout_mode) {
            setCurrentLayout(d.theme.layout_config.layout_mode);
            setLayoutMode(d.theme.layout_config.layout_mode);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectPreset = (preset: ThemeSetting) => {
    setSelectedId(preset.id);
    if (preset.primaryColor) setPrimaryColor(preset.primaryColor);
    if (preset.accentColor) setSecondaryColor(preset.accentColor);
    if (preset.bgColor) setBgColor(preset.bgColor);
    if (preset.textColor) setTextColor(preset.textColor);
    updateTheme(preset);
  };

  const handleSelectLayout = (lKey: LayoutMode) => {
    setCurrentLayout(lKey);
    setLayoutMode(lKey);
  };

  const handleSaveTheme = async () => {
    setIsSaving(true);

    const activePreset = presetThemes.find(p => p.id === selectedId) || presetThemes[0];
    const updatedTheme: ThemeSetting = {
      ...activePreset,
      primaryColor: primaryColor,
      accentColor: secondaryColor,
      bgColor: bgColor,
      textColor: textColor,
    };
    updateTheme(updatedTheme);

    try {
      await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          theme_name: activePreset.name,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          background_color: bgColor,
          text_color: textColor,
          layout_config: {
            layout_mode: currentLayout,
            show_header: true,
            show_media: true,
            show_schedule: true,
            show_running_text: true,
          },
        }),
      });
    } catch (_) {}

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefault = async () => {
    setIsSaving(true);
    const defaultPreset = presetThemes[0];
    setSelectedId(defaultPreset.id);
    updateTheme(defaultPreset);
    setCurrentLayout('default');
    setLayoutMode('default');
    setPrimaryColor('#10b981');
    setSecondaryColor('#f59e0b');
    setBgColor('#020617');
    setTextColor('#f8fafc');

    try {
      await fetch('/api/admin/theme/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
    } catch (_) {}

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan Tema & Kustomisasi Desain TV</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pilih preset tema visual, tata letak layout display, serta kustomisasi warna utama masjid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold animate-pulse">
              <Check className="w-4 h-4" />
              <span>Tema Diterapkan!</span>
            </div>
          )}

          <button
            onClick={handleResetDefault}
            disabled={isSaving}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Section 1: Preset Themes */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> 1. Pilihan Preset Tema Visual
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {presetThemes.map((preset) => {
            const isSelected = selectedId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-5 rounded-3xl cursor-pointer border-2 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  preset.bgColor
                } ${
                  isSelected
                    ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-2xl scale-[1.01]'
                    : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 block mb-1">Preset Tema</span>
                  <h3 className="text-base font-black text-white">{preset.name}</h3>
                </div>

                <div className="my-4 space-y-2">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-md flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">Preview Waktu</span>
                    <span className="text-lg font-black font-display text-emerald-300">18:25 WIB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                  <span className="text-slate-400 font-medium">Font: <strong className="text-white capitalize">{preset.fontFamily}</strong></span>
                  <span className={`px-3 py-1 rounded-xl font-bold text-xs ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
                    {isSelected ? 'Tema Aktif' : 'Pilih Tema'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Layout Config (Sub-Fitur 29.20.2) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <Layout className="w-4 h-4" /> 2. Tata Letak (Layout Config Display)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LAYOUT_OPTIONS.map((lOpt) => {
            const isSelected = currentLayout === lOpt.key;
            return (
              <div
                key={lOpt.key}
                onClick={() => handleSelectLayout(lOpt.key)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{lOpt.icon}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{lOpt.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{lOpt.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Color Palette Customizer */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
          <Palette className="w-4 h-4" /> 3. Penyesuaian Warna Custom (Color Palette)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Warna Utama (Primary)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{primaryColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Warna Akses (Secondary)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{secondaryColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Warna Latar (Background)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{bgColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Warna Teks (Text)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
              />
              <span className="text-xs font-mono text-slate-300 uppercase">{textColor}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Tema & Layout'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
