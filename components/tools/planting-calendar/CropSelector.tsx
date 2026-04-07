"use client";

import { useState } from "react";
import { Check, Box, Settings2 } from "lucide-react";
import { Crop, SelectedCrop } from "@/lib/tools/planting-calendar/types";
import { getAllCrops } from "@/lib/tools/planting-calendar/crops";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";

interface CropSelectorProps {
  selectedCrops: SelectedCrop[];
  onCropsChange: (crops: SelectedCrop[]) => void;
  maxCrops?: number;
}

export default function CropSelector({ 
  selectedCrops, 
  onCropsChange,
  maxCrops = 30
}: CropSelectorProps) {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const allCrops = getAllCrops();

  const toggleCrop = (crop: Crop) => {
    const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
    
    if (isSelected) {
      onCropsChange(selectedCrops.filter(sc => sc.cropId !== crop.id));
    } else if (selectedCrops.length < maxCrops) {
      onCropsChange([
        ...selectedCrops,
        {
          cropId: crop.id,
          varietyId: crop.varieties[0].id,
          successionEnabled: crop.successionEnabled,
          successionInterval: crop.successionInterval,
          quantity: 1
        }
      ]);
    }
  };

  const updateVariety = (cropId: string, varietyId: string) => {
    onCropsChange(
      selectedCrops.map(sc => 
        sc.cropId === cropId ? { ...sc, varietyId } : sc
      )
    );
  };

  const toggleSuccession = (cropId: string) => {
    onCropsChange(
      selectedCrops.map(sc =>
        sc.cropId === cropId
          ? { ...sc, successionEnabled: !sc.successionEnabled }
          : sc
      )
    );
  };

  const updateQuantity = (cropId: string, quantity: number) => {
    onCropsChange(
      selectedCrops.map(sc =>
        sc.cropId === cropId ? { ...sc, quantity: Math.max(1, quantity) } : sc
      )
    );
  };

  const updateActualActionDate = (
    cropId: string,
    value: SelectedCrop['actualActionDate']
  ) => {
    onCropsChange(
      selectedCrops.map(sc =>
        sc.cropId === cropId ? { ...sc, actualActionDate: value } : sc
      )
    );
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <BrutalistBlock className="p-6" variant="default" refTag="INV_MANIFEST_01">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-background-secondary border-2 border-border-primary flex items-center justify-center shrink-0">
            <Box size={20} className="text-accent opacity-60" />
          </div>
          <div>
            <Typography variant="h4" className="mb-0 uppercase tracking-tighter">Inventory_Selection</Typography>
            <Typography variant="small" className="opacity-40 text-[9px] uppercase font-mono mb-0">Payload_Capacity: {selectedCrops.length}/{maxCrops}</Typography>
          </div>
        </div>
      </div>

      {/* Crop Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 mb-6">
        {allCrops.map((crop) => {
          const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
          const isExpanded = expandedCrop === crop.id;
          
          return (
            <div key={crop.id} className="space-y-1">
              <button
                onClick={() => toggleCrop(crop)}
                className={`w-full p-3 border-2 transition-all flex items-center justify-between group ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-border-primary/20 hover:border-border-primary/60 bg-black/10"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0 opacity-80 group-hover:scale-110 transition-transform">{crop.icon}</span>
                  <div className="text-left min-w-0">
                    <div className={`text-xs font-bold uppercase truncate ${isSelected ? 'text-accent' : 'opacity-60'}`}>
                      {crop.name}
                    </div>
                    <div className="text-[8px] font-mono opacity-30 uppercase truncate">{crop.category}</div>
                  </div>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-4 h-4 bg-accent flex items-center justify-center">
                      <Check size={10} className="text-white" />
                    </div>
                    <div 
                      onClick={(e) => { e.stopPropagation(); setExpandedCrop(isExpanded ? null : crop.id); }}
                      className="p-1 hover:bg-accent/20 transition-colors"
                    >
                      <Settings2 size={12} className="opacity-40" />
                    </div>
                  </div>
                )}
              </button>
              
              {/* Expanded options */}
              {isExpanded && isSelected && (
                <div className="border-x-2 border-b-2 border-accent/20 p-4 bg-accent/5 animate-in slide-in-from-top-2 duration-200">
                  <div className="mb-4">
                    <label className="text-[8px] font-mono font-bold uppercase opacity-40 block mb-2 tracking-widest">Select_Variety</label>
                    <select
                      value={isSelected.varietyId}
                      onChange={(e) => updateVariety(crop.id, e.target.value)}
                      className="w-full text-xs font-mono bg-black/40 border-2 border-border-primary/30 px-2 py-2 outline-none focus:border-accent uppercase"
                    >
                      {crop.varieties.map(variety => (
                        <option key={variety.id} value={variety.id} className="bg-background-primary">
                          {variety.name} ({variety.daysToMaturity}D_MAT)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="text-[8px] font-mono font-bold uppercase opacity-40 block mb-2 tracking-widest">Plants</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={isSelected.quantity ?? 1}
                      onChange={(e) => updateQuantity(crop.id, parseInt(e.target.value) || 1)}
                      className="w-20 text-xs font-mono bg-black/40 border-2 border-border-primary/30 px-2 py-2 outline-none focus:border-accent"
                    />
                  </div>

                  {crop.successionEnabled && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isSelected.successionEnabled}
                          onChange={() => toggleSuccession(crop.id)}
                          className="sr-only"
                        />
                        <div className={`w-8 h-4 border-2 transition-colors ${isSelected.successionEnabled ? 'bg-accent border-accent' : 'border-border-primary/30 bg-black/20'}`}>
                          <div className={`absolute top-0.5 w-2 h-2 bg-white transition-all ${isSelected.successionEnabled ? 'left-[1.1rem]' : 'left-0.5'}`} />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                        Succession_Loop ({crop.successionInterval}W)
                      </span>
                    </label>
                  )}

                  {/* Actual date anchoring */}
                  <div className="pt-3 border-t border-border-primary/10">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={!!isSelected.actualActionDate}
                          onChange={e => {
                            if (!e.target.checked) {
                              updateActualActionDate(crop.id, undefined);
                            } else {
                              // Default to first available anchor action
                              const firstAction = crop.startIndoors !== null
                                ? 'start-indoors'
                                : crop.transplant !== null
                                  ? 'transplant'
                                  : 'direct-sow';
                              updateActualActionDate(crop.id, { action: firstAction as 'start-indoors' | 'transplant' | 'direct-sow', date: todayIso });
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-8 h-4 border-2 transition-colors ${isSelected.actualActionDate ? 'bg-accent border-accent' : 'border-border-primary/30 bg-black/20'}`}>
                          <div className={`absolute top-0.5 w-2 h-2 bg-white transition-all ${isSelected.actualActionDate ? 'left-[1.1rem]' : 'left-0.5'}`} />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                        Already_Started
                      </span>
                    </label>

                    {isSelected.actualActionDate && (
                      <div className="mt-3 space-y-2 pl-11">
                        <select
                          value={isSelected.actualActionDate.action}
                          onChange={e => updateActualActionDate(crop.id, {
                            ...isSelected.actualActionDate!,
                            action: e.target.value as 'start-indoors' | 'transplant' | 'direct-sow',
                          })}
                          className="w-full text-xs font-mono bg-black/40 border-2 border-border-primary/30 px-2 py-1.5 outline-none focus:border-accent uppercase"
                        >
                          {crop.startIndoors !== null && <option value="start-indoors" className="bg-background-primary">Start_Indoors</option>}
                          {crop.transplant !== null    && <option value="transplant"    className="bg-background-primary">Transplant</option>}
                          {crop.directSow !== null     && <option value="direct-sow"    className="bg-background-primary">Direct_Sow</option>}
                        </select>
                        <input
                          type="date"
                          max={todayIso}
                          value={isSelected.actualActionDate.date}
                          onChange={e => updateActualActionDate(crop.id, {
                            ...isSelected.actualActionDate!,
                            date: e.target.value,
                          })}
                          className="w-full text-xs font-mono bg-black/40 border-2 border-border-primary/30 px-2 py-1.5 outline-none focus:border-accent"
                        />
                        <p className="text-[8px] font-mono opacity-30 uppercase">
                          All harvest + succession dates shift to match.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedCrops.length >= maxCrops && (
        <div className="p-3 border-2 border-orange-500 bg-orange-500/10 text-orange-500 text-[9px] font-mono font-bold uppercase flex items-center gap-2">
          <span>⚠</span> CAPACITY_REACHED
        </div>
      )}
    </BrutalistBlock>
  );
}
