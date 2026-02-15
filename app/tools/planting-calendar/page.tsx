"use client";

import { useState, useCallback, useMemo } from "react";
import { Sprout, FileText, LayoutDashboard, Database } from "lucide-react";
import LocationSetup from "@/components/tools/planting-calendar/LocationSetup";
import CropSelector from "@/components/tools/planting-calendar/CropSelector";
import PlantingCalendar from "@/components/tools/planting-calendar/PlantingCalendar";
import PlantingEmailCapture from "@/components/tools/planting-calendar/PlantingEmailCapture";
import useFrostDates from "./hooks/useFrostDates";
import { Crop, FrostDates, SelectedCrop, PlantingDate } from "./types";
import { getCropById } from "./lib/crops";
import { calculateCropSchedule } from "./lib/plantingCalculations";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Badge from "@/components/ui/Badge";
import Marginalia from "@/components/ui/Marginalia";
import DymoLabel from "@/components/ui/DymoLabel";

export default function PlantingCalendarPage() {
  const { frostDates, loading, error, lookupFrostDates } = useFrostDates();
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([]);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const plantingDates = useMemo(() => {
    if (!frostDates) return [];

    const dates: PlantingDate[] = [];
    selectedCrops.forEach(selectedCrop => {
      const crop = getCropById(selectedCrop.cropId);
      if (crop) {
        const variety = crop.varieties.find(v => v.id === selectedCrop.varietyId);
        if (variety) {
          const schedule = calculateCropSchedule(crop, variety, selectedCrop, frostDates);
          dates.push(...schedule);
        }
      }
    });

    return dates;
  }, [selectedCrops, frostDates]);

  const handleEmailSubmit = useCallback(async (email: string) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setShowEmailCapture(false);
      setIsSuccess(false);
    }, 3000);
  }, []);

  const hasCalendarData = frostDates && selectedCrops.length > 0;

  return (
    <FieldStationLayout stationId="HL_PLANT_CAL_V2.1">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b-2 border-border-primary pb-6">
          <div>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">Planting_Calendar</Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[9px] uppercase tracking-widest">
              Automated Succession Logic // Active_Uplink: NOAA_NCRM_V3
            </Typography>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex border-2 border-border-primary p-1 bg-black/20">
              <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-bold font-mono uppercase opacity-40">
                <Database size={12} /> DB_LOADED
              </div>
            </div>
            <Badge variant="status" pulse>Sync_Active</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          <Marginalia className="hidden xl:block -left-32 top-60 w-48 text-center opacity-30">
            [PRO_TIP]
            START_SEEDS_INDOORS
            6-8_WEEKS_BEFORE
            LAST_FROST_MARKER
          </Marginalia>

          {/* Left Column - Setup */}
          <div className="lg:col-span-1 space-y-6">
            <LocationSetup
              onLocationSet={() => {}} // Hook handles state
              loading={loading}
              error={error}
              onLookup={lookupFrostDates}
            />

            {frostDates && (
              <CropSelector
                selectedCrops={selectedCrops}
                onCropsChange={setSelectedCrops}
                maxCrops={10}
              />
            )}

            <BrutalistBlock className="p-5 border-dashed border-border-primary/30" refTag="SYS_LOG_V2">
              <Typography variant="h4" className="text-xs flex items-center gap-2 mb-4 uppercase tracking-widest font-mono opacity-40">
                <FileText size={14} /> Technical_Specs
              </Typography>
              <ul className="text-[9px] space-y-2 opacity-60 font-mono uppercase tracking-tighter">
                <li className="flex gap-2"><span>[•]</span> <span>Succession_Engine_v2.1_Active</span></li>
                <li className="flex gap-2"><span>[•]</span> <span>Maturity_Index_Adjusted</span></li>
                <li className="flex gap-2"><span>[•]</span> <span>Offline_Ops_Ready</span></li>
              </ul>
            </BrutalistBlock>
          </div>

          {/* Right Column - Calendar */}
          <div className="lg:col-span-2">
            {hasCalendarData ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <DymoLabel className="text-[10px]">OUTPUT_GENERATED</DymoLabel>
                  <div className="h-[2px] flex-grow bg-border-primary/20" />
                </div>
                <PlantingCalendar
                  dates={plantingDates}
                  frostDates={frostDates}
                  onEmailCapture={() => setShowEmailCapture(true)}
                />
              </div>
            ) : (
              <BrutalistBlock className="p-16 text-center bg-black/20 border-2 border-dashed border-border-primary/20" variant="default">
                <div className="max-w-xs mx-auto">
                  <Sprout size={64} className="mx-auto mb-8 opacity-10 text-accent animate-pulse" />
                  <Typography variant="h3" className="mb-4 uppercase tracking-tighter opacity-40 italic">Awaiting_Input_Parameters</Typography>
                  <Typography variant="body" className="opacity-30 text-[10px] uppercase font-mono leading-relaxed mb-0">
                    System requires regional coordinates and inventory manifest to initialize temporal sequence.
                  </Typography>
                </div>
              </BrutalistBlock>
            )}
          </div>
        </div>

        {/* Email Capture Modal */}
        <PlantingEmailCapture
          isOpen={showEmailCapture}
          zipCode={frostDates?.zipCode || ""}
          cropCount={selectedCrops.length}
          onSubmit={handleEmailSubmit}
          onDismiss={() => setShowEmailCapture(false)}
          isSubmitting={isSubmitting}
          isSuccess={isSuccess}
        />

        {/* Footer Info */}
        <div className="pt-12 pb-8 flex flex-col items-center gap-4 border-t border-border-primary/10 opacity-20 font-mono">
          <div className="flex items-center gap-6">
            <LayoutDashboard size={16} />
            <div className="w-px h-4 bg-foreground-primary" />
            <span className="text-[8px] uppercase tracking-[0.4em]">Non_Linear_Temporal_Calibrator</span>
          </div>
          <Typography variant="small" className="text-[8px] uppercase tracking-widest text-center mb-0">
            REF_0x772: SUCCESSION_ENABLED // ACCURACY: ±144_HOURS
          </Typography>
        </div>
      </div>
    </FieldStationLayout>
  );
}
