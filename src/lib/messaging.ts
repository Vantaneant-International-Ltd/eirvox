// ============================================================
// ÉIRVOX — Messaging (buyer ↔ seller, scoped to a listing)
// ============================================================
// Schema lives on public.conversations + public.messages.
// Writes go through three SECURITY DEFINER RPCs added in
// supabase/v13-messaging.sql so the unread counters + last
// activity timestamp stay consistent in one transaction.
//
// PII detection runs client-side so we can warn the SENDER
// before they send. The flag is persisted server-side so the
// receiver and admins see the same warning on the bubble.
// ============================================================

import { supabase } from './supabase';

export interface Conversation {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  contains_pii: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ConversationSummary extends Conversation {
  listing: {
    id: string;
    slug: string | null;
    title: string;
    cover_image: string | null;
  } | null;
  buyer:  { id: string; full_name: string | null; avatar_url: string | null } | null;
  seller: { id: string; trading_name: string; logo_url: string | null; is_house: boolean } | null;
  last_message_preview: string | null;
}

// ── PII detection ────────────────────────────────────────────
// Catches the common "let's take this off-app" patterns. False
// positives are fine — we WANT to warn aggressively. The receiver
// can still read the message; the banner just says "ÉIRVOX
// protection ends once you leave the app."

const PII_PATTERNS = [
  /\b(?:\+?353|0)\s*\d[\d\s\-().]{6,}/i,             // IE phone
  /\b\+?\d[\d\s\-().]{7,}\b/,                         // generic intl phone
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,           // email
  /\b(?:whatsapp|wa\.me|wa me|whats\s?app|w\.app|whapp)\b/i,
  /\b(?:instagram|insta|ig|@[a-z0-9_.]{2,})\b/i,
  /\b(?:snapchat|snap|telegram|t\.me|signal|messenger|fb messenger)\b/i,
  /\bmeet\s+me\b|\bcollect\s+from\b|\bcash\s+only\b|\bcall\s+me\b|\btext\s+me\b/i,
];

export function detectPII(body: string): boolean {
  return PII_PATTERNS.some(re => re.test(body));
}

// ── RPC wrappers ─────────────────────────────────────────────

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function getOrCreateConversation(listingId: string): Promise<Result<string>> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', { p_listing_id: listingId });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as string };
}

export async function sendMessage(conversationId: string, body: string): Promise<Result<string>> {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };
  if (trimmed.length > 4000) return { ok: false, error: 'Message too long (4000 char max).' };
  const containsPii = detectPII(trimmed);
  const { data, error } = await supabase.rpc('send_message', {
    p_conversation_id: conversationId,
    p_body: trimmed,
    p_contains_pii: containsPii,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as string };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId });
}

// ── Reads ────────────────────────────────────────────────────

/** Inbox view. Returns conversations the caller participates in
 *  (either as buyer_id = self OR as owner of seller_id's profile).
 *  RLS handles the filter — we just SELECT * and Postgres returns
 *  only what the caller is allowed to see. */
export async function listMyConversations(): Promise<ConversationSummary[]> {
  const { data: convs, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings ( id, slug, title ),
      buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
      seller:sellers ( id, trading_name, logo_url, is_house )
    `)
    .order('last_message_at', { ascending: false });

  if (error || !convs) {
    console.error('[listMyConversations]', error);
    return [];
  }

  // For each conversation, look up the most recent message body for preview.
  // Cheap because we cap and parallelise.
  const ids = convs.map(c => (c as any).id as string);
  const previews = new Map<string, string>();
  const covers   = new Map<string, string | null>();

  if (ids.length > 0) {
    const [msgsR, imgsR] = await Promise.all([
      supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', ids)
        .order('created_at', { ascending: false }),
      supabase
        .from('listing_images')
        .select('listing_id, public_url, sort_order')
        .in('listing_id', convs.map(c => (c as any).listing?.id).filter(Boolean))
        .order('sort_order', { ascending: true }),
    ]);

    if (msgsR.data) {
      for (const m of msgsR.data as any[]) {
        if (!previews.has(m.conversation_id)) previews.set(m.conversation_id, m.content);
      }
    }
    if (imgsR.data) {
      for (const img of imgsR.data as any[]) {
        if (!covers.has(img.listing_id)) covers.set(img.listing_id, img.public_url);
      }
    }
  }

  return (convs as any[]).map(c => ({
    ...c,
    listing: c.listing
      ? { ...c.listing, cover_image: covers.get(c.listing.id) ?? null }
      : null,
    last_message_preview: previews.get(c.id) ?? null,
  }));
}

export async function getConversation(conversationId: string): Promise<ConversationSummary | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      listing:listings ( id, slug, title ),
      buyer:profiles!conversations_buyer_id_fkey ( id, full_name, avatar_url ),
      seller:sellers ( id, trading_name, logo_url, is_house )
    `)
    .eq('id', conversationId)
    .single();
  if (error || !data) return null;
  // Cover for this listing
  let cover: string | null = null;
  if ((data as any).listing?.id) {
    const { data: imgs } = await supabase
      .from('listing_images')
      .select('public_url')
      .eq('listing_id', (data as any).listing.id)
      .order('sort_order', { ascending: true })
      .limit(1);
    cover = imgs?.[0]?.public_url ?? null;
  }
  return {
    ...(data as any),
    listing: (data as any).listing
      ? { ...(data as any).listing, cover_image: cover }
      : null,
    last_message_preview: null,
  };
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error || !data) {
    console.error('[listMessages]', error);
    return [];
  }
  return data as Message[];
}

/** Sum of (buyer_unread when caller is buyer) + (seller_unread when caller is seller).
 *  Cheap roll-up for nav badge. RLS limits the rows so we don't need
 *  to know the caller's role/seller_id explicitly. */
export async function getMyTotalUnread(myProfileId: string, mySellerIds: string[]): Promise<number> {
  const { data, error } = await supabase
    .from('conversations')
    .select('buyer_id, seller_id, buyer_unread, seller_unread');
  if (error || !data) return 0;
  let total = 0;
  for (const c of data as any[]) {
    if (c.buyer_id === myProfileId) total += c.buyer_unread ?? 0;
    if (mySellerIds.includes(c.seller_id)) total += c.seller_unread ?? 0;
  }
  return total;
}
