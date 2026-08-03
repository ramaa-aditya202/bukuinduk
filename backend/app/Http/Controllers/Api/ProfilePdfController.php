<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateProfilePdfJob;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfilePdfController extends Controller
{
    /**
     * POST /api/students/{id}/pdf
     *
     * Generate PDF profil individu siswa (queued).
     */
    public function generate(Request $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $this->authorize('view', $student);

        $filename = 'profil_' . str_replace(' ', '_', strtolower($student->name)) . '_' . now()->format('Ymd') . '.pdf';

        GenerateProfilePdfJob::dispatch($student, $request->user(), $filename);

        return response()->json([
            'message'  => 'PDF profil sedang diproses.',
            'filename' => $filename,
        ], 202);
    }

    /**
     * GET /api/students/{id}/pdf/download/{filename}
     *
     * Download PDF profil yang sudah selesai.
     */
    public function download(string $id, string $filename): mixed
    {
        $path = 'exports/pdf/' . $filename;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'message' => 'File PDF belum selesai diproses atau tidak ditemukan.',
            ], 404);
        }

        return Storage::disk('local')->download($path, $filename);
    }
}
