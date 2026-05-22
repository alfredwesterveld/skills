---
name: visual-qa-crawl
description: Autonomous visual QA crawler for systematic UI issue detection. Crawls all site pages (or a filtered subset), takes full-page desktop (1280×900) and mobile (393×878) screenshots, and identifies visual issues (overflow, layout breaks, overlapping elements, contrast problems, unreadable text). Returns a structured markdown report of found issues with severity ratings. Use when you want to audit the visual health of the entire site or a specific locale/page.
allowed-tools: Bash(agent-browser:*), Bash(bun run:check:dev-server), Bash(*:wait), Bash(bd:*), Write
hidden: false
---

# Visual QA Crawl — Autonomous UI Issue Detection

## Overview

This skill crawls every page of the site (or a filtered subset), takes full-page screenshots at desktop and mobile viewports, and identifies visual UI issues using vision analysis.

**What it checks:**
- Text clipping or overflow outside containers/buttons
- Elements overlapping unintentionally
- Content bleeding off-screen at specified viewport widths
- Contrast issues (unreadable text)
- Broken grid / layout shifts
- Mobile-specific issues: horizontal scroll, hamburger menu visibility, touch target overlap, hero layout on narrow viewport

**What it does NOT duplicate:**
- Existing Playwright gates already cover WCAG contrast, axe accessibility, overflow widths, CLS, FOUT via automated checks. This skill is the **holistic human-vision layer** — finding layout breaks and visual incoherence that automated checks miss.

## Usage

```bash
/visual-qa-crawl
```

**With optional filters:**
```bash
/visual-qa-crawl --locale nl
/visual-qa-crawl --page contact
/visual-qa-crawl --mobile-only
```

## Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `--locale` | `nl`, `en`, `de` | all three | Crawl only one locale (e.g., `--locale en`) |
| `--page` | slug (e.g., `contact`) | all pages | Crawl a single page by slug (e.g., `--page contact` crawls `/contact/`, `/en/contact/`, `/de/contact/`) |
| `--desktop-only` | flag | crawl both | Skip mobile viewport pass (1280×900 only) |
| `--mobile-only` | flag | crawl both | Skip desktop viewport pass (393×878 only) |

## Output

A markdown table with columns:
- **URL** — full page path
- **Viewport** — desktop or mobile
- **Issue Description** — what was found
- **Severity** — Low / Medium / High (see rubric below)

Plus a coverage summary: total pages visited, total screenshots taken, and any pages that returned HTTP 4xx/5xx.

## Severity Rubric

| Severity | Definition |
|----------|-----------|
| High | Content invisible, inaccessible, or broken layout makes page unusable |
| Medium | Visual defect noticeable by a user but content is still readable/accessible |
| Low | Minor polish issue (minor misalignment, slight overflow, cosmetic) |

## Important Notes

- **No cookie banner:** This site has no GDPR/consent overlay, so no dismissal step is needed.
- **Don't interact with overlays:** Mobile hamburger and language-switch both open full-screen sheets that cover page content — they remain closed during the crawl so the default page is captured.
- **StatCounter animations:** Counters show 0 before scroll-into-view. The crawl scrolls to bottom before screenshotting to ensure StatCounter animations complete.
- **Alpine.js components:** FAQ, ContactForm, Quickcheck widgets are captured in their idle/initial state (appropriate for a crawl).
- **Dev server required:** Crawl runs on `http://localhost:4321` (local dev with HMR). Falls back to production if dev is not running.

## Under the Hood

This skill spawns a Haiku 4.5 agent that:
1. Validates the dev server is running (via `bun run check:dev-server`)
2. Loads agent-browser CLI command reference (`agent-browser skills get core`)
3. **Initialises the progress log** (see "Progress visibility" below): `LOG="$(source ~/.claude/skills/_progress.sh && progress_init visual-qa)"`
4. Manages a queue of URLs from the seed list (all production pages across NL/EN/DE + internal component pages); emits `progress_emit "$LOG" "queue $N urls"` once the queue is built
5. For each URL (index `i` of total `N`):
   - Opens the page and waits for networkidle
   - Takes a desktop screenshot (1280×900) after scrolling to trigger lazy-loaded content; emits `progress_emit "$LOG" "crawl $i/$N $url desktop"`
   - Takes a mobile screenshot (393×878) with the same scroll pattern; emits `progress_emit "$LOG" "crawl $i/$N $url mobile"`
   - Extracts links to discover new pages (filtered to same domain)
   - Analyzes both screenshots with vision to identify UI issues
6. Logs all findings with URL, viewport, description, and severity
7. Calls `progress_done "$LOG"` and returns a markdown issues table and coverage summary when the queue is empty

**Escalation:** If Haiku fails to load a screenshot or produces malformed analysis, the prompt instructs escalation to Sonnet.

## Progress visibility

This skill blocks the parent agent for several minutes; the parent cannot stream output back. To surface live progress, the skill writes a structured log to `tmp/session-*/skill-visual-qa.log` via the shared helper at `~/.claude/skills/_progress.sh`.

**Helper API (sourced once, near skill start):**
```bash
source ~/.claude/skills/_progress.sh
LOG="$(progress_init visual-qa)"   # truncates log, writes [startup], returns path
progress_emit "$LOG" "<message>"   # appends one timestamped line
progress_done "$LOG"               # writes [done] + creates $LOG.done sentinel
```

**Watching progress:**
- **Automatic:** the user-global SessionStart hook `~/.claude/hooks/skill-progress-tail.sh` background-tails `tmp/session-*/skill-*.log` and pipes each new line through `~/.claude/hooks/notify.sh` → Ghostty bell + status line.
- **Manual fallback** (any second terminal):
  ```bash
  tail -F tmp/session-*/skill-visual-qa.log
  ```

**Crash detection:** absence of `[done]` line + missing `$LOG.done` sentinel after the log goes quiet for >30s indicates the crawl crashed mid-run.

## Examples

**Full crawl (all locales, both viewports):**
```bash
/visual-qa-crawl
```

**Quick mobile audit (all pages, mobile only):**
```bash
/visual-qa-crawl --mobile-only
```

**Spot-check one page (all viewports):**
```bash
/visual-qa-crawl --page contact
```

**Single locale, desktop only:**
```bash
/visual-qa-crawl --locale de --desktop-only
```

## Screenshot Storage

Screenshots are saved to the session temp directory:
```
tmp/session-<YYYY-MM-DD-HHMMSS>/visual-qa/<slug>-desktop.png
tmp/session-<YYYY-MM-DD-HHMMSS>/visual-qa/<slug>-mobile.png
```

Session temp dirs are auto-created by the `.claude/hooks/create-session-dir.sh` hook and auto-cleaned after the session ends (unless you explicitly keep the dir).

---

**Next step:** Run `/visual-qa-crawl` (or with options above) to start the crawl.
