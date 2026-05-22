---
name: deno-sandbox
description: Run a shell command in a remote, isolated Deno Deploy sandbox via the `sbx` CLI. Use when you want to execute commands without touching the local filesystem — testing untrusted code, running risky/destructive shell, isolating a script, or reducing per-command permission prompts by funneling many ops through one allowlisted entry point (`Bash(sbx:*)`). Triggers include "run this in a sandbox", "execute safely", "isolate", "try this without affecting my machine".
---

# deno-sandbox

`sbx` runs a shell command inside an ephemeral remote sandbox provisioned by Deno Deploy (`@deno/sandbox`). Each invocation spins up a fresh Linux container, executes the command, streams stdout/stderr, exits with the sandboxed process's exit code, then disposes the sandbox.

## Usage

```sh
sbx <cmd...>                  # args joined with spaces
echo "cmd && cmd2" | sbx -    # read from stdin (useful for long scripts)
sbx --json <cmd...>           # emit {code, stdout, stderr} as JSON
```

## Examples

```sh
sbx 'echo hello && uname -a'
sbx 'curl -sS https://example.com | head -5'
sbx 'apt-get update && apt-get install -y figlet && figlet sandbox'   # mutate state freely — gone after exit
echo 'for i in $(seq 1 3); do echo $i; done' | sbx -
sbx --json 'ls /' | jq .
```

## Token

`sbx` resolves `DENO_DEPLOY_TOKEN` in this order:

1. `$DENO_DEPLOY_TOKEN` env var
2. macOS Keychain: account=`$USER`, service=`DENO_DEPLOY_TOKEN`

Store once:
```sh
security add-generic-password -a "$USER" -s DENO_DEPLOY_TOKEN -w
```
(`-w` prompts interactively — no token in shell history.)

## Why this reduces permission prompts

A single allowlist entry `Bash(sbx:*)` covers every command you might want to run in the sandbox. Useful for:

- one-off experiments where you'd otherwise grant a different Bash perm each time
- arbitrary install / network / filesystem ops that you don't want against your local machine
- repeatable demos that should leave no local trace

This is not a substitute for sandboxing *local* operations — the command runs remotely. Files written inside the sandbox vanish on `close()`.

## Notes

- Each `sbx` call = one fresh sandbox. For multi-step state, chain commands in one invocation (`sbx 'cmd1 && cmd2'`) or pipe a script via stdin.
- Sandbox cold-start is a few seconds; this is the cost of isolation.
- Output is captured via `stdoutText` / `stderrText` (full buffer), then written to local stdout/stderr at exit. For very large outputs, prefer `--json` and parse, or have the sandboxed command upload results elsewhere.
- Source: `bin/sbx` (Deno script, runs with `deno run -A`).
