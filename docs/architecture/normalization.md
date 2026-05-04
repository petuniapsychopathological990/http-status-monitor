# Normalization

Normalization is what makes the hash stable across runs when nothing real has changed.

## The problem

lychee's `--format json` output includes fields that vary per run even when the checked URLs and their responses are identical:

- `span` — per-request elapsed time
- `duration` — total check duration

Beyond timing, lychee makes HTTP requests concurrently. The order of entries in `error_map`, `redirect_map`, and similar fields depends on which responses arrive first. Two runs against the same site can produce different JSON byte-for-byte.

If you hash raw lychee output, you get false positives on every run.

## What the normalizer does

**Step 1 — Strip dynamic fields.** Recursively walk the JSON tree and drop any key named `span` or `duration`.

**Step 2 — Sort object arrays.** For any array whose elements are objects, sort by `JSON.stringify` of each element. This makes the order deterministic regardless of HTTP response arrival order.

**Step 3 — Canonical key ordering.** Serialize with the `canonicalize` package, which produces RFC 8785 JSON Canonicalization Scheme output — keys in sorted order at every level.

The result is a string that changes if and only if something meaningful in lychee's findings changed: a URL appeared or disappeared, a status code flipped, an asset moved.

## normalize-lychee.mts

The same logic is available as a standalone stdin→stdout filter:

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts
```

Useful for inspecting what the normalizer produces, or piping into `sha256sum` to verify stability:

```sh
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
# wait a few seconds
./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
# same hash if nothing changed
```

## What normalization does not remove

- URL paths and query strings — if lychee extracts a different set of links (e.g. a Cloudflare token in a URL rotates), the hash changes. This is intentional: something on the page changed.
- Status codes — a 404 flipping to 200 or vice versa always produces a different hash.
- New or removed assets — if a deploy adds or removes a `<script>` tag, the hash changes.
