/**
 * Compress an image File to WebP (or JPEG fallback) at a max long-edge of `maxEdge` px.
 * PDFs and non-image files pass through untouched.
 * Returns a Blob plus the suggested file extension.
 */
export async function compressImage(
  file: File,
  opts: { maxEdge?: number; quality?: number; maxBytes?: number } = {}
): Promise<{ blob: Blob; ext: string; mime: string }> {
  const { maxEdge = 1600, quality = 0.82, maxBytes = 600 * 1024 } = opts;

  // PDFs: keep as-is
  if (file.type === 'application/pdf') {
    return { blob: file, ext: 'pdf', mime: 'application/pdf' };
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Formato não suportado. Envie uma imagem ou PDF.');
  }

  const bitmap = await loadBitmap(file);
  const { width, height } = fitInside(bitmap.width, bitmap.height, maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível neste navegador.');
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ('close' in bitmap && typeof (bitmap as ImageBitmap).close === 'function') {
    (bitmap as ImageBitmap).close();
  }

  // Try webp first, then jpeg
  let mime = 'image/webp';
  let ext = 'webp';
  let q = quality;
  let blob = await canvasToBlob(canvas, mime, q);
  if (!blob || blob.type !== 'image/webp') {
    mime = 'image/jpeg';
    ext = 'jpg';
    q = 0.85;
    blob = await canvasToBlob(canvas, mime, q);
  }
  if (!blob) throw new Error('Falha ao comprimir imagem.');

  // Re-compress if still too large
  let attempts = 0;
  while (blob.size > maxBytes && q > 0.4 && attempts < 4) {
    q -= 0.12;
    const next = await canvasToBlob(canvas, mime, q);
    if (!next) break;
    blob = next;
    attempts++;
  }

  return { blob, ext, mime };
}

function fitInside(w: number, h: number, max: number) {
  if (w <= max && h <= max) return { width: w, height: h };
  const ratio = w > h ? max / w : max / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, quality));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}