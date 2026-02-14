"use client";

import { useState, useCallback, useMemo } from "react";
import { Sprout, FileText, Download } from "lucide-react";
import LocationSetup from "./components/LocationSetup";
import CropSelector from "./components/CropSelector";
import PlantingCalendar from "./components/PlantingCalendar";
import PlantingEmailCapture from "./components/PlantingEmailCapture";
import useFrostDates from "./hooks/useFrostDates";
import { Crop, FrostDates, SelectedCrop, PlantingDate } from "./types";
import { getCropById } from "./lib/crops";
import { calculateCropSchedule } from "./lib/plantingCalculations";

export default function PlantingCalendarPage() {
  const { frostDates, loading, error, lookupFrostDates } = useFrostDates();
  const [selectedCrops, setSelectedCrops] = useState<SelectedCrop[]>([]);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Calculate all planting dates
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

  const handleLocationSet = useCallback((dates: FrostDates) => {
    // Location is set via the hook
  }, []);

  const handleEmailSubmit = useCallback(async (email: string) => {
    setIsSubmitting(true);
    
    // Simulate API call - integrate with ConvertKit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Email captured:", email, {
      zipCode: frostDates?.zipCode,
      crops: selectedCrops.map(sc => sc.cropId),
      source: "planting-calendar"
    });
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Hide after 3 seconds
    setTimeout(() => {
      setShowEmailCapture(false);
      setIsSuccess(false);
    }, 3000);
  }, [frostDates, selectedCrops]);

  const hasCalendarData = frostDates && selectedCrops.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase flex items-center gap-2">
              <Sprout size={24} className="text-[var(--accent)]" />
              Seed Planting Calendar
            </h1>
            <p className="text-xs text-theme-secondary mt-1">
              Personalized planting schedule based on your frost dates • Succession planting calculator
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-[10px] text-theme-secondary text-right">
            <p>NOAA FROST DATA • ZIP CODE PRECISE</p>
            <p>OFFLINE-CAPABLE • FREE TOOL</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Setup */}
        <div className="lg:col-span-1 space-y-4">
          {/* Step 1: Location */}
          <LocationSetup
            onLocationSet={handleLocationSet}
            loading={loading}
            error={error}
            onLookup={lookupFrostDates}
          />

          {/* Step 2: Crop Selection (only show after location set) */}
          {frostDates && (
            <CropSelector
              selectedCrops={selectedCrops}
              onCropsChange={setSelectedCrops}
              maxCrops={10}
            />
          )}

          {/* Info Box */}
          <div className="brutalist-block p-4 border-dashed border-theme-main/50">
            <h4 className="text-xs font-bold uppercase mb-2 flex items-center gap-2">
              <FileText size={14} />
              Why This Calendar?
            </h4>
            <ul className="text-[10px] opacity-70 space-y-1">
              <li>• Zip-code precise (not just USDA zones)</li>
              <li>• Accounts for succession planting</li>
              <li>• Variety-specific maturity dates</li>
              <li>• "Too late to plant" warnings</li>
              <li>• Works offline after setup</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="lg:col-span-2">
          {hasCalendarData ? (
            <PlantingCalendar
              dates={plantingDates}
              frostDates={frostDates}
              onEmailCapture={() => setShowEmailCapture(true)}
            />
          ) : (
            <div className="brutalist-block p-12 text-center">
              {!frostDates ? (
                <>
                  <Sprout size={48} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-bold mb-2">Enter Your Location First</h3>
                  <p className="text-sm opacity-60 mb-4">
                    We'll use your zip code to find your exact frost dates
                  </p>
                  <div className="text-[10px] opacity-40">
                    <p>Based on NOAA 30-year climate normals</p>
                    <p>More accurate than broad USDA zones</p>
                  </div>
                </>
              ) : (
                <>
                  <Sprout size={48} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-bold mb-2">Select Your Crops</h3>
                  <p className="text-sm opacity-60 mb-4">
                    Choose up to 10 crops to build your personalized planting calendar
                  </p>
                  <div className="text-[10px] opacity-40">
                    <p>20 crops available • 2-3 varieties each</p>
                    <p>Succession planting options included</p>
                  </div>
                </>
              )}
            </div>
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
      <div className="mt-8 text-center text-[10px] opacity-40">
        <p>
          Data source: NOAA Climate Normals • Accuracy: ±7-10 days depending on microclimate • 
          For best results, confirm with local extension office
        </p>
      </div>
    </div>
  );
}
