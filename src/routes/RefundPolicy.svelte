<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Refund Policy (DRAFT)',
    description: 'Refund policy for ÉIRVOX-owned listings paid via the ÉIRVOX checkout. Discretionary, legitimate-issue only. Pending human and legal review.',
    path: '/refund-policy',
  }));

  const sections = [
    { num: '00', id: 'rp-draft',         label: 'Draft status' },
    { num: '01', id: 'rp-scope',         label: 'Scope' },
    { num: '02', id: 'rp-eligible',      label: 'When we refund' },
    { num: '03', id: 'rp-not-eligible',  label: 'When we do not refund' },
    { num: '04', id: 'rp-how',           label: 'How to request a refund' },
    { num: '05', id: 'rp-deposits',      label: 'Deposits' },
    { num: '06', id: 'rp-statutory',     label: 'Statutory rights' },
  ];
</script>

<LegalLayout
  title="Refund Policy."
  {sections}
  intro="DRAFT, pending human and legal review. This page covers refunds for items where ÉIRVOX is the seller of record. For marketplace listings paid directly to third-party sellers, see Returns & Refunds."
>
  <section class="legal-section">
    <span class="legal-section__num">00 · DRAFT</span>
    <h2 id="rp-draft" class="legal-section__h">Draft status.</h2>
    <div style="border: 1px solid var(--evx-fox-orange); padding: var(--evx-space-md); margin-bottom: var(--evx-space-md);">
      <p style="margin: 0;">
        <strong>This page is a draft.</strong>
        It has not yet been reviewed by a solicitor and is not the final, binding policy.
        It is published so the payment flow has a link target. Treat the operational rules below
        as the current intent; final wording may change after review.
      </p>
    </div>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">01 · SCOPE</span>
    <h2 id="rp-scope" class="legal-section__h">Scope.</h2>
    <p>
      This policy applies when you pay <strong>ÉIRVOX</strong> directly through the
      <strong>Pay</strong> button on a listing. These are listings where ÉIRVOX is the
      seller of record, sourced and shipped by us.
    </p>
    <p>
      For marketplace listings paid directly to a third-party seller via that seller's own
      Revolut account, see <a href="#/returns">Returns &amp; Refunds</a> instead. ÉIRVOX does
      not hold those funds and cannot process refunds on the seller's behalf.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · ELIGIBLE</span>
    <h2 id="rp-eligible" class="legal-section__h">When we refund.</h2>
    <p>
      Refunds are at ÉIRVOX's discretion and are issued only for legitimate issues. Examples
      of legitimate issues:
    </p>
    <ul>
      <li>
        <strong>Item not as described.</strong> The piece you receive materially differs from
        the listing in condition, specification, authenticity, or completeness.
      </li>
      <li>
        <strong>Fault on ÉIRVOX's side.</strong> We cannot fulfil the order, the wrong item
        shipped, the item was damaged in transit while in our care, or we cannot source the
        stock you placed a deposit against.
      </li>
      <li>
        <strong>Statutory entitlement.</strong> Anything Irish consumer law requires us to
        refund, including any applicable cooling-off period for distance sales of new goods.
        See section 06.
      </li>
    </ul>
    <p>
      Where a refund is approved, it is issued via the original Revolut payment method.
      Expect funds to return within 3 business days of approval.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · NOT ELIGIBLE</span>
    <h2 id="rp-not-eligible" class="legal-section__h">When we do not refund.</h2>
    <p>
      The following are not refundable except where statutory rights apply:
    </p>
    <ul>
      <li>
        <strong>Change of mind</strong> after the order is placed. Curated stock is sourced
        against committed orders; cancelling shifts the cost onto us and the next buyer.
      </li>
      <li>
        <strong>Buyer ghosting.</strong> If you stop responding after paying, do not collect
        a shipment, or do not provide a deliverable address within a reasonable window, we
        treat the order as fulfilled.
      </li>
      <li>
        <strong>Failure to complete the purchase</strong> on your side after a deposit, where
        we held the item or sourced stock against that deposit.
      </li>
      <li>
        Items damaged after delivery by buyer handling.
      </li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · HOW</span>
    <h2 id="rp-how" class="legal-section__h">How to request a refund.</h2>
    <ul>
      <li>
        Email <a href="mailto:support@eirvox.ie">support@eirvox.ie</a> within 7 days of
        receiving the item (or, for a non-delivery or sourcing failure, within 7 days of the
        expected delivery date).
      </li>
      <li>
        Include the order reference from your Revolut payment receipt, photographs of the
        item and packaging where relevant, and a short description of the issue.
      </li>
      <li>
        We respond within 3 business days. If approved, the refund is issued through Revolut.
        If declined, we explain why in writing.
      </li>
      <li>
        If you disagree with the outcome, you retain your right to dispute the charge with
        your card issuer or Revolut, and your statutory rights are unaffected.
      </li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · DEPOSITS</span>
    <h2 id="rp-deposits" class="legal-section__h">Deposits.</h2>
    <p>
      Some ÉIRVOX-owned listings take a deposit while we source or produce the item, typically
      with a delivery window of about one month. Deposits credit toward the full price when
      the item ships.
    </p>
    <ul>
      <li>
        <strong>If we cannot source or produce the item:</strong> we refund the deposit in full.
      </li>
      <li>
        <strong>If you cancel before we have committed sourcing or production:</strong>
        we refund the deposit at our discretion.
      </li>
      <li>
        <strong>If you cancel after we have committed sourcing or production:</strong>
        the deposit is non-refundable; it covers the cost of the committed work.
      </li>
      <li>
        <strong>If the delivered item is not as described:</strong> section 02 applies,
        and the deposit forms part of the full-price refund.
      </li>
    </ul>
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
      This is operational policy copy. It is not legal advice. If you need advice on your
      consumer rights, contact the Competition and Consumer Protection Commission (CCPC) or
      a solicitor.
    </p>
  </section>
</LegalLayout>
