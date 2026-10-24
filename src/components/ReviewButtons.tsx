"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";

export default function ReviewButtons({ slug, reviewKey }: { slug: string; reviewKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    const reviewer = localStorage.getItem("sellit.reviewer") || prompt("Your name (for the approval log)") || "team";
    localStorage.setItem("sellit.reviewer", reviewer);
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: reviewKey, slug, decision, reviewer }),
    });
    setBusy(false);
    if (!res.ok) alert((await res.json()).error ?? "Failed");
    router.refresh();
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button disabled={busy} onClick={() => decide("approved")}>
        Approve
      </Button>
      <Button variant="secondary" disabled={busy} onClick={() => decide("rejected")}>
        Reject
      </Button>
    </div>
  );
}
