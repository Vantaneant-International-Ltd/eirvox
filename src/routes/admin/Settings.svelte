<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getSiteSettings,
    updateSiteSetting,
    type SiteSettingsBundle,
  } from '../../lib/admin';
  import { siteFlags, updateSiteFlags, type SiteFlags } from '../../lib/flags';
  import { applySeo } from '../../lib/seo';
  import PayButton from '../../lib/PayButton.svelte';

  let loading = true;
  let settings: SiteSettingsBundle | null = null;
  let saving: 'cohort' | 'drive' | 'fees' | 'deposit' | 'flags' | null = null;
  let savedKey: string | null = null;
  let actionError = '';

  // Local copy of the flags store so the form can edit before save.
  let flagsDraft: SiteFlags = $siteFlags;
  const unsubFlags = siteFlags.subscribe(v => { flagsDraft = { ...v }; });

  onMount(async () => {
    applySeo({ title: 'Admin · Settings', description: 'Site-wide configuration.', path: '/admin/settings' });
    settings = await getSiteSettings();
    loading = false;
    return () => unsubFlags();
  });

  async function save(key: 'cohort' | 'drive' | 'fees' | 'deposit') {
    if (!settings) return;
    actionError = '';
    saving = key;
    const r = await updateSiteSetting(key, settings[key]);
    saving = null;
    if (!r.ok) { actionError = r.error ?? 'Save failed.'; return; }
    savedKey = key;
    setTimeout(() => { if (savedKey === key) savedKey = null; }, 1800);
  }

  async function saveFlags() {
    actionError = '';
    saving = 'flags';
    const r = await updateSiteFlags(flagsDraft);
    saving = null;
    if (!r.ok) { actionError = r.error ?? 'Save failed.'; return; }
    savedKey = 'flags';
    setTimeout(() => { if (savedKey === 'flags') savedKey = null; }, 1800);
  }

  // Revolut live-mode test charge — embedded PayButton renders a
  // native Revolut Pay button + a fallback link that opens the
  // popup with Apple Pay, Google Pay, card, and bank.
  let payTestKey = 0; // bump to force a fresh PayButton instance after a charge
</script>

