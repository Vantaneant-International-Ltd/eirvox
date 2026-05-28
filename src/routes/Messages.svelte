<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import SellerPill from '../lib/SellerPill.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import {
    conversations,
    getConversation,
    getConversationListing,
    getConversationSeller,
    currentUser,
    type Conversation,
  } from '../data/user';
  import { formatPrice } from '../data/listings';

  onMount(() => applySeo(seo.messages()));

  export let conversationId: string = conversations[0]?.id ?? '';

  $: active = getConversation(conversationId) ?? conversations[0];
  $: activeListing = active ? getConversationListing(active) : undefined;
  $: activeSeller = active ? getConversationSeller(active) : undefined;

  let mobileShowingThread = false;
  let messageText = '';

  function selectConversation(id: string) {
    conversationId = id;
    mobileShowingThread = true;
    messageText = '';
  }

  function backToList() {
    mobileShowingThread = false;
  }

  function avatarColor(name: string): string {
    const palette = ['#2A2825', '#3D3A36', '#4a3826', '#3a4538', '#3e3940', '#2e3b42'];
    return palette[name.charCodeAt(0) % palette.length];
  }

  function previewText(c: Conversation): string {
    const last = c.messages[c.messages.length - 1];
    if (!last) return '';
    const prefix = last.sender === 'user' ? 'You: ' : last.sender === 'system' ? '' : '';
    const text = last.text.length > 60 ? last.text.slice(0, 60) + '…' : last.text;
    return prefix + text;
  }

  const statusText: Record<string, string> = {
    'enquiry':        'Enquiry · no offer yet',
    'reserved':       'Reserved · awaiting confirmation',
    'offer-pending':  'Offer pending · €3,400 agreed',
    'shipped':        'Shipped · in transit',
  };

  function sendMessage() {
    if (!messageText.trim() || !active) return;
    // Visual only — append to local view
    active.messages = [
      ...active.messages,
      {
        id: 'm-' + Date.now(),
        sender: 'user',
        text: messageText.trim(),
        timestamp: 'Just now',
        read: true,
      },
    ];
    messageText = '';
    // Trigger reactivity
    conversationId = active.id;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<Nav />

<main id="main-content" class="msg-page">
  <div class="page-container">

    <!-- Header -->
    <header class="msg-header">
      <div>
        <span class="evx-caption msg-header__pre">ACCOUNT · MESSAGES</span>
        <h1 class="msg-title">Messages.</h1>
      </div>
      <div class="msg-header__actions">
        <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/account')}>
          ← Account
        </button>
      </div>
    </header>

    {#if conversations.length === 0}
      <div class="msg-empty">
        <span class="evx-label msg-empty__label">NO MESSAGES YET</span>
        <h2 class="msg-empty__h">No messages yet.</h2>
        <p class="msg-empty__sub">Reserve an item or ask a seller a question to start a conversation.</p>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/automotive')}>
          Browse marketplace →
        </button>
      </div>
    {:else}
      <div class="msg-shell" class:msg-shell--thread-mobile={mobileShowingThread}>
        <!-- LEFT: conversation list -->
        <aside class="msg-list">
          <div class="msg-list__head">
            <span class="evx-label">{conversations.length} CONVERSATIONS</span>
          </div>
          <div class="msg-list__items">
            {#each conversations as c}
              {@const listing = getConversationListing(c)}
              {@const seller = getConversationSeller(c)}
              {#if listing && seller}
                <button
                  class="msg-item"
                  class:msg-item--active={c.id === active?.id}
                  on:click={() => selectConversation(c.id)}
                >
                  <div class="msg-item__avatar" style="background: {avatarColor(seller.name)}">
                    {seller.name.charAt(0)}
                  </div>
                  <div class="msg-item__body">
                    <div class="msg-item__top">
                      <span class="msg-item__name">{seller.name}</span>
                      <span class="evx-caption msg-item__time">{c.lastActivity}</span>
                    </div>
                    <span class="msg-item__listing evx-caption">{listing.title}</span>
                    <span class="msg-item__preview" class:msg-item__preview--unread={c.unread > 0}>
                      {previewText(c)}
                    </span>
                  </div>
                  {#if c.unread > 0}
                    <span class="msg-item__dot" aria-label="{c.unread} unread"></span>
                  {/if}
                </button>
              {/if}
            {/each}
          </div>
        </aside>

        <!-- RIGHT: thread -->
        {#if active && activeListing && activeSeller}
          <section class="msg-thread">
            <header class="msg-thread__head">
              <button class="msg-thread__back evx-caption" on:click={backToList}>
                ← All
              </button>
              <div
                class="msg-thread__listing"
                role="link"
                tabindex="0"
                on:click={() => navigate(`/listing/${activeListing.slug}`)}
                on:keydown={(e) => e.key === 'Enter' && navigate(`/listing/${activeListing.slug}`)}
              >
                <div class="msg-thread__thumb"></div>
                <div class="msg-thread__listing-info">
                  <strong class="msg-thread__title">{activeListing.title}</strong>
                  <div class="msg-thread__meta">
                    <span class="msg-thread__price">{formatPrice(activeListing.price)}</span>
                    <span class="msg-thread__sep">·</span>
                    <SellerPill tier={activeSeller.tier} name={activeSeller.name} rating={activeSeller.rating} compact={true} />
                  </div>
                </div>
              </div>
              {#if active.status && statusText[active.status]}
                <span class="evx-caption msg-thread__status">{statusText[active.status]}</span>
              {/if}
            </header>

            <div class="msg-thread__body">
              {#each active.messages as m}
                {#if m.sender === 'system'}
                  <div class="msg-bubble msg-bubble--system">
                    <span class="evx-label">SYSTEM</span>
                    <p>{m.text}</p>
                    <span class="evx-caption msg-bubble__time">{m.timestamp}</span>
                  </div>
                {:else if m.sender === 'user'}
                  <div class="msg-bubble msg-bubble--user">
                    <p>{m.text}</p>
                    <span class="evx-caption msg-bubble__time">{m.timestamp} · You</span>
                  </div>
                {:else}
                  <div class="msg-bubble msg-bubble--seller">
                    <p>{m.text}</p>
                    <span class="evx-caption msg-bubble__time">{m.timestamp} · {activeSeller.name}</span>
                  </div>
                {/if}
              {/each}
            </div>

            <footer class="msg-thread__compose">
              <textarea
                class="msg-thread__input"
                placeholder="Write a message — Enter to send, Shift+Enter for new line"
                bind:value={messageText}
                on:keydown={handleKeydown}
                rows="2"
              ></textarea>
              <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={sendMessage} disabled={!messageText.trim()}>
                Send →
              </button>
            </footer>
          </section>
        {/if}
      </div>
    {/if}

  </div>
</main>

<Footer />

<style>
  .msg-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .msg-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .msg-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }
  .msg-title { font-family: var(--evx-font-display); font-size: clamp(32px, 4vw, 48px); font-weight: 500; letter-spacing: -0.025em; }

  /* Shell */
  .msg-shell {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 0;
    border: 1px solid var(--evx-rule-light);
    min-height: 600px;
  }

  /* Conversation list */
  .msg-list {
    border-right: 1px solid var(--evx-rule-light);
    display: flex;
    flex-direction: column;
  }

  .msg-list__head {
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    background: rgba(0,0,0,0.02);
  }
  .msg-list__head span { color: var(--evx-ink-soft); }

  .msg-list__items { display: flex; flex-direction: column; flex: 1; overflow-y: auto; }

  .msg-item {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: background 200ms ease;
    align-items: flex-start;
  }
  .msg-item:hover { background: rgba(0,0,0,0.02); }
  .msg-item--active { background: rgba(0,0,0,0.04); }
  .msg-item:last-child { border-bottom: none; }

  .msg-item__avatar {
    width: 36px; height: 36px;
    display: flex; align-items: center; justify-content: center;
    color: var(--evx-paper);
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 15px;
    flex-shrink: 0;
  }

  .msg-item__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .msg-item__top { display: flex; justify-content: space-between; gap: var(--evx-space-sm); align-items: baseline; }
  .msg-item__name { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .msg-item__time { color: var(--evx-ink-soft); white-space: nowrap; }

  .msg-item__listing {
    color: var(--evx-ink-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .msg-item__preview {
    font-size: 13px;
    color: var(--evx-ink-soft);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .msg-item__preview--unread { color: var(--evx-warm-black); font-weight: 500; }

  .msg-item__dot {
    width: 8px; height: 8px;
    background: var(--evx-fox-orange);
    border-radius: 50%;
    margin-top: 8px;
    flex-shrink: 0;
  }

  /* Thread */
  .msg-thread {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .msg-thread__head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    background: rgba(0,0,0,0.02);
    align-items: center;
  }

  .msg-thread__back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    transition: var(--evx-transition);
    display: none;
  }
  .msg-thread__back:hover { color: var(--evx-warm-black); }

  .msg-thread__listing {
    display: flex;
    gap: var(--evx-space-md);
    align-items: center;
    cursor: pointer;
    transition: var(--evx-transition);
    min-width: 0;
  }
  .msg-thread__listing:hover { opacity: 0.80; }

  .msg-thread__thumb { width: 36px; height: 42px; background: var(--evx-graphite); flex-shrink: 0; }
  .msg-thread__listing-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .msg-thread__title {
    font-family: var(--evx-font-display);
    font-size: 14px; font-weight: 500;
    color: var(--evx-warm-black);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .msg-thread__meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .msg-thread__price { font-family: var(--evx-font-display); font-weight: 500; font-size: 13px; }
  .msg-thread__sep { color: var(--evx-rule-light); }

  .msg-thread__status {
    color: var(--evx-fox-orange);
    white-space: nowrap;
  }

  .msg-thread__body {
    flex: 1;
    padding: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    overflow-y: auto;
    max-height: 540px;
  }

  /* Bubbles */
  .msg-bubble {
    max-width: 75%;
    padding: var(--evx-space-md);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .msg-bubble p { font-size: 14px; line-height: 1.55; }
  .msg-bubble__time { color: var(--evx-ink-soft); margin-top: 4px; }

  .msg-bubble--user {
    align-self: flex-end;
    background: var(--evx-warm-black);
    color: var(--evx-paper);
  }
  .msg-bubble--user .msg-bubble__time { color: rgba(245,242,237,0.6); }

  .msg-bubble--seller {
    align-self: flex-start;
    background: rgba(0,0,0,0.04);
    color: var(--evx-warm-black);
  }

  .msg-bubble--system {
    align-self: center;
    background: rgba(232,116,44,0.08);
    color: var(--evx-warm-black);
    border-left: 2px solid var(--evx-fox-orange);
    max-width: 90%;
    text-align: center;
  }
  .msg-bubble--system span:first-child { color: var(--evx-fox-orange); }

  /* Compose */
  .msg-thread__compose {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    align-items: flex-end;
    background: rgba(0,0,0,0.02);
  }

  .msg-thread__input {
    flex: 1;
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) var(--evx-space-md);
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
    resize: vertical;
    min-height: 44px;
    line-height: 1.5;
  }
  .msg-thread__input:focus { border-color: var(--evx-warm-black); }
  .msg-thread__input::placeholder { color: var(--evx-ink-soft); }

  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }
  .evx-btn:disabled:hover { opacity: 0.40; }

  /* Empty state */
  .msg-empty {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
    padding: var(--evx-space-3xl) 0;
    max-width: 480px;
  }
  .msg-empty__label { color: var(--evx-fox-orange); }
  .msg-empty__h {
    font-family: var(--evx-font-display);
    font-size: 32px; font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .msg-empty__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  @media (max-width: 1023px) {
    .msg-shell { grid-template-columns: 1fr; min-height: 500px; position: relative; }

    .msg-list { border-right: none; }

    .msg-thread {
      display: none;
    }

    .msg-shell--thread-mobile .msg-list { display: none; }
    .msg-shell--thread-mobile .msg-thread { display: flex; }

    .msg-thread__back { display: inline-block; }
    .msg-thread__head { grid-template-columns: auto 1fr; }
    .msg-thread__status { grid-column: 1 / -1; }
    .msg-thread__body { max-height: none; }
  }
</style>
