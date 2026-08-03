<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ExportStudentsJob;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExportController extends Controller
{
    /**
     * POST /api/export/students
     *
     * Trigger export Excel sebagai queued job.
     * User mendapat notifikasi saat file siap diunduh.
     */
    public function exportStudents(Request $request): JsonResponse
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

        // Dispatch ke queue
        ExportStudentsJob::dispatch(
            $request->user(),
            $filters,
            $filename
        );

        // Audit log
        AuditService::logExport(\App\Models\Student::class, $filters);

        return response()->json([
            'message'  => 'Export sedang diproses. Anda akan mendapat notifikasi saat file siap diunduh.',
            'filename' => $filename,
        ], 202);
    }

    /**
     * GET /api/export/download/{filename}
     *
     * Download file export yang sudah selesai di-generate.
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
