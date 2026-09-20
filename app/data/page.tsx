import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead, Stamp } from "@/components/field/kit";

export const metadata: Metadata = {
  title: "Field Data: Zone, Frost and Pest Endpoints",
  description:
    "Three JSON endpoints any tool or assistant can call: ZIP to USDA zone, frost normals by zone, and phenology-aware pest emergence thresholds. No key, no account, no rate limit.",
  alternates: { canonical: "https://homesteaderlabs.com/data/" },
};

const endpoints = [
  {
    no: "§1",
    path: "/api/zone/{zip}/",
    title: "ZIP to hardiness zone",
    example: "/api/zone/06385/",
    response: `{
  "zip": "06385",
  "zone": "7a",
  "source": "PRISM 2023"
}`,
    notes: [
      "A ZIP the PRISM table does not cover answers 404 with \"zone\": null. That is the honest answer, not an error to retry.",
      "Immutable. The underlying map is republished roughly once a decade.",
    ],
  },
  {
    no: "§2",
    path: "/api/frost/{zone}/",
    title: "Frost normals by zone",
    example: "/api/frost/6b/",
    response: `{
  "zone": "6b",
  "frostFree": false,
  "lastSpringFrost": "04-15",
  "firstFallFrost": "10-25",
  "frostFreeDays": 193,
  "lastFrostVarianceDays": 14,
  "firstFrostVarianceDays": 14,
  "source": "...NOAA 1991-2020 U.S. Climate Normals...",
  "caveat": "...an aggregation and not a NOAA product..."
}`,
    notes: [
      "Dates are MM-DD, not full dates, so a cached response never goes stale on January 1. The caller decides the year.",
      "Zones 11a and warmer return frostFree: true with null dates. There is no 32°F date to give.",
      "Pair it with §1: ZIP in one call, dates in the next.",
    ],
  },
  {
    no: "§3",
    path: "/api/pests/ and /api/pests/{cropId}/",
    title: "Pest emergence and companions",
    example: "/api/pests/tomato/",
    response: `{
  "cropId": "tomato",
  "pests": [
    {
      "name": "hornworm",
      "soilTempThreshold": 60,
      "alertable": true,
      "companions": [
        {
          "companion": "Basil",
          "placement": "interplant",
          "evidenceLevel": "moderate",
          "reason": "Aromatic oils mask tomato scent..."
        }
      ]
    }
  ]
}`,
    notes: [
      "Emergence is phenology-aware: a pest carries either growing-degree-day fields (gddBase, gddBiofix, gddEvent, gddThreshold) or a soil temperature threshold, with the source named.",
      "Pests with no predictable emergence event carry alertable: false and notAlertableReason. Aphids and nematodes are the examples. Anything that turns this into a notification must skip them, or it fires from spring onward and means nothing.",
      "Companions carry an evidenceLevel. \"Widely repeated\" and \"trialled\" should not read the same to a machine.",
    ],
  },
];

