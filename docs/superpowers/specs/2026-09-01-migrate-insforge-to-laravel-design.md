# 2026-09-01 — Migrasi InsForge ke Laravel 13

## Status

Draf — menunggu persetujuan pengguna.

## Konteks

Proyek jam digital masjid (`masjid.test`) memiliki tiga komponen utama:

1. **Flutter display** (`mobile/lib/`) — tampilan TV utama, saat ini mengakses InsForge Edge Function
2. **React admin panel** (`src/`) — panel admin web, saat ini mengakses Laravel API
3. **Laravel 13** (`app/`, `routes/`, `database/`) — backend PHP, saat ini hanya melayani panel admin React
4. **InsForge Edge Function** (`mobile/backend/masjid-backend.ts`) — backend BaaS yang melayani Flutter, menggunakan `@insforge/sdk` dan PostgreSQL InsForge

Masalah: terdapat dua backend terpisah (Laravel/MySQL dan InsForge/PostgreSQL) yang tidak sinkron. Panel admin React menulis ke MySQL, sementara Flutter display membaca dari InsForge PostgreSQL. Data tidak terhubung.

## Keputusan

| Aspek | Keputusan |
|---|---|
| Strategi migrasi | Full cutover — semua komponen pindah ke Laravel sekaligus |
| Data | Mulai dari nol — tidak migrasi data InsForge |
| Autentikasi admin | Session Laravel (cookie-based) — tabel `users` bawaan Laravel |
| Panel admin | Ganti dari React SPA ke Laravel Blade + Alpine.js |
| Frontend display | Flutter tetap, tetapi endpoint berpindah dari InsForge ke Laravel |

## Arsitektur Target

```
┌──────────────────────────────────────────────────┐
│                LARAVEL 13 (satu backend)          │
│                                                   │
│  ├── /admin/*     → Blade templates + Alpine.js   │
│  │   (autentikasi session middleware)              │
│  │                                                │
│  ├── /api/display → JSON untuk Flutter            │
│  │   (publik, tanpa auth)                         │
│  │                                                │
│  └── MySQL database                               │
└────────────────────┬─────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼─────┐       ┌──────▼──────┐
    │  Flutter   │       │   Browser   │
    │  Display   │       │   Admin     │
    │  (TV)      │       │   (Blade)   │
    └───────────┘       └─────────────┘
```

## Cakupan

### 1. Backend Laravel — Modifikasi Display API

Modifikasi `DisplayController` agar mengembalikan JSON dalam format yang diharapkan Flutter (bukan format React yang sekarang).

**Format target (untuk Flutter):**

```
{
  status: 'success',
  data: {
    mosqueProfile: { name, address, logo_path, background_path },
    prayerLocation: { city_name },
    todaySchedule: { date, imsak, subuh, syuruq, dzuhur, ashar, maghrib, isya },
    timeCorrections: { subuh: 0, dzuhur: 0, ... },
    hijriCorrectionDays: int,
    iqamahSettings: { subuh: { is_enabled, duration_minutes }, ... },
    adzanSettings: { durationSeconds: int, displayMessage: string },
    audioSettings: { adzan: { is_enabled, volume, custom_url }, murottal: {...}, dzikir_pagi: {...}, dzikir_petang: {...} },
    syuruqSettings: { is_enabled, durationMinutes: int, displayMessage: string },
    countdownSettings: { subuh: 5, dzuhur: 5, ... },
    donationSettings: { title, description, qr_code_path, account_name, is_active },
    fridaySettings: { is_enabled, disable_iqamah_on_friday, khutbah_duration_minutes, ... },
    themeSettings: { primary_color, secondary_color, background_color, text_color, layout_config },
    mediaItems: [{ id, title, type, content, file_path, duration_seconds, ... }],
    runningTexts: [{ text, speed: int, ... }],
    agendas: [{ title, description, starts_at, is_active, ... }],
    upcoming_islamic_holiday: { ... }
  }
}
```

**Perubahan yang diperlukan:**

- Ubah `DisplayController::state()` agar membungkus semua data di dalam key `data`
- Ubah nama field dari snake_case React ke camelCase/mixed yang diharapkan Flutter (misalnya `running_text` → `runningTexts`, `corrections` → `timeCorrections`)
- Format audio dari flat (`adzan_audio_url`, `volume_adzan`) ke nested (`adzan.custom_url`, `adzan.volume`)
- Format schedule dari `schedule` ke `todaySchedule`, dengan koreksi waktu sudah diterapkan
- Tambahkan `countdownSettings` ke response
- Tambahkan `adzanSettings` (duration dan displayMessage) dari AudioSetting
- Tambahkan `hijriCorrectionDays` dari MosqueProfile
- Injeksikan random hadis dari MyQuran API ke dalam media items (sama seperti edge function)
- Injeksikan random doa dari eQuran API ke dalam media items
- Jalur: `GET /api/display/state` (publik, tanpa auth)

