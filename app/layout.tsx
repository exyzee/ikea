import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Container } from "@/components/Container";
import { products } from "@/lib/data/helpers";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"]
});

const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"]
});
const defaultGuide = products[0]?.id ?? "guide";

export const metadata: Metadata = {
  title: "IKEA Together",
  description: "Instructional guide and borrowing for IKEA builds."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexSerif.variable} font-sans`}>
        <div className="min-h-screen bg-ivory text-ink">
          <header className="border-b border-line bg-white/90 backdrop-blur">
            <div className="bg-[#ffdb00] text-[11px] font-semibold uppercase tracking-[0.2em] text-black/80">
              <Container className="py-2">Finish the build. Borrow what you need.</Container>
            </div>
            <Container className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img src="/images/ikea-logo.png" alt="IKEA" className="h-10 w-auto" />
                <div>
                  <div className="text-base font-semibold tracking-tight">IKEA Together</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Instructional support</div>
                </div>
              </div>
              <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-800">
                <Link className="nav-link" href={`/guide/${defaultGuide}`}>
                  Guide
                </Link>
                <Link className="nav-link" href="/borrow">
                  Borrow
                </Link>
                <Link className="nav-link" href="/sent">
                  Requests Sent
                </Link>
              </nav>
            </Container>
          </header>
          <main>
            <Container className="py-10 sm:py-14">{children}</Container>
          </main>
        </div>
      </body>
    </html>
  );
}
