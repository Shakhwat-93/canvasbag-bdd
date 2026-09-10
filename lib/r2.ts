import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID || "1f60a272ef9681feba3ea3196f1f7211";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "8dccae1735148226d523d4b47424c214";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "5cb46533a21896f44223113f9eafc9b7f60851ce970eacdedebbade5bc58f66b";
const bucketName = process.env.R2_BUCKET_NAME || "images-for-canvas";
const publicUrl = (process.env.R2_PUBLIC_URL || "https://pub-c87cf7c070ae4a08a702a89ea3340662.r2.dev").replace(/\/+$/, "");

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export function isR2Configured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `${publicUrl}/${cleanKey}`;
}

export interface R2ObjectItem {
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  contentType?: string;
}

export interface ListR2ObjectsResult {
  objects: R2ObjectItem[];
  nextContinuationToken?: string;
  isTruncated: boolean;
  totalCount?: number;
}

/**
 * Lists objects in Cloudflare R2 bucket
 */
export async function listR2Objects(options?: {
  maxKeys?: number;
  continuationToken?: string;
  prefix?: string;
}): Promise<ListR2ObjectsResult> {
  const maxKeys = options?.maxKeys || 100;
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    MaxKeys: maxKeys,
    ContinuationToken: options?.continuationToken,
    Prefix: options?.prefix,
  });

  const res = await r2Client.send(command);

  const objects: R2ObjectItem[] = (res.Contents || [])
    .filter((item) => item.Key && !item.Key.endsWith("/"))
    .map((item) => ({
      key: item.Key!,
      url: getR2PublicUrl(item.Key!),
      size: item.Size || 0,
      lastModified: item.LastModified?.toISOString(),
    }))
    .sort((a, b) => {
      const timeA = a.lastModified ? new Date(a.lastModified).getTime() : 0;
      const timeB = b.lastModified ? new Date(b.lastModified).getTime() : 0;
      return timeB - timeA; // Newest first
    });

  return {
    objects,
    nextContinuationToken: res.NextContinuationToken,
    isTruncated: Boolean(res.IsTruncated),
    totalCount: res.KeyCount,
  };
}

/**
 * Extracts normalized R2 key from a full public CDN URL or relative path
 */
export function extractR2Key(urlOrKey: string): string | null {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;
  const trimmed = urlOrKey.trim();
  if (trimmed.startsWith(publicUrl)) {
    return trimmed.slice(publicUrl.length).replace(/^\/+/, "");
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      return u.pathname.replace(/^\/+/, "");
    } catch {
      return null;
    }
  }
  return trimmed.replace(/^\/+/, "");
}

/**
 * Uploads a binary buffer to Cloudflare R2 bucket
 * @param buffer - File content buffer
 * @param key - Storage path / filename (e.g. "brand/178896...webp" or "uploads/...jpg")
 * @param contentType - MIME type (e.g. "image/webp")
 * @returns Full public CDN URL for the uploaded object
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = "image/webp"
): Promise<string> {
  const cleanKey = key.replace(/^\/+/, "");

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  await r2Client.send(command);
  return getR2PublicUrl(cleanKey);
}

/**
 * Deletes an object from Cloudflare R2 bucket
 * @param key - Storage path / filename
 */
export async function deleteFromR2(key: string): Promise<void> {
  const cleanKey = key.replace(/^\/+/, "");
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
  });
  await r2Client.send(command);
}

