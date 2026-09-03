"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  venmoHandle: string;
  amount: number;
  note: string;
};

export default function VenmoPaymentPrompt({ venmoHandle, amount, note }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const handle = venmoHandle.replace(/^@/, "");
  const payLink = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(handle)}&amount=${amount}&note=${encodeURIComponent(note)}`;
  const profileLink = `https://venmo.com/u/${encodeURIComponent(handle)}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(payLink, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payLink]);

  return (
    <div className="panel border-cheese-teal/50 text-center">
      <p className="text-sm uppercase tracking-wide text-cheese-teal">Next step</p>
      <h2 className="mt-1 font-display text-2xl text-cheese-gold">
        Send ${amount.toFixed(2)} via Venmo
      </h2>
      <p className="mt-1 text-sm text-white/60">to @{handle}</p>

      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- small client-generated data: URL, not worth next/image here
        <img
          src={qrDataUrl}
          alt={`Venmo QR code to pay @${handle}`}
          className="mx-auto mt-4 rounded-lg bg-white p-2"
          width={220}
          height={220}
        />
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <a href={payLink} className="btn-primary">
          Open in Venmo app
        </a>
        <a href={profileLink} target="_blank" rel="noreferrer" className="text-xs text-white/50 hover:underline">
          No Venmo app? View @{handle}&apos;s profile
        </a>
      </div>
      <p className="mt-3 text-xs text-white/40">
        Scan the QR code, tap the button on your phone, or just open Venmo and search @{handle}.
      </p>
    </div>
  );
}
