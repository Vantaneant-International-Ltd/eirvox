// ============================================================
// ÉIRVOX — Enquiries (Express Interest)
// Client helper + admin queries.
// ============================================================

import { supabase, withTimeout, callFunction } from './supabase';

export type EnquirySubjectType = 'listing' | 'drive_issue' | 'tradesperson' | 'general';
export type EnquiryStatus = 'new' | 'replied' | 'closed' | 'spam';

export interface EnquiryRow {
  id: string;
  subject_type: EnquirySubjectType;
  listing_id: string | null;
  tradesperson_id: string | null;
  drive_issue_slug: string | null;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: EnquiryStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitEnquiryInput {
  subject_type: EnquirySubjectType;
  listing_id?: string | null;
  tradesperson_id?: string | null;
  drive_issue_slug?: string | null;
  profile_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}

export type SubmitOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: 'invalid' | 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

/** Submit an enquiry via /api/enquiries (service-role insert).
 *  Anonymous-friendly. Local dev needs `npm run dev:api`. */
export async function submitEnquiry(input: SubmitEnquiryInput): Promise<SubmitOutcome> {
  // Client-side guards mirror the server. Server is authoritative.
  if (!input.name?.trim()) {
    return { ok: false, reason: 'invalid', message: 'Your name is required.' };
  }
  if (!isValidEmail(input.email)) {
    return { ok: false, reason: 'invalid', message: 'Please enter a valid email.' };
  }
  if (!input.message?.trim() || input.message.trim().length < 10) {
    return { ok: false, reason: 'invalid', message: 'Message must be at least 10 characters.' };
  }

  let res: Response;
  try {
    res = await callFunction('enquiries', {
      body: {
        subject_type: input.subject_type,
        listing_id: input.listing_id ?? null,
        tradesperson_id: input.tradesperson_id ?? null,
        drive_issue_slug: input.drive_issue_slug ?? null,
        profile_id: input.profile_id ?? null,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        message: input.message.trim(),
      },
    });
  } catch {
    return { ok: false, reason: 'error', message: 'Could not reach the server. Try again in a moment.' };
  }

  const payload = await res.json().catch(() => null) as
    | { ok?: boolean; id?: string; error?: string }
    | null;

  if (res.ok && payload?.id) return { ok: true, id: payload.id };

  if (res.status === 400) {
    return { ok: false, reason: 'invalid', message: payload?.error ?? 'Please check the form and try again.' };
  }
  if (res.status === 429) {
    return { ok: false, reason: 'error', message: 'Too many submissions. Wait a moment and try again.' };
  }
  return { ok: false, reason: 'error', message: payload?.error ?? 'Could not send your enquiry. Try again.' };
}

// ── Admin reads ────────────────────────────────────────────

export async function getAllEnquiries(): Promise<EnquiryRow[]> {
  const r = await withTimeout(
    supabase.from('enquiries').select('*').order('created_at', { ascending: false }),
    10_000,
    'all_enquiries'
  );
  if (!r.ok) return [];
  const { data, error } = r.value as { data: EnquiryRow[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

export async function getNewEnquiryCount(): Promise<number> {
  const { count, error } = await supabase
    .from('enquiries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');
  if (error || count == null) return 0;
  return count;
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('enquiries')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
