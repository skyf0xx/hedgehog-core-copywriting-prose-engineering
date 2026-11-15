// Format-contract tests. The point of every one of these is the pair:
// copy that violates its medium must fail, and good copy in the same
// medium must pass. A rule that only ever fires, or never fires, is not
// a gate.
//
// The two "regression" tests at the top pin the exact hole these rules
// were written to close: before formats existed, both of these drafts
// passed the universal contract with zero errors.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCopy, readBriefOptions } from '../index.mjs';

const rules = (report) => report.violations.map((v) => v.rule);

test('regression: an over-limit, hashtag-stuffed, bait-filled post passes prose but fails the tweet contract', async () => {
  const text = `Unpopular opinion: most founders are building the wrong thing.

I talked to a lot of founders this year and the pattern was clear. They build features nobody asked for, they ignore their existing users, and they chase competitors instead of customers.

If you want to win, listen to your users. Simple as that.

RT if you agree. Follow me for more startup insights.

https://example.com/my-newsletter

#startups #founders #buildinpublic #saas #entrepreneur`;

  const asProse = await checkCopy(text);
  assert.equal(asProse.pass, true, 'the universal contract alone cannot see a format violation');

  const asTweet = await checkCopy(text, { format: 'tweet' });
  assert.equal(asTweet.pass, false);
  assert.ok(rules(asTweet).includes('format/tweet-length'));
  assert.ok(rules(asTweet).includes('format/hashtag-count'));
  assert.ok(rules(asTweet).includes('format/engagement-bait'));
});

test('regression: a non-compliant ad passes prose but fails the ad contract', async () => {
  const text = `## Headline

The Absolute Best Solution For Every Single Business Owner Who Wants More Revenue

## Primary text

Are you tired of struggling with your marketing? Our platform helps businesses of all sizes achieve their goals. We guarantee you will make money fast with zero risk. Results are typical for everyone who signs up today.

## Description

Sign up now and transform your business forever.`;

  const asProse = await checkCopy(text);
  assert.equal(asProse.pass, true, 'the universal contract alone cannot see a compliance violation');

  const asAd = await checkCopy(text, { format: 'ad' });
  assert.equal(asAd.pass, false);
  assert.ok(rules(asAd).includes('format/headline-length'));
  assert.ok(rules(asAd).includes('format/description-length'));
  assert.ok(rules(asAd).includes('format/unqualified-claim'));
});

test('a post inside the limit with one idea and a real number passes', async () => {
  const text = `Most teams ship a redesign and watch signups drop 12%.

We did too. Turned out the new hero buried the price below the fold.

Moved it up. Signups came back in four days.`;
  const report = await checkCopy(text, { format: 'tweet' });
  assert.equal(report.pass, true);
  assert.equal(report.errorCount, 0);
});

test('tweet length counts a URL as 23 characters, not its real length', async () => {
  const shortUrl = `Here is the writeup on why the redesign failed and what we changed: https://a.co/x`;
  const longUrl = `Here is the writeup on why the redesign failed and what we changed: https://example.com/${'y'.repeat(400)}`;

  const a = await checkCopy(shortUrl, { format: 'tweet' });
  const b = await checkCopy(longUrl, { format: 'tweet' });
  assert.ok(!rules(a).includes('format/tweet-length'));
  assert.ok(!rules(b).includes('format/tweet-length'), 'a 400-character URL still counts as 23');
});

test('premium raises the tweet ceiling', async () => {
  const text = `A. ${'word '.repeat(120)}`;
  const standard = await checkCopy(text, { format: 'tweet' });
  const premium = await checkCopy(text, { format: 'tweet', premium: true });
  assert.ok(rules(standard).includes('format/tweet-length'));
  assert.ok(!rules(premium).includes('format/tweet-length'));
});

test('an all-caps opening line fails the tweet contract', async () => {
  const text = `THIS CHANGES ABSOLUTELY EVERYTHING FOR YOU

We cut onboarding from 9 steps to 3. Activation went up 22%.`;
  const report = await checkCopy(text, { format: 'tweet' });
  assert.ok(rules(report).includes('format/all-caps-hook'));
});

test('a button label in the headline slot fails the ad contract', async () => {
  const text = `## Headline

Learn more

## Primary text

We audited 212 landing pages last quarter. The ones that converted shared one trait: the price sat above the fold. Click below to get the 4-point checklist we used.`;
  const report = await checkCopy(text, { format: 'ad' });
  assert.ok(rules(report).includes('format/weak-headline'));
});

test('an ad with real fields, a number, and a call to action passes', async () => {
  const text = `## Headline

23 lbs in 8 weeks

## Primary text

We audited 212 landing pages last quarter. The ones that converted shared one trait: the price sat above the fold, not below it.

Sarah moved one button and watched her clickthrough go from 3% to 11% in nine days. No redesign. No new copy.

Get the 4-point checklist we used.

## Description

Free, 2-minute read`;
  const report = await checkCopy(text, { format: 'ad' });
  assert.equal(report.errorCount, 0, JSON.stringify(report.violations, null, 2));
});

