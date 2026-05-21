import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { SurvivalPlanOutput, PlanSchedule } from './types';

const colors = {
  bg: '#1a1a1a',
  bgAlt: '#221c14',
  fg: '#E8D3BE',
  accent: '#ff7300',
  accentSoft: '#3a2616',
  muted: '#8a8a8a',
  border: '#3a3a3a',
  borderBright: '#5a4a3a',
  blue: '#4a8aff',
  green: '#5ec97c',
  yellow: '#e8c14a',
  red: '#ff5a4a',
};

const ACTION_PALETTE: Record<string, { bg: string; fg: string; label: string }> = {
  'start-indoors': { bg: '#0f2942', fg: colors.blue,   label: 'START INDOORS' },
  'transplant':    { bg: '#0f2a18', fg: colors.green,  label: 'TRANSPLANT' },
  'direct-sow':    { bg: '#2a2010', fg: colors.yellow, label: 'DIRECT SOW' },
  'harvest':       { bg: '#2a1610', fg: colors.accent, label: 'HARVEST' },
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    color: colors.fg,
    fontSize: 9,
    fontFamily: 'Courier',
    padding: 36,
    paddingBottom: 56,
  },

  // Page header bar
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 6,
    marginBottom: 16,
  },
  pageHeaderLeft: { fontSize: 8, color: colors.accent, fontFamily: 'Courier-Bold', textTransform: 'uppercase', letterSpacing: 1 },
  pageHeaderRight: { fontSize: 7, color: colors.muted, textTransform: 'uppercase' },

  // Typography
  h1Mega:  { fontSize: 56, fontFamily: 'Courier-Bold', color: colors.accent, textTransform: 'uppercase', letterSpacing: -1 },
  h1:      { fontSize: 22, fontFamily: 'Courier-Bold', color: colors.accent, marginBottom: 6, textTransform: 'uppercase' },
  h2:      { fontSize: 13, fontFamily: 'Courier-Bold', color: colors.fg, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  h3:      { fontSize: 10, fontFamily: 'Courier-Bold', color: colors.fg, marginBottom: 4, textTransform: 'uppercase' },
  small:   { fontSize: 7, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Blocks
  block:        { borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 8 },
  blockAccent:  { borderWidth: 2, borderColor: colors.accent, padding: 12, marginBottom: 8, backgroundColor: colors.accentSoft },

  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label:      { color: colors.muted, fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  value:      { color: colors.fg, fontSize: 10, fontFamily: 'Courier-Bold' },
  valueAccent:{ color: colors.accent, fontSize: 12, fontFamily: 'Courier-Bold' },

  // Crop list
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    gap: 8,
  },
  cropRank: { width: 18, fontSize: 9, color: colors.muted, fontFamily: 'Courier-Bold' },
  cropIcon: { fontSize: 12, width: 16 },
  cropMain: { flex: 1 },
  cropName: { fontSize: 10, fontFamily: 'Courier-Bold', color: colors.fg },
  cropMeta: { fontSize: 7.5, color: colors.muted, marginTop: 2, letterSpacing: 0.2 },
  cropRight: { width: 80, alignItems: 'flex-end' },

  // Schedule action chip
  chip: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 7,
    letterSpacing: 0.5,
    fontFamily: 'Courier-Bold',
    textAlign: 'center',
    minWidth: 72,
  },

  // Layout grid
  gridContainer: { borderWidth: 2, borderColor: colors.accent, padding: 4, alignSelf: 'flex-start' },
  gridRow: { flexDirection: 'row' },
  gridCell: {
    width: 12,
    height: 12,
    borderWidth: 0.4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  link: { color: colors.accent, textDecoration: 'underline', fontSize: 9, fontFamily: 'Courier-Bold' },

  // Caloric progress bar
  progressTrack: {
    height: 12,
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.borderBright,
    marginTop: 6,
    marginBottom: 4,
  },
  progressFill: { height: '100%', backgroundColor: colors.accent },
});

interface Props {
  plan: SurvivalPlanOutput;
  qrCodeDataUrl?: string;
}

