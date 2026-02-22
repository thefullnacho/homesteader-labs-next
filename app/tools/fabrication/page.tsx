"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, Box, Clock, Weight, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const STLViewer = dynamic(() => import("@/components/fabrication/STLViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full flex items-center justify-center bg-black/20 border-2 border-border-primary border-dashed">
      <div className="text-center">
        <Box className="w-12 h-12 text-accent animate-pulse mx-auto mb-4" />
        <p className="font-mono text-xs text-accent uppercase tracking-widest">Initializing_3D_Engine...</p>
      </div>
    </div>
  ),
});

import {
  FILAMENT_TYPES,
  DEFAULT_SETTINGS,
  calculatePrintEstimate,
  formatPrintTime,
} from "@/lib/fabricationTypes";
import type { FilamentType, PrintSettings, PrintEstimate } from "@/lib/fabricationTypes";
import FieldStationLayout from "@/components/ui/FieldStationLayout";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import DymoLabel from "@/components/ui/DymoLabel";

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
    <FieldStationLayout stationId="HL_FAB_WORKBENCH">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <BrutalistBlock className="mb-8 p-6" variant="default">
          <div className="flex justify-between items-end">
            <div>
              <Typography variant="h2" className="mb-0">Fabrication_Workbench</Typography>
              <Typography variant="small" className="opacity-60">STL Viewer & Precise Print Estimation Matrix</Typography>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              <Badge variant="status" pulse>System_Operational</Badge>
              <Typography variant="small" className="font-mono text-[10px] opacity-40 uppercase mb-0">
                FILAMENTS_LOADED: {FILAMENT_TYPES.length}
              </Typography>
            </div>
          </div>
        </BrutalistBlock>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Viewer & Upload */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <BrutalistBlock className="p-0 overflow-hidden" variant="default">
              <div className="flex justify-between items-center p-4 border-b-2 border-border-primary bg-background-primary/30">
                <Typography variant="h4" className="mb-0 flex items-center gap-2 text-sm">
                  <Upload size={16} className="text-accent" />
                  STL_INJECTION_PORT
                </Typography>
                {file && (
                  <Button
                    onClick={resetViewer}
                    variant="outline"
                    size="sm"
                    className="h-8 py-0 px-3"
                  >
                    Clear_Cache
                  </Button>
                )}
              </div>

              <div className="p-6">
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-accent bg-accent/10"
                        : "border-border-primary/40 hover:border-accent hover:bg-background-secondary/50"
                    }`}
                  >
                    <Box size={64} className="mx-auto mb-6 opacity-20 text-accent" />
                    <Typography variant="h3" className="mb-2">Awaiting Data...</Typography>
                    <Typography variant="body" className="opacity-40 text-sm mb-0">
                      Drag & Drop STL file or click to scan directory
                    </Typography>
                    <Typography variant="small" className="opacity-20 font-mono mt-4 block">
                      MAX_PAYLOAD: 50MB
                    </Typography>
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
                    <div className="flex items-center justify-between p-3 bg-black/20 border-l-4 border-accent">
                      <div className="flex items-center gap-3">
                        <Box size={18} className="text-accent" />
                        <Typography variant="small" className="mb-0 font-bold font-mono truncate max-w-md">
                          {file.name}
                        </Typography>
                      </div>
                      <Badge variant="outline" className="opacity-60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>

                    {/* 3D Viewer */}
                    <div className="border-2 border-border-primary">
                      <STLViewer
                        file={file}
                        onVolumeCalculated={handleVolumeCalculated}
                        onError={handleError}
                      />
                    </div>

                    {error && (
                      <div className="p-4 border-2 border-red-500 bg-red-500/10 text-red-500 text-xs flex items-center gap-3 font-bold uppercase tracking-tighter">
                        <AlertCircle size={18} />
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </BrutalistBlock>

            {/* Model Dimensions */}
            {dimensions && (
              <BrutalistBlock className="p-6" title="Geometry_Analysis">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="bg-background-primary/30 border border-border-primary/30 p-4">
                    <Typography variant="h3" className="mb-0 text-accent">{dimensions.x.toFixed(1)}</Typography>
                    <Typography variant="small" className="opacity-40 font-mono mb-0 uppercase text-[9px]">X_Axis (mm)</Typography>
                  </div>
                  <div className="bg-background-primary/30 border border-border-primary/30 p-4">
                    <Typography variant="h3" className="mb-0 text-accent">{dimensions.y.toFixed(1)}</Typography>
                    <Typography variant="small" className="opacity-40 font-mono mb-0 uppercase text-[9px]">Y_Axis (mm)</Typography>
                  </div>
                  <div className="bg-background-primary/30 border border-border-primary/30 p-4">
                    <Typography variant="h3" className="mb-0 text-accent">{dimensions.z.toFixed(1)}</Typography>
                    <Typography variant="small" className="opacity-40 font-mono mb-0 uppercase text-[9px]">Z_Axis (mm)</Typography>
                  </div>
                </div>
              </BrutalistBlock>
            )}
          </div>

          {/* Right Column - Settings & Pricing */}
          <div className="space-y-8">
            {/* Filament Selection */}
            <BrutalistBlock className="p-6" title="Material_Selection">
              <div className="space-y-4 mt-2">
                {FILAMENT_TYPES.map((filament) => (
                  <button
                    key={filament.id}
                    onClick={() => updateFilament(filament.id)}
                    className={`w-full text-left p-4 border-2 transition-all ${
                      selectedFilament.id === filament.id
                        ? "border-accent bg-accent/10 shadow-[2px_2px_0px_0px_var(--accent)]"
                        : "border-border-primary/30 hover:border-border-primary bg-background-secondary/30"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Typography variant="h4" className="mb-0 text-sm">{filament.name}</Typography>
                      <Badge variant="solid" className="bg-accent border-accent">${filament.pricePerKg}/kg</Badge>
                    </div>
                    <Typography variant="small" className="opacity-60 text-[10px] leading-tight mb-0">
                      {filament.description}
                    </Typography>
                  </button>
                ))}
              </div>
            </BrutalistBlock>

            {/* Print Settings */}
            <BrutalistBlock className="p-6" title="Machine_Configuration">
              <div className="space-y-6 mt-2">
                {/* Infill */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <Typography variant="small" className="mb-0 uppercase font-bold text-[10px]">Infill_Density</Typography>
                    <Typography variant="h4" className="mb-0 text-accent">{settings.infill}%</Typography>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={settings.infill}
                    onChange={(e) => updateSettings("infill", parseInt(e.target.value))}
                    className="w-full h-1 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-accent border border-border-primary"
                  />
                  <div className="flex justify-between text-[8px] font-mono opacity-30 mt-2 uppercase">
                    <span>Low_Density</span>
                    <span>Solid_Core</span>
                  </div>
                </div>

                {/* Layer Height */}
                <div>
                  <Typography variant="small" className="mb-3 block uppercase font-bold text-[10px]">Layer_Resolution</Typography>
                  <div className="flex gap-2">
                    {[0.1, 0.2, 0.3].map((height) => (
                      <button
                        key={height}
                        onClick={() => updateSettings("layerHeight", height)}
                        className={`flex-1 py-2 text-[10px] font-mono border-2 transition-all ${
                          settings.layerHeight === height
                            ? "border-accent bg-accent text-white"
                            : "border-border-primary/40 hover:border-border-primary"
                        }`}
                      >
                        {height}mm
                      </button>
                    ))}
                  </div>
                </div>

                {/* Supports */}
                <div className="flex items-center justify-between bg-black/10 p-3 border border-border-primary/20">
                  <Typography variant="small" className="mb-0 uppercase font-bold text-[10px]">Overhang_Support</Typography>
                  <button
                    onClick={() => updateSettings("supportEnabled", !settings.supportEnabled)}
                    className={`w-12 h-6 border-2 transition-all relative ${
                      settings.supportEnabled
                        ? "border-accent bg-accent"
                        : "border-border-primary/40 bg-background-secondary"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${
                        settings.supportEnabled ? "left-[1.6rem]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </BrutalistBlock>

            {/* Pricing Estimate */}
            {estimate && hasVolume && (
              <BrutalistBlock className="border-accent bg-background-primary/40 p-6" title="Cost_Analysis">
                <div className="space-y-3 mb-8 mt-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="opacity-50 uppercase flex items-center gap-2">
                      <Weight size={14} /> Net_Weight
                    </span>
                    <span className="font-bold">{estimate.weight}g</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="opacity-50 uppercase flex items-center gap-2">
                      <Clock size={14} /> Runtime_Est
                    </span>
                    <span className="font-bold">{formatPrintTime(estimate.printTime)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="opacity-50 uppercase">Material_Cost</span>
                    <span className="font-bold">${estimate.materialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="opacity-50 uppercase">Service_Fee</span>
                    <span className="font-bold">${estimate.serviceFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t-2 border-accent pt-6 mb-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <Typography variant="small" className="opacity-40 mb-0 font-mono uppercase text-[9px]">Total_Requisition_Cost</Typography>
                      <Typography variant="h1" className="mb-0 text-accent text-4xl">${estimate.totalCost.toFixed(2)}</Typography>
                    </div>
                    <Badge variant="status" className="mb-1">ESTIMATE</Badge>
                  </div>
                </div>

                <Button variant="primary" size="lg" className="w-full group">
                  <DymoLabel className="group-hover:scale-105 transition-transform px-6">
                    SUBMIT_QUOTE_REQUEST
                  </DymoLabel>
                </Button>
              </BrutalistBlock>
            )}

            {/* Placeholder when no file */}
            {!file && (
              <BrutalistBlock className="p-8 text-center bg-background-secondary/20 border-dashed" variant="default">
                <Box size={40} className="mx-auto mb-4 opacity-10" />
                <Typography variant="small" className="opacity-40 italic mb-0">
                  Data stream idle. Upload STL for analysis.
                </Typography>
              </BrutalistBlock>
            )}
          </div>
        </div>
      </div>
    </FieldStationLayout>
  );
}
