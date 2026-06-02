import type { SurvivalPlanInput } from './types';

// URL-safe base64 encoding for round-tripping wizard inputs through links + QR codes.
// Keeps the companion page completely stateless — no backend storage of inputs.

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafe(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return b64;
}

export function encodeInputs(input: SurvivalPlanInput): string {
  const json = JSON.stringify(input);
  if (typeof Buffer !== 'undefined') {
    return toUrlSafe(Buffer.from(json, 'utf-8').toString('base64'));
  }
  return toUrlSafe(btoa(unescape(encodeURIComponent(json))));
}

export function decodeInputs(token: string): SurvivalPlanInput | null {
  try {
    const b64 = fromUrlSafe(token);
    const json = typeof Buffer !== 'undefined'
      ? Buffer.from(b64, 'base64').toString('utf-8')
      : decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json) as SurvivalPlanInput;
    if (!parsed.zipCode || typeof parsed.zipCode !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}
