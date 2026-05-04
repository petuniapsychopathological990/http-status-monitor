# Examples

## normalize-lychee.mts

Pipe lychee JSON output through the normalizer to get a stable, canonical representation for hashing or diffing.

```
$ ./lychee --format json https://example.com/ | tsx normalize-lychee.mts
{"cached":0,"detailed_stats":true,"error_map":{},"errors":0,"excluded_map":{},"excludes":0,"redirect_map":{"https://example.com/":[{"origin":"https://example.com/ja","redirects":[{"code":302,"url":"https://example.com/ja/2026"}]}]},"redirects":1,"remaps":0,"successful":12,"suggestion_map":{},"timeout_map":{},"timeouts":0,"total":13,"unique":10,"unknown":0,"unsupported":0}
```

Stable hash across runs (dynamic fields removed, arrays sorted):

```
$ ./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
94ff979885650b7b4e851a9edeec07db183480f782ac48b233f87911d4c81346  -

$ sleep 3; ./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
94ff979885650b7b4e851a9edeec07db183480f782ac48b233f87911d4c81346  -
```

---

## http-status-monitor.mts

### First run — all NEW

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[NEW    ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[NEW    ] https://blog.example.com/  c2d3b2b59402
Checking https://shop.example.com/ ...
[NEW    ] https://shop.example.com/  2dc002d46708
```

### Second run — no changes

```
$ tsx http-status-monitor.mts --once --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[ok     ] https://blog.example.com/  c2d3b2b59402
Checking https://shop.example.com/ ...
[ok     ] https://shop.example.com/  2dc002d46708
```

### Inline URLs

```
$ tsx http-status-monitor.mts --once --urls "https://example.com/,https://blog.example.com/"
[ok     ] https://example.com/  94ff97988565
[ok     ] https://blog.example.com/  c2d3b2b59402
```

### Detecting a change with --diff

A page rotates a Cloudflare email-obfuscation token between requests — only that value differs:

```
$ tsx http-status-monitor.mts --once --diff --urls "https://blog.example.com/"
[CHANGED] https://blog.example.com/  1ed4abbb500c
Index: https://blog.example.com/
===================================================================
--- https://blog.example.com/	previous
+++ https://blog.example.com/	current
@@ -3,7 +3,7 @@
   "error_map": {
     "https://blog.example.com/": [
       {
-        "url": "https://example.com/cdn-cgi/l/email-protection#5137243c382830",
+        "url": "https://example.com/cdn-cgi/l/email-protection#8bedfee6e2f2ea",
         "status": {
           "code": 404,
           "text": "Rejected status code: 404 Not Found"
```

### Explicit lychee binary path

```
$ tsx http-status-monitor.mts --once \
    --lychee-path /usr/local/bin/lychee \
    --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565
```

### Watch mode (default interval: 3600s)

```
$ tsx http-status-monitor.mts --urls-file ./urls.txt --verbose
lychee: ./lychee-x86_64-unknown-linux-musl/lychee
Checking https://example.com/ ...
[ok     ] https://example.com/  94ff97988565
Checking https://blog.example.com/ ...
[ok     ] https://blog.example.com/  c2d3b2b59402
Sleeping 3600s until next run...
```

### VictoriaMetrics output

```
$ tsx http-status-monitor.mts --once --victoriametrics --urls "https://example.com/"
[ok     ] https://example.com/  94ff97988565

$ cat ./data/victoriametrics/2026-05/results.jsonl
{"metric":{"__name__":"lychee_total","url":"https://example.com/"},"value":13,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_unique","url":"https://example.com/"},"value":10,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_successful","url":"https://example.com/"},"value":12,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_errors","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_timeouts","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_redirects","url":"https://example.com/"},"value":1,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_excludes","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
{"metric":{"__name__":"lychee_cached","url":"https://example.com/"},"value":0,"timestamp":1746403200000}
```

### State snapshots

Saved automatically after every run at `./data/state/<url_hash>.json`:

```
$ ls ./data/state/
94ff979885650b7b.json   c2d3b2b594020000.json   2dc002d467080000.json

$ cat ./data/state/94ff979885650b7b.json
{"cached":0,"detailed_stats":true,"error_map":{},...}
```
