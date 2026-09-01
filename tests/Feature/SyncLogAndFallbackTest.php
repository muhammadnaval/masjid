<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\SyncLog;
use App\Models\PrayerLocation;

class SyncLogAndFallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_record_and_fetch_sync_logs(): void
    {
        $logData = [
            'type' => 'schedule_sync',
            'status' => 'success',
            'message' => 'Sinkronisasi jadwal sholat berhasil.',
            'details' => ['city' => 'Kota Padang'],
        ];

        $storeResponse = $this->postJson('/api/admin/logs', $logData);

        $storeResponse->assertStatus(201)
                      ->assertJson([
                          'status' => 'success',
                      ])
                      ->assertJsonPath('data.message', 'Sinkronisasi jadwal sholat berhasil.');

        $getResponse = $this->getJson('/api/admin/logs');

        $getResponse->assertStatus(200)
                    ->assertJsonPath('data.0.status', 'success');
    }

    public function test_can_fetch_latest_sync_log(): void
    {
        SyncLog::create([
            'type' => 'schedule_sync',
            'status' => 'failed',
            'message' => 'Koneksi API Kemenag RI terputus.',
        ]);

        $response = $this->getJson('/api/admin/logs/latest');

        $response->assertStatus(200)
                 ->assertJsonPath('latest.status', 'failed')
                 ->assertJsonPath('latest.message', 'Koneksi API Kemenag RI terputus.');
    }

    public function test_prayer_schedule_sync_creates_sync_log(): void
    {
        PrayerLocation::create([
            'province_name' => 'Sumatera Barat',
            'city_name' => 'Kota Padang',
            'city_code' => '0301',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/admin/jadwal-sholat/sinkronisasi');

        $response->assertStatus(200);

        $this->assertDatabaseHas('sync_logs', [
            'type' => 'schedule_sync',
        ]);
    }
}
