import Dexie, { type EntityTable } from 'dexie';
import type { InventoryItem, HomesteadConfig, CaloricTotals } from './types';

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
// Database definition
// ============================================================

export class HomesteadDB extends Dexie {
  config!:    EntityTable<HomesteadConfigRow, 'id'>;
  inventory!: EntityTable<InventoryItem,      'id'>;
  cachedTotals!: EntityTable<CaloricTotalsRow, 'id'>;

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
