<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Refund Policy',
    description: 'How refunds and deposits work on ÉIRVOX-paid orders. Effective 1 June 2026, subject to final legal review.',
    path: '/refund-policy',
  }));

  const sections = [
    { num: '01', id: 'rp-scope',     label: 'Scope' },
    { num: '02', id: 'rp-deposits',  label: 'Deposits' },
    { num: '03', id: 'rp-balance',   label: 'Balance on deposit orders' },
    { num: '04', id: 'rp-full',      label: 'Full payments' },
    { num: '05', id: 'rp-how',       label: 'How to request a refund' },
    { num: '06', id: 'rp-statutory', label: 'Statutory rights' },
  ];
</script>

<LegalLayout
  title="Refund Policy."
  {sections}
  intro="How refunds and deposits work on ÉIRVOX-paid orders. Effective 1 June 2026. This policy is subject to final legal review before public launch."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · SCOPE</span>
    <h2 id="rp-scope" class="legal-section__h">Scope.</h2>
    <p>
      This policy covers refunds for orders paid to ÉIRVOX through the
      <strong>Pay</strong> button on a listing. ÉIRVOX is the seller of record for these
      orders.
    </p>
    <p>
      ÉIRVOX does not hold money on behalf of third parties. There is no escrow, no
      buyer-protection guarantee, and no authentication or inspection service operating
      between buyer and seller. Payment goes from your card or wallet to ÉIRVOX through
      Revolut and is held by ÉIRVOX until the order is fulfilled or refunded under the
      terms below.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · DEPOSITS</span>
    <h2 id="rp-deposits" class="legal-section__h">Deposits.</h2>
    <p>
      Some listings, including all DRIVE issues, take a deposit instead of full payment
      up front. The deposit is <strong>10% of the listed price</strong>, paid through
      Revolut. Placing it secures one of a limited number of units from the production
      run.
    </p>
    <p>The deposit is refundable in any of these cases:</p>
    <ul>
      <li>ÉIRVOX cannot fulfil the order.</li>
      <li>The production run does not happen, or stock cannot be supplied.</li>
      <li>The fault is on ÉIRVOX's side.</li>
    </ul>
    <p>
      The deposit is <strong>not refundable</strong> for change of mind, buyer no-show,
      or failure to complete the purchase after the item is ready. In those cases the
      deposit is forfeit; it secured the allocation.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · BALANCE</span>
    <h2 id="rp-balance" class="legal-section__h">Balance on deposit orders.</h2>
    <p>
      The remaining 90% of the order price is paid one of two ways:
    </p>
    <ul>
      <li><strong>Collection:</strong> in person, on the day you collect the item.</li>
      <li><strong>Delivery:</strong> in full before dispatch.</li>
    </ul>
    <p>
      If the balance is not paid when the item is ready, the deposit is forfeit and the
      allocation is released. We hold the item for a reasonable window after notifying
      you it is ready; the exact window depends on the item and is communicated at that
      point.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · FULL PAYMENTS</span>
    <h2 id="rp-full" class="legal-section__h">Full payments and in-stock items.</h2>
    <p>
      For in-stock items paid in full at checkout, refunds are at ÉIRVOX's discretion
      and are issued only for legitimate issues:
    </p>
    <ul>
      <li>The item is not as described.</li>
      <li>The item is faulty.</li>
      <li>The item is materially not as listed.</li>
    </ul>
    <p>
      Refunds are not issued for change of mind once the item has been collected or
      shipped, subject to statutory rights (see section 06).
    </p>
    <p>
      Where a refund is approved, funds return via the original Revolut payment method,
      typically within 3 business days of approval.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · HOW</span>
    <h2 id="rp-how" class="legal-section__h">How to request a refund.</h2>
    <p>
      Email <a href="mailto:support@eirvox.ie">support@eirvox.ie</a> with:
    </p>
    <ul>
      <li>The order reference from your Revolut payment receipt.</li>
      <li>A short description of the issue.</li>
      <li>Photographs of the item and packaging where relevant.</li>
    </ul>
    <p>
      We respond within 5 business days. If we approve a refund, it is issued through
      Revolut. If we decline, we explain why in writing.
    </p>
    <p>
      You retain your right to dispute the charge with your card issuer or Revolut, and
      your statutory rights are unaffected.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">06 · STATUTORY</span>
    <h2 id="rp-statutory" class="legal-section__h">Statutory rights.</h2>
    <p>
      Nothing in this policy reduces your rights under Irish consumer law, including the
      Consumer Rights Act 2022 and any applicable cooling-off period for distance sales.
      Where statutory rights conflict with this policy, statutory rights take precedence.
    </p>
    <p>
      This is operational policy copy. It is not legal advice. For guidance on your
      consumer rights, contact the Competition and Consumer Protection Commission
      (CCPC) or a solicitor.
    </p>
  </section>
</LegalLayout>
