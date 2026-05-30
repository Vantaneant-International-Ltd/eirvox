<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Returns & Refunds',
    description: 'How returns and refunds work on ÉIRVOX — for marketplace items, DRIVE editions, and TRADE subscriptions.',
    path: '/returns',
  }));

  const sections = [
    { num: '01', id: 'r-deposits',   label: 'Reservation deposits' },
    { num: '02', id: 'r-items',      label: 'Item returns' },
    { num: '03', id: 'r-auth',       label: 'Authenticated items' },
    { num: '04', id: 'r-drive',      label: 'DRIVE editions' },
    { num: '05', id: 'r-trade',      label: 'TRADE subscriptions' },
    { num: '06', id: 'r-disputes',   label: 'Dispute process' },
  ];
</script>

<LegalLayout
  title="Returns & Refunds."
  {sections}
  intro="The rules for getting money back, sending items back, and cancelling subscriptions. Clear answers — no fine print buried at the bottom."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · DEPOSITS</span>
    <h2 id="r-deposits" class="legal-section__h">Reservation deposits.</h2>
    <p>
      Marketplace reservation deposits are paid <strong>directly to the seller</strong> via Revolut at
      checkout. ÉIRVOX is a venue and never holds buyer funds for marketplace transactions.
    </p>
    <p>
      <strong>How to get a refund:</strong>
    </p>
    <ul>
      <li>
        Contact the seller using the email or phone shown on the listing. Quote the
        reference shown on your Revolut receipt.
      </li>
      <li>
        The seller refunds via their Revolut Business dashboard. Funds typically return to your
        original payment method within 3 business days.
      </li>
      <li>
        Sellers must honour the refund window stated on their listing and the protections required
        by Irish consumer law (including the 14-day distance-selling cooling-off period for new goods,
        where it applies).
      </li>
      <li>
        If the seller does not respond or refuses a refund you're entitled to, raise a dispute with
        your card issuer or Revolut for a chargeback. ÉIRVOX cannot process refunds on a seller's behalf,
        but we will suspend sellers who repeatedly ignore legitimate refund requests
        (see Acceptable Use).
      </li>
    </ul>
    <p>
      DRIVE editions are different — ÉIRVOX is the seller, so we handle DRIVE refunds directly.
      See section 04 below.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · ITEMS</span>
    <h2 id="r-items" class="legal-section__h">Item returns.</h2>
    <p>
      ÉIRVOX facilitates returns between buyers and sellers — we don't take the item back ourselves
      because we're not the seller of record.
    </p>
    <ul>
      <li>
        <strong>Item not as described:</strong> sellers must accept returns. This is required under
        Irish consumer law and platform rules. Return shipping is paid by the seller.
      </li>
      <li>
        <strong>Change of mind:</strong> at the seller's discretion. Some sellers accept,
        some don't — check the listing or message before reserving.
      </li>
      <li>
        Return shipping for change-of-mind returns is paid by the buyer unless otherwise agreed.
      </li>
      <li>
        Items must be returned in the same condition they were received.
      </li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · AUTHENTICATED</span>
    <h2 id="r-auth" class="legal-section__h">Authenticated items.</h2>
    <p>
      Items that passed ÉIRVOX authentication carry an extra guarantee: if the item is later
      independently shown to be inauthentic, ÉIRVOX refunds the buyer in full and audits the seller account.
    </p>
    <p>
      This applies even after the standard 7-day dispute window, where the buyer can demonstrate the item
      was misrepresented at the time of sale.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · DRIVE</span>
    <h2 id="r-drive" class="legal-section__h">DRIVE editions.</h2>
    <ul>
      <li>Deposits are refundable in full within <strong>24 hours of reservation</strong>.</li>
      <li>After 24 hours, deposits cover materials and production planning, and are non-refundable.</li>
      <li>If production QC fails, your deposit is refunded in full and you do not receive the piece.</li>
      <li>
        <strong>No returns on completed DRIVE pieces</strong> unless the piece is defective
        — these are made-to-order to your specification.
      </li>
      <li>Defects must be reported within 7 days of receipt with photographic evidence.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · TRADE</span>
    <h2 id="r-trade" class="legal-section__h">TRADE subscriptions.</h2>
    <p>
      TRADE subscriptions (Listed €9/mo, Pro €29/mo) can be cancelled at any time. Cancellation takes
      effect at the <strong>end of the current billing cycle</strong> — you remain listed until then.
    </p>
    <p>
      No refunds for partial months. Annual upfront subscribers can request a pro-rated refund within
      14 days of purchase under the Irish distance-selling rules.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">06 · DISPUTE PROCESS</span>
    <h2 id="r-disputes" class="legal-section__h">Dispute process.</h2>
    <ol>
      <li>
        <strong>Contact the seller first</strong> through Messages. Most issues resolve directly
        within a day or two.
      </li>
      <li>
        <strong>If no resolution within 48 hours</strong>, open a formal dispute. Include
        photographs of the item received, the original listing screenshots, tracking, and your messages.
      </li>
      <li>
        <strong>ÉIRVOX mediates within 5 business days</strong>. Both sides see our findings.
        Decisions under €500 are final; higher values may be escalated.
      </li>
      <li>
        <strong>If the buyer wins</strong>, the refund processes the same day.
      </li>
    </ol>
    <p>
      Urgent or high-value disputes: <a href="mailto:disputes@eirvox.ie">disputes@eirvox.ie</a> — senior
      response within 4 hours during office hours.
    </p>
  </section>
</LegalLayout>
