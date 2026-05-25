<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
</script>

<Layout footerVariant="compact">
  <div class="page-container not-found">
    <p class="headline">The room you're looking for<br />hasn't been built yet.</p>
    <a class="back-link" href="/#/">Back to the house →</a>
  </div>
</Layout>

<style>
  .not-found {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .headline {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .back-link {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    border-bottom: 1px solid var(--evx-warm-black);
    padding-bottom: 2px;
    display: inline;
  }

  @media (max-width: 767px) {
    .headline {
      font-size: 32px;
    }
  }
</style>
