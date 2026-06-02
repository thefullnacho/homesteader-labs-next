import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import type { SurvivalPlanOutput } from './types';

const colors = {
  bg: '#1a1a1a',
  fg: '#E8D3BE',
  accent: '#ff7300',
  muted: '#8a8a8a',
  border: '#3a3a3a',
};

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, color: colors.fg, fontSize: 9, fontFamily: 'Courier', padding: 36 },
  h1: { fontSize: 22, fontWeight: 'bold', color: colors.accent, marginBottom: 6, textTransform: 'uppercase' },
  h2: { fontSize: 12, fontWeight: 'bold', color: colors.accent, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  small: { fontSize: 7, color: colors.muted, textTransform: 'uppercase' },
  block: { borderWidth: 2, borderColor: colors.border, padding: 10, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { color: colors.muted, fontSize: 8, textTransform: 'uppercase' },
  value: { color: colors.fg, fontSize: 10, fontWeight: 'bold' },
  cta: { borderWidth: 2, borderColor: colors.accent, padding: 12, marginTop: 14, backgroundColor: '#2a1f12' },
  ctaTitle: { fontSize: 14, color: colors.accent, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  link: { color: colors.accent, textDecoration: 'underline', fontSize: 9 },
});

export function SurvivalPlanPreviewPdf({ plan }: { plan: SurvivalPlanOutput }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.small}>Homesteader_Labs // Free_Preview</Text>
        <Text style={[styles.h1, { fontSize: 28, marginTop: 8 }]}>Zone {plan.growingZone} Snapshot</Text>
        <Text style={styles.small}>Survival garden potential for {plan.input.adults + plan.input.kids}-person household · {plan.input.squareFeet} sq ft</Text>

        <Text style={styles.h2}>Frost_Window</Text>
        <View style={styles.block}>
          <View style={styles.row}><Text style={styles.label}>Last spring frost</Text><Text style={styles.value}>{new Date(plan.frostDates.lastSpringFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.row}><Text style={styles.label}>First fall frost</Text><Text style={styles.value}>{new Date(plan.frostDates.firstFallFrost).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Frost-free days</Text><Text style={styles.value}>{plan.frostDates.frostFreeDays}</Text></View>
        </View>

        <Text style={styles.h2}>Top_Crops_for_You</Text>
        {plan.allocations.slice(0, 6).map((a, i) => (
          <View key={i} style={styles.row}>
            <Text style={{ fontSize: 10, color: colors.fg }}>{i + 1}. {a.cropName}</Text>
            <Text style={[styles.value, { fontSize: 9 }]}>{a.projectedKcal.toLocaleString()} kcal · {a.sqFtUsed.toFixed(1)} sqft</Text>
          </View>
        ))}

        <Text style={styles.h2}>Projected_Output</Text>
        <View style={styles.block}>
          <View style={styles.row}><Text style={styles.label}>Total calories</Text><Text style={[styles.value, { color: colors.accent, fontSize: 14 }]}>{plan.totalKcal.toLocaleString()} kcal</Text></View>
          <View style={styles.row}><Text style={styles.label}>Days of food (household)</Text><Text style={styles.value}>{plan.daysOfFood.toFixed(0)} days</Text></View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>This is the preview.</Text>
          <Text style={{ fontSize: 9, color: colors.fg, marginBottom: 6 }}>
            The full plan includes: garden layout grid, week-by-week sowing schedule, companion plant pairings, preservation timeline, frost-risk action card, seed shopping list with recommended varieties, and field notes pages.
          </Text>
          <Link src="https://homesteaderlabs.com/survival-garden-plan/wizard/" style={styles.link}>
            Get the full plan for $19 →
          </Link>
        </View>

        <Text style={[styles.small, { position: 'absolute', bottom: 24, left: 36 }]}>
          HL_SGP_PREVIEW // Generated {new Date(plan.generatedAtIso).toLocaleDateString('en-US')}
        </Text>
      </Page>
    </Document>
  );
}
