<script lang="ts">
  // Optional variant for the eyebrow line above the card
  export let label: string = '';
</script>

<div class="lcd" aria-hidden="true">
  <div class="lcd__image">
    <div class="lcd__shimmer"></div>
  </div>
  <div class="lcd__body">
    {#if label}<span class="lcd__eyebrow">{label}</span>{/if}
    <div class="lcd__line lcd__line--title"></div>
    <div class="lcd__line lcd__line--sub"></div>
    <div class="lcd__meta">
      <div class="lcd__line lcd__line--price"></div>
      <div class="lcd__line lcd__line--small"></div>
    </div>
  </div>
</div>

<style>
  .lcd {
    display: flex;
    flex-direction: column;
  }

  .lcd__image {
    aspect-ratio: 5 / 6;
    background: #2A2825;
    position: relative;
    overflow: hidden;
  }

  .lcd__shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(245, 242, 237, 0.04) 50%,
      transparent 100%
    );
    animation: shimmer 1600ms ease-in-out infinite;
  }

  .lcd__body {
    padding: var(--evx-space-md) 0;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .lcd__eyebrow {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-bottom: 2px;
  }

  .lcd__line {
    background: var(--evx-rule-light);
    border-radius: 1px;
    height: 12px;
  }

  .lcd__line--title { width: 78%; height: 18px; }
  .lcd__line--sub   { width: 56%; height: 11px; }
  .lcd__line--price { width: 34%; height: 18px; }
  .lcd__line--small { width: 24%; height: 11px; }

  .lcd__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }

  @keyframes shimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
