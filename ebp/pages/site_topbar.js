/**
 * The site header, as the home page draws it, on the two tool pages.
 *
 * WHY THIS EXISTS. The tool pages carried a header of their own — a logo, a
 * two-item Prioritization/Duplication switcher and a theme button — so the
 * only way back to a report was the browser's Back button, and a reader who
 * arrived on a tool page directly had no route to the rest of the site at all.
 * This replaces that strip with the home page's: the same logo and the same
 * search. The Report / Network / Tools menus it also carried were removed
 * (Fang, 2026-11-12); the home page's catalog lists every page, and the logo
 * goes there.
 *
 * SEARCH IS BUILT FROM config.js, LIKE THE HOME PAGE'S. There is no
 * hand-written list of pages here; a report added to the `pages` array is found
 * by both searches without a second edit.
 *
 * LINKS STAY IN THIS TAB. The home page opens tools and reports in a new tab,
 * deliberately: it is the index, and you go back to it. A header that did the
 * same on every page would multiply tabs as you moved around — three clicks,
 * four tabs — so here the header switches the page you are on. One tab per
 * thing you opened from home, and no accumulation after that.
 *
 * LIGHT ONLY. The home page has no theme toggle and is not theme-aware: its
 * comment says the light values ARE the palette, and a dark-OS visitor gets it
 * as-is. The tool pages are dark-first with a toggle, so the two never matched.
 * The pages now pin `data-theme="light"`, which their own `:root[data-theme=
 * "light"]` block already supports, and this header uses those variables rather
 * than a palette of its own.
 */
