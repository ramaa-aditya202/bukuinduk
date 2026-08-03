<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabel parents — Data Orang Tua & Wali Santri
     *
     * Relasi: setiap siswa memiliki data ayah, ibu, dan opsional wali.
     * Logika wali santri:
     *   - guardian_type = 'ayah' → data wali = data ayah (tanpa duplikasi row)
     *   - guardian_type = 'ibu' → data wali = data ibu
     *   - guardian_type = 'orang_lain' → row terpisah type = 'wali' wajib ada
     */
    public function up(): void
    {
        Schema::create('parents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')
                  ->constrained('students')
                  ->cascadeOnDelete();
            $table->enum('type', ['ayah', 'ibu', 'wali']);
            $table->string('name');
            $table->string('birth_place')->nullable();
            $table->string('religion')->nullable();
            $table->string('occupation')->nullable(); // Pekerjaan
            $table->decimal('income_per_month', 12, 2)->nullable(); // Penghasilan per bulan
            $table->string('last_education')->nullable(); // Pendidikan terakhir
            $table->string('phone_number')->nullable();
            $table->text('address')->nullable();
            $table->string('relationship_description')->nullable(); // Keterangan hubungan jika type = 'wali'
            $table->timestamps();

            // Index untuk query per siswa
            $table->index(['student_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parents');
    }
};
