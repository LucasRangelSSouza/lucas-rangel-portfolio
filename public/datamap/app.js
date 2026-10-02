"use strict";
// Brazil Public Data Map: a static, dependency-free explorer over data/index.json and data/datasets/<slug>.json.
const $main = document.getElementById("main");
const state = { idx: null, ds: new Map(), cols: null, tables: new Map(), byDataset: new Map() };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Number(n).toLocaleString("en-US");
const human = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : b >= 1e3 ? (b / 1e3).toFixed(0) + " KB" : b + " B");
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const tid = (layer, table) => `${layer}/${table}`;
const href = {
  subject: (s) => `#/subject/${encodeURIComponent(s)}`,
  dataset: (s) => `#/dataset/${encodeURIComponent(s)}`,
  table: (id) => `#/table/${id.split("/").map(encodeURIComponent).join("/")}`,
};
const badge = (layer) => `<span class="badge ${layer}">${layer}</span>`;

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}
async function loadIndex() {
  const idx = await getJSON("data/index.json");
  state.idx = idx;
  for (const d of idx.datasets) {
    for (const t of d.tables) { state.tables.set(t.id, t); }
    state.byDataset.set(d.slug, d);
  }
  document.getElementById("stamp").textContent = `Map generated ${idx.generated_at}.`;
}
async function loadDataset(slug) {
  if (!state.ds.has(slug)) state.ds.set(slug, await getJSON(`data/datasets/${encodeURIComponent(slug)}.json`));
  return state.ds.get(slug);
}
async function loadColumns() {
  if (!state.cols) state.cols = await getJSON("data/columns.json");
  return state.cols;
}

