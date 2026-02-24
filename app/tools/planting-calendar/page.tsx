"use client";

import { useState, useCallback, useMemo } from "react";
import { Sprout, FileText, LayoutDashboard, Database, AlertTriangle, Printer, Moon } from "lucide-react";
import LocationSetup from "@/components/tools/planting-calendar/LocationSetup";
import CropSelector from "@/components/tools/planting-calendar/CropSelector";
import PlantingCalendar from "@/components/tools/planting-calendar/PlantingCalendar";
import PlantingEmailCapture from "@/components/tools/planting-calendar/PlantingEmailCapture";
import useFrostDates from "./hooks/useFrostDates";
import SeasonExtensionSelector, { SeasonExtension } from "@/components/tools/planting-calendar/SeasonExtensionSelector";
import ContextualRequisition from "@/components/tools/ContextualRequisition";
import { SelectedCrop, PlantingDate } from "@/lib/tools/planting-calendar/types";
import { getCropById } from "@/lib/tools/planting-calendar/crops";
import { calculateCropSchedule } from "@/lib/tools/planting-calendar/plantingCalculations";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Badge from "@/components/ui/Badge";
import Marginalia from "@/components/ui/Marginalia";
import DymoLabel from "@/components/ui/DymoLabel";

export default function PlantingCalendarPage() {
  const { frostDates, loading, error, lookupFrostDates } = useFrostDates();
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([]);
  const [seasonExtension, setSeasonExtension] = useState<SeasonExtension>('none');
  const [lunarSync, setLunarSync] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { plantingDates, omittedCrops, adjustedFrostDates } = useMemo(() => {
    if (!frostDates) return { plantingDates: [], omittedCrops: [], adjustedFrostDates: null };

    // Apply season extension
    const extensionDays = {
      'none': 0,
      'row-cover': 14,
      'cold-frame': 28,
      'greenhouse': 42
    }[seasonExtension];

    const adjustedFrost = {
      ...frostDates,
      lastSpringFrost: new Date(frostDates.lastSpringFrost.getTime() - extensionDays * 24 * 60 * 60 * 1000),
      firstFallFrost: new Date(frostDates.firstFallFrost.getTime() + extensionDays * 24 * 60 * 60 * 1000),
      frostFreeDays: frostDates.frostFreeDays + (extensionDays * 2),
    };

    const dates: PlantingDate[] = [];
    const omitted: ReturnType<typeof getCropById>[] = [];

    selectedCrops.forEach(selectedCrop => {
      const crop = getCropById(selectedCrop.cropId);
      if (crop) {
        const variety = crop.varieties.find(v => v.id === selectedCrop.varietyId);
        if (variety) {
          const schedule = calculateCropSchedule(crop, variety, selectedCrop, adjustedFrost, lunarSync);
          if (schedule.length === 0) {
            omitted.push(crop);
          } else {
            dates.push(...schedule);
          }
        }
      }
    });

    return { plantingDates: dates, omittedCrops: omitted, adjustedFrostDates: adjustedFrost };
  }, [selectedCrops, frostDates, seasonExtension, lunarSync]);

  const handleEmailSubmit = useCallback(async () => {
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
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b-2 border-border-primary pb-6 print:hidden">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative print:block">
          <Marginalia className="hidden xl:block -left-32 top-60 w-48 text-center opacity-30 print:hidden">
            [PRO_TIP]
            START_SEEDS_INDOORS
            6-8_WEEKS_BEFORE
            LAST_FROST_MARKER
          </Marginalia>

          {/* Left Column - Setup */}
          <div className="lg:col-span-1 space-y-6 print:hidden">
            <LocationSetup
              onLocationSet={() => {}} // Hook handles state
              loading={loading}
              error={error}
              onLookup={lookupFrostDates}
            />

            {frostDates && (
              <>
                <SeasonExtensionSelector 
                  extension={seasonExtension} 
                  onChange={setSeasonExtension} 
                />
                
                <BrutalistBlock className="p-4 border-dashed border-border-primary/30" variant="default" refTag="LUNAR_SYNC">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
                        <Moon size={16} className="text-accent opacity-60" />
                      </div>
                      <div>
                        <Typography variant="h4" className="mb-0 text-xs uppercase tracking-tighter">Lunar_Sync</Typography>
                        <Typography variant="small" className="opacity-40 text-[8px] uppercase font-mono mb-0">Phase_Alignment</Typography>
                      </div>
                    </div>
                    <label className="flex items-center cursor-pointer relative">
                      <input 
                        type="checkbox" 
                        checked={lunarSync}
                        onChange={(e) => setLunarSync(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 border-2 transition-colors ${lunarSync ? 'bg-accent border-accent' : 'bg-black/20 border-border-primary/30'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white transition-all ${lunarSync ? 'left-[1.3rem]' : 'left-1'}`} />
                      </div>
                    </label>
                  </div>
                </BrutalistBlock>

                <CropSelector
                  selectedCrops={selectedCrops}
                  onCropsChange={setSelectedCrops}
                  maxCrops={10}
                />
              </>
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
          <div className="lg:col-span-2 print:col-span-3 print:w-full">
            {hasCalendarData ? (
              <div className="space-y-6 print:space-y-4">
                {omittedCrops.length > 0 && (
                  <BrutalistBlock className="p-4 border-orange-500/50 bg-orange-500/10 text-orange-400 mb-6 print:hidden" variant="default" refTag="SYS_WARNING">
                    <Typography variant="h4" className="text-sm mb-2 uppercase tracking-tight flex items-center gap-2">
                      <AlertTriangle size={16} /> Season Too Short
                    </Typography>
                    <Typography variant="body" className="text-xs mb-0 opacity-80">
                      Warning: The season in your zone is too short to grow the following crops to maturity:
                      <span className="font-bold ml-1">{omittedCrops.map(c => c?.name).filter(Boolean).join(', ')}</span>.
                      They have been omitted from the schedule.
                    </Typography>
                  </BrutalistBlock>
                )}

                <div className="flex items-center justify-between mb-2 print:hidden">
                  <div className="flex items-center gap-3 flex-grow">
                    <DymoLabel className="text-[10px]">OUTPUT_GENERATED</DymoLabel>
                    <div className="h-[2px] flex-grow max-w-[200px] bg-border-primary/20" />
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-border-primary hover:border-accent hover:text-accent transition-colors text-[10px] font-bold font-mono uppercase bg-black/20"
                  >
                    <Printer size={12} />
                    PRINT_MANIFEST
                  </button>
                </div>

                {seasonExtension === 'row-cover' && (
                  <ContextualRequisition 
                    hardwareId="hoop-house-clips-v2"
                    hardwareName="Row-Cover Hoop Brackets"
                    reason="Season Extension Deployment"
                    zone={frostDates.growingZone || "Unknown"}
                    href="/tools/fabrication"
                  />
                )}

                <PlantingCalendar
                  dates={plantingDates}
                  frostDates={adjustedFrostDates || frostDates}
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
        <div className="pt-12 pb-8 flex flex-col items-center gap-4 border-t border-border-primary/10 opacity-20 font-mono print:hidden">
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
