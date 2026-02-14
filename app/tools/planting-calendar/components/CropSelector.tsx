"use client";

import { useState } from "react";
import { Check, Leaf } from "lucide-react";
import { Crop, SelectedCrop } from "../types";
import { getAllCrops } from "../lib/crops";

interface CropSelectorProps {
  selectedCrops: SelectedCrop[];
  onCropsChange: (crops: SelectedCrop[]) => void;
  maxCrops?: number;
}

export default function CropSelector({ 
  selectedCrops, 
  onCropsChange,
  maxCrops = 10 
}: CropSelectorProps) {
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const allCrops = getAllCrops();

  const toggleCrop = (crop: Crop) => {
    const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
    
    if (isSelected) {
      // Remove crop
      onCropsChange(selectedCrops.filter(sc => sc.cropId !== crop.id));
    } else {
      // Add crop (check limit)
      if (selectedCrops.length >= maxCrops) {
        return;
      }
      
      // Add with default variety
      onCropsChange([
        ...selectedCrops,
        {
          cropId: crop.id,
          varietyId: crop.varieties[0].id,
          successionEnabled: crop.successionEnabled,
          successionInterval: crop.successionInterval
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

  return (
    <div className="brutalist-block p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[var(--accent)] flex items-center justify-center">
          <Leaf size={20} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Step 2: Select Crops</h3>
          <p className="text-xs text-theme-secondary">
            Choose up to {maxCrops} crops ({selectedCrops.length} selected)
          </p>
        </div>
      </div>

      {/* Crop Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        {allCrops.map((crop) => {
          const isSelected = selectedCrops.find(sc => sc.cropId === crop.id);
          const isExpanded = expandedCrop === crop.id;
          
          return (
            <div key={crop.id} className="relative">
              <button
                onClick={() => toggleCrop(crop)}
                className={`w-full p-3 border-2 transition-all text-left ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-theme-main/30 hover:border-theme-main"
                }`}
              >
                <div className="text-2xl mb-1">{crop.icon}</div>
                <div className="text-xs font-bold truncate">{crop.name}</div>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check size={14} className="text-[var(--accent)]" />
                  </div>
                )}
              </button>
              
              {/* Expand button for selected crops */}
              {isSelected && crop.varieties.length > 1 && (
                <button
                  onClick={() => setExpandedCrop(isExpanded ? null : crop.id)}
                  className="w-full text-[9px] py-1 bg-theme-sub border-t border-theme-main/30 hover:bg-theme-main/10"
                >
                  {isExpanded ? "Hide Options ▲" : "Customize ▼"}
                </button>
              )}
              
              {/* Expanded options */}
              {isExpanded && isSelected && (
                <div className="border-x border-b border-theme-main/30 p-2 bg-theme-sub/50">
                  {/* Variety selector */}
                  <div className="mb-2">
                    <label className="text-[9px] uppercase opacity-70 block mb-1">Variety</label>
                    <select
                      value={isSelected.varietyId}
                      onChange={(e) => updateVariety(crop.id, e.target.value)}
                      className="w-full text-xs bg-theme-sub border border-theme-main px-2 py-1"
                    >
                      {crop.varieties.map(variety => (
                        <option key={variety.id} value={variety.id}>
                          {variety.name} ({variety.daysToMaturity} days)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Succession toggle */}
                  {crop.successionEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`succession-${crop.id}`}
                        checked={isSelected.successionEnabled}
                        onChange={() => toggleSuccession(crop.id)}
                        className="text-xs"
                      />
                      <label htmlFor={`succession-${crop.id}`} className="text-[9px]">
                        Succession plant every {crop.successionInterval} weeks
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected summary */}
      {selectedCrops.length > 0 && (
        <div className="mt-4 pt-4 border-t border-theme-main/30">
          <h4 className="text-xs font-bold uppercase mb-2">Selected Crops:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedCrops.map(sc => {
              const crop = allCrops.find(c => c.id === sc.cropId);
              const variety = crop?.varieties.find(v => v.id === sc.varietyId);
              return (
                <div 
                  key={sc.cropId}
                  className="text-[10px] px-2 py-1 bg-theme-sub border border-theme-main/50"
                >
                  {crop?.icon} {crop?.name} {variety && `(${variety.name})`}
                  {sc.successionEnabled && " ↻"}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedCrops.length >= maxCrops && (
        <div className="mt-4 p-2 border border-yellow-600 bg-yellow-600/10 text-[10px] text-yellow-600">
          Maximum {maxCrops} crops selected. Remove a crop to add more.
        </div>
      )}
    </div>
  );
}
