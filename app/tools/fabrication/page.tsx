"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Box, Clock, Weight, DollarSign, Settings, AlertCircle } from "lucide-react";
import STLViewer from "../../components/fabrication/STLViewer";
import {
  FILAMENT_TYPES,
  DEFAULT_SETTINGS,
  calculatePrintEstimate,
  formatPrintTime,
} from "../../lib/fabricationTypes";
import type { FilamentType, PrintSettings, PrintEstimate } from "../../lib/fabricationTypes";

export default function FabricationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFilament, setSelectedFilament] = useState<FilamentType>(FILAMENT_TYPES[0]);
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_SETTINGS);
  const [estimate, setEstimate] = useState<PrintEstimate | null>(null);
  const [dimensions, setDimensions] = useState<{ x: number; y: number; z: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasVolume, setHasVolume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVolumeCalculated = useCallback((volumeCm3: number, dims: { x: number; y: number; z: number }) => {
    setHasVolume(true);
    setDimensions(dims);
    const newEstimate = calculatePrintEstimate(volumeCm3, selectedFilament, settings);
    setEstimate(newEstimate);
    setError(null);
  }, [selectedFilament, settings]);

  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    setHasVolume(false);
    setEstimate(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith(".stl")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a valid STL file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".stl")) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please upload a valid STL file");
    }
  }, []);

  const updateSettings = (key: keyof PrintSettings, value: number | boolean) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      // Recalculate estimate if we have a model
      if (estimate && dimensions) {
        const volumeFromWeight = estimate.weight / selectedFilament.density;
        setEstimate(calculatePrintEstimate(volumeFromWeight, selectedFilament, newSettings));
      }
      return newSettings;
    });
  };

  const updateFilament = (filamentId: string) => {
    const filament = FILAMENT_TYPES.find((f) => f.id === filamentId);
    if (filament) {
      setSelectedFilament(filament);
      if (estimate && dimensions) {
        const volumeFromWeight = estimate.weight / selectedFilament.density;
        setEstimate(calculatePrintEstimate(volumeFromWeight, filament, settings));
      }
    }
  };

  const resetViewer = () => {
    setFile(null);
    setEstimate(null);
    setDimensions(null);
    setError(null);
    setHasVolume(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
        <div>
          <h2 className="text-2xl font-bold uppercase">Fabrication_Workbench</h2>
          <p className="text-xs text-theme-secondary mt-1">
            STL Viewer & Print Estimator | 3D Printing Services
          </p>
        </div>
        <div className="text-[10px] text-theme-secondary text-right">
          <p>FILAMENT_TYPES: {FILAMENT_TYPES.length}</p>
          <p>STATUS: OPERATIONAL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Viewer & Upload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Area */}
          <div className="brutalist-block p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase flex items-center gap-2">
                <Upload size={16} className="text-[var(--accent)]" />
                STL Upload
              </h3>
              {file && (
                <button
                  onClick={resetViewer}
                  className="text-xs border border-theme-main px-2 py-1 hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-theme-main/40 hover:border-theme-main"
                }`}
              >
                <Box size={48} className="mx-auto mb-4 opacity-40" />
                <p className="text-sm mb-2">Drop STL file here or click to browse</p>
                <p className="text-xs opacity-40">Maximum file size: 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-theme-sub/50 border border-theme-main">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-[var(--accent)]" />
                    <span className="text-sm font-mono truncate max-w-xs">{file.name}</span>
                  </div>
                  <span className="text-xs opacity-60">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                {/* 3D Viewer */}
                <STLViewer
                  file={file}
                  onVolumeCalculated={handleVolumeCalculated}
                  onError={handleError}
                />

                {error && (
                  <div className="p-3 border border-red-500 bg-red-500/10 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Dimensions */}
          {dimensions && (
            <div className="brutalist-block p-4">
              <h4 className="text-xs font-bold uppercase mb-3">Model Dimensions (mm)</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border border-theme-main/30 p-2">
                  <div className="text-lg font-bold">{dimensions.x.toFixed(1)}</div>
                  <div className="text-[10px] opacity-60">X (Width)</div>
                </div>
                <div className="border border-theme-main/30 p-2">
                  <div className="text-lg font-bold">{dimensions.y.toFixed(1)}</div>
                  <div className="text-[10px] opacity-60">Y (Depth)</div>
                </div>
                <div className="border border-theme-main/30 p-2">
                  <div className="text-lg font-bold">{dimensions.z.toFixed(1)}</div>
                  <div className="text-[10px] opacity-60">Z (Height)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Settings & Pricing */}
        <div className="space-y-6">
          {/* Filament Selection */}
          <div className="brutalist-block p-6">
            <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
              <Settings size={16} className="text-[var(--accent)]" />
              Material
            </h3>

            <div className="space-y-3">
              {FILAMENT_TYPES.map((filament) => (
                <button
                  key={filament.id}
                  onClick={() => updateFilament(filament.id)}
                  className={`w-full text-left p-3 border transition-all ${
                    selectedFilament.id === filament.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : "border-theme-main/40 hover:border-theme-main"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold">{filament.name}</span>
                    <span className="text-xs text-[var(--accent)]">${filament.pricePerKg}/kg</span>
                  </div>
                  <p className="text-[10px] opacity-60">{filament.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Print Settings */}
          <div className="brutalist-block p-6">
            <h3 className="text-sm font-bold uppercase mb-4">Print Settings</h3>

            <div className="space-y-4">
              {/* Infill */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>Infill Density</span>
                  <span className="font-bold">{settings.infill}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={settings.infill}
                  onChange={(e) => updateSettings("infill", parseInt(e.target.value))}
                  className="w-full accent-[var(--accent)]"
                />
                <div className="flex justify-between text-[10px] opacity-40">
                  <span>Light</span>
                  <span>Solid</span>
                </div>
              </div>

              {/* Layer Height */}
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span>Layer Height</span>
                  <span className="font-bold">{settings.layerHeight}mm</span>
                </div>
                <div className="flex gap-2">
                  {[0.1, 0.2, 0.3].map((height) => (
                    <button
                      key={height}
                      onClick={() => updateSettings("layerHeight", height)}
                      className={`flex-1 py-1 text-xs border transition-all ${
                        settings.layerHeight === height
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-theme-main hover:bg-theme-sub"
                      }`}
                    >
                      {height}mm
                    </button>
                  ))}
                </div>
              </div>

              {/* Supports */}
              <div className="flex items-center justify-between">
                <span className="text-xs">Enable Supports</span>
                <button
                  onClick={() => updateSettings("supportEnabled", !settings.supportEnabled)}
                  className={`w-12 h-6 border transition-all ${
                    settings.supportEnabled
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-theme-main"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white transition-transform ${
                      settings.supportEnabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Estimate */}
          {estimate && hasVolume && (
            <div className="brutalist-block border-[var(--accent)] p-6">
              <h3 className="text-sm font-bold uppercase mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--accent)]" />
                Print Estimate
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Weight size={12} /> Material Weight
                  </span>
                  <span>{estimate.weight}g</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Clock size={12} /> Print Time
                  </span>
                  <span>{formatPrintTime(estimate.printTime)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Material Cost</span>
                  <span>${estimate.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Service Fee</span>
                  <span>${estimate.serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t-2 border-[var(--accent)] pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold uppercase">Total</span>
                  <span className="text-2xl font-bold text-[var(--accent)]">
                    ${estimate.totalCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] opacity-60 mt-2 text-center">
                  *Estimate only. Final price may vary based on print complexity.
                </p>
              </div>

              <button className="w-full mt-4 py-3 bg-[var(--accent)] text-white text-sm font-bold uppercase hover:brightness-110 transition-all">
                Request Quote
              </button>
            </div>
          )}

          {/* Placeholder when no file */}
          {!file && (
            <div className="brutalist-block p-6 text-center">
              <Box size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs opacity-60">
                Upload an STL file to see print estimates
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
