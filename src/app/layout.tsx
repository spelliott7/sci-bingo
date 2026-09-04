import type { Metadata } from "next";
import { Bungee, Nunito } from "next/font/google";
import "./globals.css";

const display = Bungee({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "SCI Bingo",
  description: "Song bingo for String Cheese Incident shows.",
};

// Force every route to render dynamically so responses carry a
// no-store Cache-Control header. The host's LiteSpeed cache ignores
// per-account overrides (CacheLookup off in .htaccess is silently
// dropped), so the only reliable way to stop it from freezing a page
// for a year (Next's default s-maxage for statically-optimized pages)
// is to make sure nothing here is ever eligible for that in the first
// place.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} min-h-screen font-body`}>
        {children}
      </body>
    </html>
  );
}
