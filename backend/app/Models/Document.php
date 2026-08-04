<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'entity_id',
        'entity_type',
        'doc_type',
        'original_filename',
        'file_path',
        'mime_type',
        'file_size',
        'uploaded_by',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    /**
     * Daftar tipe dokumen yang dikenali sistem
     */
    public const DOC_TYPES = [
        'pas_foto'       => 'Pas Foto',
        'ijazah'         => 'Ijazah',
        'kk'             => 'Kartu Keluarga',
        'akta_kelahiran' => 'Akta Kelahiran',
        'sktm'           => 'Surat Keterangan Tidak Mampu',
        'sk_kematian'    => 'Surat Kematian',
        'rapor'          => 'Rapor',
        'surat_pindah'   => 'Surat Pindah',
        'lainnya'        => 'Dokumen Lainnya',
    ];

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    /**
     * Polymorphic: entity bisa Student atau Teacher (future)
     */
    public function entity()
    {
        return $this->morphTo();
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /* ----------------------------------------------------------------
     | URL Helpers
     | ---------------------------------------------------------------- */

    /**
     * Generate URL proxy backend untuk akses dokumen.
     * URL mengarah ke endpoint /api/documents/{id}/serve di backend,
     * sehingga MinIO tidak perlu diekspos ke internet.
     *
     * @deprecated Gunakan proxy_url. Dipertahankan untuk kompatibilitas response JSON.
     */
    public function getSignedUrlAttribute(): ?string
    {
        return $this->getProxyUrlAttribute();
    }

    /**
     * URL proxy backend untuk akses dokumen.
     * Backend men-stream file dari MinIO ke client secara transparan.
     */
    public function getProxyUrlAttribute(): ?string
    {
        if (empty($this->file_path)) {
            return null;
        }

        return url("/api/documents/{$this->id}/serve");
    }

    /* ----------------------------------------------------------------
     | Helpers
     | ---------------------------------------------------------------- */

    public function getDocTypeLabelAttribute(): string
    {
        return self::DOC_TYPES[$this->doc_type] ?? $this->doc_type;
    }

    /**
     * Apakah dokumen ini adalah tipe sensitif yang memerlukan audit log saat diakses?
     */
    public function isSensitive(): bool
    {
        return in_array($this->doc_type, ['kk', 'ijazah', 'sktm', 'sk_kematian', 'akta_kelahiran']);
    }
}
