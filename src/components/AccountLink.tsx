"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth";

/** Header actions: "My listings" + "Sign out" when signed in, otherwise the live stats board. */
export default function AccountLink() {
  const session = useSession();
  const router = useRouter();
  return session ? (
    <span className="flex items-center gap-1">
      <Link href="/me" className="rounded-[10px] bg-brand px-3 py-2 text-sm font-semibold text-brand-ink">
        My listings
      </Link>
      <button
        type="button"
        onClick={() => signOut()?.then(() => router.push("/"))}
        className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted"
      >
        Sign out
      </button>
    </span>
  ) : (
    <Link href="/stats" className="rounded-[10px] px-3 py-2 text-sm font-medium text-muted">
      Live stats
    </Link>
  );
}
