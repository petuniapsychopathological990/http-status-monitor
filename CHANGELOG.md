# Changelog

## [Unreleased]

## [0.1.0] - 2026-05-05

### Added

- `http-status-monitor.mts` — CLI that runs lychee against a URL list and tracks state changes
  - `--urls-file`, `--urls`, `--lychee-path`, `--verbose`, `--diff`, `--interval`, `--once`, `--victoriametrics`, `--wait`
  - Canonical snapshots saved at `./data/state/<url-hash>.json`
  - VictoriaMetrics-compatible JSONL metrics at `./data/victoriametrics/[yyyy-mm]/results.jsonl`
- `normalize-lychee.mts` — standalone normalizer for lychee `--format json` output; strips dynamic fields, sorts arrays for stable hashing

### Fixed

- lychee stderr no longer leaks into stdout; shown only with `--verbose`
- lychee exits non-zero on link errors — replaced `execSync` with `spawnSync` to handle this gracefully
- Diff output was unreadably compact — both sides are now pretty-printed before diffing
- Non-deterministic hash across runs — object arrays are now sorted by JSON representation before hashing
