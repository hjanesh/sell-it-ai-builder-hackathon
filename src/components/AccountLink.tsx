"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth";

/** Header action: "My listings" when signed in, otherwise the live stats board. */
export default function AccountLink() {
  const session = useSession();
  return session ? (
    <Link href="/me" className="rounded-[10px] bg-brand px-4 py-2 text-sm font-semibold text-brand-ink">
      My listings
    </Link>
  ) : (
    <Link href="/stats" className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted">
      Live stats
    </Link>
  );
}
