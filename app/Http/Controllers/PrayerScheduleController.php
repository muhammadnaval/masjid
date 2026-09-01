<?php

namespace App\Http\Controllers;

use App\Models\PrayerLocation;
use App\Models\SyncLog;
use App\Services\PrayerScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PrayerScheduleController extends Controller
{
    protected PrayerScheduleService $service;

    public function __construct(PrayerScheduleService $service)
    {
        $this->service = $service;
    }

    /**
     * Return cities for the province selected by the Blade location form.
     */
    public function getCities(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'province' => ['required', 'string', 'max:100'],
        ]);

        return response()->json([
            'data' => $this->service->getCitiesByProvince($validated['province']),
        ]);
    }

    /**
     * Save the active location from the Blade admin panel and sync its schedule.
     */
    public function updateLocationWeb(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'province_name' => ['required', 'string', 'max:100'],
            'city_name' => ['required', 'string', 'max:150'],
            'city_code' => ['nullable', 'string', 'max:100'],
        ]);

        PrayerLocation::query()->update(['is_active' => false]);

        $cityCode = $validated['city_code'] ?: strtolower(str_replace(
            [' ', '.'],
            ['-', ''],
            $validated['city_name']
        ));

        $location = PrayerLocation::updateOrCreate(
            ['city_name' => $validated['city_name']],
            [
                'province_name' => $validated['province_name'],
                'city_code' => $cityCode,
                'is_active' => true,
            ]
        );

        $success = $this->service->syncSchedules(
            $location->province_name,
            $location->city_name
        );

        SyncLog::create([
            'type' => 'schedule_sync',
            'status' => $success ? 'success' : 'failed',
            'message' => $success
                ? "Sinkronisasi jadwal sholat Kemenag RI untuk {$location->city_name} berhasil."
                : "Gagal menghubungkan ke server jadwal Kemenag RI untuk {$location->city_name}.",
            'details' => [
                'city' => $location->city_name,
                'province' => $location->province_name,
                'time' => now()->toIso8601String(),
            ],
        ]);

        return redirect()->route('admin.page.edit', 'schedule')->with(
            $success ? 'success' : 'error',
            $success
                ? "Lokasi diubah ke {$location->city_name} dan jadwal berhasil disinkronisasi."
                : "Lokasi diubah ke {$location->city_name}, tetapi sinkronisasi jadwal gagal."
        );
    }

    /**
     * POST /admin/jadwal-sholat/sinkron
     * Web-only sync action used by Blade admin panel.
     */
    public function syncWeb(): RedirectResponse
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
