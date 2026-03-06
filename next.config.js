/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://0.0.0.0:8000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
