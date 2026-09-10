import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { listR2Objects, uploadToR2, deleteFromR2, isR2Configured } from "@/lib/r2";
import { getMediaUsageMap } from "@/lib/media-usage";
import { processAndOptimizeImage } from "@/lib/image-processor";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const filter = searchParams.get("filter") || "all"; // 'all' | 'used' | 'unused'
    const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 60)));
    const continuationToken = searchParams.get("continuationToken") || undefined;

    if (!isR2Configured()) {
      return NextResponse.json({
        error: "Cloudflare R2 is not configured with valid credentials",
        objects: [],
      }, { status: 503 });
    }

    // Fetch R2 objects and usage map in parallel
    const [r2Result, usageMap] = await Promise.all([
      listR2Objects({ maxKeys: 150, continuationToken }),
      getMediaUsageMap(),
    ]);

    // Annotate objects with usage information
    let annotated = r2Result.objects.map((obj) => {
      const usedIn = usageMap[obj.key] || [];
      return {
        ...obj,
        isUsed: usedIn.length > 0,
        usedIn,
      };
    });

    // Apply search filter if present
    if (search) {
      annotated = annotated.filter((item) => {
        const keyMatch = item.key.toLowerCase().includes(search);
        const usedMatch = item.usedIn.some((u) => u.name.toLowerCase().includes(search));
        return keyMatch || usedMatch;
      });
    }

    // Apply usage filter
    if (filter === "used") {
      annotated = annotated.filter((item) => item.isUsed);
    } else if (filter === "unused") {
      annotated = annotated.filter((item) => !item.isUsed);
    }

    // Slice according to limit
    const paginated = annotated.slice(0, limit);

    return NextResponse.json({
      success: true,
      objects: paginated,
      totalCount: annotated.length,
      nextContinuationToken: r2Result.nextContinuationToken,
      isTruncated: r2Result.isTruncated,
      stats: {
        totalFetched: r2Result.objects.length,
        usedCount: r2Result.objects.filter((o) => (usageMap[o.key] || []).length > 0).length,
        unusedCount: r2Result.objects.filter((o) => !(usageMap[o.key] || []).length).length,
      },
    });
  } catch (error: any) {
    console.error("[Admin Media GET Error]", error);
    return NextResponse.json({ error: error.message || "Failed to list media" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const singleFile = (formData.get("image") || formData.get("file")) as File | null;
    let multiFiles = formData.getAll("images") as File[];
    if (!multiFiles || multiFiles.length === 0) {
      multiFiles = formData.getAll("files") as File[];
    }

    const filesToProcess = singleFile && singleFile.size > 0 ? [singleFile] : multiFiles.filter((f) => f.size > 0);

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "brand");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploadedResults = [];

    for (const file of filesToProcess) {
      const rawBuffer = Buffer.from(await file.arrayBuffer());

      // Optimize to crisp WebP
      const optimized = await processAndOptimizeImage(rawBuffer, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 90,
        sharpen: true,
      });

      // Clean, predictable key
      const cleanOriginalName = file.name
        ? file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)
        : "img";
      const filename = `${Date.now()}_${cleanOriginalName}_${crypto.randomBytes(4).toString("hex")}.webp`;
      const r2Key = `brand/${filename}`;

      // Local backup
      try {
        await fs.writeFile(path.join(uploadDir, filename), optimized.buffer);
      } catch (e) {
        console.warn("[Media Upload Local Backup Warning]", e);
      }

      // R2 Upload
      const publicUrl = await uploadToR2(optimized.buffer, r2Key, "image/webp");

      uploadedResults.push({
        key: r2Key,
        url: publicUrl,
        size: optimized.size,
        width: optimized.width,
        height: optimized.height,
        lastModified: new Date().toISOString(),
        isUsed: false,
        usedIn: [],
      });
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedResults,
      // Backward compatibility with single file upload consumers
      url: uploadedResults[0]?.url,
      key: uploadedResults[0]?.key,
    });
  } catch (error: any) {
    console.error("[Admin Media POST Error]", error);
    return NextResponse.json({ error: error.message || "Failed to upload media" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get("key");
    let force = searchParams.get("force") === "true";

    if (!key) {
      try {
        const body = await req.json();
        key = body.key;
        force = Boolean(body.force);
      } catch {
        // Body optional if query param used
      }
    }

    if (!key) {
      return NextResponse.json({ error: "Media key is required for deletion" }, { status: 400 });
    }

    const cleanKey = key.replace(/^\/+/, "");

    // Check usage across catalog
    const usageMap = await getMediaUsageMap();
    const usedIn = usageMap[cleanKey] || [];

    if (usedIn.length > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete image because it is currently used by ${usedIn.length} item(s)`,
          isUsed: true,
          usedIn,
        },
        { status: 409 }
      );
    }

    // Perform safe deletion from Cloudflare R2
    await deleteFromR2(cleanKey);

    return NextResponse.json({
      success: true,
      message: "Media object deleted successfully from Cloudflare R2",
      key: cleanKey,
    });
  } catch (error: any) {
    console.error("[Admin Media DELETE Error]", error);
    return NextResponse.json({ error: error.message || "Failed to delete media" }, { status: 500 });
  }
}
