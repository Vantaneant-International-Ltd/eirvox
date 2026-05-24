<script lang="ts">
  import { onMount } from 'svelte'
  import Router from 'svelte-spa-router'
  import Home from './routes/Home.svelte'
  import Automotive from './routes/Automotive.svelte'
  import ProductDetail from './routes/ProductDetail.svelte'
  import About from './routes/About.svelte'
  import Enquire from './routes/Enquire.svelte'

  const routes = {
    '/': Home,
    '/automotive': Automotive,
    '/automotive/:slug': ProductDetail,
    '/about': About,
    '/enquire': Enquire,
  }

  onMount(() => {
    const scrollToTop = () => window.scrollTo(0, 0)
    window.addEventListener('hashchange', scrollToTop)
    return () => window.removeEventListener('hashchange', scrollToTop)
  })
</script>

<Router {routes} />
