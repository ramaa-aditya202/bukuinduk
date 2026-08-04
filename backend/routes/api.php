<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProfilePdfController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Sistem Buku Induk
|--------------------------------------------------------------------------
*/

// ── Document Serve (Public dengan Signed URL) ──────────────────────────
// Bisa diakses langsung oleh browser (<img>, <iframe>, <a href>).
// Keamanan dijamin HMAC signature Laravel + expiry 15 menit.
Route::get('/documents/{id}/serve', [DocumentController::class, 'serve'])
    ->middleware('signed')
    ->name('documents.serve');

// ── Auth (Public) ──────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/authentik/redirect', [AuthController::class, 'authentikRedirect'])->middleware('web');
    Route::get('/authentik/callback', [AuthController::class, 'authentikCallback'])->middleware('web');
});

// ── Protected Routes (Sanctum) ────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Profile — Update nama & password (lokal), blokir SSO
    Route::put('/profile', [ProfileController::class, 'update']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Students — CRUD
    Route::get('/students/check-duplicate', [StudentController::class, 'checkDuplicate']);
    Route::get('/students/{id}/adjacent', [StudentController::class, 'adjacent']);
    Route::apiResource('students', StudentController::class);

    // Parents / Guardians (nested under students handled in StudentController)

    // Documents (nested under students)
    Route::get('/students/{studentId}/documents', [DocumentController::class, 'index']);
    Route::post('/students/{studentId}/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{id}/preview', [DocumentController::class, 'preview']);
    // GET /documents/{id}/serve ada di luar group ini (public signed URL)
    Route::post('/documents/{id}/reupload', [DocumentController::class, 'update']); // Reupload dokumen
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

    // Enrollments
    Route::post('/enrollments/bulk', [EnrollmentController::class, 'bulkStore']);
    Route::apiResource('enrollments', EnrollmentController::class);

    // Academic Years — Admin only
    Route::middleware('role:super_admin,admin_tu')->group(function () {
        Route::apiResource('academic-years', AcademicYearController::class);
        
        // Users / Teachers lookup
        Route::get('/users/teachers', function() {
            return response()->json(['data' => \App\Models\User::whereIn('role', ['guru', 'wali_kelas'])->get(['id', 'name'])]);
        });
    });

    // Classes — Admin only
    Route::middleware('role:super_admin,admin_tu')->group(function () {
        Route::apiResource('classes', ClassController::class);
    });

    // Export — Admin only
    Route::middleware('role:super_admin,admin_tu')->group(function () {
        Route::post('/export/students', [ExportController::class, 'exportStudents']);
        Route::get('/export/download/{filename}', [ExportController::class, 'download']);
    });

    // Import — Admin only
    Route::middleware('role:super_admin,admin_tu')->group(function () {
        Route::post('/import/students', [ImportController::class, 'importStudents']);
        Route::get('/import/template', [ImportController::class, 'downloadTemplate']);
    });

    // PDF Profile
    Route::post('/students/{id}/pdf', [ProfilePdfController::class, 'generate']);
    Route::get('/students/{id}/pdf/download/{filename}', [ProfilePdfController::class, 'download']);

    // Activity Logs — Super Admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });
});

// ── Rate Limiting (applied globally via RouteServiceProvider) ──────────
// Endpoint check-duplicate diberi rate limit khusus untuk mencegah enumerasi
