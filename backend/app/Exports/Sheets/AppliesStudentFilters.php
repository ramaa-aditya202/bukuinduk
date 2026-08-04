<?php

namespace App\Exports\Sheets;

use Illuminate\Database\Eloquent\Builder;

/**
 * Shared filter logic untuk semua Export Sheets.
 * Mendukung array pada semua parameter filter.
 */
trait AppliesStudentFilters
{
    /**
     * Terapkan filter dari $this->filters ke query Eloquent.
     * Semua filter mendukung nilai tunggal maupun array.
     */
    protected function applyFilters(Builder $query): Builder
    {
        $filters = $this->filters;

        // Filter tahun masuk (array → whereIn)
        $tahunMasuk = array_filter((array) ($filters['tahun_masuk'] ?? []));
        if (!empty($tahunMasuk)) {
            $query->whereIn('tahun_masuk', array_map('intval', $tahunMasuk));
        } elseif (!empty($filters['tahun_masuk_from'])) {
            $query->where('tahun_masuk', '>=', (int) $filters['tahun_masuk_from']);
        }
        if (!empty($filters['tahun_masuk_to'])) {
            $query->where('tahun_masuk', '<=', (int) $filters['tahun_masuk_to']);
        }

        // Filter student_status (array → whereIn)
        $statuses = array_filter((array) ($filters['student_status'] ?? []));
        if (!empty($statuses)) {
            $query->whereIn('student_status', $statuses);
        }

        // Filter status khusus JSONB (array → OR whereJsonContains)
        $specialStatuses = array_filter((array) ($filters['special_status'] ?? []));
        if (!empty($specialStatuses)) {
            $query->where(function ($q) use ($specialStatuses) {
                foreach ($specialStatuses as $s) {
                    $q->orWhereJsonContains('status', $s);
                }
            });
        }

        // Filter kelas (array → whereIn pada enrollment)
        $classIds = array_filter((array) ($filters['class_id'] ?? []));
        if (!empty($classIds)) {
            $query->whereHas('currentEnrollment', function ($q) use ($classIds) {
                $q->whereIn('class_id', $classIds);
            });
        }

        return $query;
    }
}
