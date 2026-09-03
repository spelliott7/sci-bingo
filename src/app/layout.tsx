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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} min-h-screen font-body`}>
        {children}
      </body>
    </html>
  );
}
