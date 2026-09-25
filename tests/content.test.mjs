// Enforces docs/denied-content.md. Runs before the build, over source files.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const textExtensions = /\.(ts|tsx|mjs|js|json|md|css|yml|yaml|conf|txt)$|(^|\/)(Dockerfile|\.gitignore|\.dockerignore)$/;
const trackedText = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter((path) => path && textExtensions.test(path) && path !== "package-lock.json" && existsSync(path));

// Files whose text reaches visitors of the site.
const siteSources = trackedText.filter((path) => /^(content|app|components)\//.test(path));
const siteText = siteSources.map((path) => [path, read(path)]);
const contentText = [["content/portfolio.ts", read("content/portfolio.ts")]];
const publicProse = [...siteText, ["README.md", read("README.md")]];
// The rule files quote the patterns they reject.
const ruleFiles = new Set(["tests/content.test.mjs", "docs/denied-content.md"]);

function assertNoMatch(files, pattern, reason) {
  for (const [path, text] of files) {
    const match = text.match(pattern);
    assert.equal(match, null, `${reason}: "${match?.[0]}" in ${path}`);
  }
}

test("site links every flagship repository", () => {
  const text = read("content/portfolio.ts");
  for (const name of [
    "cloud-data-finops-sdd-toolkit",
    "brazil-public-data-map",
    "education-finance-mlops",
    "pncp-opportunity-recommender",
    "ai-platform-rag-observability",
    "distributed-agent-runtime-lab",
  ]) {
    assert.match(text, new RegExp(name));
  }
});

test("denied: home address", () => {
  assertNoMatch(siteText, /Trindade|98561|Rua F/, "known address fragment");
  assertNoMatch(siteText, /\b(Rua|Avenida|Av\.|Travessa|Alameda|Quadra|Lote|Setor|CEP)\s/i, "address word");
  assertNoMatch(siteText, /\b\d{5}-\d{3}\b/, "postal code");
});

test("denied: telephone number", () => {
  assertNoMatch(siteText, /\+\s?55\b/, "Brazilian country code");
  assertNoMatch(siteText, /\(\d{2}\)\s?9?\d{4}-?\d{4}/, "phone number");
  assertNoMatch(siteText, /\b\d{2}\s?9\d{4}-\d{4}\b/, "mobile number");
  assertNoMatch(siteText, /\d{10,}/, "long digit run");
});

test("denied: email addresses other than the public professional one", () => {
  const allowed = new Set(["lucas.rangel@outlook.com"]);
  for (const path of trackedText) {
    for (const [address] of read(path).matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)) {
      if (/@\d/.test(address) || /\.(js|ts|tsx|mjs|css)$/.test(address)) continue; // package@version, imports
      assert.ok(allowed.has(address), `email address "${address}" in ${path}`);
    }
  }
});

test("denied: private infrastructure hosts, IPs, and deploy targets", () => {
  const allowedHosts = new Set(["github.com", "www.kaggle.com", "www.linkedin.com"]);
  for (const [path, text] of siteText) {
    for (const [, host] of text.matchAll(/https?:\/\/([^/"'\s`)]+)/g)) {
      assert.ok(allowedHosts.has(host), `host "${host}" in ${path} is not an approved public link`);
    }
  }
  for (const path of trackedText) {
    const text = read(path);
    for (const [ip] of text.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) {
      assert.ok(["127.0.0.1", "0.0.0.0"].includes(ip), `IP address "${ip}" in ${path}`);
    }
    if (ruleFiles.has(path)) continue;
    const infra = text.match(/hostinger|\bssh\s+\S+@|\bscp\s/i);
    assert.equal(infra, null, `personal-infrastructure reference "${infra?.[0]}" in ${path}`);
  }
  for (const path of trackedText.filter((p) => p.startsWith(".github/workflows/"))) {
    const step = read(path).match(/\bdeploy|secrets\.|ssh-action|appleboy/i);
    assert.equal(step, null, `deploy step or secret "${step?.[0]}" in ${path}`);
  }
});

test("denied: unverified claims", () => {
  assertNoMatch(publicProse, /production[- ]ready|enterprise[- ]grade|battle[- ]tested|world[- ]class/i, "unverified claim");
  assertNoMatch(publicProse, /\bcertified\b|\bcertification\b/i, "certification claim");
  assertNoMatch(publicProse, /\bcloud validated\b/i, "cloud-validation claim without a dated record");
  assertNoMatch(contentText, /\d+(\.\d+)?\s?%/, "percentage claim");
});

test("denied: employer-internal systems and client names (private term list)", (t) => {
  if (!existsSync(".denied-terms.local")) {
    t.skip(".denied-terms.local not present; private term check skipped");
    return;
  }
  const terms = read(".denied-terms.local")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  assert.ok(terms.length > 0, ".denied-terms.local is empty");
  for (const path of trackedText.filter((p) => p !== ".denied-terms.local")) {
    const text = read(path).toLowerCase();
    for (const term of terms) {
      assert.ok(!text.includes(term.toLowerCase()), `private term #${terms.indexOf(term) + 1} found in ${path}`);
    }
  }
});
