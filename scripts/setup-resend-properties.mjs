#!/usr/bin/env node
/**
 * One-off: create the contact properties the zone planner sets.
 *
 * Resend custom properties are first-class objects, not free-form key/values.
 * Setting a key that does not exist rejects the whole contact create with
 * `validation_error: One or more properties do not exist` (422), so these have
 * to exist before the first subscriber arrives.
 *
 * Idempotent: existing properties are left alone.
 *
 *   RESEND_API_KEY=re_... node scripts/setup-resend-properties.mjs
 */
import { Resend } from 'resend';

const PROPERTIES = [
  { key: 'zone', type: 'string', fallbackValue: null },
  { key: 'source', type: 'string', fallbackValue: null },
];

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('RESEND_API_KEY is not set.');
  process.exit(1);
}

const resend = new Resend(apiKey);

const existing = await resend.contactProperties.list();
if (existing.error) {
  console.error('Could not list contact properties:', existing.error);
  process.exit(1);
}

const have = new Set((existing.data?.data ?? []).map((p) => p.key));

for (const prop of PROPERTIES) {
  if (have.has(prop.key)) {
    console.log(`= ${prop.key} already exists, skipping`);
    continue;
  }
  const res = await resend.contactProperties.create(prop);
  if (res.error) {
    console.error(`x ${prop.key} failed:`, res.error);
    process.exitCode = 1;
  } else {
    console.log(`+ ${prop.key} created (${res.data?.id})`);
  }
}

console.log('\nDone. Re-run the planner form and the contact should carry zone + source.');
