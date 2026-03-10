import { supabase } from "@/integrations/supabase/client";

export interface AttachmentData {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  fileName: string;
  size: number;
}

export interface PendingAttachment {
  file: File;
  preview: string;
  id: string;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

function compressImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;

      // Scale down if needed
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to compress image"));
        },
        "image/webp",
        quality
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadAttachment(
  file: File,
  bucket: string,
  userId: string,
  onProgress?: (pct: number) => void
): Promise<AttachmentData> {
  onProgress?.(10);

  const dims = await getImageDimensions(file);
  onProgress?.(20);

  // Compress full image (max 1920px)
  const fullBlob = await compressImage(file, 1920, 1920, 0.85);
  onProgress?.(40);

  // Create thumbnail (max 500px)
  const thumbBlob = await compressImage(file, 500, 500, 0.7);
  onProgress?.(60);

  const ts = Date.now();
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const fullPath = `${userId}/${ts}-${baseName}.webp`;
  const thumbPath = `${userId}/${ts}-${baseName}-thumb.webp`;

  // Upload full image
  const { error: fullErr } = await supabase.storage
    .from(bucket)
    .upload(fullPath, fullBlob, { contentType: "image/webp" });
  if (fullErr) throw fullErr;
  onProgress?.(80);

  // Upload thumbnail
  const { error: thumbErr } = await supabase.storage
    .from(bucket)
    .upload(thumbPath, thumbBlob, { contentType: "image/webp" });
  if (thumbErr) throw thumbErr;
  onProgress?.(95);

  const { data: fullUrl } = supabase.storage.from(bucket).getPublicUrl(fullPath);
  const { data: thumbUrl } = supabase.storage.from(bucket).getPublicUrl(thumbPath);

  onProgress?.(100);

  return {
    url: fullUrl.publicUrl,
    thumbnailUrl: thumbUrl.publicUrl,
    width: dims.width,
    height: dims.height,
    fileName: file.name,
    size: file.size,
  };
}

export function createPendingAttachment(file: File): PendingAttachment {
  return {
    file,
    preview: URL.createObjectURL(file),
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };
}

export function revokePendingAttachments(attachments: PendingAttachment[]) {
  attachments.forEach((a) => URL.revokeObjectURL(a.preview));
}
