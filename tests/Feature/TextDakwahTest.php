<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\MediaItem;

class TextDakwahTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_text_dakwah_media_item(): void
    {
        $textContent = json_encode([
            'subtitle' => 'Surah Al-Kahfi: 10',
            'arabic' => 'رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً',
            'latin' => 'Rabbanā ātinā min ladunka raḥmah...',
            'translation' => 'Wahai Tuhan kami, berikanlah rahmat kepada kami dari sisi-Mu...',
        ]);

        $payload = [
            'title' => 'Mutiara Ayat Surah Al-Kahfi',
            'type' => 'text',
            'content' => $textContent,
            'duration_seconds' => 15,
            'is_active' => true,
        ];

        $response = $this->postJson('/api/admin/media', $payload);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('data.title', 'Mutiara Ayat Surah Al-Kahfi');

        $this->assertDatabaseHas('media_items', [
            'title' => 'Mutiara Ayat Surah Al-Kahfi',
            'type' => 'text',
        ]);
    }

    public function test_arabic_text_preservation(): void
    {
        $arabicStr = 'إِنَّ مَعَ الْعُسْرِ يُسْرًا';
        $item = MediaItem::create([
            'title' => 'Hadits Keutamaan Sabar',
            'type' => 'text',
            'content' => json_encode(['arabic' => $arabicStr, 'translation' => 'Sesungguhnya bersama kesulitan ada kemudahan'], JSON_UNESCAPED_UNICODE),
            'duration_seconds' => 10,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/admin/media/{$item->id}");

        $response->assertStatus(200);
        $this->assertStringContainsString($arabicStr, $response->json('data.content'));
    }

    public function test_inactive_text_dakwah_filtered_in_display_state(): void
    {
        MediaItem::create([
            'title' => 'Teks Aktif',
            'type' => 'text',
            'content' => 'Pesan Aktif',
            'duration_seconds' => 10,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        MediaItem::create([
            'title' => 'Teks Nonaktif',
            'type' => 'text',
            'content' => 'Pesan Nonaktif',
            'duration_seconds' => 10,
            'is_active' => false,
            'sort_order' => 2,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200);
        $mediaList = $response->json('media');

        $titles = collect($mediaList)->pluck('title')->all();
        $this->assertContains('Teks Aktif', $titles);
        $this->assertNotContains('Teks Nonaktif', $titles);
    }
}
