import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.OPENAI_SITES_BUILD === "1" ? { output: "export" as const, distDir: "dist" } : {}),
  reactCompiler: true,
};

export default nextConfig;
