/**
 * How one project's cross-project duplication is changing, capture by capture. [A-D4]
 *
 *   const panel = DuplicationTrend.mount(host, {project: 'dtol', displayName: '…'});
 *   panel.redraw();      // theme flip / resize
 *   panel.dispose();     // before the host is replaced
 *
 * WHERE THE HISTORY COMES FROM, AND WHY IT IS SHORT TODAY. The weekly capture
 * job stores four dated `duplication.*` metrics per project in
 * `report_snapshots` (A-D5b, duplication plan §6), and `GET /api/trends/<key>`
 * reads them. Three of the four are the three reports; the fourth is their sum,
 * which this panel deliberately does NOT draw — see below. So the trend is not
 * something that had to be built, it is something that **accrues**: one point
 * per project per weekly run, starting from the first capture.
 *
 * **It cannot be backfilled.** GoaT reports what is true today and keeps no
 * history, so a week not captured is a week permanently missing. That is why the
 * metrics were wired into the cron before there was any page to show them, and
 * it is why this panel states the number of captures rather than implying a long
 * series exists.
 *
 * THREE HONEST STATES, because a chart is not always the truthful rendering:
 *   * no captures at all — nothing has been recorded for this project yet;
 *   * ONE capture — the numbers are shown as numbers, and the panel says a
 *     trend needs a second point. Drawing a single dot on an axis and calling it
 *     a trend would suggest a flat line where there is no line at all;
 *   * two or more — the lines.
 *
 * A METRIC SELECTOR (Fang, 2026-11-06). The default is the three report lines
 * below; the selector also offers each report alone, the total, the number of
 * contributing projects (`duplication.partners.<project>`) and the overlap with
 * one named project (`duplication.overlap_with.<project>.<partner>`). The last
 * two began with the 2026-11-01 capture and cannot be backfilled, so each metric
 * is put in its own honest state below rather than the reports' one.
 *
 * THREE LINES, NOT FOUR. `duplication.total.<project>` is the sum of the other
 * three (the three report predicates are pairwise disjoint, which A-D5b's own
 * test asserts arithmetically), so a fourth line would add a channel and no
 * information. It is printed as a number in the header instead. This also keeps
 * the chart at three series, which is where an any-two-marks-may-touch form has
 * to stop — see the colour note on SERIES.
 */

