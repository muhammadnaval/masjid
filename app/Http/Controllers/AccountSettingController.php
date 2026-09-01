<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AccountSettingController extends Controller
{
    /**
     * GET /api/admin/account
     * Return current admin user details.
     */
    public function show(): JsonResponse
    {
        $user = User::first() ?? User::create([
            'name' => 'Pengurus Masjid',
            'email' => 'admin@masjid.test',
            'password' => Hash::make('admin123'),
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * POST /api/admin/account/profile
     * Update admin user profile info (name & email).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|max:255',
        ]);

        $user = User::first();
        if (!$user) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make('admin123'),
            ]);
        } else {
            $user->update($validated);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Profil pengguna berhasil diperbarui.',
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * POST /api/admin/account/password
     * Change admin account password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:6|confirmed',
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'new_password.required'     => 'Kata sandi baru wajib diisi.',
            'new_password.min'          => 'Kata sandi baru minimal 6 karakter.',
            'new_password.confirmed'    => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        $user = User::first();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Pengguna admin tidak ditemukan.',
            ], 404);
        }

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Kata sandi saat ini tidak benar.',
            ], 422);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Kata sandi akun admin berhasil diperbarui!',
        ]);
    }
}
