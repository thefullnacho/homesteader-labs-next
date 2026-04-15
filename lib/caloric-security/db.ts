import Dexie, { type EntityTable } from 'dexie';
import type { InventoryItem, HomesteadConfig, CaloricTotals } from './types';
import type { SavedLocation } from '@/lib/weatherTypes';

// ============================================================
// SurvivalManifest table shapes
//
// Dexie stores each table as rows. We split SurvivalManifest
// into two tables:
//
//   homesteadConfig  — exactly one row (id = 'singleton')
//   inventory        — one row per InventoryItem
//
// CaloricTotals is derived on demand and cached in a separate
// single-row table rather than being embedded in config.
// This keeps writes small: updating one inventory item doesn't
// rewrite the entire config blob.
// ============================================================

export interface HomesteadConfigRow {
  id:            'singleton';   // enforced single-row key
  householdSize: number;
  skillLevel:    number;
  seedSavingPct?: number;
  waterCatchment: HomesteadConfig['waterCatchment'];
  energy:         HomesteadConfig['energy'];
  lastUpdated:    Date;
}

export interface CaloricTotalsRow {
  id:          'singleton';
  totals:      CaloricTotals;
  computedAt:  Date;
}

// ============================================================
// Location + frost date rows (version 2)
//
// Replaces localStorage keys 'homesteader-locations' and
// 'homesteader-frost-dates' with IndexedDB tables. Native Date
// objects survive round-trips via structured clone.
// ============================================================

export type LocationRow = SavedLocation;   // already has id: string

export interface FrostDatesRow {
  id:                         'singleton';
  zipCode:                    string;
  city?:                      string;
  state?:                     string;
  lastSpringFrost:            Date;
  lastSpringFrostConfidence:  number;
  firstFallFrost:             Date;
  firstFallFrostConfidence:   number;
  frostFreeDays:              number;
  growingZone?:               string;
}

// ============================================================
// Actuals row (version 2)
//
// Persists ActualsInput values across page refreshes so the
// user doesn't have to re-enter stored-gallons / battery % on
// every visit.
// ============================================================

export interface ActualsRow {
  id:                     'singleton';
  storedGallons:          number;
  irrigationDailyGallons: number;
  currentBatteryPct:      number;
}

// ============================================================
// Database definition
// ============================================================

export class HomesteadDB extends Dexie {
  config!:       EntityTable<HomesteadConfigRow, 'id'>;
  inventory!:    EntityTable<InventoryItem,      'id'>;
  cachedTotals!: EntityTable<CaloricTotalsRow,   'id'>;
  locations!:    EntityTable<LocationRow,        'id'>;
  frostDates!:   EntityTable<FrostDatesRow,      'id'>;
  actuals!:      EntityTable<ActualsRow,         'id'>;

  constructor() {
    super('HomesteadDB');

    this.version(1).stores({
      // Primary key first, then indexed fields.
      // Fields not listed here are still stored — Dexie indexes are
      // for querying, not exhaustive column declarations.
      config:        'id',
      inventory:     'id, cropId, type, status',
      cachedTotals:  'id',
    });

    // Version 2: add location, frost date, and actuals persistence.
    // Existing tables carry forward unchanged (Dexie 3+ behaviour).
    this.version(2).stores({
      locations:  'id, zipCode',
      frostDates: 'id',
      actuals:    'id',
    });

    // Version 3: InventoryItem gains optional weightLbs + expectedHarvestDate.
    // Both fields are optional — no migration needed; existing rows remain valid.
    this.version(3).stores({});
  }
}

// ============================================================
// Singleton instance
//
// Exported as a lazy singleton so server-side code never
// instantiates Dexie (which requires a browser environment).
// All callers must guard with `typeof window !== 'undefined'`
// before importing or calling anything from this module.
// ============================================================

let _db: HomesteadDB | null = null;

export function getDB(): HomesteadDB {
  if (typeof window === 'undefined') {
    throw new Error('HomesteadDB must only be accessed in a browser environment.');
  }
  if (!_db) {
    _db = new HomesteadDB();
  }
  return _db;
}
