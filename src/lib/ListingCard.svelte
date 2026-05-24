<script lang="ts">
  import VerifiedMark from './VerifiedMark.svelte';

  export let marque: string;
  export let title: string;
  export let subtitle: string;
  export let price: string;
  export let location: string;
  export let image: string | undefined = undefined;
  export let slug: string;
  export let sku: string;
  export let lotNumber: number | undefined = undefined;
</script>

<a href="/#/automotive/{slug}" class="card">
  <div class="card__image">
    {#if lotNumber}
      <span class="evx-caption card__lot">{String(lotNumber).padStart(2, '0')} / 08</span>
    {/if}
    {#if image}
      <img src={image} alt={title} />
    {:else}
      <div class="card__placeholder">
        <span class="evx-caption card__placeholder-text">PRODUCT 4:3</span>
      </div>
    {/if}
    <span class="evx-caption card__sku-overlay">{sku}</span>
  </div>

  <div class="card__body">
    <span class="evx-label card__marque">{marque.toUpperCase()}</span>
    <h2 class="card__title">{title}</h2>
    <p class="card__subtitle">{subtitle}</p>
    <div class="card__meta">
      <span class="card__price">{price}</span>
      <span class="evx-caption card__location">{location}</span>
    </div>
    <VerifiedMark />
  </div>
</a>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: var(--evx-white);
    text-decoration: none;
    color: var(--evx-warm-black);
    transition: var(--evx-transition);
  }

  .card:hover {
    opacity: 0.88;
  }

  .card__image {
    position: relative;
    aspect-ratio: 4 / 3;
    background: var(--evx-graphite);
    overflow: hidden;
  }

  .card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card__placeholder-text {
    color: var(--evx-ink-soft);
  }

  .card__lot {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: var(--evx-ink-soft);
    z-index: 1;
  }

  .card__sku-overlay {
    position: absolute;
    bottom: var(--evx-space-md);
    right: var(--evx-space-md);
    color: var(--evx-ink-soft);
    z-index: 1;
  }

  .card__body {
    padding: var(--evx-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .card__marque {
    color: var(--evx-ink-soft);
  }

  .card__title {
    font-size: 20px;
    line-height: 1.20;
    letter-spacing: -0.015em;
    font-weight: 500;
  }

  .card__subtitle {
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-size: 14px;
    color: var(--evx-ink-soft);
  }

  .card__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }

  .card__price {
    font-family: 'Inter Tight', sans-serif;
    font-weight: 500;
    font-size: 20px;
  }

  .card__location {
    color: var(--evx-ink-soft);
  }
</style>
