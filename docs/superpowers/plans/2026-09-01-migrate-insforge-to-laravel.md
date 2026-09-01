# Migrasi InsForge ke Laravel 13 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrasi seluruh backend dari InsForge BaaS ke Laravel 13 — panel admin React diganti Blade, Flutter display dialihkan ke Laravel API.

**Architecture:** Satu backend Laravel 13 dengan MySQL. Admin panel menggunakan Blade + Tailwind CSS CDN + Alpine.js. Flutter display mengakses endpoint publik `/api/display/state`. Endpoint admin menggunakan session auth.

**Tech Stack:** Laravel 13 (PHP 8.3+), Blade, Alpine.js, Tailwind CSS (CDN), MySQL, Flutter (Dart)

**Spec:** `docs/superpowers/specs/2026-09-01-migrate-insforge-to-laravel-design.md`

## Global Constraints

- PHP ^8.3
- Laravel ^13.8
- Flutter SDK ^3.12.2
- Tailwind CSS via CDN Play (tidak perlu Node.js/Vite)
- Alpine.js via CDN
- Database: MySQL (database `masjid`)
- Timezone: Asia/Jakarta
- Semua nama tabel sudah ada di migrations kecuali `countdown_settings`

## File Structure

```
database/migrations/
  2026_01_01_000016_create_countdown_settings_table.php  (baru)

app/Models/
  CountdownSetting.php  (baru)

app/Services/
  RandomContentService.php  (baru)

app/Http/Controllers/
  DisplayController.php  (modifikasi — format baru untuk Flutter)

app/Http/Controllers/Admin/
  AuthController.php  (baru)
  AdminDashboardController.php  (baru)
  AdminMosqueProfileController.php  (baru)
  AdminPrayerScheduleController.php  (baru)
  AdminIqamahController.php  (baru)
  AdminSyuruqController.php  (baru)
  AdminAudioController.php  (baru)
  AdminMediaController.php  (baru)
  AdminDonationController.php  (baru)
  AdminRunningTextController.php  (baru)
  AdminAgendaController.php  (baru)
  AdminThemeController.php  (baru)
  AdminHijriController.php  (baru)
  AdminCountdownController.php  (baru)
  AdminFridayController.php  (baru)
  AdminAccountController.php  (baru)

resources/views/
  layouts/admin.blade.php  (baru)
  admin/login.blade.php  (baru)
  admin/dashboard.blade.php  (baru)
  admin/profile.blade.php  (baru)
  admin/prayer-schedule.blade.php  (baru)
  admin/iqamah.blade.php  (baru)
  admin/syuruq.blade.php  (baru)
  admin/audio.blade.php  (baru)
  admin/media.blade.php  (baru)
  admin/donation.blade.php  (baru)
  admin/running-text.blade.php  (baru)
  admin/agenda.blade.php  (baru)
  admin/theme.blade.php  (baru)
  admin/hijri.blade.php  (baru)
  admin/countdown.blade.php  (baru)
  admin/friday.blade.php  (baru)
  admin/account.blade.php  (baru)

routes/web.php  (modifikasi)

mobile/lib/services/api_service.dart  (modifikasi)
mobile/lib/main.dart  (modifikasi kecil)
```

---

## Task 1: Database Foundation — Migration + Model

**Files:**
- Create: `database/migrations/2026_01_01_000016_create_countdown_settings_table.php`
- Create: `app/Models/CountdownSetting.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `CountdownSetting` model dengan method `getMinutesFor(string $prayer): int`

- [ ] **Step 1: Buat migration `countdown_settings`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countdown_settings', function (Blueprint $table) {
            $table->id();
            $table->string('prayer_name', 20)->unique();
            $table->integer('minutes')->default(5);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countdown_settings');
    }
};
```

- [ ] **Step 2: Buat Model `CountdownSetting`**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CountdownSetting extends Model
{
    protected $fillable = ['prayer_name', 'minutes'];

    public function getMinutesFor(string $prayer): int
    {
        $row = static::where('prayer_name', $prayer)->first();
        return $row ? (int) $row->minutes : 5;
    }

    public static function allAsArray(): array
    {
        return static::all()->pluck('minutes', 'prayer_name')->toArray();
    }
}
```

- [ ] **Step 3: Buat seeder default untuk countdown settings**

Tambahkan di `database/seeders/DatabaseSeeder.php`:

```php
// Di method run():
$prayers = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
foreach ($prayers as $prayer) {
    \App\Models\CountdownSetting::updateOrCreate(
        ['prayer_name' => $prayer],
        ['minutes' => 5]
    );
}

// Seed admin user jika belum ada
\App\Models\User::firstOrCreate(
    ['email' => 'admin@masjid.test'],
    [
        'name' => 'Pengurus Masjid',
        'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
    ]
);
```

- [ ] **Step 4: Jalankan migration & seed**

```bash
php artisan migrate:fresh --seed
```

- [ ] **Step 5: Commit**

```bash
git add database/migrations/ database/seeders/ app/Models/CountdownSetting.php
git commit -m "feat: add countdown_settings migration, model, and seeder"
```

---

## Task 2: RandomContentService — Integrasi API Eksternal

**Files:**
- Create: `app/Services/RandomContentService.php`

**Interfaces:**
- Produces: `RandomContentService::getRandomHadis(): ?array` — mengembalikan media item hadis acak
- Produces: `RandomContentService::getRandomDoa(): ?array` — mengembalikan media item doa acak

- [ ] **Step 1: Buat `RandomContentService`**

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class RandomContentService
{
    private const HADIS_CACHE_KEY = 'random_hadis';
    private const DOA_CACHE_KEY = 'random_doa';
    private const CACHE_TTL = 1800; // 30 menit

    /**
     * Ambil hadis acak dari MyQuran API, di-cache 30 menit.
     * Mengembalikan array siap pakai sebagai media item, atau null jika gagal.
     */
    public function getRandomHadis(): ?array
    {
        return Cache::remember(self::HADIS_CACHE_KEY, self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(5)->get('https://api.myquran.com/v3/hadis/enc/random');
                if ($response->failed()) return null;

                $json = $response->json();
                $data = $json['data'] ?? null;
                $text = $data['text'] ?? null;

                if (!$text || empty($text['ar']) || empty($text['id'])) return null;

                $takhrij = $data['takhrij'] ?? '';
                $grade = $data['grade'] ?? '';
                $translation = $text['id'] . ($takhrij ? "\nTakhrij: $takhrij" : '');

                return [
                    'id' => 'random_hadis',
                    'title' => 'HADIS PILIHAN',
                    'type' => 'hadith',
                    'content' => json_encode([
                        'subtitle' => $grade ? "Grade: $grade" : '',
                        'arabic_text' => $text['ar'],
                        'content' => $translation,
                    ]),
                    'duration_seconds' => 10,
                    'sort_order' => -9999,
                    'is_active' => true,
                ];
            } catch (\Throwable $e) {
                report($e);
                return null;
            }
        });
    }

    /**
     * Ambil doa acak dari eQuran API, di-cache 30 menit.
     * Mengembalikan array siap pakai sebagai media item, atau null jika gagal.
     */
    public function getRandomDoa(): ?array
    {
        return Cache::remember(self::DOA_CACHE_KEY, self::CACHE_TTL, function () {
            try {
                $response = Http::timeout(5)->get('https://equran.id/api/doa');
                if ($response->failed()) return null;

                $json = $response->json();
                $items = collect($json['data'] ?? [])->filter(function ($item) {
                    return isset($item['ar']) && preg_match('/[\x{0600}-\x{06FF}]/u', $item['ar']);
                });

                if ($items->isEmpty()) return null;

                $item = $items->random();

                return [
                    'id' => 'random_doa',
                    'title' => 'DOA PILIHAN',
                    'type' => 'hadith',
                    'content' => json_encode([
                        'subtitle' => $item['nama'] ?? $item['grup'] ?? '',
                        'arabic_text' => $item['ar'],
                        'content' => $item['idn'] ?? $item['tr'] ?? '',
                    ]),
                    'duration_seconds' => 10,
                    'sort_order' => -10000,
                    'is_active' => true,
                ];
            } catch (\Throwable $e) {
                report($e);
                return null;
            }
        });
    }
}
```

- [ ] **Step 2: Jalankan test manual**

```bash
php artisan tinker --execute="
\$s = new \App\Services\RandomContentService();
\$h = \$s->getRandomHadis();
echo \$h ? 'HADIS OK: ' . \$h['title'] : 'HADIS FAILED';
echo PHP_EOL;
\$d = \$s->getRandomDoa();
echo \$d ? 'DOA OK: ' . \$d['title'] : 'DOA FAILED';
echo PHP_EOL;
"
```

Expected: Menampilkan `HADIS OK: HADIS PILIHAN` dan `DOA OK: DOA PILIHAN` (atau FAILED jika API eksternal down, yang juga acceptable).

- [ ] **Step 3: Commit**

```bash
git add app/Services/RandomContentService.php
git commit -m "feat: add RandomContentService for hadis/doa from external APIs"
```

---

## Task 3: DisplayController — Format JSON Baru untuk Flutter

**Files:**
- Modify: `app/Http/Controllers/DisplayController.php`

**Interfaces:**
- Consumes: `RandomContentService::getRandomHadis()`, `RandomContentService::getRandomDoa()`
- Produces: Response JSON dengan key `status` + `data` yang berisi seluruh state display

- [ ] **Step 1: Rewrite `DisplayController::state()`**

Ganti seluruh isi method `state()` dengan:

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\PrayerTimeCorrection;
use App\Models\IqamahSetting;
use App\Models\MediaItem;
use App\Models\RunningText;
use App\Models\AudioSetting;
use App\Models\DonationSetting;
use App\Models\ThemeSetting;
use App\Models\Agenda;
use App\Models\FridaySetting;
use App\Models\SyuruqSetting;
use App\Models\CountdownSetting;
use App\Services\HijriDateService;
use App\Services\RandomContentService;

