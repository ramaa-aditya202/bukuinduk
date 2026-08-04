<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom tahun_angkatan ke tabel students.
     *
     * Kolom ini digunakan khusus untuk siswa pindahan, di mana:
     * - tahun_masuk    = tahun siswa bergabung ke sekolah ini (contoh: 2025)
     * - tahun_angkatan = tahun angkatan asli siswa (contoh: 2024, ketika masuk kelas 10)
     *
     * Untuk siswa reguler (non-pindahan), kolom ini dibiarkan NULL
     * dan aplikasi dapat fallback ke tahun_masuk.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->integer('tahun_angkatan')
                  ->nullable()
                  ->after('tahun_masuk')
                  ->comment('Tahun angkatan asli siswa. Diisi untuk siswa pindahan jika berbeda dari tahun_masuk.');

            $table->index('tahun_angkatan');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['tahun_angkatan']);
            $table->dropColumn('tahun_angkatan');
        });
    }
};
