/**
 * Turns a picked image file into a compact, persistable data URL.
 * `URL.createObjectURL` only produces a temporary `blob:` link that dies with
 * the tab, so it must never be stored in the database.
 */
export async function fileToStoredImage(
  file: File,
  maxSize = 1200,
  quality = 0.78,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.round(img.width * scale);
    const height = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

/** Rejects stale `blob:` URLs that can no longer be resolved. */
export function safeImage(url: string | null | undefined, fallback: string): string {
  if (!url || url.startsWith("blob:")) return fallback;
  return url;
}
