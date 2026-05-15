"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Sprout, FileText, AlertTriangle, Printer, Moon, Gauge } from "lucide-react";
import LocationSetup from "@/components/tools/planting-calendar/LocationSetup";
import CropSelector from "@/components/tools/planting-calendar/CropSelector";
import PlantingCalendar from "@/components/tools/planting-calendar/PlantingCalendar";
import PlantingEmailCapture from "@/components/tools/planting-calendar/PlantingEmailCapture";
import useFrostDates from "./hooks/useFrostDates";
import SeasonExtensionSelector, { SeasonExtension } from "@/components/tools/planting-calendar/SeasonExtensionSelector";
import ContextualRequisition from "@/components/tools/ContextualRequisition";
import { SelectedCrop, PlantingDate } from "@/lib/tools/planting-calendar/types";
import { getCropById } from "@/lib/tools/planting-calendar/crops";
import { calculateCropYield } from "@/lib/caloric-security/yieldCalculations";
import { calculateCropSchedule } from "@/lib/tools/planting-calendar/plantingCalculations";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import FieldStationBridge from "@/components/ui/FieldStationBridge";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Marginalia from "@/components/ui/Marginalia";
import DymoLabel from "@/components/ui/DymoLabel";

export default function PlantingCalendarPage() {
  const { frostDates, loading, error, lookupFrostDates } = useFrostDates();
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([]);
  const [seasonExtension, setSeasonExtension] = useState<SeasonExtension>('none');
  const [lunarSync, setLunarSync] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailError, setIsEmailError] = useState(false);

  const { plantingDates, omittedCrops, adjustedFrostDates } = useMemo(() => {
    if (!frostDates) return { plantingDates: [], omittedCrops: [], adjustedFrostDates: null };

    // Apply season extension
    const extensionDays = {
      'none': 0,
      'row-cover': 14,
      'cold-frame': 28,
      'greenhouse': 42
    }[seasonExtension];

    // Experience level buffer: beginner plants later (more conservative)
    const experienceBufferDays = { beginner: 7, intermediate: 3, advanced: 0 }[experienceLevel];

    const adjustedFrost = {
      ...frostDates,
      lastSpringFrost: new Date(frostDates.lastSpringFrost.getTime()
        - extensionDays * 86400000
        + experienceBufferDays * 86400000),
      firstFallFrost: new Date(frostDates.firstFallFrost.getTime()
        + extensionDays * 86400000
        - experienceBufferDays * 86400000),
      frostFreeDays: frostDates.frostFreeDays + (extensionDays * 2) - (experienceBufferDays * 2),
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
  }, [selectedCrops, frostDates, seasonExtension, lunarSync, experienceLevel]);

  // Persist crop selection to localStorage so caloric-security can import it
  useEffect(() => {
    if (selectedCrops.length > 0) {
      localStorage.setItem('hl_planting_selection', JSON.stringify({
        crops: selectedCrops,
        savedAt: Date.now(),
      }));
    }
  }, [selectedCrops]);

  // Auto-show email capture once per session after first schedule is generated
  useEffect(() => {
    if (plantingDates.length > 0 && !sessionStorage.getItem('planting_email_shown')) {
      const t = setTimeout(() => {
        setShowEmailCapture(true);
        sessionStorage.setItem('planting_email_shown', 'true');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [plantingDates.length]);

  const handleEmailSubmit = useCallback(async (email: string) => {
    setIsSubmitting(true);
    setIsEmailError(false);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          type: "planting-reminders",
          metadata: {
            zip: frostDates?.zipCode,
            crops: selectedCrops
              .map(sc => getCropById(sc.cropId)?.name)
              .filter(Boolean)
              .slice(0, 5),
            frostDate: frostDates?.lastSpringFrost.toISOString().split('T')[0],
            experienceLevel,
          },
        }),
      });
      if (!res.ok) throw new Error("Subscribe failed");
      setIsSuccess(true);
      setTimeout(() => {
        setShowEmailCapture(false);
        setIsSuccess(false);
      }, 3000);
    } catch {
      setIsEmailError(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [frostDates, selectedCrops, experienceLevel]);

  const caloricSummary = useMemo(() => {
    if (!frostDates) return null;

    const crops = selectedCrops
      .map(sc => {
        const crop = getCropById(sc.cropId);
        if (!crop) return null;
        const quantity = sc.quantity ?? 1;
        const result = calculateCropYield(crop, quantity, 1.0);
        if (!result) return null;
        return {
          cropName: crop.name,
          icon: crop.icon,
          quantity,
          totalKcal: Math.round(result.totalKcal),
        };
      })
      .filter(Boolean) as { cropName: string; icon: string; quantity: number; totalKcal: number }[];

    const totalKcal = crops.reduce((sum, c) => sum + c.totalKcal, 0);
    const daysOfFood = Math.round(totalKcal / 2000);

    return { crops, totalKcal, daysOfFood };
  }, [selectedCrops, frostDates]);

  const hasCalendarData = frostDates && selectedCrops.length > 0;

  return (
    <FieldStationLayout stationId="HL_PLANT_CAL_V2.1">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b-2 border-border-primary pb-6 print:hidden">
          <div>
            <Typography variant="h1" className="mb-1 uppercase tracking-tight font-mono text-2xl md:text-4xl">Planting_Calendar</Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Succession planting // Frost dates via NOAA
            </Typography>
          </div>
          
          <div />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative print:block">
          <Marginalia className="hidden xl:block -left-32 top-60 w-48 text-center opacity-30 print:hidden">
            Start seeds indoors 6–8 weeks before last frost
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

                <BrutalistBlock className="p-4 border-dashed border-border-primary/30" variant="default" refTag="EXP_LEVEL">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
                      <Gauge size={16} className="text-accent/70" />
                    </div>
                    <div>
                      <Typography variant="h4" className="mb-0 text-xs uppercase tracking-tighter">Experience Level</Typography>
                      <Typography variant="small" className="opacity-40 text-[8px] uppercase font-mono mb-0">Adjusts planting date buffers</Typography>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((level) => {
                      const labels = { beginner: '+7d safe', intermediate: '+3d buffer', advanced: 'exact' };
                      return (
                        <button
                          key={level}
                          onClick={() => setExperienceLevel(level)}
                          className={`py-1.5 px-1 border-2 text-[8px] font-mono font-bold uppercase tracking-tight transition-colors ${
                            experienceLevel === level
                              ? 'border-accent bg-accent/10 text-accent'
                              : 'border-border-primary/20 bg-black/10 opacity-40 hover:opacity-70'
                          }`}
                        >
                          <div>{level.slice(0, 3).toUpperCase()}</div>
                          <div className="opacity-60 normal-case font-normal">{labels[level]}</div>
                        </button>
                      );
                    })}
                  </div>
                </BrutalistBlock>

                <BrutalistBlock className="p-4 border-dashed border-border-primary/30" variant="default" refTag="LUNAR_SYNC">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
                        <Moon size={16} className="text-yellow-200/70" />
                      </div>
                      <div>
                        <Typography variant="h4" className="mb-0 text-xs uppercase tracking-tighter">Lunar Planting</Typography>
                        <Typography variant="small" className="opacity-40 text-[8px] uppercase font-mono mb-0">Align to lunar phases</Typography>
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
                  frostDates={adjustedFrostDates ?? frostDates}
                />
              </>
            )}

            <BrutalistBlock className="p-5 border-dashed border-border-primary/30" refTag="SYS_LOG_V2">
              <Typography variant="h4" className="text-xs flex items-center gap-2 mb-4 uppercase tracking-widest font-mono opacity-40">
                <FileText size={14} /> Technical_Specs
              </Typography>
              <ul className="text-[11px] space-y-2 opacity-60 font-mono uppercase tracking-tighter">
                <li className="flex gap-2"><span>[•]</span> <span>Succession planting active</span></li>
                <li className="flex gap-2"><span>[•]</span> <span>Days to maturity calibrated</span></li>
                <li className="flex gap-2"><span>[•]</span> <span>Works offline</span></li>
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
                    <DymoLabel className="text-xs">Calendar Ready</DymoLabel>
                    <div className="h-[2px] flex-grow max-w-[200px] bg-border-primary/20" />
                  </div>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-3 py-1.5 border-2 border-border-primary hover:border-accent hover:text-accent transition-colors text-xs font-bold font-mono uppercase bg-black/20"
                  >
                    <Printer size={12} />
                    Print
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
                  caloricSummary={caloricSummary}
                />
              </div>
            ) : (
              <BrutalistBlock className="p-16 text-center bg-black/20 border-2 border-dashed border-border-primary/20" variant="default">
                <div className="max-w-xs mx-auto">
                  <Sprout size={64} className="mx-auto mb-8 opacity-10 text-accent animate-pulse" />
                  <Typography variant="h3" className="mb-4 uppercase tracking-tighter opacity-40 italic">Enter your ZIP code to start</Typography>
                  <Typography variant="body" className="opacity-30 text-xs uppercase font-mono leading-relaxed mb-0">
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
          isError={isEmailError}
        />

        <FieldStationBridge currentOps="PLANT" />

      </div>
    </FieldStationLayout>
  );
}
