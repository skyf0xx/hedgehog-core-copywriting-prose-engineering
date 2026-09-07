---
name: hedgehog-copywriting-loop
description: The operating loop for the copywriting core, start to finish — planning intake (the vendored BMAD-METHOD shelf, mined into a brief), then the draft/checkCopy()/revise cycle that gates every piece of copy on a mechanical pass, not an agent's own self-report. Covers the copy types (prose, ad, landing-page, direct-response, tweet) and the format contract each one gates on. Invoke at the start of any copy-writing session and for "what's next." Also covers this core's own planning intake.
---

# Copywriting Loop

This core produces copy — marketing copy, product UI strings, docs
prose, whatever the brief names — gated by `scripts/check-copy/`, a
real Node script that runs deterministic AI-tell and prose-quality
checks (`tells-detector` and `prose-quality`'s rule sets, as code) and
returns a structured violation report. The loop exists because an
agent's own read of its draft ("this looks clean") is not a gate; a
process exiting 0 or 1 is.

Copy that ships into a specific medium is gated on that medium's
contract too, named by the brief's `type:` field and covered in "Copy
types" below.

## Copy types

The AI-tell and prose-quality contracts are universal: they run against
every draft, whatever it is. What differs by copy type is the medium's
own contract, added by `--format`:

| `type:` | What the format contract adds | Reference skill |
| --- | --- | --- |
| `prose` (default) | nothing beyond the universal pair | — |
| `ad` | Meta's field limits (2200 primary, 40 headline, 30 description), the 125-character "See more" fold, a required CTA, and banned compliance claims | `ad-copy` |
| `landing-page` | a required headline and CTA, proof, 500-word ceiling, 60-word mobile paragraph ceiling | `landing-page-copy` |
| `direct-response` | a required CTA, a required number, vague-benefit claims, proof past 150 words | `direct-response-copy` |
| `tweet` | the 280-character limit (25,000 with `--premium`), one hashtag, engagement bait, all-caps openers | `tweet-copy` |

Why these are gates rather than guidance: before the format contracts
existed, a 446-character "tweet" carrying five hashtags, a body link and
"RT if you agree" passed this core's gate with zero errors, and so did a
Meta ad with an 81-character headline promising readers they would "make
money fast with zero risk". Both are rejected outright by the platforms
they were written for. No prose rule can see either defect, because
nothing about the sentences themselves is wrong.

Three things follow, and the loop holds to all three:

- **A format contract only ever adds.** None of them relaxes a universal
  rule, so no copy type is licensed to sound more like an LLM because of
  where it ships.
- **The format comes from the brief, never from the draft.** The brief is
  read-only once the draft layer starts, so a draft that reads like a
  landing page under a `type: tweet` brief is a mismatch to raise, not a
  flag to switch.
- **Dropping `--format` is not a fix.** Running a tweet through the
  `prose` contract hides the character limit rather than meeting it.

## Phase -1: ephemeral scratch setup (before Phase 0)

Every invocation of this loop is ephemeral: it runs entirely in a hidden
temp directory, and only the finished piece is copied back to wherever
the user actually started. There is no persistent, visible install of
this core in the old sense — nothing under this core lives in the
user's project directory except the one file the courtesy export drops
there. Run these steps in order, before anything else in the session:

1. **Capture the user's real starting directory first, before anything
   else happens**: `ORIGDIR="$PWD"`. This ordering matters because
   `$ORIGDIR` is the one piece of state this loop cannot reconstruct
   later — everything else the loop creates lives inside the temp
   directory and is fully discardable, but if `$ORIGDIR` isn't captured
   before any `cd` happens, there is no way to know where the finished
   piece should ultimately land.
2. **Run `hedgehog init --copywriting` from `$ORIGDIR`, unwrapped**:
   ```
   HEDGEHOG_CORE_NO_CACHE=1 npx @skyf0xx/hedgehog init --copywriting
   ```
   The CLI creates the scratch directory itself and `cd`s into it before
   installing anything — it never lands `scripts/check-copy/`,
   `core.yaml`, or anything else under `$ORIGDIR`. **Do not** `mktemp -d`
   or `cd` before running this: the CLI already owns that, and wrapping
   this command inside a manually-created directory only produces a
   second, nested scratch directory that the CLI creates inside the
   first — the install still lands in the CLI's own directory, not the
   one made by hand, which would make the path captured in the next step
   wrong.
3. **Capture the scratch path the command just printed** —
   `(copywriting installs to a scratch directory, never here — using
   <path>)` is the first line of output — as `$TMPDIR` for the rest of
   this session.
4. **Install the workspace's dependencies**, from inside `$TMPDIR`:
   ```
   (cd "$TMPDIR" && pnpm install)
   ```
   `init --copywriting` lands `scripts/check-copy/`'s `package.json` and
   the workspace's lockfile but never runs the install itself — every
   `check-copy` invocation below imports packages (`unified`, `retext-*`)
   that don't exist on disk until this runs. Do this once, right after
   capturing `$TMPDIR`, before Phase 0 or any `check-copy` call — running
   it lazily on the first gate failure works too, but doing it here
   means that failure never happens.
5. **The invariant from here on**: every `hedgehog` command for the
   rest of this loop, and every file this loop writes (`.hedgehog/copy/`,
   the BMAD archive under `.hedgehog/BMAD/`), happens inside `$TMPDIR`,
   never `$ORIGDIR`. Every `hedgehog` invocation is wrapped as a
   subshell, not a bare `cd`:
   ```
   (cd "$TMPDIR" && HEDGEHOG_CORE_NO_CACHE=1 HEDGEHOG_NO_COMMUNITY_PROMPT=1 hedgehog ...)
   ```
   A subshell guarantees a single missed wrapper on some later command
   doesn't silently leave things pointed at the wrong directory, since
   each Bash tool call is not guaranteed to persist shell state (cwd)
   from the previous one anyway — a bare `cd` would only be as reliable
   as remembering it happened.

Every relative path named anywhere else in this document —
`.hedgehog/copy/...`, `scripts/check-copy/...`, `core.yaml`,
`.hedgehog/BMAD/...` — is relative to `$TMPDIR`, per the invariant
above; nothing downstream re-states this.

## Planning intake (Phase 0, before any build layer)

Run once. This core has no bootstrap step: `hedgehog init --copywriting`
lands `scripts/check-copy/` and `core.yaml` together, as this package's
`workspace/`, at install time — before planning intake ever starts. This
is the one core `planner`'s generic Workflow step 9 does not hand off to
`bootstrap` for; step 6 below runs `hedgehog plan` directly instead,
since the core.yaml it needs is already on disk. Opens with
`hedgehog-planning-intake`'s Phase 0 (step 1 below). After that Phase 0
completes, this section does its own thin mining pass — what's being
written, for whom, and in what register — the copywriting counterpart to
`hedgehog-planning-intake`'s own Phase 1 (domain modules and an
Add-ons decision on full-stack-app).

