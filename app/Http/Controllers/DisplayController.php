<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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

class DisplayController extends Controller
{
    /**
     * Get JSON state for /display/state endpoint.
     */
    public function state(\App\Services\HijriDateService $hijriService): JsonResponse
    {
        $profile = MosqueProfile::first();
        $location = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        
        $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first();
        if (!$schedule) {
            $prayerService = app(\App\Services\PrayerScheduleService::class);
            $prayerService->syncSchedules(
                $location?->province_name ?? 'Sumatera Barat',
                $location?->city_name ?? 'Kota Padang'
            );
            $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first() ?? PrayerSchedule::first();
        }

        if (!$schedule) {
            $schedule = (object) [
                'date' => date('Y-m-d'),
                'imsak' => '04:45:00',
                'subuh' => '04:55:00',
                'syuruq' => '06:12:00',
                'dzuhur' => '12:20:00',
                'ashar' => '15:42:00',
                'maghrib' => '18:25:00',
                'isya' => '19:36:00',
                'source' => 'Jadwal Resmi Kementerian Agama RI',
            ];
        }
        $correctionsDb = PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name');
        $corrections = array_merge([
            'imsak' => 0, 'subuh' => 0, 'syuruq' => 0, 'dzuhur' => 0, 'ashar' => 0, 'maghrib' => 0, 'isya' => 0
        ], $correctionsDb->toArray());

        $hijriCorrection = (int) ($profile?->hijri_correction ?? 0);
        $hijriInfo = $hijriService->convertToHijri(null, $hijriCorrection, $profile?->timezone ?? 'Asia/Jakarta');
        $iqamahDefaults = ['subuh' => 10, 'dzuhur' => 7, 'ashar' => 7, 'maghrib' => 5, 'isya' => 7];
        $iqamahRows     = IqamahSetting::all()->keyBy('prayer_name');
        $iqamah = [];
        foreach ($iqamahDefaults as $prayer => $defaultMin) {
            $row = $iqamahRows->get($prayer);
            $iqamah[$prayer] = [
                'prayer_name'      => $prayer,
                'is_enabled'       => $row ? (bool) $row->is_enabled : true,
                'duration_minutes' => $row ? (int) $row->duration_minutes : $defaultMin,
            ];
        }
        $media = MediaItem::where('is_active', true)->orderBy('sort_order')->get();
        $now = now();
        $runningText = RunningText::where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
            })
            ->get();
        $audioRows    = AudioSetting::all()->keyBy('type');
        $adzanRow     = $audioRows->get('adzan');
        $murottalRow  = $audioRows->get('murottal');
        $dzikirPagi   = $audioRows->get('dzikir_pagi');
        $dzikirPetang = $audioRows->get('dzikir_petang');

        $enabledPrayersAdzan = $adzanRow
            ? json_decode($adzanRow->source_url ?? '["subuh","dzuhur","ashar","maghrib","isya"]', true)
            : ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        $enabledPrayersMurottal = $murottalRow
            ? json_decode($murottalRow->source_url ?? '["subuh","dzuhur","ashar","maghrib","isya"]', true)
            : ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        $audio = [
            'adzan_audio_url'            => $adzanRow?->file_path ?? null,
            'volume_adzan'               => $adzanRow?->volume ?? 80,
            'adzan_duration_seconds'     => $adzanRow?->play_after_minutes ?? 150,
            'enabled_prayers_for_adzan'   => $enabledPrayersAdzan,
            'murottal_enabled'          => (bool) ($murottalRow?->is_enabled ?? true),
            'murottal_before_minutes'   => $murottalRow?->play_before_minutes ?? 5,
            'murottal_audio_url'        => $murottalRow?->file_path ?? null,
            'volume_murottal'           => $murottalRow?->volume ?? 80,
            'enabled_prayers_for_murottal' => $enabledPrayersMurottal,
            'dzikir_pagi_enabled'        => (bool) ($dzikirPagi?->is_enabled ?? true),
            'dzikir_pagi_after_minutes'   => $dzikirPagi?->play_after_minutes ?? 10,
            'dzikir_pagi_audio_url'       => $dzikirPagi?->file_path ?? null,
            'dzikir_petang_enabled'      => (bool) ($dzikirPetang?->is_enabled ?? true),
            'dzikir_petang_after_minutes' => $dzikirPetang?->play_after_minutes ?? 10,
            'dzikir_petang_audio_url'     => $dzikirPetang?->file_path ?? null,
            'volume_dzikir'              => $dzikirPagi?->volume ?? 80,
        ];
        $donation = DonationSetting::where('is_active', true)->first();
        $theme = ThemeSetting::where('is_active', true)->first() ?? ThemeSetting::first();
        $todayStr = date('Y-m-d');
        $agendas = Agenda::where('is_active', true)->where('date', '>=', $todayStr)->orderBy('date')->take(5)->get();

        $upcomingHoliday = Agenda::where('is_active', true)
            ->where('is_islamic_holiday', true)
            ->where('date', '>=', $todayStr)
            ->orderBy('date', 'asc')
            ->first();

        $holidayData = null;
        if ($upcomingHoliday) {
            $diffDays = (int) (new \DateTime($todayStr))->diff(new \DateTime($upcomingHoliday->date))->format('%r%a');
            if ($diffDays >= 0 && $diffDays <= 30) {
                $holidayData = [
                    'id'          => $upcomingHoliday->id,
                    'title'       => $upcomingHoliday->title,
                    'date'        => $upcomingHoliday->date,
                    'description' => $upcomingHoliday->description,
                    'days_left'   => $diffDays,
                ];
            }
        }

        $syuruqRow = \App\Models\SyuruqSetting::first();
        $syuruq = [
            'is_enabled'       => $syuruqRow ? (bool) $syuruqRow->is_enabled : true,
            'duration_minutes' => $syuruqRow ? (int) $syuruqRow->duration_minutes : 10,
        ];

        $friday = \App\Models\FridaySetting::first();

        return response()->json([
            'status' => 'success',
            'timestamp' => now()->toIso8601String(),
            'profile' => $profile,
            'location' => $location,
            'schedule' => $schedule,
            'corrections' => $corrections,
            'iqamah' => $iqamah,
            'syuruq' => $syuruq,
            'hijri' => $hijriInfo,
            'media' => $media,
            'running_text' => $runningText,
            'audio' => $audio,
            'donation' => $donation,
            'theme' => $theme,
            'agendas' => $agendas,
            'upcoming_islamic_holiday' => $holidayData,
            'friday' => $friday,
        ]);
    }
}
