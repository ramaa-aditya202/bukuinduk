<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'sso_provider',
        'sso_id',
        'role',
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /* ----------------------------------------------------------------
     | Role Helpers
     | ---------------------------------------------------------------- */

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isAdminTu(): bool
    {
        return $this->role === 'admin_tu';
    }

    public function isGuru(): bool
    {
        return $this->role === 'guru';
    }

    public function isWaliKelas(): bool
    {
        return $this->role === 'wali_kelas';
    }

    /**
     * Apakah user memiliki akses penuh ke data sensitif (NIK, kesehatan)?
     */
    public function canViewSensitiveData(): bool
    {
        return in_array($this->role, ['super_admin', 'admin_tu']);
    }

    /**
     * Apakah user boleh melakukan export data?
     */
    public function canExport(): bool
    {
        return in_array($this->role, ['super_admin', 'admin_tu']);
    }

    /* ----------------------------------------------------------------
     | Relationships
     | ---------------------------------------------------------------- */

    /**
     * Kelas yang diwalikan (jika role = wali_kelas)
     */
    public function homeroomClasses()
    {
        return $this->hasMany(ClassRoom::class, 'homeroom_teacher_id');
    }

    /**
     * Aktivitas log yang dilakukan user ini
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Apakah user login via SSO?
     */
    public function isSsoUser(): bool
    {
        return !is_null($this->sso_provider);
    }
}
