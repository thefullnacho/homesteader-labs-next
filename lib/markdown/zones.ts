import { type MarkdownDoc, mdLink, mdTable, mdDate } from "./doc";
import {
  ZONE_PAGES,
  getZonePageData,
  isPageZone,
  type PageZone,
  FALL_FACTOR_DAYS,
} from "@/lib/tools/planting-calendar/zonePages";
import {
  STATE_PAGES,
  getStatePageData,
  isPageState,
  statesForZone,
} from "@/lib/tools/planting-calendar/statePages";

/**
 * Planting Calendar by Zone: index of all zone pages.
 * Path: /tools/planting-calendar/zone/
 */
export function zoneIndexMarkdown(): MarkdownDoc {
  const zones = ZONE_PAGES.map((zone) => {
    const d = getZonePageData(zone);
    return { zone, data: d, stillSowable: d.fallSowing().length };
  });

  const rows = zones.map(({ zone, data, stillSowable }) => [
    mdLink(`Zone ${zone}`, `/tools/planting-calendar/zone/${zone}/`),
    mdDate(data.lastSpringFrost),
    mdDate(data.firstFallFrost),
    `${data.frostFreeDays}d`,
    stillSowable,
  ]);

  const table = mdTable(
    ["Zone", "Last frost", "First frost", "Season", "Sowable now"],
    rows
  );

  const body = [
    "# Planting Calendar by Zone",
    "",
    "Frost dates, season length and fall sowing deadlines for USDA zones 4a through 10b, covering 98% of US ZIP codes. Pick your zone for its full sowing schedule.",
    "",
    "Every date on this site is counted from two numbers: your last spring frost and your first fall frost.",
    "",
    "## Find your zone",
    "",
    "Not sure which is yours? The interactive planting calendar at " +
      mdLink("/tools/planting-calendar/", "/tools/planting-calendar/") +
      " resolves it from your ZIP against the USDA 2023 map. These fourteen zones hold 39,673 of the 40,502 ZIPs in that table. The twelve left out hold 829 between them.",
    "",
    "Or start from " +
      mdLink("your state", "/tools/planting-calendar/state/") +
      ", which is the easier question if you do not know your zone yet. No state is one growing region, so a state page's job is to show you which of its zones is yours and send you back here.",
    "",
    table,
    "",
    "Sowable now counts the crops that still finish before that zone's first frost if they go in today. It falls to zero as the season closes, coldest zones first, which is the whole reason fall planting is a deadline rather than a plan.",
    "",
    "## Why zones, not cities",
    "",
    "Two cities in the same zone share a frost date, so they render an identical schedule. Buffalo and Rochester are both 6a. Zones differ from each other in a way cities in the same zone do not: every crop's sowing date shifts between every adjacent pair, because frost normals move ten to twenty days per half-zone. Fourteen substantive pages beat five hundred thin ones.",
  ].join("\n");

  return {
    path: "/tools/planting-calendar/zone/",
    title: "Planting Calendar by Zone: Frost Dates for Zones 4a to 10b",
    body,
  };
}

/**
 * Planting Calendar for a single zone.
 * Path: /tools/planting-calendar/zone/{zone}/
 * Returns null if zone is not a page zone.
 */
