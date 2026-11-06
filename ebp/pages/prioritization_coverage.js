/**
 * The Coverage view — where THIS LIST fills gaps in the assembly tree. [Task 6]
 *
 *   const view = PrioritizationCoverage.render(host, {payload});
 *
 * The mockup's fourth tab, built from the submission payload and nothing else.
 * Every row already carries `Phylum` … `Genus`, the five `First_in_*` flags and
 * `Has_Assembly`, so this view issues no request, needs no endpoint, and cannot
 * disagree with the Results table — it is the same rows, grouped by lineage
 * instead of listed.
 *
 * NOT the deferred network page. C.0 (`prioritization_network.html` +
 * `/api/catalog/first-in-taxa-summary`) answers "where are the gaps across all
 * ~24,000 assemblies", which needs the reference catalog and is a different
 * question with a different denominator. This one answers "of the species I
 * submitted, where would they be firsts" — denominator: your list. The two got
 * conflated under the word "network" in the plan; they are not substitutes.
 *
 * THE THREE-WAY SPLIT IS THE WHOLE POINT, and folding it to two would be a lie.
 * Within a phylum a species is one of:
 *
 *   * NOVEL      — would be a first at some level (`Taxonomic_Priority` is one
 *                  of the `Highest_*`), broken down by how broad that first is.
 *   * COVERED    — an assembly exists, or the taxon is already represented
 *                  (`Already_Covered` / `High_S`). A real finding.
 *   * UNASSESSED — `Unknown_G` / `Unknown_S` / `Unknown`: not found in GoaT, or
 *                  found with no lineage. **This is not "no gap here."** A
 *                  phylum that is 40% unassessed is a phylum we cannot speak
 *                  about, and drawing it as covered would turn missing evidence
 *                  into a negative finding — the one error this whole tool
 *                  exists to avoid making.
 *
 * Species whose `Phylum` is blank are grouped under a named "lineage not
 * resolved" row rather than dropped, for the same reason: a total that silently
 * excludes rows is a total nobody can check.
 */

