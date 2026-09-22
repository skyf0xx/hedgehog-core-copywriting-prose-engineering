## This project's core: copywriting

A gate, not a style guide: `scripts/check-copy/` runs deterministic
AI-tell and prose-quality checks against a piece of copy and returns a
structured pass/fail report, so a draft is judged by a script's exit
code, not by an agent's own read of its work. Every piece of copy this
project produces goes through the `draft` layer's loop — write, run the
gate, revise on what it actually flags, repeat until it passes or the
iteration cap surfaces a real conflict between the brief and the
contract.

### The skills — invoke these, don't improvise

- **`hedgehog-copywriting-loop`** — the operating loop for this core,
  start to finish: brief intake, then the draft/checkCopy()/revise
  cycle. Invoke it at the start of any copy-writing session and for
  "what's next"; it owns the iteration cap and what counts as a real
  pass.
- **`tells-detector`** — reference for what `scripts/check-copy`'s
  AI-tell rules (`tells/*`) actually check and why: banned vocabulary,
  negation formulas, hedge stacks, copula avoidance, em-dash and
  rule-of-three density.
- **`prose-quality`** — reference for what `scripts/check-copy`'s
  prose-quality rules (`prose/*`) actually check and why: passive
  voice, weasel words, readability score, sentence-length variance,
  nominalization density.

The two above are universal and run against every draft. Four more
skills — `ad-copy`, `landing-page-copy`, `direct-response-copy`,
`tweet-copy` — each document one per-format contract (`format/*`); the
brief's `type:` field selects exactly one per project. Read the skill
matching the copy type before drafting, since a format contract shapes
the draft rather than only grading it afterwards — see the skill files
themselves for what each one covers.

### The agent

`copy-writer` runs the `draft` layer: reads the locked brief and its
`type:`, drafts into `.hedgehog/copy/final.md`, and iterates against the
gate until it passes or a real conflict surfaces. See that agent file
for the full constraint set, including the `--format` rule.

## The constants (do not deviate)

### The gate (locked)

**`scripts/check-copy/index.mjs`** — the one command that decides
whether a draft is done:

```
node scripts/check-copy/index.mjs <file> [--format <type>] [--premium]
```

Exits 0 and reports `pass: true` when no error-severity violation
fired; exits 1 with `pass: false` otherwise.

`--format` is one of `prose` (the default), `ad`, `landing-page`,
`direct-response`, or `tweet`, and comes from the brief's `type:` field.
The AI-tell and prose contracts run either way; the format contract adds
what those rules cannot see, which is whether the copy obeys the medium
it ships into. A 446-character post is a defect no prose rule can catch,
because nothing about its sentences is wrong. `metrics.format` in the
report names the contract that ran.

This core ships one fixed rule set per format — general-audience
defaults (Flesch Reading Ease floor of 50, Flesch-Kincaid grade ceiling
of 10) plus the selected format's own contract, not a per-project voice
profile. A format contract only ever adds to the universal pair and
never relaxes it, so no copy type is licensed to sound more like an LLM
because of where it ships. A genuine mismatch (a technical register
that needs jargon the gate flags, a document that must stay dense) is a
signal to extend the contract deliberately, not to work around a
warning or error silently on a per-draft basis.

### Layout

Everything below lives inside `$TMPDIR`, a temporary directory created
fresh per invocation and deleted once the loop finishes — see
`hedgehog-copywriting-loop`'s "Phase -1: ephemeral scratch setup." None
of it is visible in, or written to, the directory the user actually
started in.

```text
scripts/check-copy/       the gate: index.mjs (CLI entry), rules/tells.mjs,
                           rules/prose.mjs, rules/formats/ (the per-type
                           contracts), report.mjs (zod-validated output shape)
.hedgehog/
  copy/
    00-brief.md            what's being written, its type, for whom, in
                             what register
    final.md                the draft under iteration, gated by check-copy
  hedgehog.db               the build graph — the copy intent, its two
                             compiled layers, verifications, committed to git
```

The one exception is `$ORIGDIR/<slugged-title>.md` — the courtesy
export, dropped outside `$TMPDIR` entirely, at the directory the user
was actually in when the loop started. It's a plain-file copy of
`final.md`, written once draft verify passes, for a non-technical writer
to find without knowing anything above exists. The gated artifact stays
`.hedgehog/copy/final.md` inside `$TMPDIR`; this copy is never read back
by anything in the loop.

### Core rule

**A pass is a script exit code, not a sentence.** No copy ships on the
strength of "this reads clean" — it ships because
`node scripts/check-copy/index.mjs` said so, under the format its brief
named, checked at both the informal drafting loop and again at
`hedgehog verify`.
