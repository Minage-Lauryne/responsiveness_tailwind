/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

import analyzer from "@next/bundle-analyzer";
import { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

import { env } from "@/create-env";

const withBundleAnalyzer = analyzer({
  enabled: process.env.ANALYZE === "true",
});

const baseConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.lu.ma",
      },
      {
        protocol: "https",
        hostname: "*.lumacdn.com",
      },
      {
        protocol: "https",
        hostname: "*.complere.ai",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    // if (isServer) {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   config.ignoreWarnings = [{ module: /opentelemetry/ }];
    // }
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    // config.resolve.alias.canvas = false;
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // return config;
  },
  // webpack: (config) => {
  //   config.resolve.alias.canvas = false;
  //   return config;
  // },
  // webpack: (
  //   config,
  //   { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  // ) => {
  //   // Important: return the modified config
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //   config.resolve.alias.canvas = false;
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  //   return config;
  // },

  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

let prodConfig = withBundleAnalyzer(baseConfig);
if (process.env.NODE_ENV === "development" || process.env.DISABLE_POSTHOG === "true") {
  prodConfig = withPostHogConfig(
    prodConfig,
    {
      personalApiKey: env.POSTHOG_API_KEY!,
      envId: env.POSTHOG_ENV_ID!,
      sourcemaps: { enabled: true },
    });
}

/** @type {import("next").NextConfig} */
const devConfig = {
  ...baseConfig,
  productionBrowserSourceMaps: false,
  // optimizeFonts: false,
  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false,
    },
    incomingRequests: {
      ignore: [/^\/api\/trpc\//],
    },
  },
};

export default process.env.NODE_ENV === "development" ? devConfig : prodConfig;
