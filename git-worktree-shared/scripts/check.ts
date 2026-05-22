#!/usr/bin/env bun
// Verify git worktree invariants for the current repo:
//   1. All non-main worktrees live under <repo-root>/worktrees/
//   2. Each has node_modules as a symlink to ../../node_modules
//      (real dir = someone ran `bun install` inside → drift risk)
//
// Exits non-zero on any violation.

import { execSync } from 'node:child_process';
import { lstatSync, readlinkSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { exit } from 'node:process';

let repoRoot: string;
try {
  repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
  console.error('not inside a git repo');
  exit(2);
}

const raw = execSync('git worktree list --porcelain', { cwd: repoRoot, encoding: 'utf8' });
const paths: string[] = [];
for (const line of raw.split('\n')) {
  if (line.startsWith('worktree ')) paths.push(line.slice('worktree '.length));
}

const nonMain = paths.filter((p) => p !== repoRoot);
if (nonMain.length === 0) {
  console.log('no worktrees beyond main — OK');
  exit(0);
}

const expectedParent = resolve(repoRoot, 'worktrees');
let errors = 0;

for (const p of nonMain) {
  const label = relative(repoRoot, p) || p;

  if (dirname(p) !== expectedParent) {
    console.error(`FAIL  ${label}: not under ./worktrees/ (parent: ${dirname(p)})`);
    errors++;
    continue;
  }

  const nm = resolve(p, 'node_modules');
  const stat = lstatSync(nm, { throwIfNoEntry: false });
  if (!stat) {
    console.error(`FAIL  ${label}: missing node_modules symlink`);
    errors++;
    continue;
  }
  if (!stat.isSymbolicLink()) {
    console.error(`FAIL  ${label}: node_modules is a real ${stat.isDirectory() ? 'directory' : 'file'} (expected symlink → ../../node_modules)`);
    errors++;
    continue;
  }
  const target = readlinkSync(nm);
  if (target !== '../../node_modules') {
    console.error(`FAIL  ${label}: node_modules symlink → ${target} (expected ../../node_modules)`);
    errors++;
    continue;
  }

  console.log(`OK    ${label}`);
}

if (errors > 0) {
  console.error(`\n${errors} violation(s)`);
  exit(1);
}
console.log(`\n${nonMain.length} worktree(s) OK`);