1. **Run `hedgehog-planning-intake`'s Phase 0**, full shelf or
   compressed intake depending on which `planner` routed to for this
   request (see that skill's "Compressed intake" section): state the
   BMAD attribution it states, then either run `bmad-forge-idea`,
   `bmad-brainstorming`, `bmad-product-brief`, `bmad-prfaq` in full,
   stopping there per that skill's "Full-shelf carve-out on
   copywriting" (running `bmad-deep-recon` too where the piece
   genuinely needs market/competitive/user-voice research, and never
   running `bmad-prd` or `bmad-ux` — this core has no module axis and
   no UI surface for either to attach to), or — on an explicit "just
   build it" choice, for a short, low-stakes piece — the batched round
   compressed intake defines instead. Either way, archived to
   `.hedgehog/BMAD/` with the fixed layout and `00-manifest.md`
   attribution header that skill's Phase 0 defines. `.hedgehog/BMAD/` is
   archival and immutable once written, same as every other core —
   nothing in this core's day-to-day loop reads it live after this step
   mines it once. `bmad-brainstorming`'s
   Ideate-for-me mode defaults to auto-generating an HTML keepsake —
   unwanted work on a core whose deliverables are plain prose. A project
   that wants brainstorming sessions to stay markdown-only can set
   `keepsake_format = "markdown-only"` in
   `_bmad/custom/bmad-brainstorming.toml`; this core doesn't set it by
   default, since some copywriting projects do want the visual keepsake.
