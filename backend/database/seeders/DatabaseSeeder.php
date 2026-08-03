<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\ClassRoom;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Users ──
        $superAdmin = User::create([
            'name'     => 'Super Admin',
            'email'    => 'admin@sekolah.sch.id',
            'password' => Hash::make('password'),
            'role'     => 'super_admin',
        ]);

        $adminTu = User::create([
            'name'     => 'Staff Tata Usaha',
            'email'    => 'tu@sekolah.sch.id',
            'password' => Hash::make('password'),
            'role'     => 'admin_tu',
        ]);

        $guru = User::create([
            'name'     => 'Budi Santoso, S.Pd',
            'email'    => 'budi@sekolah.sch.id',
            'password' => Hash::make('password'),
            'role'     => 'guru',
        ]);

        $waliKelas = User::create([
            'name'     => 'Siti Aminah, S.Pd',
            'email'    => 'siti@sekolah.sch.id',
            'password' => Hash::make('password'),
            'role'     => 'wali_kelas',
        ]);

        // ── 2. Tahun Ajaran ──
        $tahun2324 = AcademicYear::create([
            'label'      => '2023/2024',
            'start_date' => '2023-07-15',
            'end_date'   => '2024-06-30',
            'is_active'  => false,
        ]);

        $tahun2425 = AcademicYear::create([
            'label'      => '2024/2025',
            'start_date' => '2024-07-15',
            'end_date'   => '2025-06-30',
            'is_active'  => false,
        ]);

        $tahun2526 = AcademicYear::create([
            'label'      => '2025/2026',
            'start_date' => '2025-07-15',
            'end_date'   => '2026-06-30',
            'is_active'  => true,
        ]);

        // ── 3. Kelas ──
        $kelas7A = ClassRoom::create(['name' => '7A', 'level' => '7', 'homeroom_teacher_id' => $waliKelas->id]);
        $kelas7B = ClassRoom::create(['name' => '7B', 'level' => '7', 'homeroom_teacher_id' => $guru->id]);
        $kelas8A = ClassRoom::create(['name' => '8A', 'level' => '8', 'homeroom_teacher_id' => null]);
        $kelas8B = ClassRoom::create(['name' => '8B', 'level' => '8', 'homeroom_teacher_id' => null]);
        $kelas9A = ClassRoom::create(['name' => '9A', 'level' => '9', 'homeroom_teacher_id' => null]);

        // ── 4. Siswa contoh ──
        $students = [
            [
                'name' => 'Ahmad Fauzi', 'nisn' => '0012345001', 'nik' => '3201012345670001',
                'gender' => 'L', 'birth_place' => 'Bandung', 'birth_date' => '2011-03-15',
                'tahun_masuk' => 2023, 'guardian_type' => 'ayah',
                'father' => ['name' => 'Hasan Fauzi', 'occupation' => 'Wiraswasta', 'phone_number' => '081234567001'],
                'mother' => ['name' => 'Fatimah', 'occupation' => 'Ibu Rumah Tangga'],
            ],
            [
                'name' => 'Aisyah Zahra', 'nisn' => '0012345002', 'nik' => '3201012345670002',
                'gender' => 'P', 'birth_place' => 'Jakarta', 'birth_date' => '2011-07-22',
                'tahun_masuk' => 2023, 'guardian_type' => 'ibu',
                'father' => ['name' => 'Alm. Ridwan', 'occupation' => '-'],
                'mother' => ['name' => 'Nurul Hidayah', 'occupation' => 'Guru', 'phone_number' => '081234567002'],
                'status' => ['Yatim'],
            ],
            [
                'name' => 'Muhammad Rizki', 'nisn' => '0012345003', 'nik' => '3201012345670003',
                'gender' => 'L', 'birth_place' => 'Surabaya', 'birth_date' => '2012-01-10',
                'tahun_masuk' => 2024, 'guardian_type' => 'orang_lain',
                'father' => ['name' => 'Alm. Umar', 'occupation' => '-'],
                'mother' => ['name' => 'Almh. Khadijah', 'occupation' => '-'],
                'guardian' => ['name' => 'Pak Ahmad (Paman)', 'occupation' => 'Pedagang', 'phone_number' => '081234567003', 'relationship_description' => 'Paman'],
                'status' => ['Yatim', "Dhu'afa"],
            ],
            [
                'name' => 'Dewi Sartika', 'nisn' => '0012345004', 'nik' => '3201012345670004',
                'gender' => 'P', 'birth_place' => 'Semarang', 'birth_date' => '2012-05-18',
                'tahun_masuk' => 2024, 'guardian_type' => 'ayah',
                'father' => ['name' => 'Bambang Sutrisno', 'occupation' => 'PNS', 'phone_number' => '081234567004'],
                'mother' => ['name' => 'Sri Wahyuni', 'occupation' => 'Dokter'],
            ],
            [
                'name' => 'Fajar Nugraha', 'nisn' => '0012345005', 'nik' => '3201012345670005',
                'gender' => 'L', 'birth_place' => 'Yogyakarta', 'birth_date' => '2013-11-03',
                'tahun_masuk' => 2025, 'guardian_type' => 'ayah',
                'father' => ['name' => 'Agus Nugraha', 'occupation' => 'TNI', 'phone_number' => '081234567005'],
                'mother' => ['name' => 'Rina Wulandari', 'occupation' => 'Ibu Rumah Tangga'],
            ],
        ];

        foreach ($students as $data) {
            $student = Student::create([
                'name'           => $data['name'],
                'nisn'           => $data['nisn'],
                'nik'            => $data['nik'],
                'gender'         => $data['gender'],
                'birth_place'    => $data['birth_place'],
                'birth_date'     => $data['birth_date'],
                'tahun_masuk'    => $data['tahun_masuk'],
                'guardian_type'  => $data['guardian_type'],
                'status'         => $data['status'] ?? ['Umum'],
                'student_status' => 'aktif',
                'sibling_order'  => rand(1, 4),
                'total_siblings' => rand(1, 5),
                'created_by'     => $adminTu->id,
                'updated_by'     => $adminTu->id,
            ]);

            // Father
            Guardian::create([
                'student_id' => $student->id,
                'type'       => 'ayah',
                'name'       => $data['father']['name'],
                'occupation' => $data['father']['occupation'] ?? null,
                'phone_number' => $data['father']['phone_number'] ?? null,
            ]);

            // Mother
            Guardian::create([
                'student_id' => $student->id,
                'type'       => 'ibu',
                'name'       => $data['mother']['name'],
                'occupation' => $data['mother']['occupation'] ?? null,
                'phone_number' => $data['mother']['phone_number'] ?? null,
            ]);

            // Wali (jika orang lain)
            if (isset($data['guardian'])) {
                Guardian::create([
                    'student_id' => $student->id,
                    'type'       => 'wali',
                    'name'       => $data['guardian']['name'],
                    'occupation' => $data['guardian']['occupation'] ?? null,
                    'phone_number' => $data['guardian']['phone_number'] ?? null,
                    'relationship_description' => $data['guardian']['relationship_description'] ?? null,
                ]);
            }

            // Enrollments
            if ($data['tahun_masuk'] === 2023) {
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas7A->id,
                    'academic_year_id' => $tahun2324->id, 'status' => 'naik_kelas',
                ]);
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas8A->id,
                    'academic_year_id' => $tahun2425->id, 'status' => 'naik_kelas',
                ]);
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas9A->id,
                    'academic_year_id' => $tahun2526->id, 'status' => null,
                ]);
            } elseif ($data['tahun_masuk'] === 2024) {
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas7B->id,
                    'academic_year_id' => $tahun2425->id, 'status' => 'naik_kelas',
                ]);
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas8B->id,
                    'academic_year_id' => $tahun2526->id, 'status' => null,
                ]);
            } else {
                Enrollment::create([
                    'student_id' => $student->id, 'class_id' => $kelas7A->id,
                    'academic_year_id' => $tahun2526->id, 'status' => null,
                ]);
            }
        }

        $this->command->info('Seeder berhasil! 4 users, 3 tahun ajaran, 5 kelas, 5 siswa.');
    }
}