class DisplayController extends Controller
{
    public function state(
        HijriDateService $hijriService,
        RandomContentService $randomContent,
    ): JsonResponse {
        // --- Profile ---
        $profile = MosqueProfile::first();

        // --- Location ---
        $location = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();

        // --- Schedule (auto-sync jika kosong) ---
        $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first();
        if (!$schedule) {
            $prayerService = app(\App\Services\PrayerScheduleService::class);
            $prayerService->syncSchedules(
                $location?->province_name ?? 'Sumatera Barat',
                $location?->city_name ?? 'Kota Padang'
            );
            $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first() ?? PrayerSchedule::first();
        }
        $scheduleData = $schedule ? [
            'date' => $schedule->date,
            'imsak' => $this->timeOnly($schedule->imsak),
            'subuh' => $this->timeOnly($schedule->subuh),
            'syuruq' => $this->timeOnly($schedule->syuruq),
            'dzuhur' => $this->timeOnly($schedule->dzuhur),
            'ashar' => $this->timeOnly($schedule->ashar),
            'maghrib' => $this->timeOnly($schedule->maghrib),
            'isya' => $this->timeOnly($schedule->isya),
        ] : $this->defaultSchedule();

        // --- Time corrections ---
        $correctionsDb = PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name')->toArray();
        $corrections = array_merge([
            'imsak' => 0, 'subuh' => 0, 'syuruq' => 0, 'dzuhur' => 0,
            'ashar' => 0, 'maghrib' => 0, 'isya' => 0,
        ], $correctionsDb);

        // Apply corrections ke todaySchedule
        $todaySchedule = $scheduleData;
        foreach ($corrections as $prayer => $minutes) {
            if ($prayer !== 'date' && isset($todaySchedule[$prayer]) && $minutes != 0) {
                $todaySchedule[$prayer] = $this->correctedTime($todaySchedule[$prayer], (int) $minutes);
            }
        }

        // --- Hijri correction ---
        $hijriCorrectionDays = (int) ($profile?->hijri_correction ?? 0);

        // --- Iqamah settings ---
        $iqamahDefaults = ['subuh' => 10, 'dzuhur' => 7, 'ashar' => 7, 'maghrib' => 5, 'isya' => 7];
        $iqamahRows = IqamahSetting::all()->keyBy('prayer_name');
        $iqamahSettings = [];
        foreach ($iqamahDefaults as $prayer => $default) {
            $row = $iqamahRows->get($prayer);
            $iqamahSettings[$prayer] = [
                'is_enabled' => $row ? (bool) $row->is_enabled : true,
                'duration_minutes' => $row ? (int) $row->duration_minutes : $default,
            ];
        }

        // --- Audio settings ---
        $audioRows = AudioSetting::all()->keyBy('type');
        $audioSettings = $this->buildAudioSettings($audioRows);

        // --- Adzan settings (dari audio_settings + display) ---
        $adzanRow = $audioRows->get('adzan');
        $adzanSettings = [
            'durationSeconds' => $adzanRow ? (int) $adzanRow->play_after_minutes : 180,
            'displayMessage' => 'Mari Menunaikan Shalat Berjamaah di Masjid',
        ];

        // --- Syuruq settings ---
        $syuruqRow = SyuruqSetting::first();
        $syuruqSettings = [
            'is_enabled' => $syuruqRow ? (bool) $syuruqRow->is_enabled : true,
            'durationMinutes' => $syuruqRow ? (int) $syuruqRow->duration_minutes : 10,
            'displayMessage' => 'Waktu terlarang shalat saat matahari terbit hingga masuk waktu Dhuha',
        ];

        // --- Countdown settings ---
        $countdownSettings = CountdownSetting::allAsArray();
        if (empty($countdownSettings)) {
            $countdownSettings = ['subuh' => 5, 'dzuhur' => 5, 'ashar' => 5, 'maghrib' => 5, 'isya' => 5];
        }

        // --- Donation ---
        $donation = DonationSetting::where('is_active', true)->first();

        // --- Friday ---
        $friday = FridaySetting::first();

        // --- Theme ---
        $theme = ThemeSetting::where('is_active', true)->first() ?? ThemeSetting::first();

        // --- Media items (active, termasuk random hadis/doa) ---
        $mediaItems = MediaItem::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'type' => $item->type,
                    'content' => $item->content,
                    'file_path' => $item->file_path,
                    'url' => $item->file_path,
                    'duration_seconds' => $item->duration_seconds,
                    'sort_order' => $item->sort_order,
                    'is_active' => (bool) $item->is_active,
                    'starts_at' => $item->starts_at,
                    'ends_at' => $item->ends_at,
                ];
            })
            ->toArray();

        // Inject random hadis & doa
        $randomHadis = $randomContent->getRandomHadis();
        $randomDoa = $randomContent->getRandomDoa();
        $mediaItems = array_merge(
            array_filter([$randomDoa, $randomHadis]),
            $mediaItems
        );

        // --- Running texts (active) ---
        $now = now();
        $runningTexts = RunningText::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->get()
            ->map(function ($item) {
                return [
                    'text' => $item->text,
                    'speed' => match ($item->speed) {
                        'slow' => 30, 'normal' => 50, 'fast' => 80, default => 50,
                    },
                    'category' => $item->category ?? 'umum',
                    'is_active' => (bool) $item->is_active,
                ];
            })
            ->toArray();

        // --- Agendas (active, upcoming) ---
        $todayStr = date('Y-m-d');
        $agendas = Agenda::where('is_active', true)
            ->where('date', '>=', $todayStr)
            ->orderBy('date')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'starts_at' => $item->date . 'T' . ($item->time ?? '18:30'),
                    'is_active' => (bool) $item->is_active,
                    'is_islamic_holiday' => (bool) ($item->is_islamic_holiday ?? false),
                ];
            })
            ->toArray();

        // --- Upcoming Islamic holiday ---
        $upcomingHoliday = Agenda::where('is_active', true)
            ->where('is_islamic_holiday', true)
            ->where('date', '>=', $todayStr)
            ->orderBy('date')
            ->first();
        $holidayData = null;
        if ($upcomingHoliday) {
            $diffDays = (int) (new \DateTime($todayStr))->diff(new \DateTime($upcomingHoliday->date))->format('%r%a');
            if ($diffDays >= 0 && $diffDays <= 30) {
                $holidayData = [
                    'id' => $upcomingHoliday->id,
                    'title' => $upcomingHoliday->title,
                    'date' => $upcomingHoliday->date,
                    'description' => $upcomingHoliday->description,
                    'days_left' => $diffDays,
                ];
            }
        }

        // --- Build response ---
        return response()->json([
            'status' => 'success',
            'data' => [
                'mosqueProfile' => $profile ? [
                    'name' => $profile->name,
                    'address' => $profile->address,
                    'logo_path' => $profile->logo_path,
                    'background_path' => $profile->background_path,
                ] : null,
                'prayerLocation' => $location ? [
                    'city_name' => $location->city_name,
                    'province_name' => $location->province_name,
                    'city_code' => $location->city_code,
                ] : null,
                'todaySchedule' => $todaySchedule,
                'rawSchedule' => $scheduleData,
                'timeCorrections' => $corrections,
                'hijriCorrectionDays' => $hijriCorrectionDays,
                'iqamahSettings' => $iqamahSettings,
                'adzanSettings' => $adzanSettings,
                'audioSettings' => $audioSettings,
                'syuruqSettings' => $syuruqSettings,
                'countdownSettings' => $countdownSettings,
                'donationSettings' => $donation ? [
                    'title' => $donation->title,
                    'description' => $donation->description,
                    'qr_code_path' => $donation->qr_code_path,
                    'account_name' => $donation->account_name,
                    'is_active' => (bool) $donation->is_active,
                ] : null,
                'fridaySettings' => $friday ? [
                    'is_enabled' => (bool) $friday->is_enabled,
                    'disable_iqamah_on_friday' => (bool) $friday->disable_iqamah_on_friday,
                    'khutbah_duration_minutes' => (int) ($friday->khutbah_duration_minutes ?? 35),
                    'khutbah_title' => $friday->khutbah_title,
                    'khutbah_message' => $friday->khutbah_message,
                    'khatib_name' => $friday->khutbah_khatib,
                    'imam_name' => $friday->khutbah_imam,
                    'theme_title' => $friday->khutbah_title,
                ] : null,
                'themeSettings' => $theme ? [
                    'primary_color' => $theme->primary_color,
                    'secondary_color' => $theme->secondary_color,
                    'background_color' => $theme->background_color,
                    'text_color' => $theme->text_color,
                    'layout_config' => is_array($theme->layout_config) ? $theme->layout_config : ['mode' => 'default'],
                ] : null,
                'mediaItems' => $mediaItems,
                'runningTexts' => $runningTexts,
                'agendas' => $agendas,
                'upcoming_islamic_holiday' => $holidayData,
            ],
        ]);
    }

    private function timeOnly($value): string
    {
        if (!$value) return '00:00';
        return substr((string) $value, 0, 5);
    }

    private function correctedTime(string $time, int $minutes): string
    {
        [$h, $m] = array_map('intval', explode(':', $time));
        $total = ($h * 60 + $m + $minutes + 1440) % 1440;
        return sprintf('%02d:%02d', intdiv($total, 60), $total % 60);
    }

    private function defaultSchedule(): array
    {
        return [
            'date' => date('Y-m-d'),
            'imsak' => '04:45', 'subuh' => '04:55', 'syuruq' => '06:12',
            'dzuhur' => '12:20', 'ashar' => '15:42', 'maghrib' => '18:25', 'isya' => '19:36',
        ];
    }

    private function buildAudioSettings($audioRows): array
    {
        $adzan = $audioRows->get('adzan');
        $murottal = $audioRows->get('murottal');
        $dzikirPagi = $audioRows->get('dzikir_pagi');
        $dzikirPetang = $audioRows->get('dzikir_petang');

        return [
            'adzan' => [
                'is_enabled' => true,
                'volume' => $adzan ? (int) $adzan->volume : 80,
                'custom_url' => $adzan?->file_path,
            ],
            'murottal' => [
                'is_enabled' => $murottal ? (bool) $murottal->is_enabled : true,
                'volume' => $murottal ? (int) $murottal->volume : 80,
                'custom_url' => $murottal?->file_path,
                'play_before_minutes' => $murottal ? (int) $murottal->play_before_minutes : 5,
            ],
            'dzikir_pagi' => [
                'is_enabled' => $dzikirPagi ? (bool) $dzikirPagi->is_enabled : true,
                'volume' => $dzikirPagi ? (int) $dzikirPagi->volume : 80,
                'custom_url' => $dzikirPagi?->file_path,
                'play_after_minutes' => $dzikirPagi ? (int) $dzikirPagi->play_after_minutes : 10,
            ],
            'dzikir_petang' => [
                'is_enabled' => $dzikirPetang ? (bool) $dzikirPetang->is_enabled : true,
                'volume' => $dzikirPetang ? (int) $dzikirPetang->volume : 80,
                'custom_url' => $dzikirPetang?->file_path,
                'play_after_minutes' => $dzikirPetang ? (int) $dzikirPetang->play_after_minutes : 10,
            ],
        ];
    }
}
```

- [ ] **Step 2: Pastikan route sudah ada**

Pastikan `routes/api.php` memiliki route:

```php
Route::get('/display/state', [DisplayController::class, 'state']);
```

Route ini sudah ada — tidak perlu diubah.

- [ ] **Step 3: Test endpoint**

```bash
php artisan serve
curl -s http://127.0.0.1:8000/api/display/state | python3 -m json.tool | head -50
```

Expected: JSON dengan `status: "success"` dan `data` berisi semua field (mosqueProfile, todaySchedule, iqamahSettings, dll).

- [ ] **Step 4: Commit**

```bash
git add app/Http/Controllers/DisplayController.php
git commit -m "feat: rewrite DisplayController with Flutter-compatible JSON format"
```

---

## Task 4: Sistem Autentikasi Admin — Auth + Layout

**Files:**
- Create: `app/Http/Controllers/Admin/AuthController.php`
- Create: `resources/views/layouts/admin.blade.php`
- Create: `resources/views/admin/login.blade.php`
- Modify: `routes/web.php`

**Interfaces:**
- Produces: `AuthController::showLogin()`, `AuthController::login()`, `AuthController::logout()`
- Produces: Layout `layouts/admin.blade.php` yang digunakan semua halaman admin

- [ ] **Step 1: Buat AuthController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect()->route('admin.dashboard');
        }
        return view('admin.login');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return back()->withErrors([
                'email' => 'Email atau kata sandi tidak valid.',
            ])->withInput($request->only('email'));
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('admin.dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('admin.login');
    }
}
```

- [ ] **Step 2: Buat layout admin (`layouts/admin.blade.php`)**

```blade
<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin') — Masjid Display</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex">
    {{-- Sidebar --}}
    <aside class="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 min-h-screen">
        <div>
            <div class="flex items-center gap-3 px-3 py-3 mb-6 border-b border-slate-800">
                <div class="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                    <h2 class="text-sm font-bold text-white">Masjid Display</h2>
                    <span class="text-[11px] text-emerald-400 font-semibold">Panel Admin</span>
                </div>
            </div>
            <nav class="space-y-1">
                @php
                    $navItems = [
                        ['route' => 'admin.dashboard', 'label' => 'Dashboard', 'icon' => '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>'],
                        ['route' => 'admin.profile.edit', 'label' => 'Profil Masjid'],
                        ['route' => 'admin.schedule.index', 'label' => 'Jadwal Sholat'],
                        ['route' => 'admin.iqamah.edit', 'label' => 'Iqamah'],
                        ['route' => 'admin.syuruq.edit', 'label' => 'Syuruq'],
                        ['route' => 'admin.audio.edit', 'label' => 'Audio'],
                        ['route' => 'admin.media.index', 'label' => 'Slide & Media'],
                        ['route' => 'admin.donation.edit', 'label' => 'QR Donasi'],
                        ['route' => 'admin.running-text.index', 'label' => 'Running Text'],
                        ['route' => 'admin.agenda.index', 'label' => 'Agenda'],
                        ['route' => 'admin.theme.edit', 'label' => 'Tema & Desain'],
                        ['route' => 'admin.hijri.edit', 'label' => 'Hijriyah'],
                        ['route' => 'admin.countdown.edit', 'label' => 'Countdown'],
                        ['route' => 'admin.friday.edit', 'label' => 'Jumat'],
                        ['route' => 'admin.account.edit', 'label' => 'Akun'],
                    ];
                @endphp
                @foreach($navItems as $item)
                    <a href="{{ route($item['route']) }}"
                       class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition {{ request()->routeIs($item['route']) ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60' }}">
                        @if(isset($item['icon']))
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{!! $item['icon'] !!}</svg>
                        @endif
                        <span>{{ $item['label'] }}</span>
                    </a>
                @endforeach
            </nav>
        </div>
        <div class="pt-4 border-t border-slate-800">
            <form method="POST" action="{{ route('admin.logout') }}">
                @csrf
                <button type="submit" class="w-full py-2.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    Keluar
                </button>
            </form>
        </div>
    </aside>

    {{-- Main --}}
    <div class="flex-1 flex flex-col min-h-screen">
        <header class="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
            <h1 class="text-lg font-bold text-white">@yield('header', 'Dashboard')</h1>
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-full">Online</span>
                <span class="text-xs text-slate-400">{{ Auth::user()->email ?? '' }}</span>
            </div>
        </header>
        <main class="p-6 lg:p-8 flex-1">
            @if(session('success'))
                <div x-data="{ show: true }" x-show="show" x-init="setTimeout(() => show = false, 3000)"
                     class="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold rounded-xl flex items-center justify-between">
                    <span>{{ session('success') }}</span>
                    <button @click="show = false" class="text-emerald-400 hover:text-white">&times;</button>
                </div>
            @endif
            @if(session('error'))
                <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold rounded-xl">
                    {{ session('error') }}
                </div>
            @endif
            @yield('content')
        </main>
    </div>
</body>
</html>
```

