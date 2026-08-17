/* Shared render helpers for the Evolved PartsCheck shell prototype.
   Pure functions -> HTML strings. Markup ported verbatim (structure + classes)
   from reference/supplier.html and reference/repairer.html so components.css
   (ported from the same references) applies unmodified.
   Every helper is attached to `window` so views (Task 4+) can call them
   as globals with no module system. No build step, no external deps. */
(function(){
  'use strict';

  // ---------------------------------------------------------------------
  // escapeHtml — escape any data-derived string before interpolating it
  // into markup. Covers the five XML/HTML-significant characters.
  // ---------------------------------------------------------------------
  function escapeHtml(str){
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------
  // brandMark — current-skin variant: a plain solid-green rounded square
  // with a bold white "P", replacing the Evolved skin's brass/gold tick
  // roundel. Wrapper class names (.roundel/.core) are kept unchanged so
  // the shared components.css selectors and markup structure still line up
  // — only the visual treatment (via components.css/tokens.css) and this
  // glyph differ from the Evolved skin's brandMark().
  // ---------------------------------------------------------------------
  function brandMark(){
    return '<div class="roundel"><div class="core">P</div></div>';
  }

  // ---------------------------------------------------------------------
  // sectionLabel — the ".sectlab" heading rule used above every dashboard
  // section: <h2>title</h2> [tally pill] <rule> [hint text]
  // reference/supplier.html lines ~340-345, ~386-390
  // ---------------------------------------------------------------------
  function sectionLabel(title, opts){
    opts = opts || {};
    var tally = opts.tally
      ? '<span class="tally">' + escapeHtml(opts.tally) + '</span>'
      : '';
    var hint = opts.hint
      ? '<span class="hint">' + escapeHtml(opts.hint) + '</span>'
      : '';
    return (
      '<div class="sectlab">' +
        '<h2>' + escapeHtml(title) + '</h2>' +
        tally +
        '<span class="rule"></span>' +
        hint +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // pipelineCard — one ".card" in the ".jtbd" pipeline grid.
  // Two shapes, matching the reference exactly:
  //  - a normal stage card with plate/stage/big number/title/sub + either
  //    a folded-in ".card-sig" 2-up signal grid, or (when `today` is set)
  //    the hourly ".daystrip" + ".grid22" "today's shape" card.
  //  - `priority`/`prioTab` render the brass ".priority" treatment used on
  //    supplier cards; `ghost` toggles the outline vs solid CTA.
  // reference/supplier.html lines 392-445, reference/repairer.html 269-327
  // ---------------------------------------------------------------------
  function pipelineCard(cfg){
    cfg = cfg || {};
    var cardClasses = ['card'];
    if (cfg.priority) cardClasses.push('priority');
    if (cfg.today) cardClasses.push('train'); // repairer's brass-topped last card

    var prioTab = (cfg.priority && cfg.prioTab)
      ? '<span class="prio-tab">' + escapeHtml(cfg.prioTab) + '</span>'
      : '';

    var upDir = cfg.upDir === 'dn' ? 'dn' : 'up';
    var upMarkup = cfg.up ? ' <span class="' + upDir + '">' + escapeHtml(cfg.up) + '</span>' : '';

    var body;
    if (cfg.today && cfg.today.bars) {
      body = todayShape(cfg.today);
    } else if (cfg.signals && cfg.signals.length) {
      body = '<div class="card-sig">' + cfg.signals.map(function(sig){
        return (
          '<div class="s">' +
            '<div class="sl">' + escapeHtml(sig.l) + '</div>' +
            '<div class="sv fig">' + escapeHtml(sig.v) + '</div>' +
            '<div class="sd ' + escapeHtml(sig.tone || 'flat') + '">' + escapeHtml(sig.d) + '</div>' +
          '</div>'
        );
      }).join('') + '</div>';
    } else {
      body = '';
    }

    var ctaClasses = ['cta'];
    if (cfg.ghost) ctaClasses.push('ghost');
    if (cfg.cta && cfg.cta.solid) ctaClasses.push('solid');
    var ctaLabel = cfg.cta ? (cfg.cta.label || cfg.cta) : '';
    var ctaRoute = cfg.cta && cfg.cta.route ? cfg.cta.route : '';
    var cta = ctaLabel
      ? '<div class="' + ctaClasses.join(' ') + '" onclick="go(\'' + escapeHtml(ctaRoute) + '\')">' +
          escapeHtml(ctaLabel) + ' <span class="arw">→</span>' +
        '</div>'
      : '';

    return (
      '<div class="' + cardClasses.join(' ') + '">' +
        prioTab +
        '<div class="step">' +
          '<span class="plateno">' + escapeHtml(cfg.plate) + '</span>' +
          '<span class="jt">' + escapeHtml(cfg.stage) + '</span>' +
        '</div>' +
        '<div class="big fig">' + escapeHtml(cfg.big) + '</div>' +
        '<div class="ct-title">' + escapeHtml(cfg.title) + '</div>' +
        '<div class="ct-sub">' + escapeHtml(cfg.sub) + upMarkup + '</div>' +
        body +
        cta +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // actionRow — one ".job" row inside the ".today" action-queue card.
  // reference/supplier.html lines 349-382, reference/repairer.html 341-381
  // ---------------------------------------------------------------------
  function actionRow(cfg){
    cfg = cfg || {};
    var urgency = cfg.urgency || 'plan'; // now | soon | plan
    var apm = cfg.apm
      ? ' <span class="apm">' + escapeHtml(typeof cfg.apm === 'string' ? cfg.apm : 'Training') + '</span>'
      : '';
    var whenSub = cfg.whenSub ? '<small>' + escapeHtml(cfg.whenSub) + '</small>' : '';
    var actClasses = ['act'];
    // Deliberate colour: solid green CTAs are reserved for the "now"
    // (blocking) group — everything else gets the quiet ghost button, so
    // green consistently means "act on this next". (Data-level `ghost`
    // flags are ignored; urgency is the single source of prominence.)
    if (urgency !== 'now') actClasses.push('ghost');
    var ctaLabel = cfg.cta && cfg.cta.label ? cfg.cta.label : cfg.cta;
    // Route may be supplied directly (cfg.route) or via a {label,route} cta.
    // An empty route renders a disabled, unlinked button (e.g. Direct Purchase).
    var ctaRoute = cfg.route || (cfg.cta && cfg.cta.route) || '';
    var actBtn = ctaRoute
      ? '<button class="' + actClasses.join(' ') + '" onclick="go(\'' + escapeHtml(ctaRoute) + '\')">' + escapeHtml(ctaLabel) + '</button>'
      : '<button class="' + actClasses.join(' ') + '" disabled aria-disabled="true">' + escapeHtml(ctaLabel) + '</button>';

    return (
      '<div class="job u-' + escapeHtml(urgency) + '">' +
        '<div class="stripe"></div>' +
        '<div class="badge">' + escapeHtml(cfg.icon) + '</div>' +
        '<div>' +
          '<div class="jt2">' + escapeHtml(cfg.title) + apm + '</div>' +
          '<div class="jsub">' + escapeHtml(cfg.sub) + '</div>' +
        '</div>' +
        '<div class="when">' + escapeHtml(cfg.when) + whenSub + '</div>' +
        actBtn +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // actionGroup — urgency group header inside the ".today" action queue.
  // Structure-first urgency encoding: the label carries the meaning in
  // words ("Now — blocking work"), the dot carries the single hue, so the
  // queue still reads correctly without colour.
  // ---------------------------------------------------------------------
  var ACTION_GROUPS = {
    now:  'Now — blocking work',
    soon: 'Today',
    plan: 'When you can'
  };
  function actionGroup(urgency, count){
    var label = ACTION_GROUPS[urgency] || urgency;
    return (
      '<div class="jgroup u-' + escapeHtml(urgency) + '">' +
        '<span class="dot" aria-hidden="true"></span>' +
        escapeHtml(label) +
        '<span class="ct num">' + Number(count) + '</span>' +
      '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // todayShape — the hourly ".daystrip" bars + ".grid22" 2x2 stat cells
  // used both inside the "Today" pipeline card (supplier) and the
  // standalone ".tshape" panel (repairer).
  // reference/supplier.html lines 430-443, reference/repairer.html 386-399
  // ---------------------------------------------------------------------
  function todayShape(cfg){
    cfg = cfg || {};
    var bars = cfg.bars || [];
    var nowIndex = (typeof cfg.nowIndex === 'number') ? cfg.nowIndex : -1;
    var caps = cfg.caps || [];
    var cells = cfg.cells || [];

    var barsHtml = bars.map(function(h, i){
      var classes = ['bar'];
      var extraStyle = '';
      if (i === nowIndex) classes.push('now');
      if (i > nowIndex && nowIndex >= 0) extraStyle = ';opacity:.25';
      return '<div class="' + classes.join(' ') + '" style="height:' + Number(h) + '%' + extraStyle + '"></div>';
    }).join('');

    var capsHtml = caps.map(function(c){ return '<span>' + escapeHtml(c) + '</span>'; }).join('');

    var cellsHtml = cells.map(function(cell){
      return (
        '<div class="cell">' +
          '<div class="cl">' + escapeHtml(cell.l) + '</div>' +
          '<div class="cv fig">' + escapeHtml(cell.v) + '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="daystrip" aria-hidden="true">' + barsHtml + '</div>' +
      '<div class="daystrip-cap">' + capsHtml + '</div>' +
      '<div class="grid22">' + cellsHtml + '</div>'
    );
  }

  // ---------------------------------------------------------------------
  // barList — ".barlist" rows used for Win/Loss by Make, Lost Quote
  // Reasons, and Part Type Mix-style bars. `reasons` mirrors the
  // ".barlist.reasons" layout variant (label+value on top, full-width
  // track below) used for Lost Quote Reasons.
  // reference/supplier.html lines 456-475
  // ---------------------------------------------------------------------
  function barList(rows, opts){
    rows = rows || [];
    opts = opts || {};
    var wrapClasses = ['barlist'];
    if (opts.reasons) wrapClasses.push('reasons');

    var rowsHtml = rows.map(function(row){
      var tone = row.tone ? 't-' + row.tone : 't-pc';
      var warnFlag = row.warn ? ' wflag' : '';
      var pct = (typeof row.pct === 'number') ? row.pct : 0;
      var fillStyle = 'width:' + pct + '%';

      if (opts.reasons) {
        return (
          '<div class="brow">' +
            '<span class="bl">' + escapeHtml(row.label) + (row.note ? ' <small class="wflag">' + escapeHtml(row.note) + '</small>' : '') + '</span>' +
            '<span class="bv num' + warnFlag + '">' + escapeHtml(row.count) + ' · ' + escapeHtml(pct) + '%</span>' +
            '<div class="btrack"><div class="bfill ' + tone + '" style="' + fillStyle + '"></div></div>' +
          '</div>'
        );
      }

      var small = row.small !== undefined ? ' <small' + (row.warn ? ' class="wflag"' : '') + '>' + escapeHtml(row.small) + '</small>' : '';
      return (
        '<div class="brow">' +
          '<span class="bl">' + escapeHtml(row.label) + '</span>' +
          '<div class="btrack"><div class="bfill ' + tone + '" style="' + fillStyle + '"></div></div>' +
          '<span class="bv num' + warnFlag + '">' + escapeHtml(row.value) + small + '</span>' +
        '</div>'
      );
    }).join('');

    return '<div class="panel-b ' + wrapClasses.join(' ') + '">' + rowsHtml + '</div>';
  }

  // ---------------------------------------------------------------------
  // ledgerTable — generic ".panel" data table (".tablewrap table"), used
  // for Top Repairers by GMV, Competitive Price Position, Top Supplier
  // Discounts, and (new for Task 4) the supplier-insights fill-rate
  // ledger. Not a literal reference block — assembled from the shared
  // table primitives (th/td/.rname/.r) already ported into components.css
  // so it renders consistently with the reference tables.
  // cols: [{ key, label, align:'l'|'r', render(row) -> html-or-string }]
  // NOTE: unlike the other helpers in this file, a col.render(row) callback's
  // returned markup is NOT auto-escaped here (intentional — it allows rich
  // cell markup such as nested spans/badges). Callbacks that interpolate
  // data-derived text must call escapeHtml() on it themselves.
  // ---------------------------------------------------------------------
  function ledgerTable(cfg){
    cfg = cfg || {};
    var cols = cfg.cols || [];
    var rows = cfg.rows || [];

    var theadHtml = cols.map(function(col){
      var cls = col.align === 'r' ? ' class="r"' : '';
      return '<th' + cls + '>' + escapeHtml(col.label) + '</th>';
    }).join('');

    var tbodyHtml = rows.map(function(row){
      var cellsHtml = cols.map(function(col){
        var cls = col.align === 'r' ? ' class="r"' : '';
        var content = typeof col.render === 'function' ? col.render(row) : escapeHtml(row[col.key]);
        return '<td' + cls + '>' + content + '</td>';
      }).join('');
      return '<tr class="row">' + cellsHtml + '</tr>';
    }).join('');

    return (
      '<div class="tablewrap">' +
        '<table>' +
          '<thead><tr>' + theadHtml + '</tr></thead>' +
          '<tbody>' + tbodyHtml + '</tbody>' +
        '</table>' +
      '</div>'
    );
  }

  window.escapeHtml = escapeHtml;
  window.brandMark = brandMark;
  window.sectionLabel = sectionLabel;
  window.pipelineCard = pipelineCard;
  window.actionRow = actionRow;
  window.actionGroup = actionGroup;

  // ---------------------------------------------------------------------
  // productSelectHtml — the mobile product switcher. Below 980px this
  // replaces both the wordmark and the whole tab strip: showing a
  // "PartsCheck" wordmark beside a "PartsCheck" picker would reproduce the
  // duplication this cleanup removes. "All products" returns to the hub,
  // which is why no separate Home button is needed. A native <select> is
  // used deliberately — it matches the scope select's grammar and gives a
  // touch target comfortably past the WCAG 2.5.8 minimum (~28px from
  // font-size/padding alone; bumped further at mobile, see components.css),
  // with no sideways scroll.
  // ---------------------------------------------------------------------
  function productSelectHtml(){
    var current = window.SHELL ? window.SHELL.product : '';
    var opts = '<option value="hub">All products</option>' +
      (window.PRODUCTS || []).map(function(p){
        return '<option value="' + escapeHtml(p.id) + '"' +
          (p.id === current ? ' selected' : '') + '>' + escapeHtml(p.label) + '</option>';
      }).join('');
    return (
      '<span class="pc-prodsel-wrap">' +
        '<select class="pc-prodsel" aria-label="Switch product" ' +
          'onchange="enterProduct(this.value)">' + opts + '</select>' +
        '<span class="pc-prodsel-caret" aria-hidden="true">▾</span>' +
      '</span>'
    );
  }
  window.productSelectHtml = productSelectHtml;

  // ---------------------------------------------------------------------
  // pcBrandBar — the current-app green brand bar (PartsCheck logo left,
  // user + account links right), per the approved current-look mockup.
  // Renders only when the build declares window.SKIN === 'current';
  // the Evolved skin has no brand bar (its brand lives in the rail crest).
  // ---------------------------------------------------------------------
  function pcBrandBar(){
    if (window.SKIN !== 'current') return '';
    var onHub = !!(window.SHELL && window.SHELL.product === 'hub');
    // On the hub the wordmark is inert — there is nowhere "home" to go —
    // and there is neither a rail to open nor a product to switch away from.
    var logo = onHub
      ? '<span class="pc-logo">Parts<span>Check</span></span>'
      : '<a class="pc-logo" href="#" onclick="enterProduct(\'hub\');return false;" ' +
          'aria-label="PartsCheck home">Parts<span>Check</span></a>';
    var burger = onHub ? '' :
      '<button class="rail-hamburger pc-bar-burger" onclick="toggleRailDrawer()" ' +
        'aria-label="Menu" aria-expanded="false" aria-controls="app-rail">☰</button>';
    return (
      '<div class="pc-topbar">' +
        burger +
        logo +
        (onHub ? '' : productSelectHtml()) +
        '<div class="pc-top-right"><span class="u">Sam Mitchell</span>' +
          '<a href="#" onclick="return false;">My account</a> <a href="#" onclick="return false;">Logout</a></div>' +
      '</div>'
    );
  }
  window.pcBrandBar = pcBrandBar;
  window.todayShape = todayShape;
  window.barList = barList;
  window.ledgerTable = ledgerTable;

  /* ---- Overlay behaviour helpers (gap-fill, 2026-07-28 spec) ----
     Vanilla, dependency-free. pcModal owns one dialog at a time; pcMenu
     wires a dropdown to its trigger; pcToast appends to a shared
     aria-live stack. All markup uses the canonical overlay classes. */
  var _modalPrev = null;
  function _modalKey(e){ if (e.key === 'Escape') modalClose(); }
  function modalClose(){
    var bd = document.querySelector('.modal-backdrop');
    if (bd) bd.remove();
    document.removeEventListener('keydown', _modalKey);
    if (_modalPrev && _modalPrev.focus) _modalPrev.focus();
    _modalPrev = null;
  }
  function modalOpen(cfg){
    modalClose();
    _modalPrev = document.activeElement;
    var bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + escapeHtml(cfg.title || '') + '">' +
      '<div class="modal-h"><h3>' + escapeHtml(cfg.title || '') + '</h3>' +
      '<button class="modal-x" aria-label="Close">✕</button></div>' +
      '<div class="modal-b">' + (cfg.html || escapeHtml(cfg.body || '')) + '</div>' +
      (cfg.actions ? '<div class="modal-f">' + cfg.actions + '</div>' : '') +
      '</div>';
    bd.addEventListener('mousedown', function(ev){ if (ev.target === bd) modalClose(); });
    bd.querySelector('.modal-x').addEventListener('click', modalClose);
    document.body.appendChild(bd);
    document.addEventListener('keydown', _modalKey);
    var first = bd.querySelector('.modal-f .btn') || bd.querySelector('.modal-x');
    if (first) first.focus();
  }
  function modalConfirm(cfg){
    modalOpen({ title: cfg.title, body: cfg.body, html: cfg.html,
      actions: '<button class="btn" data-act="cancel">' + escapeHtml(cfg.cancel || 'Cancel') + '</button>' +
               '<button class="btn btn-primary" data-act="ok">' + escapeHtml(cfg.ok || 'Confirm') + '</button>' });
    var bd = document.querySelector('.modal-backdrop');
    bd.querySelector('[data-act="cancel"]').addEventListener('click', modalClose);
    bd.querySelector('[data-act="ok"]').addEventListener('click', function(){ modalClose(); if (cfg.onOk) cfg.onOk(); });
  }

  // One implementation, two entry points: menuAttach() wires a trigger so
  // every click toggles the menu; menuOpen() opens it imperatively, for
  // callers whose markup is re-rendered from an HTML string and so can't
  // hold a listener (the price grid's Print control works this way).
  function menuOpen(btn, items){
    var wrap = btn.parentElement;
    if (!wrap || !wrap.classList.contains('menu-wrap')) { console.warn('pcMenu: trigger must sit inside .menu-wrap'); return null; }
    var existing = wrap.querySelector('.menu');
    if (existing && existing.__pcClose) { existing.__pcClose(); return null; }
    btn.setAttribute('aria-haspopup', 'true');
    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role', 'menu');
    function close(){
      if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
      menu = null;
      btn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    }
    function onDoc(e){ if (!wrap.contains(e.target)) close(); }
    function onKey(e){
      if (e.key === 'Escape') { close(); btn.focus(); return; }
      if (!menu) return;
      var opts = Array.prototype.slice.call(menu.querySelectorAll('button'));
      var i = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (opts[i + 1] || opts[0]).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); (opts[i - 1] || opts[opts.length - 1]).focus(); }
    }
    menu.__pcClose = close;
    items.forEach(function(it){
      if (it.sep) { var s = document.createElement('div'); s.className = 'menu-sep'; menu.appendChild(s); return; }
      var b = document.createElement('button');
      b.setAttribute('role', 'menuitem');
      b.textContent = it.label;
      if (it.danger) b.className = 'danger';
      b.addEventListener('click', function(){ close(); if (it.onClick) it.onClick(); });
      menu.appendChild(b);
    });
    wrap.appendChild(menu);
    // Left-aligned to the trigger by default; right-align when that would
    // run off the viewport (a trigger parked at the right of a toolbar —
    // the price grid's Print control — otherwise opens off-screen).
    var mr = menu.getBoundingClientRect();
    if (mr.right > (window.innerWidth || document.documentElement.clientWidth || 0) - 8) {
      menu.classList.add('align-right');
    }
    btn.setAttribute('aria-expanded', 'true');
    // Deferred so the click that opened the menu doesn't immediately close it.
    setTimeout(function(){
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
    }, 0);
    var f = menu.querySelector('button'); if (f) f.focus();
    return close;
  }
  function menuAttach(btn, items){
    var wrap = btn.parentElement;
    if (!wrap || !wrap.classList.contains('menu-wrap')) { console.warn('pcMenu: trigger must sit inside .menu-wrap'); return; }
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function(){ menuOpen(btn, items); });
  }

  function pcToast(title, msg, kind){
    var stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = '<div><div class="tt">' + escapeHtml(title) + '</div>' +
      (msg ? '<div class="tm">' + escapeHtml(msg) + '</div>' : '') + '</div>' +
      '<button class="toast-x" aria-label="Dismiss">✕</button>';
    var timer = setTimeout(function(){ t.remove(); }, 5000);
    t.querySelector('.toast-x').addEventListener('click', function(){ clearTimeout(timer); t.remove(); });
    stack.appendChild(t);
  }

  window.pcModal = { open: modalOpen, close: modalClose, confirm: modalConfirm };
  window.pcMenu = { attach: menuAttach, open: menuOpen };
  window.pcToast = pcToast;

  /* ---- Shared idioms (one source of truth each) ----------------------
     Four small helpers that had grown a copy per view. Each is PURE and
     markup-free where the callers disagree on markup (splitRef), or
     carries the one agreed markup where they don't (jobsBreadcrumb,
     pcStepper). ui.js loads first (index.html), so every view can reach
     them as plain globals. */

  // splitRef — the job-reference grammar: a base number optionally
  // followed by a HASH suffix (a supplementary request, "91047#2") or a
  // DASH suffix (a purchase order, "91047-1"). Parsing only; callers
  // supply their own markup, which is why this returns parts rather than
  // HTML — pc-job.js's refSplit bolds the suffix in --ink, pc-quote.js's
  // refSuffix uses a plain <b>, and the price grid's due-time note wants
  // the bare suffix as text.
  function splitRef(nr){
    var s = String(nr === null || nr === undefined ? '' : nr);
    var m = /^(.*?)([#\-]\d+)$/.exec(s);
    return m ? { base: m[1], suffix: m[2] } : { base: s, suffix: '' };
  }
  window.splitRef = splitRef;

  // jobsBreadcrumb — the "← Jobs" crumb that opens both the job detail
  // view and the Get Price screen. One markup, one route, so the two
  // screens can never drift apart.
  function jobsBreadcrumb(){
    return (
      '<div style="margin-bottom:10px;">' +
        '<button class="lgc-open" onclick="go(\'jobs\')" title="Back to all jobs">' +
          '<span class="lgc-ref">← Jobs</span></button>' +
      '</div>'
    );
  }
  window.jobsBreadcrumb = jobsBreadcrumb;

  // pcStepper — the ".cstepper" STEP 1 GET PRICE → STEP 2 CHECK PRICE →
  // STEP 3 ORDERS strip. Both ends of the journey (pc-newquote's submitted
  // screen, pc-order's success screen) render the same three-step shape
  // with different labels, so the LOOP lives here and each caller passes
  // its own steps: [{ cls, b, s }].
  function pcStepper(steps){
    return '<div class="cstepper" style="margin:16px 0 0;">' + (steps || []).map(function(s){
      return '<div class="' + s.cls + '"><b>' + s.b + '</b><span>' + escapeHtml(s.s) + '</span></div>';
    }).join('') + '</div>';
  }
  window.pcStepper = pcStepper;

  // money — the hardened currency formatter. The SIGN SITS OUTSIDE the
  // symbol ("-$4,170.00", never "$-4,170.00"): negative figures only
  // surface on a loss-making profit or a negative job saving, which is why
  // the naive `'$' + Number(v).toFixed(2)` form went unnoticed in the
  // copies that had drifted out of views/pc-quote.js.
  function money(v){
    var s = v < 0 ? '-' : '';
    return s + '$' + Math.abs(v).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  window.money = money;
})();
