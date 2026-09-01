<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\AudioSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MurottalAudioTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_murottal_audio_settings(): void
    {
        AudioSetting::create([
            'type' => 'murottal',
            'prayer_name' => 'all',
            'file_path' => 'https://server8.mp3quran.net/afs/018.mp3',
            'source_url' => json_encode(['subuh', 'dzuhur', 'isya']),
            'play_before_minutes' => 10,
            'volume' => 75,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/admin/audio');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'audio' => [
                         'murottal_enabled' => true,
                         'murottal_before_minutes' => 10,
                         'murottal_audio_url' => 'https://server8.mp3quran.net/afs/018.mp3',
                         'volume_murottal' => 75,
                         'enabled_prayers_for_murottal' => ['subuh', 'dzuhur', 'isya'],
                     ],
                 ]);
    }

    public function test_can_update_murottal_audio_settings(): void
    {
        $payload = [
            'adzan_audio_url' => 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3',
            'volume_adzan' => 80,
            'adzan_duration_seconds' => 150,
            'enabled_prayers_for_adzan' => ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'],
            'murottal_enabled' => true,
            'murottal_before_minutes' => 15,
            'murottal_audio_url' => 'https://example.com/murottal.mp3',
            'volume_murottal' => 85,
            'enabled_prayers_for_murottal' => ['subuh', 'maghrib', 'isya'],
            'dzikir_pagi_enabled' => true,
            'dzikir_petang_enabled' => true,
            'volume_dzikir' => 80,
        ];

        $response = $this->postJson('/api/admin/audio', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Pengaturan audio berhasil disimpan.',
                 ]);

        $this->assertDatabaseHas('audio_settings', [
            'type' => 'murottal',
            'file_path' => 'https://example.com/murottal.mp3',
            'play_before_minutes' => 15,
            'volume' => 85,
            'is_enabled' => 1,
        ]);
    }

    public function test_can_upload_murottal_audio_file(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('murottal_test.mp3', 500, 'audio/mpeg');

        $response = $this->postJson('/api/admin/audio/upload-murottal', [
            'murottal_file' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonStructure(['status', 'file_url', 'message']);

        $fileUrl = $response->json('file_url');
        $storagePath = str_replace('/storage/', '', $fileUrl);

        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_murottal_upload_file_validation(): void
    {
        Storage::fake('public');

        $invalidFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->postJson('/api/admin/audio/upload-murottal', [
            'murottal_file' => $invalidFile,
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['murottal_file']);
    }

    public function test_display_state_contains_murottal_settings(): void
    {
        AudioSetting::create([
            'type' => 'murottal',
            'prayer_name' => 'all',
            'file_path' => 'https://server8.mp3quran.net/afs/018.mp3',
            'source_url' => json_encode(['subuh', 'dzuhur']),
            'play_before_minutes' => 7,
            'volume' => 90,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('audio.murottal_before_minutes', 7)
                 ->assertJsonPath('audio.enabled_prayers_for_murottal', ['subuh', 'dzuhur']);
    }
}
