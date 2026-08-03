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
            'tahun_masuk_from' => 'nullable|integer|min:2000',
            'tahun_masuk_to'   => 'nullable|integer|min:2000',
            'student_status'   => 'nullable|in:aktif,lulus,pindah,keluar,nonaktif',
            'class_id'         => 'nullable|uuid|exists:classes,id',
            'academic_year_id' => 'nullable|uuid|exists:academic_years,id',
        ]);

        $filename = 'buku_induk_export_' . now()->format('Y-m-d_His') . '.xlsx';

        // Audit log
        AuditService::logExport(\App\Models\Student::class, $filters);

        return Excel::download(new StudentsExport($filters), $filename);
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
