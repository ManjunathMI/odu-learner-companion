import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { '/**': ['./content/**/*.md', './docs/**/*.md'] },
};

export default nextConfig;
