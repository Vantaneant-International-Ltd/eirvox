<script lang="ts">
  import { currentPath, matchRoute } from './lib/router';
  import Home from './routes/Home.svelte';
  import CategoryPage from './routes/CategoryPage.svelte';
  import ListingDetail from './routes/ListingDetail.svelte';
  import DriveIndex from './routes/DriveIndex.svelte';
  import DriveIssue from './routes/DriveIssue.svelte';
  import Sell from './routes/Sell.svelte';
  import SellerApply from './routes/SellerApply.svelte';
  import Reserve from './routes/Reserve.svelte';
  import Trust from './routes/Trust.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import ComingSoon from './routes/ComingSoon.svelte';

  const CATEGORIES = [
    'automotive',
    'watches',
    'fashion',
    'tech',
    'home-design',
    'audio-vinyl',
    'art',
  ];

  $: path = $currentPath;

  $: listingParams = matchRoute('/listing/:slug', path);
  $: driveParams = matchRoute('/drive/:slug', path);
  $: categoryMatch = CATEGORIES.find(c => path === `/${c}`) ?? null;
</script>

{#if path === '/'}
  <Home />
{:else if categoryMatch}
  <CategoryPage category={categoryMatch} />
{:else if listingParams}
  <ListingDetail slug={listingParams.slug} />
{:else if path === '/drive'}
  <DriveIndex />
{:else if driveParams}
  <DriveIssue issueSlug={driveParams.slug} />
{:else if path === '/sell/apply'}
  <SellerApply />
{:else if path === '/sell'}
  <Sell />
{:else if path === '/reserve'}
  <Reserve />
{:else if path === '/trust'}
  <Trust />
{:else if path === '/about'}
  <About />
{:else if path === '/login'}
  <Login />
{:else if path === '/messages'}
  <ComingSoon
    title="Messages."
    description="Your inbox, offers, and negotiations — all in one place. Available when buyer accounts launch in H2 2026."
  />
{:else if path === '/account'}
  <ComingSoon
    title="Account."
    description="Your dashboard, listings, orders, and saved searches. Available when buyer accounts launch in H2 2026."
  />
{:else}
  <ComingSoon
    title="Coming soon."
    description="This section isn't ready yet. Use the navigation above to browse the marketplace."
  />
{/if}