const DuplicationTrend = (function () {
  'use strict';

  /**
   * The three series, their metric key, and their colour token.
   *
   * COLOUR IS NOT THE ONLY ENCODING HERE, and that is measured rather than
   * decorative. Green against amber is the classic red-green collision: the dark
   * pair separates by ΔE 7.1 under deuteranopia (OKLab ×100, Machado 2009 at
   * severity 1.0) and the light pair by 5.1 — below the threshold at which two
   * lines can be told apart by hue. Both pairs are comfortable under normal
   * vision (17.3 and 22.3), so the fix is not a different palette — no three
   * hues clear both gates on a white ground — it is a second channel. Each line
   * therefore carries its own LINE TYPE and a DIRECT END-LABEL, so the series
   * can be read with no colour vision at all.
   */
  const SERIES = [
    { key: 'ebp_standard_done', label: 'R1 done elsewhere', short: 'R1',
      varn: '--trend-r1', lineType: 'solid',
      hint: 'species another project has already finished to EBP standard' },
    { key: 'active', label: 'R2 active duplication', short: 'R2',
      varn: '--trend-r2', lineType: 'dashed',
      hint: 'species your project and another are both working on' },
    { key: 'samples_elsewhere', label: 'R3 potential duplication', short: 'R3',
      varn: '--trend-r3', lineType: 'dotted',
      hint: 'species you have not started that another project already holds' },
  ];

  const esc = (value) => String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const num = (value) => (Number(value) || 0).toLocaleString();

  /* Canvas text does not inherit the page's font, so ECharts is told it. */
  const FONT = "'Libre Franklin',-apple-system,'Segoe UI',sans-serif";

  function cssVar(name, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (value || '').trim() || fallback;
  }

  // ── state ─────────────────────────────────────────────────────────────────
  let host = null;
  let project = '';
  let displayName = '';
  let dates = [];            // every capture date, ascending
  let series = [];           // what is drawn now: [{label, varn, ..., points}]
  let total = null;          // the newest `duplication.total.<project>` value
  let names = {};            // project key -> display name, for partner labels
  let selected = 'reports';  // the metric selector's value
  let reportSeries = [];     // the three reports: [{...SERIES entry, points}]
  let totalPoints = {};      // {date: value}
  let partnersPoints = {};   // duplication.partners.<project>
  let partnerPoints = {};    // partner key -> {date: value}
  let chart = null;          // the live ECharts instance, once there is a line

  // ── styles ────────────────────────────────────────────────────────────────
  const STYLE_ID = 'ebp-duptrend-styles';
  const STYLES = `
  .ebp-trend{border:1px solid var(--line,#22362b); border-radius:14px;
    background:var(--ink-2,#0f1a14); padding:20px 22px 22px; margin-bottom:26px;}
  .ebp-trend-head{display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:6px;}
  .ebp-trend-head h2{font-size:15px; font-weight:750; letter-spacing:-.01em; margin:0;}
  .ebp-trend-head .badge{font-size:13px; font-weight:700; letter-spacing:.04em;
    text-transform:uppercase; color:var(--green-glow,#5fd39a); background:rgba(22,163,74,.12);
    border:1px solid rgba(22,163,74,.3); border-radius:999px; padding:2px 9px; white-space:nowrap;}
  .ebp-trend-head .badge.thin{color:var(--warn-ink,#e0a760); background:rgba(224,167,96,.12);
    border-color:rgba(224,167,96,.3);}
  .ebp-trend-head .tot{margin-left:auto; font-size:13px; color:var(--paper-mute,#6f8a7b);}
  .ebp-trend-head .tot b{color:var(--paper-dim,#a6bcaf); font-variant-numeric:tabular-nums;}
  /* Full panel width, no measure cap — the same rule the heatmap's notes and the
     reading guide follow. At 88ch this sat at 593px inside a 1,028px panel and
     ran to three lines with a void beside it. */
  .ebp-trend-sub{font-size:13px; color:var(--paper-dim,#a6bcaf); margin:0 0 16px;
    line-height:1.6;}
  .ebp-trend-sub b{color:var(--paper,#e9f2ec);}
  .ebp-trend-chart{width:100%; height:220px;}
  .ebp-trend-legend{display:flex; gap:9px 18px; margin-top:12px; font-size:13px;
    color:var(--paper-dim,#a6bcaf); flex-wrap:wrap;}
  .ebp-trend-legend span{display:inline-flex; align-items:center; gap:7px;}
  .ebp-trend-legend .ln{width:22px; height:0; border-top-width:2px; border-top-style:solid; flex:none;}
  .ebp-trend-first{border:1px dashed var(--line,#22362b); border-radius:11px; padding:16px 18px;
    background:var(--ink-3,#14231b); font-size:13px; color:var(--paper-dim,#a6bcaf);
    line-height:1.7;}
  .ebp-trend-first b{color:var(--paper,#e9f2ec);}
  .ebp-trend-first ul{margin:9px 0 0; padding-left:19px;}
  .ebp-trend-first li{margin:3px 0;}
  .ebp-trend-first .v{font-variant-numeric:tabular-nums; font-weight:700; color:var(--paper,#e9f2ec);}
  /* Its own row right under the title (Fang, 2026-11-06), so the choice reads
     before the chart it changes. */
  .ebp-trend-metric{display:flex; align-items:center; gap:8px; margin:4px 0 12px;
    font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
    color:var(--paper-mute,#6f8a7b);}
  .ebp-trend-metric select{text-transform:none; letter-spacing:normal; font-weight:500; max-width:100%;}
  @media (max-width:640px){ .ebp-trend-metric select{flex:1; min-width:0;} }
  `;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = STYLES;
    document.head.appendChild(tag);
  }

  // ── the chart ─────────────────────────────────────────────────────────────

  /**
   * The ECharts option, rebuilt from scratch on every draw.
   *
   * WHY ECHARTS AND NOT A CANVAS. This panel was hand-drawn first, matching the
   * mockup — but the mockup's canvas was copied without checking whether its
   * REASON carried over, and it did not. `prioritization_trend.js` hand-rolls
   * because it dashes individual SEGMENTS of a line, which is not an ECharts
   * primitive; nothing here needs that. A multi-series time line is the library's
   * textbook case, and the ~150 lines of tick, axis, DPR and hit-test maths that
   * went with the canvas were generic work with no requirement behind them.
   * Checklist §5 allows "ECharts + vanilla JS only" — the house rule inside that
   * is library by default, hand-roll with a stated reason.
   *
   * Colours are read from CSS variables at build time, so a theme flip is a
   * rebuild — the same contract every other chart in this suite has.
   */
  function option() {
    const dim = cssVar('--paper-dim', '#a6bcaf');
    const mute = cssVar('--paper-mute', '#6f8a7b');
    const line = cssVar('--line', '#22362b');

    return {
      animation: false,
      /* `right` is generous because the end-labels live out there, and they are
         the encoding that makes the lines readable without colour — the plot
         yields the space rather than the labels being clipped. */
      grid: { left: 4, right: 104, top: 18, bottom: 4, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: mute, type: 'dashed' } },
        formatter(points) {
          if (!points || !points.length) return '';
          const rows = points.map(function (point) {
            return '<div style="display:flex; gap:14px; justify-content:space-between">'
              + '<span>' + point.marker + esc(point.seriesName) + '</span><b>'
              + (point.value === null || point.value === undefined ? '—' : num(point.value))
              + '</b></div>';
          }).join('');
          return '<b>' + esc(points[0].axisValue) + '</b><br>' + rows;
        },
        extraCssText: 'line-height:1.6;',
      },
      xAxis: {
        type: 'category', data: dates, boundaryGap: false,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: line } },
        axisLabel: { color: mute, fontSize: 13, fontFamily: FONT },
      },
      yAxis: {
        type: 'value',
        /* A zero baseline, always: these are counts, and a count axis that does
           not start at zero exaggerates every move on it. */
        min: 0,
        axisLabel: { color: mute, fontSize: 13, fontFamily: FONT, formatter: (value) => num(value) },
        splitLine: { lineStyle: { color: line, type: 'dashed' } },
      },
      series: series.map(function (entry) {
        const color = cssVar(entry.varn, '#5fd39a');
        return {
          name: entry.label,
          type: 'line',
          symbol: 'circle',
          symbolSize: 7,
          /* A capture this metric missed is a null, and the gap is left open
             rather than bridged: connecting across it would draw a straight
             line through a week nobody measured. */
          connectNulls: false,
          data: dates.map(function (date) {
            const value = entry.points[date];
            return value === undefined ? null : value;
          }),
          itemStyle: { color: color },
          lineStyle: { color: color, width: 2, type: entry.lineType },
          /* The second channel. See the note on SERIES: the green/amber pair
             cannot be separated by hue under deuteranopia at any stepping, so
             the line type and this label carry the identity instead. */
          endLabel: {
            show: true, color: color, fontSize: 13, fontWeight: 600, fontFamily: FONT, distance: 8,
            /* The newest value rides in the label: it is the number a reader
               wants off a trend line, and putting it here means it is legible
               without hovering and without a fourth axis label. */
            formatter: (point) => (entry.short ? entry.short + '  ' : '') + num(point.value),
          },
          emphasis: { focus: 'series' },
        };
      }),
    };
  }

  function draw() {
    const box = host.querySelector('#ebp-trend-chart');
    if (!box || dates.length < 2 || typeof echarts === 'undefined') return;
    if (!chart || chart.getDom() !== box) chart = echarts.init(box);
    chart.setOption(option(), true);
  }

  function redraw() {
    if (!chart) { draw(); return; }
    chart.resize();
    chart.setOption(option(), true);
  }

  function dispose() {
    if (chart) { chart.dispose(); chart = null; }
  }

  function legendHtml() {
    if (series.length < 2) return '';   // one line: the selector names it
    return '<div class="ebp-trend-legend">' + series.map(function (entry) {
      const style = 'border-top-color:' + cssVar(entry.varn, '#5fd39a') + ';'
        + 'border-top-style:' + entry.lineType + ';';
      return '<span title="' + esc(entry.hint) + '"><i class="ln" style="' + style + '"></i>'
        + esc(entry.label) + '</span>';
    }).join('') + '</div>';
  }

  // ── the metric selector (Fang, 2026-11-06) ────────────────────────────────

  function partnerName(key) {
    if (key === 'other') return 'Other (projects GoaT does not name)';
    return names[key] || key.toUpperCase();
  }

  function newest(points) {
    const keys = Object.keys(points || {}).sort();
    return keys.length ? points[keys[keys.length - 1]] : null;
  }

  /* Partners largest first by their newest value, so the projects a reader most
     needs to talk to head the list. */
  function partnerKeys() {
    return Object.keys(partnerPoints).sort(function (a, b) {
      return (newest(partnerPoints[b]) || 0) - (newest(partnerPoints[a]) || 0) || (a < b ? -1 : 1);
    });
  }

  /** What the selected metric draws: [{label, short, varn, lineType, hint, points}]. */
  function visible() {
    const who = displayName || project.toUpperCase();
    const one = (label, points, hint) => [{
      label: label, short: '', varn: '--paper-dim', lineType: 'solid', hint: hint, points: points || {},
    }];
    if (selected === 'reports') return reportSeries;
    const report = reportSeries.find((entry) => entry.key === selected);
    if (report) return [Object.assign({}, report, { short: '' })];
    if (selected === 'total') {
      return one('Total overlapping species', totalPoints,
        'all three reports together: every species on ' + who + '’s list that another project is '
        + 'also working on or has finished');
    }
    if (selected === 'partners') {
      return one('Contributing projects', partnersPoints,
        'how many named EBP projects share at least one species with ' + who
        + ' (GoaT’s unnamed “other” bucket is not counted)');
    }
    const partner = selected.slice('with:'.length);
    return one('Overlap with ' + partnerName(partner), partnerPoints[partner],
      'species on ' + who + '’s list that ' + partnerName(partner)
      + ' is also working on or has finished, across all three reports');
  }

  function unit() { return selected === 'partners' ? 'projects' : 'species'; }

  function selectorHtml() {
    const opt = (value, label) => '<option value="' + esc(value) + '"'
      + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>';
    const partners = partnerKeys();
    return '<label class="ebp-trend-metric">Metric <select id="ebp-trend-metric">'
      + '<optgroup label="Reports">' + opt('reports', 'All three reports')
      + SERIES.map((entry) => opt(entry.key, entry.label)).join('')
      + opt('total', 'Total overlapping species') + '</optgroup>'
      + '<optgroup label="Network">' + opt('partners', 'Contributing projects') + '</optgroup>'
      + '<optgroup label="Overlap with one project">'
      + (partners.length
        ? partners.map((key) => opt('with:' + key, partnerName(key) + ' · '
          + num(newest(partnerPoints[key])))).join('')
        : '<option disabled>recorded from the next weekly capture</option>')
      + '</optgroup></select></label>';
  }

  function headHtml(badge) {
    return '<div class="ebp-trend-head">'
      + '<h2>How is ' + esc(displayName || project.toUpperCase()) + '’s overlap changing?</h2>'
      + (badge || '') + '</div>' + selectorHtml();
  }

  function subHtml() {
    if (selected === 'reports') {
      return '<p class="ebp-trend-sub">Each of the three reports, one point per recorded capture. '
        + 'Lines that <b>fall</b> are duplication being resolved — a species dropped, coordinated on, '
        + 'or finished; lines that <b>rise</b> are new overlap appearing as other projects register '
        + 'target species in GoaT.'
        + (total !== null ? ' Newest total: <b>' + num(total) + '</b> species.' : '') + '</p>';
    }
    const entry = series[0];
    return '<p class="ebp-trend-sub"><b>' + esc(entry.label) + '</b> — ' + esc(entry.hint)
      + '. One point per recorded capture.</p>';
  }

  function chartHtml(captures) {
    return headHtml('<span class="badge">' + captures + ' weekly captures</span>')
      + subHtml()
      + '<div class="ebp-trend-chart" id="ebp-trend-chart"></div>'
      + legendHtml();
  }

  function firstCaptureHtml() {
    const date = dates[0];
    return headHtml('<span class="badge thin">1 capture</span>')
      + '<div class="ebp-trend-first">'
      + '<b>One capture has been recorded, on ' + esc(date) + '.</b> A trend needs a second, and '
      + 'the next weekly run will produce it. These are the numbers a future line will start from:'
      + '<ul>' + series.map(function (entry) {
        const value = entry.points[date];
        return '<li>' + esc(entry.label) + ' — <span class="v">'
          + (value === undefined ? '—' : num(value)) + '</span> ' + unit() + '</li>';
      }).join('') + '</ul></div>';
  }

  function noHistoryHtml() {
    const fresh = selected !== 'reports' && !reportSeries.some((entry) => entry.key === selected)
      && selected !== 'total';
    return headHtml('<span class="badge thin">no captures recorded</span>')
      + '<div class="ebp-trend-first">'
      + (fresh
        ? '<b>This metric is new and has not been recorded for this project yet.</b> The weekly '
          + 'capture (Sundays) records it from now on; earlier weeks cannot be recovered, because '
          + 'GoaT keeps no history.'
        : '<b>Nothing has been recorded for this project yet.</b> The weekly capture writes one '
          + 'dated point per report per project; once it has reached this project, its history '
          + 'starts accruing here.')
      + '</div>';
  }

  /* Draw the selected metric, in whichever of the three honest states its own
     captures put it: a new metric can have one point while the reports have ten. */
  function render() {
    dispose();
    series = visible();
    const seen = {};
    series.forEach((entry) => Object.keys(entry.points).forEach((date) => { seen[date] = true; }));
    dates = Object.keys(seen).sort();
    if (!dates.length) host.innerHTML = noHistoryHtml();
    else if (dates.length === 1) host.innerHTML = firstCaptureHtml();
    else { host.innerHTML = chartHtml(dates.length); draw(); }
    const select = host.querySelector('#ebp-trend-metric');
    if (select) {
      select.addEventListener('change', function () {
        selected = this.value;
        render();
        const again = host.querySelector('#ebp-trend-metric');
        if (again) again.focus();
      });
    }
  }

  // ── mount ─────────────────────────────────────────────────────────────────

  /**
   * Load and render one project's duplication history.
   *
   * @param {Element} target
   * @param {{project: string, displayName?: string, names?: Object<string,string>}} opts
   *        `names` maps project keys to display names, for the partner options.
   * @returns {Promise<{redraw: function, captures: number}>}
   */
  async function mount(target, opts) {
    injectStyles();
    host = target;
    project = (opts.project || '').toLowerCase();
    displayName = opts.displayName || '';
    names = opts.names || {};
    /* A previous project's instance is bound to a DOM node this mount is about
       to replace; ECharts keeps a global registry keyed by element, so leaving
       it attached leaks the old chart and its resize listener. */
    dispose();
    host.className = 'ebp-trend';
    host.innerHTML = '<div class="ebp-trend-head"><h2>Loading history…</h2></div>';

    /* Four exact metric reads rather than one prefix sweep: `?prefix=duplication.`
       returns every series for the whole network, far more than this panel draws.
       The partner series ARE one prefix read, but scoped to this project. */
    let results;
    try {
      results = await Promise.all(SERIES.concat([{ key: 'total' }]).map(function (entry) {
        return EBPBackend.trend('duplication.' + entry.key + '.' + project);
      }));
    } catch (err) {
      host.innerHTML = '<div class="ebp-trend-head"><h2>History unavailable</h2></div>'
        + '<div class="ebp-trend-first">' + EBPBackend.explain(err) + '</div>';
      return { redraw() {}, dispose: dispose, captures: 0 };
    }
    /* The partner metrics began on 2026-11-01. Loaded apart, and a failure is an
       empty selector group rather than a broken panel: the report lines above do
       not depend on them. */
    const [partnersResult, overlapResult] = await Promise.all([
      EBPBackend.trend('duplication.partners.' + project).catch(() => ({ points: [] })),
      EBPBackend.trends('duplication.overlap_with.' + project + '.').catch(() => ({ metrics: {} })),
    ]);

    const toPoints = (rows) => {
      const points = {};
      (rows || []).forEach((point) => { points[point.snapshot_date] = point.value; });
      return points;
    };
    reportSeries = SERIES.map((entry, index) =>
      Object.assign({}, entry, { points: toPoints((results[index] || {}).points) }));
    totalPoints = toPoints((results[SERIES.length] || {}).points);
    total = newest(totalPoints);
    partnersPoints = toPoints(partnersResult.points);
    partnerPoints = {};
    const prefix = 'duplication.overlap_with.' + project + '.';
    Object.entries(overlapResult.metrics || {}).forEach(function ([key, rows]) {
      partnerPoints[key.slice(prefix.length)] = toPoints(rows);
    });
    /* Keep the reader's choice across projects where it still exists. */
    if (selected.indexOf('with:') === 0 && !partnerPoints[selected.slice(5)]) selected = 'reports';

    render();
    return { redraw: redraw, dispose: dispose, captures: dates.length };
  }

  return { mount: mount, SERIES: SERIES };
})();
