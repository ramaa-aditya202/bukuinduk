<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Profil Siswa — {{ $student->name }}</title>
    <style>
        /* ── Reset & Base ── */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 11pt;
            color: #1E242B;
            line-height: 1.5;
            padding: 20mm 15mm;
        }

        /* ── Header ── */
        .header {
            text-align: center;
            border-bottom: 3px double #1B4D3E;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .header h1 {
            font-size: 16pt;
            color: #1B4D3E;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .header h2 {
            font-size: 12pt;
            font-weight: normal;
            color: #555;
            margin-top: 4px;
        }

        /* ── Section ── */
        .section {
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        .section-title {
            background-color: #1B4D3E;
            color: white;
            padding: 4px 10px;
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 8px;
        }

        /* ── Table Data ── */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .data-table td {
            padding: 3px 8px;
            border: 1px solid #ccc;
            vertical-align: top;
        }
        .data-table td.label {
            width: 35%;
            background-color: #f5f3f0;
            font-weight: bold;
        }

        /* ── Badge ── */
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9pt;
            font-weight: bold;
        }
        .badge-aktif { background: #d1fae5; color: #065f46; }
        .badge-lulus { background: #dbeafe; color: #1e40af; }
        .badge-pindah { background: #fef3c7; color: #92400e; }
        .badge-keluar { background: #fecaca; color: #991b1b; }

        /* ── Timeline ── */
        .timeline-table {
            width: 100%;
            border-collapse: collapse;
        }
        .timeline-table th, .timeline-table td {
            padding: 4px 8px;
            border: 1px solid #ccc;
            text-align: left;
        }
        .timeline-table th {
            background-color: #f5f3f0;
        }

        /* ── Footer ── */
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 10pt;
        }

        /* ── Photo ── */
        .photo-box {
            float: right;
            width: 3cm;
            height: 4cm;
            border: 1px solid #999;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 12px;
            margin-bottom: 12px;
            background: #f9f9f9;
            text-align: center;
            font-size: 8pt;
            color: #999;
            overflow: hidden;
        }
        .photo-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* ── Checklist ── */
        .checklist { list-style: none; }
        .checklist li { padding: 2px 0; }
        .checklist li::before { content: '☐ '; }
        .checklist li.complete::before { content: '☑ '; color: #1B4D3E; }

        /* ── Page Break ── */
        .page-break {
            page-break-before: always;
        }

        /* ── Document Image Page ── */
        .doc-image-container {
            text-align: center;
            padding: 10mm 0;
        }
        .doc-image-container img {
            max-width: 100%;
            max-height: 85%;
            border: 1px solid #ddd;
        }
        .doc-image-label {
            font-size: 12pt;
            font-weight: bold;
            color: #1B4D3E;
            margin-bottom: 10px;
            text-align: center;
            border-bottom: 2px solid #1B4D3E;
            padding-bottom: 6px;
        }

        @page {
            margin: 10mm;
        }
    </style>
</head>
<body>

    {{-- ═══════════════════════════════════════════════════
         PAGE 1: Data Tulisan + Foto 3x4
         ═══════════════════════════════════════════════════ --}}

    <!-- Header -->
    <div class="header">
        <h1>Buku Induk Siswa</h1>
        <h2>Profil Data Peserta Didik</h2>
    </div>

    <div class="photo-box">
        @if(!empty($photoBase64))
            <img src="{{ $photoBase64 }}" alt="Foto {{ $student->name }}">
        @else
            Pas Foto<br>3×4
        @endif
    </div>

    <!-- Section: Identitas Diri -->
    <div class="section">
        <div class="section-title">A. Identitas Diri</div>
        <table class="data-table">
            <tr>
                <td class="label">Nama Lengkap</td>
                <td>{{ $student->name }}</td>
            </tr>
            <tr>
                <td class="label">NISN</td>
                <td>{{ $student->nisn }}</td>
            </tr>
            <tr>
                <td class="label">NIK</td>
                <td>{{ $student->masked_nik }}</td>
            </tr>
            <tr>
                <td class="label">Jenis Kelamin</td>
                <td>{{ $student->gender === 'L' ? 'Laki-laki' : 'Perempuan' }}</td>
            </tr>
            <tr>
                <td class="label">Tempat, Tanggal Lahir</td>
                <td>{{ $student->birth_place }}, {{ $student->birth_date?->format('d F Y') }}</td>
            </tr>
            <tr>
                <td class="label">Anak Ke- / Dari Bersaudara</td>
                <td>{{ $student->sibling_order }} dari {{ $student->total_siblings }} bersaudara</td>
            </tr>
            <tr>
                <td class="label">Status</td>
                <td>{{ implode(', ', $student->status ?? []) }}</td>
            </tr>
            <tr>
                <td class="label">Tahun Masuk</td>
                <td>{{ $student->tahun_masuk }}</td>
            </tr>
            <tr>
                <td class="label">Status Siswa</td>
                <td><span class="badge badge-{{ $student->student_status }}">{{ ucfirst($student->student_status) }}</span></td>
            </tr>
            <tr>
                <td class="label">Riwayat Penyakit</td>
                <td>{{ $student->medical_history ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <!-- Section: Alamat Tinggal -->
    <div class="section">
        <div class="section-title">A2. Alamat Tinggal</div>
        <table class="data-table">
            <tr>
                <td class="label">Jalan / Perumahan</td>
                <td>{{ $student->address_street ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">RT / RW</td>
                <td>{{ $student->address_rt ?? '-' }} / {{ $student->address_rw ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Kelurahan / Desa</td>
                <td>{{ $student->address_village ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Kecamatan</td>
                <td>{{ $student->address_district ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Kabupaten / Kota</td>
                <td>{{ $student->address_city ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Provinsi</td>
                <td>{{ $student->address_province ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Kode Pos</td>
                <td>{{ $student->address_postal_code ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <!-- Section: Data Orang Tua -->
    <div class="section">
        <div class="section-title">B. Data Orang Tua</div>

        <p style="font-weight: bold; margin-bottom: 4px;">Ayah Kandung</p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>{{ $father?->name ?? '-' }}</td></tr>
            <tr><td class="label">Tempat Lahir</td><td>{{ $father?->birth_place ?? '-' }}</td></tr>
            <tr><td class="label">Agama</td><td>{{ $father?->religion ?? '-' }}</td></tr>
            <tr><td class="label">Pekerjaan</td><td>{{ $father?->occupation ?? '-' }}</td></tr>
            <tr><td class="label">Penghasilan/Bulan</td><td>{{ $father?->income_per_month ? 'Rp ' . number_format($father->income_per_month, 0, ',', '.') : '-' }}</td></tr>
            <tr><td class="label">Pendidikan Terakhir</td><td>{{ $father?->last_education ?? '-' }}</td></tr>
            <tr><td class="label">No. Telepon</td><td>{{ $father?->phone_number ?? '-' }}</td></tr>
            <tr><td class="label">Alamat</td><td>{{ $father?->address ?? '-' }}</td></tr>
        </table>

        <p style="font-weight: bold; margin: 8px 0 4px;">Ibu Kandung</p>
        <table class="data-table">
            <tr><td class="label">Nama</td><td>{{ $mother?->name ?? '-' }}</td></tr>
            <tr><td class="label">Tempat Lahir</td><td>{{ $mother?->birth_place ?? '-' }}</td></tr>
            <tr><td class="label">Agama</td><td>{{ $mother?->religion ?? '-' }}</td></tr>
            <tr><td class="label">Pekerjaan</td><td>{{ $mother?->occupation ?? '-' }}</td></tr>
            <tr><td class="label">Penghasilan/Bulan</td><td>{{ $mother?->income_per_month ? 'Rp ' . number_format($mother->income_per_month, 0, ',', '.') : '-' }}</td></tr>
            <tr><td class="label">Pendidikan Terakhir</td><td>{{ $mother?->last_education ?? '-' }}</td></tr>
            <tr><td class="label">No. Telepon</td><td>{{ $mother?->phone_number ?? '-' }}</td></tr>
            <tr><td class="label">Alamat</td><td>{{ $mother?->address ?? '-' }}</td></tr>
        </table>
    </div>

    <!-- Section: Wali Santri -->
    <div class="section">
        <div class="section-title">C. Wali Santri / Penanggung Jawab</div>
        <table class="data-table">
            <tr><td class="label">Hubungan</td><td>{{ $guardian['label'] }}</td></tr>
            @if($guardian['data'])
            <tr><td class="label">Nama</td><td>{{ $guardian['data']->name }}</td></tr>
            <tr><td class="label">Pekerjaan</td><td>{{ $guardian['data']->occupation ?? '-' }}</td></tr>
            <tr><td class="label">No. Telepon</td><td>{{ $guardian['data']->phone_number ?? '-' }}</td></tr>
            <tr><td class="label">Alamat</td><td>{{ $guardian['data']->address ?? '-' }}</td></tr>
            @endif
        </table>
    </div>

    <!-- Section: Kelas Saat Ini -->
    <div class="section">
        <div class="section-title">D. Kelas Saat Ini</div>
        <table class="data-table">
            <tr>
                <td class="label">Kelas</td>
                <td>{{ $currentClass?->name ?? 'Belum ada kelas' }}</td>
            </tr>
            @if($currentClass)
            <tr>
                <td class="label">Tingkat</td>
                <td>{{ $currentClass->level }}</td>
            </tr>
            @endif
        </table>
    </div>

    <!-- Section: Kelengkapan Dokumen -->
    <div class="section">
        <div class="section-title">E. Kelengkapan Dokumen</div>
        @php
            $requiredDocs = ['pas_foto' => 'Pas Foto', 'ijazah' => 'Ijazah', 'kk' => 'Kartu Keluarga', 'akta_kelahiran' => 'Akta Kelahiran'];
            $uploadedTypes = $documents->pluck('doc_type')->unique()->toArray();
        @endphp
        <ul class="checklist">
            @foreach($requiredDocs as $type => $label)
            <li class="{{ in_array($type, $uploadedTypes) ? 'complete' : '' }}">{{ $label }}</li>
            @endforeach
        </ul>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dicetak pada: {{ now()->format('d F Y, H:i') }} WIB</p>
        <br><br><br>
        <p>_________________________________</p>
        <p>Kepala Sekolah / Tata Usaha</p>
    </div>

    {{-- ═══════════════════════════════════════════════════
         PAGE 2+: Dokumen Gambar (masing-masing satu halaman)
         ═══════════════════════════════════════════════════ --}}
    @if(isset($imageDocuments) && $imageDocuments->count() > 0)
        @foreach($imageDocuments as $imgDoc)
        <div class="page-break"></div>
        <div class="doc-image-container">
            <div class="doc-image-label">
                {{ $imgDoc->doc_type_label }} — {{ $student->name }}
            </div>
            <img src="{{ $imgDoc->image_base64 }}" alt="{{ $imgDoc->doc_type_label }}">
            <p style="margin-top: 8px; font-size: 9pt; color: #999;">
                File asli: {{ $imgDoc->original_filename }}
            </p>
        </div>
        @endforeach
    @endif

</body>
</html>
