/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Proxy API calls ke backend Laravel */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ];
  },

  /* Image domains untuk foto siswa via MinIO signed URL */
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.sekolah.sch.id',
        pathname: '/**',
      },
    ],
  },

  /* Strict mode untuk development */
  reactStrictMode: true,
};

module.exports = nextConfig;
