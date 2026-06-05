<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import {
    getConversation,
    listMessages,
    sendMessage,
    markConversationRead,
    detectPII,
    type ConversationSummary,
    type Message,
  } from '../lib/messaging';
  import { auth } from '../lib/auth';
  import { applySeo } from '../lib/seo';

  export let id: string;

  let conv: ConversationSummary | null = null;
  let msgs: Message[] = [];
  let loading = true;
  let draft = '';
  let sending = false;
  let sendErr = '';
  let scrollAnchor: HTMLDivElement;

  $: draftLooksLikePii = draft.length > 6 && detectPII(draft);

  async function load() {
    loading = true;
    conv = await getConversation(id);
    if (!conv) { loading = false; return; }
    msgs = await listMessages(id);
    await markConversationRead(id);
    // Pre-filled draft handoff from ListingDetail (e.g. Make Offer).
    // Consume + clear so a refresh doesn't keep refilling.
    try {
      const stash = sessionStorage.getItem(`eirvox_thread_draft_${id}`);
      if (stash && !draft) {
        draft = stash;
        sessionStorage.removeItem(`eirvox_thread_draft_${id}`);
      }
    } catch { /* private mode */ }
    loading = false;
    await tick();
    scrollAnchor?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'end' });
  }

  async function onSend() {
    if (sending || !draft.trim()) return;
    sending = true;
    sendErr = '';
    const r = await sendMessage(id, draft);
    if (!r.ok) {
      sendErr = r.error;
      sending = false;
      return;
    }
    draft = '';
    msgs = await listMessages(id);
    sending = false;
    await tick();
    scrollAnchor?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  function counterpartName(): string {
    const myId = $auth.user?.id;
    if (!conv || !myId) return '-';
    if (conv.buyer_id === myId) return conv.seller?.trading_name ?? '-';
    return conv.buyer?.full_name ?? 'Buyer';
  }

  function isMine(m: Message): boolean {
    return m.sender_id === $auth.user?.id;
  }

  function timeLabel(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  }

  onMount(() => {
    applySeo({ title: 'Conversation · ÉIRVOX', description: 'In-app conversation.' });
    void load();
  });

  $: if (id) { void load(); }
</script>

<Nav />

<main id="main-content" class="thread">
  <div class="page-container thread__wrap">
    {#if loading}
      <p class="evx-caption">Loading…</p>
    {:else if !conv}
      <div class="thread-empty">
        <p>This conversation doesn't exist or you can't access it.</p>
        <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/messages')}>← Inbox</button>
      </div>
    {:else}
      <header class="thread-header">
        <button class="evx-caption thread-header__back" on:click={() => navigate('/messages')}>← INBOX</button>
        <div class="thread-header__main">
          <h1 class="thread-header__name">{counterpartName()}</h1>
          {#if conv.listing}
            {@const lst = conv.listing}
            <button class="thread-header__listing" on:click={() => navigate(`/listing/${lst.slug ?? lst.id}`)}>
              {lst.title} →
            </button>
          {:else}
            <span class="evx-caption thread-header__listing">(listing removed)</span>
          {/if}
        </div>
        {#if conv.listing?.cover_image}
          <img src={conv.listing.cover_image} alt="" class="thread-header__cover" />
        {/if}
      </header>

      <div class="thread-safety">
        <strong>Stay on ÉIRVOX.</strong> Payments, returns and the refund policy only cover deals done in-app.
        Sharing your phone, email, or WhatsApp moves you off-site and outside our protection.
      </div>

      <ul class="msg-list">
        {#each msgs as m (m.id)}
          <li class="msg" class:msg--mine={isMine(m)}>
            {#if m.contains_pii}
              <div class="msg-pii">
                Off-site contact detail shared. Anything that happens after this message is between you and the other party - ÉIRVOX protection ends.
              </div>
            {/if}
            <div class="msg-bubble">
              <p class="msg-body">{m.content}</p>
              <span class="evx-caption msg-time">{timeLabel(m.created_at)}</span>
            </div>
          </li>
        {/each}
        <div bind:this={scrollAnchor}></div>
      </ul>

      <!-- Starter-prompt chips: only on an empty thread, only for the
           buyer side (seller doesn't message themselves). One tap sends
           the prompt as a message. Mirrors FB Marketplace's "Is this
           still available?" instant-send pattern. -->
      {#if msgs.length === 0 && $auth.user?.id === conv.buyer_id}
        <div class="starter-prompts">
          <span class="evx-caption starter-prompts__label">QUICK STARTS</span>
          <div class="starter-prompts__chips">
            {#each ['Is this still available?', 'Open to offers?', 'Where is collection?', 'Can I see more photos?'] as prompt}
              <button class="starter-chip" type="button"
                      on:click={async () => { draft = prompt; await onSend(); }}
                      disabled={sending}>
                {prompt}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <form class="composer" on:submit|preventDefault={onSend}>
        {#if draftLooksLikePii}
          <div class="composer-warn">
            ⚠️ Looks like you're sharing contact details. Sending will move this deal off ÉIRVOX - our refund policy won't apply.
          </div>
        {/if}
        {#if sendErr}<div class="composer-err">{sendErr}</div>{/if}
        <textarea
          class="composer__input"
          rows="2"
          maxlength="4000"
          placeholder="Type a message - press Enter to send, Shift+Enter for newline"
          bind:value={draft}
          on:keydown={onKey}
          disabled={sending}
        ></textarea>
        <button class="evx-btn evx-btn--primary composer__send" type="submit" disabled={sending || !draft.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    {/if}
  </div>
</main>

<Footer />

<style>
  .thread { flex: 1; padding: var(--evx-space-2xl) 0 var(--evx-space-3xl); }
  .thread__wrap { max-width: 760px; }
  .thread-empty { padding: var(--evx-space-3xl) 0; display: flex; flex-direction: column; gap: var(--evx-space-md); align-items: flex-start; }
  .thread-header {
    display: grid; grid-template-columns: auto 1fr auto; gap: var(--evx-space-md);
    align-items: center; padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-lg);
  }
  .thread-header__back {
    background: none; border: none; color: var(--evx-ink-soft);
    cursor: pointer; padding: 0; transition: var(--evx-transition);
  }
  .thread-header__back:hover { color: var(--evx-warm-black); }
  .thread-header__main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .thread-header__name { font-family: var(--evx-font-display); font-size: 22px; font-weight: 500; color: var(--evx-warm-black); }
  .thread-header__listing {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--evx-fox-orange); text-align: left;
  }
  .thread-header__cover { width: 56px; height: 56px; object-fit: cover; }

  .thread-safety {
    background: var(--evx-paper-warm); padding: var(--evx-space-md);
    font-size: 13px; line-height: 1.55; color: var(--evx-ink-soft);
    border-left: 3px solid var(--evx-fox-orange); margin-bottom: var(--evx-space-lg);
  }
  .thread-safety strong { color: var(--evx-warm-black); }

  .msg-list { list-style: none; padding: 0; margin: 0 0 var(--evx-space-xl); display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .msg { display: flex; flex-direction: column; align-items: flex-start; gap: var(--evx-space-xs); }
  .msg--mine { align-items: flex-end; }
  .msg-pii {
    background: rgba(232, 116, 44, 0.12); color: var(--evx-warm-black);
    font-size: 11px; line-height: 1.4; padding: 8px 10px; border-left: 3px solid var(--evx-fox-orange);
    max-width: 80%; font-family: var(--evx-font-mono);
  }
  .msg-bubble {
    background: var(--evx-paper-warm); padding: 10px 14px;
    max-width: 80%; display: flex; flex-direction: column; gap: 4px;
  }
  .msg--mine .msg-bubble { background: var(--evx-warm-black); color: var(--evx-paper); }
  .msg-body { font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .msg-time { color: var(--evx-ink-soft); align-self: flex-end; }
  .msg--mine .msg-time { color: rgba(255,255,255,0.6); }

  .starter-prompts { margin: var(--evx-space-md) 0 var(--evx-space-xl); display: flex; flex-direction: column; gap: 10px; }
  .starter-prompts__label { color: var(--evx-ink-soft); }
  .starter-prompts__chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .starter-chip {
    background: var(--evx-paper-warm); border: 1px solid var(--evx-rule-light);
    padding: 8px 14px; font-size: 13px; line-height: 1.3; color: var(--evx-warm-black);
    cursor: pointer; transition: var(--evx-transition);
  }
  .starter-chip:hover { border-color: var(--evx-warm-black); background: var(--evx-paper); }
  .starter-chip:disabled { opacity: 0.5; cursor: not-allowed; }

  .composer {
    border-top: 1px solid var(--evx-rule-light); padding-top: var(--evx-space-md);
    display: flex; flex-direction: column; gap: var(--evx-space-sm); position: sticky; bottom: 0; background: var(--evx-paper);
  }
  .composer__input {
    width: 100%; padding: 10px 12px; font-family: var(--evx-font-body); font-size: 14px;
    background: var(--evx-paper); border: 1px solid var(--evx-rule-light); resize: vertical;
    color: var(--evx-warm-black); outline: none;
  }
  .composer__input:focus { border-color: var(--evx-warm-black); }
  .composer__send { align-self: flex-end; }
  .composer-warn {
    background: rgba(232, 116, 44, 0.12); border-left: 3px solid var(--evx-fox-orange);
    padding: 8px 10px; font-size: 12px; color: var(--evx-warm-black);
  }
  .composer-err {
    background: rgba(220, 38, 38, 0.08); border-left: 3px solid #DC2626;
    padding: 8px 10px; font-size: 12px; color: #DC2626;
  }
</style>
