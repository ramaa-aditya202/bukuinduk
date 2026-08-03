<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel classes — Rombongan Belajar / Kelas
     *
     * Contoh: "7A", "8B", "XI IPA 2".
     * Setiap kelas punya wali kelas (homeroom_teacher).
     * Tabel teachers belum ada di MVP ini, jadi FK ke users sebagai placeholder.
     */
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Contoh: "7A", "XI IPA 2"
            $table->string('level'); // Tingkat: "7", "8", "9", "X", "XI", "XII"
            $table->foreignUuid('homeroom_teacher_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();

            $table->index('level');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
