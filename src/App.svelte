<script lang="ts">
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
</script>

<Router {routes} />
