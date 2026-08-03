<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        $years = AcademicYear::orderByDesc('start_date')->get();
        return response()->json(['data' => $years]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label'      => 'required|string|max:20',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'is_active'  => 'boolean',
        ]);

        $year = AcademicYear::create($validated);

        if ($validated['is_active'] ?? false) {
            $year->activate();
        }

        return response()->json([
            'message' => 'Tahun ajaran berhasil dibuat.',
            'data' => $year,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);

        $validated = $request->validate([
            'label'      => 'sometimes|string|max:20',
            'start_date' => 'sometimes|date',
            'end_date'   => 'sometimes|date|after:start_date',
            'is_active'  => 'sometimes|boolean',
        ]);

        $year->update($validated);

        if ($validated['is_active'] ?? false) {
            $year->activate();
        }

        return response()->json([
            'message' => 'Tahun ajaran berhasil diperbarui.',
            'data' => $year->fresh(),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $year = AcademicYear::findOrFail($id);

        if ($year->enrollments()->exists()) {
            return response()->json([
                'message' => 'Tahun ajaran tidak dapat dihapus karena sudah memiliki data enrollment.',
            ], 422);
        }

        $year->delete();

        return response()->json(['message' => 'Tahun ajaran berhasil dihapus.']);
    }
}
