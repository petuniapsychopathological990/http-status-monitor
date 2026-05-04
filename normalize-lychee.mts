/**
 * normalize-lychee.mts
 *
 * Reads lychee --format json output from stdin, strips dynamic fields
 * (span, duration), sorts all object arrays deterministically, and
 * writes canonical JSON to stdout.
 *
 * Usage:
 *   ./lychee --format json https://example.com/ | tsx normalize-lychee.mts
 *   ./lychee --format json https://example.com/ | tsx normalize-lychee.mts | sha256sum
 */

import canonicalize from "canonicalize";

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

const input = await new Promise<string>((resolve) => {
  const chunks: Buffer[] = [];
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
});

const data = JSON.parse(input.trim());
const normalized = (canonicalize(removeDynamic(data)) as string) + "\n";
process.stdout.write(normalized);
