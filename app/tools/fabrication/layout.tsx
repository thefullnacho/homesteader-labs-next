import { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Workshop — Printable Homestead Parts",
  description: "3D-printable parts for the homestead: plant tags, hose guides, hooks, and row cover clips. Free field-tested models with honest print settings, plus a curated fabrication kit.",
  openGraph: {
    title: "The Workshop — Printable Homestead Parts",
    description: "3D-printable parts for the homestead: free field-tested models with honest print settings, plus a curated fabrication kit.",
    type: "website",
  },
};

export default function FabricationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
