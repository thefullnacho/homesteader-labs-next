'use client';

import { useState, useEffect } from 'react';
import { getCropById } from '@/lib/tools/planting-calendar/cropLoader';
import { getInventory, putInventoryItem } from '@/lib/caloric-security/homesteadStore';
import type { InventoryItem } from '@/lib/caloric-security/types';
import type { SelectedCrop } from '@/lib/tools/planting-calendar/types';

const BRIDGE_KEY = 'hl_planting_selection';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BridgePayload {
  crops: SelectedCrop[];
  savedAt: number;
}

export interface ImportPreview {
  items: InventoryItem[];
  cropNames: string[];
  savedAt: number;
}

export function useImportFromPlanting(): {
  preview: ImportPreview | null;
  confirm: () => Promise<void>;
  dismiss: () => void;
} {
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  useEffect(() => {
    async function loadPreview() {
      try {
        const raw = localStorage.getItem(BRIDGE_KEY);
        if (!raw) return;

        const payload: BridgePayload = JSON.parse(raw);
        if (Date.now() - payload.savedAt > MAX_AGE_MS) {
          localStorage.removeItem(BRIDGE_KEY);
          return;
        }

        // Get existing inventory to dedup
        const existing = await getInventory();
        const existingCropIds = new Set(existing.map(i => i.cropId));

        const items: InventoryItem[] = [];
        const cropNames: string[] = [];

        for (const sc of payload.crops) {
          if (existingCropIds.has(sc.cropId)) continue;
          const crop = getCropById(sc.cropId);
          if (!crop) continue;

          items.push({
            id: crypto.randomUUID(),
            type: 'crop',
            cropId: sc.cropId,
            plantCount: sc.quantity ?? 1,
            status: 'planned',
            lastUpdated: new Date(),
          });
          cropNames.push(crop.name);
        }

        if (items.length > 0) {
          setPreview({ items, cropNames, savedAt: payload.savedAt });
        }
      } catch {
        // Malformed bridge data — ignore silently
      }
    }

    loadPreview();
  }, []);

  async function confirm() {
    if (!preview) return;
    for (const item of preview.items) {
      await putInventoryItem(item);
    }
    localStorage.removeItem(BRIDGE_KEY);
    setPreview(null);
  }

  function dismiss() {
    localStorage.removeItem(BRIDGE_KEY);
    setPreview(null);
  }

  return { preview, confirm, dismiss };
}
