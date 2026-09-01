<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\SyuruqSetting;

class SyuruqSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_syuruq_settings(): void
    {
        SyuruqSetting::create([
            'is_enabled' => true,
            'duration_minutes' => 15,
        ]);

        $response = $this->getJson('/api/admin/syuruq');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'syuruq' => [
                         'is_enabled' => true,
                         'duration_minutes' => 15,
                     ],
                 ]);
    }

    public function test_can_update_syuruq_settings(): void
    {
        $response = $this->postJson('/api/admin/syuruq', [
            'is_enabled' => false,
            'duration_minutes' => 20,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Pengaturan Syuruq berhasil disimpan.',
                 ]);

        $this->assertDatabaseHas('syuruq_settings', [
            'is_enabled' => false,
            'duration_minutes' => 20,
        ]);
    }

    public function test_display_state_includes_syuruq(): void
    {
        SyuruqSetting::create([
            'is_enabled' => true,
            'duration_minutes' => 10,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('syuruq.is_enabled', true)
                 ->assertJsonPath('syuruq.duration_minutes', 10);
    }
}