test('a landing page with no call to action fails, and gains a pass once it has one', async () => {
  const without = `# The 4-minute fix for a lander that leaks

You spent $8,000 on traffic last month. 94% of it left without acting.

Sarah moved one button. Her rate went from 3% to 11% in nine days.`;
  const failing = await checkCopy(without, { format: 'landing-page' });
  assert.equal(failing.pass, false);
  assert.ok(rules(failing).includes('format/missing-cta'));

  const withCta = `${without}\n\nGet the free checklist below.`;
  const passing = await checkCopy(withCta, { format: 'landing-page' });
  assert.equal(passing.errorCount, 0, JSON.stringify(passing.violations, null, 2));
});

test('a 60+ word paragraph on a landing page flags as a wall of text', async () => {
  const slab = `The ${'reason this happens on almost every page we audit is that the team writing the copy is not the team watching the analytics, and so the price ends up below the fold where nobody scrolls to find it, which means the visitor leaves before they ever see the one number that would have made the decision easy for them to make'}.`;
  const text = `# Why your page leaks\n\n${slab}\n\nClick below to get the checklist. 212 pages audited.`;
  const report = await checkCopy(text, { format: 'landing-page' });
  assert.ok(rules(report).includes('format/wall-of-text'));
});

test('direct response fails on vague benefit claims', async () => {
  const text = `Our platform is best-in-class and helps businesses of all sizes achieve their goals.

We use industry-leading technology to take your operation to the next level.

Sign up today. 400 teams already have.`;
  const report = await checkCopy(text, { format: 'direct-response' });
  assert.equal(report.pass, false);
  assert.ok(rules(report).includes('format/vague-benefit'));
});

// The specificity rule only applies past 100 words, since a short piece
// can carry its claim without a number. This sample clears that gate on
// purpose: shorter copy would pass for the wrong reason.
test('direct response over 100 words fails when no number appears anywhere', async () => {
  const text = `Our service was built for the kind of team that has outgrown spreadsheets but has not yet found something better to replace them with.

We know how that feels because we lived it ourselves for years before we started building. Every week another handoff would go missing and nobody could say quite where it went or who was holding it.

So we built something different. It watches the places where work changes hands and it tells you when something has been sitting too long without moving forward.

Our customers tell us it has changed how their weeks feel.

Sign up today and see for yourself.`;
  const report = await checkCopy(text, { format: 'direct-response' });
  assert.ok(report.metrics.wordCount > 100, 'sample must clear the rule\'s word-count gate');
  assert.equal(report.pass, false);
  assert.ok(rules(report).includes('format/missing-specificity'));
});

test('direct response passes on specific, proof-carrying copy with a clear ask', async () => {
  const text = `# The checklist that found $8,000 of leaked ad spend

Last quarter we audited 212 landing pages for 14 clients.

The pages that converted shared one trait. The price sat above the fold.

Sarah runs a 3-person agency in Leeds. She moved one button on her main lander. Her clickthrough went from 3% to 11% in nine days. No redesign, no new copy, no extra spend.

"I thought we had a traffic problem," she told us. "We had a layout problem."

The checklist is 4 points long and takes about 4 minutes to run against a page.

Get it below.`;
  const report = await checkCopy(text, { format: 'direct-response' });
  assert.equal(report.errorCount, 0, JSON.stringify(report.violations, null, 2));
});

test('the format contract never relaxes the universal one', async () => {
  const text = `Our tool is not just a platform, it's a comprehensive solution that will leverage cutting-edge technology.

Click below to get started. 212 teams already did.`;
  for (const format of ['prose', 'ad', 'landing-page', 'direct-response', 'tweet']) {
    const report = await checkCopy(text, { format });
    assert.ok(rules(report).includes('tells/banned-word'), `${format} must still run the tells contract`);
    assert.ok(rules(report).includes('tells/negation-formula'), `${format} must still run the tells contract`);
  }
});

test('the default format adds nothing, and is recorded in the report metrics', async () => {
  const text = `Every handoff between Slack and your ticket tracker drops something. A decision made in chat never makes it into the ticket. We built a single feed that both tools write to.`;
  const report = await checkCopy(text);
  assert.equal(report.metrics.format, 'prose');
  assert.equal(report.violations.filter((v) => v.rule.startsWith('format/')).length, 0);

  const tagged = await checkCopy(text, { format: 'tweet' });
  assert.equal(tagged.metrics.format, 'tweet');
});

test('an unknown format is rejected rather than silently skipped', async () => {
  await assert.rejects(() => checkCopy('some copy', { format: 'billboard' }), /unknown format/);
});

test('readBriefOptions reads type and premium from the brief', () => {
  assert.deepEqual(readBriefOptions('type: tweet\npremium: true\n\nA post.'), { format: 'tweet', premium: true });
  assert.deepEqual(readBriefOptions('Brief\ntype:   Ad  \n'), { format: 'ad', premium: false });
});

test('readBriefOptions falls back to prose for a missing or unknown type', () => {
  assert.deepEqual(readBriefOptions('No fields here.'), { format: 'prose', premium: false });
  assert.deepEqual(readBriefOptions('type: poem'), { format: 'prose', premium: false });
});
