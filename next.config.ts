import type { NextConfig } from "next";

// Read backend URLs from build-time env vars (injected via Docker build-args).
// Fallbacks keep the Finno/demo server working exactly as before.
const bsUrl =
  process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
const loUrl =
  process.env.LO_API_KEY || "https://demo.finnovator.com.sa:8011";
const dmsUrl =
  process.env.DMS_API_KEY || bsUrl; // DMS falls back to BS, same as before

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,

  env: {
    BS_API_KEY: bsUrl,
    LO_API_KEY: loUrl,
    DMS_API_KEY: dmsUrl,
    // SECRET_KEY comes from the SECRET_KEY build-arg (GitHub secret).
    // Fallback is kept ONLY so local dev keeps working; remove it after
    // the secret is in place.
    SECRET_KEY:
      process.env.SECRET_KEY ||
      "4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c",
  },

  async redirects() {
    return [{ source: "/", destination: "/login", permanent: true }];
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), fullscreen=(self)",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
