import Link from "next/link";
import type { ReactNode } from "react";

/** Pill nav from the landing page (docs/DESIGN.md + landing.html): logo tile, wordmark, one action. */
export default function AppHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="sticky top-3 z-30 mb-6 flex justify-center">
      <div className="flex w-full items-center justify-between gap-4 rounded-full border border-line bg-surface/85 py-2 pl-4 pr-2 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-[13px] font-medium tracking-tight text-surface">S</span>
          Sell It
        </Link>
        {action ?? (
          <Link href="/stats" className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted">
            Live stats
          </Link>
        )}
      </div>
    </header>
  );
}