**Tabel yang perlu ditambahkan/diubah di Laravel:**

| Tabel | Status | Keterangan |
|---|---|---|
| `mosque_profiles` | Sudah ada | Tambah kolom `hijri_correction` jika belum ada (sudah ada dari migration `000013`) |
| `prayer_locations` | Sudah ada | — |
| `prayer_schedules` | Sudah ada | — |
| `prayer_time_corrections` | Sudah ada | — |
| `iqamah_settings` | Sudah ada | — |
| `audio_settings` | Sudah ada | — |
| `friday_settings` | Sudah ada | — |
| `syuruq_settings` | Sudah ada | — |
| `donation_settings` | Sudah ada | — |
| `theme_settings` | Sudah ada | — |
| `running_texts` | Sudah ada | — |
| `media_items` | Sudah ada | — |
| `agendas` | Sudah ada | — |
| `sync_logs` | Sudah ada | — |
| `users` | Sudah ada | Tabel bawaan Laravel untuk auth admin |
| `countdown_settings` | **Baru** | Pengaturan menit countdown per sholat |

### 2. Backend Laravel — Service Integrasi API Eksternal

Buat service baru untuk menggantikan fungsi integrasi yang ada di InsForge Edge Function:

**a. `PrayerScheduleService` (sudah ada, perlu dipastikan)**

Mengambil jadwal sholat dari API eksternal:
- MyQuran API: `https://api.myquran.com/v2/sholat/jadwal/{cityCode}/{year}/{month}`
- Atau EQuran.id API yang sudah ada

**b. `RandomContentService` (baru)**

Mengambil konten acak untuk display:
- Hadis acak dari `https://api.myquran.com/v3/hadis/enc/random`
- Doa acak dari `https://equran.id/api/doa`
- Cache selama 30 menit (sama seperti edge function)
- Dimasukkan ke dalam response display sebagai media items

**c. `CountdownSettingService` atau cukup model `CountdownSetting` (baru)**

Menyimpan menit countdown per sholat:
- subuh, dzuhur, ashar, maghrib, isya (default: 5 menit)
- Disimpan di tabel `countdown_settings`

### 3. Backend Laravel — Panel Admin Blade

Ganti seluruh panel admin React dengan Laravel Blade + Alpine.js + Tailwind CSS.

**Router:**

