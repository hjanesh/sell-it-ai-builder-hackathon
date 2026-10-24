"use client";

// Photo studio, all client-side canvas work. Honesty rule: we crop, level exposure/white balance and
// place the photo on a blurred copy of itself. Pixels of the item are never redrawn or retouched.

export type Box = { x: number; y: number; w: number; h: number };

export const FORMATS = {
  square: { w: 1080, h: 1080, label: "Square 1:1" },
  olx: { w: 1200, h: 900, label: "OLX / Marketplace 4:3" },
  feed: { w: 1080, h: 1350, label: "Instagram post 4:5" },
  story: { w: 1080, h: 1920, label: "Story / Status 9:16" },
} as const;
export type FormatKey = keyof typeof FORMATS;

export async function fileToBitmap(file: File | Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

/** Downscaled JPEG data URL, used for the AI call and as the untouched original. */
export function toDataUrl(src: CanvasImageSource & { width: number; height: number }, max = 1280, quality = 0.85): string {
  const scale = Math.min(1, max / Math.max(src.width, src.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(src.width * scale);
  canvas.height = Math.round(src.height * scale);
  canvas.getContext("2d")!.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function dataUrlToBitmap(dataUrl: string): Promise<ImageBitmap> {
  return fileToBitmap(await (await fetch(dataUrl)).blob());
}

/** Auto-levels per channel (1st-99th percentile stretch, blended 70%). Fixes dim or yellow-cast photos. */
function autoLevels(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const lo = [0, 0, 0];
  const hi = [255, 255, 255];
  for (let c = 0; c < 3; c++) {
    const hist = new Uint32Array(256);
    for (let i = c; i < d.length; i += 16) hist[d[i]]++; // sample every 4th pixel
    const total = d.length / 16;
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc > total * 0.01) { lo[c] = v; break; }
    }
    acc = 0;
    for (let v = 255; v >= 0; v--) {
      acc += hist[v];
      if (acc > total * 0.01) { hi[c] = v; break; }
    }
  }
  const lut = [0, 1, 2].map((c) => {
    const t = new Uint8ClampedArray(256);
    const range = Math.max(32, hi[c] - lo[c]);
    for (let v = 0; v < 256; v++) t[v] = 0.3 * v + 0.7 * (((v - lo[c]) * 255) / range);
    return t;
  });
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[0][d[i]];
    d[i + 1] = lut[1][d[i + 1]];
    d[i + 2] = lut[2][d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
}

/** Leveled full-resolution copy of the photo (max 1600px). */
export function enhance(src: ImageBitmap): HTMLCanvasElement {
  const scale = Math.min(1, 1600 / Math.max(src.width, src.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(src.width * scale);
  canvas.height = Math.round(src.height * scale);
  canvas.getContext("2d")!.drawImage(src, 0, 0, canvas.width, canvas.height);
  autoLevels(canvas);
  return canvas;
}

function clampBox(b: Box | undefined): Box {
  if (!b || !(b.w > 0.05 && b.h > 0.05)) return { x: 0, y: 0, w: 1, h: 1 };
  const x = Math.max(0, Math.min(1, b.x));
  const y = Math.max(0, Math.min(1, b.y));
  return { x, y, w: Math.min(1 - x, b.w), h: Math.min(1 - y, b.h) };
}

export type Overlay = { title: string; price: string };

/** Renders one platform format: blurred backdrop + item crop with a soft shadow (+ optional title/price band). */
export function compose(src: HTMLCanvasElement, format: FormatKey, box?: Box, overlay?: Overlay): string {
  const { w, h } = FORMATS[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Backdrop: the same photo, cover-fit, heavily blurred and lightened.
  const cover = Math.max(w / src.width, h / src.height);
  ctx.filter = "blur(40px) saturate(0.8) brightness(1.08)";
  ctx.drawImage(src, (w - src.width * cover) / 2, (h - src.height * cover) / 2, src.width * cover, src.height * cover);
  ctx.filter = "none";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(0, 0, w, h);

  // Foreground: crop around the item with 12% padding, fit inside the frame.
  const b = clampBox(box);
  const pad = 0.12;
  let sx = (b.x - b.w * pad) * src.width;
  let sy = (b.y - b.h * pad) * src.height;
  let sw = b.w * (1 + 2 * pad) * src.width;
  let sh = b.h * (1 + 2 * pad) * src.height;
  sx = Math.max(0, sx);
  sy = Math.max(0, sy);
  sw = Math.min(src.width - sx, sw);
  sh = Math.min(src.height - sy, sh);

  const bottomBand = overlay ? h * 0.2 : 0;
  const availW = w * 0.88;
  const availH = (h - bottomBand) * 0.88;
  const fit = Math.min(availW / sw, availH / sh);
  const dw = sw * fit;
  const dh = sh * fit;
  const dx = (w - dw) / 2;
  const dy = (h - bottomBand - dh) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  roundRect(ctx, dx, dy, dw, dh, 24);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, 24);
  ctx.clip();
  ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();

  if (overlay) {
    const top = h - bottomBand;
    ctx.fillStyle = "rgba(17,24,39,0.88)";
    roundRect(ctx, w * 0.06, top, w * 0.88, bottomBand * 0.8, 32);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `600 ${Math.round(w * 0.05)}px system-ui, sans-serif`;
    ctx.fillText(truncate(ctx, overlay.title, w * 0.8), w / 2, top + bottomBand * 0.33);
    ctx.fillStyle = "#FBBF24";
    ctx.font = `800 ${Math.round(w * 0.08)}px system-ui, sans-serif`;
    ctx.fillText(overlay.price, w / 2, top + bottomBand * 0.65);
  }
  return canvas.toDataURL("image/jpeg", 0.88);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}

export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type });
}
