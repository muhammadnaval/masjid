<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use App\Models\MosqueProfile;

class MosqueProfileController extends Controller
{
    public function show(): JsonResponse
    {
        $profile = MosqueProfile::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'MASJID AL-HIDAYAH SITEBA',
                'address' => 'Jl. Raya Siteba No. 15, Surau Gadang, Padang',
                'contact' => 'Telp/WA: 0812-6789-0123 | Instagram: @masjid_alhidayah_siteba',
                'logo_path' => 'https://images.unsplash.com/photo-1542662565-7e4b66bae529?w=300&auto=format&fit=crop&q=80',
                'background_path' => 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1920&auto=format&fit=crop&q=80',
                'timezone' => 'Asia/Jakarta',
            ]
        );

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact' => 'nullable|string|max:255',
            'timezone' => 'required|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:5120',
            'background' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'logo_path' => 'nullable|string',
            'background_path' => 'nullable|string',
        ]);

        $profile = MosqueProfile::firstOrCreate(['id' => 1]);

        // Handle logo file upload
        if ($request->hasFile('logo')) {
            if ($profile->logo_path && str_contains($profile->logo_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', parse_url($profile->logo_path, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('logo')->store('uploads/logos', 'public');
            $validated['logo_path'] = Storage::url($path);
        }

        // Handle background file upload
        if ($request->hasFile('background')) {
            if ($profile->background_path && str_contains($profile->background_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', parse_url($profile->background_path, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('background')->store('uploads/backgrounds', 'public');
            $validated['background_path'] = Storage::url($path);
        }

        unset($validated['logo'], $validated['background']);
        $profile->update($validated);

        return response()->json([
            'message' => 'Profil masjid berhasil diperbarui.',
            'profile' => $profile,
        ]);
    }
}