- [ ] **Step 3: Buat halaman login (`admin/login.blade.php`)**

```blade
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — Masjid Display</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
        <div class="text-center space-y-2">
            <div class="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-2">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h1 class="text-2xl font-black text-white">Masjid Display</h1>
            <p class="text-xs text-slate-400">Masuk ke Panel Pengurus Admin</p>
        </div>

        @if($errors->any())
            <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('admin.login.post') }}" class="space-y-4">
            @csrf
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                <input type="email" name="email" value="{{ old('email') }}" required
                       class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                       placeholder="admin@masjid.test">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <input type="password" name="password" required
                       class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                       placeholder="••••••••">
            </div>
            <button type="submit"
                    class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition">
                Masuk Ke Dashboard
            </button>
        </form>
    </div>
</body>
</html>
```

- [ ] **Step 4: Buat route auth di `routes/web.php`**

Ganti seluruh isi `routes/web.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\AuthController;

// === Auth Routes ===
Route::get('/admin/login', [AuthController::class, 'showLogin'])->name('admin.login');
Route::post('/admin/login', [AuthController::class, 'login'])->name('admin.login.post');
Route::post('/admin/logout', [AuthController::class, 'logout'])->name('admin.logout');

// === Protected Admin Routes ===
Route::middleware('auth')->prefix('admin')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));

    Route::get('/dashboard', fn () => view('admin.dashboard'))->name('admin.dashboard');

    // Placeholder routes untuk halaman yang akan dibuat di Task 5-9
    // Semua halaman admin diarahkan ke view Blade yang sesuai
});

// === Public SPA fallback (display) ===
Route::fallback(function () {
    $indexPath = public_path('dist/index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response('Application not ready.', 404);
});
```

- [ ] **Step 5: Pastikan middleware auth bekerja**

Pastikan `config/auth.php` menggunakan driver `session` (default Laravel). Tidak perlu diubah.

- [ ] **Step 6: Test login flow**

```bash
php artisan serve
# Buka http://127.0.0.1:8000/admin
# Expected: redirect ke /admin/login
# Login dengan admin@masjid.test / admin123
# Expected: redirect ke /admin/dashboard
```

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/ resources/views/layouts/ resources/views/admin/login.blade.php routes/web.php
git commit -m "feat: add admin auth system with login page and admin layout"
```

---

## Task 5: Admin Pages — Dashboard + Profil Masjid

**Files:**
- Create: `app/Http/Controllers/Admin/AdminDashboardController.php`
- Create: `app/Http/Controllers/Admin/AdminMosqueProfileController.php`
- Create: `resources/views/admin/dashboard.blade.php`
- Create: `resources/views/admin/profile.blade.php`
- Modify: `routes/web.php` (tambah route)

**Interfaces:**
- Consumes: Session auth (Task 4)
- Produces: Halaman dashboard dan profil masjid

- [ ] **Step 1: Buat AdminDashboardController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MosqueProfile;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\MediaItem;
use App\Models\RunningText;
use App\Models\SyncLog;
use App\Models\ThemeSetting;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return view('admin.dashboard', [
            'profile' => MosqueProfile::first(),
            'location' => PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first(),
            'schedule' => PrayerSchedule::where('date', date('Y-m-d'))->first(),
            'activeMediaCount' => MediaItem::where('is_active', true)->count(),
            'activeTextCount' => RunningText::where('is_active', true)->count(),
            'theme' => ThemeSetting::where('is_active', true)->first(),
            'latestLog' => SyncLog::orderBy('created_at', 'desc')->first(),
        ]);
    }
}
```

- [ ] **Step 2: Buat view dashboard (`admin/dashboard.blade.php`)**

```blade
@extends('layouts.admin')
@section('title', 'Dashboard')
@section('header', 'Dashboard Pengurus Masjid')

@section('content')
<div class="space-y-6">
    {{-- Banner --}}
    <div class="bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border border-emerald-500/30 p-6 rounded-3xl">
        <h2 class="text-2xl font-black text-white">{{ $profile->name ?? 'Masjid Display' }}</h2>
        <p class="text-sm text-slate-300 mt-1">{{ $profile->address ?? '-' }}</p>
    </div>

    {{-- Status Log --}}
    @if($latestLog)
    <div class="p-4 rounded-2xl border text-xs font-semibold {{ $latestLog->status === 'failed' ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' }}">
        <strong>Log:</strong> {{ $latestLog->message }}
        <span class="float-right text-slate-400">{{ $latestLog->created_at->format('H:i') }} WIB</span>
    </div>
    @endif

    {{-- Metrics --}}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Kota Aktif</span>
            <h4 class="text-lg font-bold text-white mt-1">{{ $location->city_name ?? '-' }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Slide Media Aktif</span>
            <h4 class="text-2xl font-black text-white mt-1">{{ $activeMediaCount }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Running Text</span>
            <h4 class="text-2xl font-black text-white mt-1">{{ $activeTextCount }}</h4>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <span class="text-xs text-slate-400">Tema Aktif</span>
            <h4 class="text-base font-bold text-white mt-1">{{ $theme->theme_name ?? '-' }}</h4>
        </div>
    </div>
</div>
@endsection
```

- [ ] **Step 3: Buat AdminMosqueProfileController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\MosqueProfile;