export function zoneMarkdown(zone: string, today: Date = new Date()): MarkdownDoc | null {
  if (!isPageZone(zone)) return null;

  const d = getZonePageData(zone as PageZone);
  const fall = d.fallSowing(today);
  const spring = d.rows.filter((r) => !r.overwinters);
  const overwinter = d.rows.filter((r) => r.overwinters);
  const states = statesForZone(zone);

  const sections: string[] = [
    `# Zone ${zone} Planting Calendar`,
    "",
    `Last frost ${mdDate(d.lastSpringFrost)}, first frost ${mdDate(d.firstFallFrost)}, give or take ${d.frostVarianceDays} days. Everything below is counted from those two dates.`,
    "",
    "## The two dates everything hangs on",
    "",
    mdTable(
      ["Label", "Value", "Note"],
      [
        ["Last spring frost", mdDate(d.lastSpringFrost), `±${d.frostVarianceDays} days`],
        ["First fall frost", mdDate(d.firstFallFrost), `±${d.frostVarianceDays} days`],
        ["Growing season", `${d.frostFreeDays} days`, "between the two"],
      ]
    ),
    "",
    "These are NOAA 1991-2020 normals for the zone, not for your yard. A normal is a midpoint: half of years frost later than this. Treat the variance as the real number and hold transplants back if the forecast argues.",
    "",
    `**${d.constraint.headline}:** ${d.constraint.body}`,
    "",
  ];

  // Section 2: Fall sowing
  sections.push("## What you can still sow");
  sections.push("");

  if (fall.length === 0) {
    sections.push(
      `Nothing. Every cool-season crop in the database now needs more days than zone ${zone} has left before ${mdDate(d.firstFallFrost)}. That is the honest answer: the sowing season has closed here, and the next window opens in spring.`
    );
  } else {
    sections.push(
      `Counted back from first frost, with ${FALL_FACTOR_DAYS} days added to each crop's maturity because autumn growth is slower than the summer days those figures were measured in. Sow by the date shown or it does not finish.`
    );
    sections.push("");

    const fallRows = fall.map((r) => [
      mdDate(r.sowBy),
      r.cropName,
      r.adjustedDays,
      r.caloriesPerPlant ?? "n/a",
      r.storageLifeDays ? `${r.storageLifeDays}d` : "n/a",
    ]);

    sections.push(
      mdTable(
        ["Sow by", "Crop", "Days", "Cal/plant", "Stores"],
        fallRows
      )
    );
    sections.push("");

    sections.push(
      "Warm-season crops are left out on purpose. A tomato sown now finishes on paper, but fruit set collapses as nights cool, so the arithmetic lies. The crops above sweeten after frost instead."
    );
  }

  sections.push("");

  // Section 3: Spring schedule
  sections.push("## The spring schedule");
  sections.push("");

  const springRows = spring.map((r) => [
    mdDate(r.startDate),
    r.cropName,
    r.startAction === "start-indoors"
      ? "Start indoors"
      : r.startAction === "transplant"
        ? "Transplant"
        : r.startAction === "direct-sow"
          ? "Direct sow"
          : "Harvest",
    r.harvestDate ? mdDate(r.harvestDate) : "n/a",
    r.caloriesPerPlant ?? "n/a",
  ]);

  sections.push(
    mdTable(
      ["Start", "Crop", "Action", "Harvest", "Cal/plant"],
      springRows
    )
  );
  sections.push("");

  if (overwinter.length > 0 && d.overwinterWindow) {
    sections.push(
      `Sown the previous autumn to overwinter, so they sit outside this season's schedule: ${overwinter.map((r) => r.cropName).join(", ")}. In zone ${zone} that window is ${d.overwinterWindow.label} of the year before.`
    );
    if (d.overwinterWindow.preChillWeeks) {
      sections.push(
        ` Zone ${zone} does not stay cold for long enough to set the bulb on its own, so the cloves want ${d.overwinterWindow.preChillWeeks[0]} to ${d.overwinterWindow.preChillWeeks[1]} weeks in a refrigerator first, or they come up as a single undivided round.`
      );
    }
    sections.push(" " + mdLink("The full garlic guide", "/archive/how-to-grow-garlic/") + " covers depth, spacing, harvest and curing.");
    sections.push("");
  }

  // Section 4: Where this zone is
  sections.push(`## Where zone ${zone} is`);
  sections.push("");

  if (states.length > 0) {
    sections.push(
      `Zone ${zone} is a material band in ${states.length === 1 ? "this state" : "these states"}, meaning it holds at least 2% of their ZIP codes. The share tells you how much of each state gardens on the dates above, and in most of them it is a minority: a state is not a growing region.`
    );
    sections.push("");
    const stateLinks = states
      .map((s) => `${mdLink(s.name, `/tools/planting-calendar/state/${s.slug}/`)} (${Math.round(s.share * 100)}%)`)
      .join(" / ");
    sections.push(stateLinks);
  } else {
    sections.push(
      `None of the states with pages so far carries zone ${zone} as a material band, so this is a zone that turns up in pockets rather than across whole states. The ${mdLink("state pages", "/tools/planting-calendar/state/")} cover ten states at the moment, and more will be added.`
    );
  }

  sections.push("");

  // Section 5: Other zones
  sections.push("## Other zones");
  sections.push("");
  sections.push(
    "Not sure which is yours? The " +
      mdLink("planting calendar", "/tools/planting-calendar/") +
      " resolves it from your ZIP against the USDA 2023 map, rather than asking you to read a color off a picture."
  );
  sections.push("");

  const zoneLinks = ZONE_PAGES.map((z) =>
    z === zone
      ? `**Zone ${z}**`
      : mdLink(`Zone ${z}`, `/tools/planting-calendar/zone/${z}/`)
  ).join(" / ");
  sections.push(zoneLinks);

  return {
    path: `/tools/planting-calendar/zone/${zone}/`,
    title: `Zone ${zone} Planting Calendar`,
    body: sections.join("\n"),
  };
}

