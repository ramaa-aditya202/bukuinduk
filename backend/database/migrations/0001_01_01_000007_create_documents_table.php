<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel documents — Manajemen Berkas (Polymorphic)
     *
     * Menyimpan metadata dokumen yang diupload ke MinIO.
     * Polymorphic: bisa milik siswa atau guru (future-proof).
     * File fisik ada di MinIO, tabel ini hanya menyimpan path.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('entity_id'); // Polymorphic ID
            $table->string('entity_type'); // 'App\Models\Student' atau 'App\Models\Teacher'
            $table->string('doc_type'); // ijazah, kk, pas_foto, sktm, sk_kematian, akta_kelahiran, dll
            $table->string('original_filename'); // Nama file asli saat diupload
            $table->string('file_path'); // Path di bucket MinIO
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable(); // Bytes
            $table->foreignUuid('uploaded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();

            // Index untuk query per entity
            $table->index(['entity_id', 'entity_type']);
            $table->index('doc_type');
        });

        // Sekarang tambahkan FK photo_document_id ke students
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('photo_document_id')
                  ->references('id')
                  ->on('documents')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['photo_document_id']);
        });
        Schema::dropIfExists('documents');
    }
};
