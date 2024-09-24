/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Add any other domains you need
  },
  output: 'standalone',
  }

export default nextConfig;