"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

function NavigationTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
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
