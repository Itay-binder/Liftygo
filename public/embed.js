/**
 * Liftygo affiliate dashboard — embed for Elementor.
 *
 * מומלץ (קובץ חיצוני): הוסף לפני הסקריפט
 *   <div id="liftygo-affiliate-dashboard"></div>
 *   <script src=".../embed.js" defer data-api-base="https://.../api"></script>
 *
 * או הגדר לפני: window.AFFILIATE_DASHBOARD_API_BASE = 'https://.../api';
 */
(function () {
  'use strict';

  var EXEC_SCRIPT = document.currentScript;
  var API_BASE =
    (EXEC_SCRIPT && EXEC_SCRIPT.getAttribute('data-api-base')) ||
    (typeof window !== 'undefined' && window.AFFILIATE_DASHBOARD_API_BASE) ||
    '';

  var DATE_PRESETS = [
    { id: 'today', label: 'היום' },
    { id: 'yesterday', label: 'אתמול' },
    { id: 'last3', label: '3 ימים אחרונים' },
    { id: 'last7', label: '7 ימים' },
    { id: 'thisMonth', label: 'החודש' },
    { id: 'last30', label: '30 ימים אחרונים' },
    { id: 'custom', label: 'טווח מותאם' },
    { id: 'all', label: 'מקסימום' },
  ];

  function getUtmSource() {
    try {
      var params = new URLSearchParams(window.location.search);
      var v = params.get('utm_source');
      return v && String(v).trim() ? String(v).trim() : '';
    } catch (e) {
      return '';
    }
  }

  function ensureTailwind() {
    if (document.querySelector('script[data-liftygo-tailwind]')) return;
    var s = document.createElement('script');
    s.src = 'https://cdn.tailwindcss.com';
    s.setAttribute('data-liftygo-tailwind', '1');
    document.head.appendChild(s);
  }

  function normalizeApiBase(base) {
    if (!base) return '';
    return String(base).replace(/\/+$/, '');
  }

  function startOfDay(d) {
    var x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  function endOfDay(d) {
    var x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  function getRangeForPreset(presetId, customFrom, customTo) {
    var now = new Date();
    var start;
    var end = endOfDay(now);

    switch (presetId) {
      case 'today':
        start = startOfDay(now);
        break;
      case 'yesterday': {
        var y = new Date(now);
        y.setDate(y.getDate() - 1);
        start = startOfDay(y);
        end = endOfDay(y);
        break;
      }
      case 'last3':
        start = startOfDay(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
        break;
      case 'last7':
        start = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
        break;
      case 'thisMonth':
        start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'last30':
        start = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
        break;
      case 'custom':
        if (customFrom && customTo) {
          start = startOfDay(new Date(customFrom));
          end = endOfDay(new Date(customTo));
        } else {
          start = null;
          end = null;
        }
        break;
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }
    return { start: start, end: end };
  }

  function mount(root) {
    var utm = getUtmSource();
    var api = normalizeApiBase(API_BASE);
    var state = {
      preset: 'last7',
      customFrom: '',
      customTo: '',
      rows: [],
      loading: false,
      error: '',
    };

    function el(tag, className, text) {
      var n = document.createElement(tag);
      if (className) n.className = className;
      if (text != null) n.textContent = text;
      return n;
    }

    function render() {
      root.innerHTML = '';
      root.className = 'liftygo-affiliate-dashboard font-sans text-right';

      var wrap = el('div', 'max-w-6xl mx-auto p-4 space-y-4');

      var header = el('div', 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm');
      var title = el('h2', 'text-lg font-semibold text-slate-900', 'דשבורד שותפים');
      var sub = el(
        'p',
        'mt-1 text-sm text-slate-600',
        utm
          ? 'מזוהה שותף: ' + utm
          : 'לא נמצא utm_source בכתובת — הוסף פרמטר לדף (למשל ?utm_source=partner1).'
      );
      header.appendChild(title);
      header.appendChild(sub);

      var filters = el('div', 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm');
      var flabel = el('div', 'text-sm font-medium text-slate-700 mb-2', 'טווח תאריכים');
      var chips = el('div', 'flex flex-wrap gap-2');
      DATE_PRESETS.forEach(function (p) {
        var b = el(
          'button',
          'rounded-lg border px-3 py-1.5 text-sm transition ' +
            (state.preset === p.id
              ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'),
          p.label
        );
        b.type = 'button';
        b.addEventListener('click', function () {
          state.preset = p.id;
          render();
          fetchRows();
        });
        chips.appendChild(b);
      });
      filters.appendChild(flabel);
      filters.appendChild(chips);

      if (state.preset === 'custom') {
        var row = el('div', 'mt-4 flex flex-wrap items-end gap-3');
        var f1 = el('label', 'flex flex-col gap-1 text-xs text-slate-600');
        f1.appendChild(document.createTextNode('מ-תאריך'));
        var i1 = document.createElement('input');
        i1.type = 'date';
        i1.className = 'rounded border border-slate-300 px-2 py-1 text-sm';
        i1.value = state.customFrom;
        i1.addEventListener('change', function () {
          state.customFrom = i1.value;
        });
        f1.appendChild(i1);
        var f2 = el('label', 'flex flex-col gap-1 text-xs text-slate-600');
        f2.appendChild(document.createTextNode('עד-תאריך'));
        var i2 = document.createElement('input');
        i2.type = 'date';
        i2.className = 'rounded border border-slate-300 px-2 py-1 text-sm';
        i2.value = state.customTo;
        i2.addEventListener('change', function () {
          state.customTo = i2.value;
        });
        f2.appendChild(i2);
        var apply = el(
          'button',
          'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700',
          'החל'
        );
        apply.type = 'button';
        apply.addEventListener('click', function () {
          fetchRows();
        });
        row.appendChild(f1);
        row.appendChild(f2);
        row.appendChild(apply);
        filters.appendChild(row);
      }

      var tableCard = el('div', 'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden');
      var status = el('div', 'border-b border-slate-100 px-4 py-2 text-sm text-slate-600');
      if (state.loading) status.textContent = 'טוען נתונים…';
      else if (state.error) status.textContent = state.error;
      else if (!api) status.textContent = 'לא הוגדר data-api-base — הנתונים יגיעו מהשרת לאחר ההגדרה.';
      else status.textContent = 'מציג ' + state.rows.length + ' שורות.';

      var tableWrap = el('div', 'overflow-x-auto');
      var table = el('table', 'min-w-full text-sm');
      var thead = el('thead', 'bg-slate-50 text-slate-700');
      var hr = el('tr', '');
      ['תאריך', 'מקור (utm)', 'פעולות / הערות'].forEach(function (h) {
        var th = el('th', 'px-4 py-3 text-right font-medium', h);
        hr.appendChild(th);
      });
      thead.appendChild(hr);

      var tbody = el('tbody', 'divide-y divide-slate-100');
      if (state.rows.length === 0 && !state.loading) {
        var tr = el('tr', '');
        var td = el(
          'td',
          'px-4 py-6 text-center text-slate-500',
          'אין שורות להצגה בטווח הנבחר או עדיין אין חיבור ל-API.'
        );
        td.colSpan = 3;
        tr.appendChild(td);
        tbody.appendChild(tr);
      } else {
        state.rows.forEach(function (r) {
          var tr = el('tr', 'hover:bg-slate-50/80');
          tr.appendChild(el('td', 'px-4 py-3 text-slate-800', r.date || '—'));
          tr.appendChild(el('td', 'px-4 py-3 text-slate-800', r.utm_source || '—'));
          tr.appendChild(el('td', 'px-4 py-3 text-slate-600', r.note || '—'));
          tbody.appendChild(tr);
        });
      }

      table.appendChild(thead);
      table.appendChild(tbody);
      tableWrap.appendChild(table);
      tableCard.appendChild(status);
      tableCard.appendChild(tableWrap);

      wrap.appendChild(header);
      wrap.appendChild(filters);
      wrap.appendChild(tableCard);
      root.appendChild(wrap);
    }

    function fetchRows() {
      var range = getRangeForPreset(state.preset, state.customFrom, state.customTo);
      if (!api) {
        state.rows = [];
        state.error = '';
        render();
        return;
      }
      if (!utm) {
        state.rows = [];
        state.error = 'חסר utm_source — לא נשלחה בקשה לשרת.';
        render();
        return;
      }

      state.loading = true;
      state.error = '';
      render();

      var url =
        api +
        '/affiliate-data?' +
        new URLSearchParams({
          utm_source: utm,
          preset: state.preset,
          from: range.start ? range.start.toISOString() : '',
          to: range.end ? range.end.toISOString() : '',
        }).toString();

      fetch(url, { credentials: 'omit' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          state.loading = false;
          var list = data && data.rows;
          state.rows = Array.isArray(list) ? list : [];
          state.error = '';
          render();
        })
        .catch(function (err) {
          state.loading = false;
          state.rows = [];
          state.error = 'שגיאה בטעינת נתונים: ' + (err && err.message ? err.message : String(err));
          render();
        });
    }

    ensureTailwind();
    render();
    fetchRows();
  }

  function insertMountPoint() {
    var host = document.getElementById('liftygo-affiliate-dashboard');
    if (host) {
      mount(host);
      return;
    }
    var anchor = EXEC_SCRIPT;
    var root = document.createElement('div');
    root.id = 'liftygo-affiliate-dashboard-root';
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(root, anchor.nextSibling);
    } else {
      document.body.appendChild(root);
    }
    mount(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertMountPoint);
  } else {
    insertMountPoint();
  }
})();
