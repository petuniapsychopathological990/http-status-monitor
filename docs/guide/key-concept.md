# Key Concept: Why lychee, and why hash the output?

## The problem with shallow monitoring

Most uptime tools — Uptime Kuma, Pingdom, simple curl scripts — check whether a URL returns HTTP 200. That tells you the server is alive. It doesn't tell you whether the page actually works.

A modern page loads dozens of assets: CSS, JavaScript bundles, fonts, API endpoints called on render. Any of those can return 404 or 502 while the HTML itself serves fine. The result is a "zombie site" — the server responds, but users see broken layout, missing content, or a loading spinner that never resolves.

## What lychee does differently

lychee fetches the page, parses every linked URL (`<link>`, `<script>`, `<img>`, `<a>`, etc.), and checks each one. Running it with `--scheme https --accept 200 --method get` means any asset that isn't a clean 200 shows up as an error.

This is still a static check — JavaScript that dynamically loads assets at runtime won't be caught. But for the large class of problems where a deploy breaks a CSS path or a CDN config change makes a JS file return 403, lychee catches it without a headless browser.

## Why hash and diff instead of alerting on errors?

lychee already reports errors. The value of hashing is tracking *change over time*.

Say a page has a Cloudflare email-obfuscation token in a URL. That token rotates on each request, so lychee will always report a 404 for it. If you alert on any error, you drown in noise. If you hash the normalized output and diff against the previous run, you see exactly what changed — and you can tell the difference between "this same 404 has been here since day one" and "a new 404 appeared after the deploy."

The normalization step (stripping timing fields, sorting arrays) makes the hash deterministic across runs when nothing real changed. See [Normalization](/architecture/normalization) for details.

## What this tool is not

- Not a headless browser monitor. JavaScript-rendered content and dynamically injected assets are out of scope.
- Not a performance monitor. Response times are stripped during normalization.
- Not a visual regression tool. It doesn't compare screenshots.

For critical paths that require JS execution, combine this tool (cheap, frequent, waterfall-level) with occasional Playwright runs (expensive, thorough, rendered output).
