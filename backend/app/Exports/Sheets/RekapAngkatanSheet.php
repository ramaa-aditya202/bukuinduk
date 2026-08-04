<?php

namespace App\Exports\Sheets;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet 4: Rekap per Angkatan/Tahun Masuk
 *
 * Pivot jumlah siswa per tahun_masuk dan status kelulusan.
 * Berguna untuk laporan tahunan ke yayasan/dinas.
 */
class RekapAngkatanSheet implements FromCollection, WithTitle, WithHeadings, ShouldAutoSize
{
    public function __construct(private array $filters = []) {}

    public function title(): string
    {
        return 'Rekap per Angkatan';
    }

    public function headings(): array
    {
        return [
            'Tahun Masuk', 'Angkatan', 'Total', 'Aktif', 'Lulus', 'Pindah', 'Keluar', 'Nonaktif',
        ];
    }

    public function collection()
    {
        $query = Student::selectRaw("
                tahun_masuk,
                count(*) as total,
                sum(case when student_status = 'aktif' then 1 else 0 end) as aktif,
                sum(case when student_status = 'lulus' then 1 else 0 end) as lulus,
                sum(case when student_status = 'pindah' then 1 else 0 end) as pindah,
                sum(case when student_status = 'keluar' then 1 else 0 end) as keluar,
                sum(case when student_status = 'nonaktif' then 1 else 0 end) as nonaktif
            ");

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

        $rows = $query->groupBy('tahun_masuk')->orderByDesc('tahun_masuk')->get();

        return $rows->map(fn ($row) => [
            $row->tahun_masuk,
            'Angkatan ' . $row->tahun_masuk,
            $row->total,
            $row->aktif,
            $row->lulus,
            $row->pindah,
            $row->keluar,
            $row->nonaktif,
        ]);
    }
}
