import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growing Degree Days Calculator + Rainwater Catchment — Weather Station",
  description: "Free growing degree days calculator, rainwater catchment estimator, soil temperature tracker, and fire risk index for off-grid homesteaders. Real-time data from Open-Meteo, no signup.",
  keywords: "growing degree days calculator, rainwater catchment calculator, soil temperature for planting, fire danger index, off-grid weather station",
  openGraph: {
    title: "Growing Degree Days Calculator + Rainwater Catchment — Weather Station",
    description: "Live GDD, rainwater catchment estimates, soil temperature, and fire risk for off-grid homesteaders. No signup.",
    type: "website",
  },
};

export default function WeatherLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
