<script lang="ts">
  import { onMount } from 'svelte';
  import { currentPath, matchRoute } from './lib/router';
  import { initAuth } from './lib/auth';
  import { isDevBypassed, isMaintenancePreviewed, siteFlags, flagsLoading, loadSiteFlags, resolveGate } from './lib/flags';
  import ComingSoonHero from './routes/ComingSoonHero.svelte';
  import MaintenanceHero from './routes/MaintenanceHero.svelte';
  import Home from './routes/Home.svelte';
  import CategoryPage from './routes/CategoryPage.svelte';
  import ListingDetail from './routes/ListingDetail.svelte';
  import DriveIndex from './routes/DriveIndex.svelte';
  import DriveIssue from './routes/DriveIssue.svelte';
  import Sell from './routes/Sell.svelte';
  import SellerApply from './routes/SellerApply.svelte';
  import SellerCreate from './routes/SellerCreate.svelte';
  import SellerEdit from './routes/SellerEdit.svelte';
  import SellerDashboard from './routes/SellerDashboard.svelte';
  import Trust from './routes/Trust.svelte';
  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Account from './routes/Account.svelte';
  import Messages from './routes/Messages.svelte';
  import AdminDashboard from './routes/admin/Dashboard.svelte';
  import AdminListings from './routes/admin/Listings.svelte';
  import AdminSellers from './routes/admin/Sellers.svelte';
  import AdminReservations from './routes/admin/Reservations.svelte';
  import AdminTrade from './routes/admin/Trade.svelte';
  import AdminUsers from './routes/admin/Users.svelte';
  import AdminCategories from './routes/admin/Categories.svelte';
  import AdminSettings from './routes/admin/Settings.svelte';
  import AdminWaitlist from './routes/admin/Waitlist.svelte';
  import AdminEnquiries from './routes/admin/Enquiries.svelte';
  import Search from './routes/Search.svelte';
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
  import AuthGuard from './components/AuthGuard.svelte';

  // Visibility gates. Two flags live in public.site_settings.flags:
  //   maintenance: temporary outage page (precedence over coming_soon)
  //   coming_soon: pre-launch landing
  // Admin can flip either from /admin/settings without a redeploy.
  // #dev hash bypasses both (sessionStorage-scoped).
  let bypassed = false;
  let maintenancePreview = false;
  $: gate = resolveGate($siteFlags, bypassed, $flagsLoading, maintenancePreview);

  onMount(() => {
    maintenancePreview = isMaintenancePreviewed();
    bypassed = isDevBypassed();
    void loadSiteFlags();
    // Init auth eagerly; the gates only hide the UI shell, auth itself
    // is harmless to load (admin needs it to reach /admin in dev bypass).
    initAuth();
  });

  const CATEGORIES = [
    'cars',
    'automotive',
    'watches',
    'fashion',
    'tech',
    'home-design',
    'audio-vinyl',
    'art',
  ];

  // Path with hash query string stripped (admin pages use ?status=… as
  // a soft filter hint, but the router itself only matches the path).
  $: rawPath = $currentPath;
  $: path = rawPath.includes('?') ? rawPath.slice(0, rawPath.indexOf('?')) : rawPath;

  $: listingParams = matchRoute('/listing/:slug', path);
  $: driveParams = matchRoute('/drive/:slug', path);
  $: tradeProfileParams = matchRoute('/trade/:categorySlug/:slug', path);
  $: tradeCategoryParams = matchRoute('/trade/:categorySlug', path);
  $: sellEditParams = matchRoute('/sell/edit/:listingId', path);
  $: categoryMatch = CATEGORIES.find(c => path === `/${c}`) ?? null;

  // Trade slugs that should NOT match as categories
  const TRADE_RESERVED_PATHS = ['apply'];
</script>

{#if gate === 'maintenance'}
  {#if maintenancePreview}
    <div class="dev-banner">
      PREVIEW MODE — Maintenance gate is OFF for the public · visit <code>/#exit-preview</code> to leave
    </div>
  {/if}
  <MaintenanceHero />
{:else if gate === 'coming_soon' || gate === 'loading'}
  <ComingSoonHero />
{:else}
{#if bypassed && ($siteFlags.maintenance || $siteFlags.coming_soon)}
  <div class="dev-banner">
    DEV MODE — {$siteFlags.maintenance ? 'Maintenance' : 'Coming soon'} is active for visitors
  </div>
{/if}
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

<!-- ════ Seller routes ════ -->
{:else if path === '/sell/apply'}
  <SellerApply />
{:else if path === '/sell/create'}
  <AuthGuard requireAuth={true}>
    <SellerCreate />
  </AuthGuard>
{:else if path === '/sell/dashboard'}
  <AuthGuard requireAuth={true}>
    <SellerDashboard />
  </AuthGuard>
{:else if sellEditParams}
  <AuthGuard requireAuth={true}>
    <SellerEdit listingId={sellEditParams.listingId} />
  </AuthGuard>
{:else if path === '/sell'}
  <Sell />

<!-- ════ TRADE routes ════ -->
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

<!-- ════ Account + Messages (auth required) ════ -->
{:else if path === '/messages'}
  <AuthGuard requireAuth={true}>
    <Messages />
  </AuthGuard>
{:else if path === '/account'}
  <AuthGuard requireAuth={true}>
    <Account tab="overview" />
  </AuthGuard>
{:else if path === '/account/orders'}
  <AuthGuard requireAuth={true}>
    <Account tab="orders" />
  </AuthGuard>
{:else if path === '/account/saved'}
  <AuthGuard requireAuth={true}>
    <Account tab="saved" />
  </AuthGuard>
{:else if path === '/account/settings'}
  <AuthGuard requireAuth={true}>
    <Account tab="settings" />
  </AuthGuard>

<!-- ════ Admin ════ -->
{:else if path === '/admin'}
  <AuthGuard requireRole="admin">
    <AdminDashboard />
  </AuthGuard>
{:else if path === '/admin/listings'}
  <AuthGuard requireRole="admin">
    <AdminListings />
  </AuthGuard>
{:else if path === '/admin/sellers'}
  <AuthGuard requireRole="admin">
    <AdminSellers />
  </AuthGuard>
{:else if path === '/admin/reservations'}
  <AuthGuard requireRole="admin">
    <AdminReservations />
  </AuthGuard>
{:else if path === '/admin/trade'}
  <AuthGuard requireRole="admin">
    <AdminTrade />
  </AuthGuard>
{:else if path === '/admin/users'}
  <AuthGuard requireRole="admin">
    <AdminUsers />
  </AuthGuard>
{:else if path === '/admin/categories'}
  <AuthGuard requireRole="admin">
    <AdminCategories />
  </AuthGuard>
{:else if path === '/admin/settings'}
  <AuthGuard requireRole="admin">
    <AdminSettings />
  </AuthGuard>
{:else if path === '/admin/waitlist'}
  <AuthGuard requireRole="admin">
    <AdminWaitlist />
  </AuthGuard>
{:else if path === '/admin/enquiries'}
  <AuthGuard requireRole="admin">
    <AdminEnquiries />
  </AuthGuard>

{:else if path === '/search'}
  <Search />
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
{/if}

<style>
  .dev-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: #1A1A1A;
    color: #E8742C;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-align: center;
    padding: 6px 12px;
    border-bottom: 1px solid rgba(232, 116, 44, 0.3);
    pointer-events: none;
  }
</style>
