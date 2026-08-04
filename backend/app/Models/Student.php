<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Crypt;

class Student extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'nisn',
        'nik',
        'gender',
        'birth_place',
        'birth_date',
        'medical_history',
        'sibling_order',
        'total_siblings',
        'status',
        'tahun_masuk',
        'tahun_angkatan',
        'guardian_type',
        'entry_class_level',
        'student_status',
        'photo_document_id',
        'created_by',
        'updated_by',
        // Alamat terstruktur
        'address_street',
        'address_rt',
        'address_rw',
        'address_village',
        'address_district',
        'address_city',
        'address_province',
        'address_postal_code',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'status' => 'array', // JSONB → PHP array
            'tahun_masuk' => 'integer',
            'tahun_angkatan' => 'integer',
            'sibling_order' => 'integer',
            'total_siblings' => 'integer',
        ];
    }

    /* ----------------------------------------------------------------
     | Field-Level Encryption (NIK) — UU PDP Compliance
     | ----------------------------------------------------------------
     |
     | NIK dienkripsi sebelum disimpan dan didekripsi saat diakses.
     | Jika kebocoran database terjadi, NIK tidak dalam plain text.
     |
     */

    public function setNikAttribute($value): void
    {
        $this->attributes['nik'] = Crypt::encryptString($value);
    }

    public function getNikAttribute($value): ?string
    {
        if (is_null($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value; // Fallback jika dekripsi gagal
        }
    }

    /**
     * Mendapatkan NIK yang sudah dimasking untuk role non-admin.
     * Contoh: "3201****0001" — hanya 4 digit pertama dan 4 digit terakhir terlihat.
     */
    public function getMaskedNikAttribute(): ?string
    {
        $nik = $this->nik;
        if (is_null($nik) || strlen($nik) < 8) {
            return $nik;
        }

        return substr($nik, 0, 4) . str_repeat('*', strlen($nik) - 8) . substr($nik, -4);
    }

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    public function parents()
    {
        return $this->hasMany(Guardian::class, 'student_id');
    }

    public function father()
    {
        return $this->hasOne(Guardian::class, 'student_id')->where('type', 'ayah');
    }

    public function mother()
    {
        return $this->hasOne(Guardian::class, 'student_id')->where('type', 'ibu');
    }

    /**
     * Mendapatkan data wali santri berdasarkan guardian_type.
     * Logika: ayah/ibu → langsung dari record parent, orang_lain → record terpisah.
     */
    public function guardian()
    {
        if ($this->guardian_type === 'orang_lain') {
            return $this->hasOne(Guardian::class, 'student_id')->where('type', 'wali');
        }

        return $this->hasOne(Guardian::class, 'student_id')
                     ->where('type', $this->guardian_type);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class)->orderByDesc('created_at');
    }

    /**
     * Enrollment tahun ajaran aktif (kelas saat ini)
     */
    public function currentEnrollment()
    {
        return $this->hasOne(Enrollment::class)
                    ->whereHas('academicYear', fn ($q) => $q->where('is_active', true));
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'entity');
    }

    public function photo()
    {
        return $this->belongsTo(Document::class, 'photo_document_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /* ----------------------------------------------------------------
     | Scopes
     | ---------------------------------------------------------------- */

    public function scopeActive($query)
    {
        return $query->where('student_status', 'aktif');
    }

    public function scopeByTahunMasuk($query, int $year)
    {
        return $query->where('tahun_masuk', $year);
    }

    public function scopeSearch($query, ?string $search)
    {
        if (empty($search)) {
            return $query;
        }

        return $query->where(function ($q) use ($search) {
            $q->where('name', 'ilike', "%{$search}%")
              ->orWhere('nisn', 'ilike', "%{$search}%");
        });
    }
}
