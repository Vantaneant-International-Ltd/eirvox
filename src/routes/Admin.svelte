<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { auth } from '../lib/auth';

  onMount(() => applySeo({
    title: 'Admin',
    description: 'ÉIRVOX admin console.',
    path: '/admin',
  }));

  $: user = $auth.user;
  $: profile = $auth.profile;
</script>

<Nav />

<main id="main-content" class="admin-page">
  <div class="page-container">

    <header class="admin-header">
      <span class="evx-caption admin-header__pre">ADMIN · ÉIRVOX</span>
      <h1 class="admin-title">Admin console.</h1>
      <p class="admin-sub">
        Welcome back, <strong>{profile?.full_name ?? user?.email ?? 'admin'}</strong>.
        The full admin surface (cohort review, dispute mediation, authentication queue) is built in the next phase.
      </p>
    </header>

    <section class="admin-grid">
      {#each [
        { num: '01', title: 'Cohort review',      desc: 'Review pending seller applications, approve or decline.',          stat: 'Coming in v0.5' },
        { num: '02', title: 'Dispute mediation',  desc: 'Open disputes between buyers and sellers, review evidence.',       stat: 'Coming in v0.5' },
        { num: '03', title: 'Authentication queue',desc: '11-point checks for high-value items routed through Dublin.',     stat: 'Coming in v0.5' },
        { num: '04', title: 'DRIVE issues',       desc: 'Manage open and upcoming DRIVE issues, allocation stock.',        stat: 'Coming in v0.5' },
        { num: '05', title: 'TRADE applications', desc: 'Vet tradesperson applications and credentials.',                   stat: 'Coming in v0.5' },
        { num: '06', title: 'Reports & abuse',    desc: 'Listing flags, profile reports, acceptable-use enforcement.',     stat: 'Coming in v0.5' },
      ] as block}
        <div class="admin-block">
          <span class="evx-label admin-block__num">{block.num}</span>
          <h3 class="admin-block__title">{block.title}</h3>
          <p class="admin-block__desc">{block.desc}</p>
          <span class="evx-caption admin-block__stat">{block.stat}</span>
        </div>
      {/each}
    </section>

    <div class="admin-footer">
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/account')}>
        Your account
      </button>
      <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>
        Back to marketplace →
      </button>
    </div>

  </div>
</main>

<Footer />

<style>
  .admin-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .admin-header {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    max-width: 720px;
  }
  .admin-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .admin-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-md);
  }
  .admin-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); }
  .admin-sub strong { color: var(--evx-warm-black); font-weight: 500; }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-2xl);
  }

  .admin-block {
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }
  .admin-block__num { color: var(--evx-fox-orange); }
  .admin-block__title {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .admin-block__desc {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    flex: 1;
  }
  .admin-block__stat {
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }

  .admin-footer {
    display: flex;
    gap: var(--evx-space-md);
    flex-wrap: wrap;
    padding-top: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-light);
  }

  @media (max-width: 1023px) {
    .admin-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 767px) {
    .admin-grid { grid-template-columns: 1fr; }
  }
</style>
