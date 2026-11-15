---
name: ad-copy
description: Reference for what scripts/check-copy's Meta ad format contract actually flags and why: the three-field structure, Meta's hard character limits, the 125-character "See more" fold, button-label headlines, missing CTAs, and the unqualified claims that get ad accounts suspended. Read this to understand a `format/*` violation on `--format ad` before revising against it, and for the craft of writing toward the contract, not to hand-grade a draft in place of running the script.
---

# Ad copy

> Adapted from the `ad-copy` skill by Rob Palmer
> (https://github.com/robpalmer99/claude-code-copywriting-skills),
> used under CC BY 4.0.

`scripts/check-copy/rules/formats/ad.mjs` is the actual gate for this
format, and this skill explains what it checks and why. Invoke it as:

```
node scripts/check-copy/index.mjs <file> --format ad
```

The universal contracts (`tells-detector`'s `tells/*` rules and
`prose-quality`'s `prose/*` rules) always run underneath. The ad module
only ever adds to them. No copy type is licensed to sound more like an
LLM because of where it ships, so an ad still has to clear the same
banned-vocabulary and readability bar as an essay. Never substitute a
manual read of this list for actually running the script; the whole
point of this core is that the check is mechanical.

## The input shape the gate expects

A draft names its fields as markdown sections:

```
## Primary text
...

## Headline
...

## Description
...
```

The section lookup accepts aliases, so `## Body` or `## Ad copy`
resolves to primary text, `## Title` to headline, and
`## Link description` to description. A draft with no sections at all
is read as primary text alone, which means a one-field hook brainstorm
still gets checked rather than passing silently. As soon as the draft
has any sections, though, one of them has to be primary text.

## What the gate checks

- **`format/missing-field`** (error). The draft has sections but none
  of them is primary text. Primary text carries the sell; a headline
  and description with nothing above the creative is not an ad.
- **`format/primary-text-length`** (error). Primary text over Meta's
  2200-character maximum. The platform rejects past this, so it is a
  hard defect rather than a style opinion.
- **`format/weak-hook`** (warning). Primary text runs past the
  125-character "See more" fold mid-thought. The rule only fires when
  the visible slice fails to end cleanly: it passes if the first 125
  characters close on `.`, `!`, `?`, or `:`, or if a line break falls
  inside them. A hook cut off mid-sentence with no open loop shows the
  reader a truncated fragment, and the reader scrolls.
- **`format/missing-cta`** (error). No call to action in the primary
  text. The check looks for an imperative verb (click, tap, get, grab,
  start, try, book, claim, download, watch, see, join, order, shop,
  learn), or a friction-reducing offer word in the description (free,
  no credit card, instant). An ad with neither is a post.
- **`format/headline-length`** fires twice over. Past Meta's
  40-character maximum it is an **error**, because the platform rejects
  the ad. Past 27 characters it is a **warning**, because mobile
  truncates around there and the tail goes unread. Display truncation
  is a tradeoff a writer can knowingly accept; platform rejection is
  not.
- **`format/weak-headline`** (error). The headline is a button label
  rather than a second hook. The list is exact: "learn more", "click
  here", "check this out", "find out more", "read more", "see more",
  "shop now", "sign up", "get started", "discover more", "act now".
  Meta already renders a CTA button; spending the headline slot
  repeating it throws away the ad's second-best piece of real estate.
- **`format/description-length`** (error). Description over Meta's
  30-character maximum. Platform rejection again.
- **`format/unqualified-claim`** (error, one per match). Guaranteed
  outcomes ("guaranteed you'll", "guarantee to"), absolute risk-free
  promises ("100% risk-free", "completely guaranteed"), "zero risk",
  "results are typical", make-money-fast, get-rich-quick, "no effort
  required", cure claims ("cures your"), and specific weight-loss
  claims ("lose 30 lbs"). These are errors rather than warnings for a
  blunt commercial reason: ad networks suspend accounts over them. A
  rejected ad costs an afternoon. A suspended ad account costs the
  channel, and Meta's appeal process is slow and frequently
  unsuccessful. The fix is to qualify the claim (name the study, name
  the timeframe, name the person it happened to) or cut it. This check
  runs across the whole draft, including the headline and the
  description.
- **`format/missing-proof`** (warning). Primary text over 200
  characters with no digit anywhere in it and no attribution verb
  (said, says, told, according to). A number, a named source, or a
  timeframe all satisfy it. Past 200 characters the ad has stopped
  being a hook and started making an argument, and an argument with no
  proof reads as an assertion.

## The three fields and what each one does

Meta renders three text fields around the creative, and each has a
different job.

**Primary text** sits above the creative, capped at 2200 characters,
with roughly the first 125 visible before "See more". This is the main
sell. Treat those first 125 characters as a headline in their own
right.

**Headline** sits below the creative, capped at 40 characters, with
mobile truncating around 27. Use it for a second hook carrying a
specific benefit. Compare "Learn more" against "The 7-second
morning fix", "Why diets fail after 40", or "23 lbs in 8 weeks". The
last three each promise something particular and open a question.

**Description** sits below the headline, capped at 30 characters, and
is often hidden entirely on mobile, so load-bearing information does
not belong in it. Use it for friction reduction: "Free shipping", "No credit card
needed", "2-minute read".

Placement changes what survives. In Feed the primary text shows with
125 visible and the headline shows. In Stories and Reels the primary
text is truncated heavily and the headline may not appear at all. In
the right column the primary text is hidden and only a truncated
headline shows. Write so the ad still works when the fields you cannot
count on disappear.

## Structuring primary text for the fold

For most impressions the first 125 characters are the entire ad. What
follows is read only by people who chose to expand, and that expansion
click is itself a micro-conversion: anyone who taps "See more" is
already engaged.

```
[Hook: first 125 characters. Land a complete thought or an open loop.]
                                           <- the "See more" break
[Expand: agitate the problem, tease the mechanism, drop proof.]
[CTA: name the next step.]
```

The gate's `format/weak-hook` warning encodes the failure mode. A
sentence sliced through its middle at character 125 gives the reader a
fragment with no reason to expand. Two ways to satisfy it: end a
sentence before the fold, or put a line break inside the first 125
characters so the visible portion reads as a deliberate unit. Line
breaks also buy white space in feed, which helps readability on a
phone. One or two emoji can break the visual pattern; more than that
reads as noise.

## Schwartz's five levels of awareness

Eugene Schwartz's model decides the headline, the copy length, the
angle, and where the click should land. The rule underneath is that
the less the reader already knows, the longer and more indirect the
copy has to be.

| Level | Lead with | Length | Send to |
|---|---|---|---|
| Unaware | Identity or emotion, not the problem | Long, educational | Advertorial |
| Problem-aware | Name the pain vividly, tease a mechanism | Medium-long | Long-form sales page or advertorial |
| Solution-aware | Differentiate your mechanism | Medium | Sales page or long product page |
| Product-aware | Handle objections, add proof | Short-medium | Product page |
| Most-aware | Lead with the deal | Short | Checkout or offer page |

An unaware reader has no idea a problem exists, so an ad that opens
with the product is answering a question they have not asked. A
most-aware reader already knows the product and is waiting on a reason
to act now, so an ad that opens with education wastes their patience.
Both failures look identical in the report (a clean pass) and different
in the results, which is why the gate cannot catch them and you have
to.

## Funnel position and the sell-the-click decision

Funnel position is a separate axis from awareness. Cold traffic knows
nothing about you, so lead with problem or curiosity and expect to
educate. Warm traffic has seen you before, so go more direct and lean
on the mechanism. Retargeting has already visited the page, so handle
objections, bring social proof, and add urgency.

The larger strategic call is what the ad itself is for.

**Sell the click.** A short caption, a curiosity-driven image or video,
minimal information revealed. The ad's only job is the click; the page
it lands on does the selling. Best for unaware and problem-aware
audiences, products that need explaining, and high-ticket offers.

**Sell the solution.** A longer video with education, visual demos, and
proof. The ad does most of the selling and the page only has to close.
Best for solution-aware audiences and up, simple or visual products,
and lower price points.

One rule connects the two: showing the product in the ad makes the
viewer product-aware. Sending a product-aware viewer to a page written
for someone who has never heard of the product wastes the awareness you
just created. Send them to a product or offer page instead. Large
advertisers commonly run both strategies at once against different
audiences.

Where the click lands is a separate contract with its own gate. See
`landing-page-copy` for short-form pages and `direct-response-copy` for
long-form sales pages.

## Hooks

The hook is the biggest single lever in ad performance, which is why it
is also the thing to test most.

| Type | Shape | Use when |
|---|---|---|
| Curiosity | "There's a reason [the usual source] won't mention [the topic]" | Cold, unaware |
| Contrarian | "Everything you've been told about X is wrong" | Problem-aware, skeptical |
| Social proof | "Over [count from the brief] [audience] have tried [named method]" | Solution-aware and up |
| Story | "Last [month] I [real starting situation from the brief] and [what was said]" | Cold, emotional markets |
| Demographic callout | "Attention men over 50 who..." | Cold, tightly targeted |
| Result | "I [real result from the brief] in [timeframe] without [real tradeoff avoided]" | Warm, retargeting |
| Pattern interrupt | "Stop scrolling. This actually matters." | Cold, saturated markets |
| Fascinating fact | "Your liver processes 500+ chemicals before breakfast" | Unaware, education-first |

Hook rules:

- Every figure, person, and result in a hook comes from the brief or its
  source material; the bracketed slots above are filled from there, never
  invented.
- The first line of text (or the first three seconds of video) has to
  arrest attention on its own.
- Keep the curiosity fragmented and open-ended. A complete fascination
  closes the loop and removes the reason to click.
- Be specific. "47,312 women" outperforms "thousands of women" because
  the odd number reads as counted rather than claimed.
- Hint at what the reader will discover without revealing it.
- Say what it is not to intensify what it is. Rule out a diet, then a
  pill, then exercise, and the reader leans in on what is left.
- A winning hook can run for months. Keep testing new ones against it.

### The curiosity toolbox

**Open loops** create an information gap that only a click closes.
"I tested 47 headlines. One pattern beat everything else by 3x."
The reader now wants to know which pattern.

**Tangible curiosity** makes the gap concrete. "Discover the secret to
weight loss" is vague enough to ignore. "Discover the 7-second morning
trick that targets the fat cells your body forgot about" names a
duration, a time of day, and a mechanism, so there is something
specific to be curious about.

**Bucket brigades** are transitions that pull the reader forward: "But
here's the thing...", "Here's what I discovered...", "This is where it
gets interesting...", "Wait, it gets better...", "Now here's what
nobody tells you...". Use two or three per ad. Ending every paragraph
on a bridge gets tiresome fast.

### Intrigue intensifiers

- **Say what it is not.** "It isn't a diet. It isn't a supplement.
  It isn't exercise. It isn't willpower."
- **Say where it is not.** "You won't find it in any store, any
  pharmacy, any website."
- **Drop a specific hint.** "It's 150 million years old." "It's smaller
  than a nickel." "It grows only above 12,000 feet in the Andes."
- **Anchor to authority.** A named institution, a named study, a named
  publication. Vague attribution of the "some researchers reckon" kind
  is banned outright by `tells/banned-phrase`, so name the source or
  drop the claim.

The mechanism itself is what makes the solution different from
everything the reader already tried. Strong mechanisms are credible
(backed by the most authoritative source available), rare or hard to
find, small and specific (a "7-second trick" beats a "20-minute
routine"), and low-effort to apply.

## The WHY / WHAT / HOW structure

A fill-in-the-blank spine for primary text, from Alen Sultanic.

**WHY (the problem).** Open with curiosity or a contrarian claim, name
the problem, agitate it.

> "Why does ____ matter more than ____ after ____?"
> "Experts are calling it the '____'. But that's not what it is."
> "It hits from all sides: ____ stress, ____ stress, ____ stress."

**WHAT (the mechanism).** Pivot to how the solution works, and tease it
without giving it away.

> "There's another way, one that focuses on ____ instead of ____."
> "Using this approach, 12,000 people have ____ in under ____."

**HOW (the product and CTA).** Reveal exactly enough to make the click
the obvious next move.

> "Tap below to see how ____ works for ____."

Note that the CTA is what satisfies `format/missing-cta`. Write it as
a benefit the reader gets by clicking, and use an imperative verb so
the gate can see it.

## Proof, credibility, and the "So what?" chain

Every claim in an ad needs support, and short-form forces that support
to be compressed. What counts:

- **Specific numbers.** "47,312 customers" over "thousands of
  customers".
- **Named results.** "Sarah lost 23 lbs" over "our customers love it".
- **Timeframes.** "in 8 weeks" over "fast results".
- **Authority.** A named publication, institution, or study.
- **Visual proof.** Before and after, screenshots, a demo.
- **Social proof.** User counts, review ratings, waitlist numbers.

`format/missing-proof` is a crude proxy for all of this: it only looks
for a digit or an attribution verb in primary text over 200 characters.
Passing that check is not the same as having proof. It is the floor.

The **"So what?" chain** converts a feature into the line the ad
actually runs. Ask "so what?" until you hit something emotional or
financial.

> Feature: fast database.
> So what? Queries return in milliseconds.
> So what? Users stop bouncing and revenue stops leaking.
> So what? You stop waking up at 3am worrying about churn.

Three levels down is where the copy lives. Write "close your laptop at
5pm instead of 9pm" rather than "saves 4 hours a week".

## UGC and video scripts

Two short-form video shapes belong in this format. Long-form video
sales letters are a different contract; see `direct-response-copy`.

**Short talking head (15 to 60 seconds).** The goal is to look and
sound like a real person filmed it on a phone.

```
[HOOK 0-3s]      Pattern interrupt, question, or bold claim.
                 VISUAL: talking to camera, casual setting.
[PROBLEM 3-10s]  Name the pain specifically enough that they nod.
                 VISUAL: relatable scenario.
[MECHANISM 10-25s] Tease the discovery, explain just enough.
                 VISUAL: showing or demonstrating the product.
[RESULT 25-40s]  A specific transformation with numbers.
                 VISUAL: the result, genuine reaction.
[CTA 40-60s]     Natural close that sounds like a recommendation.
                 VISUAL: direct to camera.
```

**Story-style video (60 to 120 seconds).** A personal narrative arc,
strongest in emotional markets. Open in the middle of the struggle
("Six months ago I couldn't look at myself in the mirror"), move
through failed attempts, then the turning point, then a transformation
with real numbers and a real timeline, then close on a recommendation
rather than a pitch.

Voice rules for both: first person and conversational, occasional
verbal filler ("honestly", "I mean") for authenticity, concrete details
over vague claims, and a CTA that sounds like advice to a friend. Mark
on-screen action with `[VISUAL]` notes.

The authenticity test before delivering any script: would a real person
say this out loud, on camera, to their own phone? If it sounds like a
copywriter wrote it, rewrite it. A UGC script should read slightly
imperfect, because that is what makes it believable.

## Testing and variation

Any ad request should produce three to five variations, each labelled
with its angle, because the point of an ad is to find out which angle
wins rather than to guess correctly the first time. The default set:

```
## Variation 1: curiosity hook
### Primary text
### Headline
### Description

## Variation 2: contrarian hook
...

## Variation 3: social proof hook
...
```

Run the gate on each variation file. A variation that fails on a
headline length or an unqualified claim is not a variation, it is a
rejected ad.

Test in order of impact: hooks first (the same ad body with five to ten
different openings), then images and thumbnails, then caption length
(short click-sellers against long story-sellers), then video length,
then the copy angle. The pattern that works: a control creative runs
continuously while new hooks are tested against it, and a hook that
wins becomes the new control.

## Voice and anti-patterns

The universal contracts already ban the AI vocabulary, so read
`tells-detector` for that list. The ad-specific additions:

**Ad clichés to cut.** "Click the link in my bio", "you won't
believe", "take your X to the next level", "are you ready to".

**Hedging verbs.** Clayton Makepeace's rule: can, could, should, might,
may, ought to. Say what the product will do. Stacking two of them fires
`tells/hedge-stack` as an error anyway.

**Structural tells.** Every sentence the same length, every bullet
opening the same way, grammar so clean it reads as written rather than
spoken, and too many headings for the length. `prose/low-burstiness`
catches the first of these mechanically.

**Readability.** Aim low. Short sentences, plain words. The universal
contract's grade ceiling is 10; good ad copy usually lands well under
it.

Read the ad aloud before delivering it. Makepeace's tingle factor: the
chain from the first line to the click breaks wherever the reader gets
bored, stops believing you, or loses the thread. Where the reading goes
flat is where you rewrite.

Last pass before delivery, checking things the gate cannot see:

1. Does the first line stop the scroll?
2. Is every claim attached to a specific number or proof point?
3. Does it sound like a person talking?
4. Is there an open loop pulling toward the click?
5. Is it about the reader's transformation or about your product?
6. Does the rhythm alternate between punchy and breathing room?
7. Is the CTA benefit-driven rather than a bare command?

## When a violation looks wrong

The length rules and `format/weak-headline` are close to
unarguable, since they encode what the platform does. The judgment
calls sit elsewhere.

`format/missing-cta` matches on a verb list, so an ad whose call to
action is phrased without one of those verbs ("Your seat is waiting")
will fire it. That is usually the rule being right: an ad that never
names the next step in plain words is asking the reader to infer it.

`format/unqualified-claim` fires on a substantiated claim as readily as
on a made-up one, because the regex cannot see your evidence. A real
clinical result still gets flagged, and it still needs qualifying
before it ships, so the fix is to add the qualification rather than to
argue with the flag.

Where a flag genuinely does not fit the brief (a B2B ad in a register
that the general-audience reading-ease floor penalizes, or a regulated
category whose required disclaimer language trips a prose rule), that
is a signal the brief's register does not match this core's default
contract. Raise it to the user per `hedgehog-copywriting-loop`'s rule
on extending the contract, rather than working around the flag
silently.
