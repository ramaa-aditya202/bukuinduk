<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * AuditService — Helper untuk mencatat aktivitas ke activity_logs
 *
 * Wajib untuk compliance UU PDP — setiap akses, perubahan,
 * dan export data sensitif harus tercatat.
 */
class AuditService
{
    /**
     * Log pembuatan data baru
     */
    public static function logCreate($entity, ?array $data = null): ActivityLog
    {
        return self::log($entity, 'create', ['after' => $data]);
    }

    /**
     * Log perubahan data dengan diff before/after
     */
    public static function logUpdate($entity, array $original, array $changes): ActivityLog
    {
        $diff = [];
        foreach ($changes as $key => $newValue) {
            if (isset($original[$key]) && $original[$key] !== $newValue) {
                $diff[$key] = [
                    'before' => $original[$key],
                    'after'  => $newValue,
                ];
            }
        }

        return self::log($entity, 'update', $diff);
    }

    /**
     * Log penghapusan data (soft delete)
     */
    public static function logDelete($entity): ActivityLog
    {
        return self::log($entity, 'delete');
    }

    /**
     * Log export data
     */
    public static function logExport(string $entityType, ?array $filters = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id'     => Auth::id(),
            'entity_type' => $entityType,
            'entity_id'   => '00000000-0000-0000-0000-000000000000', // Placeholder untuk bulk
            'action'      => 'export',
            'changes'     => $filters,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }

    /**
     * Log akses data sensitif (NIK, dokumen KK, dll.)
     */
    public static function logSensitiveAccess($entity, ?string $fieldAccessed = null): ActivityLog
    {
        return self::log($entity, 'view_sensitive', [
            'field' => $fieldAccessed,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Internal: buat record activity log
     */
    private static function log($entity, string $action, ?array $changes = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id'     => Auth::id(),
            'entity_type' => get_class($entity),
            'entity_id'   => $entity->id ?? $entity->getKey(),
            'action'      => $action,
            'changes'     => $changes,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }
}
