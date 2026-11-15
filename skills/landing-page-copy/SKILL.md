---
name: landing-page-copy
description: Reference for what scripts/check-copy's landing-page format contract actually flags and why: page length, headline, call to action, proof, wall-of-text paragraphs, unqualified claims. Read this to understand a `format/*` violation on a short-form bridge or pre-sell page before revising against it, not to hand-grade a draft in place of running the script.
---

# Landing page copy

> Adapted from the `landing-page-copy` skill by Rob Palmer
> (https://github.com/robpalmer99/claude-code-copywriting-skills),
> used under CC BY 4.0.

`scripts/check-copy/rules/formats/landing-page.mjs` is the actual gate
for this format. This skill explains what that module checks, why each
check exists, and how to write a page that clears it on the first pass
rather than the fourth. It never substitutes for running the script.
The gate runs like this:

```
node scripts/check-copy/index.mjs <file> --format landing-page
```

The universal contracts run underneath every format. `tells-detector`
and `prose-quality` fire on this draft exactly as they fire on any
other, and a format module only ever adds rules on top of them. No copy
type is licensed to sound more like an LLM because of where it ships.

## Scope

This format is the short-form landing page: the bridge page or pre-sell
page that sits between an ad and a VSL, video, quiz, or offer. Its one
job is the clickthrough.

A long-form sales page is a different animal with a different contract.
Price, offer stack, guarantee, objection handling, and close all belong
to `direct-response-copy` and its module,
`scripts/check-copy/rules/formats/direct-response.mjs`. If the brief
asks for a page that sells rather than a page that hands off, brief it
there. The `format/page-length` warning below is the gate saying the
same thing.

The traffic arriving on this page comes from `ad-copy` and
`scripts/check-copy/rules/formats/ad.mjs`. Read that skill alongside
this one whenever the ad and the page are being written together,
because message match (below) is what decides whether the click
survives the transition.

## What the gate checks

- **`format/page-length`** (warning, over 500 words). A bridge page
  that runs long has stopped being a bridge page. The reader came from
  an ad and is deciding in seconds. The message says so directly: past
  500 words it is a sales page and should be briefed as one, which
  means moving it to `direct-response-copy` rather than trimming
  arbitrarily until the number goes green.
- **`format/missing-headline`** (error). No `# ` headline anywhere in
  the file. The page opens with exactly one H1 carrying the promise.
  Ogilvy's count holds: five times as many people read the headline as
  read the body, so a page without one has no top.
- **`format/headline-length`** (warning, over 90 characters). A
  headline that wraps to three lines on a phone loses the scroll before
  the promise finishes landing. Ninety characters is roughly two mobile
  lines.
- **`format/missing-cta`** (error). No call-to-action verb anywhere in
  the body. The module scans for `click`, `tap`, `watch`, `get`,
  `grab`, `start`, `try`, `book`, `claim`, `download`, `join`, `order`,
  `continue`, `see how`, `find out`. A page missing the CTA is not a
  weak landing page, it is not a landing page at all, which is why this
  one is an error rather than a warning. Name the action and name where
  it leads.
- **`format/missing-proof`** (warning). No digit anywhere in the body
  and no attribution verb (`said`, `says`, `told`, `according to`). A
  number, a named source, or a timeframe is what makes the promise
  credible. Without one the page is asking for trust it has not earned.
- **`format/wall-of-text`** (warning, per paragraph over 60 words).
  Mobile carries most of this traffic, and a 60-plus word paragraph is
  a grey slab on a phone that gets skipped whatever it says. Headings
  and table rows are exempt; every other paragraph is counted.
- **`format/unqualified-claim`** (error, per match). The shared
  claims check, run against the raw text. It catches guaranteed
  outcomes ("guaranteed you'll", "guarantees to"), absolute risk-free
  promises ("100% risk-free", "completely guaranteed"), "zero risk",
  "results are typical", "make money fast", "get rich quick",
  "no effort required", cure claims ("cures your", "cures all"), and
  specific weight-loss claims ("lose 30 pounds"). Ad networks suspend
  accounts over these, and a suspended account takes every page behind
  it down with the ad. The fix is to qualify the claim or cut it, never
  to reword around the pattern while keeping the promise.

Three rules are errors and block the gate: `format/missing-headline`,
`format/missing-cta`, and every `format/unqualified-claim` match. The
rest are warnings, real signal weighed against the brief per the
copywriting loop's step 3.

## What this page is, and is not

A short bridge page. Roughly 300 to 500 words in this contract. It
sits between the ad and the destination and hands the visitor across.

It is not a sales page: no price, no offer stack, no checkout. It is
not an advertorial: no long-form editorial. It is not a squeeze page:
no email capture. It is not a product page: no specs, no features, no
mention that a product is for sale at all.

The visitor's mental state on arrival is specific and worth writing
toward. They clicked an ad seconds ago. Three questions are live in
their head: is this legitimate, is this worth my time, and what is
this actually about? The page answers the first two with yes and keeps
the third one open. Curiosity that resolves on the page has nowhere
left to send them.

## The three-paragraph framework

Every winning bridge page carries the same three elements in the same
order. Each can expand to two or three short paragraphs on the page
itself, but the concepts stay fixed.

### Paragraph 1: the discovery (authority plus root cause)

An expert authority has found something new about the problem.

What goes in it:

- A named authority figure (a doctor, a scientist, a researcher) or a
  credible institution, taken only from the brief's source material.
  When the brief names none, leave a marked placeholder and report the
  gap; never invent one.
- A specific novel root cause. The symptom restated does nothing.
- Visceral language that makes the cause feel physical and present.
- A named mechanism that sounds proprietary and particular.

The shape, with placeholders filled only from the brief's source
material:

> [Named institution or expert from the brief] has found [specific
> root cause from the brief], [the mechanism, in concrete terms].

> [Titled source from the brief] reveals a simple [named mechanism]
> that helps [outcome from the brief], and it has nothing to do with
> [the usual fix].

Authority plus specificity plus novelty. The reader's reaction is that
this sounds credible and also different from everything already tried.
Authority patterns that carry weight: a titled expert, a research group
at a named institution, a named individual with geographic specificity.
Every one of them has to exist in the brief or its sources.

### Paragraph 2: social proof (results plus benefits)

Real people are already getting results from this method.

What goes in it:

- A specific count taken from the brief. "257,000 people" beats
  "thousands of people" every time, and it also satisfies `format/missing-proof`.
- Tangible results with a timeframe attached.
- The pain point being resolved, named in the reader's words.
- Optionally a named testimonial with a location.

> [Count from the brief] people have already [habit or action], and
> [result from the brief] keeps coming back the same way.

> [Named customer from the brief] was told there was no fix. [Timeframe
> from the brief] later, [specific result from the brief].

Proof strength runs in a rough order. A named testimonial with a photo,
specific results, and a location sits at the top. Below it, verified
review screenshots, then a case study with numbers and dates, then an
expert endorsement, then media mentions, then an aggregate user count,
then an anonymous testimonial at the bottom. Use the strongest proof
actually available, and match the proof type to the objection the
reader is most likely holding.

### Paragraph 3: the call to action (urgency plus direction)

Clicking the button becomes the only sensible next move.

What goes in it:

- Direct address ("If you or anyone you care about...").
- The problem restated, so the CTA connects back to the pain.
- Urgency drawn from the information rather than from a price.
- One clear action, named plainly.
- Button text carrying the benefit.

> If you or anyone you care about is dealing with high blood sugar,
> watch this 3-minute video before it comes down.

Urgency here cannot come from a discount, because nothing is for sale
on this page. It comes from the information: the video may be pulled,
the industry may get it removed, the reader should watch right now, the
watch itself is short. Three minutes is a low-friction ask, and saying
the runtime out loud lowers it further.

## Message match, ad to page

The page has to read as a continuation of the ad, never as a new
experience. If the ad said "7-second morning trick", the page says
"7-second morning trick" in the same words. Same mechanism name, same
authority figure, same promise, ideally the same opening image. Any
seam between the two reads as a bait-and-switch and the visitor
bounces before the first paragraph finishes.

Write the ad and the page as one unit whenever the brief allows it.
When they were written separately, read them side by side and reconcile
the vocabulary before either goes to the gate.

## The unique mechanism

The mechanism is what makes this different from everything the reader
has already failed with. On a bridge page it gets teased, never
explained.

Build it from a proprietary name, a one-line explanation, and a reason
it is different. Strong mechanisms share traits: credible (backed by an
institution or a named expert), rare (newly found, hard to come by),
small and specific (a 7-second trick beats a 20-minute routine), low
effort, and named. "The Glucose Flush Method" works. "A healthy
lifestyle change" does nothing.

The test is substitution. Swap your mechanism name for a competitor's.
If the page still reads fine, the mechanism carries no weight and the
page is running on generic claims.

### The mechanism tease

Give enough for credibility and keep the resolution behind the click.
Say what it is in category terms (a plant, a method, a technique). Say
what it is not. Drop a specific hint that is vivid and unresolvable
from the page alone: it is 150 million years old, it is smaller than a
nickel, it grows only above 12,000 feet. The reader closes the loop by
clicking.

## The "nothing to do with" pattern

Eliminating the reader's existing mental models makes the mechanism
feel genuinely new and removes objections in the same stroke.

> This has nothing to do with genetics, diet, exercise, or medication.

Each eliminated option kills an objection the reader was already
forming and deepens curiosity about what the answer actually is. Keep
the list to three or four items. Longer runs read as filler.

## Visceral language

Make the problem felt rather than understood.

| Clinical | Visceral |
|---|---|
| cellular buildup | toxic blanket |
| dead cells | clingy zombie cells |
| reduced insulin output | complete shutdown of insulin production |
| affects your body | attacks your body |

Reach for sensory words: slimy, clingy, burning, stabbing, crushing.
The medical-textbook register kills a bridge page faster than a weak
headline does.

## Intrigue intensifiers

Four moves that raise curiosity without adding claims.

- **Say what it is not.** "It is not a diet. It is not a supplement.
  It is not exercise or willpower."
- **Say where it is not.** "You will not find it in a store, a
  pharmacy, or on any website."
- **Drop a specific hint.** "It is 150 million years old." "A Boston
  lab announced it last week."
- **Anchor to authority.** "Experts call it..." "Over 100 medical
  reports now show..."

## The 60-second sales hook

Kevin Rogers' four-part formula, for pages that lead with a personal
story instead of an institutional discovery.

**Identity, then struggle, then discovery, then result.**

> Hi, I am [name], a [age and role] from [place]. For years I fought
> [specific problem]. Then I found [mechanism]. Now I [specific
> result], and [life change].

The rapport comes from vulnerability and from specificity together.
A vague struggle builds nothing.

## Headline formulas

The headline sits above the body and sets up the three paragraphs. Keep
it under 90 characters so `format/headline-length` stays quiet and the
line stays readable on a phone.

- **Authority plus mechanism plus benefit**: "[Brief's named expert]:
  do this to [outcome]"
- **Percentage plus discovery**: "[Percentage from the brief] of people have
  never heard of [named discovery]"
- **Mechanism plus timeframe**: "Simple 7-second glucose flush helps
  manage high blood sugar"
- **Question**: "Can one enzyme restore normal blood sugar?"
- **Urgency plus benefit**: "10-second cold water trick balances blood
  sugar overnight"
- **Story hook**: "How a 10-second method brought my wife's vision
  back"

Note the character budget. Every formula above lands well inside 90
because the mechanism does the work rather than the adjectives.

## Formatting

Mobile is the primary context. Most of this traffic arrives on a phone,
which is the reason `format/wall-of-text` is a real rule and not a
taste preference.

**Mobile first:**

- Two or three sentences per paragraph, hard ceiling. Sixty words is
  where the gate starts complaining, and the gate is generous.
- Large type. Thumb-readable without pinching.
- Tall, wide, high-contrast CTA buttons the thumb cannot miss.
- Every word earns its place. Cut without mercy.
- If a paragraph looks like a slab on a phone screen, split it.

**Desktop:**

- Generous paragraph spacing.
- Bold or highlight the discovery, the numbers, and the CTA line.
- Ample line height for scanning.
- Color emphasis on the key claim and on the button.

**CTA button text:**

Benefit-forward, never generic. "Watch the free video" beats "Click
here". "Watch video now" beats "Submit". Place it directly after the
final paragraph, and repeat it once mid-page on anything past 400
words. Worth testing against each other rather than settling by taste.

## Angle variations from one source

The fastest route to bridge page copy is extraction rather than
invention. Pull the discovery, the mechanism, the authority figure, the
proof numbers, and the pain points out of the offer's existing
material, then organize them into the three-paragraph framework.

Ship two or three variations testing different angles against the same
source, and label each one so it can be tested cleanly:

```
## Variation 1: authority discovery

### Headline
[authority plus mechanism plus benefit]

### Body
[paragraph 1: discovery]

[paragraph 2: proof]

[paragraph 3: CTA]

### CTA button text
[button text]
```

Angles worth putting into rotation:

- **Authority discovery**: open on the researcher or the institution.
- **Proof first**: open on the number of people already getting
  results.
- **Story**: open on one named person's transformation.
- **Mechanism mystery**: open on the "nothing to do with" elimination.
- **Visceral problem**: open on a vivid picture of the root cause.

Each variation is a separate file and gets its own gate run.

## Voice and anti-patterns

**Sounds like:** a friend urgently passing along something they just
found out. A news report on a breakthrough. Someone genuinely excited
about results they have watched happen. Conversational, quick, a little
breathless.

**Does not sound like:** a sales pitch (nothing is for sale here). An
AI (see `tells-detector`). A medical textbook. Generic marketing
uplift. Over-produced copy that opens on the state of the modern world.

**Words to ban.** The AI tells are already error-severity under
`tells/banned-word`, and that list is documented in `tells-detector`
rather than repeated here, since writing it out would fail this very
file. On top of it, this format has its own dead vocabulary the gate
cannot see:

- Marketing filler: "are you ready to", "take your X to the next
  level", the fast-paced-world opener, "you won't believe".
- Hedging verbs in the promise: can, could, should, might, may. A
  bridge page states.

**Readability.** Aim below Flesch-Kincaid grade 6 on this format, well
under the general-audience ceiling of 10 that `prose-quality` enforces.
Short sentences, plain words. A page a twelve-year-old would stumble
over is a page that loses cold traffic.

**The read-aloud test.** Read the draft out loud. If it sounds like
someone telling a friend about something they just found out, it works.
If it sounds like copy, rewrite it.

## When a violation looks wrong

A brief that genuinely needs more than 500 words, or a claim that
genuinely needs the absolute phrasing the shared claims list catches,
is a signal that the brief and this format contract are in tension. The
usual cause is that the piece is a sales page filed under the wrong
format, in which case `direct-response-copy` is the right home for it
and the fix is to rebrief rather than to trim.

Either way, raise it to the user per `hedgehog-copywriting-loop`'s rule
on extending the contract. Never reword a draft purely to dodge a
specific regex while the thing the rule flagged stays in the copy.
