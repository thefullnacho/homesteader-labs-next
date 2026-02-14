# Seed Planting Calendar MVP
## Customizable Planting Schedule with Succession Seeding

**Document Version:** 1.0  
**Created:** February 12, 2026  
**Status:** Specification Ready for Development

---

## 🎯 Executive Summary

The **Seed Planting Calendar** is a free tool designed to capture high-intent homesteading leads by solving a critical pain point: generic planting calendars don't account for microclimates, succession planting, or specific crop varieties. This tool will drive organic traffic through hyper-local SEO and convert visitors into email subscribers through personalized planting reminders.

**Primary Goal:** Generate 500+ email subscribers in 60 days through valuable free tool
**Secondary Goal:** Establish authority in "offline homesteading tech" space
**Tertiary Goal:** Create content moat competitors can't easily replicate

---

## 🌱 Core Value Proposition

### The Problem
- Generic planting calendars use broad USDA zones (inaccurate by 2-4 weeks)
- No tool accounts for succession planting (maximizing yield)
- Apps require internet/cloud - useless when you're in the field
- Most tools are "one-size-fits-all" ignoring specific crops/varieties

### The Solution
**"A planting calendar that knows YOUR frost dates, YOUR crops, and YOUR succession schedule - works offline after setup"**

### Key Differentiators
1. **Zip-code precise** (not just USDA zone)
2. **Succession planting calculator** (plant every 2 weeks for continuous harvest)
3. **Crop-specific varieties** (not just "tomatoes" but "Cherokee Purple")
4. **Email reminders** ("Time to start your tomatoes indoors!")
5. **Offline-capable PDF export** (take to garden, no phone needed)
6. **Grid-down ready** (exports to paper, works without internet)

---

## 📋 MVP Feature Specification

### Phase 1: Core Functionality (Week 1-2)

#### 1. Location Setup
```
Input: Zip Code
↓
API: NOAA Frost Date API (free)
↓
Output: 
  - Last Spring Frost: [Date ± confidence interval]
  - First Fall Frost: [Date ± confidence interval]
  - Frost-Free Days: [Number]
  - Growing Zone: [USDA + confidence level]
```

**Features:**
- Zip code lookup with validation
- Display frost dates with confidence ranges
- Show "microclimate warnings" (urban heat island, elevation)
- Save location to localStorage

#### 2. Crop Selection (20 MVP Crops)
**Priority 1 - Most Popular:**
- Tomatoes
- Peppers (Bell + Hot)
- Cucumbers
- Lettuce
- Beans (Bush + Pole)
- Squash (Summer + Winter)

**Priority 2 - High Value:**
- Carrots
- Radishes
- Spinach
- Kale
- Broccoli
- Onions

**Priority 3 - Unique/Extended:**
- Garlic
- Potatoes
- Sweet Potatoes
- Corn
- Peas
- Beets
- Swiss Chard
- Zucchini

#### 3. Planting Calculator Logic

**For Each Selected Crop:**
```
Inputs:
  - Crop: [Selected from list]
  - Last Frost Date: [From location]
  - Frost-Free Days: [Calculated]
  - User Experience Level: [Beginner/Intermediate/Advanced]

Calculations:
  1. Indoor Start Date = Last Frost Date - Days_to_Transplant
  2. Direct Sow Date = Last Frost Date + Days_After_Frost
  3. First Harvest = Direct_Sow_Date + Days_to_Maturity
  4. Last Sow Date = First_Fall_Frost - Days_to_Maturity - Buffer

Outputs:
  - Start Seeds Indoors: [Date range]
  - Transplant Outdoors: [Date range] 
  - Direct Sow: [Date range]
  - Expected Harvest: [Date range]
  - "Too Late" Warning: [If applicable]
```

#### 4. Succession Planting Module

**User Input:**
- Enable succession: [Yes/No]
- Frequency: [Every X weeks]
- Number of successions: [Auto-calculate or manual]

**Logic:**
```
Succession Schedule:
  Sow Date 1: [Primary direct sow date]
  Sow Date 2: [Date 1 + frequency]
  Sow Date 3: [Date 2 + frequency]
  ...until [Last possible sow date]

Visual: Calendar grid showing all sow dates
```

#### 5. Email Capture Integration

**Trigger:** After user generates their first calendar

**Modal Copy:**
```
🌱 Get Weekly Planting Reminders

Never miss a planting window again.

We'll email you:
→ "Start your tomatoes indoors this week"
→ "Direct sow lettuce now"
→ "Last chance to plant fall crops"

Customized for [Zip Code] | [Frost Date] | [Your Crops]

[Email Input]
[Checkbox] I want weekly reminders (unsubscribe anytime)
[Button] Create My Planting Schedule

Already 500+ homesteaders using this
```

**Success State:**
- Show preview of email 1
- Download button for PDF calendar
- "Add to calendar" (.ics file) option
- Share on social buttons

---

### Phase 2: Enhanced Features (Week 3-4)

#### 6. PDF Export (Offline Capability)
**The "Grid-Down" Feature:**
- Generate printable 1-page calendar
- Monthly view with all crops color-coded
- QR code linking to digital version
- Laminated guide aesthetic (fits with brand)