/**
 * Planting Calendar by State: index of all state pages.
 * Path: /tools/planting-calendar/state/
 */
export function stateIndexMarkdown(): MarkdownDoc {
  // Sorted widest spread first
  const states = STATE_PAGES.map(getStatePageData).sort((a, b) => b.spreadDays - a.spreadDays);

  const rows = states.map((s) => {
    const lo = s.bands[0].zone;
    const hi = s.bands[s.bands.length - 1].zone;
    return [
      mdLink(s.name, `/tools/planting-calendar/state/${s.slug}/`),
      `${lo} to ${hi}`,
      s.bands.length,
      `${s.spreadDays}d`,
      `${s.seasonRange[0]}-${s.seasonRange[1]}d`,
    ];
  });

  const table = mdTable(
    ["State", "Zones", "Bands", "Spread", "Season"],
    rows
  );

  const body = [
    "# Planting Calendar by State",
    "",
    "How many hardiness zones each state actually contains, and how many days separate the coldest from the warmest. Find your zone by ZIP, then plant on its dates rather than the state average.",
    "",
    "No state is one growing region. The question a state page answers is how many calendars yours actually contains, and which of them is yours.",
    "",
    "## How far apart a state runs",
    "",
    "Spread is the number of days between the last spring frost in the state's coldest material band and its warmest. It is the measure of how wrong a single state-wide planting date can be, and in the widest states here it is most of a season.",
    "",
    table,
    "",
    "A band is a zone holding at least 2% of the state's ZIP codes. Smaller pockets exist nearly everywhere and are named on each state's page, but tabulating a zone that covers a fraction of a percent of a state invites the other 99% to follow the wrong link.",
    "",
    "## Why ten states, and not fifty",
    "",
    "Because a complete set of thin pages is worth less than a short set of substantial ones, and we have already proven that on this site the expensive way. These ten were picked to span the range. If the shape holds across all three, the rest of the country follows. If it does not, no amount of coverage would have saved it.",
    "",
    "If you already know your zone, skip the state entirely and go straight to " +
      mdLink("the zone calendars", "/tools/planting-calendar/zone/") +
      ". The state is a way of finding the zone, not a substitute for it.",
  ].join("\n");

  return {
    path: "/tools/planting-calendar/state/",
    title: "Planting Calendar by State: Zone Spread and Frost Dates",
    body,
  };
}

/**
 * Planting Calendar for a single state.
 * Path: /tools/planting-calendar/state/{state}/
 * Returns null if state is not a page state.
 */