<AdminLayout title="Site Settings">

  {#if loading || !settings}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>

  {:else}
    {#if actionError}
      <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
        <p class="adm-state__sub">{actionError}</p>
      </div>
    {/if}

    <!-- ─────────── Visibility flags ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Visibility</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">

        <!-- Coming soon toggle -->
        <div class="adm-field" style="display: flex; align-items: flex-start; gap: 16px; padding: 12px 0;">
          <input type="checkbox" id="flag-coming-soon" bind:checked={flagsDraft.coming_soon}
                 style="margin-top: 4px; transform: scale(1.2); accent-color: var(--evx-fox-orange);" />
          <label for="flag-coming-soon" style="cursor: pointer;">
            <strong style="display: block; font-size: 14px;">Coming soon mode</strong>
            <span class="adm-field__hint" style="display: block; margin-top: 4px;">
              Visitors see the coming-soon landing page with the email-capture form.
              Use this pre-launch; flip off when you go live.
            </span>
          </label>
        </div>

        <!-- Maintenance toggle -->
        <div class="adm-field" style="display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; border-top: 1px solid var(--evx-rule-light); margin-top: 8px;">
          <input type="checkbox" id="flag-maintenance" bind:checked={flagsDraft.maintenance}
                 style="margin-top: 4px; transform: scale(1.2); accent-color: var(--evx-fox-orange);" />
          <label for="flag-maintenance" style="cursor: pointer;">
            <strong style="display: block; font-size: 14px;">Maintenance mode</strong>
            <span class="adm-field__hint" style="display: block; margin-top: 4px;">
              Visitors see a maintenance page with your support email.
              Takes precedence over coming soon when both are on. Use for short outages.
            </span>
          </label>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Maintenance message</span>
          <textarea class="adm-field__input" rows="2" bind:value={flagsDraft.maintenance_message}
                    placeholder="e.g. We're rolling out an update. Back in 30 minutes."></textarea>
          <span class="adm-field__hint">Shown on the maintenance page. Plain text.</span>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Support email</span>
          <input type="email" class="adm-field__input" bind:value={flagsDraft.support_email}
                 placeholder="support@eirvox.ie" />
          <span class="adm-field__hint">Shown on the maintenance page. Becomes a mailto: link.</span>
        </div>

        <div class="adm-actions">
          <button class="adm-btn adm-btn--primary" on:click={saveFlags} disabled={saving === 'flags'}>
            {saving === 'flags' ? 'Saving…' : savedKey === 'flags' ? 'Saved ✓' : 'Save visibility'}
          </button>
        </div>

        <p class="adm-field__hint" style="margin-top: 12px;">
          Tip: append <code>#dev</code> to any URL to bypass both gates (session-scoped). Useful for admin work while a gate is on for the public.
        </p>
      </div>
    </section>

    <!-- ─────────── Payments (Revolut) ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Payments</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">
        <div class="adm-field">
          <strong style="display: block; font-size: 14px; margin-bottom: 6px;">Revolut Merchant API — live integration test</strong>
          <p class="adm-field__hint">
            The native Revolut Pay button below creates a real €1 order against your live
            Revolut Merchant API. Use "another way" to test Apple Pay / Google Pay / Card / Bank.
            Refund yourself from the Revolut Business app afterwards.
          </p>
        </div>

        <div style="margin-top: 16px;">
          {#key payTestKey}
            <PayButton
              amountEur={1}
              description="ÉIRVOX live integration test"
              metadata={{ purpose: 'admin-test' }}
              on:success={() => { console.info('[admin] €1 test charge succeeded'); }}
              on:error={(e) => { console.warn('[admin] €1 test charge error:', e.detail.message); }}
            />
          {/key}
          <button
            class="adm-btn adm-btn--ghost"
            style="margin-top: 12px; font-family: var(--evx-font-mono); font-size: 11px;"
            on:click={() => { payTestKey++; }}
          >
            Reset / create another test order
          </button>
        </div>
      </div>
    </section>

    <!-- ─────────── Cohort ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Seller cohort</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Number</span>
            <input type="number" class="adm-field__input" bind:value={settings.cohort.number} />
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Status</span>
            <select class="adm-field__select" bind:value={settings.cohort.status}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
        <div class="adm-field">
          <span class="adm-field__label">Closes on</span>
          <input type="date" class="adm-field__input" bind:value={settings.cohort.closes_at} />
        </div>
        <div class="adm-field">
          <span class="adm-field__label">Tagline (shown in nav)</span>
          <input class="adm-field__input" bind:value={settings.cohort.tagline} />
          <span class="adm-field__hint">e.g. "COHORT 03 · CLOSES 14 JUN"</span>
        </div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--primary" on:click={() => save('cohort')} disabled={saving === 'cohort'}>
            {saving === 'cohort' ? 'Saving…' : savedKey === 'cohort' ? 'Saved ✓' : 'Save cohort'}
          </button>
        </div>
      </div>
    </section>

    <!-- ─────────── DRIVE ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Current DRIVE issue</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Issue number</span>
            <input type="number" class="adm-field__input" bind:value={settings.drive.issue_number} />
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Issue title</span>
            <input class="adm-field__input" bind:value={settings.drive.issue_title} />
          </div>
        </div>
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Total allocation</span>
            <input type="number" class="adm-field__input" bind:value={settings.drive.total_allocation} />
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Remaining</span>
            <input type="number" class="adm-field__input" bind:value={settings.drive.remaining} />
          </div>
        </div>
        <div class="adm-field">
          <span class="adm-field__label">Price (€)</span>
          <input type="number" class="adm-field__input" bind:value={settings.drive.price_eur} />
        </div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--primary" on:click={() => save('drive')} disabled={saving === 'drive'}>
            {saving === 'drive' ? 'Saving…' : savedKey === 'drive' ? 'Saved ✓' : 'Save DRIVE'}
          </button>
        </div>
      </div>
    </section>

    <!-- ─────────── Fees ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Commissions &amp; fees</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Verified seller commission (%)</span>
            <input type="number" class="adm-field__input" bind:value={settings.fees.verified_commission_pct} step="0.5" />
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Atelier commission (%)</span>
            <input type="number" class="adm-field__input" bind:value={settings.fees.atelier_commission_pct} step="0.5" />
          </div>
        </div>
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">House commission (%)</span>
            <input type="number" class="adm-field__input" bind:value={settings.fees.house_commission_pct} step="0.5" />
          </div>
          <div class="adm-field"><!-- spacer --></div>
        </div>
        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">TRADE Listed monthly (€)</span>
            <input type="number" class="adm-field__input" bind:value={settings.fees.trade_listed_monthly_eur} />
          </div>
          <div class="adm-field">
            <span class="adm-field__label">TRADE Pro monthly (€)</span>
            <input type="number" class="adm-field__input" bind:value={settings.fees.trade_pro_monthly_eur} />
          </div>
        </div>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--primary" on:click={() => save('fees')} disabled={saving === 'fees'}>
            {saving === 'fees' ? 'Saving…' : savedKey === 'fees' ? 'Saved ✓' : 'Save fees'}
          </button>
        </div>
      </div>
    </section>

    <!-- ─────────── Deposit ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Reservation deposit</h2>
      <div style="background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 24px;">
        <div class="adm-field">
          <span class="adm-field__label">Amount (€)</span>
          <input type="number" class="adm-field__input" bind:value={settings.deposit.amount_eur} />
          <span class="adm-field__hint">The fixed deposit charged on any reservation. Currently €49.</span>
        </div>
        <div class="adm-field adm-field--checkbox">
          <input id="ref-check" type="checkbox" class="adm-checkbox" bind:checked={settings.deposit.refundable} />
          <label for="ref-check" class="adm-field__label" style="margin: 0;">Refundable</label>
        </div>
        <p class="adm-muted" style="font-size: 12px; line-height: 1.6;">
          Reminder: deposit policy is set in the legal copy. The amount here drives the checkout flow; refundability flag is for display only.
        </p>
        <div class="adm-actions">
          <button class="adm-btn adm-btn--primary" on:click={() => save('deposit')} disabled={saving === 'deposit'}>
            {saving === 'deposit' ? 'Saving…' : savedKey === 'deposit' ? 'Saved ✓' : 'Save deposit'}
          </button>
        </div>
      </div>
    </section>
  {/if}

</AdminLayout>
