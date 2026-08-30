/** @type {import('next').NextConfig} */
const nextConfig = {
  // Video files can be large — raise the body size limit for the upload API route.
  experimental: {
    serverActions: {
      bodySizeLimit: '2gb',
    },
  },
};

export default nextConfig;
