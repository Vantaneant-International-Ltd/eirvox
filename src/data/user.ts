// ============================================================
// ÉIRVOX - Mock user, orders, saved items, messages, activity
// ------------------------------------------------------------
// Account/Messages still consume this mock store. Real reservation
// data lives in Supabase (see lib/api.ts → getMySavedListings etc.).
// The helpers below now return undefined for listing/seller lookups
// because the static listings file was removed in v0.4 Prompt D.
// ============================================================

// Minimal stubs so type signatures still compile.
type Listing = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  price: number;
  city: string;
  category: string;
  subcategory?: string;
  condition?: string;
  sellerId: string;
};

type Seller = {
  id: string;
  name: string;
  tier: 'HOUSE' | 'ATELIER' | 'VERIFIED';
  rating: number;
  location: string;
  city: string;
  responseTime: string;
  since: string;
  handle: string;
};

// ── User profile ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  memberSince: string;
  isSeller: boolean;
  notifications: {
    newMessages: boolean;
    priceDrops: boolean;
    driveReleases: boolean;
    weeklyDigest: boolean;
  };
}

export const currentUser: UserProfile = {
  id: 'u-001',
  firstName: 'Renato',
  lastName: 'G.',
  email: 'demo@eirvox.ie',
  phone: '+353 85 1234567',
  city: 'Dublin 4',
  country: 'Ireland',
  memberSince: '2026',
  isSeller: false,
  notifications: {
    newMessages: true,
    priceDrops: true,
    driveReleases: true,
    weeklyDigest: false,
  },
};

// ── Orders / Reservations ────────────────────────────────────

export type OrderStatus = 'reserved' | 'confirmed' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  listingSlug: string;
  status: OrderStatus;
  reservedAt: string;
  deposit: number;
  balance: number;
  notes?: string;
}

export const orders: Order[] = [
  {
    id: 'ORD-2041',
    listingSlug: 'amg-gt-carbon-steering-wheel',
    status: 'reserved',
    reservedAt: '2026-05-26',
    deposit: 49,
    balance: 4201,
    notes: 'Awaiting fitment confirmation for 2024 AMG GT 63 Premium Plus.',
  },
  {
    id: 'ORD-2038',
    listingSlug: 'tudor-black-bay-58',
    status: 'confirmed',
    reservedAt: '2026-05-23',
    deposit: 49,
    balance: 3401,
    notes: 'Offer accepted at €3,450. Awaiting payment instructions.',
  },
  {
    id: 'ORD-2029',
    listingSlug: 'leica-q3',
    status: 'shipped',
    reservedAt: '2026-05-15',
    deposit: 49,
    balance: 5301,
    notes: 'DPD tracking: FX2419-IE · est. delivery 28 May.',
  },
  {
    id: 'ORD-2014',
    listingSlug: 'barbour-bedale-rewaxed',
    status: 'completed',
    reservedAt: '2026-04-28',
    deposit: 49,
    balance: 116,
  },
];

// ── Saved items ──────────────────────────────────────────────

export const savedItems: string[] = [
  'tudor-black-bay-58',
  'bbs-fi-r-forged-wheels-992',
  'wegner-ch24-wishbone-pair',
  'le-brocquy-signed-lithograph',
  'leica-q3',
  'omega-speedmaster-3861',
];

// ── Messages / Conversations ─────────────────────────────────

export type MessageSender = 'user' | 'seller' | 'system';

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  sellerId: string;
  listingSlug: string;
  messages: Message[];
  unread: number;
  lastActivity: string;
  status?: 'enquiry' | 'reserved' | 'offer-pending' | 'shipped';
}

