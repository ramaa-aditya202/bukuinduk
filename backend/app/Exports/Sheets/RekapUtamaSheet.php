<?php

namespace App\Exports\Sheets;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class RekapUtamaSheet implements FromQuery, WithTitle, WithHeadings, WithMapping, ShouldAutoSize
{
    use AppliesStudentFilters;
    public function __construct(private array $filters = []) {}

    public function title(): string
    {
        return 'Rekap Utama';
    }

    public function query()
    {
        $query = Student::with(['currentEnrollment.classRoom', 'currentEnrollment.academicYear']);
        return $this->applyFilters($query)->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'No', 'Nama Lengkap', 'NISN', 'NIK', 'L/P', 'Tempat Lahir', 'Tanggal Lahir',
            'Tahun Masuk', 'Kelas Saat Ini', 'Status', 'Anak Ke-', 'Dari Bersaudara',
            'Riwayat Penyakit', 'Status Siswa',
        ];
    }

    public function map($student): array
    {
        static $no = 0;
        $no++;

        return [
            $no,
            $student->name,
            $student->nisn,
            $student->nik, // Tampilkan NIK asli untuk admin
            $student->gender,
            $student->birth_place,
            $student->birth_date?->format('d/m/Y'),
            $student->tahun_masuk,
            $student->currentEnrollment?->classRoom?->name ?? '-',
            implode(', ', $student->status ?? []),
            $student->sibling_order,
            $student->total_siblings,
            $student->medical_history ?? '-',
            $student->student_status,
        ];
    }
}
