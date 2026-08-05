<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ClassRoom::with('homeroomTeacher:id,name');

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        $classes = $query->orderBy('level')->orderBy('name')->get();

        return response()->json(['data' => $classes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:50',
            'level'                => 'required|string|max:10',
            'homeroom_teacher_id'  => 'nullable|uuid|exists:users,id',
        ]);

        $class = ClassRoom::create($validated);

        return response()->json([
            'message' => 'Kelas berhasil dibuat.',
            'data' => $class->load('homeroomTeacher:id,name'),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $class = ClassRoom::findOrFail($id);

        $validated = $request->validate([
            'name'                 => 'sometimes|string|max:50',
            'level'                => 'sometimes|string|max:10',
            'homeroom_teacher_id'  => 'nullable|uuid|exists:users,id',
        ]);

        $class->update($validated);

        return response()->json([
            'message' => 'Kelas berhasil diperbarui.',
            'data' => $class->fresh('homeroomTeacher:id,name'),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $class = ClassRoom::findOrFail($id);
        // Set null untuk siswa yang berada di kelas ini
        $class->students()->update(['class_id' => null]);
        
        $class->delete();

        return response()->json(['message' => 'Kelas berhasil dihapus.']);
    }
}
