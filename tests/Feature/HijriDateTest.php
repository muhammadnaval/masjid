<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\MosqueProfile;
use App\Services\HijriDateService;

class HijriDateTest extends TestCase
{
    use RefreshDatabase;

    public function test_hijri_date_service_conversion(): void
    {
        $service = new HijriDateService();
        $res = $service->convertToHijri('2026-07-31', 0, 'Asia/Jakarta');

        $this->assertArrayHasKey('formatted_hijri', $res);
        $this->assertArrayHasKey('formatted_masehi', $res);
        $this->assertEquals('Jum\'at, 31 Juli 2026', $res['formatted_masehi']);
        $this->assertStringContainsString('H', $res['formatted_hijri']);
    }

    public function test_hijri_date_service_correction_offset(): void
    {
        $service = new HijriDateService();
        $resNormal = $service->convertToHijri('2026-07-31', 0);
        $resPlusOne = $service->convertToHijri('2026-07-31', 1);

        $this->assertNotEquals($resNormal['formatted_hijri'], $resPlusOne['formatted_hijri']);
    }

    public function test_can_fetch_hijri_settings(): void
    {
        MosqueProfile::create([
            'name' => 'MASJID TEST',
            'address' => 'Jl. Test No. 1',
            'timezone' => 'Asia/Jakarta',
            'hijri_correction' => 1,
        ]);

        $response = $this->getJson('/api/admin/hijri');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'hijri_correction' => 1,
                 ])
                 ->assertJsonPath('date_info.correction_days', 1);
    }

    public function test_can_update_hijri_correction(): void
    {
        $response = $this->postJson('/api/admin/hijri', [
            'hijri_correction' => 2,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'hijri_correction' => 2,
                 ]);

        $this->assertDatabaseHas('mosque_profiles', [
            'hijri_correction' => 2,
        ]);
    }

    public function test_display_state_payload_includes_hijri(): void
    {
        MosqueProfile::create([
            'name' => 'MASJID TEST',
            'address' => 'Jl. Test No. 1',
            'timezone' => 'Asia/Jakarta',
            'hijri_correction' => -1,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('hijri.correction_days', -1);
    }
}
