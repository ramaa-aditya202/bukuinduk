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
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // Maks 10MB
        ]);

        $import = new StudentsImport($request->user());

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memproses file Excel.',
                'error'   => config('app.debug') ? $e->getMessage() : 'Format file tidak sesuai template.',
            ], 422);
        }

        $successCount = $import->getSuccessCount();
        $errors = $import->getErrors();

        // Audit log
        AuditService::logCreate(new \App\Models\Student(), [
            'action'  => 'bulk_import',
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
        return Excel::download(
            new \App\Exports\ImportTemplateExport(),
            'template_import_siswa.xlsx'
        );
    }
}
