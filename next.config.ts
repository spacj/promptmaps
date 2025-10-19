import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   async headers() {
    return [
      {
        source: '/api/webhook/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
