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
  import Terms from './routes/Terms.svelte';
  import Privacy from './routes/Privacy.svelte';
  import Cookies from './routes/Cookies.svelte';
  import AcceptableUse from './routes/AcceptableUse.svelte';
  import Returns from './routes/Returns.svelte';
  import TradeLanding from './routes/TradeLanding.svelte';
  import TradeCategory from './routes/TradeCategory.svelte';
  import TradeProfile from './routes/TradeProfile.svelte';
  import TradeApply from './routes/TradeApply.svelte';
  import CookieBanner from './lib/CookieBanner.svelte';

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
  $: tradeProfileParams = matchRoute('/trade/:categorySlug/:slug', path);
  $: tradeCategoryParams = matchRoute('/trade/:categorySlug', path);
  $: categoryMatch = CATEGORIES.find(c => path === `/${c}`) ?? null;

  // Trade slugs that should NOT match as categories
  const TRADE_RESERVED_PATHS = ['apply'];
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
{:else if path === '/trade'}
  <TradeLanding />
{:else if path === '/trade/apply'}
  <TradeApply />
{:else if tradeProfileParams && !TRADE_RESERVED_PATHS.includes(tradeProfileParams.categorySlug)}
  <TradeProfile categorySlug={tradeProfileParams.categorySlug} slug={tradeProfileParams.slug} />
{:else if tradeCategoryParams && !TRADE_RESERVED_PATHS.includes(tradeCategoryParams.categorySlug)}
  <TradeCategory categorySlug={tradeCategoryParams.categorySlug} />
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
{:else if path === '/terms'}
  <Terms />
{:else if path === '/privacy'}
  <Privacy />
{:else if path === '/cookies'}
  <Cookies />
{:else if path === '/acceptable-use'}
  <AcceptableUse />
{:else if path === '/returns'}
  <Returns />
{:else}
  <NotFound />
{/if}

<CookieBanner />
