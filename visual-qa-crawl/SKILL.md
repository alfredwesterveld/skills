---
name: visual-qa-crawl
description: Autonomous visual QA crawler for systematic UI issue detection. Crawls reachable pages of any site, takes full-page desktop and mobile screenshots, and identifies visual issues (overflow, layout breaks, overlapping elements, contrast problems, unreadable text). Returns a structured markdown report with severity ratings. Use to audit visual health of a site, a locale, or a single page.
allowed-tools: Bash(agent-browser:*), Bash(bd:*), Bash(npm:*), Bash(bun:*), Bash(pnpm:*), Bash(yarn:*), Bash(curl:*), Bash(source:*), Read, Write
hidden: false
---

# Visual QA Crawl — Autonomous UI Issue Detection

## Overview

Project-agnostic crawler. Walks every reachable page of a site (or filtered subset), screenshots desktop + mobile, runs a programmatic overflow scan, then applies vision analysis. Outputs a markdown issues table.

**What it checks**
- Text clipping / overflow outside containers
- Elements overlapping unintentionally
- Content bleeding off the right edge
- Contrast / unreadable text
- Broken grid or layout shift
- Mobile horizontal scroll, clipped nav, sub-14px text, hero collapse, card-content clipping

**What it does not do**
- Does not replace WCAG / axe / Playwright contrast gates. This is the **holistic vision layer** that catches incoherence automated checks miss.
- Does not interact with overlays, forms, modals, language switchers by default. Captures default-state render.

## Configuration

Place `visual-qa.config.json` in target repo root. All keys optional.

```json
{
  "baseUrl": "http://localhost:3000",
  "devCheckCmd": "npm run dev:check",
  "fallbackUrl": "https://example.com",
  "viewports": { "desktop": [1280, 900], "mobile": [393, 878] },
  "seedUrls": ["/", "/about", "/contact"],
  "locales": { "en": "/en/", "de": "/de/" },
  "overflowSelectors": "[class*=\"card\"], button, [role=\"button\"], nav a, td, th, h1, h2, h3, p",
  "skipInteractions": ["hamburger", "language-switch"],
  "componentNotes": "FAQ collapsed. Forms idle. No modals opened.",
  "extraDesktopChecks": [],
  "extraMobileChecks": [],
  "maxPages": 200
}
```

If no config file and no `--base-url` flag, the skill aborts.

## Usage

```bash
/visual-qa-crawl                                # use ./visual-qa.config.json
/visual-qa-crawl --base-url http://localhost:5173
/visual-qa-crawl --locale en --mobile-only
/visual-qa-crawl --page contact --desktop-only
/visual-qa-crawl --config ./qa.json --max-pages 50
/visual-qa-crawl --no-bfs                        # crawl only seedUrls, no link discovery
```

## Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `--base-url` | URL | from config | Override base domain |
| `--config` | path | `./visual-qa.config.json` | Explicit config path |
| `--locale` | locale key from config | all | Crawl only URLs under one locale prefix |
| `--page` | slug | all pages | Crawl only paths whose final segment matches slug |
| `--desktop-only` | flag | both | Skip mobile pass |
| `--mobile-only` | flag | both | Skip desktop pass |
| `--max-pages` | int | 200 | Cap on total pages visited |
| `--no-bfs` | flag | BFS on | Disable link discovery; crawl only seedUrls |
| `--persist` | `file` / `beads` / `none` | `file` | Where to store final report |

## Output

Markdown table:
- **URL** — full page URL
- **Viewport** — desktop / mobile
- **Issue Description** — what was found
- **Severity** — Low / Medium / High

Plus coverage summary: pages visited, screenshots taken, counts per severity.

Report also written to `tmp/session-*/visual-qa/report.md` (unless `--persist none`).

## Severity Rubric

| Severity | Definition |
|----------|-----------|
| High | Content invisible/inaccessible OR layout makes page unusable |
| Medium | Visible defect, content still readable/accessible |
| Low | Cosmetic / minor misalignment / slight overflow |

## Under the Hood

Spawned agent:
1. Parses `$ARGS`, resolves config.
2. Runs `devCheckCmd` if configured. Falls back to `fallbackUrl` on failure.
3. Loads agent-browser command reference (`agent-browser skills get core`).
4. Initialises progress log via `~/.claude/skills/_progress.sh`.
5. Builds seed queue (config seeds × locale expansion, filtered by `--locale` / `--page`).
6. Per URL:
   - Opens, waits networkidle
   - Checks `document.title` for error markers (404/500/Error)
   - Desktop: viewport set, scroll bottom→top to trigger lazy content, full-page screenshot
   - Overflow scan via `el.scrollWidth > el.clientWidth + 1` on configured selectors
   - Link extraction (desktop only), filtered to base domain, deduped against queue + visited
   - Mobile: same pass at mobile viewport
   - Vision analysis on screenshots, augmented with `extraDesktopChecks` / `extraMobileChecks`
7. State backed by files (`queue.txt`, `visited.txt`, `issues.jsonl`) — survives partial failures.
8. Emits progress + checkpoints every 5 URLs.
9. On empty queue: closes browser, writes report, calls `progress_done`.

**Retry policy:** any agent-browser command that fails twice is logged + skipped. No infinite loops.

## Progress Visibility

Blocks the parent agent for minutes on large sites. Live progress streamed via `tmp/session-*/skill-visual-qa.log`.

**Helper API** (sourced once near skill start):
```bash
source ~/.claude/skills/_progress.sh
LOG="$(progress_init visual-qa)"
progress_emit "$LOG" "<message>"
progress_done "$LOG"
```

**Watching progress**
- **Automatic:** SessionStart hook `~/.claude/hooks/skill-progress-tail.sh` background-tails `tmp/session-*/skill-*.log` and pipes new lines through `notify.sh` (terminal bell + status line).
- **Manual fallback:**
  ```bash
  tail -F tmp/session-*/skill-visual-qa.log
  ```

**Crash detection:** missing `[done]` line + no `$LOG.done` sentinel after >30s silence → crash mid-run.

## Screenshot Storage

```
tmp/session-<YYYY-MM-DD-HHMMSS>/visual-qa/<slug>-desktop.png
tmp/session-<YYYY-MM-DD-HHMMSS>/visual-qa/<slug>-mobile.png
tmp/session-<YYYY-MM-DD-HHMMSS>/visual-qa/report.md
```

Slug rule: strip leading/trailing `/`, replace remaining `/` with `-`. Empty → `home`.

Session dirs auto-created by `.claude/hooks/create-session-dir.sh` and auto-cleaned on session end.

## Examples

**Full crawl, repo config:**
```bash
/visual-qa-crawl
```

**Different base URL, mobile only:**
```bash
/visual-qa-crawl --base-url http://localhost:5173 --mobile-only
```

**Single locale, desktop only:**
```bash
/visual-qa-crawl --locale de --desktop-only
```

**Spot-check one page across all locales:**
```bash
/visual-qa-crawl --page contact
```

**Bound run on large site, no link discovery:**
```bash
/visual-qa-crawl --no-bfs --max-pages 30
```

---

**Next step:** drop `visual-qa.config.json` in the target repo (or pass `--base-url`), then run `/visual-qa-crawl`.
