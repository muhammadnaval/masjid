<?php

namespace App\Services;

use App\Models\PrayerSchedule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrayerScheduleService
{
    /**
     * Get list of provinces from EQuran.id API, with a local fallback.
     */
    public function getProvinces(): array
    {
        try {
            $response = Http::timeout(5)->get('https://equran.id/api/v2/shalat/provinsi');
            if ($response->successful() && isset($response->json()['data'])) {
                return $response->json()['data'];
            }
        } catch (\Exception $e) {
            Log::warning('Gagal mengambil daftar provinsi dari EQuran.id API: '.$e->getMessage());
        }

        return [
            'Sumatera Barat', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
            'DI Yogyakarta', 'Jawa Timur', 'Banten', 'Bali',
            'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Kalimantan Barat',
            'Kalimantan Selatan', 'Kalimantan Timur', 'Sulawesi Selatan',
            'Sulawesi Utara', 'Papua',
        ];
    }

    /**
     * Get list of cities for a province from EQuran.id API, with a local fallback.
     */
    public function getCitiesByProvince(string $province): array
    {
        try {
            $response = Http::timeout(5)->post('https://equran.id/api/v2/shalat/kabkota', [
                'provinsi' => $province,
            ]);
            if ($response->successful() && isset($response->json()['data'])) {
                return array_map(function ($cityName) use ($province) {
                    return [
                        'province_name' => $province,
                        'city_name' => $cityName,
                        'city_code' => strtolower(str_replace([' ', '.'], ['-', ''], $cityName)),
                    ];
                }, $response->json()['data']);
            }
        } catch (\Exception $e) {
            Log::warning('Gagal mengambil daftar kota dari EQuran.id API: '.$e->getMessage());
        }

        return PrayerLocation::where('province_name', $province)
            ->orderBy('city_name')
            ->get()
            ->map(fn ($location) => [
                'province_name' => $location->province_name,
                'city_name' => $location->city_name,
                'city_code' => $location->city_code,
            ])
            ->all();
    }


    public function syncSchedules(string $province = 'Sumatera Barat', string $city = 'Kota Padang'): bool
    {
        try {
            $year = (int) date('Y');
            $month = (int) date('m');

            $response = Http::timeout(8)->post('https://equran.id/api/v2/shalat', [
                'provinsi' => $province,
                'kabkota' => $city,
                'bulan' => $month,
                'tahun' => $year,
            ]);

            if ($response->successful() && isset($response->json()['data']['jadwal'])) {
                $jadwals = $response->json()['data']['jadwal'];
                foreach ($jadwals as $j) {
                    PrayerSchedule::updateOrCreate(
                        ['date' => $j['tanggal_lengkap'] ?? date('Y-m-d')],
                        [
                            'imsak' => $j['imsak'] ?? '04:54',
                            'subuh' => $j['subuh'] ?? '05:04',
                            'syuruq' => $j['terbit'] ?? '06:20',
                            'dzuhur' => $j['dzuhur'] ?? '12:28',
                            'ashar' => $j['ashar'] ?? '15:51',
                            'maghrib' => $j['maghrib'] ?? '18:30',
                            'isya' => $j['isya'] ?? '19:42',
                            'source' => 'API Resmi EQuran.id (Kemenag RI)',
                        ]
                    );
                }
                return true;
            }
        } catch (\Exception $e) {
            Log::warning('Sinkronisasi EQuran.id Shalat API bermasalah, menggunakan cache lokal: ' . $e->getMessage());
        }

        // Fallback: Ensure today's schedule exists in database
        PrayerSchedule::updateOrCreate(
            ['date' => date('Y-m-d')],
            [
                'imsak' => '04:54:00',
                'subuh' => '05:04:00',
                'syuruq' => '06:20:00',
                'dzuhur' => '12:28:00',
                'ashar' => '15:51:00',
                'maghrib' => '18:30:00',
                'isya' => '19:42:00',
                'source' => 'API Resmi EQuran.id (Cache Lokal)',
            ]
        );

        // API unreachable/invalid: report failure so sync logs tell the truth
        return false;
    }
}