#### 7. Companion Planting Suggestions
**Light Integration:**
- "Plant basil near your tomatoes"
- "Avoid: Beans + Onions"
- Visual garden layout suggestions

#### 8. Variety-Specific Data
**For Each Crop, Include:**
- 3-5 popular varieties
- Days to maturity per variety
- Spacing requirements
- Special notes (cold-hardy, heat-tolerant, etc.)

Example:
```
Tomatoes:
  - Early Girl: 52 days (determinate)
  - Cherokee Purple: 80 days (indeterminate, heirloom)
  - Roma: 75 days (paste tomato)
```

---

## 🏗️ Technical Architecture

### Data Structure

#### Crop Database Schema
```typescript
interface Crop {
  id: string;
  name: string;
  category: 'vegetable' | 'herb' | 'fruit';
  varieties: Variety[];
  
  // Timing (relative to frost)
  startIndoors: number;      // days before last frost
  transplant: number;        // days after last frost  
  directSow: number;         // days after last frost (null = not recommended)
  daysToMaturity: number;    // average days
  
  // Succession
  successionEnabled: boolean;
  successionInterval: number; // weeks between plantings
  successionMax: number;      // max plantings per season
  
  // Growing info
  sun: 'full' | 'partial' | 'shade';
  spacing: string;
  notes: string[];
}

interface Variety {
  id: string;
  name: string;
  daysToMaturity: number;
  type: string;
  special: string[];
}
```

#### User Configuration
```typescript
interface PlantingConfig {
  zipCode: string;
  lastFrostDate: Date;
  firstFrostDate: Date;
  frostFreeDays: number;
  selectedCrops: SelectedCrop[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  successionEnabled: boolean;
  successionFrequency: number; // weeks
}

interface SelectedCrop {
  cropId: string;
  varietyId: string;
  successionEnabled: boolean;
}
```

### API Integrations

#### 1. NOAA Frost Date API (Free)
```
Endpoint: https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}/forecast
Or: Use pre-calculated NOAA frost date dataset

Alternative: Use existing weather API logic from Weather Station
```

#### 2. Location Lookup
```
Zip Code → Lat/Lon → NOAA Grid Point → Frost Dates
Reuse existing geocoding from Weather Station
```

### Component Structure

```
/app/tools/planting-calendar/
├── page.tsx                    # Main tool page
├── components/
│   ├── LocationSetup.tsx       # Zip code input
│   ├── CropSelector.tsx        # Multi-select crop grid
│   ├── PlantingCalendar.tsx    # Visual calendar display
│   ├── SuccessionPlanner.tsx   # Succession frequency
│   ├── VarietySelector.tsx     # Variety dropdowns
│   └── EmailCapture.tsx        # Lead capture modal
├── hooks/
│   ├── useFrostDates.ts        # NOAA API hook
│   ├── usePlantingCalculator.ts # Calculation logic
│   └── usePlantingStorage.ts   # localStorage persistence
├── lib/
│   ├── crops.ts                # Crop database
│   ├── plantingCalculations.ts # Date math logic
│   └── pdfGenerator.ts         # PDF export
└── types/
    └── planting.ts             # TypeScript definitions
```

---

## 🎨 UX/UI Design

### Page Layout

```
┌─────────────────────────────────────────────┐
│  HEADER: Seed Planting Calendar              │
│  Sub: Personalized for your frost dates     │
└─────────────────────────────────────────────┘

STEP 1: LOCATION
┌─────────────────────────────────────────────┐
│  [ZIP CODE INPUT] [Get Frost Dates]         │
│                                              │
│  Last Frost: April 15 ± 7 days              │
│  First Frost: October 20 ± 10 days          │
│  Growing Season: 187 days                   │
└─────────────────────────────────────────────┘

STEP 2: SELECT CROPS (Choose up to 10 for MVP)
┌─────────────────────────────────────────────┐
│  [🍅 Tomatoes] [🫑 Peppers] [🥒 Cucumbers]  │
│  [🥬 Lettuce]  [🥕 Carrots] [🌽 Corn]       │
│  [+ Add More...]                            │
└─────────────────────────────────────────────┘

STEP 3: CUSTOMIZE
┌─────────────────────────────────────────────┐
│  Tomato: [Cherokee Purple ▼]               │
│  ✓ Enable Succession Planting               │
│    Every [3 ▼] weeks                        │
└─────────────────────────────────────────────┘

STEP 4: GENERATE
┌─────────────────────────────────────────────┐
│  [CREATE MY PLANTING SCHEDULE]              │
│                                              │
│  [Preview showing sample output]            │
└─────────────────────────────────────────────┘

RESULTS + EMAIL CAPTURE
┌─────────────────────────────────────────────┐
│  [VISUAL CALENDAR GRID]                     │
│                                              │
│  📧 Get email reminders...                  │
│  [Email Input] [Subscribe]                  │
│                                              │
│  [Download PDF] [Add to Calendar]          │
└─────────────────────────────────────────────┘
```

