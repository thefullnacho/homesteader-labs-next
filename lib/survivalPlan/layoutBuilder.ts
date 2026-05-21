import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { parseSquareFootPerPlant } from './cropSelector';
import type { CropAllocation, LayoutCell } from './types';

interface LayoutResult {
  cells: LayoutCell[];
  width: number;
  height: number;
}

function pickGridDimensions(totalSqFt: number): { width: number; height: number } {
  const target = Math.max(totalSqFt, 16);
  const side = Math.ceil(Math.sqrt(target));
  const width = Math.min(side, 30);
  const height = Math.ceil(target / width);
  return { width, height: Math.min(height, 40) };
}

export function buildLayout(allocations: CropAllocation[], totalSqFt: number): LayoutResult {
  const { width, height } = pickGridDimensions(totalSqFt);
  const occupied: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));
  const cells: LayoutCell[] = [];

  for (const allocation of allocations) {
    const crop = getCropById(allocation.cropId);
    if (!crop) continue;

    const sqFtPerPlant = parseSquareFootPerPlant(crop.spacing);
    const totalCellsNeeded = Math.max(1, Math.round(allocation.sqFtUsed));
    const side = Math.max(1, Math.round(Math.sqrt(sqFtPerPlant)));

    let placedCells = 0;
    const blockWidth = Math.min(width, Math.max(side, Math.round(Math.sqrt(totalCellsNeeded))));
    const blockHeight = Math.ceil(totalCellsNeeded / blockWidth);

    outer: for (let y = 0; y <= height - blockHeight; y++) {
      for (let x = 0; x <= width - blockWidth; x++) {
        let free = true;
        for (let dy = 0; dy < blockHeight && free; dy++) {
          for (let dx = 0; dx < blockWidth && free; dx++) {
            if (occupied[y + dy][x + dx]) free = false;
          }
        }

        if (free) {
          for (let dy = 0; dy < blockHeight; dy++) {
            for (let dx = 0; dx < blockWidth; dx++) {
              occupied[y + dy][x + dx] = true;
            }
          }
          cells.push({
            cropId: allocation.cropId,
            cropName: allocation.cropName,
            icon: crop.icon ?? '🌱',
            x,
            y,
            w: blockWidth,
            h: blockHeight,
          });
          placedCells = blockWidth * blockHeight;
          break outer;
        }
      }
    }

    if (placedCells === 0) {
      let placed = false;
      for (let y = 0; y < height && !placed; y++) {
        for (let x = 0; x < width && !placed; x++) {
          if (!occupied[y][x]) {
            occupied[y][x] = true;
            cells.push({
              cropId: allocation.cropId,
              cropName: allocation.cropName,
              icon: crop.icon ?? '🌱',
              x, y, w: 1, h: 1,
            });
            placed = true;
          }
        }
      }
    }
  }

  return { cells, width, height };
}
