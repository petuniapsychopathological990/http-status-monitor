# Comparison

## vs Uptime Kuma / Freshping / simple HTTP ping

These tools check whether a URL returns a 2xx status. That's it. They tell you the server is alive, not whether the page is functional.

http-status-monitor uses lychee to check every linked asset on the page — CSS, JS, images, external APIs. A deploy that breaks a CDN path for `main.js` will show as `[CHANGED]` here; Uptime Kuma won't notice.

**Use Uptime Kuma when:** you need second-level uptime detection and alerting. It's fast, cheap, and purpose-built for that.

**Use http-status-monitor when:** you want to know if a deploy silently broke an asset, or if a third-party dependency started returning errors.

## vs changedetection.io

changedetection.io watches for changes in rendered HTML content — great for tracking price changes, news updates, or visual content shifts.

http-status-monitor watches HTTP status codes and asset availability, not content. It doesn't render JavaScript or compare visible text.

**Use changedetection.io when:** you want to detect changes in what the page says or shows.

**Use http-status-monitor when:** you want to detect changes in what the page loads and whether those loads succeed.

## vs Playwright / Puppeteer synthetic monitoring

Headless browsers execute JavaScript, render the full DOM, and can detect dynamic asset loading, broken interactivity, and visual regressions. They're thorough but expensive — 10-100x more CPU/memory than lychee for the same check.

http-status-monitor is a static-asset check. It won't catch a React component that fails to mount because an API returned malformed JSON.

**Use Playwright when:** JS execution is required to verify correctness, or you need visual regression detection.

**Use http-status-monitor when:** you want frequent, low-overhead checks that catch broken static assets and HTTP-level issues before committing to a full browser run.

## vs lychee directly

lychee is the underlying engine. Running lychee directly gives you a one-shot check with no state tracking.

http-status-monitor adds: persistent state across runs, stable hashing (normalization), unified diffs on change, VictoriaMetrics metrics output, and a watch loop.

**Use lychee directly when:** you want a one-off check or are integrating into a custom pipeline.

**Use http-status-monitor when:** you want continuous tracking with change detection.
