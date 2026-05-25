<script lang="ts">
  import { onMount } from 'svelte'
  import Router from 'svelte-spa-router'
  import Home from './routes/Home.svelte'
  import Automotive from './routes/Automotive.svelte'
  import ProductDetail from './routes/ProductDetail.svelte'
  import About from './routes/About.svelte'
  import Trust from './routes/Trust.svelte'
  import Sell from './routes/Sell.svelte'
  import Login from './routes/Login.svelte'
  import Register from './routes/Register.svelte'
  import Enquire from './routes/Enquire.svelte'

  const routes = {
    '/': Home,
    '/automotive': Automotive,
    '/automotive/:slug': ProductDetail,
    '/about': About,
    '/trust': Trust,
    '/sell': Sell,
    '/login': Login,
    '/register': Register,
    '/enquire': Enquire,
  }

  onMount(() => {
    const scrollToTop = () => window.scrollTo(0, 0)
    window.addEventListener('hashchange', scrollToTop)
    return () => window.removeEventListener('hashchange', scrollToTop)
  })
</script>

<Router {routes} />