export function stateMarkdown(slug: string, today: Date = new Date()): MarkdownDoc | null {
  if (!isPageState(slug)) return null;

  const d = getStatePageData(slug);
  const coldest = d.bands[0];
  const warmest = d.bands[d.bands.length - 1];
  const sowing = d.nowSowing(today).filter((s) => s.rows.length > 0);
  const uncovered = d.bands.filter((b) => !b.hasPage);

  const sections: string[] = [
    `# ${d.name} Planting Calendar`,
    "",
  ];

  // Header deck
  if (coldest.lastSpringFrost && warmest.lastSpringFrost) {
    sections.push(
      `Last frost runs from ${mdDate(coldest.lastSpringFrost)} in zone ${coldest.zone} to ${mdDate(warmest.lastSpringFrost)} in zone ${warmest.zone}. Which of those is yours decides every date that follows.`
    );
  } else {
    sections.push(
      `${d.name} spans zone ${coldest.zone} to zone ${warmest.zone}, and the warm end runs frost-free. Which band is yours decides every date that follows.`
    );
  }
  sections.push("");

  // Section 1: The spread
  sections.push("## The spread");
  sections.push("");

  sections.push(
    mdTable(
      ["Label", "Value", "Note"],
      [
        [
          `Coldest band, zone ${coldest.zone}`,
          coldest.lastSpringFrost ? mdDate(coldest.lastSpringFrost) : "no frost data",
          `${Math.round(coldest.share * 100)}% of the state`,
        ],
        [
          `Warmest band, zone ${warmest.zone}`,
          warmest.lastSpringFrost ? mdDate(warmest.lastSpringFrost) : "effectively frost-free",
          `${Math.round(warmest.share * 100)}% of the state`,
        ],
        ["Spread", `${d.spreadDays} days`, `season ${d.seasonRange[0]}-${d.seasonRange[1]} days`],
      ]
    )
  );
  sections.push("");

  sections.push(`**${d.shape.headline}:** ${d.shape.body}`);
  sections.push("");

  // Section 2: Find your zone (skip the interactive component, just prose)
  sections.push("## Find your zone");
  sections.push("");
  sections.push(
    "This is the only input that matters. It resolves against the USDA 2023 map rather than asking you to read a color off a picture, and it sends you to that zone's full schedule."
  );
  sections.push("");
  sections.push(
    "Use the interactive " +
      mdLink("planting calendar tool", "/tools/planting-calendar/") +
      " to find your zone from your ZIP code."
  );
  sections.push("");

  // Section 3: What to plant now
  sections.push("## What to plant now, by band");
  sections.push("");

  if (sowing.length === 0) {
    sections.push(
      `Nothing, anywhere in ${d.name}. Every cool-season crop in the database now needs more days than the warmest band here has left before its first frost. The sowing season has closed statewide, and the next window opens in spring.`
    );
  } else {
    sections.push(
      `One table, not one per zone, because the comparison is the point. The gap between the first row and the last is the ${d.spreadDays}-day spread made concrete: the warm end of ${d.name} has weeks the cold end does not. Each band shows its 5 most urgent crops, earliest deadline first.`
    );
    sections.push("");

    const sowRows = [];
    for (const { band, rows } of sowing) {
      const limited = rows.slice(0, 5);
      for (let i = 0; i < limited.length; i++) {
        const r = limited[i];
        const bandCell = i === 0 ? mdLink(band.zone, `/tools/planting-calendar/zone/${band.zone}/`) : ".";
        sowRows.push([
          bandCell,
          mdDate(r.sowBy),
          r.cropName,
          r.adjustedDays,
          r.caloriesPerPlant ?? "n/a",
        ]);
      }
    }

    sections.push(
      mdTable(
        ["Band", "Sow by", "Crop", "Days", "Cal/plant"],
        sowRows
      )
    );
    sections.push("");

    sections.push(
      "Deadlines are counted back from each band's own first frost, with two weeks added to every crop's maturity because autumn growth is slower than the summer days those figures were measured in. Follow a band's link for its full list."
    );
  }

  sections.push("");

  // Section 4: Zones in this state
  sections.push(`## Zones in ${d.name}`);
  sections.push("");

  const bandRows = d.bands.map((b) => [
    b.hasPage
      ? mdLink(`Zone ${b.zone}`, `/tools/planting-calendar/zone/${b.zone}/`)
      : `Zone ${b.zone}`,
    `${Math.round(b.share * 100)}%`,
    b.lastSpringFrost ? mdDate(b.lastSpringFrost) : "none",
    b.firstFallFrost ? mdDate(b.firstFallFrost) : "none",
    b.frostFreeDays ? `${b.frostFreeDays}d` : "year-round",
  ]);

  sections.push(
    mdTable(
      ["Zone", "Share", "Last frost", "First frost", "Season"],
      bandRows
    )
  );
  sections.push("");

  sections.push(
    `Share is the percentage of ${d.name} ZIP codes in that band, from the PRISM 2023 map. It is area-weighted, so a rural band covering half the map may hold a good deal fewer gardeners than its number suggests.`
  );

  if (d.minorZones.length > 0) {
    const minorLabel = d.minorZones.length === 1 ? "Zone" : "Zones";
    const minorVerb = d.minorZones.length === 1 ? "is" : "are";
    const minorHold = d.minorZones.length === 1 ? "holds" : "hold";
    sections.push(
      ` ${minorLabel} ${d.minorZones.join(", ")} ${minorVerb} also present in ${d.name} but ${minorHold} under 2% of its ZIP codes each, too little to be worth a row here.`
    );
  }
  sections.push("");

  if (uncovered.length > 0) {
    const uncoverPct = Math.round((1 - d.coverage) * 100);
    const uncoveredLabel = uncovered.length === 1 ? "is" : "are";
    sections.push(
      `**${uncoverPct}% of ${d.name} has no calendar page.** ${uncovered.map((b) => `Zone ${b.zone}`).join(", ")} ${uncoveredLabel} frost-free, or near enough that NOAA records no reliable 32 degree F date to count from. A calendar there is a heat calendar rather than a frost one, and building one on frost normals that do not exist would be inventing the data. Until that is done properly, the ${mdLink("interactive calendar", "/tools/planting-calendar/")} will work from dates you supply.`
    );
    sections.push("");
  }

  // Section 5: Other states
  sections.push("## Other states");
  sections.push("");
  sections.push(
    "Neighbours first. A state line is not a climate boundary, so if you garden near one, the state next door is often closer to your conditions than the far end of your own."
  );
  sections.push("");

  // Build neighbour links
  const allStateLinks = [
    ...d.neighbours.filter(isPageState),
    ...STATE_PAGES.filter((s) => s !== d.slug && !d.neighbours.includes(s)),
  ];

  const stateButtonText = allStateLinks
    .map((slug) => mdLink(STATE_PAGES[STATE_PAGES.indexOf(slug) >= 0 ? STATE_PAGES.indexOf(slug) : 0] === slug ? getStatePageData(slug).name : slug, `/tools/planting-calendar/state/${slug}/`))
    .join(" / ");
  sections.push(stateButtonText);
  sections.push("");

  sections.push(
    "Ten states have pages so far, chosen to span the range. " +
      mdLink("All of them, side by side", "/tools/planting-calendar/state/") +
      ", or work from " +
      mdLink("the zone list", "/tools/planting-calendar/zone/") +
      " if you already know yours."
  );

  return {
    path: `/tools/planting-calendar/state/${d.slug}/`,
    title: `${d.name} Planting Calendar: Zones, Frost Dates and What to Plant Now`,
    body: sections.join("\n"),
  };
}

/**
 * Every path the four functions can render.
 * Used by the route to know which markdown versions to generate.
 */
export function zoneMarkdownPaths(): string[] {
  const paths: string[] = [
    "/tools/planting-calendar/zone/",
    "/tools/planting-calendar/state/",
  ];

  // Zone pages
  for (const zone of ZONE_PAGES) {
    paths.push(`/tools/planting-calendar/zone/${zone}/`);
  }

  // State pages
  for (const state of STATE_PAGES) {
    paths.push(`/tools/planting-calendar/state/${state}/`);
  }

  return paths;
}