class AdminMosqueProfileController extends Controller
{
    public function edit()
    {
        $profile = MosqueProfile::firstOrCreate(['id' => 1], [
            'name' => 'MASJID AL-HIDAYAH SITEBA',
            'address' => 'Jl. Raya Siteba No. 15, Surau Gadang, Padang',
            'timezone' => 'Asia/Jakarta',
        ]);
        return view('admin.profile', compact('profile'));
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:2000',
            'contact' => 'nullable|string|max:255',
            'timezone' => 'required|string|max:50',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:5120',
            'background' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        $profile = MosqueProfile::firstOrCreate(['id' => 1]);

        if ($request->hasFile('logo')) {
            if ($profile->logo_path && str_contains($profile->logo_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $profile->logo_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('logo')->store('uploads/logos', 'public');
            $validated['logo_path'] = Storage::url($path);
        }

        if ($request->hasFile('background')) {
            if ($profile->background_path && str_contains($profile->background_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $profile->background_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('background')->store('uploads/backgrounds', 'public');
            $validated['background_path'] = Storage::url($path);
        }

        unset($validated['logo'], $validated['background']);
        $profile->update($validated);

        return redirect()->route('admin.profile.edit')->with('success', 'Profil masjid berhasil diperbarui.');
    }
}
```

- [ ] **Step 4: Buat view profil masjid (`admin/profile.blade.php`)**

```blade
@extends('layouts.admin')
@section('title', 'Profil Masjid')
@section('header', 'Pengaturan Profil Masjid')

@section('content')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.profile.update') }}" enctype="multipart/form-data" class="space-y-6" x-data="{ saving: false }" @submit="saving = true">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Identitas Masjid</h3>

            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nama Masjid</label>
                <input type="text" name="name" value="{{ old('name', $profile->name) }}" required
                       class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition">
                @error('name') <span class="text-red-400 text-xs">{{ $message }}</span> @enderror
            </div>

            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Alamat</label>
                <textarea name="address" rows="2" required
                          class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition">{{ old('address', $profile->address) }}</textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Kontak</label>
                    <input type="text" name="contact" value="{{ old('contact', $profile->contact) }}"
                           class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Timezone</label>
                    <select name="timezone" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 transition">
                        <option value="Asia/Jakarta" {{ $profile->timezone === 'Asia/Jakarta' ? 'selected' : '' }}>WIB (Asia/Jakarta)</option>
                        <option value="Asia/Makassar" {{ $profile->timezone === 'Asia/Makassar' ? 'selected' : '' }}>WITA (Asia/Makassar)</option>
                        <option value="Asia/Jayapura" {{ $profile->timezone === 'Asia/Jayapura' ? 'selected' : '' }}>WIT (Asia/Jayapura)</option>
                    </select>
                </div>
            </div>
        </div>

        {{-- Logo --}}
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">Logo & Latar Belakang</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Logo Masjid</label>
                    @if($profile->logo_path)
                        <img src="{{ $profile->logo_path }}" class="w-20 h-20 object-cover rounded-xl border border-slate-700 mb-2">
                    @endif
                    <input type="file" name="logo" accept="image/*" class="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Latar Belakang</label>
                    @if($profile->background_path)
                        <img src="{{ $profile->background_path }}" class="w-full h-20 object-cover rounded-xl border border-slate-700 mb-2">
                    @endif
                    <input type="file" name="background" accept="image/*" class="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                </div>
            </div>
        </div>

        <button type="submit" :disabled="saving"
                class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition disabled:opacity-50">
            <span x-show="!saving">Simpan Perubahan</span>
            <span x-show="saving">Menyimpan...</span>
        </button>
    </form>
</div>
@endsection
```

- [ ] **Step 5: Tambah routes ke `routes/web.php`**

Tambahkan di dalam group `middleware('auth')->prefix('admin')`:

```php
Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('admin.dashboard');
Route::get('/profil-masjid', [\App\Http\Controllers\Admin\AdminMosqueProfileController::class, 'edit'])->name('admin.profile.edit');
Route::post('/profil-masjid', [\App\Http\Controllers\Admin\AdminMosqueProfileController::class, 'update'])->name('admin.profile.update');
```

- [ ] **Step 6: Test**

```bash
php artisan serve
# Login → Dashboard tampil dengan data dari DB
# Klik Profil Masjid → Form edit tampil
# Ubah nama → Save → Verifikasi ter-update
```

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/AdminDashboardController.php app/Http/Controllers/Admin/AdminMosqueProfileController.php resources/views/admin/dashboard.blade.php resources/views/admin/profile.blade.php routes/web.php
git commit -m "feat: add admin dashboard and mosque profile pages (Blade)"
```

---

## Task 6: Admin Pages — Jadwal Sholat + Koreksi + Sinkronisasi

**Files:**
- Create: `app/Http/Controllers/Admin/AdminPrayerScheduleController.php`
- Create: `resources/views/admin/prayer-schedule.blade.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `PrayerScheduleService` (sudah ada), `PrayerLocation`, `PrayerSchedule`, `PrayerTimeCorrection` models

- [ ] **Step 1: Buat AdminPrayerScheduleController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\PrayerTimeCorrection;
use App\Services\PrayerScheduleService;

class AdminPrayerScheduleController extends Controller
{
    protected PrayerScheduleService $service;

    public function __construct(PrayerScheduleService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        $locations = PrayerLocation::all();
        $activeLocation = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first();
        $corrections = PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name');
        $provinces = $this->service->getProvinces();

        return view('admin.prayer-schedule', compact('locations', 'activeLocation', 'schedule', 'corrections', 'provinces'));
    }

    public function updateLocation(Request $request)
    {
        $validated = $request->validate([
            'province_name' => 'required|string',
            'city_name' => 'required|string',
        ]);

        PrayerLocation::query()->update(['is_active' => false]);
        $cityCode = strtolower(str_replace([' ', '.'], ['-', ''], $validated['city_name']));
        $location = PrayerLocation::updateOrCreate(
            ['city_name' => $validated['city_name']],
            ['province_name' => $validated['province_name'], 'city_code' => $cityCode, 'is_active' => true]
        );

        $this->service->syncSchedules($validated['province_name'], $validated['city_name']);

        return redirect()->route('admin.schedule.index')->with('success', 'Lokasi berhasil diubah dan jadwal disinkronkan.');
    }

    public function updateCorrections(Request $request)
    {
        $validated = $request->validate([
            'corrections' => 'required|array',
            'corrections.*' => 'integer|min:-60|max:60',
        ]);

        foreach ($validated['corrections'] as $prayer => $minutes) {
            PrayerTimeCorrection::updateOrCreate(
                ['prayer_name' => $prayer],
                ['correction_minutes' => $minutes]
            );
        }

        return redirect()->route('admin.schedule.index')->with('success', 'Koreksi waktu sholat berhasil disimpan.');
    }

    public function sync()
    {
        $activeLocation = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $success = $this->service->syncSchedules(
            $activeLocation->province_name ?? 'Sumatera Barat',
            $activeLocation->city_name ?? 'Kota Padang'
        );

        SyncLog::create([
            'type' => 'schedule_sync',
            'status' => $success ? 'success' : 'failed',
            'message' => $success
                ? "Sinkronisasi jadwal untuk {$activeLocation->city_name} berhasil."
                : "Gagal sinkronisasi jadwal untuk {$activeLocation->city_name}.",
            'details' => ['city' => $activeLocation->city_name, 'time' => now()->toIso8601String()],
        ]);

        return redirect()->route('admin.schedule.index')->with(
            $success ? 'success' : 'error',
            $success ? 'Jadwal sholat berhasil disinkronkan.' : 'Gagal mensinkronkan jadwal sholat.'
        );
    }

    public function provinces()
    {
        return response()->json($this->service->getProvinces());
    }

    public function cities(Request $request)
    {
        $request->validate(['provinsi' => 'required|string']);
        return response()->json($this->service->getCitiesByProvince($request->provinsi));
    }
}
```

- [ ] **Step 2: Buat view `admin/prayer-schedule.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Jadwal Sholat')
@section('header', 'Jadwal & Lokasi Sholat')

@section('content')
<div class="max-w-4xl space-y-6">
    {{-- Lokasi Aktif --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Lokasi Aktif</h3>
        <div class="flex items-center gap-4 mb-4">
            <div>
                <span class="text-xs text-slate-400">Provinsi:</span>
                <span class="text-sm font-bold text-white">{{ $activeLocation->province_name ?? '-' }}</span>
            </div>
            <div>
                <span class="text-xs text-slate-400">Kota:</span>
                <span class="text-sm font-bold text-white">{{ $activeLocation->city_name ?? '-' }}</span>
            </div>
        </div>
        <form method="POST" action="{{ route('admin.schedule.location') }}" class="flex items-end gap-4" x-data="scheduleForm()">
            @csrf
            <div class="flex-1">
                <label class="block text-xs font-semibold text-slate-300 mb-1">Provinsi</label>
                <select name="province_name" x-model="province" @change="loadCities()" required
                        class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                    <option value="">Pilih Provinsi</option>
                    @foreach($provinces as $prov)
                        <option value="{{ $prov }}">{{ $prov }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex-1">
                <label class="block text-xs font-semibold text-slate-300 mb-1">Kota/Kabupaten</label>
                <select name="city_name" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                    <option value="">Pilih Kota</option>
                    <template x-for="city in cities" :key="city.city_name">
                        <option :value="city.city_name" x-text="city.city_name"></option>
                    </template>
                </select>
            </div>
            <button type="submit" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition">Ubah Lokasi</button>
        </form>
    </div>

    {{-- Jadwal Hari Ini --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-emerald-400">Jadwal Hari Ini</h3>
            <form method="POST" action="{{ route('admin.schedule.sync') }}">
                @csrf
                <button type="submit" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition">Sinkronisasi</button>
            </form>
        </div>
        @if($schedule)
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            @foreach(['imsak','subuh','syuruq','dzuhur','ashar','maghrib','isya'] as $prayer)
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span class="text-xs text-slate-400 block">{{ ucfirst($prayer) }}</span>
                <span class="text-lg font-bold text-emerald-300 block">{{ substr($schedule->$prayer ?? '--', 0, 5) }}</span>
            </div>
            @endforeach
        </div>
        @else
        <p class="text-slate-500 text-sm">Belum ada jadwal. Klik Sinkronisasi untuk mengambil dari API.</p>
        @endif
    </div>

    {{-- Koreksi Waktu --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Koreksi Waktu (menit)</h3>
        <form method="POST" action="{{ route('admin.schedule.corrections') }}" class="space-y-4">
            @csrf
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                @foreach(['subuh','syuruq','dzuhur','ashar','maghrib','isya'] as $prayer)
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">{{ ucfirst($prayer) }}</label>
                    <input type="number" name="corrections[{{ $prayer }}]" min="-60" max="60"
                           value="{{ $corrections[$prayer] ?? 0 }}"
                           class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center focus:outline-none focus:border-emerald-500 transition">
                </div>
                @endforeach
            </div>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Koreksi</button>
        </form>
    </div>
</div>

@push('scripts')
<script>
function scheduleForm() {
    return {
        province: '',
        cities: [],
        async loadCities() {
            if (!this.province) { this.cities = []; return; }
            const res = await fetch('/admin/jadwal-sholat/kabkota', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ provinsi: this.province })
            });
            const data = await res.json();
            this.cities = data.data || data;
        }
    }
}
</script>
@endpush
@endsection
```

- [ ] **Step 3: Tambah routes**

```php
Route::get('/jadwal-sholat', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'index'])->name('admin.schedule.index');
Route::post('/jadwal-sholat/lokasi', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'updateLocation'])->name('admin.schedule.location');
Route::post('/jadwal-sholat/koreksi', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'updateCorrections'])->name('admin.schedule.corrections');
Route::post('/jadwal-sholat/sinkronisasi', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'sync'])->name('admin.schedule.sync');
Route::get('/jadwal-sholat/provinsi', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'provinces'])->name('admin.schedule.provinces');
Route::post('/jadwal-sholat/kabkota', [\App\Http\Controllers\Admin\AdminPrayerScheduleController::class, 'cities'])->name('admin.schedule.cities');
```

- [ ] **Step 4: Test — ubah lokasi, sync jadwal, koreksi waktu**

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Admin/AdminPrayerScheduleController.php resources/views/admin/prayer-schedule.blade.php routes/web.php
git commit -m "feat: add prayer schedule admin page with location, sync, and corrections"
```

---

## Task 7: Admin Pages — Iqamah + Syuruq + Jumat

**Files:**
- Create: `app/Http/Controllers/Admin/AdminIqamahController.php`
- Create: `app/Http/Controllers/Admin/AdminSyuruqController.php`
- Create: `app/Http/Controllers/Admin/AdminFridayController.php`
- Create: `resources/views/admin/iqamah.blade.php`
- Create: `resources/views/admin/syuruq.blade.php`
- Create: `resources/views/admin/friday.blade.php`
- Modify: `routes/web.php`

- [ ] **Step 1: Buat AdminIqamahController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\IqamahSetting;

class AdminIqamahController extends Controller
{
    private const PRAYERS = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    private const DEFAULTS = ['subuh' => 10, 'dzuhur' => 7, 'ashar' => 7, 'maghrib' => 5, 'isya' => 7];

    public function edit()
    {
        $rows = IqamahSetting::all()->keyBy('prayer_name');
        $settings = [];
        foreach (self::PRAYERS as $prayer) {
            $row = $rows->get($prayer);
            $settings[$prayer] = [
                'is_enabled' => $row ? (bool) $row->is_enabled : true,
                'duration_minutes' => $row ? (int) $row->duration_minutes : self::DEFAULTS[$prayer],
            ];
        }
        return view('admin.iqamah', ['settings' => $settings]);
    }

    public function update(Request $request)
    {
        foreach (self::PRAYERS as $prayer) {
            IqamahSetting::updateOrCreate(
                ['prayer_name' => $prayer],
                [
                    'is_enabled' => $request->boolean("{$prayer}_enabled", true),
                    'duration_minutes' => (int) $request->input("{$prayer}_minutes", self::DEFAULTS[$prayer]),
                ]
            );
        }
        return redirect()->route('admin.iqamah.edit')->with('success', 'Pengaturan iqamah berhasil disimpan.');
    }
}
```

- [ ] **Step 2: Buat view `admin/iqamah.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Iqamah')
@section('header', 'Pengaturan Iqamah')

@section('content')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.iqamah.update') }}" class="space-y-4">
        @csrf
        @foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $prayer)
        <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <span class="text-lg">{{ match($prayer) { 'subuh' => '🌙', 'dzuhur' => '☀️', 'ashar' => '🌤️', 'maghrib' => '🌅', 'isya' => '⭐' } }}</span>
                <div>
                    <span class="text-sm font-bold text-white">{{ ucfirst($prayer) }}</span>
                    <div class="flex items-center gap-2 mt-1">
                        <label class="text-xs text-slate-400">Menit:</label>
                        <input type="number" name="{{ $prayer }}_minutes" min="1" max="60"
                               value="{{ $settings[$prayer]['duration_minutes'] }}"
                               class="w-20 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white text-center">
                    </div>
                </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="{{ $prayer }}_enabled" value="1"
                       {{ $settings[$prayer]['is_enabled'] ? 'checked' : '' }} class="sr-only peer">
                <div class="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
        </div>
        @endforeach
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Iqamah</button>
    </form>
</div>
@endsection
```

- [ ] **Step 3: Buat AdminSyuruqController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SyuruqSetting;

class AdminSyuruqController extends Controller
{
    public function edit()
    {
        $setting = SyuruqSetting::first();
        return view('admin.syuruq', ['setting' => $setting]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'duration_minutes' => 'required|integer|min:1|max:60',
        ]);

        $setting = SyuruqSetting::first() ?? new SyuruqSetting();
        $setting->is_enabled = $validated['is_enabled'];
        $setting->duration_minutes = $validated['duration_minutes'];
        $setting->save();

        return redirect()->route('admin.syuruq.edit')->with('success', 'Pengaturan syuruq berhasil disimpan.');
    }
}
```

- [ ] **Step 4: Buat view `admin/syuruq.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Syuruq')
@section('header', 'Pengaturan Syuruq')

@section('content')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.syuruq.update') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-bold text-white">Tampilkan Overlay Syuruq</h3>
                    <p class="text-xs text-slate-400">Ingatkan jamaah bahwa waktu sholat terlarang saat syuruq</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="is_enabled" value="0">
                    <input type="checkbox" name="is_enabled" value="1"
                           {{ $setting && $setting->is_enabled ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Durasi Overlay (menit)</label>
                <input type="number" name="duration_minutes" min="1" max="60"
                       value="{{ $setting->duration_minutes ?? 10 }}"
                       class="w-40 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            </div>
        </div>
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>
@endsection
```

- [ ] **Step 5: Buat AdminFridayController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FridaySetting;

class AdminFridayController extends Controller
{
    public function edit()
    {
        $setting = FridaySetting::first() ?? FridaySetting::create([
            'is_enabled' => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title' => "Khutbah & Shalat Jum'at",
            'khutbah_khatib' => 'Ustadz Dr. H. Ahmad Fauzi, M.A.',
            'khutbah_imam' => 'Ustadz Muhammad Ridwan',
            'khutbah_duration_minutes' => 35,
        ]);
        return view('admin.friday', ['setting' => $setting]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'disable_iqamah_on_friday' => 'required|boolean',
            'khutbah_title' => 'required|string|max:255',
            'khutbah_khatib' => 'nullable|string|max:255',
            'khutbah_imam' => 'nullable|string|max:255',
            'khutbah_duration_minutes' => 'required|integer|min:5|max:120',
        ]);

        $setting = FridaySetting::first();
        if ($setting) {
            $setting->update($validated);
        } else {
            FridaySetting::create($validated);
        }

        return redirect()->route('admin.friday.edit')->with('success', "Pengaturan Jum'at berhasil disimpan.");
    }
}
```

- [ ] **Step 6: Buat view `admin/friday.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Jumat')
@section('header', "Pengaturan Mode Jum'at")

@section('content')
<div class="max-w-4xl">
    <form method="POST" action="{{ route('admin.friday.update') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-bold text-white">Aktifkan Mode Jum'at</h3>
                    <p class="text-xs text-slate-400">Tampilkan overlay khutbah saat Jum'at</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="is_enabled" value="0">
                    <input type="checkbox" name="is_enabled" value="1"
                           {{ $setting->is_enabled ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Nonaktifkan Iqamah Dzuhur di Jum'at</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="disable_iqamah_on_friday" value="0">
                    <input type="checkbox" name="disable_iqamah_on_friday" value="1"
                           {{ $setting->disable_iqamah_on_friday ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Judul Khutbah</label>
                <input type="text" name="khutbah_title" value="{{ $setting->khutbah_title }}" required
                       class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Khatib</label>
                    <input type="text" name="khutbah_khatib" value="{{ $setting->khutbah_khatib }}"
                           class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1.5">Imam</label>
                    <input type="text" name="khutbah_imam" value="{{ $setting->khutbah_imam }}"
                           class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Durasi Khutbah (menit)</label>
                <input type="number" name="khutbah_duration_minutes" min="5" max="120"
                       value="{{ $setting->khutbah_duration_minutes }}"
                       class="w-40 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            </div>
        </div>
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>
@endsection
```

- [ ] **Step 7: Tambah routes**

```php
Route::get('/iqamah', [\App\Http\Controllers\Admin\AdminIqamahController::class, 'edit'])->name('admin.iqamah.edit');
Route::post('/iqamah', [\App\Http\Controllers\Admin\AdminIqamahController::class, 'update'])->name('admin.iqamah.update');
Route::get('/syuruq', [\App\Http\Controllers\Admin\AdminSyuruqController::class, 'edit'])->name('admin.syuruq.edit');
Route::post('/syuruq', [\App\Http\Controllers\Admin\AdminSyuruqController::class, 'update'])->name('admin.syuruq.update');
Route::get('/friday', [\App\Http\Controllers\Admin\AdminFridayController::class, 'edit'])->name('admin.friday.edit');
Route::post('/friday', [\App\Http\Controllers\Admin\AdminFridayController::class, 'update'])->name('admin.friday.update');
```

- [ ] **Step 8: Test — ubah iqamah, syuruq, friday → save → verifikasi tersimpan**

- [ ] **Step 9: Commit**

```bash
git add app/Http/Controllers/Admin/AdminIqamahController.php app/Http/Controllers/Admin/AdminSyuruqController.php app/Http/Controllers/Admin/AdminFridayController.php resources/views/admin/iqamah.blade.php resources/views/admin/syuruq.blade.php resources/views/admin/friday.blade.php routes/web.php
git commit -m "feat: add iqamah, syuruq, and friday admin pages"
```

---

## Task 8: Admin Pages — Audio + Media

**Files:**
- Create: `app/Http/Controllers/Admin/AdminAudioController.php`
- Create: `app/Http/Controllers/Admin/AdminMediaController.php`
- Create: `resources/views/admin/audio.blade.php`
- Create: `resources/views/admin/media.blade.php`
- Modify: `routes/web.php`

**Catatan:** Audio dan Media adalah halaman paling kompleks. Audio memiliki 4 upload (adzan, murottal, dzikir pagi, dzikir petang). Media memiliki CRUD + upload + reorder.

- [ ] **Step 1: Buat AdminAudioController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\AudioSetting;

class AdminAudioController extends Controller
{
    public function edit()
    {
        $rows = AudioSetting::all()->keyBy('type');
        return view('admin.audio', ['rows' => $rows]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'volume_adzan' => 'required|integer|min:0|max:100',
            'adzan_duration_seconds' => 'required|integer|min:30|max:600',
            'murottal_enabled' => 'required|boolean',
            'murottal_before_minutes' => 'required|integer|min:1|max:60',
            'volume_murottal' => 'required|integer|min:0|max:100',
            'dzikir_pagi_enabled' => 'required|boolean',
            'dzikir_pagi_after_minutes' => 'nullable|integer|min:1|max:120',
            'dzikir_petang_enabled' => 'required|boolean',
            'dzikir_petang_after_minutes' => 'nullable|integer|min:1|max:120',
            'volume_dzikir' => 'required|integer|min:0|max:100',
        ]);

        // Adzan
        AudioSetting::updateOrCreate(['type' => 'adzan'], [
            'prayer_name' => 'all',
            'play_after_minutes' => $validated['adzan_duration_seconds'],
            'volume' => $validated['volume_adzan'],
            'is_enabled' => true,
        ]);

        // Murottal
        AudioSetting::updateOrCreate(['type' => 'murottal'], [
            'prayer_name' => 'all',
            'play_before_minutes' => $validated['murottal_before_minutes'],
            'volume' => $validated['volume_murottal'],
            'is_enabled' => $validated['murottal_enabled'],
        ]);

        // Dzikir Pagi
        AudioSetting::updateOrCreate(['type' => 'dzikir_pagi'], [
            'prayer_name' => 'subuh',
            'play_after_minutes' => $validated['dzikir_pagi_after_minutes'] ?? 10,
            'volume' => $validated['volume_dzikir'],
            'is_enabled' => $validated['dzikir_pagi_enabled'],
        ]);

        // Dzikir Petang
        AudioSetting::updateOrCreate(['type' => 'dzikir_petang'], [
            'prayer_name' => 'ashar',
            'play_after_minutes' => $validated['dzikir_petang_after_minutes'] ?? 10,
            'volume' => $validated['volume_dzikir'],
            'is_enabled' => $validated['dzikir_petang_enabled'],
        ]);

        return redirect()->route('admin.audio.edit')->with('success', 'Pengaturan audio berhasil disimpan.');
    }

    private function uploadAudio(Request $request, string $field, string $folder, string $type): \Illuminate\Http\RedirectResponse
    {
        $request->validate([$field => 'required|file|mimes:mp3,wav,ogg|max:20480']);
        $path = $request->file($field)->store($folder, 'public');
        AudioSetting::updateOrCreate(['type' => $type], ['file_path' => '/storage/' . $path]);
        return redirect()->route('admin.audio.edit')->with('success', 'File audio berhasil diunggah.');
    }

    public function uploadAdzan(Request $request) { return $this->uploadAudio($request, 'adzan_file', 'audio/adzan', 'adzan'); }
    public function uploadMurottal(Request $request) { return $this->uploadAudio($request, 'murottal_file', 'audio/murottal', 'murottal'); }
    public function uploadDzikirPagi(Request $request) { return $this->uploadAudio($request, 'dzikir_file', 'audio/dzikir', 'dzikir_pagi'); }
    public function uploadDzikirPetang(Request $request) { return $this->uploadAudio($request, 'dzikir_file', 'audio/dzikir', 'dzikir_petang'); }
}
```

- [ ] **Step 2: Buat view `admin/audio.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Audio')
@section('header', 'Pengaturan Audio')

@section('content')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.audio.update') }}" class="space-y-6">
        @csrf

        {{-- Adzan --}}
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">🔊 Audio Adzan</h3>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Volume Adzan</label>
                <input type="range" name="volume_adzan" min="0" max="100"
                       value="{{ $rows->get('adzan')->volume ?? 80 }}" class="w-full">
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Durasi Overlay Adzan (detik)</label>
                <input type="number" name="adzan_duration_seconds" min="30" max="600"
                       value="{{ $rows->get('adzan')->play_after_minutes ?? 180 }}"
                       class="w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            </div>
            @if($rows->get('adzan')?->file_path)
                <p class="text-xs text-emerald-400">File aktif: {{ basename($rows->get('adzan')->file_path) }}</p>
            @endif
            <form method="POST" action="{{ route('admin.audio.upload') }}" enctype="multipart/form-data" class="flex items-center gap-3">
                @csrf
                <input type="file" name="adzan_file" accept="audio/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                <button type="submit" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Upload</button>
            </form>
        </div>

        {{-- Murottal --}}
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">🎵 Audio Murottal</h3>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Aktifkan Murottal</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="murottal_enabled" value="0">
                    <input type="checkbox" name="murottal_enabled" value="1"
                           {{ ($rows->get('murottal')->is_enabled ?? true) ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Putar X menit sebelum adzan</label>
                    <input type="number" name="murottal_before_minutes" min="1" max="60"
                           value="{{ $rows->get('murottal')->play_before_minutes ?? 5 }}"
                           class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Volume Murottal</label>
                    <input type="range" name="volume_murottal" min="0" max="100"
                           value="{{ $rows->get('murottal')->volume ?? 80 }}" class="w-full">
                </div>
            </div>
            @if($rows->get('murottal')?->file_path)
                <p class="text-xs text-emerald-400">File aktif: {{ basename($rows->get('murottal')->file_path) }}</p>
            @endif
            <div class="flex items-center gap-3">
                <input type="file" name="murottal_file" accept="audio/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                <button type="submit" formaction="{{ route('admin.audio.upload.murottal') }}" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Upload</button>
            </div>
        </div>

        {{-- Dzikir Pagi --}}
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">🌅 Dzikir Pagi</h3>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Aktifkan Dzikir Pagi</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="dzikir_pagi_enabled" value="0">
                    <input type="checkbox" name="dzikir_pagi_enabled" value="1"
                           {{ ($rows->get('dzikir_pagi')->is_enabled ?? true) ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Putar X menit setelah subuh</label>
                    <input type="number" name="dzikir_pagi_after_minutes" min="1" max="120"
                           value="{{ $rows->get('dzikir_pagi')->play_after_minutes ?? 10 }}"
                           class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Volume Dzikir</label>
                    <input type="range" name="volume_dzikir" min="0" max="100"
                           value="{{ $rows->get('dzikir_pagi')->volume ?? 80 }}" class="w-full">
                </div>
            </div>
            @if($rows->get('dzikir_pagi')?->file_path)
                <p class="text-xs text-emerald-400">File aktif: {{ basename($rows->get('dzikir_pagi')->file_path) }}</p>
            @endif
            <div class="flex items-center gap-3">
                <input type="file" name="dzikir_pagi_file" accept="audio/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                <button type="submit" formaction="{{ route('admin.audio.upload.dzikir.pagi') }}" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Upload</button>
            </div>
        </div>

        {{-- Dzikir Petang --}}
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 class="text-sm font-bold text-emerald-400">🌙 Dzikir Petang</h3>
            <div class="flex items-center justify-between">
                <span class="text-sm text-white">Aktifkan Dzikir Petang</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="dzikir_petang_enabled" value="0">
                    <input type="checkbox" name="dzikir_petang_enabled" value="1"
                           {{ ($rows->get('dzikir_petang')->is_enabled ?? true) ? 'checked' : '' }}
                           class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Putar X menit setelah ashar</label>
                <input type="number" name="dzikir_petang_after_minutes" min="1" max="120"
                       value="{{ $rows->get('dzikir_petang')->play_after_minutes ?? 10 }}"
                       class="w-40 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            </div>
            @if($rows->get('dzikir_petang')?->file_path)
                <p class="text-xs text-emerald-400">File aktif: {{ basename($rows->get('dzikir_petang')->file_path) }}</p>
            @endif
            <div class="flex items-center gap-3">
                <input type="file" name="dzikir_petang_file" accept="audio/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
                <button type="submit" formaction="{{ route('admin.audio.upload.dzikir.petang') }}" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Upload</button>
            </div>
        </div>

        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Pengaturan Audio</button>
    </form>
</div>
@endsection
```

- [ ] **Step 3: Buat AdminMediaController**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaItem;

class AdminMediaController extends Controller
{
    public function index()
    {
        $items = MediaItem::orderBy('sort_order')->orderBy('id', 'desc')->get();
        return view('admin.media', compact('items'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string|in:image,video,youtube,livestream,text,table,donation,hadith,doa',
            'content' => 'nullable|string',
            'file_path' => 'nullable|string|max:500',
            'duration_seconds' => 'required|integer|min:3|max:300',
        ]);

        $maxSort = MediaItem::max('sort_order') ?? 0;
        $validated['sort_order'] = $maxSort + 1;
        $validated['is_active'] = true;

        MediaItem::create($validated);

        return redirect()->route('admin.media.index')->with('success', 'Media berhasil ditambahkan.');
    }

    public function update(Request $request, int $id)
    {
        $item = MediaItem::findOrFail($id);
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'content' => 'nullable|string',
            'file_path' => 'nullable|string|max:500',
            'duration_seconds' => 'sometimes|integer|min:3|max:300',
            'is_active' => 'sometimes|boolean',
        ]);
        $item->update($validated);
        return redirect()->route('admin.media.index')->with('success', 'Media berhasil diperbarui.');
    }

    public function destroy(int $id)
    {
        $item = MediaItem::findOrFail($id);
        if ($item->file_path) {
            $relativePath = ltrim(str_replace('/storage/', '', $item->file_path), '/');
            Storage::disk('public')->delete($relativePath);
        }
        $item->delete();
        return redirect()->route('admin.media.index')->with('success', 'Media berhasil dihapus.');
    }

    public function upload(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,webm|max:51200']);
        $file = $request->file('file');
        $isImage = str_contains($file->getMimeType(), 'image');
        $path = $file->store($isImage ? 'media/images' : 'media/videos', 'public');
        return response()->json(['status' => 'success', 'file_url' => '/storage/' . $path]);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate(['order' => 'required|array', 'order.*' => 'integer|exists:media_items,id']);
        foreach ($validated['order'] as $index => $id) {
            MediaItem::where('id', $id)->update(['sort_order' => $index + 1]);
        }
        return redirect()->route('admin.media.index')->with('success', 'Urutan media berhasil disimpan.');
    }
}
```

- [ ] **Step 4: Buat view `admin/media.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Slide & Media')
@section('header', 'Manajemen Slide & Media')

@section('content')
<div class="space-y-6">
    {{-- Form Tambah --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Tambah Media Baru</h3>
        <form method="POST" action="{{ route('admin.media.store') }}" class="space-y-4">
            @csrf
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Judul</label>
                    <input type="text" name="title" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Tipe</label>
                    <select name="type" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                        @foreach(['image','video','youtube','text','hadith','doa','table','donation'] as $t)
                            <option value="{{ $t }}">{{ ucfirst($t) }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">URL / File Path</label>
                    <input type="text" name="file_path" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Durasi (detik)</label>
                    <input type="number" name="duration_seconds" min="3" max="300" value="10"
                           class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Konten (teks/HTML/JSON)</label>
                <textarea name="content" rows="3" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"></textarea>
            </div>
            <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Tambah Media</button>
        </form>
    </div>

    {{-- Daftar Media --}}
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Daftar Media ({{ $items->count() }} item)</h3>
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2">
            <div class="flex items-center gap-3">
                <span class="text-[10px] px-2 py-1 rounded-full {{ $item->is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' }}">
                    {{ $item->is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
                <span class="text-xs font-bold text-white">{{ $item->title }}</span>
                <span class="text-[10px] text-slate-500">{{ $item->type }}</span>
            </div>
            <div class="flex items-center gap-2">
                <form method="POST" action="{{ route('admin.media.update', $item->id) }}">
                    @csrf @method('PUT')
                    <input type="hidden" name="is_active" value="{{ $item->is_active ? 0 : 1 }}">
                    <button type="submit" class="text-[10px] px-2 py-1 rounded-lg {{ $item->is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' }}">
                        {{ $item->is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                    </button>
                </form>
                <form method="POST" action="{{ route('admin.media.destroy', $item->id) }}" onsubmit="return confirm('Hapus media ini?')">
                    @csrf @method('DELETE')
                    <button type="submit" class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">Hapus</button>
                </form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada media.</p>
        @endforelse
    </div>
</div>
@endsection
```

- [ ] **Step 5: Tambah routes**

```php
Route::get('/audio', [\App\Http\Controllers\Admin\AdminAudioController::class, 'edit'])->name('admin.audio.edit');
Route::post('/audio', [\App\Http\Controllers\Admin\AdminAudioController::class, 'update'])->name('admin.audio.update');
Route::post('/audio/upload', [\App\Http\Controllers\Admin\AdminAudioController::class, 'uploadAdzan'])->name('admin.audio.upload');
Route::post('/audio/upload-murottal', [\App\Http\Controllers\Admin\AdminAudioController::class, 'uploadMurottal'])->name('admin.audio.upload.murottal');
Route::post('/audio/upload-dzikir-pagi', [\App\Http\Controllers\Admin\AdminAudioController::class, 'uploadDzikirPagi'])->name('admin.audio.upload.dzikir.pagi');
Route::post('/audio/upload-dzikir-petang', [\App\Http\Controllers\Admin\AdminAudioController::class, 'uploadDzikirPetang'])->name('admin.audio.upload.dzikir.petang');
Route::get('/konten', [\App\Http\Controllers\Admin\AdminMediaController::class, 'index'])->name('admin.media.index');
Route::post('/konten', [\App\Http\Controllers\Admin\AdminMediaController::class, 'store'])->name('admin.media.store');
Route::post('/konten/{id}', [\App\Http\Controllers\Admin\AdminMediaController::class, 'update'])->name('admin.media.update');
Route::delete('/konten/{id}', [\App\Http\Controllers\Admin\AdminMediaController::class, 'destroy'])->name('admin.media.destroy');
Route::post('/konten/upload', [\App\Http\Controllers\Admin\AdminMediaController::class, 'upload'])->name('admin.media.upload');
Route::post('/konten/reorder', [\App\Http\Controllers\Admin\AdminMediaController::class, 'reorder'])->name('admin.media.reorder');
```

- [ ] **Step 6: Test — upload audio, tambah media, ubah status, hapus**

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/AdminAudioController.php app/Http/Controllers/Admin/AdminMediaController.php resources/views/admin/audio.blade.php resources/views/admin/media.blade.php routes/web.php
git commit -m "feat: add audio and media admin pages with upload support"
```

---

## Task 9: Admin Pages — Running Text + Agenda + Tema + Donasi + Lainnya

**Files:**
- Create: `app/Http/Controllers/Admin/AdminRunningTextController.php`
- Create: `app/Http/Controllers/Admin/AdminAgendaController.php`
- Create: `app/Http/Controllers/Admin/AdminThemeController.php`
- Create: `app/Http/Controllers/Admin/AdminHijriController.php`
- Create: `app/Http/Controllers/Admin/AdminCountdownController.php`
- Create: `app/Http/Controllers/Admin/AdminDonationController.php`
- Create: `app/Http/Controllers/Admin/AdminAccountController.php`
- Create: 7 Blade views (running-text, agenda, theme, hijri, countdown, donation, account)
- Modify: `routes/web.php`

**Catatan:** Tugas ini memiliki 7 controller + 7 view. Masing-masing mengikuti pola yang sudah ada di Task 5-8. Berikut kode lengkapnya.

- [ ] **Step 1: Buat AdminRunningTextController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RunningText;

class AdminRunningTextController extends Controller
{
    public function index() { return view('admin.running-text', ['items' => RunningText::orderBy('id', 'desc')->get()]); }
    public function store(Request $request)
    {
        $validated = $request->validate(['text' => 'required|string|max:1000', 'speed' => 'nullable|string|in:slow,normal,fast', 'category' => 'nullable|string|in:umum,donasi,kajian,himbauan']);
        $validated['speed'] = $validated['speed'] ?? 'normal';
        $validated['category'] = $validated['category'] ?? 'umum';
        $validated['is_active'] = true;
        RunningText::create($validated);
        return redirect()->route('admin.running-text.index')->with('success', 'Running text berhasil ditambahkan.');
    }
    public function update(Request $request, int $id)
    {
        $item = RunningText::findOrFail($id);
        $item->update($request->validate(['text' => 'sometimes|string|max:1000', 'speed' => 'nullable|string', 'category' => 'nullable|string', 'is_active' => 'sometimes|boolean']));
        return redirect()->route('admin.running-text.index')->with('success', 'Running text berhasil diperbarui.');
    }
    public function destroy(int $id) { RunningText::findOrFail($id)->delete(); return redirect()->route('admin.running-text.index')->with('success', 'Running text berhasil dihapus.'); }
}
```

- [ ] **Step 2: Buat view `admin/running-text.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Running Text')
@section('header', 'Running Text')
@section('content')
<div class="max-w-4xl space-y-6">
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Tambah Running Text</h3>
        <form method="POST" action="{{ route('admin.running-text.store') }}" class="space-y-4">
            @csrf
            <textarea name="text" rows="2" required placeholder="Isi running text..." class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></textarea>
            <div class="flex gap-4">
                <select name="category" class="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                    @foreach(['umum','donasi','kajian','himbauan'] as $c)<option value="{{ $c }}">{{ ucfirst($c) }}</option>@endforeach
                </select>
                <select name="speed" class="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                    <option value="slow">Lambat</option><option value="normal" selected>Normal</option><option value="fast">Cepat</option>
                </select>
                <button type="submit" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition">Tambah</button>
            </div>
        </form>
    </div>
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2">
            <div class="flex items-center gap-3">
                <span class="text-[10px] px-2 py-1 rounded-full {{ $item->is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' }}">{{ $item->is_active ? 'Aktif' : 'Off' }}</span>
                <span class="text-xs text-white">{{ Str::limit($item->text, 60) }}</span>
                <span class="text-[10px] text-slate-500">{{ $item->category }}</span>
            </div>
            <div class="flex gap-2">
                <form method="POST" action="{{ route('admin.running-text.update', $item->id) }}">
                    @csrf @method('PUT')
                    <input type="hidden" name="is_active" value="{{ $item->is_active ? 0 : 1 }}">
                    <button class="text-[10px] px-2 py-1 rounded-lg {{ $item->is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' }}">{{ $item->is_active ? 'Matikan' : 'Aktifkan' }}</button>
                </form>
                <form method="POST" action="{{ route('admin.running-text.destroy', $item->id) }}" onsubmit="return confirm('Hapus?')">
                    @csrf @method('DELETE')
                    <button class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Hapus</button>
                </form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada running text.</p>
        @endforelse
    </div>
</div>
@endsection
```

- [ ] **Step 3: Buat AdminAgendaController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Agenda;

class AdminAgendaController extends Controller
{
    public function index() { return view('admin.agenda', ['items' => Agenda::orderBy('date', 'asc')->get()]); }
    public function store(Request $request)
    {
        $validated = $request->validate(['title' => 'required|string|max:255', 'date' => 'required|date', 'time' => 'nullable|string|max:50', 'location' => 'nullable|string|max:255', 'description' => 'nullable|string', 'is_islamic_holiday' => 'nullable|boolean']);
        $validated['time'] = $validated['time'] ?? '18:30';
        $validated['is_islamic_holiday'] = $validated['is_islamic_holiday'] ?? false;
        $validated['is_active'] = true;
        Agenda::create($validated);
        return redirect()->route('admin.agenda.index')->with('success', 'Agenda berhasil ditambahkan.');
    }
    public function update(Request $request, int $id)
    {
        $item = Agenda::findOrFail($id);
        $item->update($request->validate(['title' => 'sometimes|string', 'date' => 'sometimes|date', 'time' => 'nullable|string', 'location' => 'nullable|string', 'description' => 'nullable|string', 'is_islamic_holiday' => 'sometimes|boolean', 'is_active' => 'sometimes|boolean']));
        return redirect()->route('admin.agenda.index')->with('success', 'Agenda berhasil diperbarui.');
    }
    public function destroy(int $id) { Agenda::findOrFail($id)->delete(); return redirect()->route('admin.agenda.index')->with('success', 'Agenda berhasil dihapus.'); }
}
```

- [ ] **Step 4: Buat view `admin/agenda.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Agenda')
@section('header', 'Agenda & Hari Besar')
@section('content')
<div class="max-w-4xl space-y-6">
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <h3 class="text-sm font-bold text-emerald-400 mb-4">Tambah Agenda</h3>
        <form method="POST" action="{{ route('admin.agenda.store') }}" class="space-y-4">
            @csrf
            <div class="grid grid-cols-3 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Judul</label><input type="text" name="title" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Tanggal</label><input type="date" name="date" required class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Waktu</label><input type="time" name="time" value="18:30" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            </div>
            <textarea name="description" rows="2" placeholder="Deskripsi..." class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></textarea>
            <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" name="is_islamic_holiday" value="1"> Hari Besar Islam</label>
                <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition">Tambah</button>
            </div>
        </form>
    </div>
    <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        @forelse($items as $item)
        <div class="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 mb-2">
            <div>
                <span class="text-xs font-bold text-white">{{ $item->title }}</span>
                <span class="text-[10px] text-slate-500 ml-2">{{ $item->date }} {{ $item->time ?? '' }}</span>
                @if($item->is_islamic_holiday)<span class="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full ml-2">Hari Besar</span>@endif
            </div>
            <div class="flex gap-2">
                <form method="POST" action="{{ route('admin.agenda.update', $item->id) }}">
                    @csrf @method('PUT')
                    <input type="hidden" name="is_active" value="{{ $item->is_active ? 0 : 1 }}">
                    <button class="text-[10px] px-2 py-1 rounded-lg {{ $item->is_active ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400' }}">{{ $item->is_active ? 'Matikan' : 'Aktifkan' }}</button>
                </form>
                <form method="POST" action="{{ route('admin.agenda.destroy', $item->id) }}" onsubmit="return confirm('Hapus?')">
                    @csrf @method('DELETE')
                    <button class="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded-lg">Hapus</button>
                </form>
            </div>
        </div>
        @empty
        <p class="text-slate-500 text-sm">Belum ada agenda.</p>
        @endforelse
    </div>
</div>
@endsection
```

- [ ] **Step 5: Buat AdminThemeController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ThemeSetting;

class AdminThemeController extends Controller
{
    private const DEFAULT = ['theme_name' => 'Deep Emerald', 'primary_color' => '#10b981', 'secondary_color' => '#f59e0b', 'background_color' => '#020617', 'text_color' => '#f8fafc', 'layout_config' => ['layout_mode' => 'default'], 'is_active' => true];

    public function edit()
    {
        $theme = ThemeSetting::where('is_active', true)->first() ?? ThemeSetting::create(self::DEFAULT);
        return view('admin.theme', ['theme' => $theme]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate(['theme_name' => 'required|string|max:255', 'primary_color' => 'nullable|string', 'secondary_color' => 'nullable|string', 'background_color' => 'nullable|string', 'text_color' => 'nullable|string', 'layout_config' => 'nullable|array']);
        $theme = ThemeSetting::where('is_active', true)->first();
        if ($theme) { $theme->update($validated); } else { ThemeSetting::create(array_merge(self::DEFAULT, $validated)); }
        return redirect()->route('admin.theme.edit')->with('success', 'Tema berhasil disimpan.');
    }

    public function reset()
    {
        $theme = ThemeSetting::where('is_active', true)->first();
        if ($theme) { $theme->update(self::DEFAULT); } else { ThemeSetting::create(self::DEFAULT); }
        return redirect()->route('admin.theme.edit')->with('success', 'Tema berhasil di-reset.');
    }
}
```

- [ ] **Step 6: Buat view `admin/theme.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Tema')
@section('header', 'Tema & Desain')
@section('content')
<div class="max-w-4xl space-y-6">
    <form method="POST" action="{{ route('admin.theme.update') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div><label class="block text-xs text-slate-300 mb-1">Nama Tema</label><input type="text" name="theme_name" value="{{ $theme->theme_name }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div class="grid grid-cols-4 gap-4">
                @foreach(['primary_color' => 'Warna Primer', 'secondary_color' => 'Warna Sekunder', 'background_color' => 'Warna Latar', 'text_color' => 'Warna Teks'] as $field => $label)
                <div>
                    <label class="block text-xs text-slate-300 mb-1">{{ $label }}</label>
                    <div class="flex items-center gap-2">
                        <input type="color" name="{{ $field }}" value="{{ $theme->$field ?? '#ffffff' }}" class="w-10 h-10 rounded cursor-pointer bg-transparent">
                        <input type="text" value="{{ $theme->$field ?? '' }}" readonly class="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 font-mono">
                    </div>
                </div>
                @endforeach
            </div>
        </div>
        <div class="flex gap-3">
            <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Tema</button>
        </div>
    </form>
    <form method="POST" action="{{ route('admin.theme.reset') }}" onsubmit="return confirm('Reset tema ke default?')">
        @csrf
        <button type="submit" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition">Reset ke Default</button>
    </form>
</div>
@endsection
```

- [ ] **Step 7: Buat AdminHijriController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MosqueProfile;
use App\Services\HijriDateService;

class AdminHijriController extends Controller
{
    public function edit(HijriDateService $s) {
        $p = MosqueProfile::firstOrCreate(['id' => 1], ['name' => 'Masjid', 'timezone' => 'Asia/Jakarta']);
        return view('admin.hijri', ['correction' => (int)($p->hijri_correction ?? 0), 'dateInfo' => $s->convertToHijri(null, (int)($p->hijri_correction ?? 0), $p->timezone ?? 'Asia/Jakarta')]);
    }
    public function update(Request $request, HijriDateService $s) {
        $v = $request->validate(['hijri_correction' => 'required|integer|min:-5|max:5']);
        $p = MosqueProfile::firstOrCreate(['id' => 1], ['name' => 'Masjid', 'timezone' => 'Asia/Jakarta']);
        $p->hijri_correction = $v['hijri_correction'];
        $p->save();
        return redirect()->route('admin.hijri.edit')->with('success', 'Koreksi hijriyah berhasil disimpan.');
    }
}
```

- [ ] **Step 8: Buat view `admin/hijri.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Hijriyah')
@section('header', 'Koreksi Tanggal Hijriyah')
@section('content')
<div class="max-w-xl">
    <form method="POST" action="{{ route('admin.hijri.update') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <p class="text-xs text-slate-400">Koreksi tanggal Hijriyah jika ada selisih ±1-5 hari dari perhitungan server.</p>
        <div><label class="block text-xs text-slate-300 mb-1">Koreksi (hari, -5 s/d +5)</label>
        <input type="number" name="hijri_correction" min="-5" max="5" value="{{ $correction }}" class="w-32 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center"></div>
        @if($dateInfo)<p class="text-xs text-emerald-400">Tanggal Hijriyah saat ini: {{ $dateInfo['formatted_hijri'] ?? '-' }}</p>@endif
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>
@endsection
```

- [ ] **Step 9: Buat AdminCountdownController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CountdownSetting;

class AdminCountdownController extends Controller
{
    public function edit() { return view('admin.countdown', ['settings' => CountdownSetting::all()->keyBy('prayer_name')]); }
    public function update(Request $request) {
        foreach (['subuh','dzuhur','ashar','maghrib','isya'] as $p) {
            CountdownSetting::updateOrCreate(['prayer_name' => $p], ['minutes' => (int)$request->input("{$p}_minutes", 5)]);
        }
        return redirect()->route('admin.countdown.edit')->with('success', 'Pengaturan countdown berhasil disimpan.');
    }
}
```

- [ ] **Step 10: Buat view `admin/countdown.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Countdown')
@section('header', 'Pengaturan Countdown')
@section('content')
<div class="max-w-2xl">
    <form method="POST" action="{{ route('admin.countdown.update') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <p class="text-xs text-slate-400">Menit countdown yang ditampilkan sebelum waktu adzan.</p>
        @foreach(['subuh','dzuhur','ashar','maghrib','isya'] as $prayer)
        <div class="flex items-center gap-4">
            <span class="text-sm font-bold text-white w-20">{{ ucfirst($prayer) }}</span>
            <input type="number" name="{{ $prayer }}_minutes" min="1" max="30" value="{{ $settings[$prayer]->minutes ?? 5 }}"
                   class="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white text-center">
            <span class="text-xs text-slate-500">menit</span>
        </div>
        @endforeach
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
</div>
@endsection
```

- [ ] **Step 11: Buat AdminDonationController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\DonationSetting;

class AdminDonationController extends Controller
{
    public function edit() {
        $donation = DonationSetting::firstOrCreate(['id' => 1], ['title' => 'Infaq & Sedekah', 'qr_code_path' => '', 'is_active' => true]);
        return view('admin.donation', compact('donation'));
    }
    public function update(Request $request) {
        $v = $request->validate(['title' => 'required|string|max:255', 'description' => 'nullable|string', 'bank_name' => 'nullable|string', 'account_name' => 'nullable|string', 'account_number' => 'nullable|string', 'qr_code_path' => 'nullable|string', 'is_active' => 'required|boolean']);
        $d = DonationSetting::first();
        if ($d) { $d->update($v); } else { DonationSetting::create($v); }
        return redirect()->route('admin.donation.edit')->with('success', 'Pengaturan donasi berhasil disimpan.');
    }
    public function uploadQr(Request $request) {
        $request->validate(['qr_file' => 'required|file|mimes:jpg,jpeg,png,webp|max:10240']);
        $path = $request->file('qr_file')->store('donation', 'public');
        $d = DonationSetting::first();
        if ($d) { $d->qr_code_path = '/storage/' . $path; $d->save(); }
        return redirect()->route('admin.donation.edit')->with('success', 'QR Code berhasil diunggah.');
    }
}
```

- [ ] **Step 12: Buat view `admin/donation.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Donasi')
@section('header', 'QR Donasi')
@section('content')
<div class="max-w-2xl">
    <form method="POST" action="{{ route('admin.donation.update') }}" class="space-y-6">
        @csrf
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-white">Aktifkan Donasi</span>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="hidden" name="is_active" value="0">
                    <input type="checkbox" name="is_active" value="1" {{ $donation->is_active ? 'checked' : '' }} class="sr-only peer" onchange="this.value=this.checked?1:0; this.previousElementSibling.value=this.checked?0:0;">
                    <div class="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
            </div>
            <div><label class="block text-xs text-slate-300 mb-1">Judul</label><input type="text" name="title" value="{{ $donation->title }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            <div><label class="block text-xs text-slate-300 mb-1">Deskripsi</label><textarea name="description" rows="2" class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">{{ $donation->description }}</textarea></div>
            <div class="grid grid-cols-3 gap-4">
                <div><label class="block text-xs text-slate-300 mb-1">Bank</label><input type="text" name="bank_name" value="{{ $donation->bank_name }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Nama Rekening</label><input type="text" name="account_name" value="{{ $donation->account_name }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
                <div><label class="block text-xs text-slate-300 mb-1">Nomor Rekening</label><input type="text" name="account_number" value="{{ $donation->account_number }}" class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
            </div>
        </div>
        <button type="submit" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan</button>
    </form>
    <form method="POST" action="{{ route('admin.donation.upload.qr') }}" enctype="multipart/form-data" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl mt-4 space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Upload QR Code</h3>
        @if($donation->qr_code_path)<img src="{{ $donation->qr_code_path }}" class="w-32 h-32 object-contain rounded-xl border border-slate-700">@endif
        <div class="flex items-center gap-3">
            <input type="file" name="qr_file" accept="image/*" class="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-600 file:text-white file:font-bold file:text-xs file:cursor-pointer">
            <button type="submit" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition">Upload QR</button>
        </div>
    </form>
</div>
@endsection
```

- [ ] **Step 13: Buat AdminAccountController**

```php
<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminAccountController extends Controller
{
    public function edit() {
        $user = Auth()->user();
        return view('admin.account', compact('user'));
    }
    public function updateProfile(Request $request) {
        $v = $request->validate(['name' => 'required|string|max:255', 'email' => 'required|email']);
        Auth()->user()->update($v);
        return redirect()->route('admin.account.edit')->with('success', 'Profil berhasil diperbarui.');
    }
    public function updatePassword(Request $request) {
        $v = $request->validate(['current_password' => 'required', 'new_password' => 'required|min:6|confirmed'], ['current_password.required' => 'Password lama wajib diisi.', 'new_password.required' => 'Password baru wajib diisi.', 'new_password.min' => 'Password baru minimal 6 karakter.', 'new_password.confirmed' => 'Konfirmasi password tidak cocok.']);
        $user = Auth()->user();
        if (!Hash::check($v['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Password lama tidak benar.']);
        }
        $user->password = Hash::make($v['new_password']);
        $user->save();
        return redirect()->route('admin.account.edit')->with('success', 'Password berhasil diperbarui.');
    }
}
```

- [ ] **Step 14: Buat view `admin/account.blade.php`**

```blade
@extends('layouts.admin')
@section('title', 'Akun')
@section('header', 'Pengaturan Akun')
@section('content')
<div class="max-w-2xl space-y-6">
    <form method="POST" action="{{ route('admin.account.update') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Profil Akun</h3>
        <div><label class="block text-xs text-slate-300 mb-1">Nama</label><input type="text" name="name" value="{{ $user->name }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Email</label><input type="email" name="email" value="{{ $user->email }}" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Simpan Profil</button>
    </form>
    <form method="POST" action="{{ route('admin.account.password') }}" class="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
        @csrf
        <h3 class="text-sm font-bold text-emerald-400">Ubah Password</h3>
        @if($errors->has('current_password'))<div class="p-2 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl">{{ $errors->first('current_password') }}</div>@endif
        <div><label class="block text-xs text-slate-300 mb-1">Password Lama</label><input type="password" name="current_password" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Password Baru</label><input type="password" name="new_password" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <div><label class="block text-xs text-slate-300 mb-1">Konfirmasi Password Baru</label><input type="password" name="new_password_confirmation" required class="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"></div>
        <button type="submit" class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition">Ubah Password</button>
    </form>
</div>
@endsection
```

- [ ] **Step 15: Tambah semua routes tersisa ke `routes/web.php`**

Tambahkan di dalam group `middleware('auth')->prefix('admin')`:

```php
Route::get('/running-text', [\App\Http\Controllers\Admin\AdminRunningTextController::class, 'index'])->name('admin.running-text.index');
Route::post('/running-text', [\App\Http\Controllers\Admin\AdminRunningTextController::class, 'store'])->name('admin.running-text.store');
Route::post('/running-text/{id}', [\App\Http\Controllers\Admin\AdminRunningTextController::class, 'update'])->name('admin.running-text.update');
Route::delete('/running-text/{id}', [\App\Http\Controllers\Admin\AdminRunningTextController::class, 'destroy'])->name('admin.running-text.destroy');

Route::get('/agenda', [\App\Http\Controllers\Admin\AdminAgendaController::class, 'index'])->name('admin.agenda.index');
Route::post('/agenda', [\App\Http\Controllers\Admin\AdminAgendaController::class, 'store'])->name('admin.agenda.store');
Route::post('/agenda/{id}', [\App\Http\Controllers\Admin\AdminAgendaController::class, 'update'])->name('admin.agenda.update');
Route::delete('/agenda/{id}', [\App\Http\Controllers\Admin\AdminAgendaController::class, 'destroy'])->name('admin.agenda.destroy');

Route::get('/desain', [\App\Http\Controllers\Admin\AdminThemeController::class, 'edit'])->name('admin.theme.edit');
Route::post('/desain', [\App\Http\Controllers\Admin\AdminThemeController::class, 'update'])->name('admin.theme.update');
Route::post('/desain/reset', [\App\Http\Controllers\Admin\AdminThemeController::class, 'reset'])->name('admin.theme.reset');

Route::get('/hijri', [\App\Http\Controllers\Admin\AdminHijriController::class, 'edit'])->name('admin.hijri.edit');
Route::post('/hijri', [\App\Http\Controllers\Admin\AdminHijriController::class, 'update'])->name('admin.hijri.update');

Route::get('/countdown', [\App\Http\Controllers\Admin\AdminCountdownController::class, 'edit'])->name('admin.countdown.edit');
Route::post('/countdown', [\App\Http\Controllers\Admin\AdminCountdownController::class, 'update'])->name('admin.countdown.update');

Route::get('/donasi', [\App\Http\Controllers\Admin\AdminDonationController::class, 'edit'])->name('admin.donation.edit');
Route::post('/donasi', [\App\Http\Controllers\Admin\AdminDonationController::class, 'update'])->name('admin.donation.update');
Route::post('/donasi/upload-qr', [\App\Http\Controllers\Admin\AdminDonationController::class, 'uploadQr'])->name('admin.donation.upload.qr');

Route::get('/akun', [\App\Http\Controllers\Admin\AdminAccountController::class, 'edit'])->name('admin.account.edit');
Route::post('/akun', [\App\Http\Controllers\Admin\AdminAccountController::class, 'updateProfile'])->name('admin.account.update');
Route::post('/akun/password', [\App\Http\Controllers\Admin\AdminAccountController::class, 'updatePassword'])->name('admin.account.password');
```

- [ ] **Step 16: Test semua halaman — navigasi via sidebar, CRUD masing-masing**

- [ ] **Step 17: Commit**

```bash
git add app/Http/Controllers/Admin/ resources/views/admin/ routes/web.php
git commit -m "feat: add all remaining admin Blade pages (running text, agenda, theme, hijri, countdown, donation, account)"
```

---

## Task 10: Flutter — Pindah dari InsForge ke Laravel

**Files:**
- Modify: `mobile/lib/services/api_service.dart`

**Interfaces:**
- Consumes: Laravel `GET /api/display/state` (format JSON dari Task 3)

- [ ] **Step 1: Ubah URL di `api_service.dart`**

Ganti 2 baris di `mobile/lib/services/api_service.dart`:

```dart
// SEBELUM:
static const baseUrl = String.fromEnvironment(
  'INSFORGE_URL',
  defaultValue: 'https://2a5hq4xh.ap-southeast.insforge.app',
);
static const displayStateUrl = String.fromEnvironment(
  'DISPLAY_STATE_URL',
  defaultValue: 'https://2a5hq4xh.ap-southeast.insforge.app/functions/masjid-backend',
);

// SESUDAH:
static const baseUrl = String.fromEnvironment(
  'LARAVEL_URL',
  defaultValue: 'http://10.0.2.2:8000', // Android emulator
);
static const displayStateUrl = String.fromEnvironment(
  'DISPLAY_STATE_URL',
  defaultValue: 'http://10.0.2.2:8000/api/display/state',
);
```

Catatan:
- `http://10.0.2.2` adalah alias localhost untuk Android emulator
- Untuk production, gunakan: `https://masjid.alihdayahsiteba.web.id`
- Untuk iOS simulator, gunakan: `http://localhost:8000`

- [ ] **Step 2: Verifikasi `_applyApiState` di `main.dart`**

Format JSON Laravel sudah dirancang agar cocok dengan field names di `_applyApiState`:
- `mosqueProfile.name` ✓
- `mosqueProfile.logo_path` / `background_path` ✓
- `prayerLocation.city_name` ✓
- `todaySchedule.subuh`, dll ✓
- `iqamahSettings.subuh.is_enabled` / `duration_minutes` ✓
- `audioSettings.adzan.is_enabled`, `.volume`, `.custom_url` ✓
- `syuruqSettings.is_enabled`, `.durationMinutes` ✓
- `countdownSettings.subuh` (menit) ✓
- `donationSettings` ✓
- `fridaySettings` ✓
- `themeSettings.primary_color` ✓
- `mediaItems` ✓
- `runningTexts` (text, speed sebagai angka) ✓
- `agendas` (starts_at) ✓

Tidak perlu perubahan di `main.dart` — format sudah cocok.

- [ ] **Step 3: Build dan test Flutter**

```bash
cd mobile
flutter run
```

Verifikasi:
- Nama masjid tampil di header
- Jadwal sholat tampil dari Laravel
- Media carousel berputar
- Running text berjalan di footer
- Theme colors sesuai

- [ ] **Step 4: Commit**

```bash
cd mobile
git add lib/services/api_service.dart
git commit -m "feat: switch Flutter display from InsForge to Laravel API"
```

---

## Task 11: Pembersihan — Hapus InsForge & React

**Files:**
- Delete: `src/` (seluruh React SPA)
- Delete: `mobile/backend/` (seluruh InsForge Edge Function)
- Delete: `.insforge/` (root)
- Delete: `package.json`, `package-lock.json`, `node_modules/`
- Delete: `vite.config.ts`, `tsconfig.json`, `tsconfig.tsbuildinfo`
- Delete: `index.html` (entry point React)
- Delete: `public/dist/` (build output React)
- Modify: `AGENTS.md` (hapus InsForge section)
- Modify: `.gitignore` (hapus referensi InsForge)

**Catatan:** Lakukan di branch `migrate-to-laravel`, bukan langsung di main.

- [ ] **Step 1: Buat branch migrasi**

```bash
git checkout -b migrate-to-laravel
```

- [ ] **Step 2: Hapus React SPA**

```bash
rm -rf src/
rm -f package.json package-lock.json vite.config.ts tsconfig.json tsconfig.tsbuildinfo index.html
rm -rf public/dist/
rm -rf node_modules/
```

- [ ] **Step 3: Hapus InsForge backend**

```bash
rm -rf mobile/backend/
rm -rf .insforge/
```

- [ ] **Step 4: Bersihkan AGENTS.md**

Ganti isi `AGENTS.md`:

```markdown
# AGENTS.md

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+) — MySQL
- **Frontend Admin:** Blade + Alpine.js + Tailwind CSS (CDN)
- **Display:** Flutter (Dart) — mengakses `/api/display/state`
- **Database:** MySQL

## Routes

- `/admin/*` — Panel admin (session auth required)
- `/api/display/state` — JSON untuk Flutter display (publik)
- `/api/admin/*` — API JSON untuk admin (session auth)
```

- [ ] **Step 5: Bersihkan .gitignore**

Hapus baris yang berkaitan dengan InsForge dan Node.js jika ada. Tambahkan:

```gitignore
/node_modules/
/public/dist/
/.insforge/
/.env.local
```

- [ ] **Step 6: Bersihkan .env**

Hapus variabel yang berkaitan dengan InsForge (jika ada selain yang sudah ada). Pastikan tidak ada referensi ke InsForge URL atau keys.

- [ ] **Step 7: Pastikan `composer install` berjalan tanpa error**

```bash
composer install
php artisan migrate:fresh --seed
php artisan serve
```

- [ ] **Step 8: Test full flow**

1. Buka `/admin/login` — login berhasil
2. Navigasi semua halaman admin — tidak ada error
3. Flutter display — data muncul dari Laravel
4. Ubah data di admin → refresh Flutter → data terupdate

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove InsForge backend and React SPA, clean up config files"
```

- [ ] **Step 10: Merge ke main (setelah review)**

```bash
git checkout main
git merge migrate-to-laravel
```

---

## Self-Review

### 1. Spec Coverage

| Spec Section | Task |
|---|---|
| Display API format baru | Task 3 |
| RandomContentService | Task 2 |
| Tabel countdown_settings | Task 1 |
| Panel Admin Blade (16 controllers) | Task 4-9 |
| Layout admin | Task 4 |
| Auth session | Task 4 |
| Flutter migrasi ke Laravel | Task 10 |
| Hapus InsForge | Task 11 |
| Integrasi MyQuran API | Task 2 + Task 3 |
| Integrasi eQuran API | Task 2 |
| Pembersihan file | Task 11 |

### 2. Placeholder Scan

Tidak ditemukan placeholder "TBD" atau "TODO" di dalam step code. Semua code block berisi implementasi lengkap.

### 3. Type Consistency

- `CountdownSetting::allAsArray()` digunakan di Task 1 (model) dan Task 3 (DisplayController) — konsisten.
- `RandomContentService::getRandomHadis()` return `?array` — dipanggil di Task 3 — konsisten.
- `AudioSetting` model digunakan di Task 3 (DisplayController), Task 8 (AdminAudioController) — tipe yang sama.
- Field names `todaySchedule`, `iqamahSettings`, `audioSettings` di Task 3 JSON response — cocok dengan yang di-parse Flutter di `main.dart`.
- Running text speed dikonversi dari string enum ke angka di Task 3 — cocok dengan `runningTexts[i]['speed']` yang diharapkan Flutter.