```php
// routes/web.php

Route::get('/admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');

Route::middleware('auth')->prefix('admin')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');

    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');

    Route::get('/profil-masjid', [AdminMosqueProfileController::class, 'edit'])->name('admin.profile.edit');
    Route::post('/profil-masjid', [AdminMosqueProfileController::class, 'update'])->name('admin.profile.update');

    Route::get('/jadwal-sholat', [AdminPrayerScheduleController::class, 'index'])->name('admin.schedule.index');
    Route::post('/jadwal-sholat/lokasi', [AdminPrayerScheduleController::class, 'updateLocation'])->name('admin.schedule.location');
    Route::post('/jadwal-sholat/koreksi', [AdminPrayerScheduleController::class, 'updateCorrections'])->name('admin.schedule.corrections');
    Route::post('/jadwal-sholat/sinkronisasi', [AdminPrayerScheduleController::class, 'sync'])->name('admin.schedule.sync');
    Route::get('/jadwal-sholat/provinsi', [AdminPrayerScheduleController::class, 'provinces'])->name('admin.schedule.provinces');
    Route::post('/jadwal-sholat/kabkota', [AdminPrayerScheduleController::class, 'cities'])->name('admin.schedule.cities');

    Route::get('/iqamah', [AdminIqamahController::class, 'edit'])->name('admin.iqamah.edit');
    Route::post('/iqamah', [AdminIqamahController::class, 'update'])->name('admin.iqamah.update');

    Route::get('/syuruq', [AdminSyuruqController::class, 'edit'])->name('admin.syuruq.edit');
    Route::post('/syuruq', [AdminSyuruqController::class, 'update'])->name('admin.syuruq.update');

    Route::get('/audio', [AdminAudioController::class, 'edit'])->name('admin.audio.edit');
    Route::post('/audio', [AdminAudioController::class, 'update'])->name('admin.audio.update');
    Route::post('/audio/upload', [AdminAudioController::class, 'uploadAdzan'])->name('admin.audio.upload');
    Route::post('/audio/upload-murottal', [AdminAudioController::class, 'uploadMurottal'])->name('admin.audio.upload.murottal');
    Route::post('/audio/upload-dzikir-pagi', [AdminAudioController::class, 'uploadDzikirPagi'])->name('admin.audio.upload.dzikir.pagi');
    Route::post('/audio/upload-dzikir-petang', [AdminAudioController::class, 'uploadDzikirPetang'])->name('admin.audio.upload.dzikir.petang');

    Route::resource('/media', AdminMediaController::class);
    Route::post('/media/{media}/upload', [AdminMediaController::class, 'upload'])->name('admin.media.upload');
    Route::post('/media/reorder', [AdminMediaController::class, 'reorder'])->name('admin.media.reorder');

    Route::get('/donasi', [AdminDonationController::class, 'edit'])->name('admin.donation.edit');
    Route::post('/donasi', [AdminDonationController::class, 'update'])->name('admin.donation.update');
    Route::post('/donasi/upload-qr', [AdminDonationController::class, 'uploadQr'])->name('admin.donation.upload.qr');

    Route::resource('/running-text', AdminRunningTextController::class);

    Route::resource('/agenda', AdminAgendaController::class);

    Route::get('/desain', [AdminThemeController::class, 'edit'])->name('admin.theme.edit');
    Route::post('/desain', [AdminThemeController::class, 'update'])->name('admin.theme.update');
    Route::post('/desain/reset', [AdminThemeController::class, 'reset'])->name('admin.theme.reset');

    Route::get('/hijri', [AdminHijriController::class, 'edit'])->name('admin.hijri.edit');
    Route::post('/hijri', [AdminHijriController::class, 'update'])->name('admin.hijri.update');

    Route::get('/countdown', [AdminCountdownController::class, 'edit'])->name('admin.countdown.edit');
    Route::post('/countdown', [AdminCountdownController::class, 'update'])->name('admin.countdown.update');

    Route::get('/friday', [AdminFridayController::class, 'edit'])->name('admin.friday.edit');
    Route::post('/friday', [AdminFridayController::class, 'update'])->name('admin.friday.update');

    Route::get('/akun', [AdminAccountController::class, 'edit'])->name('admin.account.edit');
    Route::post('/akun/profile', [AdminAccountController::class, 'updateProfile'])->name('admin.account.update');
    Route::post('/akun/password', [AdminAccountController::class, 'updatePassword'])->name('admin.account.password');
});
```

**Struktur View Blade:**

```
resources/views/
├── layouts/
│   └── admin.blade.php          ← layout utama (sidebar + header + content)
├── admin/
│   ├── login.blade.php
│   ├── dashboard.blade.php
│   ├── profile.blade.php
│   ├── prayer-schedule.blade.php
│   ├── iqamah.blade.php
│   ├── syuruq.blade.php
│   ├── audio.blade.php
│   ├── media.blade.php
│   ├── media/create.blade.php
│   ├── media/edit.blade.php
│   ├── donation.blade.php
│   ├── running-text.blade.php
│   ├── agenda.blade.php
│   ├── theme.blade.php
│   ├── hijri.blade.php
│   ├── countdown.blade.php
│   ├── friday.blade.php
│   └── account.blade.php
└── display.blade.php            ← halaman embed TV display (opsional, untuk browser)
```

**Teknologi frontend admin:**
- **Tailwind CSS 4** — sudah ada di project (`@tailwindcss/vite`)
- **Alpine.js** — untuk interaktivitas ringan (toggle, modal, dynamic form, preview)
- **Blade components** — komponen reusable (card, input, toggle, toast)

**Controller baru:**

| Controller | Fungsi |
|---|---|
| `AuthController` | Login/logout admin (session-based) |
| `AdminDashboardController` | Dashboard ringkasan |
| `AdminMosqueProfileController` | Edit profil masjid + upload logo/background |
| `AdminPrayerScheduleController` | Kelola lokasi, sinkronisasi, koreksi waktu |
| `AdminIqamahController` | Pengaturan iqamah per sholat |
| `AdminSyuruqController` | Pengaturan syuruq |
| `AdminAudioController` | Pengaturan audio + upload file |
| `AdminMediaController` | CRUD media items + upload |
| `AdminDonationController` | Pengaturan donasi + upload QR |
| `AdminRunningTextController` | CRUD running text |
| `AdminAgendaController` | CRUD agenda |
| `AdminThemeController` | Pengaturan tema + reset |
| `AdminHijriController` | Koreksi tanggal hijriyah |
| `AdminCountdownController` | Pengaturan menit countdown |
| `AdminFridayController` | Pengaturan mode Jumat |
| `AdminAccountController` | Edit profil & password admin |

