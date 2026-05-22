---
name: m2-dark-theme
description: |
  Material Design 2 dark theme rules. Framework-agnostic.
  Use when reviewing or editing dark-mode styles, or when the user reports:
  "too bright", "harsh", "washed out", "garish accent", "eye strain",
  "can't read in dark", "logo too white", "color drift", "low contrast
  in dark", "blue too strong", "white too pure", or any symptom that
  light styling leaks into dark mode. Auto-triggers when touching files
  with `[data-theme="dark"]` selectors, dark color palettes, theme
  toggles, or FOUC theme-init scripts. Skip for Material Design 3,
  Fluent, Tailwind-only without M2 intent, or non-Material design
  systems.
---

# Material Design 2 dark theme rules

Source: https://m2.material.io/design/color/dark-theme.html
Last reviewed: 2026-05-21

## Surface system (overlay-on-#121212)

| Token (concept) | dp | Alpha | Hex |
|---|---|---|---|
| Page background | 0 | 0% | #121212 |
| Card / sheet (01dp) | 1 | 5% | #1E1E1E |
| Raised button hover (02dp) | 2 | 7% | #232323 |
| App bar (04dp) | 4 | 9% | #272727 |
| Menu / FAB (08dp) | 8 | 12% | #2E2E2E |
| Drawer (16dp) | 16 | 15% | #363636 |
| Modal / Dialog (24dp) | 24 | 16% | #383838 |

Formula: `c = 18 + 237 × alpha` (white overlay on #121212).
**Never #000.** Minimum surface = #121212.

## Text & icon emphasis (white on dark surface)

| Emphasis | Alpha | Effective hex |
|---|---|---|
| High | 0.87 | #DEDEDE |
| Medium | 0.60 | #999999 |
| Disabled | 0.38 | #616161 |

**Never pure #FFFFFF for text/logo on dark surface.** Always step down.

CSS img mask pattern for monochrome logos:
- `filter: brightness(0) invert(0.87)` → #DEDEDE (high emphasis)
- `filter: brightness(0) invert(0.74)` → #BDBDBD (medium emphasis)

## Accent palette — M2 200-tone (dark theme)

Desaturate brand/accent colors in dark. Saturated 400/500 tones cause eye fatigue on dark surface.

| Role | Dark hex | Material name |
|---|---|---|
| Error / danger | #CF6679 | M2 dark error spec |
| Red 200 | #EF9A9A | Red 200 |
| Orange | #FFCC80 | Orange 200 |
| Deep Orange | #FFAB91 | Deep Orange 200 |
| Yellow | #FFF59D | Yellow 200 |
| Green | #81C784 | Green 300 |
| Teal / Mint | #80CBC4 | Teal 200 |
| Blue | #90CAF9 | Blue 200 |
| Light Blue | #81D4FA | Light Blue 200 |
| Indigo | #9FA8DA | Indigo 200 |
| Purple | #CE93D8 | Purple 200 |
| Pink | #F48FB1 | Pink 200 |

For "OK / success" buttons in dark, use Green 300 (#81C784) — slightly more saturated than 200, still M2-safe.

## Layout rules

1. **Limit large bright-accent fills.** Hero/banner sections in dark = dark surface + accent border/button, NOT a full accent background. Saturated full-bleed accent surfaces fatigue eyes within seconds.
2. **Elevation through lighter surface, not shadow.** Shadows are invisible on dark surfaces. Use the surface overlay table above to communicate elevation.
3. **Theme-color meta**: `#121212` in dark (browser chrome match).
4. **No pure black anywhere** (#000 → use #121212 minimum, #1E1E1E for elevated card).
5. **Borders/dividers**: `rgba(255,255,255,0.12)` for full dividers, `rgba(255,255,255,0.08)` for subtle.

## Common bugs to check first

1. **Theme-attribute selector not updated on runtime toggle.**
   - Symptom: dark-mode CSS overrides work on first paint but fail when user toggles theme via UI.
   - Root cause: `data-theme` attribute (or equivalent) set by FOUC script at page load only. Runtime theme change updates framework class (e.g. Vuetify's `v-theme--dark`) but not the html attribute.
   - Fix: in the theme-change watcher, also call `document.documentElement.setAttribute('data-theme', value)`.

2. **Pure #FFFFFF text or logo on dark surface.**
   - Symptom: "logo too white", "too harsh".
   - Fix: step to 87% (high) or 60% (medium). For raster logo: change `invert(1)` → `invert(0.87)` or `invert(0.74)`.

3. **Pure #000 background (footer, hero band, modal scrim base).**
   - Symptom: "looks pitch black", "no depth".
   - Fix: use #121212 (page) or #1E1E1E (card).

4. **Box-shadow used for elevation in dark.**
   - Symptom: no visible lift; shadow-color invisible against dark bg.
   - Fix: switch component bg to a higher surface overlay value from the table.

5. **Bright saturated accent used as large background fill.**
   - Symptom: "blue too strong", "garish band".
   - Fix: invert the design — dark surface + accent border/button accent. Or desaturate the fill to M2 200-tone.

6. **Scoped CSS `<style scoped>` with `html[data-theme="dark"]` selectors.**
   - Works in Vue 3 (scoped attr added to rightmost selector only), but combine with bug 1 — verify both the attribute sync AND CSS specificity wins.

## Contrast targets

- Body text on surface: WCAG AA 4.5:1 minimum.
- Reference contrast values on #1E1E1E surface:
  - #DEDEDE ≈ 12:1 (AAA)
  - #BDBDBD ≈ 8.3:1 (AAA)
  - #999999 ≈ 5.7:1 (AA)
  - #757575 ≈ 3.8:1 (fails AA for body text)

## Anti-patterns

- Pure #FFF text on dark surface.
- Pure #000 anywhere.
- Brand accent as full-bleed background in dark.
- Box-shadow as the only elevation cue in dark.
- Reusing light-theme accent hex unchanged in dark.
- Setting `data-theme` only at FOUC; no runtime sync.

## Quick triage checklist

When user says "dark mode looks off", run through:

1. Is `data-theme` (or theme attribute) syncing on runtime toggle? — code search the watcher.
2. Any `#FFF` / `#FFFFFF` / `#000` / `#000000` literals in component CSS? — grep, replace with tokens.
3. Any saturated brand-color full-bleed sections? — desaturate or invert to surface + border.
4. Logo using `invert(1)`? — step to `invert(0.87)` or `invert(0.74)`.
5. Dialogs/menus at same surface as cards? — bump to 24dp (#383838) for dialogs.
6. Theme-color meta set per scheme? — `#121212` for dark.

## Project-specific extensions

The skill defines M2 design rules only. Project token names (e.g. `--v-theme-surface`, `cloudvastgoedBlue`), framework wiring (Vuetify, MUI, Tailwind), and exact selector patterns live in the project's own CLAUDE.md or design tokens file.
