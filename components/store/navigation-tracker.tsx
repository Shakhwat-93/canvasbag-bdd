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
    // 1. Capture test code & TikTok click ID (ttclid) from URL without affecting route deduplication
    const tc = searchParams?.get("test_event_code") || searchParams?.get("fb_test_code");
    if (tc && typeof window !== "undefined") {
      sessionStorage.setItem("fb_test_code", tc.trim());
      document.cookie = `fb_test_code=${encodeURIComponent(tc.trim())}; path=/; max-age=7200; SameSite=Lax`;
    }
    const ttclid = searchParams?.get("ttclid");
    if (ttclid && typeof window !== "undefined") {
      sessionStorage.setItem("ttclid", ttclid.trim());
      document.cookie = `_ttclid=${encodeURIComponent(ttclid.trim())}; path=/; max-age=2592000; SameSite=Lax`;
    }

    // 2. Multi-channel Traffic Source Detection (TikTok, Facebook, Instagram, Google, YouTube, Messenger)
    if (typeof window !== "undefined") {
      const utmSource = (searchParams?.get("utm_source") || "").toLowerCase().trim();
      const utmMedium = (searchParams?.get("utm_medium") || "").toLowerCase().trim();
      const ref = (document.referrer || "").toLowerCase();

      let detectedSource: string | null = null;
      if (
        ttclid ||
        utmSource.includes("tiktok") ||
        utmMedium.includes("tiktok") ||
        ref.includes("tiktok.com") ||
        ref.includes("musically") ||
        ref.includes("byteoversea") ||
        ref.includes("bytedance")
      ) {
        detectedSource = "TikTok";
      } else if (
        utmSource.includes("facebook") ||
        utmSource === "fb" ||
        ref.includes("facebook.com") ||
        ref.includes("fb.me") ||
        searchParams?.get("fbclid")
      ) {
        detectedSource = "Facebook";
      } else if (
        utmSource.includes("instagram") ||
        utmSource === "ig" ||
        ref.includes("instagram.com")
      ) {
        detectedSource = "Instagram";
      } else if (
        utmSource.includes("messenger") ||
        utmSource === "msg" ||
        ref.includes("messenger.com")
      ) {
        detectedSource = "Messenger";
      } else if (
        utmSource.includes("google") ||
        utmMedium === "cpc" ||
        ref.includes("google.com") ||
        searchParams?.get("gclid")
      ) {
        detectedSource = "Google";
      } else if (
        utmSource.includes("youtube") ||
        ref.includes("youtube.com")
      ) {
        detectedSource = "YouTube";
      }

      if (detectedSource) {
        sessionStorage.setItem("traffic_source", detectedSource);
        localStorage.setItem("traffic_source", detectedSource);
        document.cookie = `traffic_source=${encodeURIComponent(detectedSource)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    }

    // 3. Deduplicate strictly by pathname with global lock to avoid double firing when query params change or hydrate
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
