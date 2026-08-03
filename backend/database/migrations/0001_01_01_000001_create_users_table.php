<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel users — Autentikasi & RBAC + SSO Authentik
     *
     * Mendukung login lokal (break-glass) dan SSO via Authentik OIDC.
     * Role dipetakan dari group claim Authentik saat JIT provisioning.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password')->nullable(); // Nullable jika akun murni SSO
            $table->string('sso_provider')->nullable(); // 'authentik' atau null
            $table->string('sso_id')->nullable()->unique(); // Subject Identifier dari Authentik
            $table->enum('role', ['super_admin', 'admin_tu', 'guru', 'wali_kelas'])
                  ->default('guru');
            $table->string('avatar_url')->nullable();
            $table->rememberToken();
            $table->timestamps();

            // Index untuk pencarian cepat saat JIT provisioning
            $table->index(['sso_provider', 'sso_id']);
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });

        // Personal access tokens (Sanctum)
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
