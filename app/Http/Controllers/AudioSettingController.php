<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\AudioSetting;
use Illuminate\Support\Facades\Storage;

class AudioSettingController extends Controller
{
    /**
     * GET /api/admin/audio
     * Return all audio settings as a unified object for the frontend.
     */
    public function show(): JsonResponse
    {
        $rows = AudioSetting::all()->keyBy('type');

        $adzan       = $rows->get('adzan');
        $murottal    = $rows->get('murottal');
        $dzikirPagi  = $rows->get('dzikir_pagi');
        $dzikirPetang = $rows->get('dzikir_petang');

        $enabledPrayersAdzan = $adzan
            ? json_decode($adzan->source_url ?? '["subuh","dzuhur","ashar","maghrib","isya"]', true)
            : ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        $enabledPrayersMurottal = $murottal
            ? json_decode($murottal->source_url ?? '["subuh","dzuhur","ashar","maghrib","isya"]', true)
            : ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        return response()->json([
            'status' => 'success',
            'audio' => [
                'adzan_audio_url'               => $adzan?->file_path ?? 'https://cdn.islamicfinder.org/audios/adhan/makkah.mp3',
                'volume_adzan'                  => $adzan?->volume ?? 80,
                'adzan_duration_seconds'        => $adzan?->play_after_minutes ?? 150,
                'enabled_prayers_for_adzan'      => $enabledPrayersAdzan,
                'murottal_enabled'              => (bool) ($murottal?->is_enabled ?? true),
                'murottal_before_minutes'       => $murottal?->play_before_minutes ?? 5,
                'murottal_audio_url'            => $murottal?->file_path ?? 'https://server8.mp3quran.net/afs/018.mp3',
                'volume_murottal'               => $murottal?->volume ?? 80,
                'enabled_prayers_for_murottal'  => $enabledPrayersMurottal,
                'dzikir_pagi_enabled'           => (bool) ($dzikirPagi?->is_enabled ?? true),
                'dzikir_pagi_after_minutes'      => $dzikirPagi?->play_after_minutes ?? 10,
                'dzikir_pagi_audio_url'          => $dzikirPagi?->file_path ?? 'https://cdn.islamicfinder.org/audios/dzikir_pagi.mp3',
                'dzikir_petang_enabled'         => (bool) ($dzikirPetang?->is_enabled ?? true),
                'dzikir_petang_after_minutes'    => $dzikirPetang?->play_after_minutes ?? 10,
                'dzikir_petang_audio_url'        => $dzikirPetang?->file_path ?? 'https://cdn.islamicfinder.org/audios/dzikir_petang.mp3',
                'volume_dzikir'                 => $dzikirPagi?->volume ?? 80,
            ],
        ]);
    }

