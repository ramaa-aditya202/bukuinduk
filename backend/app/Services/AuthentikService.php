<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * AuthentikService — Integrasi SSO via OpenID Connect
 *
 * Menangani seluruh flow OIDC dengan Authentik:
 * - Generate authorization URL
 * - Exchange authorization code → tokens
 * - Fetch user info
 * - JIT (Just-In-Time) user provisioning
 * - Role mapping dari group claims
 */
class AuthentikService
{
    private string $baseUrl;
    private string $clientId;
    private string $clientSecret;
    private string $redirectUri;
    private array $roleMapping;

    public function __construct()
    {
        $config = config('services.authentik');

        $this->baseUrl      = rtrim($config['base_url'], '/');
        $this->clientId     = $config['client_id'];
        $this->clientSecret = $config['client_secret'];
        $this->redirectUri  = $config['redirect'];
        $this->roleMapping  = $config['role_mapping'] ?? [];
    }

    /**
     * Generate URL untuk redirect ke Authentik authorization endpoint.
     */
    public function getAuthorizationUrl(string $state): string
    {
        $params = http_build_query([
            'client_id'     => $this->clientId,
            'redirect_uri'  => $this->redirectUri,
            'response_type' => 'code',
            'scope'         => 'openid profile email groups',
            'state'         => $state,
        ]);

        return $this->baseUrl . config('services.authentik.authorize_url') . '?' . $params;
    }

    /**
     * Exchange authorization code untuk access token dan id token.
     */
    public function exchangeCode(string $code): array
    {
        $response = Http::asForm()->post($this->baseUrl . config('services.authentik.token_url'), [
            'grant_type'    => 'authorization_code',
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectUri,
            'code'          => $code,
        ]);

        if (!$response->successful()) {
            throw new \Exception('Gagal menukarkan authorization code: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * Fetch user info dari Authentik menggunakan access token.
     */
    public function getUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
                        ->get($this->baseUrl . config('services.authentik.userinfo_url'));

        if (!$response->successful()) {
            throw new \Exception('Gagal mengambil user info dari Authentik: ' . $response->body());
        }

        return $response->json();
    }

    /**
     * JIT (Just-In-Time) User Provisioning
     *
     * Buat atau perbarui user lokal berdasarkan data dari Authentik.
     * Password di-set NULL (akun murni SSO).
     */
    public function provisionUser(array $userInfo): User
    {
        $ssoId = $userInfo['sub'];
        $email = $userInfo['email'] ?? null;
        $name  = $userInfo['name'] ?? $userInfo['preferred_username'] ?? 'Unknown';
        $groups = $userInfo['groups'] ?? [];

        // Cari user by sso_id, atau by email sebagai fallback
        $user = User::where('sso_id', $ssoId)->first();

        if (!$user && $email) {
            $user = User::where('email', $email)->first();
        }

        // Tentukan role dari group mapping
        $role = $this->mapGroupsToRole($groups);

        if ($user) {
            // Update user yang sudah ada
            $user->update([
                'name'         => $name,
                'sso_provider' => 'authentik',
                'sso_id'       => $ssoId,
                'role'         => $role,
                'avatar_url'   => $userInfo['picture'] ?? $user->avatar_url,
            ]);
        } else {
            // Buat user baru (JIT provisioning)
            $user = User::create([
                'id'           => Str::uuid()->toString(),
                'name'         => $name,
                'email'        => $email,
                'password'     => null, // Akun SSO tidak punya password lokal
                'sso_provider' => 'authentik',
                'sso_id'       => $ssoId,
                'role'         => $role,
                'avatar_url'   => $userInfo['picture'] ?? null,
            ]);
        }

        return $user;
    }

    /**
     * Map Authentik group claims ke role internal.
     *
     * Prioritas: super_admin > admin_tu > wali_kelas > guru (default)
     */
    private function mapGroupsToRole(array $groups): string
    {
        // Urutan prioritas dari tertinggi ke terendah
        $priorityOrder = ['super_admin', 'admin_tu', 'wali_kelas', 'guru'];

        $mappedRoles = [];
        foreach ($groups as $group) {
            if (isset($this->roleMapping[$group])) {
                $mappedRoles[] = $this->roleMapping[$group];
            }
        }

        // Ambil role dengan prioritas tertinggi
        foreach ($priorityOrder as $role) {
            if (in_array($role, $mappedRoles)) {
                return $role;
            }
        }

        return 'guru'; // Default role
    }

    /**
     * Generate URL untuk Single Log-Out (SLO) di Authentik.
     */
    public function getLogoutUrl(): string
    {
        return $this->baseUrl . config('services.authentik.logout_url');
    }
}
