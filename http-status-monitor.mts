import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { createPatch } from "diff";
import canonicalize from "canonicalize";

// --- arg parsing ---
const args = process.argv.slice(2);
function flag(name: string, short?: string): boolean {
  return args.includes(`--${name}`) || (short !== undefined && args.includes(`-${short}`));
}
function opt(name: string, defaultVal: string): string {
  const i = args.findIndex((a) => a === `--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : defaultVal;
}

const urlsFile = opt("urls-file", "./urls.txt");
const urlsInline = opt("urls", "");
const lycheePathOpt = opt("lychee-path", "");
const verbose = flag("verbose", "v");
const showDiff = flag("diff");
const interval = parseInt(opt("interval", "3600"), 10);
const once = flag("once");
const victoriametrics = flag("victoriametrics");
const waitSecs = parseInt(opt("wait", "1"), 10);

// --- normalize (same logic as normalize-lychee.mts) ---
function sortByStringify(arr: unknown[]): unknown[] {
  return [...arr].sort((a, b) => {
    const sa = JSON.stringify(a) ?? "";
    const sb = JSON.stringify(b) ?? "";
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
}

function removeDynamic(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const cleaned = obj.map(removeDynamic);
    if (cleaned.length > 0 && typeof cleaned[0] === "object" && cleaned[0] !== null) {
      return sortByStringify(cleaned);
    }
    return cleaned;
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([k]) => k !== "span" && k !== "duration")
        .map(([k, v]) => [k, removeDynamic(v)])
    );
  }
  return obj;
}

function normalize(data: Record<string, unknown>): string {
  return (canonicalize(removeDynamic(data)) as string) + "\n";
}

// --- helpers ---
function urlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function findLychee(): string {
  if (lycheePathOpt) {
    if (!existsSync(lycheePathOpt)) throw new Error(`--lychee-path not found: ${lycheePathOpt}`);
    return lycheePathOpt;
  }
  const local = "./lychee-x86_64-unknown-linux-musl/lychee";
  if (existsSync(local)) return local;
  const r = spawnSync("which", ["lychee"], { encoding: "utf8" });
  if (r.status === 0) return "lychee";
  throw new Error("lychee binary not found (checked ./lychee-x86_64-unknown-linux-musl/lychee and PATH)");
}

function ensureDir(d: string): string {
  mkdirSync(d, { recursive: true });
  return d;
}

function vmFile(): string {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return join(ensureDir(`./data/victoriametrics/${ym}`), "results.jsonl");
}

function saveVm(url: string, data: Record<string, unknown>): void {
  const ts = Date.now();
  const metricNames = ["total", "unique", "successful", "errors", "timeouts", "redirects", "excludes", "cached"];
  const lines = metricNames
    .filter((m) => typeof data[m] === "number")
    .map((m) =>
      JSON.stringify({ metric: { __name__: `lychee_${m}`, url }, value: data[m], timestamp: ts })
    )
    .join("\n");
  appendFileSync(vmFile(), lines + "\n");
}

function sleep(secs: number): Promise<void> {
  return new Promise((r) => setTimeout(r, secs * 1000));
}

// --- core ---
function checkUrl(url: string, lychee: string): Record<string, unknown> {
  const r = spawnSync(
    lychee,
    ["--verbose", "--scheme", "https", "--accept", "200", "--method", "get", url, "--format", "json"],
    { maxBuffer: 10 * 1024 * 1024, encoding: "utf8", stdio: ["ignore", "pipe", verbose ? "inherit" : "pipe"] }
  );
  if (!r.stdout) throw new Error(`lychee produced no output for ${url}`);
  return JSON.parse(r.stdout) as Record<string, unknown>;
}

async function runOnce(lychee: string): Promise<void> {
  const urls = urlsInline
    ? urlsInline.split(",").map((u) => u.trim()).filter(Boolean)
    : readFileSync(urlsFile, "utf8").trim().split("\n").map((u) => u.trim()).filter(Boolean);

  const stateDir = ensureDir("./data/state");

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (verbose) process.stderr.write(`Checking ${url} ...\n`);

    let data: Record<string, unknown>;
    try {
      data = checkUrl(url, lychee);
    } catch (e) {
      console.error(`[ERROR] ${url}: ${e}`);
      continue;
    }

    const normalized = normalize(data);
    const hash = sha256(normalized);
    const stateFile = join(stateDir, `${urlHash(url)}.json`);

    const prev = existsSync(stateFile) ? readFileSync(stateFile, "utf8") : null;
    const prevHash = prev ? sha256(prev) : null;
    const changed = prevHash !== hash;

    const label = changed ? (prev ? "CHANGED" : "NEW") : "ok";
    if (verbose || changed) {
      console.log(`[${label.padEnd(7)}] ${url}  ${hash.slice(0, 12)}`);
    }

    if (showDiff && changed && prev) {
      const pretty = (s: string) => JSON.stringify(JSON.parse(s), null, 2) + "\n";
      const patch = createPatch(url, pretty(prev), pretty(normalized), "previous", "current");
      process.stdout.write(patch + "\n");
    }

    writeFileSync(stateFile, normalized);

    if (victoriametrics) saveVm(url, data);

    if (i < urls.length - 1) await sleep(waitSecs);
  }
}

async function main(): Promise<void> {
  const lychee = findLychee();
  if (verbose) process.stderr.write(`lychee: ${lychee}\n`);

  if (once) {
    await runOnce(lychee);
  } else {
    while (true) {
      await runOnce(lychee);
      if (verbose) process.stderr.write(`Sleeping ${interval}s until next run...\n`);
      await sleep(interval);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
