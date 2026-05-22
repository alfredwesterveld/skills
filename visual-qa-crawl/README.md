# Visual QA Crawl Skill

Project-agnostic autonomous visual QA agent. Crawls reachable pages of any site, takes full-page desktop + mobile screenshots, programmatically scans for overflow, and applies vision analysis to surface UI issues.

## Files

- **SKILL.md** — Skill interface (metadata, options, examples, runtime contract)
- **AGENT_PROMPT.txt** — Crawl instructions loaded into the spawned agent
- **README.md** — This file

## Quick Start

1. Drop `visual-qa.config.json` in your repo root (see SKILL.md for schema). Minimal example:
   ```json
   {
     "baseUrl": "http://localhost:3000",
     "seedUrls": ["/"]
   }
   ```
2. Invoke in Claude Code:
   ```bash
   /visual-qa-crawl
   ```

No config? Pass `--base-url`:
```bash
/visual-qa-crawl --base-url https://example.com
```

## Common Options

```bash
/visual-qa-crawl --locale en --mobile-only
/visual-qa-crawl --page contact
/visual-qa-crawl --no-bfs --max-pages 30
/visual-qa-crawl --config ./qa.json
```

Full option list: see SKILL.md.

## Output

- Markdown issues table in conversation (URL, viewport, description, severity)
- Coverage summary (pages visited, screenshot count, severity totals)
- Screenshots saved under `tmp/session-*/visual-qa/`
- Report written to `tmp/session-*/visual-qa/report.md` (unless `--persist none`)

## Dependencies

- `agent-browser` CLI — screenshots, link extraction, eval
- `~/.claude/skills/_progress.sh` — progress log helper (for live streaming to parent)
- Optional: `bd` (Beads) CLI — only if `--persist beads`

## See Also

- [agent-browser](../agent-browser/) — browser automation CLI used by this skill
