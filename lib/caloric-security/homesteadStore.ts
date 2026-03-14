import { getDB } from './db';
import type { HomesteadConfig, InventoryItem, CaloricTotals } from './types';
import type { HomesteadConfigRow } from './db';

// ============================================================
// Config — read / write / reset
// ============================================================

export async function getConfig(): Promise<HomesteadConfig | null> {
  const row = await getDB().config.get('singleton');
  if (!row) return null;
  return {
    householdSize:  row.householdSize,
    skillLevel:     row.skillLevel,
    waterCatchment: row.waterCatchment,
    energy:         row.energy,
  };
}

export async function saveConfig(config: HomesteadConfig): Promise<void> {
  const row: HomesteadConfigRow = {
    id:             'singleton',
    householdSize:  config.householdSize,
    skillLevel:     config.skillLevel,
    waterCatchment: config.waterCatchment,
    energy:         config.energy,
    lastUpdated:    new Date(),
  };
  await getDB().config.put(row);
  // Invalidate cached totals whenever config changes — skill level affects yield
  await invalidateCachedTotals();
}

export async function resetConfig(): Promise<void> {
  await getDB().config.delete('singleton');
  await invalidateCachedTotals();
}

// ============================================================
// Inventory — CRUD
// ============================================================

export async function getInventory(): Promise<InventoryItem[]> {
  return getDB().inventory.toArray();
}

export async function getInventoryItem(id: string): Promise<InventoryItem | undefined> {
  return getDB().inventory.get(id);
}

export async function putInventoryItem(item: InventoryItem): Promise<void> {
  await getDB().inventory.put({ ...item, lastUpdated: new Date() });
  await invalidateCachedTotals();
}

export async function deleteInventoryItem(id: string): Promise<void> {
  await getDB().inventory.delete(id);
  await invalidateCachedTotals();
}

/** Replace the entire inventory in one transaction. */
export async function replaceInventory(items: InventoryItem[]): Promise<void> {
  const db = getDB();
  await db.transaction('rw', db.inventory, db.cachedTotals, async () => {
    await db.inventory.clear();
    await db.inventory.bulkPut(items.map(i => ({ ...i, lastUpdated: new Date() })));
    await db.cachedTotals.delete('singleton');
  });
}

// ============================================================
// Cached caloric totals
//
// calculateTotalCalories is pure and fast, but the UI calls it
// on every render. Caching the last result avoids recalculating
// on navigations — it's invalidated whenever config or inventory
// changes.
// ============================================================

export async function getCachedTotals(): Promise<CaloricTotals | null> {
  const row = await getDB().cachedTotals.get('singleton');
  return row?.totals ?? null;
}

export async function saveCachedTotals(totals: CaloricTotals): Promise<void> {
  await getDB().cachedTotals.put({
    id:         'singleton',
    totals,
    computedAt: new Date(),
  });
}

export async function invalidateCachedTotals(): Promise<void> {
  await getDB().cachedTotals.delete('singleton');
}

// ============================================================
// First-run detection
//
// Used by the onboarding wizard: if no config row exists, the
// user hasn't completed setup yet.
// ============================================================

export async function isFirstRun(): Promise<boolean> {
  const count = await getDB().config.count();
  return count === 0;
}
