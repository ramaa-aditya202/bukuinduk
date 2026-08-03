<?php

namespace App\Exports;

use App\Models\Document;
use App\Models\Student;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * StudentsExport — Multi-sheet Excel Export (4 sheets)
 *
 * Sheet 1: Rekap Utama (identitas siswa)
 * Sheet 2: Detail Orang Tua
 * Sheet 3: Kelengkapan Dokumen
 * Sheet 4: Rekap per Angkatan/Tahun Masuk
 */
class StudentsExport implements WithMultipleSheets
{
    use Exportable;

    public function __construct(
        private array $filters = []
    ) {}

    public function sheets(): array
    {
        return [
            'Rekap Utama'          => new Sheets\RekapUtamaSheet($this->filters),
            'Detail Orang Tua'     => new Sheets\DetailOrangTuaSheet($this->filters),
            'Kelengkapan Dokumen'  => new Sheets\KelengkapanDokumenSheet($this->filters),
            'Rekap per Angkatan'   => new Sheets\RekapAngkatanSheet($this->filters),
        ];
    }
}
