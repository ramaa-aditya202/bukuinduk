<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

/**
 * StudentPolicy — Otorisasi akses data siswa
 *
 * - super_admin & admin_tu: akses semua siswa
 * - wali_kelas: hanya siswa di kelas yang diwalikan
 * - guru: akses terbatas (baca saja, tanpa data sensitif)
 */
class StudentPolicy
{
    /**
     * Apakah user boleh melihat daftar siswa?
     */
    public function viewAny(User $user): bool
    {
        return true; // Semua role bisa lihat daftar (dengan filter sesuai role)
    }

    /**
     * Apakah user boleh melihat detail satu siswa?
     */
    public function view(User $user, Student $student): bool
    {
        // Super admin & admin TU bisa lihat semua
        if (in_array($user->role, ['super_admin', 'admin_tu'])) {
            return true;
        }

        // Wali kelas hanya bisa lihat siswa di kelasnya
        if ($user->role === 'wali_kelas') {
            return $this->isStudentInUserClass($user, $student);
        }

        // Guru bisa lihat semua (tapi data sensitif disamarkan di controller)
        return true;
    }

    /**
     * Apakah user boleh membuat data siswa baru?
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_tu']);
    }

    /**
     * Apakah user boleh mengupdate data siswa?
     */
    public function update(User $user, Student $student): bool
    {
        return in_array($user->role, ['super_admin', 'admin_tu']);
    }

    /**
     * Apakah user boleh menghapus (soft delete) data siswa?
     */
    public function delete(User $user, Student $student): bool
    {
        return $user->role === 'super_admin';
    }

    /**
     * Apakah user boleh mengekspor data?
     */
    public function export(User $user): bool
    {
        return $user->canExport();
    }

    /**
     * Cek apakah siswa berada di kelas yang diwalikan user.
     */
    private function isStudentInUserClass(User $user, Student $student): bool
    {
        $homeroomClassIds = $user->homeroomClasses()->pluck('id');

        return in_array($student->class_id, $homeroomClassIds->toArray());
    }
}
