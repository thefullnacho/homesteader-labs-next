import { Crop, Variety, FrostDates, PlantingDate, SelectedCrop } from './types';

/**
 * Calculate all planting dates for a selected crop
 */
export function calculateCropSchedule(
  crop: Crop,
  variety: Variety,
  selectedCrop: SelectedCrop,
  frostDates: FrostDates
): PlantingDate[] {
  const dates: PlantingDate[] = [];
  const lastFrost = new Date(frostDates.lastSpringFrost);
  const firstFrost = new Date(frostDates.firstFallFrost);

  // Calculate main planting dates
  const mainDates = calculateSinglePlanting(crop, variety, lastFrost, firstFrost, 0);
  dates.push(...mainDates);

  // Calculate succession plantings if enabled
  if (selectedCrop.successionEnabled && crop.successionEnabled) {
    const interval = selectedCrop.successionInterval || crop.successionInterval;
    const maxPlantings = calculateMaxSuccessionPlantings(
      crop, variety, lastFrost, firstFrost, interval
    );

    for (let i = 1; i < maxPlantings; i++) {
      const successionDates = calculateSinglePlanting(
        crop, variety, lastFrost, firstFrost, i * interval
      );
      
      // Add succession number to each date
      successionDates.forEach(date => {
        date.successionNumber = i + 1;
      });
      
      dates.push(...successionDates);
    }
  }

  return dates;
}

/**
 * Calculate dates for a single planting (main or succession)
 */
function calculateSinglePlanting(
  crop: Crop,
  variety: Variety,
  lastFrost: Date,
  firstFrost: Date,
  weeksDelay: number
): PlantingDate[] {
  const dates: PlantingDate[] = [];
  const delayDays = weeksDelay * 7;

  // Calculate start indoors date
  if (crop.startIndoors !== null) {
    const startIndoorsDate = addDays(lastFrost, -crop.startIndoors + delayDays);
    if (isDateBefore(startIndoorsDate, firstFrost)) {
      dates.push({
        cropId: crop.id,
        cropName: crop.name,
        varietyName: variety.name,
        action: 'start-indoors',
        date: startIndoorsDate,
        notes: [`Start indoors ${crop.startIndoors} days before last frost`]
      });
    }
  }

  // Calculate transplant date
  if (crop.transplant !== null) {
    const transplantDate = addDays(lastFrost, crop.transplant + delayDays);
    if (isDateBefore(transplantDate, firstFrost)) {
      dates.push({
        cropId: crop.id,
        cropName: crop.name,
        varietyName: variety.name,
        action: 'transplant',
        date: transplantDate,
        notes: [`Transplant ${crop.transplant} days after last frost`]
      });
    }
  }

  // Calculate direct sow date
  if (crop.directSow !== null) {
    const directSowDate = addDays(lastFrost, crop.directSow + delayDays);
    if (isDateBefore(directSowDate, firstFrost)) {
      dates.push({
        cropId: crop.id,
        cropName: crop.name,
        varietyName: variety.name,
        action: 'direct-sow',
        date: directSowDate,
        notes: crop.directSow < 0 
          ? [`Direct sow ${Math.abs(crop.directSow)} days before last frost`]
          : [`Direct sow ${crop.directSow} days after last frost`]
      });
    }
  }

  // Calculate harvest date
  const maturityDays = variety.daysToMaturity || crop.daysToMaturity;
  const plantingDate = crop.directSow !== null
    ? addDays(lastFrost, crop.directSow + delayDays)
    : addDays(lastFrost, crop.transplant! + delayDays);
  
  const harvestDate = addDays(plantingDate, maturityDays);
  
  if (isDateBefore(harvestDate, firstFrost)) {
    dates.push({
      cropId: crop.id,
      cropName: crop.name,
      varietyName: variety.name,
      action: 'harvest',
      date: harvestDate,
      notes: [`Expect harvest in ${maturityDays} days`]
    });
  }

  return dates;
}

/**
 * Calculate maximum number of succession plantings possible
 */
