<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { listMyConversations, type ConversationSummary } from '../lib/messaging';
  import { auth } from '../lib/auth';
  import { applySeo } from '../lib/seo';

  let convs: ConversationSummary[] = [];
  let loading = true;

  async function load() {
    loading = true;
    convs = await listMyConversations();
    loading = false;
  }

  onMount(() => {
    applySeo({ title: 'Inbox · ÉIRVOX', description: 'Your conversations with sellers on ÉIRVOX.' });
    void load();
  });

  function relTime(iso: string): string {
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  }

  function counterpartName(c: ConversationSummary): string {
    const myId = $auth.user?.id;
    if (!myId) return '-';
    if (c.buyer_id === myId) return c.seller?.trading_name ?? '-';
    return c.buyer?.full_name ?? 'Buyer';
  }

  function unreadFor(c: ConversationSummary): number {
    const myId = $auth.user?.id;
    if (!myId) return 0;
    if (c.buyer_id === myId) return c.buyer_unread ?? 0;
    return c.seller_unread ?? 0;
  }
</script>

<Nav />

<main id="main-content" class="inbox">
  <div class="page-container">
    <header class="inbox-header">
      <span class="evx-caption inbox-header__pre">MESSAGES</span>
      <h1 class="inbox-header__h">Your inbox.</h1>
      <p class="inbox-header__sub">
        Buyer ↔ seller conversations scoped to a listing. ÉIRVOX never reads your messages unless reported.
      </p>
    </header>

    {#if loading}
      <p class="evx-caption inbox-empty__copy">Loading…</p>
    {:else if convs.length === 0}
      <div class="inbox-empty">
        <p class="inbox-empty__copy">No conversations yet. Open a listing and tap <strong>Message seller</strong> to start one.</p>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Browse listings →</button>
      </div>
    {:else}
      <ul class="conv-list">
        {#each convs as c (c.id)}
          <li>
            <button class="conv" on:click={() => navigate(`/messages/${c.id}`)}>
              <div class="conv__cover">
                {#if c.listing?.cover_image}
                  <img src={c.listing.cover_image} alt="" />
                {:else}
                  <span class="conv__cover-fallback">-</span>
                {/if}
              </div>
              <div class="conv__body">
                <div class="conv__row1">
                  <span class="conv__counterpart">{counterpartName(c)}</span>
                  <span class="evx-caption conv__time">{relTime(c.last_message_at)}</span>
                </div>
                <div class="conv__row2">
                  <span class="conv__listing">{c.listing?.title ?? '(listing removed)'}</span>
                  {#if unreadFor(c) > 0}
                    <span class="conv__badge">{unreadFor(c)}</span>
                  {/if}
                </div>
                {#if c.last_message_preview}
                  <p class="conv__preview">{c.last_message_preview}</p>
                {/if}
              </div>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

<Footer />

<style>
  .inbox { flex: 1; padding: var(--evx-space-2xl) 0 var(--evx-space-3xl); }
  .inbox-header { margin-bottom: var(--evx-space-2xl); padding-bottom: var(--evx-space-xl); border-bottom: 1px solid var(--evx-rule-light); }
  .inbox-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .inbox-header__h {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }
  .inbox-header__sub { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; }
  .inbox-empty { padding: var(--evx-space-3xl) 0; display: flex; flex-direction: column; gap: var(--evx-space-md); align-items: flex-start; }
  .inbox-empty__copy { font-size: 14px; color: var(--evx-ink-soft); }
  .conv-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
  .conv {
    display: grid; grid-template-columns: 64px 1fr; gap: var(--evx-space-lg);
    align-items: center; width: 100%; padding: var(--evx-space-md) 0;
    background: none; border: none; border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer; text-align: left; transition: var(--evx-transition);
  }
  .conv:hover { background: rgba(0,0,0,0.025); }
  .conv__cover {
    width: 64px; height: 64px; background: var(--evx-paper-warm);
    overflow: hidden; display: flex; align-items: center; justify-content: center;
  }
  .conv__cover img { width: 100%; height: 100%; object-fit: cover; }
  .conv__cover-fallback { color: var(--evx-ink-soft); font-family: var(--evx-font-mono); font-size: 11px; }
  .conv__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .conv__row1 { display: flex; justify-content: space-between; align-items: baseline; gap: var(--evx-space-md); }
  .conv__counterpart { font-family: var(--evx-font-display); font-size: 15px; font-weight: 500; color: var(--evx-warm-black); }
  .conv__time { color: var(--evx-ink-soft); }
  .conv__row2 { display: flex; align-items: center; gap: var(--evx-space-sm); }
  .conv__listing { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-soft); }
  .conv__badge {
    background: var(--evx-fox-orange); color: var(--evx-paper);
    font-family: var(--evx-font-mono); font-size: 9px; font-weight: 600;
    padding: 1px 6px; border-radius: 999px; letter-spacing: 0.04em;
  }
  .conv__preview {
    font-size: 13px; color: var(--evx-ink-soft); line-height: 1.4;
    margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
</style>
