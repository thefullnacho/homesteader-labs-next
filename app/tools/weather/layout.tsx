import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather Station | Homesteader Labs",
  description: "Real-time weather data with survival and planting indices. Fire risk, water catchment potential, solar efficiency, and growing degree days — all offline-ready.",
  keywords: "weather station, survival index, fire risk, planting index, off-grid weather, homestead weather",
  openGraph: {
    title: "Weather Station | Homesteader Labs",
    description: "Real-time survival and planting indices. Fire risk, solar efficiency, water catchment, and growing degree days for your location.",
    type: "website",
  },
};

export default function WeatherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
