<?php

namespace App\Http\Controllers;

use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\SyncLog;
use App\Services\PrayerScheduleService;

class PrayerScheduleController extends Controller
{
    protected PrayerScheduleService $service;

    public function __construct(PrayerScheduleService $service)
    {
        $this->service = $service;
    }

    /**
     * POST /admin/jadwal-sholat/sinkron
     * Web-only sync action used by Blade admin panel.
     */
    public function syncWeb()
    {
        $activeLocation = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $city = $activeLocation->city_name ?? 'Kota Padang';
        $success = $this->service->syncSchedules(
            $activeLocation->province_name ?? 'Sumatera Barat',
            $city
        );

        SyncLog::create([
            'type'    => 'schedule_sync',
            'status'  => $success ? 'success' : 'failed',
            'message' => $success
                ? "Sinkronisasi jadwal sholat Kemenag RI untuk {$city} berhasil."
                : "Gagal menghubungkan ke server API jadwal Kemenag RI untuk {$city}.",
            'details' => [
                'city' => $city,
                'time' => now()->toIso8601String(),
            ],
        ]);

        return redirect()->route('admin.page.edit', 'schedule')->with(
            'success',
            $success
                ? "Jadwal sholat untuk {$city} berhasil disinkronisasi."
                : "Gagal menyinkronkan jadwal sholat. Silakan coba lagi."
        );
    }
}
