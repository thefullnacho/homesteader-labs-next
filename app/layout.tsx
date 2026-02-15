import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import TerminalOverlay from "@/components/terminal/TerminalOverlay";
import VisualEffects from "@/components/layout/VisualEffects";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
  description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders and self-reliant builders.",
  keywords: "homesteading, off-grid, fabrication, 3D printing, survival gear, DIY electronics, LoRa, mesh networks",
  openGraph: {
    title: "Homesteader Labs | Off-Grid Hardware & Fabrication Tools",
    description: "Tools for those who build their own world. Off-grid hardware, fabrication tools, and survival tech for homesteaders.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-theme-bg text-theme-main font-mono flex flex-col relative overflow-x-hidden transition-colors duration-300">
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
