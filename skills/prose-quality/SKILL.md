---
name: prose-quality
description: Reference for what scripts/check-copy's prose-quality rules actually flag and why — passive voice, weasel words, repeated words, readability score, sentence-length variance, nominalization density. Read this to understand a `prose/*` violation before revising against it, not to hand-grade a draft in place of running the script.
---

# Prose Quality

`scripts/check-copy/rules/prose.mjs` is the actual gate — this skill
explains what it checks and why. Where `tells-detector` catches
vocabulary and phrasing that specifically mark text as LLM-generated,
this rule set catches prose weaknesses that make writing hard to read
regardless of whether an AI wrote it — the classic style-guidance
lineage (Orwell's six rules, Strunk & White's "omit needless words" and
active-voice preference, Gary Provost's sentence-rhythm principle,
Helen Sword's "zombie nouns") made mechanical.

Backed by real libraries rather than hand-rolled heuristics: the
`retext` ecosystem (`retext-passive`, `retext-intensify`,
`retext-repeated-words`) for grammatical pattern detection,
`write-good` for wordy-phrase and cliché heuristics, and `flesch` /
`flesch-kincaid` for genuine readability formula scores — the same
class of tool `proselint` and Vale use, not a from-scratch
reimplementation of syllable counting or sentence tokenization.

## What each rule catches

- **`prose/passive-voice`** — flagged by `retext-passive`'s grammatical
  pattern match. Orwell's rule 4 and Strunk & White's Rule 14: active
  voice names an actor, passive voice often hides one ("mistakes were
  made" vs. "we made mistakes").
- **`prose/weasel-word`** — vague qualifiers ("very," "quite,"
  "arguably," relative "that") from `retext-intensify`. These words
  often do no real work; cutting them rarely changes the sentence's
  truth value.
- **`prose/repeated-word`** — accidental lexical duplication ("the the
  mat") from `retext-repeated-words`. Always an error, never a style
  choice.
- **`prose/hard-to-read-sentence`** — individual sentences flagged by
  `retext-readability` as dense relative to a general-audience target.
- **`prose/write-good`** — wordy or unneeded phrases ("due to the fact
  that" → "because") and clichés, from the `write-good` library. Runs
  alongside `retext-passive` with overlap deduped so a single passive
  clause isn't reported twice from two sources.
- **`prose/reading-ease`** / **`prose/grade-level`** — document-level
  Flesch Reading Ease and Flesch-Kincaid Grade scores, computed from
  real sentence/word/syllable counts (not a per-sentence proxy). The
  default contract targets general-audience copy: Reading Ease floor
  of 50, Grade ceiling of 10. A technical document that must use
  jargon will legitimately score below this — see the note on
  extending the contract below.
- **`prose/low-burstiness`** — sentence-length standard deviation below
  3 words across a document with 4+ sentences. Gary Provost's
  principle: uniform sentence length reads as mechanical regardless of
  word choice; human writing mixes short and long on purpose.
- **`prose/nominalization-density`** — words ending in -tion/-ment
  /-ance/-ence at more than 3% of total words. Helen Sword's "zombie
  nouns": turning a verb into an abstract noun ("implementation" for
  "implement") removes the actor and adds length without adding
  meaning.
- **`prose/wall-of-text`** — a single paragraph over 100 words. A wall of
  text reads as dense and mechanical regardless of medium — this is the
  universal counterpart to the `landing-page` format's tighter 60-word
  mobile ceiling (`format/wall-of-text` in `rules/formats/landing-page.mjs`),
  and applies to every draft the gate checks, not just that one format.

## Enumeration reads better as a list

No rule catches this mechanically, but it's the same family of defect
as low-burstiness and nominalization density: a shape that reads as
mechanical or dense even though no single sentence is wrong. A
paragraph naming two or more things in a row ("...went out at 457
characters... A Meta ad shipped with...") reads denser and more
repetitive than the same content broken into a list or numbered
points, especially once a reader is scanning rather than reading
straight through. The gate won't fail a paragraph for this; rewrite
toward the list anyway before presenting a draft.

## Errors vs. warnings

Only `prose/repeated-word` is error-severity — an unambiguous defect.
Everything else is a warning: real signal, but a judgment call against
the brief's register, per `hedgehog-copywriting-loop`'s step 3. A
warning-only report still passes the gate; don't chase every warning to
zero at the cost of a sentence that reads worse for it.

## When a violation looks wrong

A domain that genuinely requires a lower reading-ease score (deep
technical documentation, a regulatory notice) or heavier passive voice
(a process description with no clear actor) is a signal the brief's
register doesn't match this core's default general-audience contract —
raise it explicitly rather than silently accepting a failing or
warning-heavy report as "good enough for this case."
