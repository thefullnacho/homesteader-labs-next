'use client';

import { useEffect, useState } from 'react';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import SetupWizard from '@/components/tools/caloric-security/SetupWizard';
import AutonomyDashboard from '@/components/tools/caloric-security/AutonomyDashboard';
import { isFirstRun } from '@/lib/caloric-security/homesteadStore';
import { useFieldStation } from '@/app/context/FieldStationContext';
import { fetchWeatherData } from '@/lib/weatherApi';
import type { ForecastDay } from '@/lib/weatherTypes';

export default function CaloricSecurityPage() {
  const [ready, setReady]           = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [forecast, setForecast]     = useState<ForecastDay[]>([]);

  const { activeLocation } = useFieldStation();

  // First-run gate
  useEffect(() => {
    isFirstRun()
      .then(first => { setNeedsSetup(first); setReady(true); })
      .catch(() =>   { setNeedsSetup(true);  setReady(true); });
  }, []);

  // Fetch forecast for the water clock once we have a location
  useEffect(() => {
    if (!activeLocation) return;
    fetchWeatherData(activeLocation.lat, activeLocation.lon)
      .then(w => setForecast(w.forecast))
      .catch(() => setForecast([]));   // forecast is optional — clock degrades gracefully
  }, [activeLocation]);

  if (!ready) {
    return (
      <FieldStationLayout stationId="HL_CALORIC_SEC_V1.0">
        <div className="flex items-center justify-center min-h-[40vh]">
          <span className="text-xs font-mono uppercase opacity-30 animate-pulse">
            Loading_Manifest...
          </span>
        </div>
      </FieldStationLayout>
    );
  }

  if (needsSetup) {
    return (
      <FieldStationLayout stationId="HL_CALORIC_SEC_V1.0">
        <SetupWizard onComplete={() => setNeedsSetup(false)} />
      </FieldStationLayout>
    );
  }

  return (
    <FieldStationLayout stationId="HL_CALORIC_SEC_V1.0">
      <AutonomyDashboard
        forecastDays={forecast}
        onReconfigure={() => setNeedsSetup(true)}
      />
    </FieldStationLayout>
  );
}
