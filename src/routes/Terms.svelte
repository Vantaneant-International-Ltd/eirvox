<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Terms & Conditions',
    description: 'Terms and conditions for ÉIRVOX — the marketplace, DRIVE editions, and TRADE directory.',
    path: '/terms',
  }));

  const sections = [
    { num: '01', id: 's-intro',         label: 'Introduction & acceptance' },
    { num: '02', id: 's-definitions',   label: 'Definitions' },
    { num: '03', id: 's-account',       label: 'Account registration' },
    { num: '04', id: 's-marketplace',   label: 'Marketplace rules' },
    { num: '05', id: 's-seller',        label: 'Seller obligations' },
    { num: '06', id: 's-buyer',         label: 'Buyer obligations' },
    { num: '07', id: 's-deposits',      label: 'Reservation deposits' },
    { num: '08', id: 's-drive',         label: 'DRIVE editions' },
    { num: '09', id: 's-trade',         label: 'TRADE directory' },
    { num: '10', id: 's-fees',          label: 'Fees & commissions' },
    { num: '11', id: 's-auth',          label: 'Authentication' },
    { num: '12', id: 's-disputes',      label: 'Disputes & resolution' },
    { num: '13', id: 's-prohibited',    label: 'Prohibited items' },
    { num: '14', id: 's-ip',            label: 'Intellectual property' },
    { num: '15', id: 's-liability',     label: 'Limitation of liability' },
    { num: '16', id: 's-termination',   label: 'Termination' },
    { num: '17', id: 's-law',           label: 'Governing law' },
    { num: '18', id: 's-changes',       label: 'Changes' },
    { num: '19', id: 's-contact',       label: 'Contact' },
  ];
</script>

