<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\PrayerLocation;
use App\Models\PrayerSchedule;
use App\Models\PrayerTimeCorrection;
use App\Services\PrayerScheduleService;

class PrayerScheduleController extends Controller
{
    protected PrayerScheduleService $service;

    public function __construct(PrayerScheduleService $service)
    {
        $this->service = $service;
    }

    public function index(): JsonResponse
    {
        $locations = PrayerLocation::all();
        $activeLocation = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $schedule = PrayerSchedule::where('date', date('Y-m-d'))->first() ?? PrayerSchedule::first();
        $corrections = PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name');
        $provinces = $this->service->getProvinces();

        return response()->json([
            'provinces' => $provinces,
            'locations' => $locations,
            'active_location' => $activeLocation,
            'schedule' => $schedule,
            'corrections' => $corrections,
        ]);
    }

    public function provinces(): JsonResponse
    {
        return response()->json([
            'code' => 200,
            'data' => $this->service->getProvinces(),
        ]);
    }

    public function kabkota(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provinsi' => 'required|string',
        ]);

        return response()->json([
            'code' => 200,
            'data' => $this->service->getCitiesByProvince($validated['provinsi']),
        ]);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'province_name' => 'required|string',
            'city_name' => 'required|string',
            'city_code' => 'nullable|string',
        ]);

        PrayerLocation::query()->update(['is_active' => false]);

        $cityCode = $validated['city_code'] ?? strtolower(str_replace([' ', '.'], ['-', ''], $validated['city_name']));

        $location = PrayerLocation::updateOrCreate(
            ['city_name' => $validated['city_name']],
            [
                'province_name' => $validated['province_name'],
                'city_code' => $cityCode,
                'is_active' => true,
            ]
        );

        // Auto sync schedule for newly activated city via EQuran.id API
        $this->service->syncSchedules($validated['province_name'], $validated['city_name']);

        return response()->json([
            'message' => 'Lokasi kota/kabupaten berhasil diubah.',
            'active_location' => $location,
            'schedule' => PrayerSchedule::where('date', date('Y-m-d'))->first(),
        ]);
    }

    public function updateCorrections(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'corrections' => 'required|array',
            'corrections.*' => 'integer',
        ]);

        foreach ($validated['corrections'] as $prayerName => $minutes) {
            PrayerTimeCorrection::updateOrCreate(
                ['prayer_name' => $prayerName],
                ['correction_minutes' => $minutes]
            );
        }

        return response()->json([
            'message' => 'Koreksi menit waktu sholat berhasil disimpan.',
            'corrections' => PrayerTimeCorrection::all()->pluck('correction_minutes', 'prayer_name'),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $activeLocation = PrayerLocation::where('is_active', true)->first() ?? PrayerLocation::first();
        $city = $activeLocation->city_name ?? 'Kota Padang';
        $success = $this->service->syncSchedules(
            $activeLocation->province_name ?? 'Sumatera Barat',
            $city
        );

        \App\Models\SyncLog::create([
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

        return response()->json([
            'status' => $success ? 'success' : 'error',
            'message' => 'Sinkronisasi jadwal sholat EQuran.id API (Kemenag RI) berhasil diperbarui.',
            'last_sync' => now()->toIso8601String(),
            'schedule' => PrayerSchedule::where('date', date('Y-m-d'))->first(),
        ]);
    }
}
