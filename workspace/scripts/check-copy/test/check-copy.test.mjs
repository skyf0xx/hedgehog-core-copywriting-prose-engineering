import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkCopy } from '../index.mjs';

test('fails on text stacked with banned AI-tell vocabulary and phrasing', async () => {
  const text = `It's important to note that our platform is not just a tool — it's a comprehensive solution. We leverage cutting-edge technology to deliver a seamless, robust experience. This could potentially unlock a paradigm shift.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.errorCount > 0);
  assert.ok(report.violations.some((v) => v.rule === 'tells/banned-word'));
  assert.ok(report.violations.some((v) => v.rule === 'tells/negation-formula'));
  assert.ok(report.violations.some((v) => v.rule === 'tells/hedge-stack'));
});

test('flags a because-not-because negation contrast', async () => {
  const text = `A draft ships because a script checked it and exited 0, not because an agent read it and judged it clean.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.violations.some((v) => v.rule === 'tells/negation-formula'));
});

test('passes on plain, varied, concrete prose', async () => {
  const text = `Every handoff between Slack and your ticket tracker drops something. A decision made in chat never makes it into the ticket. We built a single feed that both tools write to. Comments sync both ways.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, true);
  assert.equal(report.errorCount, 0);
});

test('flags repeated words as an error', async () => {
  const text = `The cat sat on the the mat and looked around the room slowly before deciding where to go next.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/repeated-word' && v.severity === 'error'));
});

test('reports Flesch metrics on a real document', async () => {
  const text = `The cat sat on the mat. It watched the birds fly across the yard, wondering if it should chase them or simply enjoy the warm afternoon sun instead.`;
  const report = await checkCopy(text);
  assert.equal(typeof report.metrics.fleschReadingEase, 'number');
  assert.equal(typeof report.metrics.fleschKincaidGrade, 'number');
});

test('flags low sentence-length variance (burstiness) on uniform sentences', async () => {
  const text = `The team shipped the feature today. The team tested the feature today. The team reviewed the feature today. The team deployed the feature today.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/low-burstiness'));
});

test('does not flag ordinary connective words as weasel words', async () => {
  const text = `Then there's the whiskers. The cat still runs the household from that chair by the window. It just makes the smugness official.`;
  const report = await checkCopy(text);
  const weaselWords = report.violations
    .filter((v) => v.rule === 'prose/weasel-word')
    .map((v) => v.message);
  assert.ok(
    !weaselWords.some((m) => /`(that|Then|still|just|also|so|about)`/i.test(m)),
    `expected no weasel-word hits on connective words, got: ${weaselWords.join(', ')}`,
  );
});

test('still flags genuine hedging as a weasel word', async () => {
  const text = `Some experts say the results are arguably promising, though the study reportedly used a small sample.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/weasel-word'));
});

test('flags a single em dash as an error, not just above a density threshold', async () => {
  const text = `The team shipped the release on Tuesday — a day ahead of plan, which nobody expected given how the sprint started out rocky and uncertain.`;
  const report = await checkCopy(text);
  assert.equal(report.pass, false);
  assert.ok(report.violations.some((v) => v.rule === 'tells/em-dash' && v.severity === 'error'));
});

test('flags trailing negation used for emphasis without a repeated word or second copula', async () => {
  const text = `A script runs on every draft and decides pass or fail, keeping the gate honest across every submission we run, not the model that wrote it.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'tells/negation-formula' && /Trailing negation/.test(v.message)));
});

test('flags a short standalone fragment that restates the prior sentence for emphasis', async () => {
  const text = `The finished piece lands in your current folder, cleaned up and ready to publish today. Nothing else is left behind.`;
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'tells/emphatic-fragment'));
});

test('flags a paragraph over 100 words as a wall of text', async () => {
  const sentence = 'The team shipped the feature and tested it carefully before release. ';
  const text = sentence.repeat(15);
  const report = await checkCopy(text);
  assert.ok(report.violations.some((v) => v.rule === 'prose/wall-of-text' && v.severity === 'warning'));
});

test('does not flag a paragraph under 100 words', async () => {
  const text = `Every handoff between Slack and your ticket tracker drops something. A decision made in chat never makes it into the ticket. We built a single feed that both tools write to. Comments sync both ways.`;
  const report = await checkCopy(text);
  assert.ok(!report.violations.some((v) => v.rule === 'prose/wall-of-text'));
});
