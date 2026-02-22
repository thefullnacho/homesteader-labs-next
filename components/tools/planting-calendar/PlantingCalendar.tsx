"use client";

import React from 'react';
import { PlantingDate, FrostDates } from "@/lib/tools/planting-calendar/types";
import { 
  groupDatesByMonth,
  sortDatesByDate 
} from "@/lib/tools/planting-calendar/plantingCalculations";
import { getCropById } from "@/lib/tools/planting-calendar/crops";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import DymoLabel from "@/components/ui/DymoLabel";

interface PlantingCalendarProps {
  dates: PlantingDate[];
  frostDates: FrostDates;
  onEmailCapture: () => void;
}

const ActionMap: Record<string, string> = {
  'start-indoors': 'START_IN',
  'transplant': 'TRANS_PL',
  'direct-sow': 'DIR_SOW',
  'harvest': 'HARV_EST',
};

export default function PlantingCalendar({ 
  dates, 
  frostDates,
  onEmailCapture 
}: PlantingCalendarProps) {
  const sortedDates = sortDatesByDate(dates);
  const groupedByMonth = groupDatesByMonth(sortedDates);
  
  const months = Array.from(groupedByMonth.entries()).sort((a, b) => {
    const dateA = a[1][0]?.date || new Date();
    const dateB = b[1][0]?.date || new Date();
    return dateA.getTime() - dateB.getTime();
  });

  const uniqueCropsCount = new Set(dates.map(d => d.cropId)).size;

  if (dates.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* MISSION PARAMETERS */}
      <BrutalistBlock className="p-6 bg-background-primary/40 border-accent/20" variant="default" refTag="LOC_ZONE_DATA">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-accent/10 border-2 border-accent flex items-center justify-center shrink-0">
              <Calendar size={24} className="text-accent" />
            </div>
            <div>
              <Typography variant="h3" className="mb-1 tracking-tighter">PLANTING_TIMELINE_V2</Typography>
              <div className="flex items-center gap-3 text-[10px] font-mono opacity-50 uppercase tracking-widest">
                <span className="flex items-center gap-1"><MapPin size={10} className="text-accent" /> {frostDates.zipCode}</span>
                <span>{"//"}</span>
                <span>ZONE_{frostDates.growingZone}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-grow max-w-xl">
            <div className="border-l-2 border-border-primary/30 pl-3">
              <Typography variant="small" className="text-[8px] opacity-40 uppercase mb-1 font-mono">Last_Spring_Frost</Typography>
              <Typography variant="h4" className="mb-0 text-xs font-mono">
                {frostDates.lastSpringFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
              </Typography>
            </div>
            <div className="border-l-2 border-border-primary/30 pl-3">
              <Typography variant="small" className="text-[8px] opacity-40 uppercase mb-1 font-mono">First_Fall_Frost</Typography>
              <Typography variant="h4" className="mb-0 text-xs font-mono">
                {frostDates.firstFallFrost.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
              </Typography>
            </div>
            <div className="border-l-2 border-border-primary/30 pl-3">
              <Typography variant="small" className="text-[8px] opacity-40 uppercase mb-1 font-mono">Growth_Window</Typography>
              <Typography variant="h4" className="mb-0 text-xs font-mono">{frostDates.frostFreeDays}_DAYS</Typography>
            </div>
          </div>
        </div>
      </BrutalistBlock>

      {/* DEPLOYMENT LOG */}
      <div className="space-y-6">
        {months.map(([month, monthDates]) => (
          <div key={month} className="relative pl-8 border-l-2 border-border-primary/20">
            {/* Timeline Marker */}
            <div className="absolute -left-[9px] top-0 w-4 h-4 bg-background-primary border-2 border-accent rounded-full z-10" />
            
            <div className="mb-4 flex items-center gap-4">
              <DymoLabel className="text-[9px] px-4">{month.toUpperCase()}_LOG</DymoLabel>
              <div className="h-px flex-grow bg-border-primary/10" />
            </div>

            <div className="grid gap-3">
              {monthDates.map((date, idx) => {
                const crop = getCropById(date.cropId);
                return (
                  <div 
                    key={`${date.cropId}-${date.action}-${idx}`}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-black/20 border-2 border-border-primary/30 hover:border-accent/50 transition-all"
                  >
                    {/* Timestamp */}
                    <div className="flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-0 min-w-[100px] border-r-2 border-border-primary/10 pr-4">
                      <span className="text-xs font-bold font-mono text-accent">
                        {new Date(date.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className="text-[8px] font-mono opacity-30 uppercase">CYCLE_ENTRY</span>
                    </div>
                    
                    {/* Crop Identity */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-background-secondary border border-border-primary flex items-center justify-center text-xl shrink-0">
                        {crop?.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold uppercase tracking-tight truncate">{date.cropName}</span>
                          {date.successionNumber && (
                            <Badge variant="outline" className="text-[7px] py-0 px-1 opacity-40 italic">SEQ_{date.successionNumber}</Badge>
                          )}
                        </div>
                        <div className="text-[9px] font-mono opacity-40 uppercase truncate">
                          {date.varietyName} {"//"} {crop?.category}
                        </div>
                      </div>
                    </div>
                    
                    {/* Tactical Action */}
                    <div className="flex items-center gap-3 sm:justify-end">
                      <div className="text-right hidden md:block">
                        <div className="text-[8px] font-mono opacity-30 uppercase">Protocol</div>
                        <div className="text-[10px] font-bold font-mono tracking-tighter opacity-60 uppercase">{date.action.replace('-', '_')}</div>
                      </div>
                      <div className={`px-3 py-1.5 font-mono text-[10px] font-bold border-2 ${getActionStyle(date.action)}`}>
                        {ActionMap[date.action]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* EXPORT / ALERT COMMANDS */}
      <BrutalistBlock className="p-8 border-accent bg-accent/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left" refTag="ALRT_SRVC_01">
        <div className="space-y-2">
          <Typography variant="h3" className="mb-0 flex items-center justify-center md:justify-start gap-3 uppercase tracking-tighter">
            <TrendingUp size={20} className="text-accent" /> 
            Active_Monitoring_Protocol
          </Typography>
          <Typography variant="body" className="text-xs opacity-70 mb-0 uppercase font-mono max-w-md">
            Initialize weekly transmission cycle for {uniqueCropsCount} selected crops. 
            Receive critical sequence alerts customized for {frostDates.zipCode}.
          </Typography>
        </div>
        <Button
          onClick={onEmailCapture}
          variant="primary"
          size="lg"
          className="w-full md:w-auto shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
        >
          EXEC_INIT_REMINDERS
        </Button>
      </BrutalistBlock>
    </div>
  );
}

function getActionStyle(action: string): string {
  switch (action) {
    case 'start-indoors': return 'border-blue-500/50 text-blue-400 bg-blue-500/5';
    case 'transplant': return 'border-orange-500/50 text-orange-400 bg-orange-500/5';
    case 'direct-sow': return 'border-green-500/50 text-green-400 bg-green-500/5';
    case 'harvest': return 'border-purple-500/50 text-purple-400 bg-purple-500/5';
    default: return 'border-border-primary text-foreground-secondary';
  }
}
