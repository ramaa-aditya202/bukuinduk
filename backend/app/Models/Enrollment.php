<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'student_id',
        'class_id',
        'academic_year_id',
        'status',
    ];

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function classRoom()
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /* ----------------------------------------------------------------
     | Helpers
     | ---------------------------------------------------------------- */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'naik_kelas'    => 'Naik Kelas',
            'tinggal_kelas' => 'Tinggal Kelas',
            'lulus'         => 'Lulus',
            'pindah'        => 'Pindah',
            default         => 'Berjalan',
        };
    }
}
