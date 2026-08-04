<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthentikService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /* ----------------------------------------------------------------
     | Login Lokal (Break-Glass / Emergency Admin)
     | ---------------------------------------------------------------- */

    /**
     * POST /api/auth/login
     *
     * Login dengan email & password (hanya untuk super_admin darurat
     * ketika Authentik sedang down).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->password || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        // Buat Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token'   => $token,
            'user'    => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => $user->role,
                'avatar' => $user->avatar_url,
            ],
        ]);
    }

    /* ----------------------------------------------------------------
     | SSO Authentik — OIDC Flow
     | ---------------------------------------------------------------- */

    /**
     * GET /api/auth/authentik/redirect
     *
     * Redirect ke Authentik authorization endpoint.
     */
    public function authentikRedirect(Request $request): JsonResponse
    {
        $service = new AuthentikService();

        // Generate state untuk CSRF protection
        $state = Str::random(40);
        session(['authentik_state' => $state]);

        return response()->json([
            'redirect_url' => $service->getAuthorizationUrl($state),
        ]);
    }

    /**
     * GET /api/auth/authentik/callback
     *
     * Callback dari Authentik setelah user berhasil login.
     * Exchange code → token → user info → JIT provisioning → Sanctum token.
     */
    public function authentikCallback(Request $request): JsonResponse
    {
        $request->validate([
            'code'  => 'required|string',
            'state' => 'required|string',
        ]);

        // Verify state (CSRF protection)
        $storedState = session('authentik_state');
        if ($request->state !== $storedState) {
            return response()->json([
                'message' => 'Invalid state parameter. Kemungkinan serangan CSRF.',
            ], 422);
        }

        try {
            $service = new AuthentikService();

            // Exchange authorization code → tokens
            $tokens = $service->exchangeCode($request->code);
            $accessToken = $tokens['access_token'];

            // Fetch user info
            $userInfo = $service->getUserInfo($accessToken);

            // JIT provisioning — buat/update user lokal
            $user = $service->provisionUser($userInfo);

            // Buat Sanctum token
            $token = $user->createToken('sso-auth-token')->plainTextToken;

            // Hapus state dari session
            session()->forget('authentik_state');

            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            $userData = base64_encode(json_encode([
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'role'   => $user->role,
                'avatar' => $user->avatar_url,
            ]));

            return redirect()->away("{$frontendUrl}/login?token={$token}&user={$userData}");

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal login via SSO Authentik.',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal error.',
            ], 500);
        }
    }

    /* ----------------------------------------------------------------
     | Logout — termasuk Single Log-Out (SLO)
     | ---------------------------------------------------------------- */

    /**
     * POST /api/auth/logout
     *
     * Hapus sesi lokal (Sanctum) dan arahkan ke SLO Authentik jika SSO user.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $isSsoUser = $user?->isSsoUser();

        // Revoke current token
        $request->user()?->currentAccessToken()?->delete();

        $response = [
            'message' => 'Logout berhasil.',
        ];

        // Jika user SSO, sertakan URL SLO Authentik
        if ($isSsoUser) {
            $service = new AuthentikService();
            $response['slo_redirect_url'] = $service->getLogoutUrl();
        }

        return response()->json($response);
    }

    /* ----------------------------------------------------------------
     | User Profile
     | ---------------------------------------------------------------- */

    /**
     * GET /api/auth/me
     *
     * Ambil data user yang sedang login.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->role,
                'avatar'     => $user->avatar_url,
                'is_sso'     => $user->isSsoUser(),
                'created_at' => $user->created_at,
            ],
        ]);
    }
}
