import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Save,
  Key
} from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { login } = useApp();

  // Profile Form state
  const [name, setName] = useState('Pengurus Masjid');
  const [email, setEmail] = useState('admin@masjid.test');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch initial account data from backend
  useEffect(() => {
    fetch('/api/admin/account')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setName(data.data.name || 'Pengurus Masjid');
          setEmail(data.data.email || 'admin@masjid.test');
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch('/api/admin/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setProfileSuccess(data.message || 'Profil pengguna berhasil diperbarui.');
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(data.message || 'Gagal memperbarui profil pengguna.');
      }
    } catch (_) {
      setProfileError('Terjadi kesalahan koneksi ke server.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await fetch('/api/admin/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setPasswordSuccess(data.message || 'Kata sandi berhasil diubah!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(data.message || 'Gagal memperbarui kata sandi. Pastikan kata sandi saat ini benar.');
      }
    } catch (_) {
      setPasswordError('Terjadi kesalahan sistem atau masalah koneksi.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isPasswordValid = newPassword.length >= 6;
  const isConfirmMatching = confirmPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <span>Pengaturan Akun & Keamanan Kata Sandi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kelola identitas akun pengurus masjid dan perbarui kata sandi (password) untuk akses panel admin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Informasional Akun & Profil */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Profil Pengguna Admin</h3>
                <p className="text-xs text-slate-400">Informasi nama & email login admin</p>
              </div>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2 text-emerald-300 text-xs font-semibold animate-pulse">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-2 text-red-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nama Lengkap Admin</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                    placeholder="Contoh: Pengurus Masjid Al-Hidayah"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email Login</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                    placeholder="admin@masjid.test"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? 'Simpan...' : 'Simpan Perubahan Profil'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl text-xs space-y-1 text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">💡 Catatan Keamanan:</span>
            <p>Pastikan email admin selalu aktif dan hanya diketahui oleh pengurus resmi masjid demi keamanan data display.</p>
          </div>
        </div>

        {/* Card 2: Form Ganti Password */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ubah Kata Sandi (Password)</h3>
              <p className="text-xs text-slate-400">Ganti kata sandi untuk keamanan akun</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs font-semibold animate-pulse">
              <Check className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center gap-2.5 text-red-300 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi Saat Ini (Current Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  placeholder="Masukkan kata sandi lama"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi Baru (New Password)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  placeholder="Minimal 6 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                {newPassword.length > 0 && (
                  isPasswordValid ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Panjang kata sandi memenuhi (≥ 6 karakter)</span>
                  ) : (
                    <span className="text-amber-400">Minimal 6 karakter ({newPassword.length}/6)</span>
                  )
                )}
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Konfirmasi Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono"
                  placeholder="Ketik ulang kata sandi baru"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {confirmPassword.length > 0 && (
                  isConfirmMatching ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Konfirmasi kata sandi cocok</span>
                  ) : (
                    <span className="text-red-400">Konfirmasi kata sandi belum cocok</span>
                  )
                )}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{passwordLoading ? 'Memproses Ganti Password...' : 'Perbarui Kata Sandi Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
