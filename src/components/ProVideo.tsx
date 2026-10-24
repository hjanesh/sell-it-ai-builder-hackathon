"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button, Card } from "./ui";

const PRO_PRICE = 49;
// Pine Labs isn't wired up yet (judges OK'd a QR for now). With a team UPI ID set, this is a real UPI QR;
// without one it's a clearly labelled demo QR that can't take money.
const UPI_VPA = process.env.NEXT_PUBLIC_UPI_VPA ?? "";

export default function ProVideo({ title, onInterest }: { title: string; onInterest: () => void }) {
  const [open, setOpen] = useState(false);
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
            <p className="text-sm">
              Scan with any UPI app to pay ₹{PRO_PRICE}. We&apos;ll send your video on WhatsApp.
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">Demo QR.</span> Payments (Pine Labs) aren&apos;t live yet, so this can&apos;t take money. Thanks for wanting
              the video: we&apos;ve noted it.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
