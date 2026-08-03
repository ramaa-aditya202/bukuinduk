<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom alamat terstruktur ke tabel students.
     *
     * Kolom-kolom ini menggantikan field alamat tunggal dan mendukung
     * stepper input alamat pada frontend (Jalan → RT → RW → Kelurahan/Desa →
     * Kecamatan → Kabupaten → Provinsi → Kode Pos).
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('address_street')->nullable()->after('student_status');  // Jalan / Perumahan / Gang
            $table->string('address_rt', 5)->nullable()->after('address_street');   // RT
            $table->string('address_rw', 5)->nullable()->after('address_rt');       // RW
            $table->string('address_village')->nullable()->after('address_rw');     // Kelurahan / Desa
            $table->string('address_district')->nullable()->after('address_village'); // Kecamatan
            $table->string('address_city')->nullable()->after('address_district');    // Kabupaten / Kota
            $table->string('address_province')->nullable()->after('address_city');    // Provinsi
            $table->string('address_postal_code', 10)->nullable()->after('address_province'); // Kode Pos
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'address_street',
                'address_rt',
                'address_rw',
                'address_village',
                'address_district',
                'address_city',
                'address_province',
                'address_postal_code',
            ]);
        });
    }
};