export const conversations: Conversation[] = [
  {
    id: 'conv-001',
    sellerId: 'moss-co',
    listingSlug: 'tudor-black-bay-58',
    unread: 2,
    lastActivity: '2h ago',
    status: 'offer-pending',
    messages: [
      {
        id: 'm-001',
        sender: 'user',
        text: 'Hi - interested in the Tudor. Could I see a few closer shots of the lugs and the clasp engraving?',
        timestamp: '25 May · 12:18',
        read: true,
      },
      {
        id: 'm-002',
        sender: 'seller',
        text: 'Hi Renato - light hairlines on the lugs only, clasp engraving is sharp. Grabbing close-ups for you now.',
        timestamp: '25 May · 12:24',
        read: true,
      },
      {
        id: 'm-003',
        sender: 'seller',
        text: 'Three photos attached: lugs, clasp, and bezel macro. Watch hasn\'t been polished - what you see is what you get.',
        timestamp: '25 May · 12:31',
        read: true,
      },
      {
        id: 'm-004',
        sender: 'user',
        text: 'Looks great. Would you take €3,300 with shipping to Dublin 4 included?',
        timestamp: '26 May · 09:42',
        read: true,
      },
      {
        id: 'm-005',
        sender: 'seller',
        text: 'I\'d meet at €3,400 with free DPD - best I can do given the full set. Lower than €3,400 doesn\'t make sense for me.',
        timestamp: '26 May · 11:08',
        read: true,
      },
      {
        id: 'm-006',
        sender: 'user',
        text: 'Fair enough - €3,400 works. Will reserve through the platform tonight.',
        timestamp: 'Today · 09:14',
        read: true,
      },
      {
        id: 'm-007',
        sender: 'seller',
        text: 'Perfect. Once you confirm the reservation I\'ll prep it for shipping. Should be out the door by Friday at the latest.',
        timestamp: 'Today · 10:02',
        read: false,
      },
      {
        id: 'm-008',
        sender: 'seller',
        text: 'Also - happy to throw in the original spring-bar tool if you don\'t already have one. Let me know.',
        timestamp: 'Today · 10:03',
        read: false,
      },
    ],
  },
  {
    id: 'conv-002',
    sellerId: 'eirvox',
    listingSlug: 'amg-gt-carbon-steering-wheel',
    unread: 1,
    lastActivity: 'Yesterday',
    status: 'reserved',
    messages: [
      {
        id: 'm-101',
        sender: 'system',
        text: 'Reservation confirmed for Issue 003 · plate 04 of 8. €49 deposit received.',
        timestamp: '25 May · 18:30',
        read: true,
      },
      {
        id: 'm-102',
        sender: 'user',
        text: 'Hi - quick question about fitment on the 2024 GT 63 Premium Plus. Any difference vs the standard GT 63?',
        timestamp: '25 May · 18:45',
        read: true,
      },
      {
        id: 'm-103',
        sender: 'seller',
        text: 'No difference - same column, same OEM electronics passthrough. Confirming with the fabricator and will follow up within 48h with a fitment note for your VIN.',
        timestamp: 'Yesterday · 14:22',
        read: false,
      },
    ],
  },
  {
    id: 'conv-003',
    sellerId: 'northsole',
    listingSlug: 'bbs-fi-r-forged-wheels-992',
    unread: 0,
    lastActivity: '3 May',
    status: 'enquiry',
    messages: [
      {
        id: 'm-201',
        sender: 'user',
        text: 'Hi - are these still available? Asking before I drive up from Dublin to view.',
        timestamp: '2 May · 16:12',
        read: true,
      },
      {
        id: 'm-202',
        sender: 'seller',
        text: 'Yes still here. Happy to put them aside for a viewing if you give me a day\'s notice - I work out of the unit Mon-Sat.',
        timestamp: '2 May · 17:48',
        read: true,
      },
      {
        id: 'm-203',
        sender: 'user',
        text: 'Got it - I\'ll be in touch closer to the weekend. Thanks for the quick reply.',
        timestamp: '3 May · 09:30',
        read: true,
      },
    ],
  },
  {
    id: 'conv-004',
    sellerId: 'hatch-design',
    listingSlug: 'vitsoe-606-shelving',
    unread: 0,
    lastActivity: '18 Apr',
    status: 'enquiry',
    messages: [
      {
        id: 'm-301',
        sender: 'user',
        text: 'Are the original E-track uprights or have they been replaced at any point?',
        timestamp: '17 Apr · 11:20',
        read: true,
      },
      {
        id: 'm-302',
        sender: 'seller',
        text: 'All original 1980s E-track. Brackets are mixed - some original, some replaced under the lifetime warranty. Vitsœ paperwork available.',
        timestamp: '18 Apr · 10:14',
        read: true,
      },
    ],
  },
];

// ── Activity feed ────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: 'reservation' | 'message' | 'offer' | 'shipped' | 'drive';
  title: string;
  detail: string;
  timestamp: string;
  link?: string;
}

export const activity: ActivityItem[] = [
  {
    id: 'a-001',
    type: 'message',
    title: 'Moss & Co. replied',
    detail: 'New message about Tudor Black Bay 58',
    timestamp: '2 hours ago',
    link: '/account',
  },
  {
    id: 'a-002',
    type: 'reservation',
    title: 'AMG GT - Carbon Steering Wheel reserved',
    detail: 'Issue 003 · €49 deposit · awaiting fitment confirmation',
    timestamp: '2 days ago',
    link: '/account/orders',
  },
  {
    id: 'a-003',
    type: 'offer',
    title: 'Offer accepted on Tudor Black Bay 58',
    detail: 'Moss & Co. accepted €3,400 · ready to reserve',
    timestamp: '5 days ago',
    link: '/account',
  },
  {
    id: 'a-004',
    type: 'shipped',
    title: 'Leica Q3 shipped',
    detail: 'DPD tracking FX2419-IE · est. delivery 28 May',
    timestamp: '6 days ago',
    link: '/account/orders',
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getConversation(id: string): Conversation | undefined {
  return conversations.find(c => c.id === id);
}

export function getUnreadCount(): number {
  return conversations.reduce((sum, c) => sum + c.unread, 0);
}

// Listing/seller lookups are stubs after Prompt D removed the static
// listings file. Pages that need live data should call lib/api.ts.
export function getOrderListing(_order: Order): Listing | undefined { return undefined; }
export function getOrderSeller(_order: Order): Seller | undefined  { return undefined; }
export function getConversationListing(_c: Conversation): Listing | undefined { return undefined; }
export function getConversationSeller(_c: Conversation): Seller | undefined { return undefined; }

export function getActiveReservations(): Order[] {
  return orders.filter(o => o.status === 'reserved' || o.status === 'confirmed' || o.status === 'shipped');
}

export const statusLabel: Record<OrderStatus, string> = {
  reserved:  'Reserved',
  confirmed: 'Confirmed',
  shipped:   'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
