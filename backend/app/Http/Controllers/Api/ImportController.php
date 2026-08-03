<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\StudentsImport;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ImportController extends Controller
{
    /**
     * POST /api/import/students
     *
     * Upload file Excel untuk bulk import data siswa.
     * Template Excel harus sesuai format yang disediakan.
     */
    public function importStudents(Request $request): JsonResponse
    {
        $this->authorize('create', \App\Models\Student::class);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // Maks 10MB
        ]);

        $import = new StudentsImport($request->user());

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            Excel::import($import, $request->file('file'));
            \Illuminate\Support\Facades\DB::commit();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json([
                'message' => 'Gagal memproses file Excel.',
                'error'   => $e->getMessage(),
            ], 422);
        }

        $successCount = $import->getSuccessCount();
        $errors = $import->getErrors();

        // Audit log
        AuditService::logImport(\App\Models\Student::class, [
            'success' => $successCount,
            'errors'  => count($errors),
        ]);

        $statusCode = count($errors) > 0 ? 207 : 201;

        return response()->json([
            'message' => "{$successCount} data siswa berhasil diimport.",
            'success' => $successCount,
            'errors'  => $errors,
        ], $statusCode);
    }

    /**
     * GET /api/import/template
     *
     * Download template Excel untuk bulk import siswa.
     * Template di-generate dinamis dari Maatwebsite/Excel.
     */
    public function downloadTemplate(): mixed
    {
        try {
            return Excel::download(
                new \App\Exports\ImportTemplateExport(),
                'template_import_siswa.xlsx',
                \Maatwebsite\Excel\Excel::XLSX
            );
        } catch (\Exception $e) {
            // Fallback manual CSV generation if Excel library fails (e.g., autoload issue)
            $headers = [
                'nama', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'tahun_masuk',
                'anak_ke', 'dari_saudara', 'penanggung_jawab', 'nama_ayah', 'pekerjaan_ayah', 'telp_ayah',
                'nama_ibu', 'pekerjaan_ibu', 'telp_ibu', 'alamat_jalan', 'alamat_rt', 'alamat_rw',
                'alamat_kelurahan', 'alamat_kecamatan', 'alamat_kabupaten', 'alamat_provinsi', 'alamat_kode_pos', 'status_khusus'
            ];
            
            $callback = function() use ($headers) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $headers);
                fputcsv($file, [
                    'Ahmad Fadhil', '0012345678', '3201012345670001', 'L', 'Bogor', '2010-05-15', 2024,
                    2, 3, 'ayah', 'Budi Santoso', 'Wiraswasta', '081234567890',
                    'Siti Aminah', 'Ibu Rumah Tangga', '081234567891', 'Jl. Merdeka No. 1', '001', '002',
                    'Ciluar', 'Sukaraja', 'Kab. Bogor', 'Jawa Barat', '16710', 'Umum'
                ]);
                fclose($file);
            };

            return response()->streamDownload($callback, 'template_import_siswa.csv', [
                'Content-Type' => 'text/csv',
            ]);
        }
    }
}
