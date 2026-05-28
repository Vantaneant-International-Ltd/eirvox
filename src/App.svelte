<script lang="ts">
  import { currentPath, matchRoute } from './lib/router';
  import Home from './routes/Home.svelte';
  import CategoryPage from './routes/CategoryPage.svelte';
  import ListingDetail from './routes/ListingDetail.svelte';
  import DriveIndex from './routes/DriveIndex.svelte';
  import DriveIssue from './routes/DriveIssue.svelte';
  import Sell from './routes/Sell.svelte';
  import SellerApply from './routes/SellerApply.svelte';
  import SellerCreate from './routes/SellerCreate.svelte';
  import SellerDashboard from './routes/SellerDashboard.svelte';
  import Reserve from './routes/Reserve.svelte';
  import ReserveCheckout from './routes/ReserveCheckout.svelte';
  import ReserveDrive from './routes/ReserveDrive.svelte';
  import Trust from './routes/Trust.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Account from './routes/Account.svelte';
  import Messages from './routes/Messages.svelte';
  import Sitemap from './routes/Sitemap.svelte';
  import NotFound from './routes/NotFound.svelte';

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
  $: reserveDriveParams = matchRoute('/reserve/drive/:slug', path);
  $: reserveParams = matchRoute('/reserve/:slug', path);
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
{:else if path === '/sell/create'}
  <SellerCreate />
{:else if path === '/sell/dashboard'}
  <SellerDashboard />
{:else if path === '/sell'}
  <Sell />
{:else if reserveDriveParams}
  <ReserveDrive issueSlug={reserveDriveParams.slug} />
{:else if path === '/reserve'}
  <Reserve />
{:else if reserveParams}
  <ReserveCheckout listingSlug={reserveParams.slug} />
{:else if path === '/trust'}
  <Trust />
{:else if path === '/about'}
  <About />
{:else if path === '/login'}
  <Login />
{:else if path === '/messages'}
  <Messages />
{:else if path === '/account'}
  <Account tab="overview" />
{:else if path === '/account/orders'}
  <Account tab="orders" />
{:else if path === '/account/saved'}
  <Account tab="saved" />
{:else if path === '/account/settings'}
  <Account tab="settings" />
{:else if path === '/sitemap'}
  <Sitemap />
{:else}
  <NotFound />
{/if}
