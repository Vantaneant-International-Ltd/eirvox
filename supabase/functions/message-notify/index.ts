// ============================================================
// POST /functions/v1/message-notify  { message_id }
// ============================================================
// Triggered by a DB trigger (trg_messages_notify) via pg_net on
// every INSERT into public.messages. Reads the message + conversation
// + recipient and sends them a heads-up email so messages don't die
// silently in the inbox.
//
// Verify-JWT is ON but the DB trigger sends the anon key in the
// Authorization header, so Supabase's gateway accepts the call.
// No additional auth — we trust the trigger; we only ever process
// what's in the messages table anyway.
//
// Failure-mode: any error is logged + a 200 returned so pg_net
// doesn't retry. A missed notification is annoying; an infinite
// retry loop is worse.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { sendEmail } from '../_shared/email.ts';

interface Body { message_id?: string }

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: Body;
  try { body = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const messageId = body.message_id;
  if (!messageId) return new Response(JSON.stringify({ ok: false, error: 'message_id required' }), { status: 400, headers: { 'content-type': 'application/json' } });

  try {
    // Load message + conversation + listing + both parties
    const { data: msg, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select(`
        id, content, sender_id, conversation_id, contains_pii, created_at
      `)
      .eq('id', messageId)
      .maybeSingle();
    if (msgErr || !msg) {
      console.warn('[message-notify] message not found:', messageId, msgErr);
      return new Response(JSON.stringify({ ok: true, skipped: 'message_not_found' }), { status: 200 });
    }

    const { data: conv, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select(`
        id, buyer_id, seller_id, listing_id,
        listing:listings ( id, title, slug ),
        seller:sellers ( id, profile_id, trading_name, email )
      `)
      .eq('id', msg.conversation_id)
      .maybeSingle();
    if (convErr || !conv) {
      console.warn('[message-notify] conversation not found:', msg.conversation_id, convErr);
      return new Response(JSON.stringify({ ok: true, skipped: 'conversation_not_found' }), { status: 200 });
    }

    // Sender is one of: the buyer (buyer_id == sender_id) OR the
    // seller's owning profile (sellers.profile_id == sender_id).
    // Recipient is the OTHER party.
    const seller = (conv as any).seller as { id: string; profile_id: string; trading_name: string; email: string | null } | null;
    const senderIsBuyer = (conv as any).buyer_id === msg.sender_id;
    const senderIsSeller = seller && seller.profile_id === msg.sender_id;

    let recipientEmail: string | null = null;
    let recipientLabel = '';
    let senderLabel = '';

    if (senderIsBuyer) {
      // Buyer messaged the seller → notify seller
      recipientEmail = seller?.email ?? null;
      recipientLabel = 'seller';
      senderLabel = 'a buyer';
    } else if (senderIsSeller) {
      // Seller messaged the buyer → notify buyer (look up buyer profile email)
      const { data: buyer } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', (conv as any).buyer_id)
        .maybeSingle();
      recipientEmail = (buyer as any)?.email ?? null;
      recipientLabel = 'buyer';
      senderLabel = seller?.trading_name ?? 'the seller';
    } else {
      console.warn('[message-notify] sender not buyer or seller — admin message?', msg.sender_id);
      return new Response(JSON.stringify({ ok: true, skipped: 'unknown_sender' }), { status: 200 });
    }

    if (!recipientEmail) {
      console.warn('[message-notify] no recipient email for', recipientLabel, 'on conversation', conv.id);
      return new Response(JSON.stringify({ ok: true, skipped: 'no_recipient_email' }), { status: 200 });
    }

    const listing = (conv as any).listing as { id: string; title: string; slug: string | null } | null;
    const listingTitle = listing?.title ?? 'a listing';
    const threadUrl = `https://eirvox.ie/#/messages/${conv.id}`;
    const preview = msg.content.slice(0, 240);

    const subject = `New message about "${listingTitle}".`;
    const senderCap = senderLabel.charAt(0).toUpperCase() + senderLabel.slice(1);
    const text = [
      'ÉIRVOX',
      '',
      `${senderCap} sent a message about ${listingTitle}.`,
      '',
      '----',
      preview,
      '----',
      '',
      'Reply in the ÉIRVOX inbox.',
      threadUrl,
      '',
      'Replies are not monitored.',
      'For help: support@eirvox.ie',
    ].join('\n');
    const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;background:#F5F2ED;font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(26,26,26,0.08);">
      <tr><td style="padding:32px 32px 16px;border-bottom:1px solid rgba(26,26,26,0.08);">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;color:#E8742C;">ÉIRVOX · NEW MESSAGE</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:500;margin-top:8px;line-height:1.2;">${senderCap} messaged you.</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.06em;color:#8A8680;text-transform:uppercase;margin-top:6px;">RE: ${listingTitle}</div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <div style="background:#F5F2ED;padding:16px;border-left:3px solid #E8742C;font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${preview.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]!))}</div>
      </td></tr>
      <tr><td style="padding:8px 32px 32px;">
        <a href="${threadUrl}" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;padding:12px 24px;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Open inbox</a>
      </td></tr>
      <tr><td style="padding:8px 32px 28px;font-size:12px;line-height:1.6;color:#8A8680;">
        Replies are not monitored. Reply inside ÉIRVOX, or write to <a href="mailto:support@eirvox.ie" style="color:#1A1A1A;text-decoration:underline;">support@eirvox.ie</a>.
      </td></tr>
    </table>
    <div style="max-width:560px;margin:18px auto 0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.06em;color:#8A8680;text-align:center;">ÉIRVOX SYSTEMS LTD · DUBLIN, IRELAND</div>
  </td></tr>
</table>
</body></html>`;

    const r = await sendEmail({ to: recipientEmail, subject, html, text, from: 'ÉIRVOX <no-reply@eirvox.ie>' });
    if (!r.ok) console.warn('[message-notify] send failed:', r.error);

    return new Response(JSON.stringify({ ok: true, sent_to: recipientLabel }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err) {
    console.error('[message-notify] handler threw:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200, headers: { 'content-type': 'application/json' } });
    // 200 so pg_net doesn't retry on bugs — fail loud in logs instead
  }
});
