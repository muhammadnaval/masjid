<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\MosqueProfile;
use App\Services\HijriDateService;

class HijriSettingController extends Controller
{
    public function show(HijriDateService $hijriService): JsonResponse
    {
        $profile = MosqueProfile::first() ?? MosqueProfile::create([
            'name' => 'MASJID AL-HIDAYAH SITEBA',
            'address' => 'Jl. Raya Siteba No. 15',
            'timezone' => 'Asia/Jakarta',
            'hijri_correction' => 0,
        ]);

        $correction = (int) ($profile->hijri_correction ?? 0);
        $dateInfo = $hijriService->convertToHijri(null, $correction, $profile->timezone ?? 'Asia/Jakarta');

        return response()->json([
            'status'           => 'success',
            'hijri_correction' => $correction,
            'date_info'        => $dateInfo,
        ]);
    }

    public function update(Request $request, HijriDateService $hijriService): JsonResponse
    {
        $validated = $request->validate([
            'hijri_correction' => 'required|integer|min:-5|max:5',
        ]);

        $profile = MosqueProfile::first();
        if (!$profile) {
            $profile = new MosqueProfile();
            $profile->name = 'MASJID AL-HIDAYAH SITEBA';
            $profile->address = 'Jl. Raya Siteba No. 15';
            $profile->timezone = 'Asia/Jakarta';
        }

        $profile->hijri_correction = $validated['hijri_correction'];
        $profile->save();

        $dateInfo = $hijriService->convertToHijri(null, (int) $profile->hijri_correction, $profile->timezone ?? 'Asia/Jakarta');

        return response()->json([
            'status'           => 'success',
            'message'          => 'Koreksi tanggal Hijriyah berhasil disimpan.',
            'hijri_correction' => (int) $profile->hijri_correction,
            'date_info'        => $dateInfo,
        ]);
    }
}
