# Visual QA Crawl Skill

Autonomous visual QA agent for systematic UI issue detection. Crawls all site pages, takes full-page desktop and mobile screenshots, and identifies visual issues using vision analysis.

## Files

- **SKILL.md** — Skill interface definition (metadata, usage, options, examples)
- **AGENT_PROMPT.txt** — Full crawl instructions for the Haiku agent (loaded when skill is invoked)
- **README.md** — This file

## Quick Start

Invoke in Claude Code:
```bash
/visual-qa-crawl
```

Or with options:
```bash
/visual-qa-crawl --locale en --mobile-only
```

## See Also

- [agent-browser](../agent-browser/) — CLI tool used for screenshots and link extraction
- [Mijn Website Project](../../CLAUDE.md) — Project configuration and architecture
