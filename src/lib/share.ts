"use client";

import JSZip from "jszip";

export type ShareOutcome = "shared" | "fallback" | "cancelled";

/** Native share sheet with files when the phone supports it; otherwise WhatsApp text link or downloads. */
export async function shareFiles(opts: { files: File[]; text?: string; whatsappFallback?: boolean }): Promise<ShareOutcome> {
  const { files, text, whatsappFallback } = opts;
  const data: ShareData = { files, text };
  if (files.length > 0 && navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  if (whatsappFallback && text) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    return "fallback";
  }
  for (const f of files) downloadFile(f);
  return "fallback";
}

export function downloadFile(file: File | Blob, name?: string) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name ?? (file instanceof File ? file.name : "download");
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadZip(name: string, entries: { path: string; data: Blob | string }[]) {
  const zip = new JSZip();
  for (const e of entries) zip.file(e.path, e.data);
  downloadFile(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
}

export function track(name: "exported" | "shared" | "copied" | "page_viewed" | "opened_platform" | "pro_interest", channel: string | null, listingSlug: string | null) {
  fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, channel, listingSlug }),
    keepalive: true,
  }).catch(() => {});
}

export { formatINR, fillPrice } from "./format";
