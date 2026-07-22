/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['bullmq', 'ioredis'],
};
export default nextConfig;
