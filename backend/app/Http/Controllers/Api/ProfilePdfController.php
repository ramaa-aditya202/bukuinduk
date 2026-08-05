<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfilePdfController extends Controller
{
    /**
     * POST /api/students/{id}/pdf
     *
     * Generate PDF profil individu siswa secara sinkron dan langsung diunduh.
     * Layout: Page 1 = Data tulisan + foto 3x4, Page 2+ = Dokumen gambar.
     */
    public function generate(Request $request, string $id)
    {
        $student = Student::with([
            'parents',
            'classRoom',
            'documents',
        ])->findOrFail($id);

        $this->authorize('view', $student);

        // Resolve data wali
        $guardianInfo = $this->resolveGuardian($student);

        // Ambil foto 3x4 sebagai base64 (agar embed di PDF)
        $photoBase64 = null;
        $photoDoc = $student->documents->firstWhere('doc_type', 'pas_foto');
        if ($photoDoc && $photoDoc->file_path) {
            try {
                $photoContent = Storage::disk('minio')->get($photoDoc->file_path);
                $photoBase64 = 'data:' . ($photoDoc->mime_type ?? 'image/jpeg') . ';base64,' . base64_encode($photoContent);
            } catch (\Exception $e) {
                // Foto tidak tersedia, lanjutkan tanpa foto
            }
        }

        // Ambil dokumen gambar untuk halaman-halaman berikutnya
        $imageDocuments = $student->documents->filter(function ($doc) {
            return $doc->doc_type !== 'pas_foto'
                && $doc->mime_type
                && str_starts_with($doc->mime_type, 'image/');
        })->map(function ($doc) {
            try {
                $content = Storage::disk('minio')->get($doc->file_path);
                $doc->image_base64 = 'data:' . $doc->mime_type . ';base64,' . base64_encode($content);
            } catch (\Exception $e) {
                $doc->image_base64 = null;
            }
            return $doc;
        })->filter(fn ($doc) => $doc->image_base64 !== null);

        $pdf = Pdf::loadView('pdf.student-profile', [
            'student'          => $student,
            'father'           => $student->parents->firstWhere('type', 'ayah'),
            'mother'           => $student->parents->firstWhere('type', 'ibu'),
            'guardian'         => $guardianInfo,
            'currentClass'     => $student->classRoom,
            'documents'        => $student->documents,
            'photoBase64'      => $photoBase64,
            'imageDocuments'   => $imageDocuments,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'profil_' . str_replace(' ', '_', strtolower($student->name)) . '_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    private function resolveGuardian(Student $student): array
    {
        if ($student->guardian_type === 'ayah') {
            $parent = $student->parents->firstWhere('type', 'ayah');
            return ['label' => 'Ayah Kandung', 'data' => $parent];
        }
        if ($student->guardian_type === 'ibu') {
            $parent = $student->parents->firstWhere('type', 'ibu');
            return ['label' => 'Ibu Kandung', 'data' => $parent];
        }
        $wali = $student->parents->firstWhere('type', 'wali');
        return ['label' => 'Wali: ' . ($wali?->relationship_description ?? 'Lainnya'), 'data' => $wali];
    }
}
