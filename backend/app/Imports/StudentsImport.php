<?php

namespace App\Imports;

use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;

/**
 * StudentsImport — Maatwebsite Excel Import
 *
 * Membaca file Excel yang sesuai template dan membuat record siswa + orang tua.
 * Kolom template: nama, nisn, nik, jenis_kelamin, tempat_lahir, tanggal_lahir,
 *   tahun_masuk, anak_ke, dari_saudara, penanggung_jawab,
 *   nama_ayah, pekerjaan_ayah, telp_ayah,
 *   nama_ibu, pekerjaan_ibu, telp_ibu,
 *   alamat_jalan, alamat_rt, alamat_rw, alamat_kelurahan,
 *   alamat_kecamatan, alamat_kabupaten, alamat_provinsi, alamat_kode_pos
 */
class StudentsImport implements ToModel, WithHeadingRow, SkipsOnError
{
    use SkipsErrors;

    private int $successCount = 0;
    private array $rowErrors = [];
    private int $currentRow = 1; // heading row is row 1, data starts at 2
    private User $importedBy;

    public function __construct(User $importedBy)
    {
        $this->importedBy = $importedBy;
    }

    public function model(array $row)
    {
        $this->currentRow++;

        // Skip empty rows
        if (empty($row['nama']) || empty($row['nisn'])) {
            return null;
        }

        // Validate required fields
        $errors = [];
        if (empty($row['nama'])) $errors[] = 'Nama wajib diisi';
        if (empty($row['nisn'])) $errors[] = 'NISN wajib diisi';
        if (empty($row['nik'])) $errors[] = 'NIK wajib diisi';
        if (empty($row['jenis_kelamin'])) $errors[] = 'Jenis kelamin wajib diisi';
        if (empty($row['tempat_lahir'])) $errors[] = 'Tempat lahir wajib diisi';
        if (empty($row['tanggal_lahir'])) $errors[] = 'Tanggal lahir wajib diisi';

        if (!empty($errors)) {
            $this->rowErrors[] = "Baris {$this->currentRow}: " . implode(', ', $errors);
            return null;
        }

        // Check NISN duplicate
        if (Student::where('nisn', $row['nisn'])->exists()) {
            $this->rowErrors[] = "Baris {$this->currentRow}: NISN {$row['nisn']} sudah terdaftar ({$row['nama']})";
            return null;
        }

        // Parse gender
        $gender = strtoupper(trim($row['jenis_kelamin'] ?? ''));
        if ($gender === 'LAKI-LAKI' || $gender === 'LAKI' || $gender === 'L') {
            $gender = 'L';
        } elseif ($gender === 'PEREMPUAN' || $gender === 'P') {
            $gender = 'P';
        } else {
            $this->rowErrors[] = "Baris {$this->currentRow}: Jenis kelamin tidak valid (harus L/P)";
            return null;
        }

        // Parse guardian_type
        $guardianType = strtolower(trim($row['penanggung_jawab'] ?? 'ayah'));
        if (!in_array($guardianType, ['ayah', 'ibu', 'orang_lain'])) {
            $guardianType = 'ayah';
        }

        // Parse tanggal lahir
        $birthDate = $row['tanggal_lahir'];
        if (is_numeric($birthDate)) {
            // Excel serial date number
            $birthDate = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($birthDate)->format('Y-m-d');
        }

        try {
            $student = Student::create([
                'name'              => $row['nama'],
                'nisn'              => $row['nisn'],
                'nik'               => $row['nik'],
                'gender'            => $gender,
                'birth_place'       => $row['tempat_lahir'],
                'birth_date'        => $birthDate,
                'tahun_masuk'       => (int) ($row['tahun_masuk'] ?? date('Y')),
                'sibling_order'     => (int) ($row['anak_ke'] ?? 1),
                'total_siblings'    => (int) ($row['dari_saudara'] ?? 1),
                'guardian_type'     => $guardianType,
                'student_status'    => 'aktif',
                'status'            => ['Umum'],
                'created_by'        => $this->importedBy->id,
                'updated_by'        => $this->importedBy->id,
                // Alamat
                'address_street'      => $row['alamat_jalan'] ?? null,
                'address_rt'          => $row['alamat_rt'] ?? null,
                'address_rw'          => $row['alamat_rw'] ?? null,
                'address_village'     => $row['alamat_kelurahan'] ?? null,
                'address_district'    => $row['alamat_kecamatan'] ?? null,
                'address_city'        => $row['alamat_kabupaten'] ?? null,
                'address_province'    => $row['alamat_provinsi'] ?? null,
                'address_postal_code' => $row['alamat_kode_pos'] ?? null,
            ]);

            // Simpan data Ayah jika ada
            if (!empty($row['nama_ayah'])) {
                Guardian::create([
                    'student_id'   => $student->id,
                    'type'         => 'ayah',
                    'name'         => $row['nama_ayah'],
                    'occupation'   => $row['pekerjaan_ayah'] ?? null,
                    'phone_number' => $row['telp_ayah'] ?? null,
                ]);
            }

            // Simpan data Ibu jika ada
            if (!empty($row['nama_ibu'])) {
                Guardian::create([
                    'student_id'   => $student->id,
                    'type'         => 'ibu',
                    'name'         => $row['nama_ibu'],
                    'occupation'   => $row['pekerjaan_ibu'] ?? null,
                    'phone_number' => $row['telp_ibu'] ?? null,
                ]);
            }

            $this->successCount++;

            return $student;
        } catch (\Exception $e) {
            $this->rowErrors[] = "Baris {$this->currentRow}: Gagal menyimpan ({$row['nama']}) — " . $e->getMessage();
            return null;
        }
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }

    public function getErrors(): array
    {
        return $this->rowErrors;
    }
}
