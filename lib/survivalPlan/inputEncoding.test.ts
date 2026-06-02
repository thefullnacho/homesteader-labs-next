import { describe, it, expect } from 'vitest';
import { encodeInputs, decodeInputs } from './inputEncoding';
import type { SurvivalPlanInput } from './types';

const sample: SurvivalPlanInput = {
  zipCode: '04401',
  adults: 2,
  kids: 2,
  dietaryRestrictions: ['no-nightshades'],
  squareFeet: 200,
  gardenType: 'in-ground',
  goal: 'max-calories',
  experience: 'intermediate',
  excludedCropIds: ['potato', 'corn'],
};

describe('inputEncoding', () => {
  it('round-trips wizard inputs through encode/decode', () => {
    const encoded = encodeInputs(sample);
    const decoded = decodeInputs(encoded);
    expect(decoded).toEqual(sample);
  });

  it('produces URL-safe base64 (no +, /, or =)', () => {
    const encoded = encodeInputs(sample);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
  });

  it('produces a token short enough for a QR code', () => {
    const encoded = encodeInputs(sample);
    expect(encoded.length).toBeLessThan(500);
  });

  it('decode returns null for garbage input', () => {
    expect(decodeInputs('not-real-base64!!!')).toBeNull();
  });

  it('decode returns null for missing zipCode', () => {
    const bogus = encodeInputs({ ...sample, zipCode: '' });
    expect(decodeInputs(bogus)).toBeNull();
  });

  it('handles empty exclusion + restriction arrays', () => {
    const minimal: SurvivalPlanInput = { ...sample, dietaryRestrictions: [], excludedCropIds: [] };
    expect(decodeInputs(encodeInputs(minimal))).toEqual(minimal);
  });
});
