import type { Metadata } from "next";
import { Caveat } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import TerminalOverlay from "@/components/terminal/TerminalOverlay";
import VisualEffects from "@/components/layout/VisualEffects";
import { Providers } from "@/components/providers";

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://homesteaderlabs.com"),
  title: {
    default: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
    template: "%s | Homesteader Labs",
  },
  description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders and self-reliant builders.",
  openGraph: {
    type: "website",
    siteName: "Homesteader Labs",
    title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
    description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
    description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${caveat.variable} dark`}>
      <body className="min-h-screen bg-background-primary text-foreground-primary font-mono flex flex-col relative overflow-x-hidden transition-colors duration-300">
        <Providers>
          <VisualEffects />
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
