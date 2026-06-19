<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Terms & Conditions',
    description: 'Terms and conditions for ÉIRVOX - the marketplace, DRIVE editions, and TRADE directory.',
    path: '/terms',
  }));

  const sections = [
    { num: '01', id: 's-intro',         label: 'Introduction and acceptance' },
    { num: '02', id: 's-definitions',   label: 'Definitions' },
    { num: '03', id: 's-account',       label: 'Account registration' },
    { num: '04', id: 's-marketplace',   label: 'Marketplace rules' },
    { num: '05', id: 's-seller',        label: 'Seller obligations' },
    { num: '06', id: 's-buyer',         label: 'Buyer obligations' },
    { num: '07', id: 's-deposits',      label: 'Reservation deposits' },
    { num: '08', id: 's-drive',         label: 'DRIVE editions' },
    { num: '09', id: 's-trade',         label: 'TRADE directory' },
    { num: '10', id: 's-fees',          label: 'Fees and commissions' },
    { num: '11', id: 's-disputes',      label: 'Disputes' },
    { num: '12', id: 's-prohibited',    label: 'Prohibited items' },
    { num: '13', id: 's-ip',            label: 'Intellectual property' },
    { num: '14', id: 's-liability',     label: 'Limitation of liability' },
    { num: '15', id: 's-termination',   label: 'Termination' },
    { num: '16', id: 's-law',           label: 'Governing law' },
    { num: '17', id: 's-changes',       label: 'Changes' },
    { num: '18', id: 's-contact',       label: 'Contact' },
  ];
</script>

