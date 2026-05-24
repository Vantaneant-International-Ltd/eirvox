<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'

  export let params: { slug: string } = { slug: '' }
</script>

<Layout
  footerVariant="compact"
  breadcrumb={['Marketplace', 'Automotive', params.slug]}
>
  <div class="page-container" style="padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-3xl);">
    <h1>Product Detail — {params.slug}</h1>
  </div>
</Layout>
