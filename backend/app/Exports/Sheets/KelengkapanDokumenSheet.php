<?php

namespace App\Exports\Sheets;

use App\Models\Document;
use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class KelengkapanDokumenSheet implements FromQuery, WithTitle, WithHeadings, WithMapping, ShouldAutoSize
{
    use AppliesStudentFilters;
    private array $requiredDocs = ['pas_foto', 'ijazah', 'kk', 'akta_kelahiran'];

    public function __construct(private array $filters = []) {}

    public function title(): string
    {
        return 'Kelengkapan Dokumen';
    }

    public function query()
    {
        $query = Student::with('documents');
        return $this->applyFilters($query)->orderBy('name');
    }

    public function headings(): array
    {
        $heads = ['Nama Siswa', 'NISN'];
        foreach ($this->requiredDocs as $type) {
            $heads[] = Document::DOC_TYPES[$type] ?? $type;
        }
        $heads[] = 'Kelengkapan';
        return $heads;
    }

    public function map($student): array
    {
        $uploadedTypes = $student->documents->pluck('doc_type')->unique()->toArray();

        $row = [$student->name, $student->nisn];
        $completed = 0;

        foreach ($this->requiredDocs as $type) {
            $has = in_array($type, $uploadedTypes);
            $row[] = $has ? '✓' : '✗';
            if ($has) $completed++;
        }

        $row[] = $completed . '/' . count($this->requiredDocs);

        return $row;
    }
}
