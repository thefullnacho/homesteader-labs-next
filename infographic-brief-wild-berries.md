# Infographic brief: Wild Berries Safe to Eat

Companion graphic for `content/archive/wild-berry-guide.mdx`. Placeholder comment already sits in the post after the "no test" section.

## Job

Double duty: (1) shareable/pinnable asset that earns image-search and Pinterest traffic for "wild berries safe to eat identification", (2) branded CTA that routes viewers to the forager. Every share carries the brand and the URL, that's the whole point of making it ours instead of linking a stock chart.

## Format

- **Primary: 1000 x 1500 (2:3 vertical).** Pinterest-native, embeds fine in the post, survives phone screenshots.
- Optional square 1080 x 1080 crop later for social if needed.

## Production route (recommended)

Build it as a **single HTML/CSS page and screenshot it**, not AI-generated art. The brand IS a design system (brutalist borders, mono type, flat color), so HTML renders it pixel-perfect, stays legible at thumbnail size, and every future revision is a text edit. AI-generated berry illustrations also risk botanically wrong details, which is disqualifying for a safety chart. If we want hand-drawn berry sketches inside the frames, generate those as isolated spot images and drop them into the HTML layout.

## Brand tokens

- Burnt orange `#ff7300`, cream `#E8D3BE`, charcoal `#1a1a1a` (use the globals.css values)
- Courier New / mono for all body text, Caveat only for small margin annotations
- 3px borders, 8px offset shadows, no rounded corners, no gradients
- Header treatment like the site: black bar, orange accent, all-caps mono

## Content (top to bottom)

1. **Header bar:** `WILD BERRIES: EAT / DON'T EAT` + small `HOMESTEADER LABS FIELD CHART No. 001`
2. **The rule, full-width orange block:** "IDENTIFY THE PLANT OR DON'T EAT THE BERRY. The berry is the last thing you check, not the first."
3. **Two safe-marker cards:**
   - THE AGGREGATE RULE: raspberry/blackberry drupelet cluster sketch. "Built from tiny beads on a thorny cane = the safest berry in North America."
   - THE CROWN CHECK: blueberry blossom-end sketch with 5-point calyx circled. "Blueberries wear a crown. Nightshade doesn't. No crown, no deal."
4. **Three lookalike duels,** side-by-side frames, EAT (cream) vs NEVER (charcoal, orange X):
   - Elderberry (woody stem, flat berry spray) vs Pokeweed (neon magenta stem, long berry column) + Caveat note: "the hot pink stem is the alarm"
   - Wild grape (tendrils, teardrop seeds) vs Moonseed (no tendrils, one crescent seed) + "crack a fruit, check the seed"
   - Blueberry (crown) vs Nightshade (smooth bottom, star flowers)
5. **Hard-stop banner, black:** "THERE IS NO FIELD TEST. Lip tests and 'small bites' don't work on berries. When in doubt, it stays on the plant."
6. **CTA footer, orange block:** "Get a second opinion that knows when to shut up. Our free forager ID tool refuses to guess when it isn't sure." + URL `homesteaderlabs.com/archive/wild-berry-guide` (the post owns the SEO, the post links the forager) + small WALKING MAN mark

## Notes

- Keep total word count on the graphic under ~120, it must read at thumbnail size
- No em dashes anywhere on the graphic
- Alt text when embedding: "Wild berry identification chart: safe berries vs poisonous lookalikes, elderberry vs pokeweed, wild grape vs moonseed, blueberry vs nightshade"
- Dawn to review before it ships anywhere social
