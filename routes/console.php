<?php

use Illuminate\Support\Facades\Schedule;

// Sinkronisasi jadwal shalat otomatis dari API EQuran.id (Kemenag RI) tiap 2 jam.
// Membutuhkan cron server: `php artisan schedule:run` setiap menit (lihat DEPLOY.md).
Schedule::call(function () {
    $location = App\Models\PrayerLocation::where('is_active', true)->first()
        ?? App\Models\PrayerLocation::first();
    $city = $location?->city_name ?? 'Kota Padang';

    $success = app(App\Services\PrayerScheduleService::class)->syncSchedules(
        $location?->province_name ?? 'Sumatera Barat',
        $city
    );

    App\Models\SyncLog::create([
        'type'    => 'schedule_sync',
        'status'  => $success ? 'success' : 'failed',
        'message' => ($success ? 'Sinkronisasi terjadwal (2 jam) berhasil untuk ' : 'Sinkronisasi terjadwal (2 jam) gagal untuk ').$city.'.',
        'details' => [
            'city'    => $city,
            'trigger' => 'scheduler',
            'time'    => now()->toIso8601String(),
        ],
    ]);
})->everyTwoHours()->name('sinkron-jadwal-shalat')->withoutOverlapping();
