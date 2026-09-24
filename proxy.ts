import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const cleanHost = host.split(":")[0].toLowerCase();

  // 1. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";
    const token = request.cookies.get("admin_token")?.value;
    const isAuthenticated = Boolean(token && token.length > 10);

    // Unauthenticated user trying to access protected admin page
    if (!isAuthenticated && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      const target = pathname + search;
      loginUrl.searchParams.set("next", target);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated admin trying to access login page
    if (isAuthenticated && isLoginPage) {
      const nextParam = request.nextUrl.searchParams.get("next");
      let safeTarget = "/admin/products";

      if (
        nextParam &&
        nextParam.startsWith("/admin") &&
        !nextParam.startsWith("/admin/login") &&
        !nextParam.startsWith("//")
      ) {
        safeTarget = nextParam;
      }

      return NextResponse.redirect(new URL(safeTarget, request.url));
    }
    return NextResponse.next();
  }

  // 2. Custom Domain & Subdomain resolver for Landing Pages
  // e.g. store.canvasbagbd.com or promo.canvasbagbd.com or custom domain
  const isLocal = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1") || cleanHost.endsWith(".sslip.io");
  const isMainDomain = cleanHost === "canvasbagbd.com" || cleanHost === "www.canvasbagbd.com";

  if (!pathname.startsWith("/api") && !pathname.startsWith("/lp") && !isMainDomain && !isLocal) {
    if (cleanHost.endsWith(".canvasbagbd.com")) {
      const sub = cleanHost.replace(".canvasbagbd.com", "");
      if (sub && sub !== "www") {
        const rewritePath = pathname === "/" ? `/lp/${sub}` : `/lp/${sub}${pathname}`;
        return NextResponse.rewrite(new URL(rewritePath + search, request.url));
      }
    } else if (cleanHost && !cleanHost.includes("vercel.app")) {
      // Full custom domain binding
      const rewritePath = pathname === "/" ? `/lp/${cleanHost}` : `/lp/${cleanHost}${pathname}`;
      return NextResponse.rewrite(new URL(rewritePath + search, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!api|_next/static|_next/image|brand|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
