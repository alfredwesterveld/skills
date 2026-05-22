# Skills

Version-controlled Claude Code skills. One skill per top-level directory; each contains a `SKILL.md` (skill manifest) and optionally `scripts/`, `bin/`, or other support files.

## Install

```bash
./install.sh
```

Symlinks every top-level skill dir into `~/.claude/skills/<name>`. Re-run after adding new skills or pulling updates — re-creates missing links, leaves existing ones alone.

Pass `--force` to overwrite existing symlinks that point elsewhere. Real directories (non-symlink) at the target path are never overwritten; they must be removed manually.

## Layout

```
skills/
├── install.sh
├── README.md
├── <skill-name>/
│   ├── SKILL.md
│   └── ... (scripts, assets)
└── ...
```

## Add a new skill

1. Create `<skill-name>/SKILL.md` with frontmatter (`name`, `description`).
2. Run `./install.sh`.
3. Commit + push.
