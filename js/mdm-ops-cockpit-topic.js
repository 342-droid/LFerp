/**
 * 专题页通用渲染：读取 body[data-ops-topic]
 */
(function () {
  var shared = window.MdmOpsCockpitShared;
  var dataApi = window.MdmOpsCockpitData;
  if (!shared || !dataApi) return;

  var topicId = document.body.getAttribute('data-ops-topic') || '';
  var state = {
    range: '30d',
    org: 'all',
    bu: 'all',
    line: 'all',
    channel: 'all',
    store: 'all',
    region: 'all'
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function renderTable(table) {
    return (
      '<div class="ops-ck-card ops-ck-card--soft"><div class="ops-ck-card__head"><h3 class="ops-ck-card__title">' +
      shared.esc(table.title) +
      '</h3></div><table class="ops-ck-table"><thead><tr>' +
      (table.columns || [])
        .map(function (c) {
          return (
            '<th class="' +
            (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
            '">' +
            shared.esc(c.label) +
            '</th>'
          );
        })
        .join('') +
      '</tr></thead><tbody>' +
      (table.rows || [])
        .map(function (row) {
          return (
            '<tr>' +
            (table.columns || [])
              .map(function (c) {
                return (
                  '<td class="' +
                  (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
                  '">' +
                  shared.esc(shared.format(row[c.key], c.format || 'text')) +
                  '</td>'
                );
              })
              .join('') +
            '</tr>'
          );
        })
        .join('') +
      '</tbody></table></div>'
    );
  }

  function render() {
    var pack = dataApi.topic(topicId, state);
    if (!pack) {
      var empty = $('[data-ck-body]');
      if (empty) empty.innerHTML = '<div class="ops-ck-empty">未找到专题：' + shared.esc(topicId) + '</div>';
      return;
    }
    var titleEl = $('[data-ck-title]');
    if (titleEl) titleEl.textContent = pack.title;
    var groupEl = $('[data-ck-group]');
    if (groupEl) groupEl.textContent = pack.group || '';
    shared.renderMeta($('[data-ck-meta]'), pack.meta);
    shared.renderFilters($('[data-ck-filters]'), state, render);

    var perm = $('[data-ck-perm]');
    if (perm) {
      if (pack.permNote) {
        perm.hidden = false;
        perm.textContent = pack.permNote;
      } else {
        perm.hidden = true;
      }
    }

    var kpiHost = $('[data-ck-kpis]');
    if (kpiHost) kpiHost.innerHTML = (pack.kpis || []).map(shared.kpiHtml).join('');

    var notes = $('[data-ck-notes]');
    if (notes) {
      notes.innerHTML = (pack.notes || [])
        .map(function (n) {
          return '<p class="ops-ck-note">' + shared.esc(n) + '</p>';
        })
        .join('');
    }

    var links = $('[data-ck-links]');
    if (links) {
      links.innerHTML = (pack.links || [])
        .map(function (l) {
          return (
            '<a class="ops-ck-card__action" href="' +
            shared.pageHref(l.href) +
            '">' +
            shared.esc(l.label) +
            ' ›</a>'
          );
        })
        .join(' · ');
    }

    var tables = $('[data-ck-tables]');
    if (tables) {
      tables.innerHTML = (pack.tables || []).map(renderTable).join('');
    }
  }

  function init() {
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
