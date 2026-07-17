import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["page-agent", "@page-agent/core", "@page-agent/llms", "@page-agent/page-controller", "@page-agent/ui"],
  experimental: {
    // Keep recent soft-nav RSC payloads briefly so back/forward & revisit feel instant.
    // Mutations still refresh via revalidatePath in server actions.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