<LegalLayout
  title="Terms & Conditions."
  {sections}
  intro="These terms govern your use of the ÉIRVOX platform — the marketplace, DRIVE editions, and TRADE directory. They're written in plain English, with the legal precision required, and we'd rather you read them than skip past."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · INTRODUCTION</span>
    <h2 id="s-intro" class="legal-section__h">Introduction &amp; acceptance.</h2>
    <p>
      ÉIRVOX is operated by <strong>ÉIRVOX Systems Ltd</strong>, a company registered in Ireland (CRO 712304),
      with its registered office in Dublin. We are part of the Vantaneant International Ltd group.
      Referenced throughout as "ÉIRVOX", "we", "us", "our".
    </p>
    <p>
      By accessing or using the platform — browsing listings, creating an account, applying as a seller or tradesperson,
      placing a reservation deposit, or otherwise — you accept these terms and our <a href="#/privacy">Privacy Policy</a>.
      If you don't accept, stop using the platform.
    </p>
    <p>You confirm you are at least 18 years old and legally able to enter binding agreements.</p>
    <p>
      <strong>ÉIRVOX is a venue, not a broker.</strong> For marketplace listings, ÉIRVOX publishes the listing
      and connects you with the seller. Payments flow directly from buyer to seller's payment account; ÉIRVOX
      does not hold funds, mediate communication, or process refunds for marketplace transactions.
      DRIVE editions are the exception — there, ÉIRVOX is the seller.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · DEFINITIONS</span>
    <h2 id="s-definitions" class="legal-section__h">Definitions.</h2>
    <ul>
      <li><strong>Platform</strong> — the website at eirvox.ie and any associated services.</li>
      <li><strong>Seller</strong> — an approved person or business listing items for sale.</li>
      <li><strong>Buyer</strong> — anyone reserving or purchasing items.</li>
      <li><strong>Listing</strong> — a published item offered for sale.</li>
      <li><strong>Reservation</strong> — an expression of intent to purchase, secured by a deposit paid via Revolut.</li>
      <!-- TODO TRUST&COMPLIANCE: "default €49" is stale. Marketplace
           deposits no longer carry a platform default; deposit_amount
           is set per listing by the seller. ÉIRVOX-owned listings set
           it via the admin listing form. Rewrite in the Trust &
           Compliance pass. -->
      <li><strong>Deposit</strong> — amount (default €49 for marketplace items) paid to the seller's Revolut account to hold an item. Refund terms set by the seller and Irish consumer law.</li>
      <li><strong>DRIVE</strong> — limited-run, made-to-order editions published by ÉIRVOX.</li>
      <li><strong>TRADE</strong> — verified directory of independent tradespeople.</li>
      <li><strong>Authentication</strong> — physical inspection of high-value items at the ÉIRVOX Dublin centre.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · ACCOUNT</span>
    <h2 id="s-account" class="legal-section__h">Account registration.</h2>
    <p>
      You must be at least 18 to register. Information you provide must be accurate and kept up to date.
      One account per person; multiple accounts are grounds for suspension.
    </p>
    <p>
      You are responsible for your account credentials and any activity on your account.
      Notify us immediately at <a href="mailto:support@eirvox.ie">support@eirvox.ie</a> if you suspect
      unauthorised access.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · MARKETPLACE</span>
    <h2 id="s-marketplace" class="legal-section__h">Marketplace rules.</h2>
    <p>
      ÉIRVOX connects buyers and sellers. <strong>We are not a party to the underlying sale of goods</strong>
      between you and another user — the contract for sale is directly between Buyer and Seller,
      and we facilitate that transaction subject to these terms.
    </p>
    <p>
      Only genuine items may be listed. No counterfeit, replica, stolen, or otherwise prohibited goods.
      All listings must be honest, accurate, and complete to the best of the seller's knowledge.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · SELLERS</span>
    <h2 id="s-seller" class="legal-section__h">Seller obligations.</h2>
    <ul>
      <li>Application and verification (ID + phone + cohort review) are required before listing.</li>
      <li>Descriptions must be accurate. Material defects must be disclosed in plain language.</li>
      <li>Publish accurate contact details (email, phone) on the seller profile so buyers can reach you directly. ÉIRVOX does not relay messages.</li>
      <li>Respond to buyers in a timely manner. We recommend within 48 hours.</li>
      <li>Ship within agreed timeframes. Document shipping with tracking.</li>
      <li>Comply with all applicable laws — Irish consumer law, distance selling, returns where required.</li>
      <li>Handle refunds directly through your own Revolut Business (or equivalent) account. ÉIRVOX does not hold buyer funds or process refunds on your behalf.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">06 · BUYERS</span>
    <h2 id="s-buyer" class="legal-section__h">Buyer obligations.</h2>
    <ul>
      <li>Provide accurate contact and delivery information.</li>
      <li>Honour reservations in good faith — do not place deposits without intent to proceed.</li>
      <li>Inspect items on receipt and report issues within 7 days of confirmed delivery.</li>
      <li>Settle agreed balances within the timeframe agreed with the seller.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">07 · DEPOSITS</span>
    <h2 id="s-deposits" class="legal-section__h">Reservation deposits.</h2>
    <!-- TODO TRUST&COMPLIANCE: "default €49 for marketplace items" is
         stale. Deposit amounts are now per listing, set by the seller
         (or admin for ÉIRVOX-owned). Also rewrite to reflect the
         stock-state matrix: deposit is only offered on collection
         fulfilment; delivery is always full price up front. -->
    <p>
      Where a listing offers a reservation deposit, payment is taken at checkout via
      <strong>Revolut Merchant API</strong> (Revolut Pay, Apple Pay, Google Pay, card, or instant bank transfer).
      The amount is set by the seller and shown on the listing before you pay; the default is
      <strong>€49</strong> for marketplace items.
    </p>
    <p>
      <strong>Funds go directly to the seller.</strong> ÉIRVOX is a venue: we publish the listing and
      take you to Revolut's hosted checkout, but we never hold buyer money for marketplace transactions.
      The Merchant of Record on your card statement is the seller's Revolut Business entity, not ÉIRVOX Systems Ltd.
    </p>
    <p>
      <strong>Refunds are handled by the seller</strong> via their Revolut Business dashboard. Sellers are
      required by Irish consumer law (and our Acceptable Use Policy) to honour their stated refund window.
      Disputes about refunds should be raised with the seller first; if unresolved, you can request a
      chargeback through your card issuer or Revolut. ÉIRVOX cannot process refunds on a seller's behalf.
    </p>
    <p>
      The deposit is not a partial payment of the item price unless the seller's listing explicitly says so.
      Check the listing terms before paying.
    </p>
    <p>
      DRIVE editions (section 08) are different — ÉIRVOX is the seller, so DRIVE deposit rules and refunds
      are administered by us.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">08 · DRIVE</span>
    <h2 id="s-drive" class="legal-section__h">DRIVE editions.</h2>
    <p>
      DRIVE pieces are limited-run, made-to-order objects published by ÉIRVOX. Each issue specifies an edition
      size and one specification — there are no variants, no restocks.
    </p>
    <!-- TODO TRUST&COMPLIANCE: this DRIVE-deposit list is stale.
         DRIVE items are now stock-state-driven listings: in_stock
         items take full payment on collection or delivery; incoming
         (out-of-stock) items take a deposit on collection only (with
         balance paid in person on collection). No "24-hour refund
         window" rule applies; refund stance is the discretionary
         policy at #/refund-policy. Rewrite in the Trust & Compliance
         pass. -->
    <ul>
      <li>Your €49 deposit holds your allocation in the edition.</li>
      <li>Deposits are refundable in full within 24 hours of reservation, or if production QC fails.</li>
      <li>After 24 hours, the deposit covers materials and production planning and is non-refundable.</li>
      <li>Expect 6-8 weeks from confirmation to dispatch.</li>
      <li>Once production has begun on your piece, the order cannot be cancelled.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">09 · TRADE</span>
    <h2 id="s-trade" class="legal-section__h">TRADE directory.</h2>
    <p>
      TRADE is a paid directory of verified independent tradespeople. Listings are subject to a monthly fee
      (Listed €9/mo, Pro €29/mo) with no per-lead charges and no commission on work won.
    </p>
    <ul>
      <li><strong>ÉIRVOX is a directory, not an employer, agent, or contractor.</strong> Listed tradespeople are independent.</li>
      <li>We verify identity and credentials at admission. We do not guarantee workmanship, completion, or quality of work.</li>
      <li>Any contract for work is directly between the client and the tradesperson.</li>
      <li>Disputes about workmanship, payment, or scope are not ÉIRVOX's contractual liability, though we may mediate.</li>
      <li>Tradespeople are responsible for their own insurance, tax, registration, and compliance.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">10 · FEES</span>
    <h2 id="s-fees" class="legal-section__h">Fees &amp; commissions.</h2>
    <ul>
      <li><strong>Verified seller:</strong> free + 7% commission on completed sales.</li>
      <li><strong>Atelier seller:</strong> €19/month + 5% commission.</li>
      <li><strong>House seller:</strong> by invitation, commercial terms agreed individually.</li>
      <li><strong>Authentication:</strong> €25 per item, refunded if authentication fails.</li>
      <li><strong>TRADE Listed:</strong> €9/month.</li>
      <li><strong>TRADE Pro:</strong> €29/month.</li>
    </ul>
    <p>All fees are subject to change with at least 30 days' notice by email.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">11 · AUTHENTICATION</span>
    <h2 id="s-auth" class="legal-section__h">Authentication.</h2>
    <p>
      Items above the value threshold for their category (watches over €500, sneakers over €200,
      designer items, cameras and lenses, certain audio) require physical inspection at the
      ÉIRVOX Dublin authentication centre.
    </p>
    <p>
      We follow an 11-point check covering serials, materials, build, function, provenance, and presentation.
      If an item fails, the listing is removed, the buyer is refunded in full, and the seller may be suspended
      pending investigation.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">12 · DISPUTES</span>
    <h2 id="s-disputes" class="legal-section__h">Disputes &amp; resolution.</h2>
    <p>
      If a dispute arises between Buyer and Seller, either party may open a case in Messages within
      <strong>7 days of confirmed delivery</strong>. Both parties must submit evidence — photographs,
      shipping records, original listing screenshots, correspondence.
    </p>
    <p>
      ÉIRVOX reviews disputes within <strong>5 business days</strong> for items under €500.
      Higher-value disputes may take up to 14 days for complex authentication or forensic checks.
      Our decisions are final under €500; higher-value disputes may be escalated to formal mediation.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">13 · PROHIBITED</span>
    <h2 id="s-prohibited" class="legal-section__h">Prohibited items.</h2>
    <p>You must not list, sell, or attempt to sell:</p>
    <ul>
      <li>Counterfeit, replica, or knowingly misrepresented items.</li>
      <li>Stolen property, or items without a clear provenance for high-value categories.</li>
      <li>Weapons, controlled substances, or items requiring licence to possess.</li>
      <li>Anything illegal under the laws of the Republic of Ireland.</li>
      <li>Living animals, human remains, or biohazardous materials.</li>
    </ul>
    <p>Violations result in immediate listing removal, account suspension, and where appropriate, report to authorities.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">14 · IP</span>
    <h2 id="s-ip" class="legal-section__h">Intellectual property.</h2>
    <p>
      Content uploaded by sellers (photos, descriptions) remains their property. By uploading, you grant
      ÉIRVOX a non-exclusive, royalty-free licence to display, reproduce, and promote that content in
      connection with the platform.
    </p>
    <p>
      The ÉIRVOX brand, the DRIVE and TRADE imprints, and the platform design are the property of
      ÉIRVOX Systems Ltd. You may not use them without written permission.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">15 · LIABILITY</span>
    <h2 id="s-liability" class="legal-section__h">Limitation of liability.</h2>
    <p>
      ÉIRVOX provides a marketplace platform. To the maximum extent permitted by law, our total liability
      for any claim relating to the platform is <strong>limited to the amount of any deposit you paid
      to us in connection with that claim</strong>.
    </p>
    <p>
      We are not liable for disputes between Buyer and Seller beyond our mediation process, for the
      workmanship of TRADE tradespeople, or for indirect, consequential, or special damages.
    </p>
    <p>Nothing in these terms excludes liability that cannot be excluded under Irish consumer law.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">16 · TERMINATION</span>
    <h2 id="s-termination" class="legal-section__h">Termination.</h2>
    <p>
      We may suspend or terminate any account that violates these terms, abuses the platform,
      or fails to honour reservations or shipping obligations.
    </p>
    <p>
      Sellers may close their account with 30 days' notice. Outstanding commission and any obligations
      to in-flight buyers remain payable. TRADE subscriptions cancel at the end of the current billing cycle.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">17 · LAW</span>
    <h2 id="s-law" class="legal-section__h">Governing law.</h2>
    <p>
      These terms are governed by the laws of the <strong>Republic of Ireland</strong>. Any dispute
      relating to these terms or the platform is subject to the exclusive jurisdiction of the
      <strong>courts of Dublin</strong>.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">18 · CHANGES</span>
    <h2 id="s-changes" class="legal-section__h">Changes.</h2>
    <p>
      We may update these terms from time to time. Material changes will be notified by email at least
      <strong>30 days before they take effect</strong>. Continued use after that date constitutes acceptance.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">19 · CONTACT</span>
    <h2 id="s-contact" class="legal-section__h">Contact.</h2>
    <p>
      <strong>ÉIRVOX Systems Ltd</strong> · Dublin, Ireland · CRO 712304 · VAT IE 3987654 N
    </p>
    <p>
      Trading as ÉIRVOX. Part of Vantaneant International Ltd.
    </p>
    <p>
      Email: <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>
    </p>
  </section>
</LegalLayout>
