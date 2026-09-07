// Prose-quality checks: passive voice, weasel words, repeated words,
// readability, wordy phrases, and sentence-length variance (burstiness).
// Backed by retext plugins and write-good rather than hand-rolled
// grammar/readability logic — sentence boundary detection and syllable
// counting are both known to be error-prone to reimplement from scratch.
//
// retext-passive and write-good both flag passive voice from different
// angles (retext-passive: grammatical pattern; write-good: phrase-level
// heuristic) — both run, deduped by overlapping character offset so a
// single passive clause isn't reported twice.
//
// Deliberately NOT a rule here: "a paragraph enumerating 2+ things reads
// better as a list" (see prose-quality's "Enumeration reads better as a
// list"). What distinguishes real enumeration from ordinary consecutive
// sentences (cause/effect, elaboration, single-subject continuation) is
// that a noun names a different member of the same set each time — a
// semantic judgment, not a syntactic one, and outside what this file's
// pattern-based rules can reliably make. Left as craft guidance, not a
// gate.

import { unified } from 'unified';
import retextEnglish from 'retext-english';
import retextStringify from 'retext-stringify';
import retextPassive from 'retext-passive';
import retextIntensify from 'retext-intensify';
import retextRepeatedWords from 'retext-repeated-words';
import retextReadability from 'retext-readability';
import writeGood from 'write-good';
import { visit } from 'unist-util-visit';
import { toString } from 'nlcst-to-string';
import { syllable } from 'syllable';
import { flesch } from 'flesch';
import { fleschKincaid } from 'flesch-kincaid';

// General-audience default target (confirmed as the starting contract:
// a fixed rule set now, structured to become a per-project voice
// profile later rather than hardcoded inline here forever).
const READING_EASE_FLOOR = 50; // below this reads as hard for a general audience
const GRADE_CEILING = 10; // above this reads as too technical/dense

// retext-intensify's `weasel` rule fires off a merged fillers+hedges+weasels
// word list (see retext-intensify/lib/index.js) with no way to select a
// subset at match time — only an `ignore` list of exact phrases. A chunk of
// that merged list (from the `weasels` package specifically) is ordinary
// grammatical/connective vocabulary with no hedging signal on its own —
// "that", "then", "so", "just", "also", "still", "about", "up", "down",
// "well" carry the sentence in normal conversational prose and fire on
// nearly every casual paragraph regardless of quality. Ignored here so the
// rule keeps catching actual vagueness (arguably, reportedly, some, often,
// probably, experts, and the rest of `weasels`/`hedges`/`fillers`) without
// the noise floor drowning it out on a casual or humorous register.
const WEASEL_IGNORE = [
  'about', 'again', 'all', 'also', 'back', 'even', 'ever', 'far', 'just',
  'like', 'over', 'own', 'so', 'still', 'that', 'then', 'up', 'well',
];

const SENTENCE_SPLIT = /[.!?]+[\s\n]+/;
const NOMINALIZATION = /\b\w+(tion|ment|ance|ence)s?\b/gi;

// General-audience ceiling. Looser than landing-page's 60-word mobile
// ceiling (`format/wall-of-text`) since this runs on any prose regardless
// of medium, but a paragraph past this is a grey slab wherever it ships.
const MAX_PARAGRAPH_WORDS = 100;

