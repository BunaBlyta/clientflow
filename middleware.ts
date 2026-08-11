import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "clientflow_session";
const DEVELOPMENT_ONLY_SESSION_KEY = "not-a-secret-development-fallback";

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function base64UrlToString(value: string): string {
  return new TextDecoder().decode(decodeBase64Url(value));
}

async function hasValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return false;

  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET ?? DEVELOPMENT_ONLY_SESSION_KEY,
    );
    const key = await crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const isSignatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(encodedSignature) as unknown as BufferSource,
      new TextEncoder().encode(encodedPayload),
    );
    if (!isSignatureValid) return false;

    const payload = JSON.parse(base64UrlToString(encodedPayload)) as {
      sub?: unknown;
      exp?: unknown;
    };
    return (
      typeof payload.sub === "string" &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

/**
 * Local development only.
 *
 * `npx expo start --web` serves the mobile app from localhost:8081 while the API
 * runs on localhost:3000. That is a cross-origin request, so the browser sends a
 * preflight OPTIONS first and blocks everything unless the API answers it. Native
 * builds on a real device have no CORS at all, which is why this is not needed in
 * production — and why it stays switched off there.
 */
const isDevelopment = process.env.NODE_ENV === "development";

function localDevOrigin(request: NextRequest): string | null {
  if (!isDevelopment) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" ? origin : null;
  } catch {
    return null;
  }
}

function withCorsHeaders(response: NextResponse, origin: string): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  response.headers.append("Vary", "Origin");
  return response;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API routes authenticate themselves and return JSON errors. They must never
  // hit the dashboard redirect logic below, or a 401 would become a redirect to
  // /login and every client would parse HTML as JSON.
  if (pathname.startsWith("/api/")) {
    const origin = localDevOrigin(request);
    if (!origin) return NextResponse.next();

    if (request.method === "OPTIONS") {
      return withCorsHeaders(new NextResponse(null, { status: 204 }), origin);
    }
    return withCorsHeaders(NextResponse.next(), origin);
  }

  const isAuthenticated = await hasValidSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
