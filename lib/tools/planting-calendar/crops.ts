import { Crop, Variety } from './types';

export const crops: Crop[] = [
  {
    id: 'tomato',
    lunarAffinity: 'waxing',
    name: 'Tomatoes',
    category: 'vegetable',
    icon: '🍅',
    varieties: [
      { id: 'early-girl', name: 'Early Girl', daysToMaturity: 52, type: 'Hybrid', special: ['determinate', 'early'] },
      { id: 'cherokee-purple', name: 'Cherokee Purple', daysToMaturity: 80, type: 'Heirloom', special: ['indeterminate', 'beefsteak'] },
      { id: 'roma', name: 'Roma', daysToMaturity: 75, type: 'Paste', special: ['determinate', 'canning'] }
    ],
    startIndoors: 42,
    transplant: 14,
    directSow: null,
    daysToMaturity: 70,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '24-36" apart',
    notes: ['Start indoors 6 weeks before last frost', 'Harden off before transplanting', 'Stake or cage for support']
  },
  {
    id: 'pepper-bell',
    lunarAffinity: 'waxing',
    name: 'Bell Peppers',
    category: 'vegetable',
    icon: '🫑',
    varieties: [
      { id: 'california-wonder', name: 'California Wonder', daysToMaturity: 75, type: 'Open Pollinated', special: ['classic'] },
      { id: 'king-of-north', name: 'King of the North', daysToMaturity: 70, type: 'Heirloom', special: ['cold-tolerant'] }
    ],
    startIndoors: 56,
    transplant: 14,
    directSow: null,
    daysToMaturity: 72,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '18-24" apart',
    notes: ['Needs warm soil (70°F+)', 'Start indoors 8 weeks early', 'Harvest when firm and glossy']
  },
  {
    id: 'pepper-hot',
    lunarAffinity: 'waxing',
    name: 'Hot Peppers',
    category: 'vegetable',
    icon: '🌶️',
    varieties: [
      { id: 'jalapeno', name: 'Jalapeño', daysToMaturity: 72, type: 'Hot', special: ['medium-heat'] },
      { id: 'habanero', name: 'Habanero', daysToMaturity: 100, type: 'Very Hot', special: ['tropical'] }
    ],
    startIndoors: 56,
    transplant: 14,
    directSow: null,
    daysToMaturity: 85,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '18-24" apart',
    notes: ['Longer season than bell peppers', 'Harvest at full color for maximum heat', 'Dry excess for winter use']
  },
  {
    id: 'cucumber',
    lunarAffinity: 'waxing',
    name: 'Cucumbers',
    category: 'vegetable',
    icon: '🥒',
    varieties: [
      { id: 'marketmore', name: 'Marketmore 76', daysToMaturity: 68, type: 'Slicing', special: ['disease-resistant'] },
      { id: 'straight-eight', name: 'Straight Eight', daysToMaturity: 58, type: 'Slicing', special: ['classic'] }
    ],
    startIndoors: 21,
    transplant: 14,
    directSow: 14,
    daysToMaturity: 65,
    successionEnabled: true,
    successionInterval: 3,
    successionMax: 3,
    sun: 'full',
    spacing: '36-48" apart (vining)',
    notes: ['Can direct sow or transplant', 'Succession plant every 3 weeks', 'Pick frequently to encourage production']
  },
  {
    id: 'lettuce',
    lunarAffinity: 'waxing',
    name: 'Lettuce',
    category: 'vegetable',
    icon: '🥬',
    varieties: [
      { id: 'black-seeded-simpson', name: 'Black Seeded Simpson', daysToMaturity: 45, type: 'Leaf', special: ['heat-tolerant'] },
      { id: 'romaine', name: 'Parris Island Cos', daysToMaturity: 68, type: 'Romaine', special: ['crisp'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -14,
    daysToMaturity: 50,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 6,
    sun: 'partial',
    spacing: '8-12" apart',
    notes: ['Direct sow 2 weeks before last frost', 'Succession plant every 2 weeks', 'Shade in hot weather', 'Cut-and-come-again harvesting']
  },
  {
    id: 'beans-bush',
    lunarAffinity: 'waxing',
    name: 'Bush Beans',
    category: 'vegetable',
    icon: '🫘',
    varieties: [
      { id: 'contender', name: 'Contender', daysToMaturity: 50, type: 'Snap Bean', special: ['early'] },
      { id: 'blue-lake', name: 'Blue Lake 274', daysToMaturity: 58, type: 'Snap Bean', special: ['stringless'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: 7,
    daysToMaturity: 55,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 4,
    sun: 'full',
    spacing: '4-6" apart',
    notes: ['Wait for soil to warm to 60°F', 'Succession plant every 2 weeks', 'Pick daily when producing', 'Do not soak seeds before planting']
  },
  {
    id: 'beans-pole',
    lunarAffinity: 'waxing',
    name: 'Pole Beans',
    category: 'vegetable',
    icon: '🫘',
    varieties: [
      { id: 'kentucky-wonder', name: 'Kentucky Wonder', daysToMaturity: 65, type: 'Snap Bean', special: ['productive'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: 7,
    daysToMaturity: 65,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '6-8" apart (on trellis)',
    notes: ['Provide trellis or poles', 'Longer harvest period than bush beans', 'Pick frequently to extend harvest']
  },
  {
    id: 'squash-summer',
    lunarAffinity: 'waxing',
    name: 'Summer Squash',
    category: 'vegetable',
    icon: '🥒',
    varieties: [
      { id: 'black-beauty', name: 'Black Beauty Zucchini', daysToMaturity: 55, type: 'Zucchini', special: ['productive'] },
      { id: 'early-prolific', name: 'Early Prolific Straightneck', daysToMaturity: 50, type: 'Yellow', special: ['early'] }
    ],
    startIndoors: 21,
    transplant: 14,
    directSow: 14,
    daysToMaturity: 52,
    successionEnabled: true,
    successionInterval: 3,
    successionMax: 2,
    sun: 'full',
    spacing: '36-48" apart',
    notes: ['Very prolific - 2-3 plants per family', 'Pick when small for best flavor', 'Succession plant for continuous harvest']
  },
  {
    id: 'squash-winter',
    lunarAffinity: 'waxing',
    name: 'Winter Squash',
    category: 'vegetable',
    icon: '🎃',
    varieties: [
      { id: 'butternut', name: 'Waltham Butternut', daysToMaturity: 85, type: 'Butternut', special: ['stores-well'] },
      { id: 'acorn', name: 'Table Queen Acorn', daysToMaturity: 80, type: 'Acorn', special: ['compact'] }
    ],
    startIndoors: 21,
    transplant: 14,
    directSow: 14,
    daysToMaturity: 85,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '48-72" apart',
    notes: ['Needs 90+ frost-free days', 'Vines spread 10-15 feet', 'Cure for 2 weeks before storing']
  },
  {
    id: 'carrot',
    lunarAffinity: 'waning',
    name: 'Carrots',
    category: 'vegetable',
    icon: '🥕',
    varieties: [
      { id: 'scarlet-nantes', name: 'Scarlet Nantes', daysToMaturity: 65, type: 'Nantes', special: ['sweet'] },
      { id: 'danvers', name: 'Danvers 126', daysToMaturity: 70, type: 'Danvers', special: ['heavy-soil'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -21,
    daysToMaturity: 70,
    successionEnabled: true,
    successionInterval: 3,
    successionMax: 4,
    sun: 'full',
    spacing: '2-3" apart',
    notes: ['Direct sow 3 weeks before last frost', 'Succession plant every 3 weeks', 'Thin to proper spacing', 'Keep soil consistently moist']
  },
  {
    id: 'radish',
    lunarAffinity: 'waning',
    name: 'Radishes',
    category: 'vegetable',
    icon: '🥗',
    varieties: [
      { id: 'cherry-belle', name: 'Cherry Belle', daysToMaturity: 22, type: 'Round', special: ['fast'] },
      { id: 'french-breakfast', name: 'French Breakfast', daysToMaturity: 25, type: 'Oblong', special: ['mild'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -28,
    daysToMaturity: 25,
    successionEnabled: true,
    successionInterval: 1,
    successionMax: 8,
    sun: 'full',
    spacing: '2" apart',
    notes: ['Fastest growing crop', 'Succession plant every week', 'Harvest when small for best flavor', 'Interplant with slower crops']
  },
  {
    id: 'spinach',
    lunarAffinity: 'waxing',
    name: 'Spinach',
    category: 'vegetable',
    icon: '🍃',
    varieties: [
      { id: 'bloomsdale', name: 'Bloomsdale Long Standing', daysToMaturity: 45, type: 'Savoy', special: ['slow-bolt'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -28,
    daysToMaturity: 45,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 4,
    sun: 'partial',
    spacing: '4-6" apart',
    notes: ['Plant early - bolts in heat', 'Succession plant every 2 weeks', 'Shade in summer', 'Overwinter in mild climates']
  },
  {
    id: 'kale',
    lunarAffinity: 'waxing',
    name: 'Kale',
    category: 'vegetable',
    icon: '🥬',
    varieties: [
      { id: 'lacinato', name: 'Lacinato (Dinosaur)', daysToMaturity: 60, type: 'Italian', special: ['cold-hardy'] },
      { id: 'winterbor', name: 'Winterbor', daysToMaturity: 65, type: 'Curly', special: ['winter'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -21,
    daysToMaturity: 60,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '18-24" apart',
    notes: ['Very cold-hardy', 'Succession plant optional', 'Harvest leaves from bottom up', 'Sweetens after frost']
  },
  {
    id: 'broccoli',
    lunarAffinity: 'waxing',
    name: 'Broccoli',
    category: 'vegetable',
    icon: '🥦',
    varieties: [
      { id: 'calabrese', name: 'Calabrese', daysToMaturity: 65, type: 'Heading', special: ['heat-tolerant'] },
      { id: 'waltham', name: 'Waltham 29', daysToMaturity: 85, type: 'Heading', special: ['cold-hardy'] }
    ],
    startIndoors: 42,
    transplant: 14,
    directSow: null,
    daysToMaturity: 70,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 3,
    sun: 'full',
    spacing: '18-24" apart',
    notes: ['Start indoors 6 weeks early', 'Succession plant for fall harvest', 'Harvest main head promptly', 'Side shoots continue producing']
  },
  {
    id: 'onion',
    lunarAffinity: 'waning',
    name: 'Onions',
    category: 'vegetable',
    icon: '🧅',
    varieties: [
      { id: 'walla-walla', name: 'Walla Walla', daysToMaturity: 90, type: 'Sweet', special: ['mild'] },
      { id: 'red-baron', name: 'Red Baron', daysToMaturity: 110, type: 'Red', special: ['storage'] }
    ],
    startIndoors: 70,
    transplant: 0,
    directSow: null,
    daysToMaturity: 100,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '4-6" apart',
    notes: ['Start indoors 10 weeks early!', 'Transplant 4 weeks before last frost', 'Long growing season', 'Harvest when tops fall over']
  },
  {
    id: 'garlic',
    lunarAffinity: 'waning',
    name: 'Garlic',
    category: 'vegetable',
    icon: '🧄',
    varieties: [
      { id: 'music', name: 'Music', daysToMaturity: 240, type: 'Hardneck', special: ['winter'] },
      { id: 'california-softneck', name: 'California Softneck', daysToMaturity: 210, type: 'Softneck', special: ['braiding'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -180,
    daysToMaturity: 240,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '6-8" apart',
    notes: ['Plant in FALL (Sept-Oct) for summer harvest', 'Cold period required for bulb formation', 'Mulch heavily for winter', 'Harvest when 50% of leaves are brown']
  },
  {
    id: 'potato',
    lunarAffinity: 'waning',
    name: 'Potatoes',
    category: 'vegetable',
    icon: '🥔',
    varieties: [
      { id: 'kennebec', name: 'Kennebec', daysToMaturity: 80, type: 'White', special: ['storage'] },
      { id: 'red-norland', name: 'Red Norland', daysToMaturity: 70, type: 'Red', special: ['early'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: 14,
    daysToMaturity: 90,
    successionEnabled: false,
    successionInterval: 0,
    successionMax: 1,
    sun: 'full',
    spacing: '12-15" apart',
    notes: ['Plant seed potatoes 2 weeks after last frost', 'Hill soil around plants as they grow', 'Harvest new potatoes early, storage potatoes late', 'Cure for 2 weeks before storing']
  },
  {
    id: 'corn',
    lunarAffinity: 'waxing',
    name: 'Corn',
    category: 'vegetable',
    icon: '🌽',
    varieties: [
      { id: 'golden-bantam', name: 'Golden Bantam', daysToMaturity: 80, type: 'Sweet', special: ['heirloom'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: 14,
    daysToMaturity: 80,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 3,
    sun: 'full',
    spacing: '12" apart (blocks, not rows)',
    notes: ['Soil must be 60°F+', 'Plant in blocks for pollination', 'Succession plant every 2 weeks', 'Plant multiple varieties with different maturity dates']
  },
  {
    id: 'peas',
    lunarAffinity: 'waxing',
    name: 'Peas',
    category: 'vegetable',
    icon: '🫛',
    varieties: [
      { id: 'sugar-snap', name: 'Sugar Snap', daysToMaturity: 62, type: 'Snap', special: ['edible-pod'] },
      { id: 'lincoln', name: 'Lincoln', daysToMaturity: 65, type: 'Shell', special: ['heat-tolerant'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -42,
    daysToMaturity: 65,
    successionEnabled: true,
    successionInterval: 2,
    successionMax: 3,
    sun: 'full',
    spacing: '2-3" apart',
    notes: ['Plant 6 weeks before last frost', 'Peas love cool weather', 'Succession plant for longer harvest', 'Provide trellis for tall varieties']
  },
  {
    id: 'beets',
    lunarAffinity: 'waning',
    name: 'Beets',
    category: 'vegetable',
    icon: '🟣',
    varieties: [
      { id: 'detroit-dark-red', name: 'Detroit Dark Red', daysToMaturity: 60, type: 'Round', special: ['classic'] },
      { id: 'chioggia', name: 'Chioggia', daysToMaturity: 55, type: 'Italian', special: ['striped'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -14,
    daysToMaturity: 58,
    successionEnabled: true,
    successionInterval: 3,
    successionMax: 4,
    sun: 'full',
    spacing: '3-4" apart',
    notes: ['Direct sow 2 weeks before last frost', 'Thin to proper spacing (eat thinnings!)', 'Succession plant every 3 weeks', 'Harvest when 2-3" diameter']
  },
  {
    id: 'chard',
    lunarAffinity: 'waxing',
    name: 'Swiss Chard',
    category: 'vegetable',
    icon: '🥬',
    varieties: [
      { id: 'bright-lights', name: 'Bright Lights', daysToMaturity: 60, type: 'Rainbow', special: ['colorful'] }
    ],
    startIndoors: null,
    transplant: null,
    directSow: -7,
    daysToMaturity: 60,
    successionEnabled: true,
    successionInterval: 3,
    successionMax: 3,
    sun: 'partial',
    spacing: '8-12" apart',
    notes: ['Direct sow 1 week before last frost', 'Harvest outer leaves continuously', 'Heat and cold tolerant', 'Succession plant optional']
  }
];

export function getCropById(id: string): Crop | undefined {
  return crops.find(crop => crop.id === id);
}

export function getAllCrops(): Crop[] {
  return crops;
}

export function getCropsByCategory(category: Crop['category']): Crop[] {
  return crops.filter(crop => crop.category === category);
}

export function getCropVarieties(cropId: string): Variety[] {
  const crop = getCropById(cropId);
  return crop?.varieties || [];
}
