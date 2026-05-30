<script lang="ts">
  // ============================================================
  // ÉIRVOX — payment method icon strip
  // ============================================================
  //
  // Inline SVG badges for the methods Revolut hosted checkout offers.
  // Same visual treatment as Shopify's standard payment row:
  // small white mini-cards (~40×24, 4px corners) with the brand mark
  // inside. Dark variants for Apple Pay / Revolut Pay (their official
  // dark badges) for visual rhythm against the dark footer.
  //
  // These are simplified silhouettes used as "accepted payment
  // methods" indicators. Replace with each network's officially
  // approved badge SKU before a paid launch if the brand teams
  // require it.
  // ============================================================
</script>

<div class="pmi" aria-label="Accepted payment methods" role="list">

  <!-- Revolut Pay -->
  <span class="pmi__card pmi__card--dark" role="listitem" title="Revolut Pay">
    <svg viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="24" rx="3" fill="#0A0A0A"/>
      <!-- Bold R, small Pay -->
      <text x="8" y="17" fill="#FFFFFF" font-family="Inter Tight, system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="-0.5">R</text>
      <text x="19" y="17" fill="#FFFFFF" font-family="Inter Tight, system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.2">evolut</text>
      <text x="50" y="17" fill="#FFFFFF" font-family="Inter Tight, system-ui, sans-serif" font-size="9" font-weight="500" letter-spacing="0.3">Pay</text>
    </svg>
  </span>

  <!-- Apple Pay -->
  <span class="pmi__card pmi__card--dark" role="listitem" title="Apple Pay">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#0A0A0A"/>
      <!-- Apple silhouette -->
      <g transform="translate(10 6) scale(0.6)" fill="#FFFFFF">
        <path d="M16.3 10.1c-.02-2.13 1.74-3.16 1.82-3.21-1-1.46-2.55-1.66-3.1-1.68-1.32-.13-2.57.78-3.24.78-.68 0-1.7-.76-2.8-.74-1.44.02-2.78.84-3.52 2.13-1.5 2.62-.38 6.5 1.08 8.62.71 1.04 1.56 2.2 2.66 2.16 1.07-.04 1.48-.69 2.77-.69 1.3 0 1.66.69 2.79.67 1.15-.02 1.89-1.06 2.59-2.1.82-1.2 1.16-2.36 1.18-2.42-.03-.01-2.25-.86-2.27-3.42z"/>
        <path d="M14.16 3.57c.58-.7.97-1.68.86-2.65-.84.04-1.85.56-2.45 1.26-.54.62-1.01 1.6-.88 2.56.93.07 1.89-.47 2.47-1.17z"/>
      </g>
      <text x="22" y="17" fill="#FFFFFF" font-family="Inter Tight, system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.2">Pay</text>
    </svg>
  </span>

  <!-- Google Pay -->
  <span class="pmi__card" role="listitem" title="Google Pay">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#FFFFFF" stroke="#E0E0E0"/>
      <!-- Multi-color G -->
      <g transform="translate(7 6)">
        <path d="M11 6c0-.42-.04-.83-.11-1.22H6v2.31h2.81c-.12.66-.49 1.22-1.05 1.6v1.32h1.7c1-.92 1.54-2.28 1.54-3.91z" fill="#4285F4"/>
        <path d="M6 12c1.42 0 2.61-.47 3.48-1.27l-1.7-1.32c-.47.32-1.08.5-1.78.5-1.37 0-2.53-.92-2.94-2.16H1.32v1.36C2.18 10.84 3.97 12 6 12z" fill="#34A853"/>
        <path d="M3.06 7.75c-.1-.32-.16-.65-.16-1s.06-.68.16-1V4.39H1.32C.96 5.13.75 5.95.75 6.75c0 .8.21 1.62.57 2.36L3.06 7.75z" fill="#FBBC05"/>
        <path d="M6 3.59c.77 0 1.46.27 2 .78l1.51-1.51C8.6.96 7.41.5 6 .5 3.97.5 2.18 1.66 1.32 3.39l1.74 1.36C3.47 3.51 4.63 3.59 6 3.59z" fill="#EA4335"/>
      </g>
      <text x="20" y="17" fill="#5F6368" font-family="Inter Tight, system-ui, sans-serif" font-size="11" font-weight="600" letter-spacing="0.2">Pay</text>
    </svg>
  </span>

  <!-- Visa -->
  <span class="pmi__card" role="listitem" title="Visa">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#FFFFFF" stroke="#E0E0E0"/>
      <!-- Visa wordmark in their italic blue style -->
      <text x="24" y="17" fill="#1A1F71" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="13" font-weight="900" font-style="italic" letter-spacing="0.3" text-anchor="middle">VISA</text>
    </svg>
  </span>

  <!-- Mastercard -->
  <span class="pmi__card" role="listitem" title="Mastercard">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#FFFFFF" stroke="#E0E0E0"/>
      <circle cx="20" cy="11" r="6" fill="#EB001B"/>
      <circle cx="28" cy="11" r="6" fill="#F79E1B"/>
      <path d="M24 6.6a6 6 0 0 0 0 8.8 6 6 0 0 0 0-8.8z" fill="#FF5F00"/>
      <text x="24" y="22" fill="#1A1F36" font-family="Helvetica, Arial, sans-serif" font-size="3.5" font-weight="700" text-anchor="middle" letter-spacing="0.2">mastercard</text>
    </svg>
  </span>

  <!-- Amex -->
  <span class="pmi__card" role="listitem" title="American Express">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#1F72CD"/>
      <!-- Stacked AMERICAN / EXPRESS in their compact style -->
      <text x="24" y="11" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="4.5" font-weight="900" text-anchor="middle" letter-spacing="0.4">AMERICAN</text>
      <text x="24" y="17" fill="#FFFFFF" font-family="Helvetica, Arial, sans-serif" font-size="4.5" font-weight="900" text-anchor="middle" letter-spacing="0.4">EXPRESS</text>
    </svg>
  </span>

  <!-- Pay by bank -->
  <span class="pmi__card" role="listitem" title="Pay by bank (open banking)">
    <svg viewBox="0 0 48 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="48" height="24" rx="3" fill="#FFFFFF" stroke="#E0E0E0"/>
      <!-- Bank glyph: roof + 4 columns + base -->
      <g transform="translate(8 5)" fill="#1A1A1A">
        <polygon points="7,0 14,4 0,4"/>
        <rect x="0.5" y="5" width="1.2" height="7"/>
        <rect x="4.4" y="5" width="1.2" height="7"/>
        <rect x="8.3" y="5" width="1.2" height="7"/>
        <rect x="12.2" y="5" width="1.2" height="7"/>
        <rect x="0" y="12.5" width="14" height="1.5"/>
      </g>
      <text x="26" y="11" fill="#1A1A1A" font-family="Inter Tight, system-ui, sans-serif" font-size="6" font-weight="700" letter-spacing="0.2">Pay by</text>
      <text x="26" y="18" fill="#1A1A1A" font-family="Inter Tight, system-ui, sans-serif" font-size="6" font-weight="700" letter-spacing="0.2">bank</text>
    </svg>
  </span>

</div>

<style>
  .pmi {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .pmi__card {
    display: inline-flex;
    flex-shrink: 0;
    line-height: 0;
  }
  .pmi__card svg {
    height: 24px;
    width: auto;
    display: block;
  }
</style>
