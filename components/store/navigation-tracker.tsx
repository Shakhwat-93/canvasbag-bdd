"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // 1. Capture test code from URL without affecting route deduplication
    const tc = searchParams?.get("test_event_code") || searchParams?.get("fb_test_code");
    if (tc && typeof window !== "undefined") {
      sessionStorage.setItem("fb_test_code", tc.trim());
      document.cookie = `fb_test_code=${encodeURIComponent(tc.trim())}; path=/; max-age=7200; SameSite=Lax`;
    }

    // 2. Deduplicate strictly by pathname to avoid double firing when query params change or hydrate
    if (!pathname || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    trackPageView(pathname);
  }, [pathname, searchParams]);

  return null;
}

export function NavigationTracker() {
  return (
    <Suspense fallback={null}>
      <NavigationTrackerInner />
    </Suspense>
  );
}
