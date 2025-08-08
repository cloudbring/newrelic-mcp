#!/usr/bin/env node
// Extract a version section from CHANGELOG.md and print to stdout
// Usage: node scripts/extract-release-notes.mjs 1.2.3

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('Usage: extract-release-notes.mjs <version>');
  process.exit(1);
}

const changelogPath = resolve(process.cwd(), 'CHANGELOG.md');
const content = readFileSync(changelogPath, 'utf8');

const lines = content.split(/\r?\n/);
const header = `## [${version}]`;

let start = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith(header)) {
    start = i;
    break;
  }
}

if (start === -1) {
  console.error(`Version section not found in CHANGELOG: ${header}`);
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (lines[i].startsWith('## [')) {
    end = i;
    break;
  }
}

const section = lines.slice(start, end).join('\n');
console.log(section.trim());

