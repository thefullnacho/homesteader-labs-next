import type { Metadata } from "next";
import { Archivo_Black, Caveat, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import TerminalOverlay from "@/components/terminal/TerminalOverlay";
import { Providers } from "@/components/providers";

const archivo = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://homesteaderlabs.com"),
  title: {
    default: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
    template: "%s | Homesteader Labs",
  },
  description: "Free tools for self-reliant homesteaders: frost & weather risk, zone-calibrated planting calendars, caloric-security planning, 3D-printable fabrication, plus field-tested off-grid hardware.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: "Homesteader Labs",
    title: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
    description: "Free tools for self-reliant homesteaders: frost & weather risk, planting calendars, caloric-security planning, 3D-printable fabrication, plus field-tested off-grid hardware.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
    description: "Free tools for self-reliant homesteaders: frost & weather risk, planting calendars, caloric-security planning, 3D-printable fabrication, plus field-tested off-grid hardware.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${newsreader.variable} ${plexMono.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-serif flex flex-col relative overflow-x-hidden">
        <Providers>
          <Navigation />
          <main id="main-content" className="flex-grow relative z-10" role="main">
            {children}
          </main>
          <Footer />
          <TerminalOverlay />
        </Providers>
      </body>
    </html>
  );
}
