# CLI Reference

```
tsx http-status-monitor.mts [options]
```

## Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--urls-file <path>` | string | `./urls.txt` | File with one URL per line |
| `--urls <url,...>` | string | — | Inline comma-separated URLs. Takes precedence over `--urls-file`. |
| `--lychee-path <path>` | string | auto | Explicit path to lychee binary. Falls back to `./lychee-x86_64-unknown-linux-musl/lychee` then `PATH`. |
| `--verbose`, `-v` | flag | off | Show lychee stderr and print results for unchanged URLs too |
| `--diff` | flag | off | Print a unified diff when a URL's hash changes |
| `--once` | flag | off | Run once and exit. Without this, the tool loops indefinitely. |
| `--interval <secs>` | integer | `3600` | Sleep duration between runs in watch mode |
| `--wait <secs>` | integer | `1` | Delay between consecutive URL checks within a single run |
| `--victoriametrics` | flag | off | Append per-URL metrics to `./data/victoriametrics/[yyyy-mm]/results.jsonl` |

## URL input

`--urls` takes precedence over `--urls-file`. Both accept any URL lychee can handle (https only — the tool passes `--scheme https` to lychee).

```sh
# File input
tsx http-status-monitor.mts --once --urls-file ./urls.txt

# Inline
tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
```

## lychee binary resolution

The tool searches in this order:

1. `--lychee-path` if provided
2. `./lychee-x86_64-unknown-linux-musl/lychee`
3. `lychee` on `PATH`

Throws if none found.

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Completed without crash (changes detected is not an error) |
| `1` | Fatal error (lychee not found, unreadable URL file, etc.) |

Individual URL errors (lychee finding 404s, timeouts) are logged but do not cause a non-zero exit.

## State files

Snapshots are stored at `./data/state/<sha256-of-url-16-chars>.json`. Each file contains the normalized canonical JSON from the last lychee run for that URL.

## Output format

Each line printed to stdout follows this format:

```
[STATUS ] <url>  <hash-prefix-12>
```

`STATUS` is one of:

- `NEW` — no previous snapshot exists
- `ok` — hash matches previous run (only printed with `--verbose`)
- `CHANGED` — hash differs from previous run
