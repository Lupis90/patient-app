/** @type {import('next').NextConfig} */
const nextConfig = {
  // Altre configurazioni qui...

  // Add this configuration to allow serving static files from the public folder
  images: {
    domains: ['localhost'],
  },
}

export default nextConfig;