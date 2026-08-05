<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreStudentRequest — Validasi Multi-step Form
 *
 * Mencakup validasi untuk:
 * - Step 1: Identitas Diri
 * - Step 2: Data Keluarga & Wali Santri
 * - Step 3: Riwayat & Latar Belakang
 * - Step 4: Unggah Dokumen (validasi terpisah di DocumentController)
 */
class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->canViewSensitiveData() || $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        $studentId = $this->route('student'); // null saat create

        return [
            // ── Step 1: Identitas Diri ──
            'name'              => ['required', 'string', 'max:255'],
            'nisn'              => [
                'required', 'string', 'max:20',
                Rule::unique('students', 'nisn')->ignore($studentId),
            ],
            'nik'               => ['required', 'string', 'size:16'],
            'gender'            => ['required', Rule::in(['L', 'P'])],
            'birth_place'       => ['required', 'string', 'max:100'],
            'birth_date'        => ['required', 'date', 'before:today'],
            'tahun_masuk'       => [
                'required', 'integer', 'min:2000',
                'max:' . date('Y'), // Tidak boleh di masa depan
            ],
            'tahun_angkatan'    => [
                'nullable', 'integer', 'min:2000',
                'max:' . date('Y'), // Tidak boleh di masa depan
            ],
            'guardian_type'     => ['required', Rule::in(['ayah', 'ibu', 'orang_lain'])],
            'entry_class_level' => ['nullable', 'string', 'max:10'],
            'student_status'    => ['sometimes', Rule::in(['aktif', 'lulus', 'pindah', 'keluar', 'nonaktif'])],
            'status'            => ['sometimes', 'array'],
            'status.*'          => ['string', Rule::in(["Umum", "Yatim", "Dhu'afa", "Piatu"])],

            // ── Step 2: Data Keluarga ──
            'father'                        => ['required', 'array'],
            'father.name'                   => ['required', 'string', 'max:255'],
            'father.birth_place'            => ['nullable', 'string', 'max:100'],
            'father.religion'               => ['nullable', 'string', 'max:50'],
            'father.occupation'             => ['nullable', 'string', 'max:100'],
            'father.income_per_month'       => ['nullable', 'numeric', 'min:0'],
            'father.last_education'         => ['nullable', 'string', 'max:50'],
            'father.phone_number'           => ['nullable', 'string', 'max:20'],
            'father.address'                => ['nullable', 'string'],

            'mother'                        => ['required', 'array'],
            'mother.name'                   => ['required', 'string', 'max:255'],
            'mother.birth_place'            => ['nullable', 'string', 'max:100'],
            'mother.religion'               => ['nullable', 'string', 'max:50'],
            'mother.occupation'             => ['nullable', 'string', 'max:100'],
            'mother.income_per_month'       => ['nullable', 'numeric', 'min:0'],
            'mother.last_education'         => ['nullable', 'string', 'max:50'],
            'mother.phone_number'           => ['nullable', 'string', 'max:20'],
            'mother.address'                => ['nullable', 'string'],

            // Wali (hanya wajib jika guardian_type = 'orang_lain')
            'guardian'                               => ['required_if:guardian_type,orang_lain', 'nullable', 'array'],
            'guardian.name'                          => ['required_if:guardian_type,orang_lain', 'nullable', 'string', 'max:255'],
            'guardian.birth_place'                   => ['nullable', 'string', 'max:100'],
            'guardian.religion'                      => ['nullable', 'string', 'max:50'],
            'guardian.occupation'                    => ['nullable', 'string', 'max:100'],
            'guardian.income_per_month'              => ['nullable', 'numeric', 'min:0'],
            'guardian.last_education'                => ['nullable', 'string', 'max:50'],
            'guardian.phone_number'                  => ['nullable', 'string', 'max:20'],
            'guardian.address'                       => ['nullable', 'string'],
            'guardian.relationship_description'      => ['required_if:guardian_type,orang_lain', 'nullable', 'string', 'max:100'],

            // ── Step 3: Riwayat & Latar Belakang ──
            'medical_history' => ['nullable', 'string'],
            'sibling_order'   => ['required', 'integer', 'min:1'],
            'total_siblings'  => ['required', 'integer', 'min:1'],

            // ── Enrollment (opsional, bisa diisi saat pertama dibuat) ──
            'class_id'         => ['nullable', 'uuid', 'exists:classes,id'],

            // ── Alamat Tinggal (stepper) ──
            'address_street'      => ['nullable', 'string', 'max:500'],
            'address_rt'          => ['nullable', 'string', 'max:5'],
            'address_rw'          => ['nullable', 'string', 'max:5'],
            'address_village'     => ['nullable', 'string', 'max:100'],
            'address_district'    => ['nullable', 'string', 'max:100'],
            'address_city'        => ['nullable', 'string', 'max:100'],
            'address_province'    => ['nullable', 'string', 'max:100'],
            'address_postal_code' => ['nullable', 'string', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'nisn.unique'                 => 'NISN ini sudah terdaftar. Periksa kembali atau hubungi admin jika ini duplikasi data.',
            'nik.size'                    => 'NIK harus terdiri dari 16 digit.',
            'tahun_masuk.max'             => 'Tahun masuk tidak boleh di masa depan.',
            'tahun_angkatan.max'          => 'Tahun angkatan tidak boleh di masa depan.',
            'birth_date.before'           => 'Tanggal lahir harus sebelum hari ini.',
            'father.name.required'        => 'Nama Ayah wajib diisi.',
            'mother.name.required'        => 'Nama Ibu wajib diisi.',
            'guardian.name.required_if'   => 'Nama Wali wajib diisi jika penanggung jawab adalah orang lain.',
            'guardian.relationship_description.required_if' => 'Hubungan kekerabatan wali wajib diisi.',
        ];
    }
}
