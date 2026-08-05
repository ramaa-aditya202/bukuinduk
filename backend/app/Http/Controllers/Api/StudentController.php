<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Models\Enrollment;
use App\Models\Guardian;
use App\Models\Student;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    /**
     * GET /api/students
     *
     * Daftar siswa dengan pagination, search, dan filter.
     * Server-side — tidak pernah load seluruh data ke frontend.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Student::with(['classRoom', 'photo']);

        // Filter berdasarkan role (wali kelas hanya lihat siswanya)
        if ($request->user()->isWaliKelas()) {
            $classIds = $request->user()->homeroomClasses()->pluck('id');
            $query->whereIn('class_id', $classIds);
        }

        // Search (nama / NISN)
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter tahun masuk — Laravel parse tahun_masuk[]=2023&tahun_masuk[]=2024 → array otomatis
        $tahunMasuk = array_filter((array) ($request->input('tahun_masuk') ?? []));
        if (!empty($tahunMasuk)) {
            $query->whereIn('tahun_masuk', array_map('intval', $tahunMasuk));
        }

        // Filter student_status — array: student_status[]=aktif&student_status[]=lulus
        $studentStatuses = array_filter((array) ($request->input('student_status') ?? []));
        if (!empty($studentStatuses)) {
            $query->whereIn('student_status', $studentStatuses);
        }

        // Filter status khusus (JSONB array) — OR logic: siswa yatim ATAU dhu'afa ATAU keduanya
        $specialStatuses = array_filter((array) ($request->input('special_status') ?? []));
        if (!empty($specialStatuses)) {
            $query->where(function ($q) use ($specialStatuses) {
                foreach ($specialStatuses as $s) {
                    $q->orWhereJsonContains('status', $s);
                }
            });
        }

        // Filter gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->gender);
        }

        // Filter kelas — array: class_id[]=uuid1&class_id[]=uuid2
        $classIds = array_filter((array) ($request->input('class_id') ?? []));
        if (!empty($classIds)) {
            $query->whereIn('class_id', $classIds);
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');
        $allowedSorts = ['name', 'nisn', 'tahun_masuk', 'student_status', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $students = $query->paginate($perPage);

        // Mask NIK untuk role non-admin
        $canViewSensitive = $request->user()->canViewSensitiveData();

        $students->getCollection()->transform(function ($student) use ($canViewSensitive) {
            $data = $student->toArray();
            $data['nik'] = $canViewSensitive ? $student->nik : $student->masked_nik;
            $data['current_class'] = $student->classRoom?->name ?? '-';
            $data['photo_url'] = $student->photo?->signed_url;
            return $data;
        });

        return response()->json($students);
    }

    /**
     * GET /api/students/{id}
     *
     * Detail satu siswa — halaman buku induk.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $student = Student::with([
            'parents',
            'classRoom',
            'documents',
            'photo',
            'createdBy',
            'updatedBy',
        ])->findOrFail($id);

        $this->authorize('view', $student);

        $canViewSensitive = $request->user()->canViewSensitiveData();

        // Build response
        $data = $student->toArray();
        $data['nik'] = $canViewSensitive ? $student->nik : $student->masked_nik;
        $data['photo_url'] = $student->photo?->signed_url;
        $data['current_class'] = $student->classRoom?->name ?? '-';

        // Mask medical history untuk guru
        if (!$canViewSensitive) {
            $data['medical_history'] = $student->medical_history ? '[Data tersembunyi]' : null;
        }

        // Tentukan siapa wali santri
        $data['guardian_info'] = $this->resolveGuardianInfo($student);

        // Documents dengan signed URLs
        $data['documents'] = $student->documents->map(function ($doc) {
            return [
                'id'            => $doc->id,
                'doc_type'      => $doc->doc_type,
                'doc_type_label' => $doc->doc_type_label,
                'original_filename' => $doc->original_filename,
                'signed_url'    => $doc->signed_url,
                'uploaded_at'   => $doc->created_at,
            ];
        });

        // Tidak ada lagi riwayat enrollment
        $data['academic_timeline'] = [];

        // Log akses data sensitif
        if ($canViewSensitive) {
            AuditService::logSensitiveAccess($student, 'full_profile');
        }

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/students
     *
     * Buat data siswa baru (multi-step form submit).
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // ── Simpan data siswa ──
        $student = Student::create([
            'name'              => $validated['name'],
            'nisn'              => $validated['nisn'],
            'nik'               => $validated['nik'],
            'gender'            => $validated['gender'],
            'birth_place'       => $validated['birth_place'],
            'birth_date'        => $validated['birth_date'],
            'medical_history'   => $validated['medical_history'] ?? null,
            'sibling_order'     => $validated['sibling_order'],
            'total_siblings'    => $validated['total_siblings'],
            'status'            => $validated['status'] ?? ['Umum'],
            'tahun_masuk'       => $validated['tahun_masuk'],
            'tahun_angkatan'    => $validated['tahun_angkatan'] ?? null,
            'guardian_type'     => $validated['guardian_type'],
            'class_id'          => $validated['class_id'] ?? null,
            'entry_class_level' => $validated['entry_class_level'] ?? null,
            'student_status'    => $validated['student_status'] ?? 'aktif',
            'created_by'        => $request->user()->id,
            'updated_by'        => $request->user()->id,
            // Alamat
            'address_street'      => $validated['address_street'] ?? null,
            'address_rt'          => $validated['address_rt'] ?? null,
            'address_rw'          => $validated['address_rw'] ?? null,
            'address_village'     => $validated['address_village'] ?? null,
            'address_district'    => $validated['address_district'] ?? null,
            'address_city'        => $validated['address_city'] ?? null,
            'address_province'    => $validated['address_province'] ?? null,
            'address_postal_code' => $validated['address_postal_code'] ?? null,
        ]);

        // ── Simpan data Ayah ──
        Guardian::create([
            'student_id' => $student->id,
            'type'       => 'ayah',
            ...$validated['father'],
        ]);

        // ── Simpan data Ibu ──
        Guardian::create([
            'student_id' => $student->id,
            'type'       => 'ibu',
            ...$validated['mother'],
        ]);

        // ── Simpan data Wali (jika orang lain) ──
        if ($validated['guardian_type'] === 'orang_lain' && !empty($validated['guardian'])) {
            Guardian::create([
                'student_id' => $student->id,
                'type'       => 'wali',
                ...$validated['guardian'],
            ]);
        }

        // ── Audit log ──
        AuditService::logCreate($student, $validated);

        return response()->json([
            'message' => 'Data siswa berhasil disimpan.',
            'data'    => $student->load(['parents', 'classRoom']),
        ], 201);
    }

    /**
     * PUT /api/students/{id}
     *
     * Update data siswa.
     */
    public function update(StoreStudentRequest $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $this->authorize('update', $student);

        $validated = $request->validated();
        $original = $student->toArray();

        // Update data siswa
        $student->update([
            'name'              => $validated['name'],
            'nisn'              => $validated['nisn'],
            'nik'               => $validated['nik'],
            'gender'            => $validated['gender'],
            'birth_place'       => $validated['birth_place'],
            'birth_date'        => $validated['birth_date'],
            'medical_history'   => $validated['medical_history'] ?? null,
            'sibling_order'     => $validated['sibling_order'],
            'total_siblings'    => $validated['total_siblings'],
            'status'            => $validated['status'] ?? ['Umum'],
            'tahun_masuk'       => $validated['tahun_masuk'],
            'tahun_angkatan'    => $validated['tahun_angkatan'] ?? $student->tahun_angkatan,
            'guardian_type'     => $validated['guardian_type'],
            'class_id'          => $validated['class_id'] ?? $student->class_id,
            'entry_class_level' => $validated['entry_class_level'] ?? null,
            'student_status'    => $validated['student_status'] ?? $student->student_status,
            'updated_by'        => $request->user()->id,
            // Alamat
            'address_street'      => $validated['address_street'] ?? $student->address_street,
            'address_rt'          => $validated['address_rt'] ?? $student->address_rt,
            'address_rw'          => $validated['address_rw'] ?? $student->address_rw,
            'address_village'     => $validated['address_village'] ?? $student->address_village,
            'address_district'    => $validated['address_district'] ?? $student->address_district,
            'address_city'        => $validated['address_city'] ?? $student->address_city,
            'address_province'    => $validated['address_province'] ?? $student->address_province,
            'address_postal_code' => $validated['address_postal_code'] ?? $student->address_postal_code,
        ]);

        // Update data orang tua
        $student->father()?->updateOrCreate(
            ['student_id' => $student->id, 'type' => 'ayah'],
            $validated['father']
        );

        $student->mother()?->updateOrCreate(
            ['student_id' => $student->id, 'type' => 'ibu'],
            $validated['mother']
        );

        // Update/create/delete wali
        if ($validated['guardian_type'] === 'orang_lain' && !empty($validated['guardian'])) {
            Guardian::updateOrCreate(
                ['student_id' => $student->id, 'type' => 'wali'],
                $validated['guardian']
            );
        } else {
            // Hapus wali jika bukan orang lain
            Guardian::where('student_id', $student->id)->where('type', 'wali')->delete();
        }

        // Audit log
        AuditService::logUpdate($student, $original, $validated);

        return response()->json([
            'message' => 'Data siswa berhasil diperbarui.',
            'data'    => $student->fresh(['parents', 'classRoom']),
        ]);
    }

    /**
     * DELETE /api/students/{id}
     *
     * Soft delete — data siswa diarsipkan, bukan dihapus permanen.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $this->authorize('delete', $student);

        $student->update(['updated_by' => $request->user()->id]);
        $student->delete();

        AuditService::logDelete($student);

        return response()->json([
            'message' => 'Data siswa berhasil diarsipkan.',
        ]);
    }

    /**
     * GET /api/students/{id}/adjacent
     *
     * Navigasi prev/next siswa — meniru "membalik halaman buku induk".
     */
    public function adjacent(Request $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);

        $prev = Student::where('name', '<', $student->name)
                        ->orderByDesc('name')
                        ->select('id', 'name', 'nisn')
                        ->first();

        $next = Student::where('name', '>', $student->name)
                        ->orderBy('name')
                        ->select('id', 'name', 'nisn')
                        ->first();

        return response()->json([
            'previous' => $prev,
            'next'     => $next,
        ]);
    }

    /**
     * GET /api/students/check-duplicate
     *
     * Pengecekan NISN/NIK duplikat real-time (debounced dari frontend).
     */
    public function checkDuplicate(Request $request): JsonResponse
    {
        $request->validate([
            'field' => 'required|in:nisn,nik',
            'value' => 'required|string',
            'exclude_id' => 'nullable|uuid',
        ]);

        $query = Student::query();

        if ($request->field === 'nisn') {
            $query->where('nisn', $request->value);
        }
        // NIK — cari di semua record (terenkripsi, perlu loop)
        // Untuk performa, gunakan NISN untuk cek duplikat via index
        // NIK dicek saat validasi form submit

        if ($request->filled('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        $exists = $query->exists();
        $existingStudent = $exists ? $query->select('id', 'name', 'nisn')->first() : null;

        return response()->json([
            'is_duplicate' => $exists,
            'existing'     => $existingStudent ? [
                'name' => $existingStudent->name,
                'nisn' => $existingStudent->nisn,
            ] : null,
        ]);
    }

    /* ----------------------------------------------------------------
     | Private Helpers
     | ---------------------------------------------------------------- */

    private function resolveGuardianInfo(Student $student): array
    {
        $guardianType = $student->guardian_type;

        if ($guardianType === 'ayah') {
            $father = $student->parents->firstWhere('type', 'ayah');
            return [
                'type'        => 'ayah',
                'label'       => 'Wali: Ayah Kandung',
                'name'        => $father?->name,
                'phone'       => $father?->phone_number,
                'occupation'  => $father?->occupation,
            ];
        }

        if ($guardianType === 'ibu') {
            $mother = $student->parents->firstWhere('type', 'ibu');
            return [
                'type'        => 'ibu',
                'label'       => 'Wali: Ibu Kandung',
                'name'        => $mother?->name,
                'phone'       => $mother?->phone_number,
                'occupation'  => $mother?->occupation,
            ];
        }

        // orang_lain
        $wali = $student->parents->firstWhere('type', 'wali');
        return [
            'type'        => 'orang_lain',
            'label'       => 'Wali: ' . ($wali?->relationship_description ?? 'Orang Lain'),
            'name'        => $wali?->name,
            'phone'       => $wali?->phone_number,
            'occupation'  => $wali?->occupation,
            'relationship' => $wali?->relationship_description,
        ];
    }
}
