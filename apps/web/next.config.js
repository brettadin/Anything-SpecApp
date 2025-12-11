/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb", // Allow up to 100MB uploads
    },
  },
  // Increase API route body size limit
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

module.exports = nextConfig;
