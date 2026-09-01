<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\FridaySetting;

class FridayModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_friday_settings(): void
    {
        FridaySetting::create([
            'is_enabled' => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title' => "Khutbah & Shalat Jum'at Akbar",
            'khutbah_khatib' => 'Ustadz Dr. H. Abdul Somad, Lc., M.A.',
            'khutbah_imam' => 'Ustadz Muhammad Ridwan',
            'khutbah_duration_minutes' => 40,
        ]);

        $response = $this->getJson('/api/admin/friday');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('friday.khutbah_khatib', 'Ustadz Dr. H. Abdul Somad, Lc., M.A.')
                 ->assertJsonPath('friday.khutbah_duration_minutes', 40);
    }

    public function test_can_update_friday_settings(): void
    {
        FridaySetting::create([
            'is_enabled' => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title' => 'Title Default',
            'khutbah_duration_minutes' => 35,
        ]);

        $payload = [
            'is_enabled' => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title' => "Khutbah & Shalat Jum'at Berjamaah",
            'khutbah_khatib' => 'Ustadz Adi Hidayat, Lc., M.A.',
            'khutbah_imam' => 'Ustadz Salim A. Fillah',
            'khutbah_duration_minutes' => 45,
        ];

        $response = $this->postJson('/api/admin/friday', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('friday.khutbah_khatib', 'Ustadz Adi Hidayat, Lc., M.A.');

        $this->assertDatabaseHas('friday_settings', [
            'khutbah_title' => "Khutbah & Shalat Jum'at Berjamaah",
            'khutbah_duration_minutes' => 45,
        ]);
    }

    public function test_friday_settings_included_in_display_state(): void
    {
        FridaySetting::create([
            'is_enabled' => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title' => 'Khutbah Spesial Ramadhan',
            'khutbah_duration_minutes' => 30,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('friday.khutbah_title', 'Khutbah Spesial Ramadhan')
                 ->assertJsonPath('friday.khutbah_duration_minutes', 30);
    }
}