const PrioritizationCoverage = (function () {
  'use strict';

  /* Broadest first — the ordering the workbook sorts by and the one the colour
     ramp encodes. A species is counted at exactly one of these: its
     `Taxonomic_Priority`, which is already the broadest level it is first at. */
  const NOVEL_LEVELS = [
    ['Highest_P', 'Phylum'], ['Highest_C', 'Class'], ['Highest_O', 'Order'],
    ['Highest_F', 'Family'], ['Highest_G', 'Genus'],
  ];
  const NOVEL = NOVEL_LEVELS.map((level) => level[0]);
  const UNASSESSED = ['Unknown_G', 'Unknown_S', 'Unknown'];

  /* Every colour here is a label's workbook fill, read from Panel B's table
     (FILL_TAX in prioritization_species.js), so a segment matches the chip in
     Results and the cell in ALL_SPECIES (Fang, 2026-11-06). Novel = the green
     ramp, darkest = broadest gap; covered = High_S's pale green; not assessable =
     solid grey. Grey if this view is ever loaded without Panel B. */
  let warned = false;
  function swatch(label) {
    const ready = typeof PrioritizationSpecies !== 'undefined' && PrioritizationSpecies.fill;
    if (!ready && !warned) {
      warned = true;
      console.warn('Coverage: prioritization_species.js has no label colours (missing, or an '
        + 'older cached copy), so every segment is drawn grey. Reload with the cache cleared.');
    }
    const found = ready ? PrioritizationSpecies.fill('tax', label) : null;
    return found ? found.fill : '#9e9e9e';
  }

  /* Not assessable: solid, like the other segments (Fang, 2026-11-06; it was a
     hatch). Not the workbook's Unknown_G BDBDBD: beside High_S's pale green that
     scores OKLab dE 8.8, under the dataviz floor of 15. #8a8a8a clears covered and
     every green step (worst dE 15.7 normal vision, 8.6 colour-blind) and reads
     against the empty track at 3.2:1. */
  const UNASSESSED_GREY = '#8a8a8a';

  const RANKS = ['Phylum', 'Class', 'Order', 'Family', 'Genus'];

  const esc = (value) => String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (value) => (value || 0).toLocaleString();

  /* Bucket key for a row whose rank is blank. Underscored because a taxon name
     never contains one, so it cannot collide with a real group. */
  const UNRESOLVED = '__unresolved__';

  // ── styles ────────────────────────────────────────────────────────────────
  const STYLE_ID = 'ebp-coverage-styles';
  const STYLES = `

  .ebp-cov-lede{font-size:14px; color:var(--paper-dim,#a6bcaf); line-height:1.6; margin:0 0 16px;}
  .ebp-cov-lede b{color:var(--paper,#e9f2ec); font-variant-numeric:tabular-nums;}

  .ebp-cov-key{display:flex; gap:14px 18px; flex-wrap:wrap; align-items:center; margin-bottom:14px;
    font-size:13px; color:var(--paper-dim,#a6bcaf);}
  .ebp-cov-key span{display:inline-flex; align-items:center; gap:6px;}
  .ebp-cov-key i{width:11px; height:11px; border-radius:3px; display:inline-block;}
  .ebp-cov-key select{font:inherit; font-size:13px; padding:5px 9px; background:var(--ink,#0b1310);
    color:var(--paper,#e9f2ec); border:1px solid var(--line,#22362b); border-radius:7px; cursor:pointer;}

  .ebp-cov-tbl{background:var(--ink-2,#0f1a14); border:1px solid var(--line,#22362b);
    border-radius:var(--radius,14px); overflow:hidden;}
  /* Two columns, taxon and bar. A third, "Firsts", was dropped (Fang, 2026-11-06):
     the bar's green segments already show how many firsts there are at each
     level, and the bare count beside it read as "first at this rank", which it
     was not. */
  .ebp-cov-row{display:grid; grid-template-columns:minmax(140px,1.1fr) minmax(160px,3fr);
    gap:14px; align-items:center; padding:11px 18px; border-top:1px solid var(--line-soft,#1a2a20);}
  .ebp-cov-row:first-child{border-top:none;}
  .ebp-cov-row.head{background:var(--ink-3,#14231b); font-size:13px; text-transform:uppercase;
    letter-spacing:.03em; color:var(--paper-mute,#6f8a7b); font-weight:700; padding:9px 18px;}
  .ebp-cov-row.sub{padding-left:38px; background:color-mix(in srgb, var(--ink-3,#14231b) 55%, transparent);}
  .ebp-cov-row.sub .taxon{font-size:13px;}
  .ebp-cov-taxon{min-width:0;}
  .ebp-cov-taxon .taxon{font-size:13.5px; font-weight:600; color:var(--paper,#e9f2ec);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
  .ebp-cov-taxon .n{font-size:13px; color:var(--paper-mute,#6f8a7b); font-variant-numeric:tabular-nums;}
  .ebp-cov-open{background:none; border:none; padding:0; font:inherit; color:inherit; cursor:pointer;
    display:flex; align-items:center; gap:6px; text-align:left; width:100%;}
  /* Big and dark enough to be seen as a control (Fang, 2026-11-06: at 9px pale it
     read as a stray mark, and nobody found that the rows open). */
  .ebp-cov-open .caret{font-size:14px; line-height:1; color:var(--paper-dim,#a6bcaf); flex:none; width:14px;}
  /* The break-down control, under "Phylum" in the header row (Fang, 2026-11-06).
     The header's caps and weight are undone for it: it is a sentence and a control. */
  .ebp-cov-row.head .ebp-cov-headcell{grid-column:1 / -1;}
  .ebp-cov-rk{display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:6px;
    text-transform:none; letter-spacing:normal; font-weight:500; color:var(--paper-mute,#6f8a7b);}
  .ebp-cov-rk label{color:var(--paper-dim,#a6bcaf); font-weight:600;}
  .ebp-cov-rk select{font:inherit; font-size:13px; padding:5px 9px; background:var(--ink,#0b1310);
    color:var(--paper,#e9f2ec); border:1px solid var(--line,#22362b); border-radius:7px; cursor:pointer;}
  .ebp-cov-open:hover .taxon{color:var(--green-glow,#5fd39a);}

  /* Segments size by flex-grow = their species count, so they always fill the bar
     exactly (rounded percentages used to leave a sliver of empty track), and a 2px
     gap of track separates neighbours, so two close colours still read as two. */
  /* Each bar's LENGTH is its species count on one scale, the largest phylum row
     (Fang, 2026-11-06: a 190-species phylum and an 11-species one were the same
     width). Expanded rows use the same scale, so a family reads as a piece of its
     phylum rather than being re-stretched. min-width keeps a 1-species row visible. */
  .ebp-cov-bar{display:flex; gap:2px; height:15px; border-radius:4px; overflow:hidden; min-width:6px;
    background:var(--ink,#0b1310); border:1px solid var(--line,#22362b);}
  .ebp-cov-bar i{display:block; height:100%; flex:0 1 0; min-width:2px;}
  /* Covered is High_S's pale green, set inline from swatch() like the novel
     segments. Not a surface tint (--ink-4): on a white card that is very nearly
     the empty track, so a covered third read as nothing. The pale green clears
     the genus step by OKLab dE 16 (dataviz floor 15), the reason the green ramp
     was re-stepped (2026-11-06). (No backticks in this block — it lives inside a
     template literal.) */
  /* Solid grey; see UNASSESSED_GREY. (No backticks in this block — it lives inside a
     template literal.) */
  .ebp-cov-bar i.un{background:#8a8a8a;}


  .ebp-cov-empty{padding:26px 18px; text-align:center; color:var(--paper-mute,#6f8a7b); font-size:13px;}
  @media (max-width:720px){
    .ebp-cov-row{grid-template-columns:minmax(110px,1fr) minmax(90px,1.8fr); gap:9px; padding:10px 12px;}
    .ebp-cov-row.sub{padding-left:24px;}
  }
  `;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }

  function novelColor(label) {
    return swatch(label);
  }

  // ── aggregation ───────────────────────────────────────────────────────────

  /**
   * Group rows by one rank into the three-way split.
   *
   * `rows` is whatever subset the caller wants counted — the whole list for the
   * top level, one phylum's rows for a drill-down — so the same function serves
   * both and the sub-rows cannot drift from their parent.
   */
  function group(rows, rank) {
    const buckets = new Map();
    rows.forEach(function (row) {
      const key = String(row[rank] || '').trim() || UNRESOLVED;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { key: key, total: 0, novel: 0, covered: 0, unassessed: 0, levels: {} };
        buckets.set(key, bucket);
      }
      bucket.total += 1;
      const label = row.Taxonomic_Priority;
      if (NOVEL.indexOf(label) >= 0) {
        bucket.novel += 1;
        bucket.levels[label] = (bucket.levels[label] || 0) + 1;
      } else if (UNASSESSED.indexOf(label) >= 0) {
        bucket.unassessed += 1;
      } else {
        bucket.covered += 1;
      }
    });

    /* Largest group first (Fang, 2026-11-06; was most firsts first): the bars are
       drawn to one species scale, so the list reads as one descending stack and
       the firsts column says where the novelty sits. Ties break on firsts, then
       the name, so the order is stable across renders. Sub-rows sort the same
       way. Unresolved lineage always sorts last: it is a data-quality row, not a
       finding. */
    return Array.from(buckets.values()).sort(function (a, b) {
      if (a.key === UNRESOLVED) return 1;
      if (b.key === UNRESOLVED) return -1;
      return (b.total - a.total) || (b.novel - a.novel) || (a.key < b.key ? -1 : 1);
    });
  }

  // ── rendering ─────────────────────────────────────────────────────────────

  /* The species count of the largest top-level row; set by draw(). */
  let scaleMax = 1;

  function bar(bucket) {
    const segments = NOVEL_LEVELS
      .filter((level) => bucket.levels[level[0]])
      .map(function (level) {
        const count = bucket.levels[level[0]];
        return '<i style="flex-grow:' + count + '; background:'
          + novelColor(level[0]) + '" title="' + esc(count + ' would be the first assembly in its '
          + level[1].toLowerCase()) + '"></i>';
      }).join('');
    const covered = bucket.covered
      ? '<i class="cov" style="flex-grow:' + bucket.covered + '; background:' + swatch('High_S') + '" title="'
        + esc(bucket.covered + ' already covered — an assembly exists, or the taxon is already '
          + 'represented by a sequenced species') + '"></i>'
      : '';
    const unassessed = bucket.unassessed
      ? '<i class="un" style="flex-grow:' + bucket.unassessed + '" title="'
        + esc(bucket.unassessed + ' could not be assessed — not found in GoaT, or found without '
          + 'lineage. Not the same as “no gap here”; verify these names.') + '"></i>'
      : '';
    const width = Math.min(100, (bucket.total / scaleMax) * 100);
    return '<div class="ebp-cov-bar" style="width:' + width.toFixed(2) + '%">'
      + segments + covered + unassessed + '</div>';
  }

  function taxonCell(bucket, expandable, open, id) {
    const name = bucket.key === UNRESOLVED ? 'Lineage not resolved' : bucket.key;
    const inner = '<div style="min-width:0"><div class="taxon">' + esc(name) + '</div>'
      /* "in your list", not "species": the count is the submitted list's, never
         the taxon's size (Fang, 2026-11-06; replaces a note box that said so). */
      + '<div class="n">' + num(bucket.total) + ' in your list</div></div>';
    if (!expandable) return '<div class="ebp-cov-taxon">' + inner + '</div>';
    return '<div class="ebp-cov-taxon"><button type="button" class="ebp-cov-open" data-key="'
      + esc(bucket.key) + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="' + id
      + '"><span class="caret">' + (open ? '▾' : '▸') + '</span>' + inner + '</button></div>';
  }

  // ── state ─────────────────────────────────────────────────────────────────
  let els = null;
  let rows = [];
  let subRank = 'Family';
  const expanded = new Set();
  let hooks = {};

  function draw() {
    const top = group(rows, 'Phylum');
    scaleMax = Math.max(1, ...top.map((bucket) => bucket.total));
    if (!top.length) {
      els.table.innerHTML = '<div class="ebp-cov-empty">No species to place in the tree.</div>';
      return;
    }

    const html = ['<div class="ebp-cov-row head"><div class="ebp-cov-headcell">Phylum'
      + '<div class="ebp-cov-rk">'
      + '<label for="ebp-cov-rank">Click <span aria-hidden="true">▸</span> to break down the phylum by</label>'
      + '<select id="ebp-cov-rank">' + RANKS.slice(1).map((rank) => '<option value="' + rank + '"'
        + (rank === subRank ? ' selected' : '') + '>' + rank + '</option>').join('')
      + '</select></div></div></div>'];

    top.forEach(function (bucket, index) {
      const id = 'ebp-cov-sub-' + index;
      const open = expanded.has(bucket.key);
      html.push('<div class="ebp-cov-row">' + taxonCell(bucket, true, open, id) + bar(bucket)
        + '</div>');
      if (!open) return;

      /* One level down, within this phylum only. Grouped from the phylum's own
         rows, so a sub-row can never total more than its parent. */
      const subs = group(rows.filter(
        (row) => (String(row.Phylum || '').trim() || UNRESOLVED) === bucket.key), subRank);
      subs.forEach(function (sub) {
        html.push('<div class="ebp-cov-row sub" id="' + id + '">'
          + taxonCell(sub, false) + bar(sub) + '</div>');
      });
    });

    els.table.innerHTML = html.join('');
  }

  function shell(payload) {
    const total = payload.species_count || (payload.results || []).length;
    const counts = (payload.summary || {}).taxonomic_priority || {};
    const novel = NOVEL.reduce((sum, label) => sum + (counts[label] || 0), 0);
    const unassessed = UNASSESSED.reduce((sum, label) => sum + (counts[label] || 0), 0);
    const phyla = group(payload.results || [], 'Phylum');
    const withFirsts = phyla.filter((bucket) => bucket.novel).length;

    return `
    <div class="view-head">
      <div class="vt">Coverage</div>
      <div class="vs">Where this list fills gaps in the assembly tree</div>
    </div>

    <p class="ebp-cov-lede"><b>${num(novel)}</b> of <b>${num(total)}</b> species in this list would be
      the first assembly at some taxonomic level, spread across <b>${num(withFirsts)}</b> of
      <b>${num(phyla.length)}</b> phyla.${unassessed
        ? ' <b>' + num(unassessed) + '</b> could not be assessed at all — those are a prompt to check '
          + 'the names, not a finding about the tree.'
        : ''}</p>


    <div class="ebp-cov-key">
      ${NOVEL_LEVELS.map((level) => '<span><i style="background:' + novelColor(level[0]) + '"></i>first in '
        + level[1].toLowerCase() + '</span>').join('')}
      <span><i style="background:${swatch('High_S')}"></i>already covered</span>
      <span><i style="background:${UNASSESSED_GREY}"></i>not assessable</span>
    </div>


    <div class="ebp-cov-tbl" id="ebp-cov-table"></div>`;
  }

  /**
   * Render the Coverage view.
   *
   * @param {Element} host
   * Aggregates only (Fang, 2026-11-06): an opened phylum's rows show each group's
   * count and bar. Species names, and the species timeline they opened, belong to
   * the Results tab's species list, not here.
   *
   * @param {{payload: object}} opts
   * @returns {{redraw: function}}
   */
  function render(host, opts) {
    injectStyles();
    hooks = opts || {};
    const payload = hooks.payload || {};
    rows = payload.results || [];
    expanded.clear();
    host.innerHTML = shell(payload);
    els = { table: host.querySelector('#ebp-cov-table') };

    els.table.addEventListener('click', function (event) {
      const toggle = event.target.closest('.ebp-cov-open');
      if (toggle) {
        const key = toggle.dataset.key;
        if (expanded.has(key)) expanded.delete(key); else expanded.add(key);
        draw();
      }
    });
    /* Delegated: the control lives in the header row, which draw() rebuilds. */
    els.table.addEventListener('change', function (event) {
      if (event.target.id !== 'ebp-cov-rank') return;
      subRank = event.target.value;
      draw();
      const again = els.table.querySelector('#ebp-cov-rank');
      if (again) again.focus();
    });

    draw();
    /* Colours are CSS custom properties, so a theme flip repaints without a
       redraw; `redraw` stays for the contract Panel A and the results charts share. */
    return { redraw: draw };
  }

  return { render: render };
})();
