/**
 * 平台经营概览 · 页面交互（门店 / 供应商 / 仓库）
 */
(function () {
  var dataApi = window.MdmOpsBizOverviewData;
  if (!dataApi) return;

  var state = {
    role: 'platform',
    range: '30d',
    scope: 'all',
    entityCode: '',
    customFrom: '',
    customTo: ''
  };

  function money(n) {
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    return (
      '¥' +
      Number(n).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    );
  }

  function intText(n) {
    if (n == null || n === '' || !isFinite(Number(n))) return '—';
    return Number(n).toLocaleString('zh-CN');
  }

  function formatValue(value, format) {
    if (format === 'money') return money(value);
    if (format === 'int') return intText(value);
    if (value == null || value === '') return '—';
    return String(value);
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function $(sel) {
    return document.querySelector(sel);
  }

  function ensureDefaultEntity() {
    if (state.scope !== 'one') return;
    if (state.entityCode) {
      var list = dataApi.listEntities(state.role) || [];
      var found = list.some(function (x) {
        return x.code === state.entityCode;
      });
      if (found) return;
    }
    var entities = dataApi.listEntities(state.role) || [];
    state.entityCode = entities[0] ? entities[0].code : '';
  }

  function renderRoleChips() {
    var host = $('[data-ops-role-chips]');
    if (!host) return;
    host.innerHTML = (dataApi.ROLE_OPTIONS || [])
      .map(function (opt) {
        return (
          '<button type="button" class="ops-biz-chip' +
          (state.role === opt.id ? ' is-active' : '') +
          '" data-ops-role="' +
          esc(opt.id) +
          '">' +
          esc(opt.label) +
          '</button>'
        );
      })
      .join('');
  }

  function renderRangeChips() {
    var host = $('[data-ops-range-chips]');
    if (!host) return;
    host.innerHTML = (dataApi.RANGE_OPTIONS || [])
      .map(function (opt) {
        return (
          '<button type="button" class="ops-biz-chip' +
          (state.range === opt.id ? ' is-active' : '') +
          '" data-ops-range="' +
          esc(opt.id) +
          '">' +
          esc(opt.label) +
          '</button>'
        );
      })
      .join('');
  }

  function renderScopeControls() {
    var meta = dataApi.roleMeta(state.role);
    var hideEntity = !!meta.hideEntity || state.role === 'platform';
    var scopeField = $('[data-ops-scope-field]');
    var entityField = $('[data-ops-entity-field]');
    if (scopeField) scopeField.hidden = hideEntity;
    if (entityField) entityField.hidden = hideEntity;
    if (hideEntity) {
      state.scope = 'all';
      return;
    }

    var scopeSel = $('[data-ops-scope]');
    if (scopeSel) {
      scopeSel.innerHTML =
        '<option value="all"' +
        (state.scope === 'all' ? ' selected' : '') +
        '>' +
        esc(meta.allLabel) +
        '</option>' +
        '<option value="one"' +
        (state.scope === 'one' ? ' selected' : '') +
        '>指定' +
        esc(meta.entityLabel) +
        '</option>';
    }
    var entityLabel = $('[data-ops-entity-label]');
    if (entityLabel) entityLabel.textContent = meta.entityLabel;

    var sel = $('[data-ops-entity-select]');
    if (!sel) return;
    var entities = dataApi.listEntities(state.role) || [];
    sel.innerHTML =
      '<option value="">请选择' +
      esc(meta.entityLabel) +
      '</option>' +
      entities
        .map(function (s) {
          return (
            '<option value="' +
            esc(s.code) +
            '"' +
            (state.entityCode === s.code ? ' selected' : '') +
            '>' +
            esc(s.name) +
            '（' +
            esc(s.code) +
            '）</option>'
          );
        })
        .join('');
    sel.disabled = state.scope !== 'one';
  }

  function syncCustomVisibility() {
    var box = $('[data-ops-custom-range]');
    if (!box) return;
    box.classList.toggle('is-open', state.range === 'custom');
  }

  function renderTrend(trend, title) {
    var titleEl = $('[data-ops-trend-title]');
    if (titleEl) titleEl.textContent = title || '趋势';
    var host = $('[data-ops-trend]');
    if (!host) return;
    var list = trend || [];
    if (!list.length) {
      host.innerHTML =
        '<div class="ops-biz-empty" style="min-height:160px;padding:32px 12px;">暂无趋势数据</div>';
      return;
    }
    var max = Math.max.apply(null, list.concat([1]));
    host.innerHTML = list
      .map(function (v, idx) {
        var h = Math.max(4, Math.round((Number(v) / max) * 170));
        return (
          '<div class="ops-biz-trend__bar-wrap" title="' +
          esc(formatValue(v, 'money')) +
          '">' +
          '<div class="ops-biz-trend__bar" style="height:' +
          h +
          'px"></div>' +
          '<span class="ops-biz-trend__label">D' +
          (idx + 1) +
          '</span></div>'
        );
      })
      .join('');
  }

  function renderKpis(kpis) {
    var host = $('[data-ops-kpi-row]');
    if (!host) return;
    host.innerHTML = (kpis || [])
      .map(function (kpi) {
        return (
          '<div class="ops-biz-kpi">' +
          '<p class="ops-biz-kpi__label">' +
          esc(kpi.label) +
          '</p>' +
          '<p class="ops-biz-kpi__value">' +
          esc(formatValue(kpi.value, kpi.format)) +
          '</p>' +
          (kpi.hint
            ? '<p class="ops-biz-kpi__hint">' + esc(kpi.hint) + '</p>'
            : '') +
          '</div>'
        );
      })
      .join('');
  }

  function renderComposition(pack) {
    var card = $('[data-ops-composition-card]');
    var host = $('[data-ops-composition]');
    var titleEl = $('[data-ops-composition-title]');
    var rankCard = $('[data-ops-rank-card]');
    var items = pack.composition || [];
    if (!items.length) {
      if (card) card.hidden = true;
      if (rankCard) rankCard.hidden = false;
      return;
    }
    if (card) card.hidden = false;
    if (rankCard) rankCard.hidden = true;
    if (titleEl) titleEl.textContent = pack.compositionTitle || '收益构成';
    if (!host) return;
    var total = pack.compositionTotal || 0;
    var barHtml = items
      .map(function (row) {
        var pct = total > 0 ? (row.value / total) * 100 : 0;
        return (
          '<div class="ops-biz-compose__seg" style="width:' +
          pct.toFixed(2) +
          '%;background:' +
          esc(row.color || '#1677ff') +
          '" title="' +
          esc(row.label + ' ' + formatValue(row.value, 'money')) +
          '"></div>'
        );
      })
      .join('');
    var legendHtml = items
      .map(function (row) {
        var pct = total > 0 ? Math.round((row.value / total) * 1000) / 10 : 0;
        return (
          '<div class="ops-biz-compose__item">' +
          '<span class="ops-biz-compose__dot" style="background:' +
          esc(row.color || '#1677ff') +
          '"></span>' +
          '<div class="ops-biz-compose__meta">' +
          '<div class="ops-biz-compose__name">' +
          esc(row.label) +
          '</div>' +
          '<div class="ops-biz-compose__tip">' +
          esc(row.tip || '') +
          '</div></div>' +
          '<div class="ops-biz-compose__val">' +
          esc(formatValue(row.value, 'money')) +
          '<span class="ops-biz-compose__pct">' +
          pct +
          '%</span></div></div>'
        );
      })
      .join('');
    host.innerHTML =
      '<div class="ops-biz-compose__bar">' +
      barHtml +
      '</div>' +
      '<div class="ops-biz-compose__legend">' +
      legendHtml +
      '</div>';
  }

  function renderRanking(pack) {
    if (pack.composition && pack.composition.length) return;
    var titleEl = $('[data-ops-rank-title]');
    if (titleEl) titleEl.textContent = pack.rankingTitle || '排行';
    var head = $('[data-ops-rank-head]');
    var body = $('[data-ops-rank-body]');
    var cols = pack.rankingCols || [];
    if (head) {
      head.innerHTML =
        '<tr><th>#</th><th>' +
        esc(pack.entityLabel || '名称') +
        '</th>' +
        cols
          .map(function (c) {
            return (
              '<th class="' +
              (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
              '">' +
              esc(c.label) +
              '</th>'
            );
          })
          .join('') +
        '</tr>';
    }
    if (!body) return;
    var rows = pack.ranking || [];
    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="' +
        (2 + cols.length) +
        '" style="text-align:center;color:#909399;padding:28px 8px;">暂无排行</td></tr>';
      return;
    }
    body.innerHTML = rows
      .map(function (row, idx) {
        var active =
          pack.scope === 'one' && row.code === pack.entityCode ? ' is-active' : '';
        return (
          '<tr class="' +
          active.trim() +
          '"><td class="ops-biz-rank-idx">' +
          (idx + 1) +
          '</td><td>' +
          esc(row.name) +
          '</td>' +
          cols
            .map(function (c) {
              return (
                '<td class="' +
                (c.format === 'money' || c.format === 'int' ? 'is-money' : '') +
                '">' +
                esc(formatValue(row[c.key], c.format)) +
                '</td>'
              );
            })
            .join('') +
          '</tr>'
        );
      })
      .join('');
  }

  function renderPanels(panels) {
    var host = $('[data-ops-bottom]');
    if (!host) return;
    host.innerHTML = (panels || [])
      .map(function (panel) {
        var cols = Math.min(3, Math.max(2, (panel.metrics || []).length));
        return (
          '<div class="ops-biz-card" style="min-height:auto;">' +
          '<h3 class="ops-biz-card__title">' +
          esc(panel.title) +
          '</h3>' +
          '<div class="ops-biz-metric-grid" style="grid-template-columns:repeat(' +
          cols +
          ',minmax(0,1fr));">' +
          (panel.metrics || [])
            .map(function (m) {
              return (
                '<div class="ops-biz-metric">' +
                '<p class="ops-biz-metric__label">' +
                esc(m.label) +
                '</p>' +
                '<p class="ops-biz-metric__value">' +
                esc(formatValue(m.value, m.format)) +
                '</p></div>'
              );
            })
            .join('') +
          '</div></div>'
        );
      })
      .join('');
  }

  function render() {
    ensureDefaultEntity();
    renderScopeControls();
    var pack = dataApi.build({
      role: state.role,
      scope: state.scope,
      entityCode: state.entityCode,
      range: state.range
    });
    var emptyHost = $('[data-ops-empty]');
    var bodyHost = $('[data-ops-body]');
    var hint = $('[data-ops-scope-hint]');
    if (hint) hint.textContent = pack.hint || pack.tip || '';

    if (pack.empty) {
      if (emptyHost) {
        emptyHost.hidden = false;
        emptyHost.textContent = pack.tip || '暂无数据';
      }
      if (bodyHost) bodyHost.hidden = true;
      return;
    }
    if (emptyHost) emptyHost.hidden = true;
    if (bodyHost) bodyHost.hidden = false;

    renderKpis(pack.kpis);
    renderTrend(pack.trend, pack.trendTitle);
    renderComposition(pack);
    renderRanking(pack);
    renderPanels(pack.panels);
  }

  function bind() {
    var root = $('[data-ops-overview]');
    if (!root) return;

    root.addEventListener('click', function (event) {
      var roleBtn = event.target.closest('[data-ops-role]');
      if (roleBtn) {
        state.role = roleBtn.getAttribute('data-ops-role') || 'platform';
        state.entityCode = '';
        if (state.role === 'platform') state.scope = 'all';
        ensureDefaultEntity();
        renderRoleChips();
        render();
        return;
      }
      var rangeBtn = event.target.closest('[data-ops-range]');
      if (rangeBtn) {
        state.range = rangeBtn.getAttribute('data-ops-range') || '30d';
        renderRangeChips();
        syncCustomVisibility();
        render();
      }
    });

    var scopeSel = $('[data-ops-scope]');
    if (scopeSel) {
      scopeSel.addEventListener('change', function () {
        state.scope = scopeSel.value === 'one' ? 'one' : 'all';
        ensureDefaultEntity();
        render();
      });
    }

    var entitySel = $('[data-ops-entity-select]');
    if (entitySel) {
      entitySel.addEventListener('change', function () {
        state.entityCode = entitySel.value || '';
        render();
      });
    }

    var fromInput = $('[data-ops-custom-from]');
    var toInput = $('[data-ops-custom-to]');
    if (fromInput) {
      fromInput.addEventListener('change', function () {
        state.customFrom = fromInput.value || '';
        if (state.range === 'custom') render();
      });
    }
    if (toInput) {
      toInput.addEventListener('change', function () {
        state.customTo = toInput.value || '';
        if (state.range === 'custom') render();
      });
    }
  }

  function init() {
    renderRoleChips();
    renderRangeChips();
    syncCustomVisibility();
    bind();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
