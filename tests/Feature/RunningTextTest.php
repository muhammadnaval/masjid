<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\RunningText;

class RunningTextTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_running_texts(): void
    {
        RunningText::create([
            'text' => 'Selamat Datang di Masjid Al-Hidayah',
            'speed' => 'normal',
            'category' => 'umum',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/admin/running-text');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.0.text', 'Selamat Datang di Masjid Al-Hidayah');
    }

    public function test_can_create_running_text(): void
    {
        $payload = [
            'text' => 'Himbauan menonaktifkan HP selama sholat berjamaah',
            'speed' => 'fast',
            'category' => 'himbauan',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/running-text', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.category', 'himbauan');

        $this->assertDatabaseHas('running_texts', [
            'text' => 'Himbauan menonaktifkan HP selama sholat berjamaah',
            'category' => 'himbauan',
        ]);
    }

    public function test_can_update_running_text(): void
    {
        $item = RunningText::create([
            'text' => 'Teks Lama',
            'speed' => 'slow',
            'category' => 'umum',
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/admin/running-text/{$item->id}", [
            'text' => 'Teks Baru Diperbarui',
            'speed' => 'normal',
            'category' => 'kajian',
            'is_active' => false,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.text', 'Teks Baru Diperbarui');

        $this->assertDatabaseHas('running_texts', [
            'id' => $item->id,
            'text' => 'Teks Baru Diperbarui',
            'is_active' => 0,
        ]);
    }

    public function test_can_delete_running_text(): void
    {
        $item = RunningText::create([
            'text' => 'To Delete',
            'speed' => 'normal',
            'category' => 'umum',
        ]);

        $response = $this->deleteJson("/api/admin/running-text/{$item->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('running_texts', ['id' => $item->id]);
    }

    public function test_scheduled_running_text_filtering_in_display_state(): void
    {
        // Active text in schedule window
        RunningText::create([
            'text' => 'Teks Aktif Sekarang',
            'speed' => 'normal',
            'category' => 'umum',
            'is_active' => true,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDay(),
        ]);

        // Future text not yet active
        RunningText::create([
            'text' => 'Teks Masa Depan',
            'speed' => 'normal',
            'category' => 'umum',
            'is_active' => true,
            'starts_at' => now()->addDays(2),
            'ends_at' => now()->addDays(5),
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200);
        $runningTextList = $response->json('running_text');

        $texts = collect($runningTextList)->pluck('text')->all();
        $this->assertContains('Teks Aktif Sekarang', $texts);
        $this->assertNotContains('Teks Masa Depan', $texts);
    }
}
