<?php

namespace App\Exports\Sheets;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class DetailOrangTuaSheet implements FromQuery, WithTitle, WithHeadings, WithMapping, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function title(): string
    {
        return 'Detail Orang Tua';
    }

    public function query()
    {
        $query = Student::with('parents');

        if (!empty($this->filters['tahun_masuk'])) {
            $query->where('tahun_masuk', $this->filters['tahun_masuk']);
        }
        if (!empty($this->filters['tahun_masuk_from'])) {
            $query->where('tahun_masuk', '>=', $this->filters['tahun_masuk_from']);
        }
        if (!empty($this->filters['tahun_masuk_to'])) {
            $query->where('tahun_masuk', '<=', $this->filters['tahun_masuk_to']);
        }
        if (!empty($this->filters['student_status'])) {
            $query->where('student_status', $this->filters['student_status']);
        }
        if (!empty($this->filters['special_status'])) {
            $query->whereJsonContains('status', $this->filters['special_status']);
        }
        if (!empty($this->filters['class_id'])) {
            $query->whereHas('currentEnrollment', fn($q) => $q->where('class_id', $this->filters['class_id']));
        }

        return $query->orderBy('name');
    }

    public function headings(): array
    {
        return [
            'Nama Siswa', 'NISN',
            'Nama Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah', 'Pendidikan Ayah', 'No. HP Ayah',
            'Nama Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu', 'Pendidikan Ibu', 'No. HP Ibu',
            'Wali Santri', 'Nama Wali', 'Hubungan', 'Pekerjaan Wali', 'No. HP Wali',
        ];
    }

    public function map($student): array
    {
        $father = $student->parents->firstWhere('type', 'ayah');
        $mother = $student->parents->firstWhere('type', 'ibu');
        $wali = $student->parents->firstWhere('type', 'wali');

        $guardianLabel = match ($student->guardian_type) {
            'ayah' => 'Ayah Kandung',
            'ibu'  => 'Ibu Kandung',
            'orang_lain' => 'Orang Lain',
            default => '-',
        };

        return [
            $student->name,
            $student->nisn,
            $father?->name ?? '-',
            $father?->occupation ?? '-',
            $father?->income_per_month ? 'Rp ' . number_format($father->income_per_month, 0, ',', '.') : '-',
            $father?->last_education ?? '-',
            $father?->phone_number ?? '-',
            $mother?->name ?? '-',
            $mother?->occupation ?? '-',
            $mother?->income_per_month ? 'Rp ' . number_format($mother->income_per_month, 0, ',', '.') : '-',
            $mother?->last_education ?? '-',
            $mother?->phone_number ?? '-',
            $guardianLabel,
            $wali?->name ?? ($student->guardian_type === 'ayah' ? $father?->name : $mother?->name) ?? '-',
            $wali?->relationship_description ?? $guardianLabel,
            $wali?->occupation ?? ($student->guardian_type === 'ayah' ? $father?->occupation : $mother?->occupation) ?? '-',
            $wali?->phone_number ?? ($student->guardian_type === 'ayah' ? $father?->phone_number : $mother?->phone_number) ?? '-',
        ];
    }
}
