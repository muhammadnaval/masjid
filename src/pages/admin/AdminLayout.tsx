import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Clock,
  Hourglass,
  Sun,
  Volume2,
  Image as ImageIcon,
  QrCode,
  Type,
  Palette,
  Tv,
  LogOut,
  ChevronRight,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { profile, logout } = useApp();

  const navItems = [
    { path: '/admin/dashboard', label: 'Ringkasan Status', icon: <LayoutDashboard className="w-4 h-4" /> },
    { path: '/admin/profil-masjid', label: 'Profil Masjid', icon: <Building2 className="w-4 h-4" /> },
    { path: '/admin/jadwal-sholat', label: 'Jadwal & Lokasi Sholat', icon: <Clock className="w-4 h-4" /> },
    { path: '/admin/iqamah', label: 'Pengaturan Iqamah', icon: <Hourglass className="w-4 h-4" /> },
    { path: '/admin/syuruq', label: 'Pengaturan Syuruq', icon: <Sun className="w-4 h-4 text-amber-400" /> },
    { path: '/admin/audio', label: 'Pengaturan Audio', icon: <Volume2 className="w-4 h-4" /> },
    { path: '/admin/konten', label: 'Manajemen Slide & Media', icon: <ImageIcon className="w-4 h-4" /> },
    { path: '/admin/donasi', label: 'QR Donasi', icon: <QrCode className="w-4 h-4" /> },
    { path: '/admin/running-text', label: 'Running Text', icon: <Type className="w-4 h-4" /> },
    { path: '/admin/agenda', label: 'Agenda & Hari Besar', icon: <LayoutDashboard className="w-4 h-4 text-amber-400" /> },
    { path: '/admin/desain', label: 'Tema & Desain', icon: <Palette className="w-4 h-4" /> },
    { path: '/admin/akun', label: 'Pengaturan Akun', icon: <KeyRound className="w-4 h-4 text-emerald-400" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Mosque Brand */}
          <div className="flex items-center gap-3 px-3 py-3 mb-6 border-b border-slate-800">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white truncate">{profile.name}</h2>
              <span className="text-[11px] text-emerald-400 font-semibold">Panel Admin Masjid</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs lg:text-sm transition ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-emerald-200" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Launch TV Display */}
        <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
          <Link
            to="/display"
            target="_blank"
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Tv className="w-4 h-4" />
            <span>Buka Layar TV Display</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-white">Dashboard Pengurus Masjid</h1>
            <p className="text-xs text-slate-400">Kelola informasi, jadwal sholat, dan media display TV masjid secara terpusat.</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-full">
              Status System: Online
            </span>
            <Link
              to="/admin/login"
              onClick={logout}
              className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
              title="Keluar Session Admin"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
