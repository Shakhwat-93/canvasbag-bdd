import React, { Suspense } from "react";
import { listR2Objects, isR2Configured } from "@/lib/r2";
import { getMediaUsageMap } from "@/lib/media-usage";
import { MediaLibrary, type MediaItem } from "@/components/admin/media-library";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Media Library | CanvasBag Admin",
};

export default async function AdminMediaPage() {
  let initialItems: MediaItem[] = [];

  if (isR2Configured()) {
    try {
      const [r2Result, usageMap] = await Promise.all([
        listR2Objects({ maxKeys: 150 }),
        getMediaUsageMap(),
      ]);

      initialItems = r2Result.objects.map((obj) => {
        const usedIn = usageMap[obj.key] || [];
        return {
          ...obj,
          isUsed: usedIn.length > 0,
          usedIn,
        };
      });
    } catch (e) {
      console.error("[Media Library Page Fetch Error]", e);
    }
  }

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Loading Cloudflare R2 media...
          </p>
        </div>
      }
    >
      <MediaLibrary initialItems={initialItems} />
    </Suspense>
  );
}
