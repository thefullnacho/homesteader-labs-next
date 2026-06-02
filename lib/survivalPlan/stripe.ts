import Stripe from 'stripe';
import type { SurvivalPlanInput } from './types';

// Single source of truth for Stripe config across the survival-garden-plan routes
// (checkout, webhook, regenerate). The plan input rides through a Checkout Session's
// `metadata.plan_input` so the flow stays stateless — no DB, no order storage.
//
// NOTE: Stripe metadata values cap at 500 characters. A compact SurvivalPlanInput
// (zip, household, sqft, a handful of excluded crop ids) sits comfortably under that.
// If excludedCropIds ever grows large, switch this to a compressed/hashed token.

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homesteaderlabs.com';

// `null` when unconfigured so routes can degrade gracefully (dev-preview, 503s)
// instead of throwing at import time.
export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export const PLAN_INPUT_METADATA_KEY = 'plan_input';

/** Serialize a validated input for Checkout Session metadata. */
export function encodePlanInputForMetadata(input: SurvivalPlanInput): string {
  return JSON.stringify(input);
}

/** Pull the plan input back out of session metadata. Returns null if absent/invalid. */
export function decodePlanInputFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): SurvivalPlanInput | null {
  const raw = metadata?.[PLAN_INPUT_METADATA_KEY];
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as SurvivalPlanInput;
  } catch {
    return null;
  }
}