**Catatan:** Controller `api.php` yang sudah ada **tetap dipertahankan** untuk API Flutter. Controller admin **baru** diarahkan ke Blade views. Keduanya menggunakan Model Eloquent yang sama.

### 4. Flutter — Pindah dari InsForge ke Laravel

**Perubahan di `mobile/lib/services/api_service.dart`:**

```dart
// Sebelum (InsForge)
static const baseUrl = 'https://2a5hq4xh.ap-southeast.insforge.app';
static const displayStateUrl = 'https://2a5hq4xh.ap-southeast.insforge.app/functions/masjid-backend';

// Sesudah (Laravel)
static const baseUrl = 'https://masjid.alihdayahsiteba.web.id'; // production
// atau
static const baseUrl = 'https://masjid.test'; // local dev
static const displayStateUrl = 'https://masjid.alihdayahsiteba.web.id/api/display/state';
```

**Perubahan di `mobile/lib/main.dart` (`_applyApiState`):**

Struktur JSON dari Laravel harus cocok dengan apa yang Flutter parse saat ini. Dengan memodifikasi `DisplayController` untuk mengembalikan format yang sama dengan edge function, perubahan Flutter menjadi minimal.

Yang perlu diubah:
- URL endpoint (dari InsForge ke Laravel)
- Nama field jika ada perbedaan antara format edge function baru dan format Laravel
- Penghapusan cache SharedPreferences yang menggunakan key InsForge (opsional, untuk bersih-bersih)

**Field yang harus cocok antara DisplayController → Flutter:**

| Key JSON | Tipe | Keterangan |
|---|---|---|
| `mosqueProfile.name` | string | Nama masjid |
| `mosqueProfile.address` | string | Alamat |
| `mosqueProfile.logo_path` | string? | URL logo |
| `mosqueProfile.background_path` | string? | URL background |
| `prayerLocation.city_name` | string | Nama kota aktif |
| `todaySchedule.date` | string | YYYY-MM-DD |
| `todaySchedule.imsak` | string | HH:MM |
| `todaySchedule.subuh` | string | HH:MM |
| `todaySchedule.syuruq` | string | HH:MM |
| `todaySchedule.dzuhur` | string | HH:MM |
| `todaySchedule.ashar` | string | HH:MM |
| `todaySchedule.maghrib` | string | HH:MM |
| `todaySchedule.isya` | string | HH:MM |
| `timeCorrections` | object | { prayer: minutes } |
| `hijriCorrectionDays` | int | Koreksi hari hijriyah |
| `iqamahSettings` | object | { prayer: { is_enabled, duration_minutes } } |
| `adzanSettings.durationSeconds` | int | Durasi overlay adzan |
| `adzanSettings.displayMessage` | string? | Pesan overlay adzan |
| `audioSettings` | object | Nested per tipe audio |
| `syuruqSettings` | object | { is_enabled, durationMinutes, displayMessage } |
| `countdownSettings` | object? | { prayer: minutes } |
| `donationSettings` | object | Pengaturan donasi |
| `fridaySettings` | object | Pengaturan Jumat |
| `themeSettings` | object | { primary_color, secondary_color, ... } |
| `mediaItems` | array | Daftar slide media |
| `runningTexts` | array | Daftar running text |
| `agendas` | array | Daftar agenda |
| `upcoming_islamic_holiday` | object? | Hari besar Islam terdekat |

### 5. Pembersihan — Hapus InsForge

**File/direktori yang dihapus:**

| Path | Alasan |
|---|---|
| `mobile/backend/` | Seluruh InsForge Edge Function |
| `mobile/backend/.insforge/` | Kredensial InsForge |
| `.insforge/` | Kredensial InsForge root |
| `src/` | Seluruh React SPA (diganti Blade) |
| `package.json` | Dependensi Node.js (React, Vite, Tailwind) |
| `package-lock.json` | Lockfile |
| `vite.config.ts` | Konfigurasi Vite |
| `tsconfig.json` | Konfigurasi TypeScript |
| `index.html` | Entry point React SPA |
| `node_modules/` | Dependensi |
| `public/dist/` | Build output React |
| `.env` (InsForge bagian) | Hapus APP_KEY InsForge jika ada |

