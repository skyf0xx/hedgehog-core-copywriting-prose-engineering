#!/usr/bin/env node
// checkCopy() as a real CLI: mechanical AI-tell and prose-quality gates
// run as deterministic code and reported as structured JSON, not graded
// by the agent that wrote the draft. Read a file path (or stdin), print
// a validated report to stdout, exit 1 if any error-severity violation
// fired — a real gate the copy-writer loop cannot talk its way past.
//
// Usage: node index.mjs <file> [--format <name>] [--premium]
//        cat draft.md | node index.mjs -
//
// The tells and prose contracts are universal and always run. --format
// adds the contract for the medium the copy ships into (a character
// limit, a required structural slot, a banned compliance claim) — checks
// the prose rules cannot make, because nothing about the sentences
// themselves is wrong. Defaults to `prose`, which adds nothing.
//
// Built on `retext` (passive voice, weasel words, repeated words,
// readability), `write-good` (wordy phrases, clichés),
// `flesch`/`flesch-kincaid` (document-level readability scores), and a
// custom AI-tell rule set (`rules/tells.mjs`) — not hand-rolled grammar
// or syllable-counting logic. `zod` (`report.mjs`) validates the report's
// shape.

import { readFile } from 'node:fs/promises';
import { checkTells } from './rules/tells.mjs';
import { checkProse } from './rules/prose.mjs';
import { checkFormat, FORMAT_NAMES } from './rules/formats/index.mjs';
import { buildReport } from './report.mjs';

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function countParagraphs(text) {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

async function readInput(arg) {
  if (!arg || arg === '-') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  }
  return readFile(arg, 'utf8');
}

export async function checkCopy(text, { format = 'prose', premium = false } = {}) {
  const wordCount = countWords(text);
  const paragraphCount = countParagraphs(text);

  const tellViolations = checkTells(text, { wordCount });
  const { violations: proseViolations, metrics: proseMetrics } = await checkProse(text, { wordCount });
  const formatViolations = checkFormat(text, format, { premium });

  const violations = [...tellViolations, ...proseViolations, ...formatViolations];

  return buildReport(violations, {
    format,
    wordCount,
    paragraphCount,
    sentenceCount: proseMetrics.sentenceCount,
    fleschReadingEase: proseMetrics.fleschReadingEase,
    fleschKincaidGrade: proseMetrics.fleschKincaidGrade,
    passiveVoiceRatio: proseMetrics.passiveVoiceRatio,
    sentenceLengthStdDev: proseMetrics.sentenceLengthStdDev,
  });
}

function parseArgs(argv) {
  const options = { file: undefined, format: 'prose', premium: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--format') {
      options.format = argv[++i];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice('--format='.length);
    } else if (arg === '--premium') {
      options.premium = true;
    } else if (options.file === undefined) {
      options.file = arg;
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!FORMAT_NAMES.includes(options.format)) {
    process.stderr.write(`check-copy: unknown format "${options.format}" — expected one of: ${FORMAT_NAMES.join(', ')}\n`);
    process.exit(2);
  }

  const text = await readInput(options.file);

  if (!text.trim()) {
    process.stderr.write('check-copy: empty input\n');
    process.exit(2);
  }

  const report = await checkCopy(text, { format: options.format, premium: options.premium });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.pass ? 0 : 1);
}

const isMain = process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMain) {
  main().catch((err) => {
    process.stderr.write(`check-copy: ${err.stack || err.message}\n`);
    process.exit(2);
  });
}