function setNav(name) {
  document.querySelectorAll("nav a").forEach((a) => (a.dataset.nav === name ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
}
function setTitle(t) { document.title = t ? `${t} · Brazil Public Data Map` : "Brazil Public Data Map"; }
function render(html) { $main.innerHTML = html; $main.focus({ preventScroll: true }); window.scrollTo(0, 0); }

const subjectStats = () => {
  const out = new Map();
  for (const d of state.idx.datasets) {
    const s = out.get(d.subject) ?? { datasets: [], tables: 0, rows: 0, bytes: 0 };
    s.datasets.push(d); s.tables += d.table_count; s.rows += d.rows; s.bytes += d.bytes;
    out.set(d.subject, s);
  }
  return out;
};

// ---- views -------------------------------------------------------------------------------------------------

function viewHome() {
  setNav("home"); setTitle("");
  const idx = state.idx, stats = subjectStats();
  const tables = idx.datasets.reduce((a, d) => a + d.table_count, 0);
  const rows = idx.datasets.reduce((a, d) => a + d.rows, 0);
  const bytes = idx.datasets.reduce((a, d) => a + d.bytes, 0);
  const cards = [...stats.entries()].sort((a, b) => b[1].rows - a[1].rows).map(([id, s]) => {
    const info = idx.subjects[id] ?? {};
    return `<a class="card" href="${href.subject(id)}"><h3>${esc(info.title ?? id)}</h3><p>${esc(info.summary ?? "")}</p>
      <div class="meta"><span>${s.datasets.length} datasets</span><span>${s.tables} tables</span><span>${fmt(s.rows)} rows</span></div></a>`;
  }).join("");
  render(`
    <p class="crumbs">A map of the public data releases on Kaggle</p>
    <h1>Every table, every field,<br>and where it came from.</h1>
    <p class="lead">${idx.datasets.length} datasets from eleven Brazilian public sources, documented to the column. Follow a field back to the official source, see which tables it feeds, and find the keys that join one source to another.</p>
    <div class="stats">
      <div class="stat"><b>${idx.datasets.length}</b><span>Kaggle datasets</span></div>
      <div class="stat"><b>${tables}</b><span>tables</span></div>
      <div class="stat"><b>${fmt(rows)}</b><span>rows</span></div>
      <div class="stat"><b>${human(bytes)}</b><span>of Parquet</span></div>
      <div class="stat"><b>${idx.edges.length}</b><span>lineage links</span></div>
    </div>
    <h2>How a field travels</h2>
    <div class="flow" role="list">
      <div class="step" role="listitem"><h3>Official source</h3><p>API, spreadsheet, microdata ZIP or PDF published by the government body.</p></div>
      <div class="step" role="listitem"><h3><span class="dot raw"></span>Raw</h3><p>The source snapshot as delivered, with ingestion bookkeeping removed.</p></div>
      <div class="step" role="listitem"><h3><span class="dot trusted"></span>Trusted</h3><p>Typed, deduplicated, consistently named. One row per natural key.</p></div>
      <div class="step" role="listitem"><h3><span class="dot semantic"></span>Semantic</h3><p>Joined and reshaped for analysis. Each Kaggle dataset is either raw and trusted, or analytics.</p></div>
    </div>
    <h2>Sources</h2>
    <div class="grid">${cards}</div>
    <h2>Find a field</h2>
    <form class="search" action="#/search" onsubmit="location.hash='#/search?q='+encodeURIComponent(this.q.value);return false"><input type="search" name="q" placeholder="Search every column, e.g. codigo_municipio, valor_total_estimado" aria-label="Search fields"><button>Search</button></form>
    <p class="note">The descriptions are the originals from the source lake's catalogue, in Portuguese. About a third of the column descriptions are marked there as AI generated, and the map shows that mark. Treat them as a reading aid; the official source is the reference.</p>`);
}

function viewSubject(id) {
  setNav("home");
  const info = state.idx.subjects[id];
  if (!info) return notFound();
  setTitle(info.title);
  const dsets = state.idx.datasets.filter((d) => d.subject === id);
  const rows = dsets.map((d) => `<tr><td><a href="${href.dataset(d.slug)}"><code>${esc(d.slug)}</code></a></td><td><span class="badge kind">${d.kind}</span></td><td class="num">${d.table_count}</td><td class="num">${fmt(d.rows)}</td><td class="num">${human(d.bytes)}</td></tr>`).join("");
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / ${esc(info.title)}</p>
    <h1>${esc(info.title)}</h1>
    <p class="lead">${esc(info.summary)}</p>
    <dl class="kv">
      <dt>Publisher</dt><dd>${esc(info.publisher)}</dd>
      <dt>Official source</dt><dd><a href="${esc(info.official_url)}" rel="noopener">${esc(info.official_url)}</a></dd>
      <dt>Grain and keys</dt><dd>${esc(info.grain)}</dd>
      <dt>How it is fetched</dt><dd>${esc(info.how_to_fetch)}</dd>
      ${info.notebook ? `<dt>Ingestion notebook</dt><dd><a href="https://github.com/LucasRangelSSouza/brazil-public-data-map/blob/main/notebooks/sources/${esc(info.notebook)}.ipynb" rel="noopener">notebooks/sources/${esc(info.notebook)}.ipynb</a></dd>` : ""}
    </dl>
    <h2>Datasets</h2>
    <div class="tablewrap"><table><thead><tr><th>Dataset</th><th>Kind</th><th>Tables</th><th>Rows</th><th>Size</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p><a class="btn" href="#/lineage?s=${encodeURIComponent(id)}">See the lineage of this source</a></p>`);
}

function tableRows(tables, withDataset) {
  return tables.map((t) => `<tr><td>${badge(t.layer)}</td><td><a href="${href.table(t.id)}"><code>${esc(t.table)}</code></a></td>${withDataset ? `<td><a href="${href.dataset(t.dataset)}"><code>${esc(t.dataset)}</code></a></td>` : ""}<td class="num">${fmt(t.rows)}</td><td class="num">${t.column_count}</td><td class="num">${t.upstream.length}/${t.downstream.length}</td><td class="num">${human(t.bytes)}</td></tr>`).join("");
}

function viewDataset(slug) {
  setNav("home");
  const d = state.byDataset.get(slug);
  if (!d) return notFound();
  setTitle(d.slug);
  const info = state.idx.subjects[d.subject] ?? {};
  const layers = [...new Set(d.tables.map((t) => t.layer))];
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / <a href="${href.subject(d.subject)}">${esc(info.title ?? d.subject)}</a> / ${esc(d.slug)}</p>
    <h1>${esc(d.title)}</h1>
    <p class="lead">${d.table_count} tables, ${fmt(d.rows)} rows, ${human(d.bytes)} of Parquet. Snapshot ${esc(d.snapshot_date)}.</p>
    <p><a class="btn" href="${esc(d.url)}" rel="noopener">Open on Kaggle</a> <a class="btn" href="https://github.com/LucasRangelSSouza/brazil-public-data-map/blob/main/docs/datamap/${esc(d.slug)}.md" rel="noopener">Dictionary in Markdown</a></p>
    <h2>Read it</h2>
    <pre>import kagglehub, pandas as pd
root = kagglehub.dataset_download("${esc(d.owner)}/${esc(d.slug)}")
df = pd.read_parquet(f"{root}/${esc(d.tables[0].file)}")</pre>
    <p class="desc">Every file is named <code>&lt;layer&gt;__&lt;table&gt;.parquet</code> at the root of the dataset, next to <code>release_manifest.json</code> (SHA-256 of every file), <code>schemas.json</code>, <code>audit.json</code>, <code>DATA_DICTIONARY.md</code> and the notebooks.</p>
    <h2>Tables</h2>
    <div class="search"><input type="search" id="tfilter" placeholder="Filter tables" aria-label="Filter tables">${layers.map((l) => `<button class="chip on" data-layer="${l}" aria-pressed="true">${l}</button>`).join("")}</div>
    <div class="tablewrap"><table><thead><tr><th>Layer</th><th>Table</th><th>Rows</th><th>Columns</th><th title="upstream/downstream tables">Up/down</th><th>Size</th></tr></thead><tbody id="trows"></tbody></table></div>`);
  const on = new Set(layers);
  const draw = () => {
    const q = norm(document.getElementById("tfilter").value);
    document.getElementById("trows").innerHTML = tableRows(d.tables.filter((t) => on.has(t.layer) && norm(t.table).includes(q)), false);
  };
  document.getElementById("tfilter").addEventListener("input", draw);
  document.querySelectorAll("button[data-layer]").forEach((b) => b.addEventListener("click", () => {
    const l = b.dataset.layer; on.has(l) ? on.delete(l) : on.add(l);
    b.classList.toggle("on", on.has(l)); b.setAttribute("aria-pressed", on.has(l)); draw();
  }));
  draw();
}

async function viewTable(layer, table) {
  setNav("home");
  const id = tid(layer, table), meta = state.tables.get(id);
  if (!meta) return notFound();
  setTitle(table);
  render(`<p class="loading">Loading ${esc(table)}…</p>`);
  const ds = await loadDataset(meta.dataset);
  const t = ds.tables.find((x) => x.id === id);
  const info = state.idx.subjects[t.subject] ?? {};
  const keyCols = new Map(state.idx.joins.map((j) => [j.column, j]));
  const links = (ids) => ids.length ? ids.map((x) => `<a class="chip" href="${href.table(x)}">${badge(x.split("/")[0])} <code>${esc(x.split("/")[1])}</code></a>`).join(" ") : "<span class=\"desc\">none recorded</span>";
  const ai = t.ai_described_columns;
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / <a href="${href.subject(t.subject)}">${esc(info.title ?? t.subject)}</a> / <a href="${href.dataset(t.dataset)}">${esc(t.dataset)}</a></p>
    <h1><code>${esc(t.table)}</code> ${badge(t.layer)}</h1>
    <p class="meta"><span>${fmt(t.rows)} rows</span><span>${t.column_count} columns</span><span>${human(t.bytes)} Parquet</span><span>file <code>${esc(t.file)}</code></span></p>
    ${t.description ? `<p class="tdesc">${esc(t.description)}</p>` : ""}
    <dl class="kv">
      <dt>Dataset</dt><dd><a href="${href.dataset(t.dataset)}"><code>${esc(t.dataset)}</code></a> · <a href="https://www.kaggle.com/datasets/${esc(ds.owner)}/${esc(t.dataset)}" rel="noopener">Kaggle</a></dd>
      <dt>Official source</dt><dd><a href="${esc(info.official_url)}" rel="noopener">${esc(info.publisher)}</a></dd>
      <dt>Built from</dt><dd><div class="chips">${links(t.upstream)}</div></dd>
      <dt>Feeds</dt><dd><div class="chips">${links(t.downstream)}</div></dd>
      <dt>Descriptions</dt><dd>${t.described_columns} of ${t.column_count} columns described${ai ? `, ${ai} marked as AI generated at the source` : ""}</dd>
    </dl>
    ${lineageSection(id)}
    <h2>Columns</h2>
    <div class="search"><input type="search" id="cfilter" placeholder="Filter columns by name, type or description" aria-label="Filter columns"><select id="ctype" aria-label="Type"><option value="">All types</option>${[...new Set(t.columns.map((c) => c.type))].sort().map((x) => `<option>${x}</option>`).join("")}</select></div>
    <div class="tablewrap"><table><thead><tr><th>Column</th><th>Type</th><th>Description</th></tr></thead><tbody id="crows"></tbody></table></div>
    <div class="pager"><button id="prev">Previous</button><span id="pinfo"></span><button id="next">Next</button></div>`);
  wireGraphLinks();
  let page = 0, list = t.columns;
  const PER = 100;
  const draw = () => {
    const q = norm(document.getElementById("cfilter").value), ty = document.getElementById("ctype").value;
    list = t.columns.filter((c) => (!ty || c.type === ty) && (!q || norm(c.name).includes(q) || norm(c.description).includes(q)));
    const pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages - 1);
    document.getElementById("crows").innerHTML = list.slice(page * PER, (page + 1) * PER).map((c) => {
      const j = keyCols.get(c.name);
      return `<tr><td><code>${esc(c.name)}</code>${j ? ` <a class="chip" href="#/joins?c=${encodeURIComponent(c.name)}" title="appears in ${j.table_count} tables across ${j.subjects.length} sources">join key</a>` : ""}</td><td><code>${esc(c.type)}</code></td><td class="desc">${esc(c.description)}${c.description.includes("gerada por IA") ? "" : ""}</td></tr>`;
    }).join("") || `<tr><td colspan="3" class="desc">No column matches.</td></tr>`;
    document.getElementById("pinfo").textContent = `${fmt(list.length)} columns · page ${page + 1} of ${pages}`;
    document.getElementById("prev").disabled = page === 0; document.getElementById("next").disabled = page >= pages - 1;
  };
  document.getElementById("cfilter").addEventListener("input", () => { page = 0; draw(); });
  document.getElementById("ctype").addEventListener("change", () => { page = 0; draw(); });
  document.getElementById("prev").addEventListener("click", () => { page--; draw(); });
  document.getElementById("next").addEventListener("click", () => { page++; draw(); });
  draw();
}

// ---- lineage graph -----------------------------------------------------------------------------------------

const LAYER_COLOR = { raw: ["--raw", "--raw-bg"], trusted: ["--trusted", "--trusted-bg"], semantic: ["--semantic", "--semantic-bg"] };
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

/** nodes: [{id, col, label, layer}], edges: [{from, to, inferred}] -> SVG string. Columns left to right, rows packed per column. */
function drawGraph(nodes, edges, focus) {
  const W = 230, H = 30, GX = 90, GY = 10, PAD = 16;
  const cols = [...new Set(nodes.map((n) => n.col))].sort((a, b) => a - b);
  const pos = new Map();
  cols.forEach((c, ci) => nodes.filter((n) => n.col === c).sort((a, b) => a.label.localeCompare(b.label)).forEach((n, ri) => pos.set(n.id, { x: PAD + ci * (W + GX), y: PAD + ri * (H + GY), n })));
  const width = PAD * 2 + cols.length * W + (cols.length - 1) * GX;
  const height = PAD * 2 + Math.max(...cols.map((c) => nodes.filter((n) => n.col === c).length)) * (H + GY);
  const paths = edges.filter((e) => pos.has(e.from) && pos.has(e.to)).map((e) => {
    const a = pos.get(e.from), b = pos.get(e.to), x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
    return `<path class="edge${e.inferred ? " inferred" : ""}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
  }).join("");
  const boxes = [...pos.values()].map(({ x, y, n }) => {
    const [stroke, fill] = LAYER_COLOR[n.layer];
    const label = n.label.length > 31 ? n.label.slice(0, 30) + "…" : n.label;
    return `<g class="node" tabindex="0" role="link" aria-label="${esc(n.layer)} ${esc(n.label)}" data-id="${esc(n.id)}"><title>${esc(n.id)}</title><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="7" fill="${css(fill)}" stroke="${n.id === focus ? css("--ink") : css(stroke)}"/><text x="${x + 10}" y="${y + 19}">${esc(label)}</text></g>`;
  }).join("");
  return `<div class="graph"><svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Lineage graph">${paths}${boxes}</svg></div>`;
}
function wireGraphLinks() {
  document.querySelectorAll(".graph .node").forEach((g) => {
    const go = () => { location.hash = href.table(g.dataset.id); };
    g.addEventListener("click", go);
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
}
function lineageSection(id) {
  const edges = state.idx.edges, out = new Map(), inn = new Map();
  for (const e of edges) { (out.get(e.from) ?? out.set(e.from, []).get(e.from)).push(e); (inn.get(e.to) ?? inn.set(e.to, []).get(e.to)).push(e); }
  const nodes = new Map([[id, 0]]), used = [];
  const walk = (start, map, dir) => {
    let frontier = [start];
    for (let depth = 1; depth <= 3; depth++) {
      const next = [];
      for (const cur of frontier) for (const e of map.get(cur) ?? []) {
        const other = dir > 0 ? e.to : e.from;
        used.push(e);
        if (!nodes.has(other)) { nodes.set(other, dir * depth); next.push(other); }
      }
      frontier = next;
    }
  };
  walk(id, out, 1); walk(id, inn, -1);
  if (nodes.size === 1) return `<h2>Lineage</h2><p class="desc">No query lineage was recorded for this table. It was loaded by a job that does not leave a query trail, or it is a first-level table read directly from the source.</p>`;
  const list = [...nodes.entries()].map(([nid, depth]) => {
    const [layer, label] = nid.split("/");
    return { id: nid, col: depth, layer, label };
  });
  return `<h2>Lineage</h2><div class="legend"><span><span class="dot raw"></span> raw</span><span><span class="dot trusted"></span> trusted</span><span><span class="dot semantic"></span> semantic</span><span>Solid links come from recorded queries; dashed links are inferred from the shared table name.</span></div>${drawGraph(list, used, id)}`;
}

function viewLineage(params) {
  setNav("lineage"); setTitle("Lineage");
  const stats = subjectStats(), subjects = [...stats.keys()].sort();
  const s = params.get("s") || subjects[0];
  const own = new Set(state.idx.datasets.filter((d) => d.subject === s).flatMap((d) => d.tables.map((t) => t.id)));
  const edges = state.idx.edges.filter((e) => own.has(e.from) || own.has(e.to));
  const nodeIds = new Set(edges.flatMap((e) => [e.from, e.to]));
  const LAYERS = { raw: 0, trusted: 1, semantic: 2 };
  const MAX = 70;
  let nodes = [...nodeIds].map((nid) => { const [layer, label] = nid.split("/"); return { id: nid, col: LAYERS[layer], layer, label: own.has(nid) ? label : `↗ ${label}` }; });
  const total = nodes.length;
  const keep = new Set(nodes.slice(0, 400).map((n) => n.id));
  let capped = "";
  for (const layer of Object.keys(LAYERS)) {
    const inLayer = nodes.filter((n) => n.layer === layer);
    if (inLayer.length > MAX) { const drop = new Set(inLayer.slice(MAX).map((n) => n.id)); nodes = nodes.filter((n) => !drop.has(n.id)); capped = ` Showing the first ${MAX} per layer.`; }
  }
  const isolated = [...own].filter((x) => !nodeIds.has(x));
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / Lineage</p>
    <h1>Lineage</h1>
    <p class="lead">Tables of one source and the tables they are built from or feed. Click a table to open it. Tables marked ↗ belong to another source.</p>
    <div class="chips" role="group" aria-label="Source">${subjects.map((x) => `<a class="chip${x === s ? " on" : ""}" href="#/lineage?s=${encodeURIComponent(x)}">${esc(state.idx.subjects[x]?.title ?? x)}</a>`).join("")}</div>
    <div class="legend"><span><span class="dot raw"></span> raw</span><span><span class="dot trusted"></span> trusted</span><span><span class="dot semantic"></span> semantic</span><span>${nodes.length} of ${total} connected tables.${capped}</span></div>
    ${nodes.length ? drawGraph(nodes, edges.filter((e) => nodes.some((n) => n.id === e.from) && nodes.some((n) => n.id === e.to)), null) : `<p class="note">No recorded lineage for this source.</p>`}
    ${isolated.length ? `<h2>Tables without a recorded link</h2><p class="desc">${isolated.length} tables of this source were loaded without a query trail, mostly first-level snapshots read straight from the source.</p>` : ""}`);
  wireGraphLinks();
}

function viewJoins(params) {
  setNav("joins"); setTitle("Joins");
  const joins = state.idx.joins, pick = params.get("c");
  const sel = joins.find((j) => j.column === pick);
  const list = joins.map((j) => `<tr><td><a href="#/joins?c=${encodeURIComponent(j.column)}"><code>${esc(j.column)}</code></a></td><td class="num">${j.subjects.length}</td><td class="num">${j.table_count}</td><td>${j.types.map((x) => `<code>${esc(x)}</code>`).join(" ")}</td><td class="desc">${j.subjects.map((x) => esc(state.idx.subjects[x]?.title ?? x)).join(", ")}</td></tr>`).join("");
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / Joins</p>
    <h1>Joins between sources</h1>
    <p class="lead">A column name that appears in the trusted or semantic tables of several sources is a practical join key. The municipality code <code>codigo_municipio</code> (IBGE, seven digits) links almost every education table to <code>obt_ibge_municipio</code>. Check types and grain before joining: a key is a candidate, not a guarantee.</p>
    ${sel ? `<h2><code>${esc(sel.column)}</code></h2><div class="chips">${sel.tables.map((x) => `<a class="chip" href="${href.table(x)}">${badge(x.split("/")[0])} <code>${esc(x.split("/")[1])}</code></a>`).join(" ")}</div>${sel.table_count > sel.tables.length ? `<p class="desc">First ${sel.tables.length} of ${sel.table_count} tables.</p>` : ""}` : ""}
    <h2>Shared columns</h2>
    <div class="tablewrap"><table><thead><tr><th>Column</th><th>Sources</th><th>Tables</th><th>Types</th><th>Sources</th></tr></thead><tbody>${list}</tbody></table></div>`);
}

async function viewSearch(params) {
  setNav("search"); setTitle("Search fields");
  const q0 = params.get("q") ?? "";
  render(`
    <p class="crumbs"><a href="#/">Overview</a> / Search fields</p>
    <h1>Search fields</h1>
    <p class="lead">Searches the name and description of every column in every table.</p>
    <div class="search"><input type="search" id="q" value="${esc(q0)}" placeholder="Column name or word in the description" aria-label="Search"><select id="layer" aria-label="Layer"><option value="">All layers</option><option>raw</option><option>trusted</option><option>semantic</option></select></div>
    <p id="status" class="desc">Loading the field index (about 6 MB, loaded once)…</p>
    <div class="tablewrap"><table><thead><tr><th>Table</th><th>Column</th><th>Type</th><th>Description</th></tr></thead><tbody id="rows"></tbody></table></div>`);
  const cols = await loadColumns();
  const draw = () => {
    const q = norm(document.getElementById("q").value).trim(), layer = document.getElementById("layer").value;
    if (q.length < 2) { document.getElementById("status").textContent = `${fmt(cols.length)} fields indexed. Type at least two characters.`; document.getElementById("rows").innerHTML = ""; return; }
    const hit = []; let n = 0;
    for (const c of cols) {
      if (layer && !c[0].startsWith(layer + "/")) continue;
      if (norm(c[1]).includes(q) || norm(c[3]).includes(q)) { n++; if (hit.length < 200) hit.push(c); }
    }
    document.getElementById("status").textContent = `${fmt(n)} matching fields${n > 200 ? ", showing the first 200" : ""}.`;
    document.getElementById("rows").innerHTML = hit.map((c) => `<tr><td>${badge(c[0].split("/")[0])} <a href="${href.table(c[0])}"><code>${esc(c[0].split("/")[1])}</code></a></td><td><code>${esc(c[1])}</code></td><td><code>${esc(c[2])}</code></td><td class="desc">${esc(c[3])}</td></tr>`).join("");
  };
  document.getElementById("q").addEventListener("input", draw);
  document.getElementById("layer").addEventListener("change", draw);
  draw();
}

function notFound() { setTitle("Not found"); render(`<h1>Not found</h1><p class="lead">That page is not in the map. <a href="#/">Back to the overview</a>.</p>`); }

// ---- router ------------------------------------------------------------------------------------------------

async function route() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  try {
    if (!parts.length) return viewHome();
    if (parts[0] === "subject") return viewSubject(parts[1]);
    if (parts[0] === "dataset") return viewDataset(parts[1]);
    if (parts[0] === "table") return await viewTable(parts[1], parts[2]);
    if (parts[0] === "lineage") return viewLineage(params);
    if (parts[0] === "joins") return viewJoins(params);
    if (parts[0] === "search") return await viewSearch(params);
    notFound();
  } catch (e) {
    render(`<h1>Something failed</h1><p class="lead">${esc(e.message)}</p>`);
  }
}
window.addEventListener("hashchange", route);
loadIndex().then(route).catch((e) => render(`<h1>The map data could not be loaded</h1><p class="lead">${esc(e.message)}. Serve this folder over HTTP (for example <code>python -m http.server</code> in <code>datamap/site</code>) instead of opening the file directly.</p>`));