    /**
     * POST /api/admin/audio
     * Save audio settings from admin panel.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'adzan_audio_url'              => 'nullable|string|max:500',
            'volume_adzan'                 => 'required|integer|min:0|max:100',
            'adzan_duration_seconds'       => 'required|integer|min:30|max:600',
            'enabled_prayers_for_adzan'    => 'nullable|array',
            'enabled_prayers_for_adzan.*'  => 'string|in:subuh,dzuhur,ashar,maghrib,isya',
            'murottal_enabled'             => 'required|boolean',
            'murottal_before_minutes'      => 'required|integer|min:1|max:60',
            'murottal_audio_url'           => 'nullable|string|max:500',
            'volume_murottal'              => 'required|integer|min:0|max:100',
            'enabled_prayers_for_murottal'   => 'nullable|array',
            'enabled_prayers_for_murottal.*' => 'string|in:subuh,dzuhur,ashar,maghrib,isya',
            'dzikir_pagi_enabled'          => 'required|boolean',
            'dzikir_pagi_after_minutes'     => 'nullable|integer|min:1|max:120',
            'dzikir_pagi_audio_url'         => 'nullable|string|max:500',
            'dzikir_petang_enabled'        => 'required|boolean',
            'dzikir_petang_after_minutes'   => 'nullable|integer|min:1|max:120',
            'dzikir_petang_audio_url'       => 'nullable|string|max:500',
            'volume_dzikir'                => 'required|integer|min:0|max:100',
        ]);

        $enabledPrayersAdzan = $validated['enabled_prayers_for_adzan']
            ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        $enabledPrayersMurottal = $validated['enabled_prayers_for_murottal']
            ?? ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

        // Adzan
        AudioSetting::updateOrCreate(
            ['type' => 'adzan'],
            [
                'prayer_name'         => 'all',
                'file_path'           => $validated['adzan_audio_url'] ?? null,
                'source_url'          => json_encode($enabledPrayersAdzan),
                'play_after_minutes'  => $validated['adzan_duration_seconds'],
                'volume'              => $validated['volume_adzan'],
                'is_enabled'          => true,
            ]
        );

        // Murottal
        AudioSetting::updateOrCreate(
            ['type' => 'murottal'],
            [
                'prayer_name'         => 'all',
                'file_path'           => $validated['murottal_audio_url'] ?? null,
                'source_url'          => json_encode($enabledPrayersMurottal),
                'play_before_minutes' => $validated['murottal_before_minutes'],
                'volume'              => $validated['volume_murottal'],
                'is_enabled'          => $validated['murottal_enabled'],
            ]
        );

        // Dzikir Pagi
        AudioSetting::updateOrCreate(
            ['type' => 'dzikir_pagi'],
            [
                'prayer_name'         => 'subuh',
                'file_path'           => $validated['dzikir_pagi_audio_url'] ?? null,
                'play_after_minutes'  => $validated['dzikir_pagi_after_minutes'] ?? 10,
                'volume'              => $validated['volume_dzikir'],
                'is_enabled'          => $validated['dzikir_pagi_enabled'],
            ]
        );

        // Dzikir Petang
        AudioSetting::updateOrCreate(
            ['type' => 'dzikir_petang'],
            [
                'prayer_name'         => 'ashar',
                'file_path'           => $validated['dzikir_petang_audio_url'] ?? null,
                'play_after_minutes'  => $validated['dzikir_petang_after_minutes'] ?? 10,
                'volume'              => $validated['volume_dzikir'],
                'is_enabled'          => $validated['dzikir_petang_enabled'],
            ]
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan audio berhasil disimpan.',
        ]);
    }

    /**
     * POST /api/admin/audio/upload
     * Handle MP3/WAV/OGG file upload for custom adzan audio.
     */
    public function uploadFile(Request $request): JsonResponse
    {
        $request->validate([
            'adzan_file' => 'required|file|mimes:mp3,wav,ogg|max:20480',
        ]);

        $path    = $request->file('adzan_file')->store('audio/adzan', 'public');
        $fileUrl = '/storage/' . $path;

        AudioSetting::updateOrCreate(
            ['type' => 'adzan'],
            ['file_path' => $fileUrl]
        );

        return response()->json([
            'status'   => 'success',
            'file_url' => $fileUrl,
            'message'  => 'File audio adzan berhasil diunggah.',
        ]);
    }

    /**
     * POST /api/admin/audio/upload-murottal
     * Handle MP3/WAV/OGG file upload for custom murottal audio.
     */
    public function uploadMurottalFile(Request $request): JsonResponse
    {
        $request->validate([
            'murottal_file' => 'required|file|mimes:mp3,wav,ogg|max:20480',
        ]);

        $path    = $request->file('murottal_file')->store('audio/murottal', 'public');
        $fileUrl = '/storage/' . $path;

        AudioSetting::updateOrCreate(
            ['type' => 'murottal'],
            ['file_path' => $fileUrl]
        );

        return response()->json([
            'status'   => 'success',
            'file_url' => $fileUrl,
            'message'  => 'File audio murottal berhasil diunggah.',
        ]);
    }

    /**
     * POST /api/admin/audio/upload-dzikir-pagi
     */
    public function uploadDzikirPagiFile(Request $request): JsonResponse
    {
        $request->validate([
            'dzikir_file' => 'required|file|mimes:mp3,wav,ogg|max:20480',
        ]);

        $path    = $request->file('dzikir_file')->store('audio/dzikir', 'public');
        $fileUrl = '/storage/' . $path;

        AudioSetting::updateOrCreate(
            ['type' => 'dzikir_pagi'],
            ['file_path' => $fileUrl]
        );

        return response()->json([
            'status'   => 'success',
            'file_url' => $fileUrl,
            'message'  => 'File audio dzikir pagi berhasil diunggah.',
        ]);
    }

    /**
     * POST /api/admin/audio/upload-dzikir-petang
     */
    public function uploadDzikirPetangFile(Request $request): JsonResponse
    {
        $request->validate([
            'dzikir_file' => 'required|file|mimes:mp3,wav,ogg|max:20480',
        ]);

        $path    = $request->file('dzikir_file')->store('audio/dzikir', 'public');
        $fileUrl = '/storage/' . $path;

        AudioSetting::updateOrCreate(
            ['type' => 'dzikir_petang'],
            ['file_path' => $fileUrl]
        );

        return response()->json([
            'status'   => 'success',
            'file_url' => $fileUrl,
            'message'  => 'File audio dzikir petang berhasil diunggah.',
        ]);
    }
}
