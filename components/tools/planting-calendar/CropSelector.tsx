"use client";

import { useState } from "react";
import { Check, Settings2, ChevronDown } from "lucide-react";
import { Crop, SelectedCrop, FrostDates } from "@/lib/tools/planting-calendar/types";
import { getAllCrops } from "@/lib/tools/planting-calendar/crops";
import { calculateMaxSuccessionPlantings } from "@/lib/tools/planting-calendar/plantingCalculations";

interface CropSelectorProps {
  selectedCrops: SelectedCrop[];
  onCropsChange: (crops: SelectedCrop[]) => void;
  maxCrops?: number;
  frostDates?: FrostDates | null;
}

const CATEGORY_ORDER = ["vegetable", "herb", "fruit"];
const CATEGORY_LABELS: Record<string, string> = {
  vegetable: "Vegetables",
  herb: "Herbs",
  fruit: "Fruits",
};

const inputCls =
  "font-mono text-xs bg-paper border-2 border-ink/40 px-2 py-1.5 outline-none focus:border-marker transition-colors";

export default function CropSelector({
  selectedCrops,
  onCropsChange,
  maxCrops = 30,
  frostDates,
}: CropSelectorProps) {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["vegetable"]));
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
    <div className="card-paper grain p-5">
      <div className="flex items-baseline justify-between border-b-2 border-ink pb-2 mb-4 relative z-[2]">
        <h3 className="font-display uppercase text-lg">Pick your crops</h3>
        <span className="font-mono text-[0.66rem] uppercase tracking-widest text-ink/50">
          {selectedCrops.length} of {maxCrops}
        </span>
      </div>

      {/* Category drawers */}
      <div className="relative z-[2]">
        {CATEGORY_ORDER.map(cat => {
          const crops = grouped[cat] ?? [];
          const isOpen = openCategories.has(cat);
          const selectedCount = crops.filter(c => selectedCrops.find(sc => sc.cropId === c.id)).length;

          return (
            <div key={cat} className="mb-4 last:mb-0">
              <button
                onClick={() => toggleCategory(cat)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between py-1.5 mb-2 border-b border-ink/30 group"
              >
                <span className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.18em] group-hover:text-marker transition-colors">
                  {CATEGORY_LABELS[cat]}
                  <span className="ml-2 text-ink/50 font-normal">
                    {selectedCount > 0 ? `${selectedCount} picked · ` : ""}{crops.length} on file
                  </span>
                </span>
                <ChevronDown
                  size={13}
                  className={`text-ink/50 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="grid grid-cols-2 gap-2">
                  {crops.map((crop) => {
                    const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
                    const isExpanded = expandedCrop === crop.id;

                    return (
                      <div key={crop.id} className={isExpanded && isSelected ? "col-span-2" : ""}>
                        <button
                          onClick={() => toggleCrop(crop)}
                          className={`w-full px-3 py-2 border-2 transition-colors flex items-center justify-between gap-2 ${
                            isSelected
                              ? "border-ink bg-ink text-paper"
                              : "border-ink/30 hover:border-ink bg-paper"
                          }`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="shrink-0">{crop.icon}</span>
                            <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wide truncate">
                              {crop.name}
                            </span>
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1.5 shrink-0">
                              <Check size={12} />
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={`Adjust ${crop.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCrop(isExpanded ? null : crop.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedCrop(isExpanded ? null : crop.id);
                                  }
                                }}
                                className="p-1 hover:text-marker transition-colors"
                              >
                                <Settings2 size={12} />
                              </span>
                            </span>
                          )}
                        </button>

                        {/* Expanded options */}
                        {isExpanded && isSelected && (
                          <div className="border-x-2 border-b-2 border-ink bg-paper p-4">
                            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-3">
                              <label className="block">
                                <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-ink/60 block mb-1">
                                  Variety
                                </span>
                                <select
                                  value={isSelected.varietyId}
                                  onChange={(e) => updateVariety(crop.id, e.target.value)}
                                  className={inputCls}
                                >
                                  {crop.varieties.map(variety => (
                                    <option key={variety.id} value={variety.id}>
                                      {variety.name} ({variety.daysToMaturity}d)
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className="block">
                                <span className="font-mono text-[0.62rem] font-bold uppercase tracking-widest text-ink/60 block mb-1">
                                  Plants
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  value={isSelected.quantity ?? 1}
                                  onChange={(e) => updateQuantity(crop.id, parseInt(e.target.value) || 1)}
                                  className={`${inputCls} w-20`}
                                />
                              </label>
                            </div>

                            {crop.successionEnabled && (
                              <div className="pt-3 border-t border-dotted border-ink/40">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected.successionEnabled}
                                    onChange={() => toggleSuccession(crop.id)}
                                    className="accent-[#e4571f] w-3.5 h-3.5"
                                  />
                                  <span className="font-mono text-[0.66rem] font-bold uppercase tracking-wider">
                                    Succession sowing
                                  </span>
                                </label>

                                {isSelected.successionEnabled && (
                                  <span className="ml-4 inline-flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-wider">
                                    <span className="text-ink/55">every</span>
                                    <select
                                      value={isSelected.successionInterval ?? crop.successionInterval}
                                      onChange={(e) => updateSuccessionInterval(crop.id, Number(e.target.value))}
                                      className={inputCls}
                                    >
                                      {[1, 2, 3, 4].map(w => (
                                        <option key={w} value={w}>{w} wk</option>
                                      ))}
                                    </select>
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
                                        <span className="text-ink/55">
                                          → {count} sow window{count === 1 ? "" : "s"}
                                        </span>
                                      );
                                    })()}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Actual date anchoring */}
                            <div className="pt-3 mt-3 border-t border-dotted border-ink/40">
                              <label className="inline-flex items-center gap-2 cursor-pointer">
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
                                  className="accent-[#e4571f] w-3.5 h-3.5"
                                />
                                <span className="font-mono text-[0.66rem] font-bold uppercase tracking-wider">
                                  Already started
                                </span>
                              </label>

                              {isSelected.actualActionDate && (
                                <div className="mt-2 flex flex-wrap items-center gap-3">
                                  <select
                                    value={isSelected.actualActionDate.action}
                                    onChange={e => updateActualActionDate(crop.id, {
                                      ...isSelected.actualActionDate!,
                                      action: e.target.value as 'start-indoors' | 'transplant' | 'direct-sow',
                                    })}
                                    className={inputCls}
                                  >
                                    {crop.startIndoors !== null && <option value="start-indoors">Started inside</option>}
                                    {crop.transplant !== null && <option value="transplant">Planted out</option>}
                                    {crop.directSow !== null && <option value="direct-sow">Sowed</option>}
                                  </select>
                                  <input
                                    type="date"
                                    max={todayIso}
                                    value={isSelected.actualActionDate.date}
                                    onChange={e => updateActualActionDate(crop.id, {
                                      ...isSelected.actualActionDate!,
                                      date: e.target.value,
                                    })}
                                    className={inputCls}
                                  />
                                  <span className="font-mono text-[0.62rem] uppercase tracking-wider text-ink/50">
                                    every date shifts to match
                                  </span>
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
        <p className="mt-3 px-3 py-2 border-2 border-rust text-rust font-mono text-[0.66rem] font-bold uppercase tracking-wider relative z-[2]">
          Drawer&apos;s full: {maxCrops} crops
        </p>
      )}
    </div>
  );
}
