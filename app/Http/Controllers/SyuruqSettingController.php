<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\SyuruqSetting;

class SyuruqSettingController extends Controller
{
    /**
     * GET /api/admin/syuruq
     */
    public function show(): JsonResponse
    {
        $setting = SyuruqSetting::first();

        return response()->json([
            'status' => 'success',
            'syuruq' => [
                'is_enabled'       => $setting ? (bool) $setting->is_enabled : true,
                'duration_minutes' => $setting ? (int) $setting->duration_minutes : 10,
            ],
        ]);
    }

    /**
     * POST /api/admin/syuruq
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled'       => 'required|boolean',
            'duration_minutes' => 'required|integer|min:1|max:60',
        ]);

        $setting = SyuruqSetting::first();
        if (!$setting) {
            $setting = new SyuruqSetting();
        }

        $setting->is_enabled       = $validated['is_enabled'];
        $setting->duration_minutes = $validated['duration_minutes'];
        $setting->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan Syuruq berhasil disimpan.',
            'syuruq'  => [
                'is_enabled'       => (bool) $setting->is_enabled,
                'duration_minutes' => (int) $setting->duration_minutes,
            ],
        ]);
    }
}
