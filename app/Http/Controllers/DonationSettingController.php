<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\DonationSetting;
use Illuminate\Support\Facades\Storage;

class DonationSettingController extends Controller
{
    /**
     * GET /api/admin/donasi
     */
    public function show(): JsonResponse
    {
        $donation = DonationSetting::first() ?? DonationSetting::create([
            'title'          => 'Infaq & Sedekah Operasional Masjid',
            'description'    => 'Salurkan infaq dan sedekah terbaik Anda untuk memakmurkan masjid dan kegiatan dakwah.',
            'qr_code_path'   => 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://masjid.test/donasi',
            'bank_name'      => 'Bank Syariah Indonesia (BSI)',
            'account_name'   => 'Masjid Al-Hidayah Siteba',
            'account_number' => '7123-4567-8901',
            'is_active'      => true,
        ]);

        return response()->json([
            'status'   => 'success',
            'donation' => $donation,
        ]);
    }

    /**
     * POST /api/admin/donasi
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'bank_name'      => 'nullable|string|max:255',
            'account_name'   => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'qr_code_path'   => 'nullable|string|max:500',
            'is_active'      => 'required|boolean',
        ]);

        $donation = DonationSetting::first();
        if ($donation) {
            if (!empty($validated['qr_code_path']) && $donation->qr_code_path && $donation->qr_code_path !== $validated['qr_code_path']) {
                $oldPath = ltrim(str_replace('/storage/', '', $donation->qr_code_path), '/');
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $donation->update($validated);
        } else {
            $donation = DonationSetting::create($validated);
        }

        return response()->json([
            'status'   => 'success',
            'message'  => 'Pengaturan donasi berhasil disimpan.',
            'donation' => $donation,
        ]);
    }

    /**
     * POST /api/admin/donasi/upload-qr
     */
    public function uploadQr(Request $request): JsonResponse
    {
        $request->validate([
            'qr_file' => 'required|file|mimes:jpg,jpeg,png,webp|max:10240', // 10MB max
        ]);

        $file     = $request->file('qr_file');
        $path     = $file->store('donation', 'public');
        $fileUrl  = '/storage/' . $path;

        return response()->json([
            'status'   => 'success',
            'file_url' => $fileUrl,
            'message'  => 'Gambar QR Code donasi berhasil diunggah.',
        ]);
    }
}
