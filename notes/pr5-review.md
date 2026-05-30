# PR #5 — Review tracking

PR: https://github.com/Vantaneant-International-Ltd/eirvox/pull/5
Reviewer: Kevin (@soggyfox)
Captured: 2026-05-30

This file tracks review comments and decisions so nothing is lost between commits. Update the **Status** column as items land or get parked.

## Comments

| # | File | Comment | Decision | Status |
|---|---|---|---|---|
| 1 | `src/components/AdminLayout.svelte` | "hrefs should work without `#`, much cleaner and better routing" | History-mode routing is a bigger refactor. HANDOFF.md locks "hash routing" as architecture, but the rationale was GitHub Pages compatibility. Once Vercel is wired (current direction), history mode is viable. **Park as separate phase**; touching every `navigate()` call + every `href="#/..."` is out of scope for the current audit. Worth doing later. | parked |
| 2 | `src/lib/api.ts` | "types should always be in enums" (re `SellerTier`, `ListingStatus` string unions) | TypeScript string-literal unions are idiomatic and preferred over `enum` for type-only values (no runtime cost, no reverse-mapping quirks). The codebase uses unions consistently. **Counter-propose**: keep unions; if Kevin wants stable named constants, use `as const` objects + `keyof typeof`. | discuss |
| 3 | `src/lib/sellers.ts` (Seller interface) | "`email?: string;`" (re `email: string \| null`) | DB columns are nullable but always present on a row. `string \| null` is semantically correct ("field exists, value may be null"); `?:` would mean "field may be absent" which is false for SELECT results. **Counter-propose**: keep `string \| null` for DB row types. Reserve `?:` for input/patch types where the property might be omitted. | discuss |
| 4 | `src/lib/sellers.ts` (SellerProfilePatch) | "you have `email?: string;` so you do not need null usually" (re `email?: string \| null`) | For PATCH inputs, `email?: string \| null` lets a caller pass `null` to clear the column. If we never want to support clearing, `email?: string` is fine. **Decide per-field** based on UX needs. | needs decision |
| 5 | `src/lib/sellers.ts` | "side note, how to login to supa" | Kevin needs a Supabase project invite from Renato. Dashboard: `https://supabase.com/dashboard/project/arokrumaxjiidsqfpiii`. Add as a member via the Supabase project settings → Team. | renato action |
| 6 | `src/routes/admin/Settings.svelte` | "should all be in an enum" (re `saving: 'cohort' \| 'drive' \| 'fees' \| 'deposit' \| null`) | Same as #2. Local state union. **Counter-propose**: keep as union. | discuss |
| 7 | `src/routes/ListingDetail.svelte` | "type should be `ListingWithExtras` and that type can be defined as null itself as an option" (re `listing: ListingWithExtras \| null = null`) | This conflates DATA shape with USE-SITE nullability. The type describes the shape of a single record. The variable's nullability belongs at the declaration. Wrapping `null` into the type definition would force every consumer to handle null, including pure helpers that only see populated rows. **Counter-propose**: keep nullability at the declaration. | discuss |
| 8 | `src/routes/Trust.svelte` | "add global labels file where all text is monitored. I can do that too if needs be" | Centralised strings / i18n. Big refactor across every route. Out of scope for the current audit. **Park as separate phase**; Kevin offered to do it. | parked / kevin |
| 9 | PR-level | "resolve merge conflicts" — merge conflict in `src/lib/Counter.svelte` (probably a Svelte template leftover on `main` that was deleted on `renato`) | After the current audit commit stream finishes, do a `git merge main` (or rebase) and resolve the Counter.svelte conflict by accepting the renato deletion. | pending |

## Behaviour summary

- **Style debates (#2, #6)**: TypeScript string-literal unions vs `enum`. We're keeping unions and will explain on the PR. Worth a quick alignment call before merging the audit branch.
- **Nullability (#3, #4, #7)**: three related comments. Position: `string | null` for DB row types, `?: string | null` for PATCH inputs where clearing is a feature, type-level nullability never. Worth one short reply on the PR thread covering all three.
- **Hash routing (#1) and i18n (#8)**: real improvements, both out of scope here. Logged for future phases.
- **#5 and #9**: operational items, not code.
