<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * PUT /api/profile
     *
     * Update nama dan/atau password untuk akun lokal.
     * Akun SSO TIDAK diperbolehkan mengubah profil melalui endpoint ini.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        // Blokir akun SSO
        if ($user->isSsoUser()) {
            return response()->json([
                'message' => 'Akun SSO tidak dapat mengubah detail profil. Semua perubahan dikelola melalui penyedia SSO (Authentik).',
            ], 403);
        }

        $validated = $request->validate([
            'name'             => 'sometimes|string|min:2|max:255',
            'current_password' => 'required_with:new_password|string',
            'new_password'     => 'sometimes|string|min:8|confirmed',
        ]);

        // Update nama jika diberikan
        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        // Update password jika diberikan
        if (isset($validated['new_password'])) {
            // Verifikasi password lama
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Password lama salah.',
                    'errors'  => ['current_password' => ['Password lama tidak sesuai.']],
                ], 422);
            }

            $user->password = $validated['new_password']; // Akan otomatis di-hash karena cast 'hashed'
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => $user->role,
                'avatar' => $user->avatar_url,
                'is_sso' => $user->isSsoUser(),
            ],
        ]);
    }
}
