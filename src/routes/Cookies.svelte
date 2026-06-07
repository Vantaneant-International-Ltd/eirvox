<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Cookie Policy',
    description: 'Essential cookies only. No behavioural advertising. No cross-site tracking.',
    path: '/cookies',
  }));

  const sections = [
    { num: '01', id: 'c-what',     label: 'What cookies are' },
    { num: '02', id: 'c-essential',label: 'Essential' },
    { num: '03', id: 'c-analytics',label: 'Analytics' },
    { num: '04', id: 'c-third',    label: 'Third-party' },
    { num: '05', id: 'c-manage',   label: 'Managing cookies' },
  ];
</script>

<LegalLayout
  title="Cookie Policy."
  {sections}
  intro="ÉIRVOX uses cookies only where they are necessary for the site to work, plus privacy-respecting analytics. We do not run behavioural advertising. We do not sell your data. Effective 1 June 2026. Pending final legal review before public launch."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · WHAT</span>
    <h2 id="c-what" class="legal-section__h">What cookies are.</h2>
    <p>
      Cookies are small text files stored on your device by websites you visit. They let the site remember
      simple preferences (like staying logged in) between page loads.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · ESSENTIAL</span>
    <h2 id="c-essential" class="legal-section__h">Essential cookies.</h2>
    <p>These are required for the site to function. You can't disable them and use the platform:</p>
    <ul>
      <li><strong>Session</strong> - keeps you signed in across pages.</li>
      <li><strong>Authentication</strong> - verifies your identity to the platform.</li>
      <li><strong>Security</strong> - prevents cross-site request forgery and similar attacks.</li>
      <li><strong>Consent preferences</strong> - remembers your cookie banner choice so it doesn't reappear.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · ANALYTICS</span>
    <h2 id="c-analytics" class="legal-section__h">Analytics.</h2>
    <p>
      We use privacy-respecting analytics to understand which pages are used and how the platform performs.
      Analytics data is aggregated and anonymous - we cannot link it back to you personally.
    </p>
    <p>You can opt out via the cookie banner at the bottom of the page or in your browser settings.</p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · THIRD-PARTY</span>
    <h2 id="c-third" class="legal-section__h">Third-party.</h2>
    <p>
      When you pay a reservation deposit, the payment provider (Revolut, Stripe) may set cookies on their
      payment pages. These are subject to their own privacy policies and we have no control over them.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · MANAGE</span>
    <h2 id="c-manage" class="legal-section__h">Managing cookies.</h2>
    <p>
      You can manage cookies through your browser settings - most browsers let you block all cookies,
      block third-party cookies, or delete cookies for a specific site. Note that disabling essential
      cookies will break the platform.
    </p>
    <p>
      <strong>ÉIRVOX does not use cookies for advertising or behavioural targeting.</strong>
      We don't build profiles, we don't share with ad networks, we don't follow you around the web.
    </p>
  </section>
</LegalLayout>
