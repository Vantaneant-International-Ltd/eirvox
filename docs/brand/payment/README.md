# Payment brand SVGs

Drop official greyscale or mono SVG marks here. The footer's PaymentIcons
component will pick them up once wired (see the TODO in `src/lib/PaymentIcons.svelte`
to swap from inline-redrawn icons to file references).

## Expected filenames

| File | Brand | Suggested svgrepo source |
| --- | --- | --- |
| `revolut.svg` | Revolut Pay | https://www.svgrepo.com/vectors/revolut/ |
| `apple-pay.svg` | Apple Pay | https://www.svgrepo.com/vectors/apple-pay/ |
| `google-pay.svg` | Google Pay | https://www.svgrepo.com/vectors/google-pay/ |
| `visa.svg` | Visa | https://www.svgrepo.com/vectors/visa/ |
| `mastercard.svg` | Mastercard | https://www.svgrepo.com/vectors/mastercard/ |
| `amex.svg` | American Express | https://www.svgrepo.com/vectors/american-express/ |
| `pay-by-bank.svg` | Pay by Bank (open banking) | https://www.svgrepo.com/vectors/bank/ |

## Why this directory exists

The current `PaymentIcons.svelte` renders inline redrawn approximations of
each brand mark. The footer applies `filter: grayscale(1)` to desaturate
them so they read as fine print, not as a brand banner. That works visually
today but the marks are not official.

Once the seven files above are dropped in, a follow-up commit will swap
PaymentIcons to render `<img src="/brand/payment/{slug}.svg">` so the real
official greyscale marks ship. No code change to `Footer.svelte` is needed
at that point.

## Licence

Each brand has its own asset-use policy. svgrepo distributes most marks as
CC0 or under the brand's press-pack licence. Confirm per file before
shipping to production. If a brand's official asset is not allowed in
greyscale, source the closest sanctioned variant.
