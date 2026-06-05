// ============================================================
// ÉIRVOX - reports data access (admin-side)
// ============================================================
//
// Mirrors src/lib/enquiries.ts: thin wrappers around the supabase
// client for reading + triage-updating public.reports. The buyer-
// facing submission path lives in src/lib/ReportListingDialog.svelte
// which POSTs to /api/report (service-role insert); nothing in this
// file inserts.
//
// All functions assume the caller has profile.role = 'admin'. RLS
// enforces this server-side via public.is_admin() regardless of
// what this file does. The "FUTURE:" comment on the RLS policy in
// supabase/v08-reports.sql notes the swap to is_staff() when that
// role exists; no client change needed then.
//
// Defensive: works whether or not v08-reports.sql has been applied.
// If the table is missing PostgREST returns a "schema cache" error
// which the UI surfaces; reads short-circuit to an empty array.
// ============================================================

import { supabase, withTimeout } from './supabase';

export type ReportReason =
  | 'prohibited_illegal'
  | 'scam_fraud'
  | 'counterfeit'
  | 'miscategorised'
  | 'offensive'
  | 'unavailable'
  | 'other';

export type ReportStatus = 'new' | 'reviewing' | 'actioned' | 'dismissed';

export interface ReportRow {
  id: string;
  listing_id: string | null;
  reason: ReportReason;
  detail: string | null;
  reporter_email: string | null;
  status: ReportStatus;
  assigned_to: string | null;
  resolution_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportFilters {
  status?: ReportStatus | 'all';
  reason?: ReportReason | 'all';
}

export const reasonLabel: Record<ReportReason, string> = {
  prohibited_illegal: 'Prohibited or illegal',
  scam_fraud:         'Scam or fraud',
  counterfeit:        'Counterfeit or replica',
  miscategorised:     'Wrong category',
  offensive:          'Offensive content',
  unavailable:        'No longer available',
  other:              'Other',
};

export const statusBadge: Record<ReportStatus, { label: string; tone: 'amber' | 'neutral' | 'green' | 'red' | 'grey' }> = {
  new:       { label: 'New',        tone: 'amber'   },
  reviewing: { label: 'Reviewing',  tone: 'neutral' },
  actioned:  { label: 'Actioned',   tone: 'green'   },
  dismissed: { label: 'Dismissed',  tone: 'grey'    },
};

// ── Admin reads ────────────────────────────────────────────

export async function getAllReports(filters: ReportFilters = {}): Promise<ReportRow[]> {
  let q = supabase.from('reports').select('*');

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.reason && filters.reason !== 'all') q = q.eq('reason', filters.reason);

  q = q.order('created_at', { ascending: false });

  const r = await withTimeout(q, 10_000, 'all_reports');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: ReportRow[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

/** Used by AdminLayout to badge the Reports nav item. Returns 0
 *  rather than throwing if the table is missing (pre-v08 deploy). */
export async function getNewReportCount(): Promise<number> {
  const { count, error } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new');
  if (error || count == null) return 0;
  return count;
}

// ── Admin writes ───────────────────────────────────────────

/** Patch any combination of triage fields. Caller decides whether
 *  to set reviewed_at (we do it automatically when status flips to
 *  a terminal value: actioned / dismissed). */
export async function updateReport(
  id: string,
  patch: {
    status?: ReportStatus;
    assigned_to?: string | null;
    resolution_note?: string | null;
  },
  reviewerProfileId?: string | null,
): Promise<{ ok: boolean; error?: string; data?: ReportRow }> {
  const payload: Record<string, unknown> = { ...patch };

  if (patch.status === 'actioned' || patch.status === 'dismissed') {
    payload.reviewed_at = new Date().toISOString();
    if (reviewerProfileId) payload.reviewed_by = reviewerProfileId;
  }

  const { data, error } = await supabase
    .from('reports')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as ReportRow };
}

// ── Helpers ────────────────────────────────────────────────

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('row-level security')) {
    return 'Permission denied - your profile.role must be admin.';
  }
  if (m.includes('does not exist') || m.includes('schema cache')) {
    return 'Reports table is missing. Apply supabase/v08-reports.sql in Supabase.';
  }
  return msg;
}