2. **Gate every option BMAD presented, before mining reads any of
   them.** `bmad-brainstorming` (and `bmad-forge-idea`'s own option
   round, where it runs one) surfaces multiple headlines/hooks/angles
   for the user to choose between as part of its own interactive run —
   this loop doesn't control that moment, so it can't intercept an
   option before the user first sees it. What it can and must do is
   treat those options as ungated the instant that BMAD skill hands
   control back, since they're prose the user may ship close to
   verbatim and haven't touched `checkCopy()` yet. Before doing anything
   else with `.hedgehog/BMAD/`'s freshly-written output, extract every
   option BMAD presented and run each one through `checkCopy()`
   (imported from `scripts/check-copy/index.mjs`, the same function the
   `draft` layer calls later — not the CLI, to avoid a process spawn per
   option) with `{ format: 'prose' }`: the copy type isn't decided until
   step 4 below, so this pass runs the universal AI-tell and
   prose-quality contract only, the same one every copy type's format
   contract only ever adds to. For each option that comes back
   `pass: false`, regenerate that option against its own violation
   report, up to 3 attempts, and re-present the cleaned option to the
   user (BMAD's own archived copy stays as written, per the immutability
   rule below — the regenerated text lives in this loop's own working
   state, not a hand-edit of `.hedgehog/BMAD/`). If it still doesn't
   pass after 3, present it anyway rather than dropping it — a strong
   option that trips a prose nit is still worth the user seeing — but
   mark it, inline, with which check it failed, so the user is choosing
   with that visible rather than being handed silently-dirty copy. If
   the user already picked an option before this pass could run (BMAD's
   flow may not leave a gap to intervene in), gate the picked option
   immediately after and surface the result before moving on to mining,
   rather than skipping the gate because the moment to show alternatives
   has passed. This does not replace the `draft` layer's own gate:
   whichever option the user picks still goes through the full
   `checkCopy()` run against its real `type:` format contract once step
   4 mines it, since a prose-only pass here can't see a tweet's
   character limit or an ad's required CTA.
3. **Mine a draft brief** from `.hedgehog/BMAD/`: what's being written
   (the concrete piece — a landing page section, a product announcement,
   a UI microcopy string, docs prose), its copy type, the audience, and
   the register to write in, sourced from the product brief and PR-FAQ
   (the closest BMAD artifacts to a copy brief). The copy type is one of
   the `type:` values in "Copy types" above, mined from what the piece
   actually is: a Meta ad is `ad`, a bridge or pre-sell page is
   `landing-page`, a sales page or VSL or email sequence is
   `direct-response`, a single post on X is `tweet`, and an article,
   essay, or piece of documentation is `prose`. Where the piece genuinely
   could be two of them (a short page that might be a bridge page or a
   full sales page), ask rather than guessing: the type decides which
   contract the draft is gated on, so a wrong guess surfaces late, as a
   wall of format violations against copy that was never written for
   that medium. `00-brief.md` itself stays this thin by
   design — the root the `draft` layer works from, not a copy of BMAD's
   full archive. Where the brief/PR-FAQ leaves what/audience/register
   genuinely unresolved, ask directly — don't proceed on vagueness, and
   don't invent an audience or register that wasn't stated, mined, or
   confirmed.
