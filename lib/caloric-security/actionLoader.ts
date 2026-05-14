// ============================================================
// actionLoader
//
// Loads the authored action library from data/actions/*.json.
// Returns a flat array of all Action objects ready for scoring.
//
// JSON imports require "resolveJsonModule": true in tsconfig
// (already enabled in this project).
// ============================================================

import foodActions     from '@/data/actions/food.json';
import waterActions    from '@/data/actions/water.json';
import energyActions   from '@/data/actions/energy.json';
import planningActions from '@/data/actions/planning.json';

import type { Action } from './actionTypes';

export function getAllActions(): Action[] {
  return [
    ...(foodActions     as Action[]),
    ...(waterActions    as Action[]),
    ...(energyActions   as Action[]),
    ...(planningActions as Action[]),
  ];
}
