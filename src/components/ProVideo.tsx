"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "./ui";

const PRO_PRICE = 49;
// Pine Labs payments aren't wired up yet (judges OK'd a UPI QR for now): a real UPI QR to the team's UPI ID.
const UPI_VPA = process.env.NEXT_PUBLIC_UPI_VPA || "hemanthjanesh-5@okaxis";

export default function ProVideo({ title, onInterest, onPaid }: { title: string; onInterest: () => void; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const payload = UPI_VPA
    ? `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent("Sell It")}&am=${PRO_PRICE}&cu=INR&tn=${encodeURIComponent(`Sell It Pro video: ${title}`.slice(0, 60))}`
    : `SELL-IT-PRO-DEMO-QR (payments not live yet)`;

  useEffect(() => {
    if (open) QRCode.toDataURL(payload, { margin: 1, width: 480, color: { dark: "#0a0a0a", light: "#fffaf0" } }).then(setQr);
  }, [open, payload]);

  return (
    <Card tone="peach">
      <p className="caption-up">Pro</p>
      <h2 className="title-md mt-2">A 15-second video for Reels and Status</h2>
      <p className="mt-1 text-sm text-body">Made from your real photos, with your title and price on screen. ₹{PRO_PRICE}.</p>
      {!open ? (
        <Button
          className="mt-4 w-full"
          onClick={() => {
            setOpen(true);
            onInterest();
          }}
        >
          Get the video · ₹{PRO_PRICE}
        </Button>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-surface p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt="Payment QR" className="h-48 w-48" /> : <div className="h-48 w-48 animate-pulse rounded-xl bg-cream" />}
          {UPI_VPA ? (
            <>
              <p className="text-sm">Scan with any UPI app, or pay from this phone:</p>
              <a
                href={payload}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-4 text-[15px] font-semibold text-brand-ink"
              >
                Pay ₹{PRO_PRICE} with a UPI app
              </a>
              {paid ? (
                <p className="text-sm font-semibold">Thank you! We&apos;ll check the payment and send your video on WhatsApp.</p>
              ) : (
                <button
                  type="button"
                  className="text-sm font-semibold underline"
                  onClick={() => {
                    setPaid(true);
                    onPaid();
                  }}
                >
                  I&apos;ve paid
                </button>
              )}
              <p className="text-xs text-muted">Paid to {UPI_VPA}. Pine Labs checkout is coming soon.</p>
            </>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">Demo QR.</span> Payments (Pine Labs) aren&apos;t live yet, so this can&apos;t take money.
              Thanks for wanting the video: we&apos;ve noted it.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
