import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "kiddoloop.com",
        "www.kiddoloop.com",
        "homework-platform-ten.vercel.app",
      ],
    },
  },
};

export default nextConfig;
