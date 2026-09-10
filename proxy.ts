import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Protect /admin routes
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
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
