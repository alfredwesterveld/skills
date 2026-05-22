#!/usr/bin/env bash
# Symlink every skill dir in this repo into ~/.claude/skills/<name>.
# - missing target          → create symlink
# - existing symlink to us  → skip (already installed)
# - existing symlink other  → skip with warning (use --force to overwrite)
# - real directory          → refuse (do not clobber user data)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DEST_DIR="${HOME}/.claude/skills"
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help) echo "usage: $0 [--force]"; exit 0 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

mkdir -p "$DEST_DIR"

# Collect skill sources: <dir>/SKILL.md (flat) OR <dir>/skills/<name>/SKILL.md (nested).
sources=()
for top in "$REPO_DIR"/*/; do
  top_name="$(basename "$top")"
  [[ "$top_name" == ".git" ]] && continue
  if [[ -f "$top/SKILL.md" ]]; then
    sources+=("${top%/}")
  elif [[ -d "$top/skills" ]]; then
    for inner in "$top/skills"/*/; do
      [[ -f "$inner/SKILL.md" ]] && sources+=("${inner%/}")
    done
  else
    echo "skip $top_name (no SKILL.md at root or skills/<name>/SKILL.md)"
  fi
done

installed=0; skipped=0; warned=0
for src_abs in "${sources[@]}"; do
  name="$(basename "$src_abs")"
  dest="$DEST_DIR/$name"

  if [[ -L "$dest" ]]; then
    current="$(readlink "$dest")"
    if [[ "$current" == "$src_abs" ]]; then
      skipped=$((skipped+1))
      continue
    fi
    if [[ $FORCE -eq 1 ]]; then
      rm "$dest"
      ln -s "$src_abs" "$dest"
      echo "replaced $name (was → $current)"
      installed=$((installed+1))
    else
      echo "WARN  $name: symlink points to $current (use --force to overwrite)" >&2
      warned=$((warned+1))
    fi
  elif [[ -e "$dest" ]]; then
    echo "WARN  $name: real directory exists at $dest — refusing to clobber" >&2
    warned=$((warned+1))
  else
    ln -s "$src_abs" "$dest"
    echo "installed $name"
    installed=$((installed+1))
  fi
done

echo ""
echo "summary: installed=$installed skipped=$skipped warned=$warned"
[[ $warned -gt 0 ]] && exit 1 || exit 0
