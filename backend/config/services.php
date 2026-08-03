<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentik OIDC SSO Configuration
    |--------------------------------------------------------------------------
    |
    | Konfigurasi untuk integrasi Single Sign-On dengan Authentik
    | sebagai Identity Provider (IdP) via OpenID Connect.
    |
    */
    'authentik' => [
        'base_url'      => env('AUTHENTIK_BASE_URL'),
        'client_id'     => env('AUTHENTIK_CLIENT_ID'),
        'client_secret' => env('AUTHENTIK_CLIENT_SECRET'),
        'redirect'      => env('AUTHENTIK_REDIRECT_URI'),

        // OIDC Endpoints (relative to base_url)
        'authorize_url' => '/application/o/authorize/',
        'token_url'     => '/application/o/token/',
        'userinfo_url'  => '/application/o/userinfo/',
        'logout_url'    => '/application/o/bukuinduk/end-session/',

        // Group → Role Mapping
        'role_mapping' => [
            'bukuinduk-superadmin' => 'super_admin',
            'bukuinduk-admintu'    => 'admin_tu',
            'bukuinduk-guru'       => 'guru',
            'bukuinduk-walikelas'  => 'wali_kelas',
        ],
    ],

];
