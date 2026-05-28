// ============================================================
// ÉIRVOX TRADE — Verified independent tradespeople directory
// ============================================================

export type TradeCategorySlug =
  | 'electricians'
  | 'plumbers'
  | 'welders'
  | 'carpenters'
  | 'painters'
  | 'tilers'
  | 'mechanics'
  | 'panel-beaters'
  | 'upholsterers'
  | 'landscapers'
  | 'plasterers'
  | 'roofers'
  | 'bricklayers'
  | 'heating-gas'
  | 'windows-doors';

export interface TradeCategory {
  slug: TradeCategorySlug;
  name: string;
  description: string;
}

export const tradeCategories: TradeCategory[] = [
  { slug: 'electricians',    name: 'Electricians',           description: 'Domestic and commercial wiring, EV chargers, certification.' },
  { slug: 'plumbers',        name: 'Plumbers',               description: 'Bathrooms, leaks, water systems, drainage.' },
  { slug: 'welders',         name: 'Welders',                description: 'Mobile MIG/TIG, structural, automotive, gates and railings.' },
  { slug: 'carpenters',      name: 'Carpenters & Joiners',   description: 'Bespoke joinery, kitchens, fitted furniture, doors.' },
  { slug: 'painters',        name: 'Painters & Decorators',  description: 'Interior, exterior, specialist finishes, restoration.' },
  { slug: 'tilers',          name: 'Tilers',                 description: 'Bathrooms, kitchens, large-format, natural stone.' },
  { slug: 'mechanics',       name: 'Mechanics',              description: 'Service, diagnostics, performance, marque specialists.' },
  { slug: 'panel-beaters',   name: 'Panel Beaters',          description: 'Bodywork, paint, classic restoration.' },
  { slug: 'upholsterers',    name: 'Upholsterers',           description: 'Furniture, automotive interiors, leather and Alcantara.' },
  { slug: 'landscapers',     name: 'Landscapers',            description: 'Hard landscaping, planting design, maintenance.' },
  { slug: 'plasterers',      name: 'Plasterers',             description: 'Skim, render, cornicing, restoration plasterwork.' },
  { slug: 'roofers',         name: 'Roofers',                description: 'Slate, tile, flat-roof, gutter and leadwork.' },
  { slug: 'bricklayers',     name: 'Bricklayers',            description: 'New build, extensions, pointing, restoration.' },
  { slug: 'heating-gas',     name: 'Heating & Gas',          description: 'Gas boilers, heat pumps, system upgrades. RGI registered.' },
  { slug: 'windows-doors',   name: 'Windows & Doors',        description: 'Supply and fit, repairs, period restoration.' },
];

// ─────────────────────────────────────────────────────────────

export type TradeTier = 'listed' | 'pro';

export interface Review {
  id: string;
  reviewer: string;
  date: string;
  rating: number;
  text: string;
}

