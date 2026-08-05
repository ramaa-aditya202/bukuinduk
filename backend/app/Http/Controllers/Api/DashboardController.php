<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Document;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard
     *
     * Rekap statistik dashboard — dicache untuk performa.
     */
    public function index(): JsonResponse
    {
        $stats = Cache::remember('dashboard_stats', 300, function () {
            return [
                'total_siswa'        => Student::count(),
                'siswa_aktif'        => Student::where('student_status', 'aktif')->count(),
                'siswa_lulus'        => Student::where('student_status', 'lulus')->count(),
                'siswa_pindah'       => Student::where('student_status', 'pindah')->count(),
                'gender_breakdown'   => [
                    'laki_laki'  => Student::where('gender', 'L')->where('student_status', 'aktif')->count(),
                    'perempuan'  => Student::where('gender', 'P')->where('student_status', 'aktif')->count(),
                ],
                'tahun_ajaran_aktif' => AcademicYear::active()->first()?->label ?? '-',
                'per_angkatan'       => $this->getPerAngkatan(),
                'kelengkapan_dokumen' => $this->getDocumentCompleteness(),
            ];
        });

        return response()->json(['data' => $stats]);
    }

    /**
     * Rekap jumlah siswa per angkatan (tahun masuk)
     */
    private function getPerAngkatan(): array
    {
        return Student::where('student_status', 'aktif')
                      ->selectRaw('tahun_masuk, count(*) as total')
                      ->groupBy('tahun_masuk')
                      ->orderByDesc('tahun_masuk')
                      ->get()
                      ->map(fn ($row) => [
                          'tahun_masuk' => $row->tahun_masuk,
                          'label'       => 'Angkatan ' . $row->tahun_masuk,
                          'total'       => $row->total,
                      ])
                      ->toArray();
    }

    /**
     * Persentase kelengkapan dokumen wajib
     */
    private function getDocumentCompleteness(): array
    {
        $totalStudents = Student::where('student_status', 'aktif')->count();
        if ($totalStudents === 0) {
            return ['percentage' => 0, 'detail' => []];
        }

        $requiredDocs = ['pas_foto', 'ijazah', 'kk', 'akta_kelahiran'];
        $detail = [];

        foreach ($requiredDocs as $docType) {
            $count = Document::where('entity_type', Student::class)
                             ->where('doc_type', $docType)
                             ->distinct('entity_id')
                             ->count('entity_id');
            $detail[] = [
                'doc_type'   => $docType,
                'label'      => Document::DOC_TYPES[$docType] ?? $docType,
                'completed'  => $count,
                'total'      => $totalStudents,
                'percentage' => round(($count / $totalStudents) * 100, 1),
            ];
        }

        $avgPercentage = count($detail) > 0
            ? round(array_sum(array_column($detail, 'percentage')) / count($detail), 1)
            : 0;

        return [
            'percentage' => $avgPercentage,
            'detail'     => $detail,
        ];
    }
}
