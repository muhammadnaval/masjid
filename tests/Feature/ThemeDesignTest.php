<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\ThemeSetting;

class ThemeDesignTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_theme_settings(): void
    {
        ThemeSetting::create([
            'theme_name' => 'Royal Navy',
            'primary_color' => '#1e3a8a',
            'secondary_color' => '#eab308',
            'background_color' => '#0f172a',
            'text_color' => '#ffffff',
            'layout_config' => ['layout_mode' => 'hero'],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/admin/theme');

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('theme.theme_name', 'Royal Navy')
                 ->assertJsonPath('theme.layout_config.layout_mode', 'hero');
    }

    public function test_can_update_theme_settings(): void
    {
        $payload = [
            'theme_name' => 'Dark Obsidian',
            'primary_color' => '#18181b',
            'secondary_color' => '#10b981',
            'background_color' => '#09090b',
            'text_color' => '#f4f4f5',
            'layout_config' => ['layout_mode' => 'media_focus'],
        ];

        $response = $this->postJson('/api/admin/theme', $payload);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                 ])
                 ->assertJsonPath('theme.theme_name', 'Dark Obsidian');

        $this->assertDatabaseHas('theme_settings', [
            'theme_name' => 'Dark Obsidian',
        ]);
    }

    public function test_can_reset_theme_to_default(): void
    {
        ThemeSetting::create([
            'theme_name' => 'Custom Modified Theme',
            'primary_color' => '#ff0000',
            'layout_config' => ['layout_mode' => 'minimal'],
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/admin/theme/reset');

        $response->assertStatus(200)
                 ->assertJsonPath('theme.theme_name', 'Deep Emerald')
                 ->assertJsonPath('theme.layout_config.layout_mode', 'default');
    }

    public function test_active_theme_included_in_display_state(): void
    {
        ThemeSetting::create([
            'theme_name' => 'Classic Gold',
            'primary_color' => '#d97706',
            'layout_config' => ['layout_mode' => 'default'],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/display/state');

        $response->assertStatus(200)
                 ->assertJsonPath('theme.theme_name', 'Classic Gold');
    }
}
