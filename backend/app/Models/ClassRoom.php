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
     * Semua siswa di kelas ini
     */
    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
