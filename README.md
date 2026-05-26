# Éirvox

Ireland's premium automotive parts marketplace. A curated storefront for OEM and OEM+ parts from marques including Audi, BMW, Mercedes-AMG, and Volkswagen.

Live at [eirvox.ie](https://eirvox.ie)

## Stack

- [Svelte 5](https://svelte.dev) + TypeScript
- [Vite](https://vitejs.dev)
- [svelte-spa-router](https://github.com/ItalyPaleAle/svelte-spa-router) — hash-based routing, SPA-friendly for static hosting

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/automotive` | Listings |
| `/automotive/:slug` | Product detail |
| `/about` | About |
| `/trust` | Trust & verification |
| `/sell` | Sell a part |
| `/enquire` | Enquiry form |
| `/login` | Login |
| `/register` | Register |

## Development

```bash
npm install
npm run dev
