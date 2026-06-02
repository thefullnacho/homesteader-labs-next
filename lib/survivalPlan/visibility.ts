// Public visibility flag for the Survival Garden Plan funnel.
//
// Defaults to HIDDEN so production keeps the paid PDF generator private until
// the affiliate accounts are approved and the seed list is rebalanced. Flip it on
// by setting NEXT_PUBLIC_SURVIVAL_PLAN_PUBLIC=true — in `.env.local` for local
// development, or in the host env (Vercel) at launch.
//
// NEXT_PUBLIC_ prefix is required so the client `/tools` tile and the server pages
// + sitemap can all read the same flag.
export function isSurvivalPlanPublic(): boolean {
  return process.env.NEXT_PUBLIC_SURVIVAL_PLAN_PUBLIC === 'true';
}
