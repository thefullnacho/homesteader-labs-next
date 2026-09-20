/**
 * Licence blocks carried in the public data endpoints.
 *
 * The split is deliberate. The pest table is our own compilation: which pests
 * are worth predicting, which thresholds apply, how good the evidence is for a
 * companion. That is selection and judgment, so it is offered under CC BY 4.0
 * and attribution is the price.
 *
 * Zone and frost are aggregations of PRISM and NOAA output. The underlying
 * facts are public domain and not ours to licence, so these endpoints ask for
 * attribution instead of requiring it. Stamping a licence on public data would
 * be a claim we could not back, on a site whose argument is that it does not
 * invent numbers.
 */

const ATTRIBUTION = "Homesteader Labs, https://homesteaderlabs.com/data/";

export const PUBLIC_DOMAIN_DERIVED = {
  license: "Public domain source, aggregation by Homesteader Labs",
  licenseUrl: "https://homesteaderlabs.com/data/",
  attribution: ATTRIBUTION,
  attributionRequired: false,
} as const;

export const CC_BY_4 = {
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  attribution: ATTRIBUTION,
  attributionRequired: true,
} as const;
