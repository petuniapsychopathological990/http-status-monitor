# VictoriaMetrics

Pass `--victoriametrics` to append per-URL metrics after each run:

```sh
tsx http-status-monitor.mts --once --victoriametrics --urls-file ./urls.txt
```

## Output format

Metrics are written to `./data/victoriametrics/[yyyy-mm]/results.jsonl`. Each line is a VictoriaMetrics `/api/v1/import` compatible JSON object:

```json
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_unique","url":"https://example.com/"},"value":10,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_timeouts","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_redirects","url":"https://example.com/"},"value":1,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_excludes","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_cached","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
```

Metrics written per URL per run: `lychee_total`, `lychee_unique`, `lychee_successful`, `lychee_errors`, `lychee_timeouts`, `lychee_redirects`, `lychee_excludes`, `lychee_cached`.

## Ingesting into VictoriaMetrics

```sh
curl -X POST http://localhost:8428/api/v1/import \
  --data-binary @./data/victoriametrics/2026-05/results.jsonl
```

Run this after each monitoring cycle, or set up a file-based scrape.

## Grafana dashboard ideas

With `lychee_errors{url="..."}` as a time series:

- Alert when `lychee_errors > 0` for more than N consecutive data points
- Graph `lychee_successful / lychee_total` as an asset health ratio per URL
- Compare `lychee_redirects` over time to detect new redirect chains appearing after deploys
