<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel students — Data Utama Siswa (Buku Induk)
     *
     * Kolom inti data siswa lengkap dengan:
     * - Field-level encryption untuk NIK (UU PDP compliance)
     * - JSONB untuk status multi-value
     * - Soft deletes (data siswa tidak pernah dihapus permanen)
     * - Audit trail (created_by, updated_by)
     */
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Nama Lengkap
            $table->string('nisn')->unique(); // Nomor Induk Siswa Nasional
            $table->text('nik'); // Encrypted — NIK (field-level encryption)
            $table->enum('gender', ['L', 'P']); // Laki-laki / Perempuan
            $table->string('birth_place'); // Tempat lahir
            $table->date('birth_date'); // Tanggal lahir
            $table->text('medical_history')->nullable(); // Riwayat penyakit
            $table->integer('sibling_order')->default(1); // Anak ke-
            $table->integer('total_siblings')->default(1); // Dari x bersaudara
            $table->jsonb('status')->default('[]'); // ["Umum","Yatim","Dhu'afa","Piatu"]
            $table->integer('tahun_masuk'); // Tahun ajaran pertama terdaftar (contoh: 2024)
            $table->enum('guardian_type', ['ayah', 'ibu', 'orang_lain'])
                  ->default('ayah'); // Penanggung jawab / Wali santri
            $table->string('entry_class_level')->nullable(); // Masuk di kelas berapa
            $table->enum('student_status', ['aktif', 'lulus', 'pindah', 'keluar', 'nonaktif'])
                  ->default('aktif');
            $table->uuid('photo_document_id')->nullable(); // Foreign key dihandle di migration documents

            // Audit trail
            $table->foreignUuid('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->foreignUuid('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();
            $table->softDeletes(); // Data siswa tidak pernah dihapus permanen

            // Indexes untuk query cepat
            $table->index('nisn');
            $table->index('tahun_masuk');
            $table->index('student_status');
            $table->index('gender');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
