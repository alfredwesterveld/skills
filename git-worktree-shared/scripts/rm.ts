#!/usr/bin/env bun
// Remove a git worktree by branch name or path.
//
// Usage: bun rm.ts <branch-or-path>

import { execSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';

const arg = argv[2];
if (!arg) { console.error('usage: bun rm.ts <branch-or-path>'); exit(2); }

let repoRoot: string;
try {
  repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
  console.error('not inside a git repo');
  exit(2);
}

type Entry = { path: string; branch?: string };
const raw = execSync('git worktree list --porcelain', { cwd: repoRoot, encoding: 'utf8' });
const entries: Entry[] = [];
let current: Partial<Entry> = {};
for (const line of raw.split('\n')) {
  if (line.startsWith('worktree ')) {
    if (current.path) entries.push(current as Entry);
    current = { path: line.slice('worktree '.length) };
  } else if (line.startsWith('branch ')) {
    current.branch = line.slice('branch refs/heads/'.length);
  } else if (line === '') {
    if (current.path) { entries.push(current as Entry); current = {}; }
  }
}
if (current.path) entries.push(current as Entry);

const asPath = resolve(arg);
const match = entries.find((e) => e.path === asPath || e.branch === arg);
if (!match) {
  console.error(`no worktree matches "${arg}"`);
  console.error('current worktrees:');
  for (const e of entries) console.error(`  ${e.path}  (${e.branch ?? 'detached'})`);
  exit(1);
}

if (match.path === repoRoot) {
  console.error('refusing to remove main worktree');
  exit(1);
}

const result = spawnSync('git', ['worktree', 'remove', '--force', match.path], { cwd: repoRoot, stdio: 'inherit' });
exit(result.status ?? 0);