4. **Write `.hedgehog/copy/00-brief.md`** — the mined what/type/audience/
   register, in plain terms. The copy type goes in as a `type:` line at
   the start of the file, on its own line, with one of the values from
   "Copy types" above:
   ```
   type: tweet
   ```
   The `draft` layer's verify reads that line to pick the format
   contract, so a brief with no `type:` line is gated as `prose`. This is the root the `draft` layer's
   `copy-writer` agent works from; it draws from BMAD's archive but is
   its own file, not a pointer into `.hedgehog/BMAD/`.
5. **Confirm & Lock** — show the mined brief back in plain terms,
   alongside which BMAD skills ran and where their output lives
   (`.hedgehog/BMAD/`), before writing anything to the build graph.
   Show the copy type alongside the rest, and say which format contract
   it gates on, since that is the part the user is most likely to want
   changed before anything is locked. State plainly what happens on
   confirmation: *"This locks in the brief, adds the `copy` intent to the
   build graph (`hedgehog intent add`), compiles it into the two-layer
   chain (`hedgehog plan`), and commits (`chore(planning): copy brief`). The draft layer starts right
   after — this core's workspace is already installed, so there's no
   bootstrap step to wait on. Anything wrong or missing — say so now."*
   Wait for explicit go-ahead — a revision here is just another mining
   pass against the same BMAD archive, not a Correction Protocol entry,
   since nothing downstream exists yet.
6. **Add the intent and compile the graph**: `hedgehog intent add --id
   copy --goal "<what's being written>" --outcome "<audience + register>"`
   — one call, no `--rule`/`--depends-on` needed; copywriting has no
   module axis, so this single intent is what `hedgehog plan` compiles
   against this core's `core.yaml` into the two layer tasks. Run
   `hedgehog plan` next, then `hedgehog status` to show the compiled
   chain.
7. **Commit planning intake's output as one commit**,
   `chore(planning): copy brief` — the committed intent
   (`.hedgehog/intents/copy.json`), `.hedgehog/BMAD/`, and
   `.hedgehog/copy/00-brief.md` together.

## The layers

1. **`brief`** — written by the planning intake section above, at
   `.hedgehog/copy/00-brief.md`. `hedgehog verify` on this layer only
   checks the file is non-empty; there's no copy quality gate yet
   because there's no copy yet.
2. **`draft`** — the loop below, ending with `.hedgehog/copy/final.md`
   passing `node scripts/check-copy/index.mjs .hedgehog/copy/final.md`
   with exit code 0.

## The loop

1. **`hedgehog claim --owner copy-writer --count 1`** emits the task
   packet for the ready layer.
2. **Delegate to `copy-writer`.** This core's whole install is ephemeral
   and same-session (Phase -1), so `copy-writer` was *just* written to
   `.claude/agents/` moments ago — dispatch by name (`subagent_type:
   copy-writer`) will reliably fail with "Agent type 'copy-writer' not
   found" every single time, since this host only reads agent
   registration once at session start, not mid-session. This isn't an
   edge case to discover via a failed tool call: skip dispatch by name
   entirely and read `.claude/agents/copy-writer.md` directly, then
   follow it inline instead. (Root CLAUDE.md's "Delegating on this
   host" note covers the same mechanism for every other core, where it
   ordinarily *is* an edge case rather than the guaranteed path.) The
   agent reads the brief, drafts copy into `.hedgehog/copy/final.md`,
   then runs the gate itself before presenting anything:
   ```
   node scripts/check-copy/index.mjs .hedgehog/copy/final.md
   ```
3. **Read the JSON report.** `metrics.format` confirms which contract
   ran; if it says `prose` on a draft that was meant to be a tweet, the
   flag was dropped and the run does not count. `pass: false` means at
   least one error-severity violation fired — revise and re-run, not
   argue with the report. `pass: true` with `warningCount > 0` is a judgment call:
   warnings (weasel words, passive voice, low burstiness, readability
   drift) are real signal but not automatically disqualifying — weigh
   each against the brief's register before deciding whether to revise
   further or ship as-is. Never silence a warning by rewording it to
   dodge the specific regex without addressing what it flagged.
