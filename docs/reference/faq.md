# FAQ

## The hash changes every run even though nothing broke.

This usually means lychee is extracting a dynamically generated URL — Cloudflare email-obfuscation tokens are a common example. The URL contains a random token that changes per request, so lychee sees a different 404 URL each time.

Check what's changing with `--diff`:

```sh
tsx http-status-monitor.mts --once --diff --urls "https://your-site.com/"
```

If it's a known-noisy URL, there's currently no built-in exclude list. The workaround is to run lychee directly with `--exclude <pattern>` and pipe through `normalize-lychee.mts`, or accept the noise and treat `[CHANGED]` as "something changed, check the diff."

## lychee binary not found

The tool checks `./lychee-x86_64-unknown-linux-musl/lychee` then `PATH`. Pass `--lychee-path` explicitly if your binary is elsewhere:

```sh
tsx http-status-monitor.mts --once --lychee-path /usr/local/bin/lychee --urls "https://example.com/"
```

## State files are accumulating. How do I reset?

Delete `./data/state/`. Next run will treat all URLs as `[NEW]` and write fresh snapshots.

## Why does lychee report errors for assets I can load in a browser?

lychee sends HTTP requests without executing JavaScript and with a non-browser User-Agent. Some servers or CDNs block or throttle non-browser requests.

Try adding a browser-like User-Agent via lychee's `--header` flag — but that requires invoking lychee directly for now, not through http-status-monitor.

## Can I monitor HTTP (non-HTTPS) URLs?

The tool passes `--scheme https` to lychee. HTTP-only URLs are skipped. This is intentional — monitoring plaintext endpoints conflates network-level reachability with actual site health.

## The diff output is huge.

A large diff usually means a structural change in lychee's output — a new section appeared, or the whole `error_map` shifted because many assets changed status at once. Look at the `[CHANGED]` line's hash prefix: if it's completely different from the previous hash, many things changed simultaneously (e.g. a deploy touched most assets).

## Does this work on macOS or Windows?

The lychee binary path default (`./lychee-x86_64-unknown-linux-musl/lychee`) is Linux-only. On macOS or Windows, download the appropriate lychee binary and pass `--lychee-path`. The Node.js code itself is cross-platform.
