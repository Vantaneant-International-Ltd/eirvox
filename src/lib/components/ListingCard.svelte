<script lang="ts">
  import VerifiedMark from './VerifiedMark.svelte'

  export let marque: string = ''
  export let title: string = ''
  export let subtitle: string = ''
  export let price: string = ''
  export let location: string = ''
  export let image: string | undefined = undefined
  export let slug: string = ''
  export let sku: string = ''
  export let lotNumber: number = 0
  export let totalLots: number = 0

  function pad(n: number): string {
    return n.toString().padStart(2, '0')
  }
</script>

<a class="listing-card" href="/#/automotive/{slug}">
  <div class="image-container">
    {#if image}
      <img src={image} alt={title} />
    {:else}
      <div class="placeholder">
        <span class="placeholder-circle" aria-hidden="true"></span>
        <span class="placeholder-text">PRODUCT 4:3</span>
      </div>
    {/if}
    <span class="lot-number">{pad(lotNumber)} / {pad(totalLots)}</span>
    <span class="sku-overlay">{sku}</span>
  </div>

  <div class="card-body">
    <span class="marque-label">{marque}</span>
    <h3 class="card-title">{title}</h3>
    {#if subtitle}
      <p class="card-subtitle">{subtitle}</p>
    {/if}
    <hr class="card-rule" />
    <div class="price-row">
      <span class="price">{price}</span>
      <span class="card-location">{location}</span>
    </div>
    <VerifiedMark compact />
  </div>
</a>

<style>
  .listing-card {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
  }

  .image-container {
    position: relative;
    aspect-ratio: 4 / 3;
    background-color: var(--evx-graphite);
    overflow: hidden;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--evx-space-md);
  }

  .placeholder-circle {
    display: block;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px dashed var(--evx-rule-dark);
  }

  .placeholder-text {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-rule-dark);
  }

  .lot-number {
    position: absolute;
    top: var(--evx-space-sm);
    left: var(--evx-space-sm);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-rule-dark);
  }

  .sku-overlay {
    position: absolute;
    bottom: var(--evx-space-sm);
    right: var(--evx-space-sm);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-rule-dark);
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
  }

  .marque-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .card-title {
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: 20px;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    margin: 0;
  }

  .card-subtitle {
    font-family: var(--evx-type-accent-family);
    font-style: var(--evx-type-accent-style);
    font-weight: var(--evx-type-accent-weight);
    font-size: 16px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .card-rule {
    border: none;
    border-top: 1px solid var(--evx-rule-light);
    margin: var(--evx-space-xs) 0;
  }

  .price-row {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-sm);
  }

  .price {
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: 24px;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }

  .card-location {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
</style>
