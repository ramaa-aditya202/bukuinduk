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
        $rows = Student::selectRaw("
                tahun_masuk,
                count(*) as total,
                sum(case when student_status = 'aktif' then 1 else 0 end) as aktif,
                sum(case when student_status = 'lulus' then 1 else 0 end) as lulus,
                sum(case when student_status = 'pindah' then 1 else 0 end) as pindah,
                sum(case when student_status = 'keluar' then 1 else 0 end) as keluar,
                sum(case when student_status = 'nonaktif' then 1 else 0 end) as nonaktif
            ")
            ->groupBy('tahun_masuk')
            ->orderByDesc('tahun_masuk')
            ->get();

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
