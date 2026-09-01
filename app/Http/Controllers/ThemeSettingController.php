<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\ThemeSetting;

class ThemeSettingController extends Controller
{
    private const DEFAULT_THEME = [
        'theme_name'       => 'Deep Emerald',
        'primary_color'    => '#10b981',
        'secondary_color'  => '#f59e0b',
        'background_color' => '#020617',
        'text_color'       => '#f8fafc',
        'layout_config'    => [
            'layout_mode'     => 'default',
            'show_header'     => true,
            'show_media'      => true,
            'show_schedule'   => true,
            'show_running_text' => true,
        ],
        'custom_css'       => null,
        'is_active'        => true,
    ];

    /**
     * GET /api/admin/theme
     */
    public function show(): JsonResponse
    {
        $theme = ThemeSetting::where('is_active', true)->first()
            ?? ThemeSetting::create(self::DEFAULT_THEME);

        return response()->json([
            'status' => 'success',
            'theme'  => $theme,
        ]);
    }

    /**
     * POST /api/admin/theme
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'theme_name'       => 'required|string|max:255',
            'primary_color'    => 'nullable|string|max:50',
            'secondary_color'  => 'nullable|string|max:50',
            'background_color' => 'nullable|string|max:50',
            'text_color'       => 'nullable|string|max:50',
            'layout_config'    => 'nullable|array',
            'custom_css'       => 'nullable|string',
        ]);

        $theme = ThemeSetting::where('is_active', true)->first();
        if (!$theme) {
            $theme = ThemeSetting::create(array_merge(self::DEFAULT_THEME, $validated));
        } else {
            $theme->update($validated);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan tema dan layout berhasil disimpan.',
            'theme'   => $theme,
        ]);
    }

    /**
     * POST /api/admin/theme/reset
     */
    public function reset(): JsonResponse
    {
        $theme = ThemeSetting::where('is_active', true)->first();
        if ($theme) {
            $theme->update(self::DEFAULT_THEME);
        } else {
            $theme = ThemeSetting::create(self::DEFAULT_THEME);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Tema dan layout berhasil di-reset ke default.',
            'theme'   => $theme,
        ]);
    }
}
