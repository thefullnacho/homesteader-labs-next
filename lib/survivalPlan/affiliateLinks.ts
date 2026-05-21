import config from './affiliateLinks.json';
import type { AffiliateLink, CropAllocation, PlanGoal } from './types';

interface VendorConfig {
  name: string;
  baseUrl: string;
  affiliateParam: string;
}

interface CropEntry {
  vendor: string;
  variety: string;
  query: string;
}

const vendors = config.vendors as Record<string, VendorConfig>;
const crops = config.crops as Record<string, CropEntry[]>;

function buildLink(entry: CropEntry, planId: string, goal: PlanGoal): string {
  const vendor = vendors[entry.vendor];
  if (!vendor) return '';
  const utm = new URLSearchParams({
    utm_source: 'homesteaderlabs',
    utm_medium: 'survival-garden-plan',
    utm_campaign: goal,
    utm_content: planId,
  });
  const sep = vendor.baseUrl.includes('?') ? '&' : '&';
  const query = encodeURIComponent(entry.query);
  return `${vendor.baseUrl}${query}${sep}${vendor.affiliateParam}&${utm.toString()}`;
}

function genericFallback(cropName: string, planId: string, goal: PlanGoal): AffiliateLink {
  const utm = new URLSearchParams({
    utm_source: 'homesteaderlabs',
    utm_medium: 'survival-garden-plan',
    utm_campaign: goal,
    utm_content: planId,
  });
  return {
    cropId: cropName.toLowerCase(),
    cropName,
    varietyName: cropName,
    vendor: "Johnny's Selected Seeds",
    url: `https://www.johnnyseeds.com/search/?q=${encodeURIComponent(cropName)}&aff=homesteaderlabs&${utm.toString()}`,
  };
}

export function buildAffiliateLinks(
  allocations: CropAllocation[],
  planId: string,
  goal: PlanGoal,
): AffiliateLink[] {
  const links: AffiliateLink[] = [];

  for (const allocation of allocations) {
    const entries = crops[allocation.cropId];
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        const vendor = vendors[entry.vendor];
        if (!vendor) continue;
        links.push({
          cropId: allocation.cropId,
          cropName: allocation.cropName,
          varietyName: entry.variety,
          vendor: vendor.name,
          url: buildLink(entry, planId, goal),
        });
      }
    } else {
      links.push(genericFallback(allocation.cropName, planId, goal));
    }
  }

  return links;
}
