export interface Listing {
  sku: string
  marque: string
  marqueKey: 'audi' | 'mercedes' | 'bmw' | 'volkswagen'
  model: string
  title: string
  subtitle: string
  price: number
  location: string
  condition: string
  slug: string
}

export const listings: Listing[] = [
  {
    sku: 'EVX-MB-AMG-001',
    marque: 'Mercedes-AMG',
    marqueKey: 'mercedes',
    model: 'AMG GT',
    title: 'GT — Carbon Steering Wheel',
    subtitle: '3K Twill, Alcantara grips.',
    price: 1840,
    location: 'Dublin 02',
    condition: 'OEM+ new',
    slug: 'gt-carbon-steering-wheel',
  },
  {
    sku: 'EVX-AU-RS6-002',
    marque: 'Audi',
    marqueKey: 'audi',
    model: 'RS 6 Avant',
    title: 'RS6 Avant — Carbon Steering Wheel',
    subtitle: 'Alcantara top, twelve-mark.',
    price: 1520,
    location: 'Dublin 04',
    condition: 'OEM+ new',
    slug: 'rs6-avant-carbon-steering-wheel',
  },
  {
    sku: 'EVX-BM-M3-003',
    marque: 'BMW M',
    marqueKey: 'bmw',
    model: 'M3',
    title: 'M3 (G80) — Carbon Steering Wheel',
    subtitle: '3K plain weave, suede grip.',
    price: 1720,
    location: 'Cork',
    condition: 'OEM+ new',
    slug: 'm3-g80-carbon-steering-wheel',
  },
  {
    sku: 'EVX-VW-GLR-004',
    marque: 'Volkswagen',
    marqueKey: 'volkswagen',
    model: 'Golf R',
    title: 'Golf R Mk8 — Carbon Steering Wheel',
    subtitle: 'Skeleton spokes, leather wrap.',
    price: 980,
    location: 'Galway',
    condition: 'OEM+ new',
    slug: 'golf-r-mk8-carbon-steering-wheel',
  },
  {
    sku: 'EVX-AU-R8-005',
    marque: 'Audi',
    marqueKey: 'audi',
    model: 'R8',
    title: 'R8 V10 — Carbon Steering Wheel',
    subtitle: 'RWS suede, perforated nine and three.',
    price: 2140,
    location: 'Dublin 06',
    condition: 'OEM+ new',
    slug: 'r8-v10-carbon-steering-wheel',
  },
  {
    sku: 'EVX-MB-C63-006',
    marque: 'Mercedes-AMG',
    marqueKey: 'mercedes',
    model: 'C63',
    title: 'C63 S — Carbon Steering Wheel',
    subtitle: 'Champagne stitching, twill crown.',
    price: 1690,
    location: 'Limerick',
    condition: 'OEM+ new',
    slug: 'c63-s-carbon-steering-wheel',
  },
  {
    sku: 'EVX-BM-M2-007',
    marque: 'BMW M',
    marqueKey: 'bmw',
    model: 'M2',
    title: 'M2 (G87) — Carbon Steering Wheel',
    subtitle: "Twelve-o'clock red marker.",
    price: 1580,
    location: 'Dublin 18',
    condition: 'OEM+ new',
    slug: 'm2-g87-carbon-steering-wheel',
  },
  {
    sku: 'EVX-VW-GTI-008',
    marque: 'Volkswagen',
    marqueKey: 'volkswagen',
    model: 'Golf GTI',
    title: 'Golf GTI Mk7.5 — Carbon Steering Wheel',
    subtitle: 'Edge carbon, tartan reference.',
    price: 860,
    location: 'Waterford',
    condition: 'OEM+ new',
    slug: 'golf-gti-mk75-carbon-steering-wheel',
  },
]
