import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import type { SurvivalPlanOutput } from './types';

const colors = {
  bg: '#1a1a1a',
  fg: '#E8D3BE',
  accent: '#ff7300',
  muted: '#8a8a8a',
  border: '#3a3a3a',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    color: colors.fg,
    fontSize: 9,
    fontFamily: 'Courier',
    padding: 36,
  },
  h1: { fontSize: 22, fontWeight: 'bold', color: colors.accent, marginBottom: 6, textTransform: 'uppercase' },
  h2: { fontSize: 14, fontWeight: 'bold', color: colors.accent, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', borderBottomWidth: 2, borderBottomColor: colors.accent, paddingBottom: 4 },
  h3: { fontSize: 11, fontWeight: 'bold', color: colors.fg, marginBottom: 4, textTransform: 'uppercase' },
  small: { fontSize: 7, color: colors.muted, textTransform: 'uppercase' },
  block: { borderWidth: 2, borderColor: colors.border, padding: 12, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: colors.muted, fontSize: 8, textTransform: 'uppercase' },
  value: { color: colors.fg, fontSize: 10, fontWeight: 'bold' },
  cropRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 },
  cropName: { fontSize: 10, fontWeight: 'bold', color: colors.fg, flex: 1 },
  cropMeta: { fontSize: 8, color: colors.muted, marginTop: 2 },
  rightCol: { textAlign: 'right', minWidth: 60 },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: colors.muted, textTransform: 'uppercase' },
  gridContainer: { borderWidth: 2, borderColor: colors.accent, padding: 4 },
  gridRow: { flexDirection: 'row' },
  gridCell: { width: 14, height: 14, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', fontSize: 7 },
  link: { color: colors.accent, textDecoration: 'underline', fontSize: 8 },
});

const actionLabel: Record<string, string> = {
  'start-indoors': 'START INDOORS',
  'transplant': 'TRANSPLANT',
  'direct-sow': 'DIRECT SOW',
  'harvest': 'HARVEST',
};

interface Props {
  plan: SurvivalPlanOutput;
  qrCodeDataUrl?: string;
}

function PageFooter({ planId }: { planId: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>HL_SGP // PLAN_{planId.slice(0, 8).toUpperCase()}</Text>
      <Text>HOMESTEADERLABS.COM</Text>
    </View>
  );
}

