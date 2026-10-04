import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : null;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  // The memorial booklet and the share image read these fonts from disk at run time.
  outputFileTracingIncludes: {
    "/memorial.pdf": ["./src/assets/fonts/**"],
    "/opengraph-image*": ["./src/assets/fonts/**"],
  },
  experimental: {
    // Uploads travel through Server Actions. Vercel caps a request at 4.5 MB, so
    // photographs are shrunk in the browser before they are sent.
    serverActions: { bodySizeLimit: "4.5mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default config;