4. **Cap at 6 iterations.** A draft that can't clear errors in 6 passes
   usually means the brief and the gate are in tension (e.g. a register
   that genuinely needs a "banned" word in context, or a target
   reading level the subject matter can't honestly hit) — stop and
   surface that conflict to the user rather than iterating blindly.
   Each iteration is informal (no commit); only the final passing draft
   gets committed.
5. **`hedgehog verify draft --owner copy-writer`** — re-runs the same
   `checkCopy()` command as the actual gate (not trusting step 3's
   informal run), and on pass writes the layer's commit
   (`feat(copy): draft`). On failure the task moves to `blocked`; go
   back to step 2, don't hand-commit around a block.
   1. **After verify passes and the layer's commit is written, drop a
      courtesy export at `$ORIGDIR`**: copy the just-verified
      `.hedgehog/copy/final.md` to a plain file named from a kebab-case
      slug of `00-brief.md`'s "what's being written" (fallback to
      `article.md` if the brief text doesn't yield a clean slug), e.g.
      ```
      cp "$TMPDIR/.hedgehog/copy/final.md" "$ORIGDIR/product-launch-announcement.md"
      ```
      If that filename already exists at `$ORIGDIR`, append `-2`, `-3`,
      … until it doesn't — never overwrite an earlier piece's export.
      This is a courtesy copy only: `.hedgehog/copy/final.md` inside
      `$TMPDIR` remains the canonical, gated artifact that verify and
      any later steps reference; nothing about the layer chain or the
      gate itself changes because of this. This single `cp` is the
      *only* interaction this loop ever has with `$ORIGDIR` — never a
      `cd` into it, never any `hedgehog` command run there — which is
      what guarantees this loop cannot interfere with whatever project
      (if any) the user happened to be sitting inside of when they
      started.
   2. **Once the export is confirmed present at `$ORIGDIR`** (e.g. after
      the `cp` above completes without error), delete the temp
      directory: `rm -rf "$TMPDIR"`. This is guarded on the copy having
      actually succeeded — if the `cp` fails for any reason, `$TMPDIR`
      must be left in place rather than deleted, since it would
      otherwise be the only remaining copy of the finished work.
   3. **After `$TMPDIR` is gone, say this line to the user** (console
      only — never written into the exported file or anywhere under
      `$ORIGDIR`): this core has no persistent `.hedgehog/` of its own
      to track a star prompt's answer in the way every other core's
      `hedgehog verify` does (see `community.mjs` upstream), since each
      session's state lives and dies with `$TMPDIR`. Asking every
      session with no memory of a prior answer rules out that same
      blocking, three-option prompt here — so this is a one-line,
      non-blocking mention instead, said once per session, right after
      reporting the piece is done, not before:

        Hope you like the copy — ⭐ star us to keep track of changes: https://github.com/skyf0xx/hedgehog

## Rules

- **Never edit `.hedgehog/copy/final.md` to make a specific check pass
  without addressing what it's actually flagging.** Deleting the word
  "delve" from a sentence that's still structurally a hedge stack is
  gaming the gate, not fixing the copy — the loop should always leave
  the draft better, not just quieter.
- **The format contract is not optional and not swappable.** Dropping
  `--format`, or switching it to a type the brief didn't name, turns a
  failing draft into a passing report without changing the copy. That is
  the same gaming move as rewording to dodge a regex, one level up.
- **`checkCopy()`'s default thresholds are the general-audience
  contract** (see `prose-quality`'s reading-ease floor and grade
  ceiling) — this core ships one fixed rule set, not a per-project
  voice profile, so don't invent exceptions ad hoc. If a real project
  needs a different register, that's a signal to extend the contract
  itself (a future voice-profile config), not to bypass it per-draft.
- **The brief is read-only once the draft layer starts.** A brief that
  turns out wrong mid-draft is a Correction Protocol case — fix the
  brief at its source, re-run the draft layer, not patch around it in
  `final.md`.
