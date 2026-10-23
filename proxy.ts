import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== "production";

  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,

    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,

    // Existing second-file API endpoints — unchanged
    `connect-src 'self'
      https://demo.finnovator.com.sa:8010
      https://demo.finnovator.com.sa:8015
      http://173.208.180.149:8098
      http://173.208.180.149:8081
      http://173.208.180.149:8084`,

    // No unsafe-inline scripts in production.
    // Exact approved inline-script hash from first file.
    isDev
      ? `script-src 'self'
          'nonce-${nonce}'
          'strict-dynamic'
          'unsafe-eval'
          'sha256-rbbnijHn7DZ6ps39myQ3cVQF1H+U/PJfHh5ei/Q2kb8='`
      : `script-src 'self'
          'nonce-${nonce}'
          'strict-dynamic'
          'sha256-rbbnijHn7DZ6ps39myQ3cVQF1H+U/PJfHh5ei/Q2kb8='`,

    // No unsafe-inline in style-src itself.
    isDev
      ? `style-src 'self' 'unsafe-inline'`
      : `style-src 'self' 'nonce-${nonce}'`,

    // Runtime-generated <style> elements.
    isDev
      ? `style-src-elem 'self' 'unsafe-inline'`
      : `style-src-elem 'self'
          'nonce-${nonce}'
          'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='
          'sha256-CIxDM5jnsGiKqXs2v7NKCY5MzdR9gu6TtiMJrDw29AY='`,

    // React / Radix / Shadcn / Framer components
    // may generate style="" attributes.
    ...(isDev
      ? []
      : [`style-src-attr 'unsafe-inline'`]),
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
  response.headers.set(
    "Content-Security-Policy",
    csp
  );

  response.headers.set(
    "x-nonce",
    nonce
  );

  return response;
}

export default function middleware(req: NextRequest) {
  const authToken =
    req.cookies.get("auth_token")?.value;

  const path = req.nextUrl.pathname;

  // Fresh unpredictable nonce per request
  const nonce = crypto
    .randomBytes(16)
    .toString("base64");

  const csp = buildCsp(nonce);

  // -------------------------------------------
  // User not logged in -> redirect to login
  // -------------------------------------------

  if (
    !authToken &&
    path.startsWith("/dashboard")
  ) {
    const url = req.nextUrl.clone();

    url.pathname = "/login";

    const response =
      NextResponse.redirect(url, 308);

    return applySecurityHeaders(
      response,
      csp,
      nonce
    );
  }

  // -------------------------------------------
  // Logged-in user visiting login/signup
  // -------------------------------------------

  if (
    authToken &&
    (
      path.startsWith("/login") ||
      path.startsWith("/signup")
    )
  ) {
    const url = req.nextUrl.clone();

    url.pathname = "/dashboard";

    const response =
      NextResponse.redirect(url, 308);

    return applySecurityHeaders(
      response,
      csp,
      nonce
    );
  }

  // -------------------------------------------
  // Pass nonce + CSP INTO Next.js rendering
  // -------------------------------------------

  const requestHeaders =
    new Headers(req.headers);

  requestHeaders.set(
    "x-nonce",
    nonce
  );

  requestHeaders.set(
    "Content-Security-Policy",
    csp
  );

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // -------------------------------------------
  // CSP response header
  // -------------------------------------------

  return applySecurityHeaders(
    response,
    csp,
    nonce
  );
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico).*)",

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