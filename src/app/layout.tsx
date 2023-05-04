import "./globals.css";
import { Inter, Newsreader } from "next/font/google";
import Image from "next/image";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata = {
  title: "Wikiprint",
  description: "Printer friendly versions of Wikipedia articles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <div className="sticky top-0 z-10 flex items-center w-full px-4 py-4 overflow-hidden font-mono text-sm bg-white print:hidden h-header border-bottom">
          <a href="/" className="flex items-center select-none" draggable={false}>
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
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
