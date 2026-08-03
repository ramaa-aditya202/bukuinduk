<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel enrollments — Riwayat Penempatan Siswa per Tahun Ajaran
     *
     * Ini yang menjadikan sistem future-proof: setiap tahun ajaran,
     * siswa "dienroll ulang" ke kelas baru, sehingga histori kenaikan
     * kelas tersimpan penuh — berguna untuk rekap rapor, mutasi,
     * dan pelacakan alumni.
     */
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')
                  ->constrained('students')
                  ->cascadeOnDelete();
            $table->foreignUuid('class_id')
                  ->constrained('classes')
                  ->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')
                  ->constrained('academic_years')
                  ->cascadeOnDelete();
            $table->enum('status', ['naik_kelas', 'tinggal_kelas', 'lulus', 'pindah'])
                  ->nullable(); // Null saat baru dienroll, diisi di akhir tahun
            $table->timestamps();

            // Setiap siswa hanya bisa dienroll sekali per tahun ajaran
            $table->unique(['student_id', 'academic_year_id']);

            // Index untuk query cepat
            $table->index(['student_id', 'academic_year_id']);
            $table->index(['class_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