function PageHeader({ section, planId }: { section: string; planId: string }) {
  return (
    <View style={styles.pageHeader} fixed>
      <Text style={styles.pageHeaderLeft}>HL // {section}</Text>
      <Text style={styles.pageHeaderRight}>Plan_{planId.slice(-8).toUpperCase()}</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>Homesteader_Labs · Survival_Garden_Plan</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ActionChip({ action }: { action: string }) {
  const palette = ACTION_PALETTE[action] ?? { bg: colors.border, fg: colors.fg, label: action.toUpperCase() };
  return (
    <Text style={[styles.chip, { backgroundColor: palette.bg, color: palette.fg }]}>
      {palette.label}
    </Text>
  );
}

function groupByMonth(schedule: PlanSchedule[]): Array<{ month: string; weeks: PlanSchedule[] }> {
  const groups = new Map<string, PlanSchedule[]>();
  for (const week of schedule) {
    const date = new Date(week.events[0]?.dateIso ?? `${week.weekIso.slice(0, 4)}-01-01`);
    const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month)!.push(week);
  }
  return Array.from(groups.entries()).map(([month, weeks]) => ({ month, weeks }));
}

export function SurvivalPlanPdf({ plan, qrCodeDataUrl }: Props) {
  const grid: Array<Array<{ icon: string; name: string; cropId: string } | null>> = Array.from(
    { length: plan.layoutGridHeight },
    () => Array(plan.layoutGridWidth).fill(null),
  );
  for (const cell of plan.layout) {
    for (let dy = 0; dy < cell.h; dy++) {
      for (let dx = 0; dx < cell.w; dx++) {
        const gy = cell.y + dy;
        const gx = cell.x + dx;
        if (gy < grid.length && gx < grid[gy].length) {
          grid[gy][gx] = { icon: cell.icon, name: cell.cropName, cropId: cell.cropId };
        }
      }
    }
  }

  const generatedDate = new Date(plan.generatedAtIso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const householdSize = plan.input.adults + plan.input.kids;
  const dailyTarget = householdSize * 2000;
  const annualTarget = dailyTarget * 365;
  const targetFillPct = Math.min(100, Math.round((plan.totalKcal / annualTarget) * 100));

  const monthGroups = groupByMonth(plan.schedule);

  return (
    <Document>
      {/* ---------------- COVER ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'space-between', paddingTop: 24 }}>
          <View>
            <Text style={styles.small}>Homesteader_Labs · Field_Manual</Text>
            <Text style={[styles.small, { marginTop: 4 }]}>Plan_{plan.planId.slice(-8).toUpperCase()}</Text>
          </View>

          <View>
            <Text style={[styles.h1Mega, { fontSize: 52 }]}>Survival</Text>
            <Text style={[styles.h1Mega, { fontSize: 52, marginBottom: 24 }]}>Garden_Plan</Text>

            <View style={styles.blockAccent}>
              <Text style={[styles.small, { color: colors.accent, marginBottom: 8 }]}>Designed for</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Zone</Text>
                <Text style={styles.valueAccent}>{plan.growingZone.toUpperCase()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{plan.frostDates.city ?? plan.input.zipCode}{plan.frostDates.state ? `, ${plan.frostDates.state}` : ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Household</Text>
                <Text style={styles.value}>{plan.input.adults} adult{plan.input.adults !== 1 ? 's' : ''}{plan.input.kids > 0 ? ` · ${plan.input.kids} kid${plan.input.kids !== 1 ? 's' : ''}` : ''}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Garden</Text>
                <Text style={styles.value}>{plan.input.squareFeet} sq ft · {plan.input.gardenType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Primary goal</Text>
                <Text style={styles.value}>{plan.input.goal.replace('-', ' ')}</Text>
              </View>
            </View>

            <View style={[styles.block, { borderColor: colors.accent }]}>
              <View style={styles.row}>
                <Text style={styles.label}>Last spring frost</Text>
                <Text style={styles.value}>{new Date(plan.frostDates.lastSpringFrost).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>First fall frost</Text>
                <Text style={styles.value}>{new Date(plan.frostDates.firstFallFrost).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Frost-free days</Text>
                <Text style={styles.value}>{plan.frostDates.frostFreeDays}</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.small}>Generated · {generatedDate}</Text>
            <Text style={[styles.small, { marginTop: 2 }]}>homesteaderlabs.com</Text>
          </View>
        </View>
      </Page>

      {/* ---------------- CROP LINEUP ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Crop_Lineup" planId={plan.planId} />

        <View style={styles.blockAccent}>
          <View style={styles.row}>
            <View>
              <Text style={styles.small}>Projected annual yield</Text>
              <Text style={[styles.valueAccent, { fontSize: 22 }]}>{plan.totalKcal.toLocaleString()} kcal</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.small}>Household days of food</Text>
              <Text style={[styles.valueAccent, { fontSize: 22 }]}>{plan.daysOfFood.toFixed(0)} d</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${targetFillPct}%` }]} />
          </View>
          <Text style={[styles.small, { color: colors.fg }]}>
            {targetFillPct}% of annual household need ({householdSize} × 2000 kcal × 365 d = {annualTarget.toLocaleString()} kcal/year)
          </Text>
        </View>

        <Text style={[styles.h3, { marginTop: 14, marginBottom: 6 }]}>Ranked_by_{plan.input.goal.replace('-', '_')}</Text>

        {plan.allocations.map((a, i) => (
          <View key={i} style={styles.cropRow}>
            <Text style={styles.cropRank}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.cropIcon}>{plan.layout.find(l => l.cropId === a.cropId)?.icon ?? '·'}</Text>
            <View style={styles.cropMain}>
              <Text style={styles.cropName}>{a.cropName}</Text>
              <Text style={styles.cropMeta}>{a.varietyName} · {a.rationale}</Text>
            </View>
            <View style={styles.cropRight}>
              <Text style={[styles.value, { color: colors.accent }]}>{a.projectedKcal.toLocaleString()} kcal</Text>
              <Text style={styles.cropMeta}>{a.plantCount}× · {a.sqFtUsed.toFixed(1)} sqft</Text>
            </View>
          </View>
        ))}

        <PageFooter />
      </Page>

      {/* ---------------- LAYOUT GRID ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Garden_Layout" planId={plan.planId} />

        <Text style={styles.h2}>{plan.layoutGridWidth} × {plan.layoutGridHeight} ft block</Text>
        <Text style={[styles.small, { marginBottom: 14 }]}>Each cell = 1 sq ft · plant icons indicate placement</Text>

        <View style={styles.gridContainer}>
          {grid.map((row, y) => (
            <View key={y} style={styles.gridRow}>
              {row.map((cell, x) => (
                <View key={x} style={[styles.gridCell, cell ? { backgroundColor: colors.accentSoft } : { backgroundColor: colors.bgAlt }]}>
                  <Text style={{ fontSize: 6 }}>{cell ? cell.icon : ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={[styles.h3, { marginTop: 18 }]}>Legend</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
          {plan.allocations.map((a, i) => {
            const icon = plan.layout.find(l => l.cropId === a.cropId)?.icon ?? '·';
            return (
              <View key={i} style={{ width: '50%', marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 10, width: 14 }}>{icon}</Text>
                <Text style={{ fontSize: 9, color: colors.fg }}>{a.cropName}</Text>
                <Text style={{ fontSize: 8, color: colors.muted }}> · {a.sqFtUsed.toFixed(1)} sqft</Text>
              </View>
            );
          })}
        </View>

        <PageFooter />
      </Page>

      {/* ---------------- SCHEDULE (month-grouped) ---------------- */}
      <Page size="LETTER" style={styles.page} wrap>
        <PageHeader section="Sowing_Schedule" planId={plan.planId} />

        <Text style={[styles.small, { marginBottom: 12 }]}>
          {plan.schedule.length} action weeks · anchored to your frost dates
        </Text>

        {monthGroups.map((group, gi) => (
          <View key={gi} style={{ marginBottom: 12 }} wrap={false}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.accent, paddingBottom: 4, marginBottom: 6 }}>
              <Text style={[styles.h3, { color: colors.accent, marginBottom: 0 }]}>{group.month}</Text>
            </View>

            {group.weeks.map((week, wi) => (
              <View key={wi} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={[styles.small, { color: colors.fg, marginBottom: 3 }]}>Week of {week.weekLabel}</Text>
                {week.events.map((e, ei) => (
                  <View key={ei} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <ActionChip action={e.action} />
                    <Text style={{ fontSize: 9, fontFamily: 'Courier-Bold' }}>{e.cropName}</Text>
                    <Text style={{ fontSize: 8, color: colors.muted }}>· {e.varietyName}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        <PageFooter />
      </Page>

      {/* ---------------- COMPANIONS + PRESERVATION ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Companions_·_Preservation" planId={plan.planId} />

        <Text style={styles.h2}>Companion_Pairings</Text>
        {plan.companions.slice(0, 10).map((c, i) => (
          <View key={i} style={{ marginBottom: 8 }}>
            <Text style={[styles.cropName, { color: colors.accent }]}>{c.cropName}</Text>
            {c.companions.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[styles.cropMeta, { color: colors.green, marginRight: 6 }]}>+ Grows with:</Text>
                <Text style={styles.cropMeta}>{c.companions.slice(0, 6).join(', ')}</Text>
              </View>
            )}
            {c.antagonists.length > 0 && (
              <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={[styles.cropMeta, { color: colors.red, marginRight: 6 }]}>− Keep apart:</Text>
                <Text style={styles.cropMeta}>{c.antagonists.slice(0, 6).join(', ')}</Text>
              </View>
            )}
          </View>
        ))}

        <Text style={[styles.h2, { marginTop: 16 }]}>Preservation_Timeline</Text>
        {plan.preservation.slice(0, 14).map((p, i) => (
          <View key={i} style={styles.cropRow}>
            <View style={styles.cropMain}>
              <Text style={styles.cropName}>{p.cropName}</Text>
              <Text style={styles.cropMeta}>
                Harvest ~ {new Date(p.harvestDateIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {p.methods.length > 0 ? p.methods.join(' · ') : 'fresh only'}
              </Text>
            </View>
            <View style={styles.cropRight}>
              <Text style={[styles.value, { color: colors.accent }]}>{p.storageMonths > 0 ? `${p.storageMonths} mo` : '—'}</Text>
            </View>
          </View>
        ))}

        <PageFooter />
      </Page>

      {/* ---------------- MACROS ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Nutrition" planId={plan.planId} />

        <Text style={styles.h2}>Macro_Projection</Text>

        <View style={styles.blockAccent}>
          <Text style={[styles.small, { color: colors.accent, marginBottom: 8 }]}>Full-season output</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Calories</Text>
            <Text style={[styles.valueAccent, { fontSize: 18 }]}>{plan.totalKcal.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Protein</Text>
            <Text style={[styles.value, { fontSize: 14 }]}>{Math.round(plan.totalProteinG).toLocaleString()} g</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carbohydrate</Text>
            <Text style={[styles.value, { fontSize: 14 }]}>{Math.round(plan.totalCarbsG).toLocaleString()} g</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fat</Text>
            <Text style={[styles.value, { fontSize: 14 }]}>{Math.round(plan.totalFatG).toLocaleString()} g</Text>
          </View>
        </View>

        <Text style={[styles.h3, { marginTop: 14 }]}>Days_of_Food</Text>
        <Text style={[styles.h1Mega, { fontSize: 80, marginTop: 6 }]}>{plan.daysOfFood.toFixed(0)}</Text>
        <Text style={[styles.small, { marginTop: 4 }]}>
          days at {dailyTarget.toLocaleString()} kcal/day target ({householdSize}-person household, standard activity)
        </Text>

        <View style={[styles.block, { marginTop: 24 }]}>
          <Text style={[styles.small, { marginBottom: 4 }]}>How_to_read_this</Text>
          <Text style={{ fontSize: 8.5, color: colors.fg, lineHeight: 1.5 }}>
            Yield projections are seasonally adjusted using a skill-level coefficient ({plan.input.experience}, ~{plan.input.experience === 'beginner' ? '60' : plan.input.experience === 'intermediate' ? '80' : '100'}% of expert benchmark) and based on average outputs per plant. Real-world results vary with weather, soil, and pest pressure. Treat these numbers as planning anchors, not guarantees.
          </Text>
        </View>

        <PageFooter />
      </Page>

      {/* ---------------- SEED LIST ---------------- */}
      <Page size="LETTER" style={styles.page} wrap>
        <PageHeader section="Seed_Shopping_List" planId={plan.planId} />

        <Text style={[styles.small, { marginBottom: 12 }]}>
          Recommended varieties for your zone · click each to source · ethical vendors only
        </Text>

        {plan.affiliateLinks.map((link, i) => (
          <View key={i} style={styles.cropRow}>
            <View style={styles.cropMain}>
              <Text style={styles.cropName}>{link.cropName}</Text>
              <Text style={styles.cropMeta}>{link.varietyName} · {link.vendor}</Text>
            </View>
            <Link src={link.url} style={styles.link}>buy →</Link>
          </View>
        ))}

        <Text style={[styles.small, { marginTop: 16, fontStyle: 'italic', color: colors.muted }]}>
          Disclosure: Homesteader Labs earns a small commission on purchases through these links. All listed vendors are vetted for seed quality, ethos alignment, and responsiveness.
        </Text>

        <PageFooter />
      </Page>

      {/* ---------------- FROST RISK + QR ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Frost_Risk_·_Companion" planId={plan.planId} />

        <Text style={styles.h2}>Frost_Action_Card</Text>

        <View style={styles.block}>
          <Text style={[styles.h3, { color: colors.green }]}>Spring transition</Text>
          <View style={styles.row}><Text style={styles.label}>Last frost (avg)</Text><Text style={styles.value}>{new Date(plan.frostDates.lastSpringFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Variance</Text><Text style={styles.value}>±{plan.frostDates.lastSpringFrostConfidence} days</Text></View>
          <Text style={[styles.cropMeta, { marginTop: 4, color: colors.fg, lineHeight: 1.4 }]}>
            Start frost-sensitive crops indoors 6–8 weeks before this date. Harden off seedlings 7 days before transplanting. Cover direct-sown crops if a late frost is forecast.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={[styles.h3, { color: colors.accent }]}>Fall transition</Text>
          <View style={styles.row}><Text style={styles.label}>First frost (avg)</Text><Text style={styles.value}>{new Date(plan.frostDates.firstFallFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Variance</Text><Text style={styles.value}>±{plan.frostDates.firstFallFrostConfidence} days</Text></View>
          <Text style={[styles.cropMeta, { marginTop: 4, color: colors.fg, lineHeight: 1.4 }]}>
            Harvest tender crops 7 days before this date. Cover frost-hardy crops (kale, carrots, leeks) for extended fall yield. Mulch heavily on root crops to extend cold-storage in-ground.
          </Text>
        </View>

        <Text style={[styles.h2, { marginTop: 20 }]}>Live_Companion_Page</Text>
        <Text style={[styles.small, { marginBottom: 8 }]}>
          Scan this code to view your plan interactively — adjust inputs, see new scenarios, log harvests.
        </Text>

        {qrCodeDataUrl && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrCodeDataUrl} style={{ width: 130, height: 130 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.small, { marginBottom: 4 }]}>or visit</Text>
              <Link src={plan.companionUrl} style={[styles.link, { fontSize: 8 }]}>
                {plan.companionUrl.length > 60 ? plan.companionUrl.slice(0, 60) + '…' : plan.companionUrl}
              </Link>
            </View>
          </View>
        )}

        <PageFooter />
      </Page>

      {/* ---------------- NOTES ---------------- */}
      <Page size="LETTER" style={styles.page}>
        <PageHeader section="Field_Notes" planId={plan.planId} />

        <Text style={styles.h2}>Field_Notes</Text>
        <Text style={[styles.small, { marginBottom: 16 }]}>Track sowing dates, weather events, harvest weights.</Text>

        {Array.from({ length: 26 }).map((_, i) => (
          <View key={i} style={{ borderBottomWidth: 0.5, borderBottomColor: colors.border, height: 22 }} />
        ))}

        <PageFooter />
      </Page>
    </Document>
  );
}
