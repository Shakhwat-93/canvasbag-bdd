import { NextRequest, NextResponse } from "next/server";
import { isUserAdmin } from "@/lib/admin-auth";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { processAndOptimizeImage } from "@/lib/image-processor";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  if (!(await isUserAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    
    // Support both "image" and "file" keys
    const singleFile = (formData.get("image") || formData.get("file")) as File | null;
    
    // Support both "images" and "files" keys
    let multiFiles = formData.getAll("images") as File[];
    if (!multiFiles || multiFiles.length === 0) {
      multiFiles = formData.getAll("files") as File[];
    }

    const uploadDir = path.join(process.cwd(), "public", "brand");
    await fs.mkdir(uploadDir, { recursive: true });

    // Handle single file upload
    if (singleFile && singleFile.size > 0) {
      const rawBuffer = Buffer.from(await singleFile.arrayBuffer());
      
      // Auto-convert to crystal clear, sharpened WebP
      const optimized = await processAndOptimizeImage(rawBuffer, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 90,
        sharpen: true,
      });

      const filename = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}.webp`;

      // Save local backup
      try {
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, optimized.buffer);
      } catch (err) {
        console.warn("[Local Upload Backup Warning]", err);
      }

      // Upload to Cloudflare R2
      let publicUrl = `/brand/${filename}`;
      if (isR2Configured()) {
        const r2Key = `brand/${filename}`;
        publicUrl = await uploadToR2(optimized.buffer, r2Key, "image/webp");
      }

      return NextResponse.json({
        success: true,
        url: publicUrl,
        format: "webp",
        width: optimized.width,
        height: optimized.height,
        size: optimized.size,
      });
    }

    // Handle multi-file upload
    if (multiFiles && multiFiles.length > 0) {
      const urls: string[] = [];
      for (const f of multiFiles) {
        if (f.size > 0) {
          const rawBuffer = Buffer.from(await f.arrayBuffer());
          
          // Auto-convert to crystal clear, sharpened WebP
          const optimized = await processAndOptimizeImage(rawBuffer, {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 90,
            sharpen: true,
          });

          const filename = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}.webp`;

          // Save local backup
          try {
            const filePath = path.join(uploadDir, filename);
            await fs.writeFile(filePath, optimized.buffer);
          } catch (err) {
            console.warn("[Local Upload Backup Warning]", err);
          }

          // Upload to Cloudflare R2
          let publicUrl = `/brand/${filename}`;
          if (isR2Configured()) {
            const r2Key = `brand/${filename}`;
            publicUrl = await uploadToR2(optimized.buffer, r2Key, "image/webp");
          }

          urls.push(publicUrl);
        }
      }

      return NextResponse.json({
        success: true,
        urls,
      });
    }

    return NextResponse.json({ error: "No image file found in request" }, { status: 400 });
  } catch (error: any) {
    console.error("[Upload API Error]", error);
    return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
  }
}


