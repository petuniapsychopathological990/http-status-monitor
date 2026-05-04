# Architecture Overview

## Data flow

```
urls.txt (or --urls)
        │
        ▼
  for each URL:
        │
        ▼
  lychee --format json          ← spawned as subprocess
  --scheme https
  --accept 200
  --method get
  <url>
        │
        ▼
  normalize()                   ← strip span/duration, sort arrays
        │
        ▼
  sha256(normalized)
        │
        ├── compare with ./data/state/<url-hash>.json
        │         │
        │         ├── no file   → print [NEW], save snapshot
        │         ├── hash same → print [ok] (verbose only)
        │         └── hash diff → print [CHANGED], optionally print diff, save snapshot
        │
        └── if --victoriametrics → append metrics to ./data/victoriametrics/[yyyy-mm]/results.jsonl
```

## Components

### `checkUrl(url, lychee)`

Spawns lychee via `spawnSync`. Uses `spawnSync` rather than `execSync` because lychee exits with non-zero when it finds broken links — `execSync` would throw, making the error unrecoverable.

lychee stderr is suppressed by default (piped to null) and forwarded to the process stderr only with `--verbose`.

### `normalize(data)`

Takes lychee's parsed JSON, removes all `span` and `duration` keys recursively, sorts every array of objects by `JSON.stringify` of each element, then serializes with `canonicalize` (deterministic key ordering). See [Normalization](/architecture/normalization).

### State storage

One file per URL at `./data/state/<hex16>.json`, where `<hex16>` is the first 16 chars of the SHA-256 of the URL string. The file contains the normalized canonical JSON string from the last run.

### VictoriaMetrics output

If `--victoriametrics` is passed, after each URL check the tool appends one JSON line per metric to `./data/victoriametrics/[yyyy-mm]/results.jsonl`. The format matches VictoriaMetrics `/api/v1/import` line protocol:

```json
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
```

Metrics written: `total`, `unique`, `successful`, `errors`, `timeouts`, `redirects`, `excludes`, `cached`.

## Watch mode vs `--once`

Without `--once`, the main loop calls `runOnce()` then sleeps `--interval` seconds indefinitely. The sleep is a plain `setTimeout`-based promise — no background threads.

The `--wait` flag adds a delay between URL checks within a single `runOnce()` call, useful for rate-sensitive targets.
