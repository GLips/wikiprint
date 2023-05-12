import type { Metadata } from "next";
import "./globals.css";
import { Inter, Newsreader } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Wikiprint",
  description: "Printer friendly versions of Wikipedia articles.",
  openGraph: {
    title: "Wikiprint",
    description: "Beautiful print versions of any Wikipedia article.",
    url: "https://wikiprint.vercel.app/",
    siteName: "Wikiprint",
    images: [
      {
        url: "https://wikiprint.vercel.app/open-graph.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en-US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <div className="sticky top-0 z-10 flex items-center w-full px-4 py-4 overflow-hidden font-mono text-sm bg-white print:hidden h-header border-bottom">
          <Link href="/" className="flex items-center select-none" draggable={false}>
            <Image
              alt="An animated cartoon printer with a face, spitting out papers"
              src="/printer.gif"
              draggable={false}
              fetchPriority="high"
              width={180}
              height={180}
            />
            <p className="font-serif text-4xl -translate-x-16">Wikiprint</p>
            <div className="absolute bottom-0 w-full h-6 bg-gradient-to-b from-transparent to-white" />
          </Link>
        </div>
        {children}
        <link rel="stylesheet" href="/print.css" media="print" />
      </body>
    </html>
  );
}
