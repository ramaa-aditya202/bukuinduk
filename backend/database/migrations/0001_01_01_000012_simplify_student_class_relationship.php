<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add class_id to students
        Schema::table('students', function (Blueprint $table) {
            $table->foreignUuid('class_id')
                  ->nullable()
                  ->after('guardian_type')
                  ->constrained('classes')
                  ->nullOnDelete();
        });

        // (Optional) Migrate existing enrollments data to students.class_id
        // Mengambil enrollment terbaru untuk masing-masing siswa
        DB::statement("
            UPDATE students
            SET class_id = (
                SELECT class_id 
                FROM enrollments 
                WHERE enrollments.student_id = students.id 
                ORDER BY created_at DESC 
                LIMIT 1
            )
            WHERE EXISTS (
                SELECT 1 FROM enrollments WHERE enrollments.student_id = students.id
            )
        ");

        // 2. Drop enrollments table
        Schema::dropIfExists('enrollments');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Recreate enrollments
        Schema::create('enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignUuid('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->enum('status', ['naik_kelas', 'tinggal_kelas', 'lulus', 'pindah'])->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'academic_year_id']);
            $table->index(['student_id', 'academic_year_id']);
            $table->index(['class_id', 'academic_year_id']);
        });

        // 2. Drop class_id from students
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['class_id']);
            $table->dropColumn('class_id');
        });
    }
};
