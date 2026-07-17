import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep recent soft-nav RSC payloads briefly so back/forward & revisit feel instant.
    // Mutations still refresh via revalidatePath in server actions.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