(function () {
  'use strict';

  var FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';

  /* The home page loads Font Awesome; the tool pages never did. Injected rather
     than added to both pages' <head> so the dependency travels with the thing
     that needs it. Absent, the <i> elements render as nothing and the header is
     still usable — icons here are decoration, and every one of them sits beside
     its own text label. */
  function ensureFontAwesome() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FA;
    document.head.appendChild(link);
  }

  /* Lifted from index.html so the two headers read identically. Colours come
     from the page's own variables — the tool pages define the same names — with
     the home page's literals as fallbacks for the three it does not have. */
  var STYLES = `
  .ebp-topbar{position:sticky; top:0; z-index:30; border-bottom:1px solid var(--line,#d6e3d9);
    background:rgba(255,255,255,.92); backdrop-filter:blur(8px);}
  .ebp-topbar .inner{display:flex; align-items:center; gap:12px; padding:13px 24px; flex-wrap:wrap;
    max-width:1180px; margin:0 auto;}
  .ebp-topbar .logo{display:flex; align-items:center; gap:9px; font-weight:800; font-size:14px;
    white-space:nowrap; color:var(--paper,#12211a); text-decoration:none;}
  .ebp-topbar .logo img{width:25px; height:25px; border-radius:7px; object-fit:cover; display:block;}
  .ebp-topbar .logo:hover{text-decoration:none;}
  .ebp-search-wrap{margin-left:14px; flex:1; max-width:420px; position:relative;}
  .ebp-search{display:flex; align-items:center; gap:8px; background:var(--ink,#f4f7f4);
    border:1px solid var(--line,#d6e3d9); border-radius:9px; padding:0 13px;
    color:var(--paper-mute,#5a6e62); font-size:13px;}
  .ebp-search:focus-within{border-color:var(--green-glow,#0d7846);}
  .ebp-search input{flex:1; background:transparent; border:none; outline:none;
    color:var(--paper,#12211a); font:inherit; font-size:13px; padding:9px 0;}
  .ebp-search input::placeholder{color:var(--paper-mute,#415047);}
  .ebp-search .kbd{font-size:13px; color:var(--paper-mute,#5a6e62);
    border:1px solid var(--line,#d6e3d9); border-radius:5px; padding:1px 6px;
    background:var(--ink-2,#ffffff);}
  .ebp-results{position:absolute; left:0; right:0; top:calc(100% + 8px);
    background:var(--ink-2,#fff); border:1px solid var(--line,#d6e3d9); border-radius:12px;
    box-shadow:0 22px 54px rgba(18,33,26,.16); padding:8px; z-index:45;
    max-height:min(70vh,520px); overflow-y:auto; display:none;}
  .ebp-results.on{display:block;}
  .ebp-results .grp{font-size:13px; font-weight:800; letter-spacing:.04em; text-transform:uppercase;
    color:var(--paper-mute,#5a6e62); padding:8px 10px 4px;}
  .ebp-results .row{display:flex; align-items:center; gap:10px; padding:9px 11px; border-radius:8px;
    color:var(--paper-dim,#3e5548); font-size:13px; text-decoration:none; cursor:pointer;}
  .ebp-results .row:hover,.ebp-results .row.on{background:var(--ink-3,#eef5f0); color:var(--paper,#12211a);}
  .ebp-results .row .ri{width:20px; text-align:center; flex:none; color:var(--green-glow,#0d7846);}
  .ebp-results .none{padding:14px 12px; color:var(--paper-mute,#5a6e62); font-size:13px;}
  @media (max-width:900px){ .ebp-search-wrap{display:none;} }
  @media (max-width:640px){
    .ebp-topbar .inner{padding:11px 16px 9px; gap:8px;}
  }
  `;

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function catalogue() {
    return (typeof pages !== 'undefined' && Array.isArray(pages)) ? pages : [];
  }

  /* Same question index.html asks, and of the same authority: the one file that
     knows where the backend lives. A tool page whose backend is unset renders
     as "Soon" in this menu exactly as it does on the home page, rather than as
     a link into a dead end. */
  function backendConfigured() {
    try {
      /* A BARE identifier, exactly as index.html tests it, and NOT
         `window.EBPBackend`. services_backend.js declares its export as a
         top-level `const`, and a top-level const/let/class creates a binding in
         the global SCRIPT scope without ever becoming a property of `window` —
         only `var` and implicit globals do that. `window.EBPBackend` is
         therefore always undefined, which read here as "no backend configured"
         and rendered both tools in the Tools menu as an unclickable SOON, on a
         deployment whose backend was live. Found 2026-09-14. */
      return typeof EBPBackend !== 'undefined' && !!EBPBackend.backendBase();
    } catch (err) {
      return false;
    }
  }

  /* config.js paths are written from the site ROOT (`./pages/x.html`) because
     index.html sits there. This header runs from inside `pages/`, so the prefix
     has to come off — otherwise every link 404s at `pages/pages/x.html`. */
  function href(file) {
    return String(file || '').replace(/^\.\/pages\//, './').replace(/^pages\//, './');
  }

  function flatPages() {
    var out = [];
    catalogue().forEach(function (cat) {
      (cat.pages || []).forEach(function (p) {
        out.push({ page: p, category: cat.category });
      });
    });
    return out;
  }

  function wireSearch(root) {
    var input = root.querySelector('#ebpSearchInput');
    var box = root.querySelector('#ebpResults');
    if (!input || !box) return;
    var rows = [];
    var active = -1;

    function close() {
      box.classList.remove('on');
      rows = [];
      active = -1;
    }

    function render(query) {
      var q = query.trim().toLowerCase();
      if (!q) return close();
      var configured = backendConfigured();
      var hits = flatPages().filter(function (entry) {
        return (entry.page.name + ' ' + (entry.page.description || '') + ' ' + entry.category)
          .toLowerCase().indexOf(q) > -1;
      });
      if (!hits.length) {
        box.innerHTML = '<div class="none">Nothing matches “' + esc(query.trim()) + '”.</div>';
        box.classList.add('on');
        rows = [];
        active = -1;
        return;
      }
      var html = '';
      var seen = '';
      hits.forEach(function (entry) {
        if (entry.category !== seen) {
          seen = entry.category;
          html += '<div class="grp">' + esc(seen) + '</div>';
        }
        var off = !!(entry.page.requiresBackend && !configured);
        html += '<a class="row" href="' + esc(href(entry.page.file)) + '" role="option">'
          + '<span class="ri" aria-hidden="true"><i class="fas '
          + esc(entry.page.icon || 'fa-circle') + '"></i></span>'
          + esc(entry.page.name)
          + (off ? ' <span class="soon">Soon</span>' : '') + '</a>';
      });
      box.innerHTML = html;
      box.classList.add('on');
      rows = Array.prototype.slice.call(box.querySelectorAll('.row'));
      active = -1;
    }

    function move(step) {
      if (!rows.length) return;
      if (active > -1) rows[active].classList.remove('on');
      active = (active + step + rows.length) % rows.length;
      rows[active].classList.add('on');
      rows[active].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
      else if (event.key === 'Enter' && active > -1) { event.preventDefault(); rows[active].click(); }
      else if (event.key === 'Escape') { close(); input.blur(); }
    });
    document.addEventListener('click', function (event) {
      if (!root.contains(event.target)) close();
    });
    /* "/" focuses the box, as it does on the home page — but never while the
       reader is typing somewhere else, which on THESE pages is a real risk: the
       prioritization form has a textarea people paste species names into. */
    document.addEventListener('keydown', function (event) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      var el = document.activeElement;
      var tag = el && el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return;
      event.preventDefault();
      input.focus();
      input.select();
    });
  }

  function mount() {
    if (document.querySelector('.ebp-topbar')) return;
    ensureFontAwesome();

    var style = document.createElement('style');
    style.id = 'ebp-topbar-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);

    var bar = document.createElement('div');
    bar.className = 'ebp-topbar';
    bar.innerHTML = ''
      + '<div class="inner">'
      +   '<a class="logo" href="../index.html">'
      +     '<img src="../favicon.jpg" alt="">'
      +     '<span>Earth BioGenome Project</span>'
      +   '</a>'
      +   '<div class="ebp-search-wrap">'
      +     '<div class="ebp-search">'
      +       '<span aria-hidden="true"><i class="fas fa-magnifying-glass"></i></span>'
      +       '<input id="ebpSearchInput" type="search" placeholder="Search reports and tools…"'
      +         ' aria-label="Search reports and tools" autocomplete="off" role="combobox"'
      +         ' aria-expanded="false" aria-autocomplete="list" aria-controls="ebpResults">'
      +       '<span class="kbd">/</span>'
      +     '</div>'
      +     '<div class="ebp-results" id="ebpResults" role="listbox" aria-label="Search results"></div>'
      +   '</div>'
      + '</div>';

    document.body.insertBefore(bar, document.body.firstChild);
    wireSearch(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
