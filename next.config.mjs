/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Rewrites only work in development - in production, 
    // configure your backend URL via environment variables
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8001/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
