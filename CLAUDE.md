# ÉIRVOX — Claude Code standing instructions

Read these before every task. They override conflicting instructions
in any prompt except direct messages from Renato.

1. Before touching the database or any supabase/ file: read HANDOFF.md
   in full. The live DB is the source of truth, not committed SQL.
   Never run destructive resets.
2. Before touching any UI, component, route, style, or user-facing
   copy: read design/DIRECTION-LOCKFILE.md in full. It is the design
   constitution. Run its §13 drift check on your own output before
   presenting it.
3. Never resolve a [FACT NEEDED: …] token by inventing content.
   Render tokens visibly. If you believe the fact exists in the repo,
   cite file and line and ask.
4. Never use the banned phrases in lockfile §7 anywhere, including
   comments, commit messages, and placeholder copy.
5. No router, build-config, or dependency changes without asking first.
6. No marketplace-surface changes while wheel_specialist_mode is the
   launch posture.
7. Present a file-by-file plan and wait for approval before editing.
   Small single-purpose commits.
