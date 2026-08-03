<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Model Guardian — Data Orang Tua & Wali Santri
 *
 * Menggunakan nama "Guardian" alih-alih "Parent" karena
 * "Parent" adalah reserved word di PHP.
 * Tabel database tetap bernama "parents".
 */
class Guardian extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'parents';

    protected $fillable = [
        'student_id',
        'type',
        'name',
        'birth_place',
        'religion',
        'occupation',
        'income_per_month',
        'last_education',
        'phone_number',
        'address',
        'relationship_description',
    ];

    protected function casts(): array
    {
        return [
            'income_per_month' => 'decimal:2',
        ];
    }

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /* ----------------------------------------------------------------
     | Scopes
     | ---------------------------------------------------------------- */

    public function scopeAyah($query)
    {
        return $query->where('type', 'ayah');
    }

    public function scopeIbu($query)
    {
        return $query->where('type', 'ibu');
    }

    public function scopeWali($query)
    {
        return $query->where('type', 'wali');
    }

    /* ----------------------------------------------------------------
     | Helpers
     | ---------------------------------------------------------------- */

    /**
     * Label type untuk ditampilkan di UI
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'ayah' => 'Ayah Kandung',
            'ibu'  => 'Ibu Kandung',
            'wali' => 'Wali (' . ($this->relationship_description ?? 'Lainnya') . ')',
            default => $this->type,
        };
    }
}
