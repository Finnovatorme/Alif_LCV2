import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

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

    `connect-src 'self' https://demo.finnovator.com.sa:8010 https://demo.finnovator.com.sa:8011`,

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

function applySecurityHeaders(res: NextResponse, nonce: string) {
  const csp = buildCsp(nonce);
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  return res;
}

export default function middleware(req: NextRequest) {
  const authToken = req.cookies.get("auth_token")?.value;
  const path = req.nextUrl.pathname;
  const nonce = crypto.randomUUID().replace(/-/g, "");

  if (!authToken && path.startsWith("/dashboard")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url, 308);
    return applySecurityHeaders(res, nonce);
  }

  if (authToken && (path.startsWith("/login") || path.startsWith("/signup"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    const res = NextResponse.redirect(url, 308);
    return applySecurityHeaders(res, nonce);
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res, nonce);
}

export const config = {
  matcher: ["/((?!api|favicon.ico|_next/static|_next/image).*)"],
};
