<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\FridaySetting;

class FridaySettingController extends Controller
{
    /**
     * GET /api/admin/friday
     */
    public function show(): JsonResponse
    {
        $setting = FridaySetting::first() ?? FridaySetting::create([
            'is_enabled'               => true,
            'disable_iqamah_on_friday' => true,
            'khutbah_title'            => "Khutbah & Shalat Jum'at",
            'khutbah_khatib'           => 'Ustadz Dr. H. Ahmad Fauzi, M.A.',
            'khutbah_imam'             => 'Ustadz Muhammad Ridwan',
            'khutbah_duration_minutes' => 35,
        ]);

        return response()->json([
            'status' => 'success',
            'friday' => $setting,
        ]);
    }

    /**
     * POST /api/admin/friday
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled'               => 'required|boolean',
            'disable_iqamah_on_friday' => 'required|boolean',
            'khutbah_title'            => 'required|string|max:255',
            'khutbah_khatib'           => 'nullable|string|max:255',
            'khutbah_imam'             => 'nullable|string|max:255',
            'khutbah_duration_minutes' => 'required|integer|min:5|max:120',
        ]);

        $setting = FridaySetting::first();
        if ($setting) {
            $setting->update($validated);
        } else {
            $setting = FridaySetting::create($validated);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan mode Jum\'at berhasil disimpan.',
            'friday'  => $setting,
        ]);
    }
}
