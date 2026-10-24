"use client";

// Photo studio, all client-side canvas work, no AI and no segmentation. Honesty rule: we crop, fix light
// evenly across the whole photo, and frame it on a blurred copy of itself. Nothing in the photo is moved,
// removed or redrawn.

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

/**
 * Colour-safe light fix, applied evenly to the whole photo (no local edits):
 * 1. Levels on brightness only (one curve for R, G and B), so the item's colours keep their ratios.
 * 2. Gentle midtone lift for dark photos.
 * 3. Cast correction (gray-world), capped at ±6% per channel, so a red item stays red.
 */
function lightFix(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;

  const hist = new Uint32Array(256);
  const sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < d.length; i += 16) {
    hist[(d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8]++;
    sum[0] += d[i];
    sum[1] += d[i + 1];
    sum[2] += d[i + 2];
    n++;
  }
  const pct = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= n * p) return v;
    return 255;
  };
  const lo = pct(0.01);
  const hi = pct(0.99);
  const mid = pct(0.5);

  // Stretch at most 1.5x, and keep a little of the original so it never looks processed.
  const range = Math.max(255 / 1.5, hi - lo);
  const stretched = (v: number) => Math.min(255, Math.max(0, ((v - lo) * 255) / range));
  const midAfter = stretched(mid) / 255;
  const gamma = midAfter < 0.38 ? Math.max(0.75, Math.log(0.42) / Math.log(Math.max(midAfter, 0.05))) : 1;

  const avg = (sum[0] + sum[1] + sum[2]) / 3;
  const gain = sum.map((c) => Math.min(1.06, Math.max(0.94, avg / Math.max(1, c))));

  const lut = [0, 1, 2].map((c) => {
    const t = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      const leveled = 255 * Math.pow(stretched(v) / 255, gamma);
      t[v] = (0.25 * v + 0.75 * leveled) * gain[c];
    }
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
  lightFix(canvas);
  return canvas;
}

/**
 * The item box from detect, made safe: a box that is clearly off falls back to the full frame, and a crop
 * always keeps at least 65% of the photo's width and height (centred on the item), so a slightly wrong box
 * can't cut part of the item off.
 */
function clampBox(b: Box | undefined): Box {
  if (!b || !(b.w > 0.08 && b.h > 0.08)) return { x: 0, y: 0, w: 1, h: 1 };
  const axis = (start: number, size: number) => {
    const s = Math.min(1, Math.max(0.65, size));
    const center = Math.max(0, Math.min(1, start + size / 2));
    const from = Math.max(0, Math.min(1 - s, center - s / 2));
    return [from, s] as const;
  };
  const [x, w] = axis(b.x, b.w);
  const [y, h] = axis(b.y, b.h);
  return { x, y, w, h };
}

export type Overlay = { title: string; price: string };

/** Renders one platform format: blurred backdrop + item crop with a soft shadow (+ optional title/price band). */
export function compose(src: HTMLCanvasElement, format: FormatKey, box?: Box, overlay?: Overlay): string {
  const { w, h } = FORMATS[format];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Backdrop: one flat colour, the photo's edge colour mixed into the design's cream, so the frame
  // matches the photo without a blurry halo.
  ctx.fillStyle = backdropColor(src);
  ctx.fillRect(0, 0, w, h);

  // Foreground: crop around the item, but always with the photo's own aspect ratio (never reshaped), then
  // scale it uniformly to fit the frame.
  const b = clampBox(box);
  const pad = 0.08;
  const aspect = src.width / src.height;
  let sw = b.w * (1 + 2 * pad) * src.width;
  let sh = b.h * (1 + 2 * pad) * src.height;
  if (sw / sh > aspect) sh = sw / aspect;
  else sw = sh * aspect;
  sw = Math.min(sw, src.width);
  sh = Math.min(sh, src.height);
  const cx = (b.x + b.w / 2) * src.width;
  const cy = (b.y + b.h / 2) * src.height;
  const sx = Math.max(0, Math.min(src.width - sw, cx - sw / 2));
  const sy = Math.max(0, Math.min(src.height - sh, cy - sh / 2));

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
    ctx.fillStyle = "rgba(10,10,10,0.88)";
    roundRect(ctx, w * 0.06, top, w * 0.88, bottomBand * 0.8, 32);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = `600 ${Math.round(w * 0.05)}px system-ui, sans-serif`;
    ctx.fillText(truncate(ctx, overlay.title, w * 0.8), w / 2, top + bottomBand * 0.33);
    ctx.fillStyle = "#e8b94a";
    ctx.font = `800 ${Math.round(w * 0.08)}px system-ui, sans-serif`;
    ctx.fillText(overlay.price, w / 2, top + bottomBand * 0.65);
  }
  return canvas.toDataURL("image/jpeg", 0.88);
}

/** Mean colour of the photo's outer 4% border, blended 55% into cream (#faf5e8). */
function backdropColor(src: HTMLCanvasElement): string {
  const ctx = src.getContext("2d")!;
  const bw = Math.max(1, Math.round(src.width * 0.04));
  const bh = Math.max(1, Math.round(src.height * 0.04));
  const strips = [
    ctx.getImageData(0, 0, src.width, bh),
    ctx.getImageData(0, src.height - bh, src.width, bh),
    ctx.getImageData(0, 0, bw, src.height),
    ctx.getImageData(src.width - bw, 0, bw, src.height),
  ];
  const sum = [0, 0, 0];
  let n = 0;
  for (const { data } of strips) {
    for (let i = 0; i < data.length; i += 16) {
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
      n++;
    }
  }
  const cream = [250, 245, 232];
  const [r, g, b] = sum.map((v, c) => Math.round(0.45 * (v / n) + 0.55 * cream[c]));
  return `rgb(${r}, ${g}, ${b})`;
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
