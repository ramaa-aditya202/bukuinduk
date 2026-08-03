<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel activity_logs — Audit Trail
     *
     * Mencatat siapa mengubah apa dan kapan — wajib untuk data
     * pribadi sensitif seperti NIK (UU PDP compliance).
     * Juga mencatat aksi 'view_sensitive' dan 'export'.
     */
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->string('entity_type'); // Polymorphic — 'App\Models\Student', dll
            $table->uuid('entity_id');
            $table->enum('action', ['create', 'update', 'delete', 'export', 'view_sensitive']);
            $table->jsonb('changes')->nullable(); // Diff before/after
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['entity_type', 'entity_id']);
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
