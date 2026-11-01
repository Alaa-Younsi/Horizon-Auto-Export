import { requireSupabase } from "./supabase";

export const MEDIA_BUCKET = "media";
const MAX_EDGE = 1600;
const QUALITY = 0.84;

/**
 * Downscale to ~1600px and re-encode as WebP before upload; keep whichever of
 * original/WebP is smaller and fall back to the original on any failure. Never
 * upload a phone's raw 8 MB photo — every visitor would download it.
 */
export async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const webp = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
    return webp && webp.size < file.size ? webp : file;
  } catch {
    return file;
  }
}

export type UploadFolder = `vehicles/${string}` | "brands" | "site";

/** Upload to media/<folder>/<uuid>.<ext> with a one-year immutable cache. Returns the public URL. */
export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const db = requireSupabase();
  const blob = await compressImage(file);
  const ext =
    blob.type === "image/webp" ? "webp" : (file.name.split(".").pop()?.toLowerCase() ?? "jpg");
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType: blob.type || file.type,
    upsert: false,
  });
  if (error) throw error;
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Best-effort removal of an uploaded object (never throws: an orphan file is harmless). */
export async function deleteUploadedImage(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const at = publicUrl.indexOf(marker);
  if (at < 0) return;
  try {
    await requireSupabase()
      .storage.from(MEDIA_BUCKET)
      .remove([decodeURIComponent(publicUrl.slice(at + marker.length))]);
  } catch {
    // ignore
  }
}

// ---- delivery: responsive srcsets via Supabase's render endpoint -----------------
const PUBLIC_MARKER = "/storage/v1/object/public/";
const RENDER_MARKER = "/storage/v1/render/image/public/";
const WIDTHS = [320, 480, 720, 1080, 1600];

export function isStorageUrl(src: string): boolean {
  return src.includes(PUBLIC_MARKER);
}

/** `resize=contain` is not optional: width alone returns the ORIGINAL height (squashed). */
export function renderUrl(src: string, width: number, quality = 72): string {
  const base = src.replace(PUBLIC_MARKER, RENDER_MARKER);
  return `${base}${base.includes("?") ? "&" : "?"}width=${width}&resize=contain&quality=${quality}`;
}

/**
 * Supabase's render endpoint ("Image Transformations") is a paid-plan feature:
 * on a project without it every render URL answers 403 FeatureNotEnabled and
 * the photo shows as broken. Off unless the project has it and sets
 * VITE_SUPABASE_IMAGE_TRANSFORMS=true; without it the original file is served.
 */
const TRANSFORMS = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === "true";

export function storageSrcSet(src: string): string | undefined {
  if (!TRANSFORMS || !isStorageUrl(src)) return undefined;
  return WIDTHS.map((w) => `${renderUrl(src, w)} ${w}w`).join(", ");
}