function excerptAround(text, index, length, radius = 40) {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function splitSentences(text) {
  return text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function overlaps(rangeA, rangeB) {
  return rangeA.start < rangeB.end && rangeB.start < rangeA.end;
}

export async function checkProse(text, { wordCount }) {
  const violations = [];
  const sentences = splitSentences(text);

  // Sentence-length variance (burstiness): human writing mixes short and
  // long sentences; uniform length reads as machine output.
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const lengthStdDev = stdDev(lengths);
  if (sentences.length >= 4 && lengthStdDev < 3) {
    violations.push({
      rule: 'prose/low-burstiness',
      grain: 'document',
      severity: 'warning',
      message: `Sentence length barely varies (stddev ${lengthStdDev.toFixed(1)} words) — mix short and long sentences on purpose`,
      excerpt: '',
      location: {},
    });
  }

  // Nominalization density: verbs/adjectives turned into abstract nouns
  // (-tion/-ment/-ance/-ence) read as bureaucratic and remove the actor.
  const nominalizations = text.match(NOMINALIZATION) || [];
  const nominalizationRate = wordCount === 0 ? 0 : (nominalizations.length / wordCount) * 100;
  if (nominalizationRate > 3) {
    violations.push({
      rule: 'prose/nominalization-density',
      grain: 'document',
      severity: 'warning',
      message: `${nominalizations.length} nominalizations (${nominalizationRate.toFixed(1)}% of words) — prefer the verb form ("implement" over "implementation")`,
      excerpt: '',
      location: {},
    });
  }

  // Paragraph length: a wall of text reads as dense and mechanical
  // regardless of medium, and it's the same defect `format/wall-of-text`
  // catches on landing pages specifically — this is the universal version.
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.startsWith('#') || paragraph.startsWith('|')) return;
    const count = paragraph.split(/\s+/).filter(Boolean).length;
    if (count > MAX_PARAGRAPH_WORDS) {
      violations.push({
        rule: 'prose/wall-of-text',
        grain: 'paragraph',
        severity: 'warning',
        message: `Paragraph runs ${count} words; over ${MAX_PARAGRAPH_WORDS} reads as a wall of text — break it up`,
        excerpt: excerptAround(paragraph, 0, Math.min(paragraph.length, 60)),
        location: { paragraph: index },
      });
    }
  });

  // retext pipeline: passive voice, weasel words, repeated words, readability.
  const processor = unified()
    .use(retextEnglish)
    .use(retextPassive)
    .use(retextIntensify, { ignore: WEASEL_IGNORE })
    .use(retextRepeatedWords)
    .use(retextReadability, { age: 16, threshold: 4 })
    .use(retextStringify);

  const file = await processor.process(text);
  const passiveRanges = [];

  for (const msg of file.messages) {
    const start = msg.place?.start?.offset ?? 0;
    const end = msg.place?.end?.offset ?? start;
    const excerpt = excerptAround(text, start, end - start);

    if (msg.source === 'retext-passive') {
      passiveRanges.push({ start, end });
      violations.push({
        rule: 'prose/passive-voice',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-intensify' && msg.ruleId === 'weasel') {
      violations.push({
        rule: 'prose/weasel-word',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-repeated-words') {
      violations.push({
        rule: 'prose/repeated-word',
        grain: 'sentence',
        severity: 'error',
        message: msg.reason,
        excerpt,
        location: {},
      });
    } else if (msg.source === 'retext-readability') {
      violations.push({
        rule: 'prose/hard-to-read-sentence',
        grain: 'sentence',
        severity: 'warning',
        message: msg.reason,
        excerpt,
        location: {},
      });
    }
  }

  // write-good: wordy phrases, clichés, and its own passive-voice heuristic
  // — kept only where it doesn't overlap a retext-passive hit already reported.
  for (const issue of writeGood(text)) {
    const range = { start: issue.index, end: issue.index + issue.offset };
    const isPassiveDupe = /passive voice/i.test(issue.reason) && passiveRanges.some((r) => overlaps(r, range));
    if (isPassiveDupe) continue;

    violations.push({
      rule: 'prose/write-good',
      grain: 'sentence',
      severity: 'warning',
      message: issue.reason,
      excerpt: excerptAround(text, issue.index, issue.offset),
      location: {},
    });
  }

  const passiveCount = passiveRanges.length;
  const passiveVoiceRatio = sentences.length === 0 ? 0 : Math.min(1, passiveCount / sentences.length);

  // Document-level Flesch scores: retext-readability only flags individual
  // hard-to-read sentences, so counts are gathered from the same parse
  // tree and scored with the flesch/flesch-kincaid formulas directly.
  const tree = unified().use(retextEnglish).parse(text);
  const counts = { sentence: 0, word: 0, syllable: 0 };
  visit(tree, 'SentenceNode', () => {
    counts.sentence++;
  });
  visit(tree, 'WordNode', (node) => {
    counts.word++;
    counts.syllable += syllable(toString(node));
  });

  const fleschReadingEase = counts.sentence > 0 && counts.word > 0 ? flesch(counts) : null;
  const fleschKincaidGrade = counts.sentence > 0 && counts.word > 0 ? fleschKincaid(counts) : null;

  if (fleschReadingEase !== null && fleschReadingEase < READING_EASE_FLOOR) {
    violations.push({
      rule: 'prose/reading-ease',
      grain: 'document',
      severity: 'warning',
      message: `Flesch Reading Ease ${fleschReadingEase.toFixed(1)} is below the general-audience floor of ${READING_EASE_FLOOR} — simplify sentence and word length`,
      excerpt: '',
      location: {},
    });
  }
  if (fleschKincaidGrade !== null && fleschKincaidGrade > GRADE_CEILING) {
    violations.push({
      rule: 'prose/grade-level',
      grain: 'document',
      severity: 'warning',
      message: `Flesch-Kincaid grade ${fleschKincaidGrade.toFixed(1)} is above the general-audience ceiling of ${GRADE_CEILING} — shorten sentences or simplify vocabulary`,
      excerpt: '',
      location: {},
    });
  }

  return {
    violations,
    metrics: {
      sentenceCount: sentences.length,
      passiveVoiceRatio,
      sentenceLengthStdDev: lengthStdDev,
      fleschReadingEase,
      fleschKincaidGrade,
    },
  };
}
