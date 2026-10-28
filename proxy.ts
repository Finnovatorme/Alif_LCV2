import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";

  // Build connect-src from the SAME backend URLs the app uses.
  const bsUrl = process.env.BS_API_KEY || "https://demo.finnovator.com.sa:8010";
  const loUrl = process.env.LO_API_KEY || "http://173.208.180.149:8084";
  const lmUrl = process.env.LM_API_KEY || "http://173.208.180.149:8065";
  const hostUrl = process.env.HOST_API_KEY || "https://demo.finnovator.com.sa:8015";
  const dmsUrl = process.env.DMS_API_KEY || "http://173.208.180.149:8088";
  const amlUrl = process.env.AML_API_KEY || "http://173.208.180.149:8090";

  const connectSources = Array.from(
    new Set([
      "'self'",
      bsUrl,
      loUrl,
      lmUrl,
      hostUrl,
      dmsUrl,
      amlUrl,
      "https://demo.finnovator.com.sa:8010",
      "https://demo.finnovator.com.sa:8011",
      "https://demo.finnovator.com.sa:8015",
      "http://173.208.180.149:8065",
      "http://173.208.180.149:8081",
      "http://173.208.180.149:8084",
      "http://173.208.180.149:8088",
      "http://173.208.180.149:8090",
      "http://173.208.180.149:8098",
      ...(isDev ? ["ws:", "wss:"] : []),
    ].filter(Boolean))
  ).join(" ");

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,

    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,

    // Allow the browser to call whichever backends this build was baked with
    `connect-src ${connectSources}`,

    // Next.js Dev mode and Hot Reloading needs 'unsafe-inline' and 'unsafe-eval'.
    // Production can use strict-dynamic with nonce if passed to <Script /> components.
    `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`}`,

    // Structural elements in React (Radix UI/Shadcn) strictly rely on inline styles (style="...").
    `style-src 'self' 'unsafe-inline'`,
    `style-src-elem 'self' 'unsafe-inline'`,
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
  nonce: string
) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);
  return response;
}

export default function middleware(req: NextRequest) {
  const authToken = req.cookies.get("auth_token")?.value;
  const path = req.nextUrl.pathname;
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCsp(nonce);

  if (!authToken && path.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";

    const response = NextResponse.redirect(url, 307);
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return applySecurityHeaders(response, csp, nonce);
  }

  if (authToken && (path.startsWith("/login") || path.startsWith("/signup"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";

    const response = NextResponse.redirect(url, 307);
    response.headers.set("Cache-Control", "no-store, max-age=0");

    return applySecurityHeaders(response, csp, nonce);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySecurityHeaders(res, csp, nonce);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        {
          type: "header",
          key: "next-router-prefetch",
        },
        {
          type: "header",
          key: "purpose",
          value: "prefetch",
        },
      ],
    },
  ],
};