### Visual Design
- Use existing brutalist block styling
- Color-code crops (tomatoes = red, lettuce = green, etc.)
- Calendar grid with hover details
- Mobile-responsive grid (2 cols mobile, 4+ desktop)
- Terminal/field manual aesthetic (fits brand)

---

## 📈 SEO & Content Strategy

### Keyword Opportunities (Low Competition, High Intent)

**Long-tail Local Keywords:**
- "when to plant tomatoes in [zip code]"
- "frost date [city] planting calendar"
- "succession planting schedule [state]"
- "last frost date [county] vegetables"

**Content Multiplication:**
Create 500+ location-specific landing pages:
```
URL Structure:
/tools/planting-calendar/[state]/[city]
/tools/planting-calendar/ny/buffalo
/tools/planting-calendar/ca/sacramento

Each page:
- Auto-generated based on frost dates
- Local context: "Based on Buffalo's last frost of May 10..."
- SEO meta: "Buffalo NY Planting Calendar 2026"
```

**Blog Content:**
- "The Problem with USDA Zones (and why zip codes are better)"
- "Succession Planting 101: Never Waste Garden Space"
- "Grid-Down Gardening: Why Paper Calendars Beat Apps"
- Crop-specific guides: "Growing Cherokee Purple Tomatoes in Short Seasons"

### Distribution Strategy

**Week 1-2: Soft Launch**
- Post to r/homestead, r/gardening
- Share in permaculture forums
- Email to existing Weather Station users

**Week 3-4: Content Blitz**
- Publish 10 blog posts (crop-specific)
- Pinterest graphics for each crop
- Guest post on 3 homesteading blogs

**Ongoing:**
- Weekly "Planting This Week" social posts
- User-generated content: "Share your calendar"
- Email newsletter: "What's planting now"

---

## 📊 Success Metrics

### Primary KPIs
| Metric | Target (60 days) | Measurement |
|--------|-----------------|-------------|
| Email Subscribers | 500+ | ConvertKit dashboard |
| Tool Usage | 2,000 sessions | Google Analytics |
| Conversion Rate | 25%+ | Email capture / tool users |
| Organic Traffic | 1,000 visits/mo | Google Search Console |
| Location Coverage | 100+ cities | Landing page count |

### Secondary KPIs
- PDF Downloads: 300+
- Social Shares: 100+
- Backlinks from gardening sites: 10+
- Time on tool: 3+ minutes avg

---

## 🚀 Development Phases

### Phase 1: MVP Core (Days 1-7)
**Goal:** Working tool with 20 crops
- [ ] Set up page structure
- [ ] Build crop database (20 crops, 2 varieties each)
- [ ] Implement frost date lookup
- [ ] Create planting calculator
- [ ] Basic calendar display
- [ ] Email capture modal
- [ ] localStorage persistence

### Phase 2: Polish (Days 8-14)
**Goal:** Production-ready UX
- [ ] PDF export functionality
- [ ] Succession planting logic
- [ ] Mobile responsiveness
- [ ] Loading states & error handling
- [ ] Email API integration
- [ ] 50 additional crops

### Phase 3: SEO Scale (Days 15-21)
**Goal:** Organic traffic machine
- [ ] Generate 100 city landing pages
- [ ] Meta tags & structured data
- [ ] Sitemap generation
- [ ] Blog content (10 posts)
- [ ] Pinterest graphics

### Phase 4: Optimization (Days 22-30)
**Goal:** Maximize conversions
- [ ] A/B test email capture copy
- [ ] Add social sharing
- [ ] Analytics tracking
- [ ] User feedback integration
- [ ] Performance optimization

---

## 💰 Budget Estimate

**Development:** $0 (you're building it)
**Email Service:** $0-29/mo (ConvertKit free tier)
**Hosting:** $0 (Vercel free)
**NOAA API:** $0 (free government API)
**PDF Generation:** $0 (client-side libraries)

**Optional:**
- Writer for blog posts: $50/post × 10 = $500
- Designer for Pinterest graphics: $200
- **Total Optional:** $700

---

## 🎯 Success Criteria for MVP Launch

**Must Have:**
- ✅ 20 crops with accurate data
- ✅ Zip code frost date lookup
- ✅ Working email capture
- ✅ Mobile-friendly
- ✅ Social share functionality

**Nice to Have:**
- PDF export
- Succession calculator
- 100+ crop varieties
- City-specific landing pages

**Launch Ready When:**
- Tool works end-to-end
- Email capture → ConvertKit working
- 3 blog posts published
- Posted to 5 relevant communities

---

## 📝 Open Questions

1. **Data Source:** Should we use NOAA exclusively or combine with user-reported frost dates?
2. **Crop Count:** Start with 20 or go straight to 50?
3. **Varieties:** Include 2-3 varieties per crop or focus on generic?
4. **Succession:** Auto-calculate max successions or let user choose?
5. **Email Frequency:** Weekly reminders or only at planting windows?

---

**Next Steps:**
1. Approve crop list (20 crops)
2. Gather frost date data source
3. Create crop database JSON
4. Build LocationSetup component
5. Implement frost date API

**Ready to start development?** 🌱
