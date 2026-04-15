"use client";

import { useState } from "react";
import { Check, Sprout, Settings2, ChevronDown } from "lucide-react";
import { Crop, SelectedCrop, FrostDates } from "@/lib/tools/planting-calendar/types";
import { getAllCrops } from "@/lib/tools/planting-calendar/crops";
import { calculateMaxSuccessionPlantings } from "@/lib/tools/planting-calendar/plantingCalculations";
import Typography from "@/components/ui/Typography";
import BrutalistBlock from "@/components/ui/BrutalistBlock";

interface CropSelectorProps {
  selectedCrops: SelectedCrop[];
  onCropsChange: (crops: SelectedCrop[]) => void;
  maxCrops?: number;
  frostDates?: FrostDates | null;
}

const CATEGORY_COLORS: Record<string, { border: string; badge: string }> = {
  vegetable: { border: 'border-l-green-500',  badge: 'text-green-500/70'  },
  herb:      { border: 'border-l-teal-400',   badge: 'text-teal-400/70'   },
  fruit:     { border: 'border-l-rose-400',   badge: 'text-rose-400/70'   },
};

const CATEGORY_ORDER = ['vegetable', 'herb', 'fruit'];
const CATEGORY_LABELS: Record<string, string> = {
  vegetable: 'Vegetables',
  herb: 'Herbs',
  fruit: 'Fruits',
};

export default function CropSelector({
  selectedCrops,
  onCropsChange,
  maxCrops = 30,
  frostDates,
}: CropSelectorProps) {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const allCrops = getAllCrops();

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const grouped = allCrops.reduce((acc, crop) => {
    if (!acc[crop.category]) acc[crop.category] = [];
    acc[crop.category].push(crop);
    return acc;
  }, {} as Record<string, Crop[]>);

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

  const updateSuccessionInterval = (cropId: string, weeks: number) => {
    onCropsChange(
      selectedCrops.map(sc =>
        sc.cropId === cropId ? { ...sc, successionInterval: weeks } : sc
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
            <Sprout size={20} className="text-green-500" />
          </div>
          <div>
            <Typography variant="h4" className="mb-0 uppercase tracking-tighter">Crop Selection</Typography>
            <Typography variant="small" className="opacity-40 text-[9px] uppercase font-mono mb-0">{selectedCrops.length} of {maxCrops} selected</Typography>
          </div>
        </div>
      </div>

      {/* Category accordions */}
      <div className="mb-6">
        {CATEGORY_ORDER.map(cat => {
          const crops = grouped[cat] ?? [];
          const isOpen = openCategories.has(cat);
          const selectedCount = crops.filter(c => selectedCrops.find(sc => sc.cropId === c.id)).length;
          const colors = CATEGORY_COLORS[cat] ?? { border: 'border-l-border-primary', badge: 'opacity-40' };

          return (
            <div key={cat} className="mb-4">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between px-2 py-1.5 mb-2 border-b border-border-primary/20 group"
              >
                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${colors.badge}`}>
                  {CATEGORY_LABELS[cat]}
                  {selectedCount > 0 && <span className="ml-2 opacity-60">({selectedCount})</span>}
                </span>
                <ChevronDown size={12} className={`opacity-40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Crop grid */}
              {isOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                  {crops.map((crop) => {
                    const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
                    const isExpanded = expandedCrop === crop.id;

                    return (
                      <div key={crop.id} className="space-y-1">
                        <button
                          onClick={() => toggleCrop(crop)}
                          className={`w-full p-3 border-2 border-l-4 transition-all flex items-center justify-between group ${colors.border} ${
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
                              <div className={`text-[8px] font-mono uppercase truncate ${colors.badge}`}>{crop.category}</div>
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
                              <label className="text-[8px] font-mono font-bold uppercase opacity-40 block mb-2 tracking-widest">Variety</label>
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
                              <div className="space-y-2">
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
                                    Succession planting
                                  </span>
                                </label>

                                {isSelected.successionEnabled && (
                                  <div className="pl-11 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <label className="text-[8px] font-mono uppercase opacity-40 whitespace-nowrap">Every</label>
                                      <select
                                        value={isSelected.successionInterval ?? crop.successionInterval}
                                        onChange={(e) => updateSuccessionInterval(crop.id, Number(e.target.value))}
                                        className="text-xs font-mono bg-black/40 border-2 border-border-primary/30 px-2 py-1 outline-none focus:border-accent uppercase"
                                      >
                                        {[1, 2, 3, 4].map(w => (
                                          <option key={w} value={w} className="bg-background-primary">{w}w</option>
                                        ))}
                                      </select>
                                    </div>
                                    {frostDates && (() => {
                                      const interval = isSelected.successionInterval ?? crop.successionInterval;
                                      const variety = crop.varieties.find(v => v.id === isSelected.varietyId) ?? crop.varieties[0];
                                      const count = calculateMaxSuccessionPlantings(
                                        crop, variety,
                                        frostDates.lastSpringFrost,
                                        frostDates.firstFallFrost,
                                        interval
                                      );
                                      return (
                                        <p className="text-[8px] font-mono opacity-40 uppercase">
                                          → {count} sow {count === 1 ? 'window' : 'windows'} this season
                                        </p>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
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
                                  Already Started
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
                                    {crop.startIndoors !== null && <option value="start-indoors" className="bg-background-primary">Start Indoors</option>}
                                    {crop.transplant !== null    && <option value="transplant"    className="bg-background-primary">Transplant</option>}
                                    {crop.directSow !== null     && <option value="direct-sow"    className="bg-background-primary">Direct Sow</option>}
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
              )}
            </div>
          );
        })}
      </div>

      {selectedCrops.length >= maxCrops && (
        <div className="p-3 border-2 border-orange-500 bg-orange-500/10 text-orange-500 text-[9px] font-mono font-bold uppercase flex items-center gap-2">
          <span>⚠</span> Crop limit reached
        </div>
      )}
    </BrutalistBlock>
  );
}
