import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fabrication Station | Homesteader Labs",
  description: "3D STL viewer, print time calculator, and G-code generator for off-grid fabrication. Design and estimate prints for homestead hardware projects.",
  keywords: "3D printing, STL viewer, G-code, fabrication, off-grid fabrication, homestead hardware, print calculator",
  openGraph: {
    title: "Fabrication Station | Homesteader Labs",
    description: "3D STL viewer, print time calculator, and G-code generator for homestead hardware fabrication.",
    type: "website",
  },
};

export default function FabricationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
