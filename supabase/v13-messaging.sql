-- ============================================================
-- ÉIRVOX v13 — Messaging hardening + RPC layer
-- ============================================================
-- Adapts to PRE-EXISTING public.conversations + public.messages
-- tables. Three things:
--   1. Lock down grants (anon had INSERT/DELETE/TRUNCATE on both;
--      RLS would block at runtime but the table-level privilege
--      is a recurring grant-hole pattern — see HANDOFF Migration
--      rules).
--   2. Tighten the messages INSERT policy: today it only checks
--      sender_id = auth.uid(), so any authenticated user who knows
--      a conversation_id could write into it pretending to be a
--      legit sender. Add a participant check.
--   3. Add three SECURITY DEFINER RPCs that the new UI will use
--      exclusively: get_or_create_conversation(listing_id),
--      send_message(conversation_id, body, contains_pii),
--      mark_conversation_read(conversation_id). These keep the
--      unread counter + last_message_at consistent in one txn.
--
-- Also adds a contains_pii column on messages so the client can
-- flag a message as "looks like phone / email / WhatsApp share"
-- and the thread UI can render an off-site warning banner above
-- those bubbles. The detection runs on the client because we want
-- to warn the SENDER before they send, but the server stores the
-- flag so the receiver and admins see the same warning.
--
-- Backwards-compatible with current schema (conversation_id /
-- sender_id / content column names preserved; no rename).
-- ============================================================

BEGIN;

-- ── 1. Lock down grants ─────────────────────────────────────
-- The RLS policies do the real authorisation; the grants below
-- are just the privileges the role is *allowed* to attempt.

REVOKE ALL ON public.conversations FROM anon, authenticated, public;
REVOKE ALL ON public.messages      FROM anon, authenticated, public;

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT SELECT, INSERT          ON public.messages      TO authenticated;
-- Anon: no access at all. Buyers and sellers must be signed in.

-- ── 2. Add PII flag column to messages ──────────────────────

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS contains_pii boolean NOT NULL DEFAULT false;

-- Backfill unread counters from NULL to 0 so the math doesn't
-- collapse to NULL on first bump.
UPDATE public.conversations
   SET buyer_unread = COALESCE(buyer_unread, 0),
       seller_unread = COALESCE(seller_unread, 0)
 WHERE buyer_unread IS NULL OR seller_unread IS NULL;

ALTER TABLE public.conversations
  ALTER COLUMN buyer_unread  SET DEFAULT 0,
  ALTER COLUMN buyer_unread  SET NOT NULL,
  ALTER COLUMN seller_unread SET DEFAULT 0,
  ALTER COLUMN seller_unread SET NOT NULL;

-- Body length sanity
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_len;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_len
    CHECK (char_length(content) BETWEEN 1 AND 4000);

-- ── 3. Tighten messages INSERT policy ──────────────────────
-- Old policy: sender_id = auth.uid() only — meaning any auth
-- user could spoof-write into any conversation they guessed.
-- Replacement: sender_id = auth.uid() AND sender is a participant
-- of the conversation_id they're writing to.

DROP POLICY IF EXISTS "Send messages" ON public.messages;
CREATE POLICY "Send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM public.conversations
       WHERE buyer_id = auth.uid()
          OR seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    )
  );

-- conversations: keep buyer-can-insert as-is. Add a participant
-- UPDATE policy so the SECURITY DEFINER RPCs can run *as* the
-- caller (they don't have to — they're SECURITY DEFINER — but it
-- means a plain client UPDATE for typing indicators etc. is also
-- safe later).
DROP POLICY IF EXISTS "Participants update conversation" ON public.conversations;
CREATE POLICY "Participants update conversation" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    buyer_id = auth.uid()
    OR seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
  );

-- ── 4. UNIQUE (listing_id, buyer_id) — one thread per pair ─

-- Drop dupes if any snuck in pre-migration. Safe because we just
-- confirmed messages count = 0; if there ARE conversation rows
-- without messages they're stale and can be deleted.
DELETE FROM public.conversations c
 WHERE EXISTS (
   SELECT 1 FROM public.conversations c2
    WHERE c2.listing_id = c.listing_id
      AND c2.buyer_id = c.buyer_id
      AND c2.id <> c.id
      AND c2.created_at < c.created_at
 );

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_listing_buyer_unique;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_listing_buyer_unique
    UNIQUE (listing_id, buyer_id);

-- Indexes for inbox queries
CREATE INDEX IF NOT EXISTS idx_conversations_buyer  ON public.conversations(buyer_id,  last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_seller ON public.conversations(seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_time   ON public.messages(conversation_id, created_at);

-- ── 5. SECURITY DEFINER RPCs ────────────────────────────────

-- get_or_create_conversation: buyer-side entry point from listing
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_listing_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_buyer   uuid := auth.uid();
  v_seller  uuid;
  v_conv    uuid;
BEGIN
  IF v_buyer IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT seller_id INTO v_seller FROM public.listings WHERE id = p_listing_id;
  IF v_seller IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;

  IF EXISTS (SELECT 1 FROM public.sellers WHERE id = v_seller AND profile_id = v_buyer) THEN
    RAISE EXCEPTION 'You own this listing';
  END IF;

  SELECT id INTO v_conv
    FROM public.conversations
   WHERE listing_id = p_listing_id AND buyer_id = v_buyer;

  IF v_conv IS NULL THEN
    INSERT INTO public.conversations (listing_id, buyer_id, seller_id, last_message_at)
    VALUES (p_listing_id, v_buyer, v_seller, now())
    RETURNING id INTO v_conv;
  END IF;

  RETURN v_conv;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- send_message: atomic insert + bump counterpart unread + last_message_at
CREATE OR REPLACE FUNCTION public.send_message(
  p_conversation_id uuid,
  p_body            text,
  p_contains_pii    boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sender   uuid := auth.uid();
  v_conv     public.conversations%ROWTYPE;
  v_is_buyer boolean;
  v_msg_id   uuid;
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;

  v_is_buyer := (v_conv.buyer_id = v_sender);
  IF NOT v_is_buyer THEN
    PERFORM 1 FROM public.sellers WHERE id = v_conv.seller_id AND profile_id = v_sender;
    IF NOT FOUND THEN RAISE EXCEPTION 'Not a participant'; END IF;
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, content, contains_pii)
  VALUES (p_conversation_id, v_sender, p_body, p_contains_pii)
  RETURNING id INTO v_msg_id;

  IF v_is_buyer THEN
    UPDATE public.conversations
       SET seller_unread = seller_unread + 1, last_message_at = now()
     WHERE id = p_conversation_id;
  ELSE
    UPDATE public.conversations
       SET buyer_unread = buyer_unread + 1, last_message_at = now()
     WHERE id = p_conversation_id;
  END IF;

  RETURN v_msg_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.send_message(uuid, text, boolean) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.send_message(uuid, text, boolean) TO authenticated;

-- mark_conversation_read: zero the caller's side of the counter
CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_conv   public.conversations%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO v_conv FROM public.conversations WHERE id = p_conversation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation not found'; END IF;

  IF v_conv.buyer_id = v_caller THEN
    UPDATE public.conversations SET buyer_unread = 0 WHERE id = p_conversation_id;
  ELSIF EXISTS (SELECT 1 FROM public.sellers WHERE id = v_conv.seller_id AND profile_id = v_caller) THEN
    UPDATE public.conversations SET seller_unread = 0 WHERE id = p_conversation_id;
  ELSE
    RAISE EXCEPTION 'Not a participant';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

COMMIT;
