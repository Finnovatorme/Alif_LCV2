import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  reactStrictMode: false,

  poweredByHeader: false,

  env: {
    BS_API_KEY: "https://demo.finnovator.com.sa:8010",
    LO_API_KEY: "http://173.208.180.149:8084",
    LM_API_KEY: "http://173.208.180.149:8065",
    HOST_API_KEY: "https://demo.finnovator.com.sa:8015",
    DMS_API_KEY: "http://173.208.180.149:8088",
    AML_API_KEY: "http://173.208.180.149:8090",

    SECRET_KEY:
      "4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c",
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",

        headers: [
          {
            key: "Strict-Transport-Security",
            value:
              "max-age=31536000; includeSubDomains; preload",
          },

          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },

          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), fullscreen=(self)",
          },

          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },

          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },

          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;