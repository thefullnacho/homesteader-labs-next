import Dexie, { type Table } from 'dexie';

export interface GDDRecord {
  id?: number;
  locationKey: string;
  year: number;
  historicalGDD: number;
  lastUpdated: string; // YYYY-MM-DD
}

class HomesteaderDB extends Dexie {
  gdd!: Table<GDDRecord>;

  constructor() {
    super('homesteader-labs');
    this.version(1).stores({
      gdd: '++id, [locationKey+year]',
    });
  }
}

export const db = new HomesteaderDB();
