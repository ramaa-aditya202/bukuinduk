<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

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
     * Generate temporary signed URL (Laravel HMAC) untuk akses dokumen.
     * URL ini bisa dibuka langsung di browser (<img>, <iframe>, <a href>)
     * tanpa Bearer token — keamanannya dari signature Laravel, bukan session.
     * URL kedaluwarsa sesuai konfigurasi (default 15 menit).
     */
    public function getSignedUrlAttribute(): ?string
    {
        if (empty($this->file_path)) {
            return null;
        }

        $expiryMinutes = config('app.signed_url_expiry_minutes', 15);

        return URL::temporarySignedRoute(
            'documents.serve',
            now()->addMinutes($expiryMinutes),
            ['id' => $this->id]
        );
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
