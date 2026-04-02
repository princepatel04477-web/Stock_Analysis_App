/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In development, rewrite to local backend
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8001/api/:path*",
        },
      ];
    }
    
    // In production, if backend URL is set, rewrite to it
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
        },
      ];
    }
    
    return [];
  },
};

export default nextConfig;
