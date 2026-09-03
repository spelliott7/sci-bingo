import { NextRequest, NextResponse } from "next/server";
import { GATE_COOKIE, SESSION_COOKIE, verifyGateToken, verifySessionToken } from "@/lib/session";

// Routes reachable with no gate cookie at all.
const GATE_EXEMPT = new Set(["/gate", "/api/gate"]);

// Routes that need the gate cookie but not a logged-in user.
const LOGIN_EXEMPT_PREFIXES = [
  "/login",
  "/register",
  "/admin/login",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/admin/login",
];

function isExempt(pathname: string, list: string[] | Set<string>) {
  if (list instanceof Set) return list.has(pathname);
  return list.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isExempt(pathname, GATE_EXEMPT)) {
    return NextResponse.next();
  }

  const gateOk = await verifyGateToken(request.cookies.get(GATE_COOKIE)?.value);
  if (!gateOk) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Site access required." }, { status: 401 });
    }
    const gateUrl = new URL("/gate", request.url);
    gateUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(gateUrl);
  }

  if (isExempt(pathname, LOGIN_EXEMPT_PREFIXES)) {
    return NextResponse.next();
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isAdminArea) {
    if (!session || session.role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin access required." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Everything else that reaches here needs a logged-in player.
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
