<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\MediaItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MediaItemTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_media_items(): void
    {
        MediaItem::create([
            'title' => 'Poster Subuh',
            'type' => 'image',
            'file_path' => '/storage/media/images/subuh.jpg',
            'duration_seconds' => 10,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/admin/media');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.0.title', 'Poster Subuh');
    }

    public function test_can_create_media_item(): void
    {
        $payload = [
            'title' => 'Kajian Rutin Sabtu',
            'type' => 'image',
            'file_path' => 'https://example.com/poster.jpg',
            'duration_seconds' => 15,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.title', 'Kajian Rutin Sabtu');

        $this->assertDatabaseHas('media_items', [
            'title' => 'Kajian Rutin Sabtu',
            'type' => 'image',
            'duration_seconds' => 15,
        ]);
    }

    public function test_youtube_url_auto_formatting(): void
    {
        $payload = [
            'title' => 'Ceramah Ustadz',
            'type' => 'youtube',
            'file_path' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'duration_seconds' => 30,
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201);
        $this->assertStringContainsString('https://www.youtube.com/embed/dQw4w9WgXcQ', $response->json('data.file_path'));
    }

    public function test_can_update_media_item(): void
    {
        $item = MediaItem::create([
            'title' => 'Original Title',
            'type' => 'image',
            'duration_seconds' => 10,
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/admin/media/{$item->id}", [
            'title' => 'Updated Title',
            'duration_seconds' => 20,
            'is_active' => false,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.title', 'Updated Title');

        $this->assertDatabaseHas('media_items', [
            'id' => $item->id,
            'title' => 'Updated Title',
            'duration_seconds' => 20,
            'is_active' => 0,
        ]);
    }

    public function test_can_delete_media_item(): void
    {
        $item = MediaItem::create([
            'title' => 'To Delete',
            'type' => 'image',
            'duration_seconds' => 10,
        ]);

        $response = $this->deleteJson("/api/admin/media/{$item->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('media_items', ['id' => $item->id]);
    }

    public function test_can_upload_media_file(): void
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('poster.jpg', 500, 'image/jpeg');

        $response = $this->postJson('/api/admin/media/upload', [
            'file' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'file_type' => 'image',
                 ]);

        $fileUrl = $response->json('file_url');
        $storagePath = str_replace('/storage/', '', $fileUrl);

        Storage::disk('public')->assertExists($storagePath);
    }

    public function test_can_create_doa_media_item(): void
    {
        $payload = [
            'title' => 'Doa Harian Otomatis',
            'type' => 'doa',
            'file_path' => 'https://equran.id/api/doa',
            'duration_seconds' => 15,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.title', 'Doa Harian Otomatis')
                 ->assertJsonPath('data.type', 'doa');

        $this->assertDatabaseHas('media_items', [
            'title' => 'Doa Harian Otomatis',
            'type' => 'doa',
        ]);
    }
}
