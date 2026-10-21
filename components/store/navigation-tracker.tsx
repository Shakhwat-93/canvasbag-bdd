"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

// Module-level tracking state survives React component unmounts and remounts
let globalLastTrackedPath: string | null = null;
let globalLastTrackedTime = 0;

function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Capture test code from URL without affecting route deduplication
    const tc = searchParams?.get("test_event_code") || searchParams?.get("fb_test_code");
    if (tc && typeof window !== "undefined") {
      sessionStorage.setItem("fb_test_code", tc.trim());
      document.cookie = `fb_test_code=${encodeURIComponent(tc.trim())}; path=/; max-age=7200; SameSite=Lax`;
    }

    // 2. Deduplicate strictly by pathname with global lock to avoid double firing when query params change or hydrate
    const now = Date.now();
    if (!pathname || (globalLastTrackedPath === pathname && now - globalLastTrackedTime < 3000)) {
      return;
    }
    globalLastTrackedPath = pathname;
    globalLastTrackedTime = now;

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
