// Link checker for the static export.
//   node scripts/check-links.mjs             internal anchors and files only (CI)
//   node scripts/check-links.mjs --external  also requests GitHub and Kaggle links
// LinkedIn answers automated requests with HTTP 999, so it is listed but not requested.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const outDir = "out";
const html = readFileSync(join(outDir, "index.html"), "utf8");
const checkExternal = process.argv.includes("--external");

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const hrefs = [...new Set([...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]))];
const failures = [];
const report = { anchors: 0, files: 0, externalChecked: 0, externalSkipped: [] };

const checkedHosts = [/^https:\/\/github\.com\/LucasRangelSSouza(\/|$)/, /^https:\/\/www\.kaggle\.com\//];

for (const href of hrefs) {
  if (href.startsWith("#")) {
    report.anchors += 1;
    if (!ids.has(href.slice(1))) failures.push(`missing anchor target: ${href}`);
  } else if (href.startsWith("/")) {
    report.files += 1;
    const path = decodeURIComponent(href.split(/[?#]/)[0]);
    if (!existsSync(join(outDir, path))) failures.push(`missing file: ${href}`);
  }
}

const external = hrefs.filter((href) => /^https?:\/\//.test(href) && !href.includes("/_next/"));
for (const href of external) {
  if (!checkExternal || !checkedHosts.some((pattern) => pattern.test(href))) {
    report.externalSkipped.push(href);
    continue;
  }
  report.externalChecked += 1;
  try {
    const response = await fetch(href, { redirect: "follow", headers: { "user-agent": "portfolio-link-check" } });
    if (response.status >= 400) failures.push(`${response.status} ${href}`);
    else console.log(`ok ${response.status} ${href}`);
  } catch (error) {
    failures.push(`network error ${href}: ${error.message}`);
  }
}

console.log(
  `anchors: ${report.anchors}, local files: ${report.files}, external checked: ${report.externalChecked}, external not requested: ${report.externalSkipped.length}`,
);
for (const href of report.externalSkipped) console.log(`  not requested: ${href}`);
if (failures.length) {
  console.error(`\n${failures.length} broken link(s):\n${failures.join("\n")}`);
  process.exit(1);
}
