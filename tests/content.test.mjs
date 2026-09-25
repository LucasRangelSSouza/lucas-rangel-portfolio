import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("site content excludes residential and telephone data", () => { const text = readFileSync("content/portfolio.ts", "utf8"); assert.doesNotMatch(text, /Trindade|98561|Rua F/); });
test("site links every flagship repository", () => { const text = readFileSync("content/portfolio.ts", "utf8"); for (const name of ["cloud-data-finops-sdd-toolkit","brazil-public-data-map","education-finance-mlops","pncp-opportunity-recommender","ai-platform-rag-observability","distributed-agent-runtime-lab"]) assert.match(text, new RegExp(name)); });
