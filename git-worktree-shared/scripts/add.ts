#!/usr/bin/env bun
// Create a git worktree under <repo-root>/worktrees/<safe-name>/ with
// symlinks to the main checkout's node_modules and any untracked .env* files.
// No local install needed — deps resolve through the symlink.
//
// Usage: bun add.ts <branch>
//   Branch name slashes/unsafe chars → dashes for the dir.
//   Branch is auto-created from HEAD if it doesn't exist.

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv, exit } from 'node:process';

const branch = argv[2];
if (!branch) { console.error('usage: bun add.ts <branch>'); exit(2); }

let repoRoot: string;
try {
  repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
} catch {
  console.error('not inside a git repo');
  exit(2);
}

const safe = branch.replace(/\//g, '-').replace(/[^a-zA-Z0-9._-]/g, '-');
const wtPath = resolve(repoRoot, 'worktrees', safe);
if (existsSync(wtPath)) { console.error(`worktrees/${safe}/ already exists`); exit(1); }

const branchExists = spawnSync('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: repoRoot }).status === 0;
const addArgs = branchExists
  ? ['worktree', 'add', wtPath, branch]
  : ['worktree', 'add', '-b', branch, wtPath];

const add = spawnSync('git', addArgs, { cwd: repoRoot, stdio: 'inherit' });
if (add.status !== 0) exit(add.status ?? 1);

symlinkSync('../../node_modules', resolve(wtPath, 'node_modules'));
console.log(`linked node_modules → ../../node_modules`);

const envFiles = readdirSync(repoRoot).filter((f) => /^\.env($|\..+)/.test(f) && !f.endsWith('.example'));
for (const f of envFiles) {
  const tracked = spawnSync('git', ['ls-files', '--error-unmatch', f], { cwd: repoRoot, stdio: 'ignore' }).status === 0;
  if (tracked) continue;
  const target = resolve(wtPath, f);
  if (lstatSync(target, { throwIfNoEntry: false })) continue;
  symlinkSync(`../../${f}`, target);
  console.log(`linked ${f} → ../../${f}`);
}

console.log(`\nworktree ready: ${wtPath}`);
console.log(`cd ${wtPath}`);
