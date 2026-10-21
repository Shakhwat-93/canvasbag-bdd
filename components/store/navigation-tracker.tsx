"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const tc = searchParams?.get("test_event_code") || searchParams?.get("fb_test_code");
    if (tc && typeof window !== "undefined") {
      sessionStorage.setItem("fb_test_code", tc.trim());
      document.cookie = `fb_test_code=${encodeURIComponent(tc.trim())}; path=/; max-age=7200; SameSite=Lax`;
    }

    const searchString = searchParams?.toString();
    const fullPath = searchString ? `${pathname}?${searchString}` : pathname;

    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    trackPageView(fullPath);
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
