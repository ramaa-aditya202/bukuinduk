<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Student;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * GET /api/students/{studentId}/documents
     *
     * Daftar dokumen milik siswa beserta status kelengkapan.
     */
    public function index(string $studentId): JsonResponse
    {
        $student = Student::findOrFail($studentId);

        $documents = Document::where('entity_id', $studentId)
                             ->where('entity_type', Student::class)
                             ->orderBy('doc_type')
                             ->get();

        // Checklist kelengkapan dokumen
        $requiredTypes = ['pas_foto', 'ijazah', 'kk', 'akta_kelahiran'];
        $uploadedTypes = $documents->pluck('doc_type')->unique()->toArray();

        $checklist = collect($requiredTypes)->map(function ($type) use ($uploadedTypes, $documents) {
            return [
                'doc_type'  => $type,
                'label'     => Document::DOC_TYPES[$type] ?? $type,
                'completed' => in_array($type, $uploadedTypes),
                'document'  => $documents->firstWhere('doc_type', $type)?->only(['id', 'original_filename', 'created_at']),
            ];
        });

        return response()->json([
            'documents' => $documents->map(fn ($doc) => [
                'id'                => $doc->id,
                'doc_type'          => $doc->doc_type,
                'doc_type_label'    => $doc->doc_type_label,
                'original_filename' => $doc->original_filename,
                'mime_type'         => $doc->mime_type,
                'file_size'         => $doc->file_size,
                'signed_url'        => $doc->signed_url,
                'uploaded_at'       => $doc->created_at,
            ]),
            'checklist'        => $checklist,
            'completion_rate'  => count(array_intersect($requiredTypes, $uploadedTypes)) . '/' . count($requiredTypes),
        ]);
    }

    /**
     * POST /api/students/{studentId}/documents
     *
     * Upload dokumen siswa ke MinIO.
     * Validasi: hanya .pdf, .jpg, .jpeg, .png, maksimal 2MB.
     */
    public function store(Request $request, string $studentId): JsonResponse
    {
        $student = Student::findOrFail($studentId);

        $request->validate([
            'file'     => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
            'doc_type' => 'required|string|in:' . implode(',', array_keys(Document::DOC_TYPES)),
        ]);

        $file = $request->file('file');
        $docType = $request->input('doc_type');

        // Generate path unik di MinIO
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "students/{$studentId}/{$docType}/{$filename}";

        // Upload ke MinIO
        Storage::disk('minio')->put($path, file_get_contents($file), 'private');

        // Simpan metadata ke database
        $document = Document::create([
            'entity_id'         => $studentId,
            'entity_type'       => Student::class,
            'doc_type'          => $docType,
            'original_filename' => $file->getClientOriginalName(),
            'file_path'         => $path,
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
            'uploaded_by'       => $request->user()->id,
        ]);

        // Jika pas foto, set sebagai foto utama siswa
        if ($docType === 'pas_foto') {
            $student->update(['photo_document_id' => $document->id]);
        }

        AuditService::logCreate($document);

        return response()->json([
            'message'  => 'Dokumen berhasil diupload.',
            'document' => [
                'id'                => $document->id,
                'doc_type'          => $document->doc_type,
                'doc_type_label'    => $document->doc_type_label,
                'original_filename' => $document->original_filename,
                'signed_url'        => $document->signed_url,
            ],
        ], 201);
    }

    /**
     * PUT /api/documents/{id}
     *
     * Reupload (ganti) dokumen yang sudah ada.
     * Menghapus file lama dari MinIO dan menggantinya dengan yang baru.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $file = $request->file('file');

        // Hapus file lama dari MinIO
        if ($document->file_path) {
            Storage::disk('minio')->delete($document->file_path);
        }

        // Generate path baru
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "students/{$document->entity_id}/{$document->doc_type}/{$filename}";

        // Upload file baru ke MinIO
        Storage::disk('minio')->put($path, file_get_contents($file), 'private');

        // Update metadata
        $document->update([
            'original_filename' => $file->getClientOriginalName(),
            'file_path'         => $path,
            'mime_type'         => $file->getMimeType(),
            'file_size'         => $file->getSize(),
            'uploaded_by'       => $request->user()->id,
        ]);

        // Jika pas foto, pastikan reference masih benar
        if ($document->doc_type === 'pas_foto') {
            Student::where('id', $document->entity_id)
                   ->update(['photo_document_id' => $document->id]);
        }

        AuditService::logUpdate($document, [], ['reupload' => true]);

        return response()->json([
            'message'  => 'Dokumen berhasil diganti.',
            'document' => [
                'id'                => $document->id,
                'doc_type'          => $document->doc_type,
                'doc_type_label'    => $document->doc_type_label,
                'original_filename' => $document->original_filename,
                'signed_url'        => $document->fresh()->signed_url,
            ],
        ]);
    }

    /**
     * GET /api/documents/{id}/preview
     *
     * Mengembalikan URL proxy backend untuk preview dokumen.
     * Dokumen sensitif dicatat ke activity_logs.
     */
    public function preview(Request $request, string $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        // Log akses dokumen sensitif
        if ($document->isSensitive()) {
            AuditService::logSensitiveAccess($document, $document->doc_type);
        }

        return response()->json([
            'signed_url' => $document->proxy_url,
            'filename'   => $document->original_filename,
            'mime_type'  => $document->mime_type,
        ]);
    }

    /**
     * GET /api/documents/{id}/serve
     *
     * Proxy/stream file dari MinIO ke client.
     * MinIO tidak perlu diekspos ke internet — semua akses melalui backend.
     * File di-stream langsung, tidak ada redirect ke URL MinIO.
     */
    public function serve(Request $request, string $id): StreamedResponse
    {
        $document = Document::findOrFail($id);

        // Log akses dokumen sensitif
        if ($document->isSensitive()) {
            AuditService::logSensitiveAccess($document, $document->doc_type);
        }

        abort_if(empty($document->file_path), 404, 'File tidak ditemukan.');

        $disk = Storage::disk('minio');

        abort_unless($disk->exists($document->file_path), 404, 'File tidak ditemukan di storage.');

        $mimeType = $document->mime_type ?: 'application/octet-stream';
        $filename  = $document->original_filename;

        // Tentukan apakah file bisa ditampilkan inline di browser
        $inlineTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $disposition = in_array($mimeType, $inlineTypes) ? 'inline' : 'attachment';

        return response()->stream(function () use ($disk, $document) {
            $stream = $disk->readStream($document->file_path);
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type'              => $mimeType,
            'Content-Disposition'       => $disposition . '; filename="' . addslashes($filename) . '"',
            'Content-Length'            => $disk->size($document->file_path),
            'Cache-Control'             => 'private, no-store',
            'X-Content-Type-Options'    => 'nosniff',
        ]);
    }

    /**
     * DELETE /api/documents/{id}
     *
     * Hapus dokumen dari MinIO dan database.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        // Hapus file dari MinIO
        if ($document->file_path) {
            Storage::disk('minio')->delete($document->file_path);
        }

        // Hapus pas foto reference jika ada
        Student::where('photo_document_id', $document->id)
               ->update(['photo_document_id' => null]);

        AuditService::logDelete($document);
        $document->delete();

        return response()->json([
            'message' => 'Dokumen berhasil dihapus.',
        ]);
    }
}
