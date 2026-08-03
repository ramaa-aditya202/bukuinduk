<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Template kosong untuk import bulk data siswa.
 * Bisa di-generate via artisan command atau endpoint API.
 */
class ImportTemplateExport implements FromArray, WithHeadings, WithTitle, WithStyles
{
    public function headings(): array
    {
        return [
            'nama',
            'nisn',
            'nik',
            'jenis_kelamin',
            'tempat_lahir',
            'tanggal_lahir',
            'tahun_masuk',
            'anak_ke',
            'dari_saudara',
            'penanggung_jawab',
            'nama_ayah',
            'pekerjaan_ayah',
            'telp_ayah',
            'nama_ibu',
            'pekerjaan_ibu',
            'telp_ibu',
            'alamat_jalan',
            'alamat_rt',
            'alamat_rw',
            'alamat_kelurahan',
            'alamat_kecamatan',
            'alamat_kabupaten',
            'alamat_provinsi',
            'alamat_kode_pos',
            'status_khusus',
        ];
    }

    public function array(): array
    {
        // Contoh 1 baris data (opsional, bisa dikosongkan)
        return [
            [
                'Ahmad Fadhil',     // nama
                '0012345678',       // nisn
                '3201012345670001', // nik
                'L',                // jenis_kelamin
                'Bogor',            // tempat_lahir
                '2010-05-15',       // tanggal_lahir
                2024,               // tahun_masuk
                2,                  // anak_ke
                3,                  // dari_saudara
                'ayah',             // penanggung_jawab
                'Budi Santoso',     // nama_ayah
                'Wiraswasta',       // pekerjaan_ayah
                '081234567890',     // telp_ayah
                'Siti Aminah',      // nama_ibu
                'Ibu Rumah Tangga', // pekerjaan_ibu
                '081234567891',     // telp_ibu
                'Jl. Merdeka No. 1', // alamat_jalan
                '001',              // alamat_rt
                '002',              // alamat_rw
                'Ciluar',           // alamat_kelurahan
                'Sukaraja',         // alamat_kecamatan
                'Kab. Bogor',       // alamat_kabupaten
                'Jawa Barat',       // alamat_provinsi
                '16710',            // alamat_kode_pos
                'Umum',             // status_khusus
            ],
        ];
    }

    public function title(): string
    {
        return 'Data Siswa';
    }

    public function styles(Worksheet $sheet)
    {
        // Bold header row
        $sheet->getStyle('A1:Y1')->getFont()->setBold(true);

        // Auto-size columns
        foreach (range('A', 'Y') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        return [];
    }
}