**File yang dimodifikasi:**

| Path | Perubahan |
|---|---|
| `AGENTS.md` | Hapus bagian InsForge, ganti dengan dokumentasi Laravel |
| `composer.json` | Pastikan semua dependensi ada |
| `.gitignore` | Hapus referensi InsForge |
| `.env` | Pastikan tidak ada referensi InsForge |

### 6. Urutan Implementasi

| Langkah | Deskripsi | File yang Disentuh |
|---|---|---|
| 1 | Tambah migration `countdown_settings` + model | `database/migrations/`, `app/Models/CountdownSetting.php` |
| 2 | Buat `RandomContentService` — integrasi MyQuran API + eQuran API | `app/Services/RandomContentService.php` |
| 3 | Modifikasi `DisplayController` — format response baru untuk Flutter | `app/Http/Controllers/DisplayController.php` |
| 4 | Setup Blade admin: layout, auth, login | `resources/views/layouts/admin.blade.php`, `resources/views/admin/login.blade.php`, `app/Http/Controllers/Admin/AuthController.php`, `routes/web.php` |
| 5 | Buat admin controllers (16 controller baru) | `app/Http/Controllers/Admin/*.php` |
| 6 | Buat Blade views (18 template) | `resources/views/admin/*.blade.php` |
| 7 | Ubah URL Flutter ke Laravel API | `mobile/lib/services/api_service.dart` |
| 8 | Pastikan parsing Flutter sesuai format Laravel | `mobile/lib/main.dart` |
| 9 | Uji integrasi Flutter ↔ Laravel | Manual testing |
| 10 | Hapus InsForge: `src/`, `mobile/backend/`, `package.json`, `node_modules/`, `.insforge/` | Root project |
| 11 | Bersihkan `AGENTS.md`, `.gitignore`, `.env` | Root project |

### 7. Rencana Pengujian

| Skenario | Metode |
|---|---|
| Login admin | Buka `/admin/login`, masukkan kredensial, verifikasi redirect ke dashboard |
| Logout | Klik logout, verifikasi session habis |
| CRUD profil masjid | Ubah nama/logo/background, verifikasi tersimpan di DB dan tampil di display |
| Sinkronisasi jadwal | Klik sync, verifikasi jadwal terbaru dari MyQuran API tersimpan |
| Upload audio | Upload file MP3 adzan/murottal, verifikasi file tersimpan dan URL benar |
| CRUD media | Tambah/hapus/ubah slide, verifikasi urutan benar |
| CRUD running text | Tambah/hapus running text, verifikasi tampil di display |
| CRUD agenda | Tambah/hapus agenda, verifikasi tampil di display |
| Tema | Ubah warna, verifikasi perubahan tampil di Flutter display |
| Flutter display | Jalankan Flutter app, verifikasi data dari Laravel API muncul dengan benar |
| Auth Flutter | Verifikasi endpoint `/api/display/state` bisa diakses tanpa auth |
| Random content | Verifikasi hadis/doa acak muncul di media items |

### 8. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Format JSON Laravel ≠ format yang diharapkan Flutter | Flutter display tidak tampil | Buat contract test sederhana: assert format JSON sebelum deploy |
| Blade admin panel membutuhkan waktu lama | Timeline memanjang | Fokus ke halaman inti dulu (dashboard, profile, jadwal, iqamah, audio) |
| Integrasi API eksternal (MyQuran, eQuran) mati | Konten acak tidak muncul | Fallback ke null/empty, display tetap berjalan tanpa hadis/doa |
| File upload bermasalah | Logo/audio tidak bisa diunggah | Pastikan `storage:link` sudah dijalankan, folder writable |
| Mobile/backend dihapus terlalu cepat | Tidak bisa rollback | Git branch: lakukan semua perubahan di branch `migrate-to-laravel`, merge setelah uji |

### 9. Non-Rencana

Hal-hal yang **tidak** termasuk dalam cakupan migrasi ini:

- Migrasi data dari InsForge ke MySQL (keputusan: mulai dari nol)
- Perubahan UI/UX Blade admin (porting fungsi yang ada, bukan redesign)
- Deployment ke production ( hanya kode, bukan infrastruktur )
- SSL certificate setup
- Backup strategy