<LegalLayout
  title="Terms & Conditions."
  {sections}
  intro="These terms govern your use of the ÉIRVOX platform. The marketplace, DRIVE editions, and TRADE directory. Written in plain English. We would rather you read them than skip past. Effective 1 June 2026. Pending final legal review before public launch."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · INTRODUCTION</span>
    <h2 id="s-intro" class="legal-section__h">Introduction and acceptance.</h2>
    <p>
      ÉIRVOX is operated by <strong>EIRVOX LIMITED</strong>. A company registered in Ireland, CRO 806648,
      registered office in Dublin. Part of the Vantaneant International Ltd group.
      Referred to here as "ÉIRVOX", "we", "us", "our".
    </p>
    <p>
      By using the platform you accept these terms and our <a href="#/privacy">Privacy Policy</a>.
      That includes browsing, creating an account, applying as a seller or tradesperson, or placing a reservation deposit.
      If you do not accept, stop using the platform.
    </p>
    <p>You confirm you are at least 18 years old and legally able to enter binding agreements.</p>
    <p>
      <strong>ÉIRVOX is a venue, not a broker.</strong> Marketplace listings are published by sellers.
      Payments go direct from buyer to the seller's payment account. ÉIRVOX does not hold funds for marketplace transactions.
      DRIVE editions are the exception. On DRIVE, ÉIRVOX is the seller.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · DEFINITIONS</span>
    <h2 id="s-definitions" class="legal-section__h">Definitions.</h2>
    <ul>
      <li><strong>Platform.</strong> The website at eirvox.ie and any associated services.</li>
      <li><strong>Seller.</strong> An approved person or business listing items for sale.</li>
      <li><strong>Buyer.</strong> Anyone reserving or purchasing items.</li>
      <li><strong>Listing.</strong> A published item offered for sale.</li>
      <li><strong>Reservation.</strong> An expression of intent to purchase, secured by a deposit paid via Revolut.</li>
      <li><strong>Deposit.</strong> An amount set by the seller on a per-listing basis, paid to the seller's Revolut account to hold an item. Refund terms set by the seller, subject to Irish consumer law.</li>
      <li><strong>DRIVE.</strong> Limited-run, made-to-order editions published by ÉIRVOX.</li>
      <li><strong>TRADE.</strong> A verified directory of independent tradespeople.</li>
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
      between you and another user - the contract for sale is directly between Buyer and Seller,
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
      <li>Application and cohort review are required before listing. ÉIRVOX may, at its discretion, ask a seller for follow-up information during admission or re-review.</li>
      <li>Descriptions must be accurate. Material defects must be disclosed in plain language.</li>
      <li>Communicate with buyers through ÉIRVOX in-app messaging. Direct contact details should not be published in listings.</li>
      <li>Respond to buyers in a timely manner. We recommend within 48 hours.</li>
      <li>Ship within agreed timeframes. Document shipping with tracking.</li>
      <li>Comply with applicable laws. Irish consumer law, distance selling, returns where required.</li>
      <li>Handle refunds directly through your own Revolut Business or equivalent account. ÉIRVOX does not hold buyer funds or process refunds on your behalf.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">06 · BUYERS</span>
    <h2 id="s-buyer" class="legal-section__h">Buyer obligations.</h2>
    <ul>
      <li>Provide accurate contact and delivery information.</li>
      <li>Honour reservations in good faith. Do not place deposits without intent to proceed.</li>
      <li>Inspect items on receipt and report issues within 7 days of confirmed delivery.</li>
      <li>Settle agreed balances within the timeframe agreed with the seller.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">07 · DEPOSITS</span>
    <h2 id="s-deposits" class="legal-section__h">Reservation deposits.</h2>
    <p>
      Where a listing offers a reservation deposit, payment is taken at checkout through Revolut.
      Card, Apple Pay, Google Pay, or instant bank transfer. The deposit amount is set by the seller
      on a per-listing basis and shown before you pay.
    </p>
    <p>
      <strong>Funds go directly to the seller.</strong> The merchant of record on your card statement
      is the seller's Revolut Business entity, not EIRVOX LIMITED. We are the venue. We never hold
      buyer money for marketplace transactions.
    </p>
    <p>
      <strong>Refunds are handled by the seller</strong> through their Revolut Business dashboard.
      Sellers are required by Irish consumer law to honour their stated refund window. Raise refund
      disputes with the seller first. If unresolved, request a chargeback through your card issuer or Revolut.
      ÉIRVOX cannot process refunds on a seller's behalf.
    </p>
    <p>
      The deposit is not a partial payment of the item price unless the seller's listing explicitly says so.
      Check the listing terms before paying.
    </p>
    <p>
      DRIVE editions are the exception. ÉIRVOX is the seller on DRIVE, so DRIVE deposit rules and refunds
      are administered by us. See section 08 and the <a href="#/refund-policy">Refund Policy</a>.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">08 · DRIVE</span>
    <h2 id="s-drive" class="legal-section__h">DRIVE editions.</h2>
    <p>
      DRIVE pieces are limited-run editions published by ÉIRVOX. Each issue specifies an edition size
      and one specification. No variants. No restocks.
    </p>
    <p>
      Stock-state determines the deposit model.
    </p>
    <ul>
      <li><strong>In stock.</strong> Full payment at checkout for delivery. Or full payment on collection.</li>
      <li><strong>Incoming.</strong> A deposit at checkout secures your allocation. The balance is paid on collection.</li>
      <li>Refund terms for DRIVE are set out in the <a href="#/refund-policy">Refund Policy</a>.</li>
      <li>Once production or shipping has begun on your piece, the order cannot be cancelled.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">09 · TRADE</span>
    <h2 id="s-trade" class="legal-section__h">TRADE directory.</h2>
    <p>
      TRADE is a paid directory of verified independent tradespeople. Listings are subject to a monthly fee.
      Listed €9 per month. Pro €29 per month. No per-lead charges. No commission on work won.
    </p>
    <ul>
      <li><strong>ÉIRVOX is a directory, not an employer, agent, or contractor.</strong> Listed tradespeople are independent.</li>
      <li>We verify identity and credentials at admission. We do not guarantee workmanship, completion, or quality of work.</li>
      <li>Any contract for work is directly between the client and the tradesperson.</li>
      <li>Disputes about workmanship, payment, or scope are not ÉIRVOX's contractual liability. We may, at our discretion, mediate.</li>
      <li>Tradespeople are responsible for their own insurance, tax, registration, and compliance.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">10 · FEES</span>
    <h2 id="s-fees" class="legal-section__h">Fees and commissions.</h2>
    <ul>
      <li><strong>Verified seller.</strong> Free. Commission applies on completed sales at the rate shown on /sell.</li>
      <li><strong>Atelier seller.</strong> Monthly subscription. Reduced commission. Rate shown on /sell.</li>
      <li><strong>House seller.</strong> By invitation. Commercial terms agreed individually.</li>
      <li><strong>TRADE Listed.</strong> €9 per month.</li>
      <li><strong>TRADE Pro.</strong> €29 per month.</li>
    </ul>
    <p>All fees are subject to change with at least 30 days' notice by email.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">11 · DISPUTES</span>
    <h2 id="s-disputes" class="legal-section__h">Disputes.</h2>
    <p>
      Marketplace transactions are between buyer and seller. The contract for sale sits between those two parties.
      Raise disputes with the seller directly in the first instance. If unresolved, you may request a chargeback
      through your card issuer or Revolut, and you retain your statutory rights under Irish consumer law.
    </p>
    <p>
      For ÉIRVOX-owned listings, including DRIVE, refund stance is the discretionary policy set out at
      <a href="#/refund-policy">/refund-policy</a>. We respond to refund requests within 5 business days.
    </p>
    <p>
      ÉIRVOX may, at its discretion, review evidence on disputes that originated through in-app messaging,
      to inform ongoing seller admission. We do not arbitrate or mediate marketplace contracts.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">12 · PROHIBITED</span>
    <h2 id="s-prohibited" class="legal-section__h">Prohibited items.</h2>
    <p>You must not list, sell, or attempt to sell:</p>
    <ul>
      <li>Counterfeit, replica, or knowingly misrepresented items.</li>
      <li>Stolen property, or items without clear provenance for high-value categories.</li>
      <li>Weapons, controlled substances, or items requiring licence to possess.</li>
      <li>Anything illegal under the laws of the Republic of Ireland.</li>
      <li>Living animals, human remains, or biohazardous materials.</li>
    </ul>
    <p>Violations result in immediate listing removal, account suspension, and where appropriate a report to authorities.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">13 · IP</span>
    <h2 id="s-ip" class="legal-section__h">Intellectual property.</h2>
    <p>
      Content uploaded by sellers (photos, descriptions) remains their property. By uploading, you grant
      ÉIRVOX a non-exclusive, royalty-free licence to display, reproduce, and promote that content in
      connection with the platform.
    </p>
    <p>
      The ÉIRVOX brand, the DRIVE and TRADE imprints, and the platform design are the property of
      EIRVOX LIMITED. You may not use them without written permission.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">14 · LIABILITY</span>
    <h2 id="s-liability" class="legal-section__h">Limitation of liability.</h2>
    <p>
      ÉIRVOX provides a marketplace platform. To the maximum extent permitted by law, our total liability
      for any claim relating to the platform is <strong>limited to the amount you paid directly to ÉIRVOX
      in connection with that claim</strong>. Marketplace payments are made to sellers, not to ÉIRVOX.
    </p>
    <p>
      We are not liable for disputes between buyer and seller beyond our discretionary review process.
      We are not liable for the workmanship of TRADE tradespeople. We are not liable for indirect,
      consequential, or special damages.
    </p>
    <p>Nothing in these terms excludes liability that cannot be excluded under Irish consumer law.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">15 · TERMINATION</span>
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
    <span class="legal-section__num">16 · LAW</span>
    <h2 id="s-law" class="legal-section__h">Governing law.</h2>
    <p>
      These terms are governed by the laws of the <strong>Republic of Ireland</strong>. Any dispute
      relating to these terms or the platform is subject to the exclusive jurisdiction of the
      <strong>courts of Dublin</strong>.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">17 · CHANGES</span>
    <h2 id="s-changes" class="legal-section__h">Changes.</h2>
    <p>
      We may update these terms from time to time. Material changes will be notified by email at least
      <strong>30 days before they take effect</strong>. Continued use after that date constitutes acceptance.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">18 · CONTACT</span>
    <h2 id="s-contact" class="legal-section__h">Contact.</h2>
    <p>
      <strong>EIRVOX LIMITED</strong> · Dublin, Ireland · CRO 806648
    </p>
    <p>
      Trading as ÉIRVOX. Part of Vantaneant International Ltd.
    </p>
    <p>
      Email: <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>
    </p>
  </section>
</LegalLayout>
