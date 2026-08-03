<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasUuids;

    const UPDATED_AT = null; // Hanya created_at, tidak ada updated_at

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
        'action',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array', // JSONB → PHP array
            'created_at' => 'datetime',
        ];
    }

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic: entity yang diubah
     */
    public function entity()
    {
        return $this->morphTo();
    }

    /* ----------------------------------------------------------------
     | Scopes
     | ---------------------------------------------------------------- */

    public function scopeForEntity($query, string $type, string $id)
    {
        return $query->where('entity_type', $type)->where('entity_id', $id);
    }

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Hanya akses data sensitif
     */
    public function scopeSensitiveAccess($query)
    {
        return $query->where('action', 'view_sensitive');
    }

    /* ----------------------------------------------------------------
     | Helpers
     | ---------------------------------------------------------------- */

    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            'create'         => 'Membuat Data',
            'update'         => 'Mengubah Data',
            'delete'         => 'Menghapus Data',
            'export'         => 'Mengekspor Data',
            'view_sensitive' => 'Mengakses Data Sensitif',
            default          => $this->action,
        };
    }
}
