<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Exports\StudentsExport;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class ExportController extends Controller
{
    /**
     * POST /api/export/students
     *
     * Export Excel langsung (sinkron) — file diunduh langsung oleh browser.
     * Untuk dataset besar (>5000 baris) bisa dipindah ke queued job di masa depan.
     */
    public function exportStudents(Request $request)
    {
        $this->authorize('export', \App\Models\Student::class);

        $filters = $request->validate([
            'tahun_masuk'        => 'nullable|array',
            'tahun_masuk.*'      => 'integer|min:2000',
            'tahun_masuk_from'   => 'nullable|integer|min:2000',
            'tahun_masuk_to'     => 'nullable|integer|min:2000',
            'student_status'     => 'nullable|array',
            'student_status.*'   => 'in:aktif,lulus,pindah,keluar,nonaktif',
            'special_status'     => 'nullable|array',
            'special_status.*'   => 'string|in:Umum,Yatim,Dhu\'afa,Piatu',
            'class_id'           => 'nullable|array',
            'class_id.*'         => 'uuid|exists:classes,id',
        ]);

        $filename = 'buku_induk_export_' . now()->format('Y-m-d_His') . '.xlsx';

        // Audit log
        AuditService::logExport(\App\Models\Student::class, $filters);

        try {
            return Excel::download(
                new StudentsExport($filters), 
                $filename,
                \Maatwebsite\Excel\Excel::XLSX
            );
        } catch (\Exception $e) {
            // Fallback manual CSV export if Excel fails
            $students = \App\Models\Student::with(['parents'])->when($filters['student_status'] ?? null, function($q, $s) {
                $q->where('student_status', $s);
            })->get();
            
            $headers = ['Nama', 'NISN', 'NIK', 'L/P', 'Tempat Lahir', 'Tgl Lahir', 'Thn Masuk', 'Status Siswa'];
            $callback = function() use ($students, $headers) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $headers);
                foreach ($students as $student) {
                    fputcsv($file, [
                        $student->name,
                        $student->nisn,
                        $student->nik,
                        $student->gender,
                        $student->birth_place,
                        $student->birth_date,
                        $student->tahun_masuk,
                        $student->student_status,
                    ]);
                }
                fclose($file);
            };

            return response()->streamDownload($callback, 'buku_induk_export_fallback_' . now()->format('Y-m-d_His') . '.csv', [
                'Content-Type' => 'text/csv',
            ]);
        }
    }

    /**
     * GET /api/export/download/{filename}
     *
     * Download file export yang sudah selesai di-generate (legacy/queued).
     */
    public function download(Request $request, string $filename): mixed
    {
        $path = 'exports/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'message' => 'File export tidak ditemukan atau belum selesai diproses.',
            ], 404);
        }

        return Storage::disk('local')->download($path, $filename);
    }
}