export function SurvivalPlanPdf({ plan, qrCodeDataUrl }: Props) {
  const grid: Array<Array<{ icon: string; name: string } | null>> = Array.from(
    { length: plan.layoutGridHeight },
    () => Array(plan.layoutGridWidth).fill(null),
  );
  for (const cell of plan.layout) {
    for (let dy = 0; dy < cell.h; dy++) {
      for (let dx = 0; dx < cell.w; dx++) {
        const gy = cell.y + dy;
        const gx = cell.x + dx;
        if (gy < grid.length && gx < grid[gy].length) {
          grid[gy][gx] = { icon: cell.icon, name: cell.cropName };
        }
      }
    }
  }

  const generatedDate = new Date(plan.generatedAtIso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Document>
      {/* COVER */}
      <Page size="LETTER" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.small}>Homesteader_Labs // Field_Manual</Text>
          <Text style={[styles.h1, { fontSize: 36, marginTop: 12 }]}>Survival</Text>
          <Text style={[styles.h1, { fontSize: 36, marginBottom: 36 }]}>Garden_Plan</Text>

          <View style={styles.block}>
            <View style={styles.row}><Text style={styles.label}>Growing zone</Text><Text style={styles.value}>{plan.growingZone}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Location</Text><Text style={styles.value}>{plan.frostDates.city ?? plan.input.zipCode}{plan.frostDates.state ? `, ${plan.frostDates.state}` : ''}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Last spring frost</Text><Text style={styles.value}>{new Date(plan.frostDates.lastSpringFrost).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text></View>
            <View style={styles.row}><Text style={styles.label}>First fall frost</Text><Text style={styles.value}>{new Date(plan.frostDates.firstFallFrost).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Frost-free days</Text><Text style={styles.value}>{plan.frostDates.frostFreeDays}</Text></View>
          </View>

          <View style={styles.block}>
            <View style={styles.row}><Text style={styles.label}>Household</Text><Text style={styles.value}>{plan.input.adults} adult{plan.input.adults !== 1 ? 's' : ''}{plan.input.kids > 0 ? `, ${plan.input.kids} kid${plan.input.kids !== 1 ? 's' : ''}` : ''}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Garden space</Text><Text style={styles.value}>{plan.input.squareFeet} sq ft ({plan.input.gardenType})</Text></View>
            <View style={styles.row}><Text style={styles.label}>Goal</Text><Text style={styles.value}>{plan.input.goal.replace('-', ' ')}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Experience</Text><Text style={styles.value}>{plan.input.experience}</Text></View>
          </View>

          <Text style={[styles.small, { marginTop: 24 }]}>Generated // {generatedDate}</Text>
          <Text style={styles.small}>Plan_ID // {plan.planId}</Text>
        </View>
        <PageFooter planId={plan.planId} />
      </Page>

      {/* CROP LINEUP */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Crop_Lineup</Text>
        <Text style={[styles.small, { marginBottom: 12 }]}>
          {plan.allocations.length} crops selected · ~{plan.totalKcal.toLocaleString()} kcal projected · {plan.daysOfFood.toFixed(0)} days of food
        </Text>

        {plan.allocations.map((a, i) => (
          <View key={i} style={styles.cropRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>{i + 1}. {a.cropName}</Text>
              <Text style={styles.cropMeta}>{a.varietyName} · {a.rationale}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.value}>{a.plantCount} plants</Text>
              <Text style={styles.cropMeta}>{a.sqFtUsed.toFixed(1)} sqft · {a.projectedKcal.toLocaleString()} kcal</Text>
            </View>
          </View>
        ))}

        <PageFooter planId={plan.planId} />
      </Page>

      {/* LAYOUT GRID */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Garden_Layout</Text>
        <Text style={[styles.small, { marginBottom: 12 }]}>
          {plan.layoutGridWidth} × {plan.layoutGridHeight} ft grid · each cell = 1 sq ft
        </Text>

        <View style={styles.gridContainer}>
          {grid.map((row, y) => (
            <View key={y} style={styles.gridRow}>
              {row.map((cell, x) => (
                <View key={x} style={[styles.gridCell, cell ? { backgroundColor: '#2a1f12' } : {}]}>
                  <Text style={{ fontSize: 6 }}>{cell ? cell.icon : ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={[styles.h3, { marginTop: 16 }]}>Legend</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {plan.allocations.map((a, i) => (
            <View key={i} style={{ width: '50%', marginBottom: 4, flexDirection: 'row' }}>
              <Text style={{ fontSize: 9, color: colors.fg }}>· {a.cropName}</Text>
            </View>
          ))}
        </View>

        <PageFooter planId={plan.planId} />
      </Page>

      {/* SOWING SCHEDULE */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Sowing_Schedule</Text>
        <Text style={[styles.small, { marginBottom: 12 }]}>
          Anchored to your frost dates · {plan.schedule.length} action weeks
        </Text>

        {plan.schedule.map((week, i) => (
          <View key={i} style={[styles.block, { padding: 8, marginBottom: 6 }]}>
            <Text style={styles.h3}>{week.weekLabel} ({week.weekIso})</Text>
            {week.events.map((e, j) => (
              <View key={j} style={[styles.row, { marginTop: 2 }]}>
                <Text style={{ fontSize: 9 }}>{e.cropName} <Text style={styles.cropMeta}>{e.varietyName}</Text></Text>
                <Text style={[styles.value, { fontSize: 8, color: colors.accent }]}>{actionLabel[e.action]}</Text>
              </View>
            ))}
          </View>
        ))}

        <PageFooter planId={plan.planId} />
      </Page>

      {/* COMPANIONS + CALORIES + PRESERVATION */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Companion_Pairings</Text>
        {plan.companions.slice(0, 8).map((c, i) => (
          <View key={i} style={{ marginBottom: 6 }}>
            <Text style={styles.h3}>{c.cropName}</Text>
            {c.companions.length > 0 && (
              <Text style={styles.cropMeta}>+ Grows well with: {c.companions.join(', ')}</Text>
            )}
            {c.antagonists.length > 0 && (
              <Text style={styles.cropMeta}>− Keep apart from: {c.antagonists.join(', ')}</Text>
            )}
          </View>
        ))}

        <Text style={styles.h2}>Caloric_Projection</Text>
        <View style={styles.block}>
          <View style={styles.row}><Text style={styles.label}>Total projected calories</Text><Text style={styles.value}>{plan.totalKcal.toLocaleString()} kcal</Text></View>
          <View style={styles.row}><Text style={styles.label}>Days of food (household)</Text><Text style={styles.value}>{plan.daysOfFood.toFixed(0)} days</Text></View>
          <View style={styles.row}><Text style={styles.label}>Protein</Text><Text style={styles.value}>{Math.round(plan.totalProteinG).toLocaleString()} g</Text></View>
          <View style={styles.row}><Text style={styles.label}>Carbs</Text><Text style={styles.value}>{Math.round(plan.totalCarbsG).toLocaleString()} g</Text></View>
          <View style={styles.row}><Text style={styles.label}>Fat</Text><Text style={styles.value}>{Math.round(plan.totalFatG).toLocaleString()} g</Text></View>
        </View>

        <Text style={styles.h2}>Preservation_Timeline</Text>
        {plan.preservation.slice(0, 12).map((p, i) => (
          <View key={i} style={styles.cropRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>{p.cropName}</Text>
              <Text style={styles.cropMeta}>Harvest ~ {new Date(p.harvestDateIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {p.methods.join(', ') || 'fresh eating'}</Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.value}>{p.storageMonths > 0 ? `${p.storageMonths} mo` : 'fresh'}</Text>
            </View>
          </View>
        ))}

        <PageFooter planId={plan.planId} />
      </Page>

      {/* SEED LIST */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Seed_Shopping_List</Text>
        <Text style={[styles.small, { marginBottom: 12 }]}>
          Recommended varieties for your zone · supports the lab when you buy through these links
        </Text>

        {plan.affiliateLinks.map((link, i) => (
          <View key={i} style={styles.cropRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cropName}>{link.cropName}</Text>
              <Text style={styles.cropMeta}>{link.varietyName} · {link.vendor}</Text>
            </View>
            <View style={styles.rightCol}>
              <Link src={link.url} style={styles.link}>buy →</Link>
            </View>
          </View>
        ))}

        <Text style={[styles.small, { marginTop: 16, fontStyle: 'italic' }]}>
          Disclosure: Homesteader Labs earns a small commission on purchases through these links. Vendors are vetted for quality and align with the homestead/permaculture ethos.
        </Text>

        <PageFooter planId={plan.planId} />
      </Page>

      {/* QR + ACTION CARD */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Frost_Risk_Action_Card</Text>
        <View style={styles.block}>
          <Text style={styles.h3}>Spring transition</Text>
          <Text style={styles.cropMeta}>Last frost (avg): {new Date(plan.frostDates.lastSpringFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.cropMeta}>Confidence window: ±{plan.frostDates.lastSpringFrostConfidence} days</Text>
          <Text style={[styles.cropMeta, { marginTop: 4 }]}>Action: Start frost-sensitive crops indoors 6–8 weeks before this date. Harden off seedlings 7 days before transplanting. Cover any direct-sown crops if a late frost is forecast.</Text>

          <Text style={[styles.h3, { marginTop: 12 }]}>Fall transition</Text>
          <Text style={styles.cropMeta}>First frost (avg): {new Date(plan.frostDates.firstFallFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.cropMeta}>Confidence window: ±{plan.frostDates.firstFallFrostConfidence} days</Text>
          <Text style={[styles.cropMeta, { marginTop: 4 }]}>Action: Harvest tender crops 7 days before this date. Cover frost-hardy crops (kale, carrots, leeks) for extended fall yield.</Text>
        </View>

        <Text style={styles.h2}>Live_Companion_Page</Text>
        <Text style={[styles.small, { marginBottom: 8 }]}>
          Scan to access the interactive version of this plan — adjust inputs, re-run scenarios, log harvests.
        </Text>
        {qrCodeDataUrl && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrCodeDataUrl} style={{ width: 140, height: 140 }} />
            <Link src={plan.companionUrl} style={[styles.link, { marginTop: 8 }]}>{plan.companionUrl}</Link>
          </View>
        )}

        <PageFooter planId={plan.planId} />
      </Page>

      {/* NOTES */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Field_Notes</Text>
        <Text style={[styles.small, { marginBottom: 16 }]}>
          Track sowing dates, weather events, and harvest weights here.
        </Text>
        {Array.from({ length: 28 }).map((_, i) => (
          <View key={i} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, height: 22 }} />
        ))}
        <PageFooter planId={plan.planId} />
      </Page>
    </Document>
  );
}
