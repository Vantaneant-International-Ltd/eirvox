<script lang="ts">
  import Nav from './Nav.svelte'
  import Footer from './Footer.svelte'

  export let footerVariant: 'full' | 'compact' = 'full'
  export let breadcrumb: string[] = []
</script>

<div class="layout">
  <Nav {breadcrumb} />
  <main class="layout-main">
    <slot />
  </main>
  <Footer variant={footerVariant} />
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .layout-main {
    flex: 1;
  }
</style>
