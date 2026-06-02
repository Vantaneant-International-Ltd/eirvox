// ============================================================
// ÉIRVOX — Seller trading-name change requests
// ============================================================
// Sellers submit via submit_name_change_request RPC.
// Admins approve/reject via approve/reject RPCs (both
// SECURITY DEFINER; client never updates the table directly).
// See supabase/v15-seller-name-changes.sql.
// ============================================================

import { supabase } from './supabase';

export type NameChangeStatus = 'pending' | 'approved' | 'rejected';

export interface NameChangeRequest {
  id: string;
  seller_id: string;
  requested_by: string;
  current_name: string;
  requested_name: string;
  reason: string | null;
  status: NameChangeStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_note: string | null;
  created_at: string;
  seller?: { id: string; trading_name: string; handle: string | null } | null;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listNameChangeRequests(status: NameChangeStatus | 'all' = 'pending'): Promise<NameChangeRequest[]> {
  let q = supabase
    .from('seller_name_change_requests')
    .select(`*, seller:sellers ( id, trading_name, handle )`)
    .order('created_at', { ascending: false });
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error || !data) {
    console.error('[listNameChangeRequests]', error);
    return [];
  }
  return data as NameChangeRequest[];
}

export async function getPendingNameChangeCount(): Promise<number> {
  const { count, error } = await supabase
    .from('seller_name_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  if (error || count == null) return 0;
  return count;
}

export async function approveNameChange(id: string, note: string | null = null): Promise<Result<null>> {
  const { error } = await supabase.rpc('approve_seller_name_change', { p_request_id: id, p_admin_note: note });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function rejectNameChange(id: string, note: string | null = null): Promise<Result<null>> {
  const { error } = await supabase.rpc('reject_seller_name_change', { p_request_id: id, p_admin_note: note });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
