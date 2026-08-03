<?php

namespace App\Jobs;

use App\Exports\StudentsExport;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Maatwebsite\Excel\Facades\Excel;

/**
 * ExportStudentsJob — Generate Excel multi-sheet di background
 *
 * Dijalankan via Laravel Database Queue, bukan sinkron,
 * supaya export ratusan/ribuan baris tidak timeout.
 */
class ExportStudentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 menit max
    public int $tries = 3;

    public function __construct(
        public User $user,
        public array $filters,
        public string $filename,
    ) {}

    public function handle(): void
    {
        $path = 'exports/' . $this->filename;

        Excel::store(
            new StudentsExport($this->filters),
            $path,
            'local'
        );

        // TODO: Kirim notifikasi in-app / email ke $this->user
        // bahwa file siap diunduh di /api/export/download/{filename}
    }
}
