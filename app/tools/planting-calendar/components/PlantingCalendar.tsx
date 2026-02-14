"use client";

import { PlantingDate, FrostDates } from "../types";
import { 
  formatPlantingDate, 
  getActionLabel, 
  getActionColor,
  groupDatesByMonth,
  sortDatesByDate 
} from "../lib/plantingCalculations";
import { getCropById } from "../lib/crops";
import { Calendar, MapPin } from "lucide-react";

interface PlantingCalendarProps {
  dates: PlantingDate[];
  frostDates: FrostDates;
  onEmailCapture: () => void;
}

export default function PlantingCalendar({ 
  dates, 
  frostDates,
  onEmailCapture 
}: PlantingCalendarProps) {
  // Sort and group dates
  const sortedDates = sortDatesByDate(dates);
  const groupedByMonth = groupDatesByMonth(sortedDates);
  
  // Convert map to sorted array
  const months = Array.from(groupedByMonth.entries()).sort((a, b) => {
    const dateA = a[1][0]?.date || new Date();
    const dateB = b[1][0]?.date || new Date();
    return dateA.getTime() - dateB.getTime();
  });

  // Get unique crops for summary
  const uniqueCrops = [...new Set(dates.map(d => d.cropId))];

  if (dates.length === 0) {
    return (
      <div className="brutalist-block p-6 text-center">
        <Calendar size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-sm opacity-60">Select crops to generate your planting calendar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="brutalist-block p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Your Planting Calendar</h3>
            <p className="text-xs text-theme-secondary flex items-center gap-1">
              <MapPin size={10} />
              {frostDates.zipCode} | Zone {frostDates.growingZone}
            </p>
          </div>
        </div>

        {/* Frost Dates Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border border-theme-main/30 p-2 text-center">
            <div className="text-[9px] uppercase opacity-60">Last Frost</div>
            <div className="text-sm font-bold">
              {frostDates.lastSpringFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="border border-theme-main/30 p-2 text-center">
            <div className="text-[9px] uppercase opacity-60">First Frost</div>
            <div className="text-sm font-bold">
              {frostDates.firstFallFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
          <div className="border border-theme-main/30 p-2 text-center">
            <div className="text-[9px] uppercase opacity-60">Growing Season</div>
            <div className="text-sm font-bold">{frostDates.frostFreeDays} days</div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="opacity-60">Crops Planned:</span>
            <span className="font-bold">{uniqueCrops.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Total Actions:</span>
            <span className="font-bold">{dates.length}</span>
          </div>
        </div>
      </div>

      {/* Monthly Calendar */}
      <div className="space-y-4">
        {months.map(([month, monthDates]) => (
          <div key={month} className="brutalist-block p-4">
            <h4 className="font-bold text-sm uppercase mb-3 border-b border-theme-main/30 pb-2">
              {month}
            </h4>
            <div className="space-y-2">
              {monthDates.map((date, idx) => {
                const crop = getCropById(date.cropId);
                return (
                  <div 
                    key={`${date.cropId}-${date.action}-${idx}`}
                    className="flex items-center gap-3 p-2 bg-theme-sub/30 border border-theme-main/20"
                  >
                    {/* Date */}
                    <div className="text-xs font-mono min-w-[80px]">
                      {formatPlantingDate(date.date)}
                    </div>
                    
                    {/* Icon */}
                    <div className="text-lg">{crop?.icon}</div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">
                        {date.cropName}
                        {date.successionNumber && (
                          <span className="text-[10px] opacity-60 ml-1">
                            (#{date.successionNumber})
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] opacity-60 truncate">
                        {date.varietyName}
                      </div>
                    </div>
                    
                    {/* Action Badge */}
                    <div className={`text-[9px] px-2 py-1 text-white ${getActionColor(date.action)}`}>
                      {date.action === 'start-indoors' && '🌱'}
                      {date.action === 'transplant' && '🚜'}
                      {date.action === 'direct-sow' && '🌾'}
                      {date.action === 'harvest' && '✂️'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Email Capture CTA */}
      <div className="brutalist-block border-[var(--accent)] p-6 text-center">
        <h4 className="font-bold text-lg mb-2">📧 Never Miss a Planting Date</h4>
        <p className="text-xs opacity-70 mb-4">
          Get weekly reminders: "Start your tomatoes this week" or "Direct sow lettuce now"
        </p>
        <button
          onClick={onEmailCapture}
          className="px-6 py-3 bg-[var(--accent)] text-white font-bold uppercase text-sm hover:brightness-110 transition-all"
        >
          Get Weekly Reminders
        </button>
        <p className="text-[10px] opacity-50 mt-3">
          Free • Unsubscribe anytime • Customized for {frostDates.zipCode}
        </p>
      </div>
    </div>
  );
}
