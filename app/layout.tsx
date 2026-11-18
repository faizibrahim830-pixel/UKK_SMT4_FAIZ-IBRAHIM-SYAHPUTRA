import type { Metadata } from "next";
import { Geist_Mono, Inter, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSansHeading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SMK MVP ARS Internasional",
  description:
    "SMK MVP ARS Internasional mendampingi siswa belajar, bertumbuh, dan mengembangkan keterampilan untuk masa depan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        instrumentSansHeading.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
