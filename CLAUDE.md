# ÉIRVOX — Claude Code standing instructions

Read these before every task. They override conflicting instructions
in any prompt except direct messages from Renato.

1. Before touching the database or any supabase/ file: read HANDOFF.md
   in full. The live DB is the source of truth, not committed SQL.
   Never run destructive resets.
2. Before any UI or copy work: read brand/EMOTIONAL-BIBLE.md and
   brand/DIRECTION-LOCKFILE.md in full. The bible is the source of
   feeling (trust + desire, fused; object sacred; curator invisible);
   the lockfile is the design constitution. Run the lockfile §13 drift
   check on your own output before presenting it.
3. Never resolve an unknown fact by inventing content. As of
   19 Aug 2026 no [FACT NEEDED] token renders on a public surface:
   they were cleared by CUTTING the claim that needed the unknown,
   not by filling it in. Keep it that way. If a new unknown turns up,
   either cut the claim or use src/lib/FactNeeded.svelte while you
   build, and ask. Never ship a token to production, and never ship a
   guessed dimension, price, carrier, or delivery promise. The open
   unknowns are listed in HANDOFF.md.
4. Never use the banned phrases in lockfile §7 anywhere, including
   comments, commit messages, and placeholder copy.
5. No router, build-config, or dependency changes without asking first.
6. The marketplace is LOCKED, not hidden (19 Aug 2026, Renato). One
   nav item marked `Soon` routes to /marketplace; gated marketplace,
   TRADE, seller, search, listing, account and messaging paths render
   that page instead of a 404. Do not open a category, name one,
   promise a date, or show a count. Everything built stays built:
   flip wheel_specialist_mode off to restore it.
7. There is ONE world and it is DARK (20 Aug 2026, Renato). Near-black
   ground, light text, fox orange as the only accent, hairline rules,
   no radii or shadows. It is a token inversion in src/app.css: "paper"
   is the page ground and "ink" is the text on it, whichever way round
   they sit, so components are never hardcoded to a colour. Two
   exceptions, both deliberate: the PRODUCT TILE stays light, because
   the photography is shot on light grounds; and ADMIN stays light,
   pinned via .admin-shell. brand/DESIGN-WORLDS.md is superseded.
8. Present a file-by-file plan and wait for approval before editing.
   Small single-purpose commits.
9. docs/ is committed and is what eirvox.ie serves. A source-only
   commit does not change the live site: rebuild docs/ with real
   VITE_SUPABASE_* values, keep docs/CNAME, and commit it when you
   ship. Never commit a docs/ built with placeholder env.
