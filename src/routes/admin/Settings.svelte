<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getSiteSettings,
    updateSiteSetting,
    type SiteSettingsBundle,
  } from '../../lib/admin';
  import { applySeo } from '../../lib/seo';

  let loading = true;
  let settings: SiteSettingsBundle | null = null;
  let saving: 'cohort' | 'drive' | 'fees' | 'deposit' | null = null;
  let savedKey: string | null = null;
  let actionError = '';

  onMount(async () => {
    applySeo({ title: 'Admin · Settings', description: 'Site-wide configuration.', path: '/admin/settings' });
    settings = await getSiteSettings();
    loading = false;
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
