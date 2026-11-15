# Architecture

Hedgehog's copywriting core: a mechanical `checkCopy()` gate against
AI-tell, prose-quality, and per-format contracts, the skills that
document what it checks, and the loop that drafts copy against it until
it passes.

The gate is real code — `retext`, `write-good`, and `flesch`/
`flesch-kincaid` under the hood — not an agent's own read of its draft.
A piece of copy ships because a script exited 0, the same trust model
`hedgehog verify` applies to every other core's build layers.

## Contents

- `workspace/scripts/check-copy/` — the gate, copied to
  `scripts/check-copy/` at the root of every project this core installs
  into. `index.mjs` is the CLI entry
  (`node scripts/check-copy/index.mjs <file> --brief <brief.md>`),
  `rules/tells.mjs` is the AI-tell rule set (banned vocabulary,
  negation formulas, hedge stacks, structural density checks),
  `rules/prose.mjs` is the prose-quality rule set (passive voice, weasel
  words, readability, sentence-length variance, nominalization density),
  and `report.mjs` is the zod-validated output shape every rule reports
  through.
- `workspace/scripts/check-copy/rules/formats/` — the per-format
  contracts, one module per copy type (`ad.mjs`, `landing-page.mjs`,
  `direct-response.mjs`, `tweet.mjs`), with `shared.mjs` holding the
  section parser, X's character-counting rule, and the compliance-claim
  list, and `index.mjs` holding the registry `--format` resolves against.
  These check what the prose rules structurally cannot: whether copy
  obeys the medium it ships into. A 446-character post and a Meta ad
  headline at double the platform limit are both defects that no rule
  about sentences can see. A format module only ever adds to the
  universal pair and never relaxes it.
- `workspace/core.yaml` — the two-layer chain (`brief` → `draft`) a
  Hedgehog install compiles into its build graph, copied to the root of
  every project this core installs into alongside `scripts/check-copy/`.
  The `draft` layer's verify passes the brief to the gate as `--brief`,
  which reads the copy type from the `type:` field (and Premium from
  `premium: true`), falling back to `prose` when the brief names none.
- `agents/copy-writer.md` — drafts copy and iterates it against the
  gate until it passes or a real conflict with the brief surfaces.
- `skills/hedgehog-copywriting-loop/` — the operating loop: brief
  intake, then the draft/checkCopy()/revise cycle.
- `skills/tells-detector/` and `skills/prose-quality/` — reference for
  what each universal rule actually checks and why, read before revising
  against a violation rather than in place of running the script.
- `skills/ad-copy/`, `skills/landing-page-copy/`,
  `skills/direct-response-copy/`, and `skills/tweet-copy/` — one per
  format contract, documenting that format's `format/*` rules alongside
  the craft guidance for writing into it. The three marketing skills are
  adapted from Rob Palmer's copywriting skills under CC BY 4.0;
  `tweet-copy` is adapted from Sergey Bulaev's `x-post-writer` under
  the MIT licence. Each carries its attribution.
- `CLAUDE.core.md` — fills a Hedgehog project's root `CLAUDE.md`
  `{{CORE_SECTION}}` placeholder for this core.
- `hedgehog-core.yaml` — this package's manifest.

## Running the gate directly

In this repo (against `workspace/scripts/check-copy/`) or in a project
this core installed into (against `scripts/check-copy/`):

```
cd scripts/check-copy && npm install   # or workspace/scripts/check-copy in this repo
node index.mjs path/to/draft.md
node index.mjs path/to/post.md --brief path/to/brief.md
node index.mjs path/to/post.md --format tweet --premium
```

Exits 0 with `pass: true` in the JSON report when no error-severity
violation fired; exits 1 with `pass: false` otherwise. `--brief` reads the format and Premium from a brief; `--format`
takes
`prose` (the default), `ad`, `landing-page`, `direct-response`, or
`tweet`, and an unrecognised value exits 2 rather than silently falling
back. The report's `metrics.format` names the contract that ran.

## Tests

```
npm test
```

Runs `workspace/scripts/check-copy`'s test suite (Node's built-in test
runner) against both intentionally AI-sounding and genuinely clean
sample text, confirming the gate actually discriminates rather than
rubber-stamping. `test/formats.test.mjs` does the same per format, and
pins the hole the format contracts were written to close: the
over-limit post and the non-compliant ad it opens with both passed the
universal contract with zero errors before those rules existed.
