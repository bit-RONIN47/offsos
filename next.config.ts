import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LOCATIONIQ_API_KEY: process.env.LOCATIONIQ_API_KEY,
  },
  allowedDevOrigins: ['10.58.139.76'],
};

export default nextConfig;