export default function DataPage() {
  return (
    <>
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <span>Homesteader Labs</span>
            <span>/</span>
            <span>Field data</span>
            <span className="ml-auto">3 endpoints · static · no key</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color="text-moss">Free</Stamp>
            <Stamp color="text-slateblue" rotate="1.6deg">
              No account
            </Stamp>
            <Stamp color="text-rust" rotate="-2.2deg">
              Machine readable
            </Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            Field data
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            The reference tables behind the tools, readable by anything that
            speaks JSON. No key, no account, no rate limit, and no tracking on
            the way in.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {endpoints.map((endpoint) => (
          <section key={endpoint.path} className="mb-14">
            <SectionHead
              no={endpoint.no}
              title={endpoint.title}
              right={endpoint.path}
            />
            <p className="font-mono text-xs uppercase tracking-widest text-ink/60 mb-2">
              Example
            </p>
            <p className="mb-4">
              <Link
                href={endpoint.example}
                className="font-mono text-sm underline decoration-marker decoration-2 underline-offset-4 hover:text-marker transition-colors"
              >
                homesteaderlabs.com{endpoint.example}
              </Link>
            </p>
            <div className="overflow-x-auto">
              <pre className="card-paper p-4 text-xs leading-relaxed font-mono whitespace-pre">
                <code className="relative z-[2]">{endpoint.response}</code>
              </pre>
            </div>
            <ul className="mt-4 space-y-2">
              {endpoint.notes.map((note) => (
                <li key={note} className="flex gap-3 leading-relaxed">
                  <span className="font-mono text-marker text-sm shrink-0">
                    ·
                  </span>
                  <span className="text-ink/85">{note}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mb-14">
          <SectionHead no="§4" title="Sources and limits" />
          <ul className="space-y-3 text-ink/85 leading-relaxed">
            <li>
              <strong className="font-semibold">Zones</strong> come from the
              PRISM 2023 hardiness table. Coverage is US only, and not every ZIP
              resolves.
            </li>
            <li>
              <strong className="font-semibold">Frost normals</strong> are NOAA
              1991-2020 last and first 32°F dates at 50% probability, aggregated
              to USDA zones. USDA zones are keyed on winter minimum temperature,
              not on frost timing, so a zone-level date is a planning window and
              not a forecast for one address. This aggregation is ours, not a
              NOAA product.
            </li>
            <li>
              <strong className="font-semibold">Pest thresholds</strong> cite
              published extension guidance per pest. Where a record falls back
              to soil temperature instead of a documented biofix, it says so.
            </li>
            <li>
              Responses are static and served from a CDN, so polling them is
              cheap for you and free for us. If you need a bulk copy rather than
              per-key calls, ask and we will send the files.
            </li>
          </ul>
        </section>

        <section className="mb-14">
          <SectionHead no="§5" title="Terms" right="per dataset" />
          <p className="text-ink/85 leading-relaxed mb-6">
            Every response carries its own <code className="font-mono">license</code>,{" "}
            <code className="font-mono">licenseUrl</code> and{" "}
            <code className="font-mono">attribution</code> fields, so the terms
            travel with the data instead of living on a page nobody fetches.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-sm">
              <thead className="font-mono text-[0.7rem] uppercase tracking-widest text-ink/60 border-b-2 border-ink">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Dataset</th>
                  <th className="py-2 pr-3 font-semibold">Terms</th>
                  <th className="py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-ink/20">
                  <td className="py-3 pr-3 font-mono text-xs">zones, frost</td>
                  <td className="py-3 pr-3">
                    Public domain source, aggregation ours. Attribution
                    requested, not required.
                  </td>
                  <td className="py-3 text-ink/85">
                    PRISM and NOAA output. The underlying facts are not ours to
                    license, and we are not going to pretend otherwise.
                  </td>
                </tr>
                <tr className="border-b border-ink/20">
                  <td className="py-3 pr-3 font-mono text-xs">
                    pests, companions
                  </td>
                  <td className="py-3 pr-3">
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker transition-colors"
                    >
                      CC BY 4.0
                    </a>
                    . Commercial use fine, attribution required.
                  </td>
                  <td className="py-3 text-ink/85">
                    Ours: which pests are worth predicting, which thresholds
                    apply, how good the evidence is for each companion.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-mono text-xs">
                    crop knowledge base
                  </td>
                  <td className="py-3 pr-3">CC0, unchanged</td>
                  <td className="py-3 text-ink/85">
                    Public-domain OpenFarm data, republished as we received it.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-ink/85 leading-relaxed mb-4">
            Attribution means Homesteader Labs and the page or endpoint URL. If
            an assistant answers a gardening question from this data, a link
            back is the whole ask.
          </p>
          <p className="text-ink/85 leading-relaxed">
            Corrections are welcome and get fixed at the source:{" "}
            <a
              href="mailto:contact@homesteaderlabs.com"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker transition-colors"
            >
              contact@homesteaderlabs.com
            </a>
            . The machine-readable summary of this site lives at{" "}
            <a
              href="/llms.txt"
              className="underline decoration-marker decoration-2 underline-offset-4 hover:text-marker transition-colors"
            >
              /llms.txt
            </a>
            .
          </p>
        </section>

        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 border-t-2 border-ink pt-4">
          Station · field data · zone, frost, pests · no key required
        </p>
      </div>
    </>
  );
}
