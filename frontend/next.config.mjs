const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (!backendUrl) return [];

    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
