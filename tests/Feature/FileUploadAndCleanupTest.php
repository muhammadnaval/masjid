<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use App\Models\MediaItem;
use App\Models\DonationSetting;

class FileUploadAndCleanupTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_can_upload_valid_image_file(): void
    {
        $file = UploadedFile::fake()->image('poster-kajian.png', 800, 600);

        $response = $this->postJson('/api/admin/files/upload', [
            'file' => $file,
            'type' => 'image',
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'status'    => 'success',
                     'file_type' => 'image',
                 ]);

        $filePath = $response->json('file_path');
        Storage::disk('public')->assertExists($filePath);
    }

    public function test_can_upload_valid_video_file(): void
    {
        $file = UploadedFile::fake()->create('video-profil.mp4', 5000, 'video/mp4');

        $response = $this->postJson('/api/admin/files/upload', [
            'file' => $file,
            'type' => 'video',
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'status'    => 'success',
                     'file_type' => 'video',
                 ]);

        $filePath = $response->json('file_path');
        Storage::disk('public')->assertExists($filePath);
    }

    public function test_can_upload_valid_audio_file(): void
    {
        $file = UploadedFile::fake()->create('adzan-makkah.mp3', 3000, 'audio/mpeg');

        $response = $this->postJson('/api/admin/files/upload', [
            'file' => $file,
            'type' => 'audio',
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'status'    => 'success',
                     'file_type' => 'audio',
                 ]);

        $filePath = $response->json('file_path');
        Storage::disk('public')->assertExists($filePath);
    }

    public function test_rejects_dangerous_executable_file(): void
    {
        $file = UploadedFile::fake()->create('malware.php', 100, 'application/x-php');

        $response = $this->postJson('/api/admin/files/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'status' => 'error',
                 ]);
    }

    public function test_rejects_oversized_image_file(): void
    {
        // 12MB image (max allowed is 10MB)
        $file = UploadedFile::fake()->create('huge-image.jpg', 12288, 'image/jpeg');

        $response = $this->postJson('/api/admin/files/upload', [
            'file' => $file,
            'type' => 'image',
        ]);

        $response->assertStatus(422);
    }

    public function test_file_cleanup_on_media_item_delete(): void
    {
        $file = UploadedFile::fake()->image('slide-delete.png');
        $storedPath = $file->store('uploads/images', 'public');

        $media = MediaItem::create([
            'title' => 'Slide To Delete',
            'type' => 'image',
            'file_path' => '/storage/' . $storedPath,
            'duration_seconds' => 10,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        Storage::disk('public')->assertExists($storedPath);

        $response = $this->deleteJson("/api/admin/media/{$media->id}");
        $response->assertStatus(200);

        Storage::disk('public')->assertMissing($storedPath);
    }

    public function test_artisan_storage_clean_orphans_command(): void
    {
        // Create 1 active file
        $activeFile = UploadedFile::fake()->image('active-banner.png');
        $activePath = $activeFile->store('uploads/images', 'public');

        MediaItem::create([
            'title' => 'Active Banner',
            'type' => 'image',
            'file_path' => '/storage/' . $activePath,
            'duration_seconds' => 10,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        // Create 1 orphan file not in database
        $orphanFile = UploadedFile::fake()->image('orphan-old-file.png');
        $orphanPath = $orphanFile->store('uploads/images', 'public');

        Storage::disk('public')->assertExists($activePath);
        Storage::disk('public')->assertExists($orphanPath);

        $this->artisan('storage:clean-orphans')
             ->assertExitCode(0);

        // Active file must remain, orphan file must be deleted
        Storage::disk('public')->assertExists($activePath);
        Storage::disk('public')->assertMissing($orphanPath);
    }
}