export interface Tradesperson {
  id: string;
  slug: string;
  name: string;
  trade: TradeCategorySlug;
  tagline: string;
  bio: string;
  county: string;
  town: string;
  coverageAreas: string[];
  yearsExperience: number;
  qualifications: string[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  photoCount: number;
  tier: TradeTier;
  verified: boolean;
  phone: string;
  responseTime: string;
  availableNow: boolean;
  reviews: Review[];
}

// ─────────────────────────────────────────────────────────────
// Tradespeople — 22 across 15 categories
// ─────────────────────────────────────────────────────────────

export const tradespeople: Tradesperson[] = [
  // ── Electricians ──
  {
    id: 't-001',
    slug: 'sean-murphy',
    name: 'Seán Murphy',
    trade: 'electricians',
    tagline: 'Safe-Electric registered electrician · Dublin & Kildare',
    bio: 'Sixteen years on the tools, twelve as my own boss. Domestic rewires, commercial fit-outs, EV charger installations. I show up when I say I will and quote what I mean.',
    county: 'Dublin',
    town: 'Stillorgan',
    coverageAreas: ['Dublin', 'Kildare', 'Wicklow'],
    yearsExperience: 16,
    qualifications: ['Safe Electric Registered', 'RECI Cert', 'SOLAS QQI Level 6', 'EV Charger Installer'],
    rating: 4.96,
    reviewCount: 128,
    completedJobs: 412,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '085 •••• 12',
    responseTime: 'Usually within 1 hour',
    availableNow: true,
    reviews: [
      { id: 'r-001', reviewer: 'Aoife O.', date: '14 May 2026',  rating: 5, text: 'Rewired our 1930s semi in Rathmines. Honest quote, no scope creep, full cert at the end. Would book again tomorrow.' },
      { id: 'r-002', reviewer: 'Conor B.', date: '02 May 2026',  rating: 5, text: 'EV charger fitted to the gable in two and a half hours. Tidy work, explained the load calc properly.' },
      { id: 'r-003', reviewer: 'Linda M.', date: '24 Apr 2026',  rating: 4, text: 'Solid work, slightly over the original quote but he explained why and showed me the issue. Fair on balance.' },
    ],
  },
  {
    id: 't-002',
    slug: 'eoin-fitzgerald',
    name: 'Eoin Fitzgerald',
    trade: 'electricians',
    tagline: 'Commercial electrical contractor · Cork city',
    bio: 'Cork-based commercial sparks. Office fit-outs, retail, restaurants. Out-of-hours work without the out-of-hours markup.',
    county: 'Cork',
    town: 'Cork City',
    coverageAreas: ['Cork'],
    yearsExperience: 11,
    qualifications: ['Safe Electric Registered', 'SOLAS QQI Level 6'],
    rating: 4.88,
    reviewCount: 56,
    completedJobs: 187,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '086 •••• 88',
    responseTime: 'Same day',
    availableNow: false,
    reviews: [
      { id: 'r-101', reviewer: 'Marcus K.', date: '10 May 2026', rating: 5, text: 'Did our coffee shop fit-out on weekends so we wouldn\'t lose trade. Cleanest install I\'ve seen.' },
      { id: 'r-102', reviewer: 'Niamh F.', date: '21 Apr 2026', rating: 5, text: 'Solid on safety paperwork, which matters when you\'re renting commercial space.' },
    ],
  },

  // ── Plumbers ──
  {
    id: 't-003',
    slug: 'declan-kavanagh',
    name: 'Declan Kavanagh',
    trade: 'plumbers',
    tagline: 'Domestic plumbing · Dublin north & city',
    bio: 'Twenty years plumbing in Dublin. Bathrooms my speciality but anything wet I\'ll do. No call-out fee for jobs within Dublin 1–11.',
    county: 'Dublin',
    town: 'Drumcondra',
    coverageAreas: ['Dublin', 'Meath'],
    yearsExperience: 20,
    qualifications: ['SOLAS QQI Level 6', 'WaterMark Approved'],
    rating: 4.92,
    reviewCount: 203,
    completedJobs: 680,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '087 •••• 34',
    responseTime: 'Usually within 2 hours',
    availableNow: true,
    reviews: [
      { id: 'r-201', reviewer: 'Sarah H.', date: '12 May 2026', rating: 5, text: 'Saved us when a pipe burst on a Sunday. Out within the hour, no Sunday markup.' },
      { id: 'r-202', reviewer: 'Padraig D.', date: '03 May 2026', rating: 5, text: 'Full bathroom strip and refit over three days. Hassle-free.' },
    ],
  },
  {
    id: 't-004',
    slug: 'maire-doyle',
    name: 'Máire Doyle',
    trade: 'plumbers',
    tagline: 'Plumber · Galway, Mayo, Clare',
    bio: 'Plumbing apprenticeship in Galway, City & Guilds in Dublin, ten years working across the west. Quiet, fast, clean.',
    county: 'Galway',
    town: 'Galway City',
    coverageAreas: ['Galway', 'Mayo', 'Clare'],
    yearsExperience: 10,
    qualifications: ['City & Guilds Plumbing', 'WaterMark Approved'],
    rating: 4.94,
    reviewCount: 67,
    completedJobs: 245,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '083 •••• 09',
    responseTime: 'Usually within 4 hours',
    availableNow: false,
    reviews: [
      { id: 'r-301', reviewer: 'Cathal O.', date: '01 May 2026', rating: 5, text: 'Quoted four jobs around the house, did all four in two days. Excellent.' },
    ],
  },

  // ── Welders ──
  {
    id: 't-005',
    slug: 'gerry-walsh',
    name: 'Gerry Walsh',
    trade: 'welders',
    tagline: 'Mobile MIG/TIG · automotive & structural · nationwide',
    bio: 'Mobile rig in the back of the van. I come to you. Automotive (chassis, exhausts, roll cages), structural, gates and railings. Galway base, country-wide.',
    county: 'Galway',
    town: 'Tuam',
    coverageAreas: ['Galway', 'Mayo', 'Roscommon', 'Sligo', 'Clare', 'Limerick'],
    yearsExperience: 22,
    qualifications: ['SOLAS QQI Level 6', 'Coded TIG/MIG', 'IIW Welder'],
    rating: 4.98,
    reviewCount: 89,
    completedJobs: 310,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '086 •••• 47',
    responseTime: 'Usually within 2 hours',
    availableNow: true,
    reviews: [
      { id: 'r-401', reviewer: 'Mick H.', date: '15 May 2026', rating: 5, text: 'Welded the chassis on a project car. Beautiful penetration, no flux trapped. Honest pricing.' },
      { id: 'r-402', reviewer: 'James R.', date: '08 May 2026', rating: 5, text: 'Gates for a country property. Took the time to suggest a better hinge design.' },
    ],
  },

  // ── Carpenters ──
  {
    id: 't-006',
    slug: 'oisin-byrne',
    name: 'Oisín Byrne',
    trade: 'carpenters',
    tagline: 'Bespoke joiner · Dublin & Wicklow',
    bio: 'Fitted kitchens, alcove storage, wardrobes, doors. Hand-cut joinery where it earns its keep. Workshop in Bray.',
    county: 'Wicklow',
    town: 'Bray',
    coverageAreas: ['Dublin', 'Wicklow'],
    yearsExperience: 14,
    qualifications: ['City & Guilds Carpentry & Joinery', 'SOLAS QQI Level 6'],
    rating: 4.97,
    reviewCount: 71,
    completedJobs: 142,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '087 •••• 71',
    responseTime: 'Within 24 hours',
    availableNow: false,
    reviews: [
      { id: 'r-501', reviewer: 'Hannah L.', date: '20 May 2026', rating: 5, text: 'Fitted wardrobes for our spare room. Better than the catalogues, half the price.' },
    ],
  },
  {
    id: 't-007',
    slug: 'tom-flanagan',
    name: 'Tom Flanagan',
    trade: 'carpenters',
    tagline: 'General carpentry & 2nd fix · Limerick',
    bio: 'Doors, skirting, architraves, decking. Reliable second-fix man for the building trade and private clients.',
    county: 'Limerick',
    town: 'Limerick City',
    coverageAreas: ['Limerick', 'Clare', 'Tipperary'],
    yearsExperience: 18,
    qualifications: ['SOLAS QQI Level 5'],
    rating: 4.85,
    reviewCount: 42,
    completedJobs: 188,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '085 •••• 60',
    responseTime: 'Same day',
    availableNow: true,
    reviews: [],
  },

  // ── Painters ──
  {
    id: 't-008',
    slug: 'aine-mcdonagh',
    name: 'Áine McDonagh',
    trade: 'painters',
    tagline: 'Painter & decorator · interior specialist · Dublin south',
    bio: 'Interior work in older Dublin houses. Lime paints, chalk paints, Farrow & Ball. Drop sheets and dust extraction every time.',
    county: 'Dublin',
    town: 'Rathmines',
    coverageAreas: ['Dublin', 'Wicklow'],
    yearsExperience: 13,
    qualifications: ['City & Guilds Painting & Decorating'],
    rating: 4.91,
    reviewCount: 88,
    completedJobs: 220,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '083 •••• 24',
    responseTime: 'Within 24 hours',
    availableNow: false,
    reviews: [
      { id: 'r-701', reviewer: 'Liam K.', date: '11 May 2026', rating: 5, text: 'Painted the whole downstairs of a Victorian terrace. Spent ages on prep, finish is excellent.' },
    ],
  },

  // ── Tilers ──
  {
    id: 't-009',
    slug: 'ronan-keane',
    name: 'Rónán Keane',
    trade: 'tilers',
    tagline: 'Large-format porcelain & natural stone · Cork',
    bio: 'Large-format tiling specialist. 60×120, 80×80 porcelain, marble, limestone. Underfloor heating compatible setups.',
    county: 'Cork',
    town: 'Douglas',
    coverageAreas: ['Cork', 'Kerry', 'Waterford'],
    yearsExperience: 12,
    qualifications: ['SOLAS QQI Level 6 Wall & Floor Tiling'],
    rating: 4.94,
    reviewCount: 54,
    completedJobs: 134,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '086 •••• 18',
    responseTime: 'Within 24 hours',
    availableNow: true,
    reviews: [
      { id: 'r-801', reviewer: 'Sinead M.', date: '06 May 2026', rating: 5, text: 'Marble bathroom floor and shower walls. Flawless cuts, grout lines straight to the millimetre.' },
    ],
  },

  // ── Mechanics ──
  {
    id: 't-010',
    slug: 'pat-collins',
    name: 'Pat Collins',
    trade: 'mechanics',
    tagline: 'Independent BMW M & Audi RS specialist · Dublin 18',
    bio: 'Twenty-plus years on German performance cars. M3, M4, RS3, RS6, R8. Diagnostics, service, performance work. Stillorgan workshop.',
    county: 'Dublin',
    town: 'Sandyford',
    coverageAreas: ['Dublin', 'Wicklow', 'Meath'],
    yearsExperience: 24,
    qualifications: ['SOLAS QQI Level 6 Motor Mechanics', 'Bosch Master Tech', 'BMW Trained'],
    rating: 4.97,
    reviewCount: 156,
    completedJobs: 1240,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '087 •••• 42',
    responseTime: 'Usually within 1 hour',
    availableNow: false,
    reviews: [
      { id: 'r-901', reviewer: 'David O.', date: '18 May 2026', rating: 5, text: 'Sorted a recurring fault on my M3 the main dealer couldn\'t find. Diagnostics are next level.' },
      { id: 'r-902', reviewer: 'Andrew B.', date: '10 May 2026', rating: 5, text: 'Honest assessment that saved me from buying a problem car. Refused to charge for the inspection. Class act.' },
    ],
  },
  {
    id: 't-011',
    slug: 'martin-keogh',
    name: 'Martin Keogh',
    trade: 'mechanics',
    tagline: 'General mechanic · all marques · Westmeath',
    bio: 'Family-run garage near Mullingar. Service, NCT prep, brakes, suspension, clutches. Loan car for jobs over a day.',
    county: 'Westmeath',
    town: 'Mullingar',
    coverageAreas: ['Westmeath', 'Longford', 'Offaly'],
    yearsExperience: 28,
    qualifications: ['SOLAS QQI Level 6 Motor Mechanics'],
    rating: 4.86,
    reviewCount: 92,
    completedJobs: 890,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '086 •••• 53',
    responseTime: 'Same day',
    availableNow: true,
    reviews: [],
  },

  // ── Panel beaters ──
  {
    id: 't-012',
    slug: 'ciaran-oneill',
    name: 'Ciarán O\'Neill',
    trade: 'panel-beaters',
    tagline: 'Classic & performance bodywork · Belfast',
    bio: 'Restoration and high-end refinishing. Porsche air-cooled, classic Mercs, modern performance respray. Belfast workshop.',
    county: 'Antrim',
    town: 'Belfast',
    coverageAreas: ['Antrim', 'Down', 'Armagh'],
    yearsExperience: 19,
    qualifications: ['City & Guilds Vehicle Body Repair', 'Pro Spray Painter'],
    rating: 4.98,
    reviewCount: 47,
    completedJobs: 165,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '07798 •••• 24',
    responseTime: 'Within 24 hours',
    availableNow: false,
    reviews: [
      { id: 'r-1101', reviewer: 'Tom R.', date: '22 May 2026', rating: 5, text: 'Refinished my 911. Colour match is identical to the original spray. A real craftsman.' },
    ],
  },

  // ── Upholsterers ──
  {
    id: 't-013',
    slug: 'helena-corcoran',
    name: 'Helena Corcoran',
    trade: 'upholsterers',
    tagline: 'Furniture & automotive upholstery · Dublin 8',
    bio: 'Trained in Florence, ten years in Dublin. Reupholstery, leather work, Alcantara. Automotive interiors a speciality — AMG, Porsche, restoration projects.',
    county: 'Dublin',
    town: 'The Coombe',
    coverageAreas: ['Dublin'],
    yearsExperience: 10,
    qualifications: ['Diploma in Furniture Upholstery', 'AMS Italian Leatherwork'],
    rating: 4.96,
    reviewCount: 35,
    completedJobs: 98,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '085 •••• 19',
    responseTime: 'Within 48 hours',
    availableNow: false,
    reviews: [
      { id: 'r-1201', reviewer: 'Niall H.', date: '14 May 2026', rating: 5, text: 'Rewrapped the steering wheel on my GT3 in Alcantara. Indistinguishable from factory.' },
    ],
  },

  // ── Landscapers ──
  {
    id: 't-014',
    slug: 'kieran-foley',
    name: 'Kieran Foley',
    trade: 'landscapers',
    tagline: 'Hard landscaping & garden design · Wicklow',
    bio: 'Stone walls, patios, paving, garden design. Specialise in country gardens. Wicklow base, work across Leinster.',
    county: 'Wicklow',
    town: 'Greystones',
    coverageAreas: ['Wicklow', 'Dublin', 'Wexford', 'Kildare'],
    yearsExperience: 15,
    qualifications: ['BSc Horticulture', 'SOLAS QQI Level 5'],
    rating: 4.89,
    reviewCount: 32,
    completedJobs: 110,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '087 •••• 16',
    responseTime: 'Within 48 hours',
    availableNow: true,
    reviews: [],
  },

  // ── Plasterers ──
  {
    id: 't-015',
    slug: 'darren-mcgrath',
    name: 'Darren McGrath',
    trade: 'plasterers',
    tagline: 'Skim, render, period restoration · Dublin & Kildare',
    bio: 'Plastering since 2008. Modern skim and old-house lime restoration. Cornicing and ceiling rose repair.',
    county: 'Dublin',
    town: 'Dublin 8',
    coverageAreas: ['Dublin', 'Kildare', 'Meath'],
    yearsExperience: 17,
    qualifications: ['City & Guilds Plastering', 'Lime Plastering Specialist'],
    rating: 4.93,
    reviewCount: 58,
    completedJobs: 220,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '086 •••• 91',
    responseTime: 'Same day',
    availableNow: true,
    reviews: [
      { id: 'r-1401', reviewer: 'Emma C.', date: '02 May 2026', rating: 5, text: 'Skim of a full ground floor in one visit. Like glass when it was painted.' },
    ],
  },

  // ── Roofers ──
  {
    id: 't-016',
    slug: 'paddy-cassidy',
    name: 'Paddy Cassidy',
    trade: 'roofers',
    tagline: 'Slate, tile, leadwork · Limerick',
    bio: 'Three generations in the trade. Slate and tile work, lead valleys, traditional Irish roofing. Family-run.',
    county: 'Limerick',
    town: 'Newcastle West',
    coverageAreas: ['Limerick', 'Tipperary', 'Clare', 'Kerry'],
    yearsExperience: 26,
    qualifications: ['SOLAS QQI Level 6 Roofing', 'Lead Worker Cert'],
    rating: 4.90,
    reviewCount: 73,
    completedJobs: 318,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '085 •••• 27',
    responseTime: 'Within 24 hours',
    availableNow: false,
    reviews: [],
  },

  // ── Bricklayers ──
  {
    id: 't-017',
    slug: 'liam-burke',
    name: 'Liam Burke',
    trade: 'bricklayers',
    tagline: 'New build, extensions, restoration · Cork',
    bio: 'Bricklayer working Cork city and county. Extensions, garden walls, restoration pointing. Mortar mix matched to historic work.',
    county: 'Cork',
    town: 'Mallow',
    coverageAreas: ['Cork', 'Limerick', 'Tipperary'],
    yearsExperience: 21,
    qualifications: ['SOLAS QQI Level 6 Bricklaying'],
    rating: 4.92,
    reviewCount: 45,
    completedJobs: 168,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '083 •••• 80',
    responseTime: 'Within 24 hours',
    availableNow: false,
    reviews: [],
  },

  // ── Heating & Gas ──
  {
    id: 't-018',
    slug: 'jonathan-keating',
    name: 'Jonathan Keating',
    trade: 'heating-gas',
    tagline: 'Gas Networks Ireland registered installer · Dublin',
    bio: 'Boiler servicing, system upgrades, heat pumps, gas safety certificates. RGI registered. Dublin base.',
    county: 'Dublin',
    town: 'Tallaght',
    coverageAreas: ['Dublin', 'Kildare', 'Wicklow'],
    yearsExperience: 18,
    qualifications: ['Gas Networks Ireland Registered', 'RGI Cert', 'SEAI Heat Pump Installer'],
    rating: 4.95,
    reviewCount: 102,
    completedJobs: 480,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '087 •••• 03',
    responseTime: 'Usually within 2 hours',
    availableNow: true,
    reviews: [
      { id: 'r-1701', reviewer: 'Ronan D.', date: '16 May 2026', rating: 5, text: 'Heat pump install with grant paperwork. Did the whole SEAI submission for us.' },
    ],
  },

  // ── Windows & Doors ──
  {
    id: 't-019',
    slug: 'paul-feeney',
    name: 'Paul Feeney',
    trade: 'windows-doors',
    tagline: 'Period sash window restoration · Galway & Mayo',
    bio: 'Specialist in original sash window restoration. Reglazing with single or sympathetic double glazing, draught-proofing, cord and weight repair.',
    county: 'Galway',
    town: 'Galway City',
    coverageAreas: ['Galway', 'Mayo', 'Roscommon'],
    yearsExperience: 19,
    qualifications: ['City & Guilds Period Glazing'],
    rating: 4.94,
    reviewCount: 28,
    completedJobs: 78,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '085 •••• 66',
    responseTime: 'Within 48 hours',
    availableNow: false,
    reviews: [],
  },
  {
    id: 't-020',
    slug: 'gavin-ohara',
    name: 'Gavin O\'Hara',
    trade: 'windows-doors',
    tagline: 'uPVC & aluminium · supply and fit · Donegal',
    bio: 'Triple-glazed, A-rated windows and doors. Energy retrofit work, grant-eligible installations.',
    county: 'Donegal',
    town: 'Letterkenny',
    coverageAreas: ['Donegal', 'Sligo'],
    yearsExperience: 12,
    qualifications: ['SEAI Approved Installer'],
    rating: 4.83,
    reviewCount: 22,
    completedJobs: 64,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '083 •••• 11',
    responseTime: 'Same day',
    availableNow: true,
    reviews: [],
  },

  // ── Extra: another mechanic and another carpenter
  {
    id: 't-021',
    slug: 'fionn-gallagher',
    name: 'Fionn Gallagher',
    trade: 'mechanics',
    tagline: 'Mobile diagnostics · Belfast',
    bio: 'Diagnostic computer in the back of the van. I come to you, plug in, and tell you what\'s wrong before you spend a euro on parts.',
    county: 'Antrim',
    town: 'Belfast',
    coverageAreas: ['Antrim', 'Down'],
    yearsExperience: 9,
    qualifications: ['Bosch Diagnostic Cert', 'IMI Diagnostic Tech'],
    rating: 4.91,
    reviewCount: 38,
    completedJobs: 145,
    photoCount: 4,
    tier: 'listed',
    verified: true,
    phone: '07901 •••• 34',
    responseTime: 'Same day',
    availableNow: true,
    reviews: [],
  },
  {
    id: 't-022',
    slug: 'aoife-ni-bhriain',
    name: 'Aoife Ní Bhriain',
    trade: 'carpenters',
    tagline: 'Bespoke kitchens & cabinetry · Cork',
    bio: 'Made-to-measure kitchens in solid oak, ash, walnut. Workshop near Macroom. Design service included on full kitchen jobs.',
    county: 'Cork',
    town: 'Macroom',
    coverageAreas: ['Cork', 'Kerry'],
    yearsExperience: 11,
    qualifications: ['City & Guilds Furniture Making', 'Diploma in Design'],
    rating: 4.99,
    reviewCount: 24,
    completedJobs: 47,
    photoCount: 12,
    tier: 'pro',
    verified: true,
    phone: '086 •••• 75',
    responseTime: 'Within 48 hours',
    availableNow: false,
    reviews: [
      { id: 'r-2101', reviewer: 'Eimear D.', date: '19 May 2026', rating: 5, text: 'Full oak kitchen with hand-cut dovetails on every drawer. Worth waiting six months for the slot.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getTradespeople(): Tradesperson[] {
  return tradespeople;
}

export function getTradesPersonBySlug(category: string, slug: string): Tradesperson | undefined {
  return tradespeople.find(t => t.trade === category && t.slug === slug);
}

export function getTradesByCategory(category: TradeCategorySlug): Tradesperson[] {
  return tradespeople.filter(t => t.trade === category);
}

export function getTradeCategoryMeta(slug: string): TradeCategory | undefined {
  return tradeCategories.find(c => c.slug === slug);
}

export function getTradeCategoriesWithCounts(): (TradeCategory & { count: number })[] {
  return tradeCategories.map(c => ({
    ...c,
    count: tradespeople.filter(t => t.trade === c.slug).length,
  }));
}

export function getFeaturedTradespeople(limit = 6): Tradesperson[] {
  return tradespeople
    .filter(t => t.tier === 'pro')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getAllCounties(): string[] {
  const set = new Set<string>();
  tradespeople.forEach(t => t.coverageAreas.forEach(c => set.add(c)));
  return Array.from(set).sort();
}
