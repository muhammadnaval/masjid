<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\AudioSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DzikirAudioTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_dzikir_audio_settings(): void
    {
        AudioSetting::create([
            'type' => 'dzikir_pagi',
            'prayer_name' => 'subuh',
            'file_path' => 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
            'play_after_minutes' => 12,
            'volume' => 80,
            'is_enabled' => true,
        ]);

        AudioSetting::create([
            'type' => 'dzikir_petang',
            'prayer_name' => 'ashar',
            'file_path' => 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3',
            'play_after_minutes' => 15,
            'volume' => 80,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/admin/audio');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'audio' => [
                         'dzikir_pagi_enabled' => true,
                         'dzikir_pagi_after_minutes' => 12,
                         'dzikir_pagi_audio_url' => 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
                         'dzikir_petang_enabled' => true,
                         'dzikir_petang_after_minutes' => 15,
                         'dzikir_petang_audio_url' => 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3',
                         'volume_dzikir' => 80,
                     ],
                 ]);
    }

    public function test_can_update_dzikir_audio_settings(): void
    {
        $payload = [
            'adzan_audio_url' => 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3',
            'volume_adzan' => 80,
            'adzan_duration_seconds' => 150,
            'enabled_prayers_for_adzan' => ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
            'murottal_enabled' => true,
            'murottal_before_minutes' => 5,
            'murottal_audio_url' => 'https://server8.mp3quran.net/afs/018.mp3',
            'volume_murottal' => 80,
            'enabled_prayers_for_murottal' => ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
            'dzikir_pagi_enabled' => true,
            'dzikir_pagi_after_minutes' => 10,
            'dzikir_pagi_audio_url' => 'https://example.com/dzikir_pagi_custom.mp3',
            'dzikir_petang_enabled' => false,
            'dzikir_petang_after_minutes' => 20,
            'dzikir_petang_audio_url' => 'https://example.com/dzikir_petang_custom.mp3',
            'volume_dzikir' => 90,
        ];

        $response = $this->postJson('/api/admin/audio', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Pengaturan audio berhasil disimpan.',
                 ]);

        $this->assertDatabaseHas('audio_settings', [
            'type' => 'dzikir_pagi',
            'file_path' => 'https://example.com/dzikir_pagi_custom.mp3',
            'play_after_minutes' => 10,
            'volume' => 90,
            'is_enabled' => 1,
        ]);

        $this->assertDatabaseHas('audio_settings', [
            'type' => 'dzikir_petang',
            'file_path' => 'https://example.com/dzikir_petang_custom.mp3',
            'play_after_minutes' => 20,
            'volume' => 90,
            'is_enabled' => 0,
        ]);
    }

    public function test_can_upload_dzikir_pagi_audio_file(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('dzikir_pagi.mp3', 500, 'audio/mpeg');

        $response = $this->postJson('/api/admin/audio/upload-dzikir-pagi', [
            'dzikir_file' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ]);

        $fileUrl = $response->json('file_url');
        $storagePath = str_replace('/storage/', '', $fileUrl);

        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_can_upload_dzikir_petang_audio_file(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('dzikir_petang.mp3', 500, 'audio/mpeg');

        $response = $this->postJson('/api/admin/audio/upload-dzikir-petang', [
            'dzikir_file' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ]);

        $fileUrl = $response->json('file_url');
        $storagePath = str_replace('/storage/', '', $fileUrl);

        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_display_state_contains_dzikir_settings(): void
    {
        AudioSetting::create([
            'type' => 'dzikir_pagi',
            'prayer_name' => 'subuh',
            'file_path' => 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
            'play_after_minutes' => 15,
            'volume' => 85,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('audio.dzikir_pagi_after_minutes', 15);
    }
}
