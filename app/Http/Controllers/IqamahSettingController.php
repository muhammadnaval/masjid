<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\IqamahSetting;

class IqamahSettingController extends Controller
{
    private const PRAYERS = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

    private const DEFAULTS = [
        'subuh'   => ['duration_minutes' => 10, 'is_enabled' => true],
        'dzuhur'  => ['duration_minutes' => 7,  'is_enabled' => true],
        'ashar'   => ['duration_minutes' => 7,  'is_enabled' => true],
        'maghrib' => ['duration_minutes' => 5,  'is_enabled' => true],
        'isya'    => ['duration_minutes' => 7,  'is_enabled' => true],
    ];

    /**
     * GET /api/admin/iqamah
     * Return all iqamah settings keyed by prayer name.
     */
    public function index(): JsonResponse
    {
        $rows = IqamahSetting::all()->keyBy('prayer_name');

        $result = [];
        foreach (self::PRAYERS as $prayer) {
            $row = $rows->get($prayer);
            $result[$prayer] = [
                'prayer_name'     => $prayer,
                'is_enabled'      => $row ? (bool) $row->is_enabled : self::DEFAULTS[$prayer]['is_enabled'],
                'duration_minutes'=> $row ? (int) $row->duration_minutes : self::DEFAULTS[$prayer]['duration_minutes'],
            ];
        }

        return response()->json([
            'status'   => 'success',
            'iqamah'   => $result,
            'friday_mode_disabled' => true, // Always disable Dzuhur iqamah on Fridays by convention
        ]);
    }

    /**
     * POST /api/admin/iqamah
     * Save iqamah settings for each prayer.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'iqamah'              => 'required|array',
            'iqamah.*.prayer_name'      => 'required|string|in:subuh,dzuhur,ashar,maghrib,isya',
            'iqamah.*.duration_minutes' => 'required|integer|min:1|max:60',
            'iqamah.*.is_enabled'       => 'required|boolean',
            'friday_mode_disabled'      => 'nullable|boolean',
        ]);

        foreach ($validated['iqamah'] as $item) {
            IqamahSetting::updateOrCreate(
                ['prayer_name' => $item['prayer_name']],
                [
                    'duration_minutes' => $item['duration_minutes'],
                    'is_enabled'       => $item['is_enabled'],
                ]
            );
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan iqamah berhasil disimpan.',
        ]);
    }
}
