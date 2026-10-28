import type { NextConfig } from "next";

//const bsApiUrl =
  //process.env.BS_API_KEY ||
 // "https://demo.finnovator.com.sa:8010";
//const loApiUrl =
//  process.env.LO_API_KEY ||
 // "http://173.208.180.149:8084";
//const lmApiUrl =
 // process.env.LM_API_KEY ||
 // "http://173.208.180.149:8065";
//const hostApiUrl =
//  process.env.HOST_API_KEY ||
 // "https://demo.finnovator.com.sa:8015";
//const dmsApiUrl =
 // process.env.DMS_API_KEY ||
 // "http://173.208.180.149:8088";
//const amlApiUrl =
 // process.env.AML_API_KEY ||
 // "http://173.208.180.149:8090";
const secretKey =
  process.env.SECRET_KEY ||
  "4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c4a5e3d8c2b7f1a9e6d8c3b2a7f1e9d6c";

const nextConfig: NextConfig = {
  output: "standalone",

  reactStrictMode: false,

  poweredByHeader: false,

  env: {
    BS_API_KEY: bsApiUrl,
    LO_API_KEY: loApiUrl,
    LM_API_KEY: lmApiUrl,
    HOST_API_KEY: hostApiUrl,
    DMS_API_KEY: dmsApiUrl,
    AML_API_KEY: amlApiUrl,

    SECRET_KEY: secretKey,
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
