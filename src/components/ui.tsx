"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-brand text-brand-ink active:bg-[#1f1f1f] disabled:bg-[#e5e5e5] disabled:text-muted",
    secondary: "bg-surface text-foreground border border-line active:scale-[0.98] disabled:opacity-50",
    ghost: "text-brand underline-offset-4 hover:underline",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center text-[15px] font-semibold leading-snug transition ${styles} ${className}`}
    />
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-2 text-left text-sm font-medium leading-snug transition ${
        active ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

const TONES = {
  plain: "border border-line bg-surface",
  cream: "bg-cream",
  lavender: "bg-lavender",
  peach: "bg-peach",
  mint: "bg-mint",
} as const;

/** Content card (hairline on canvas) or one of the design's single-colour feature cards. */
export function Card({ children, className = "", tone = "plain" }: { children: ReactNode; className?: string; tone?: keyof typeof TONES }) {
  return <section className={`rounded-2xl p-4 sm:p-5 ${TONES[tone]} ${className}`}>{children}</section>;
}

export function CopyButton({ text, label = "Copy", onCopied }: { text: string; label?: string; onCopied?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await copyText(text);
        setDone(true);
        onCopied?.();
        setTimeout(() => setDone(false), 1500);
      }}
      className={`shrink-0 rounded-xl px-3 py-2 text-sm font-semibold ${done ? "bg-mint text-foreground" : "bg-cream-strong text-foreground"}`}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-brand" />
      <p className="text-lg font-medium">{label}</p>
    </div>
  );
}
