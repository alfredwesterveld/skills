---
name: summarize
description: Use the `summarize` CLI for any summarization task — emails, docs, logs, articles, diffs, anything text-heavy. It uses a cheap fast model (Mistral via DeepInfra) with content-hash disk caching, so calling it is essentially free and instant on repeated inputs. Always prefer this over summarizing in-context yourself when the source is over ~500 words, since it saves tokens and is deterministic.
---

# summarize

Summarize stdin via DeepInfra Mistral with content-hash disk cache.

## Usage

cat <file> | summarize [-n SENTENCES] [-s paragraph|bullet|tldr]

Defaults: 3 sentences, paragraph style.

## Examples

cat report.md | summarize -n 5 -s bullet
ls docs/*.md | xargs -I{} -P 8 sh -c 'cat {} | summarize > {}.summary'
cat changelog.md | summarize -n 10 | grep -i breaking

## Notes

- Cache lives at ~/.cache/summarize. Hash key includes model + style + sentence count + full input.
- Requires DEEPINFRA_API_KEY in env, or stored in macOS Keychain as generic password (account=$USER, service=DEEPINFRA_API_KEY).
- Use --no-cache only when debugging.