function calculateMaxSuccessionPlantings(
  crop: Crop,
  variety: Variety,
  lastFrost: Date,
  firstFrost: Date,
  intervalWeeks: number
): number {
  const maturityDays = variety.daysToMaturity || crop.daysToMaturity;
  const intervalDays = intervalWeeks * 7;
  
  // Find the planting date (direct sow or transplant)
  let plantDate: Date;
  if (crop.directSow !== null) {
    plantDate = addDays(lastFrost, crop.directSow);
  } else if (crop.transplant !== null) {
    plantDate = addDays(lastFrost, crop.transplant);
  } else {
    return 1;
  }

  // Calculate last possible planting date for harvest before first frost
  const lastPlantDate = addDays(firstFrost, -maturityDays);
  
  // Calculate how many intervals fit
  const daysAvailable = getDaysBetween(plantDate, lastPlantDate);
  const maxIntervals = Math.floor(daysAvailable / intervalDays);
  
  // Return minimum of calculated max and crop's max
  return Math.min(maxIntervals + 1, crop.successionMax);
}

/**
 * Check if a crop can still be planted (for current date)
 */
export function canStillPlant(
  crop: Crop,
  variety: Variety,
  frostDates: FrostDates,
  currentDate: Date = new Date()
): { canPlant: boolean; lastChance?: Date; message?: string } {
  const firstFrost = new Date(frostDates.firstFallFrost);
  const maturityDays = variety.daysToMaturity || crop.daysToMaturity;
  
  // Calculate latest possible planting date
  let lastPlantDate: Date;
  
  if (crop.directSow !== null) {
    const plantDate = new Date(frostDates.lastSpringFrost);
    plantDate.setDate(plantDate.getDate() + crop.directSow);
    lastPlantDate = addDays(firstFrost, -maturityDays);
  } else if (crop.transplant !== null) {
    lastPlantDate = addDays(firstFrost, -maturityDays - 14); // Buffer for transplant
  } else {
    return { canPlant: false, message: 'No planting method available' };
  }

  const daysRemaining = getDaysBetween(currentDate, lastPlantDate);

  if (daysRemaining < 0) {
    return {
      canPlant: false,
      lastChance: lastPlantDate,
      message: 'Too late to plant this season'
    };
  } else if (daysRemaining < 14) {
    return {
      canPlant: true,
      lastChance: lastPlantDate,
      message: `Last chance! Plant within ${daysRemaining} days`
    };
  } else {
    return {
      canPlant: true,
      lastChance: lastPlantDate,
      message: `${daysRemaining} days remaining to plant`
    };
  }
}

/**
 * Group planting dates by month for calendar view
 */
export function groupDatesByMonth(dates: PlantingDate[]): Map<string, PlantingDate[]> {
  const grouped = new Map<string, PlantingDate[]>();
  
  dates.forEach(date => {
    const monthKey = date.date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(date);
  });
  
  return grouped;
}

/**
 * Sort planting dates chronologically
 */
export function sortDatesByDate(dates: PlantingDate[]): PlantingDate[] {
  return [...dates].sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Helper functions
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isDateBefore(date: Date, compareDate: Date): boolean {
  return date.getTime() < compareDate.getTime();
}

function getDaysBetween(start: Date, end: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
}

/**
 * Format date for display
 */
export function formatPlantingDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
}

/**
 * Get action label with emoji
 */
export function getActionLabel(action: PlantingDate['action']): string {
  const labels = {
    'start-indoors': '🌱 Start Indoors',
    'transplant': '🚜 Transplant',
    'direct-sow': '🌾 Direct Sow',
    'harvest': '✂️ Harvest'
  };
  return labels[action];
}

/**
 * Get action color for UI
 */
export function getActionColor(action: PlantingDate['action']): string {
  const colors = {
    'start-indoors': 'bg-blue-600',
    'transplant': 'bg-green-600',
    'direct-sow': 'bg-yellow-600',
    'harvest': 'bg-orange-600'
  };
  return colors[action];
}
