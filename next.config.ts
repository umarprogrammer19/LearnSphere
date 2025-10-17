import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.samanthakilford.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'bookabook.pk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loft.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'standardebooks.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'myonlinebookshop.pk',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.fishry.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
