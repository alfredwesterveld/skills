---
name: git-worktree-shared
description: Create git worktrees with shared dependencies via symlinks. Worktree dirs live under ./worktrees/<safe-name>/ inside the repo. node_modules and untracked .env* files are symlinked to the main checkout — no per-worktree install needed. Use when the user asks to "add a worktree", "spin up a branch worktree", "create a worktree for <branch>", or any variant. Also when they want to clean up or verify their worktrees (rm, check). Works for any Node/Bun/PNPM repo where dependencies live at repo root.
---

# git-worktree-shared

Pattern: git worktrees as siblings inside the repo (`./worktrees/<safe-name>/`), sharing the main checkout's `node_modules` and `.env*` files via relative symlinks. Zero local install per worktree.

## Why

- One install at repo root, every worktree resolves the same deps via filesystem walk-up + explicit symlink (bulletproof against tools that resolve from cwd rather than node module chain).
- Lockfile drift avoided: branches must merge dep changes through main first.
- Flat layout (`./worktrees/feat-foo/`) keeps symlink depth constant (`../../node_modules`). Slashes in branch names → dashes in dir name.

## Invariants

- All worktrees live under `<repo-root>/worktrees/`.
- Each has `node_modules` as a symlink to `../../node_modules`. Never a real dir (would mean someone ran `bun install` / `npm install` inside — drift risk).
- Lockfile shared via main. Branch needing new dep → update on main first, then worktree picks it up via symlink.
- `.env*` files (excluding `.env.example` and other tracked files) symlinked from root at worktree creation time.

## Scripts

All scripts run from repo root unless noted. They live in this skill dir — invoke with absolute path or via the wrappers below.

### Add a worktree

```bash
bun ~/github/alfredwesterveld/skills/git-worktree-shared/scripts/add.ts <branch>
```

- Auto-creates branch from HEAD if it doesn't exist (`git worktree add -b`).
- Symlinks `node_modules` + every untracked `.env*` file.
- Branch name `feat/foo` → dir name `feat-foo` (slashes and unsafe chars → dashes).

### Remove a worktree

```bash
bun ~/github/alfredwesterveld/skills/git-worktree-shared/scripts/rm.ts <branch-or-path>
```

- Accepts a branch name (resolved via `git worktree list`) or a path.
- Runs `git worktree remove --force`. Symlinks die with the dir.

### Verify invariants

```bash
bun ~/github/alfredwesterveld/skills/git-worktree-shared/scripts/check.ts
```

- All non-main worktrees are under `./worktrees/`.
- Each has `node_modules` as symlink to `../../node_modules`.
- Exits non-zero on any violation. Wire into a pre-push hook or CI if desired.

## When to invoke

User says any of:
- "create a worktree for <branch>" / "spin up a worktree" / "add worktree"
- "remove the worktree" / "clean up worktrees"
- "verify my worktrees" / "check worktrees"

Run from the target repo's root. If user invokes outside a repo root, `cd` there first or fail clearly.

## Conventions

- Branch slashes → dashes in dir name (`feat/foo` → `worktrees/feat-foo/`).
- Never run `bun install` / `npm install` inside a worktree. If a branch needs a new dep, update lockfile on main first, then symlink resolves it.
- Add `worktrees/` to the repo's `.gitignore` so `git status` in the main checkout stays clean. `git worktree list` still tracks them — `.gitignore` only affects what `git status` reports in the parent. The `add.ts` script does NOT modify `.gitignore` automatically; do it once per repo manually.
