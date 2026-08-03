<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL') . '/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | MinIO S3-Compatible Object Storage
        |--------------------------------------------------------------------------
        |
        | Disk untuk menyimpan dokumen siswa (ijazah, KK, pas foto, dll).
        | Semua file bersifat private — akses hanya via signed URL.
        |
        */
        'minio' => [
            'driver' => 's3',
            'key' => env('MINIO_KEY'),
            'secret' => env('MINIO_SECRET'),
            'region' => env('MINIO_REGION', 'us-east-1'),
            'bucket' => env('MINIO_BUCKET', 'bukuinduk-documents'),
            'url' => env('MINIO_URL'),
            'endpoint' => env('MINIO_ENDPOINT', 'http://127.0.0.1:9000'),
            'use_path_style_endpoint' => true, // Wajib untuk MinIO
            'visibility' => 'private',
            'throw' => true,
        ],

        /*
        |--------------------------------------------------------------------------
        | Export Disk (Temporary)
        |--------------------------------------------------------------------------
        |
        | Disk lokal untuk file export Excel/PDF yang di-generate oleh queue.
        | File disimpan sementara lalu dikirim ke user, setelah itu dihapus.
        |
        */
        'exports' => [
            'driver' => 'local',
            'root' => storage_path('app/exports'),
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
