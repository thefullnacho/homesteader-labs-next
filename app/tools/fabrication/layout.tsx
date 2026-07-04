import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fabrication Station",
  description: "3D STL viewer, print time calculator, and G-code generator for off-grid fabrication. Design and estimate prints for homestead hardware projects.",
  openGraph: {
    title: "Fabrication Station",
    description: "3D STL viewer, print time calculator, and G-code generator for homestead hardware fabrication.",
    type: "website",
  },
};

export default function FabricationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
