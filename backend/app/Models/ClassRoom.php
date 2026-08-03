<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model ClassRoom — Rombongan Belajar / Kelas
 *
 * Menggunakan nama "ClassRoom" alih-alih "Class" karena
 * "Class" adalah reserved word di PHP.
 * Tabel database tetap bernama "classes".
 */
class ClassRoom extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'classes';

    protected $fillable = [
        'name',
        'level',
        'homeroom_teacher_id',
    ];

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    /**
     * Wali kelas
     */
    public function homeroomTeacher()
    {
        return $this->belongsTo(User::class, 'homeroom_teacher_id');
    }

    /**
     * Semua enrollment di kelas ini
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'class_id');
    }

    /**
     * Siswa di kelas ini untuk tahun ajaran tertentu
     */
    public function studentsForYear($academicYearId)
    {
        return $this->enrollments()
                    ->where('academic_year_id', $academicYearId)
                    ->with('student');
    }

    /**
     * Siswa di kelas ini untuk tahun ajaran aktif
     */
    public function currentStudents()
    {
        $activeYear = AcademicYear::active()->first();
        if (!$activeYear) {
            return collect();
        }

        return $this->studentsForYear($activeYear->id);
    }
}
