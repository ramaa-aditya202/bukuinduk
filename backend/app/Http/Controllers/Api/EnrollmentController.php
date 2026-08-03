<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    /**
     * GET /api/enrollments
     *
     * Daftar enrollment (penempatan kelas) — bisa difilter per tahun ajaran / kelas.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with(['student:id,name,nisn', 'classRoom:id,name,level', 'academicYear:id,label']);

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $enrollments = $query->orderByDesc('created_at')->paginate(50);

        return response()->json($enrollments);
    }

    /**
     * POST /api/enrollments
     *
     * Enroll siswa ke kelas pada tahun ajaran tertentu.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id'       => 'required|uuid|exists:students,id',
            'class_id'         => 'required|uuid|exists:classes,id',
            'academic_year_id' => 'required|uuid|exists:academic_years,id',
            'status'           => 'nullable|in:naik_kelas,tinggal_kelas,lulus,pindah',
        ]);

        // Cek apakah siswa sudah dienroll di tahun ajaran ini
        $exists = Enrollment::where('student_id', $validated['student_id'])
                            ->where('academic_year_id', $validated['academic_year_id'])
                            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Siswa sudah terdaftar di tahun ajaran ini. Gunakan fitur update untuk mengubah kelas.',
            ], 422);
        }

        $enrollment = Enrollment::create($validated);

        return response()->json([
            'message' => 'Siswa berhasil ditempatkan di kelas.',
            'data'    => $enrollment->load(['student:id,name', 'classRoom:id,name', 'academicYear:id,label']),
        ], 201);
    }

    /**
     * PUT /api/enrollments/{id}
     *
     * Update status enrollment (naik kelas / tinggal kelas / lulus / pindah).
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);

        $validated = $request->validate([
            'class_id' => 'sometimes|uuid|exists:classes,id',
            'status'   => 'sometimes|nullable|in:naik_kelas,tinggal_kelas,lulus,pindah',
        ]);

        $enrollment->update($validated);

        return response()->json([
            'message' => 'Data enrollment berhasil diperbarui.',
            'data'    => $enrollment->fresh(['student:id,name', 'classRoom:id,name', 'academicYear:id,label']),
        ]);
    }

    /**
     * DELETE /api/enrollments/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $enrollment = Enrollment::findOrFail($id);
        $enrollment->delete();

        return response()->json(['message' => 'Data enrollment berhasil dihapus.']);
    }

    /**
     * POST /api/enrollments/bulk
     *
     * Bulk enroll siswa (untuk kenaikan kelas massal).
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enrollments'                    => 'required|array|min:1',
            'enrollments.*.student_id'       => 'required|uuid|exists:students,id',
            'enrollments.*.class_id'         => 'required|uuid|exists:classes,id',
            'enrollments.*.academic_year_id' => 'required|uuid|exists:academic_years,id',
            'enrollments.*.status'           => 'nullable|in:naik_kelas,tinggal_kelas,lulus,pindah',
        ]);

        $created = [];
        $errors = [];

        foreach ($validated['enrollments'] as $i => $data) {
            $exists = Enrollment::where('student_id', $data['student_id'])
                                ->where('academic_year_id', $data['academic_year_id'])
                                ->exists();

            if ($exists) {
                $student = Student::find($data['student_id']);
                $errors[] = "Baris " . ($i + 1) . ": {$student->name} sudah terdaftar di tahun ajaran ini.";
                continue;
            }

            $created[] = Enrollment::create($data);
        }

        return response()->json([
            'message' => count($created) . ' siswa berhasil ditempatkan.',
            'created' => count($created),
            'errors'  => $errors,
        ], count($errors) > 0 ? 207 : 201);
    }
}
