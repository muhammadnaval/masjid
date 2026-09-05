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

class DisplayController extends Controller
{
    public function state(
        HijriDateService $hijriService,
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

        // Random hadis/doa injection removed — media items only.

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
                    'duration_seconds' => (int) ($item->duration_seconds ?? 8),
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
                    'logo_path' => $profile->logo_path
                        && !str_starts_with((string) $profile->logo_path, 'http')
                        ? asset('storage/'.ltrim(str_replace('/storage/', '', $profile->logo_path), '/'))
                        : $profile->logo_path,
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
                    // Uploaded QRs are stored as bare disk paths (donasi/x.png);
                    // expose the /storage URL so Flutter's _resolveStorageUrl
                    // (which only prepends the server base) builds a working link.
                    'qr_code_path' => $donation->qr_code_path
                        && !str_starts_with((string) $donation->qr_code_path, 'http')
                        ? asset('storage/'.$donation->qr_code_path)
                        : $donation->qr_code_path,
                    'account_name' => $donation->account_name,
                    'duration_seconds' => (int) ($donation->duration_seconds ?? 10),
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
