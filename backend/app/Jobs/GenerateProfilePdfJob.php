<?php

namespace App\Jobs;

use App\Models\Student;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * GenerateProfilePdfJob — Cetak profil individu siswa sebagai PDF
 *
 * Layout mendekati format buku induk fisik agar familiar
 * bagi staf tata usaha.
 */
class GenerateProfilePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries = 3;

    public function __construct(
        public Student $student,
        public User $requestedBy,
        public string $filename,
    ) {}

    public function handle(): void
    {
        $student = $this->student->load([
            'parents',
            'enrollments.classRoom',
            'enrollments.academicYear',
            'documents',
        ]);

        // Resolve data wali
        $guardianInfo = $this->resolveGuardian($student);

        $pdf = Pdf::loadView('pdf.student-profile', [
            'student'      => $student,
            'father'       => $student->parents->firstWhere('type', 'ayah'),
            'mother'       => $student->parents->firstWhere('type', 'ibu'),
            'guardian'     => $guardianInfo,
            'enrollments'  => $student->enrollments,
            'documents'    => $student->documents,
        ]);

        $pdf->setPaper('A4', 'portrait');

        $path = 'exports/pdf/' . $this->filename;
        Storage::disk('local')->put($path, $pdf->output());
    }

    private function resolveGuardian(Student $student): array
    {
        if ($student->guardian_type === 'ayah') {
            $parent = $student->parents->firstWhere('type', 'ayah');
            return ['label' => 'Ayah Kandung', 'data' => $parent];
        }
        if ($student->guardian_type === 'ibu') {
            $parent = $student->parents->firstWhere('type', 'ibu');
            return ['label' => 'Ibu Kandung', 'data' => $parent];
        }
        $wali = $student->parents->firstWhere('type', 'wali');
        return ['label' => 'Wali: ' . ($wali?->relationship_description ?? 'Lainnya'), 'data' => $wali];
    }
}
