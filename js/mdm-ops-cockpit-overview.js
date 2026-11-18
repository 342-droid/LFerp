/**
 * 全景总览页 · 数据看板
 * 主指标卡＋模块对比＋环形构成，直观看出哪块经营最好。
 */
(function () {
  var shared = window.MdmOpsCockpitShared;
  var dataApi = window.MdmOpsCockpitData;
  if (!shared || !dataApi) return;

  var DONUT_COLORS = ['#1677ff', '#69b1ff', '#fa8c16', '#52c41a', '#722ed1', '#13c2c2'];

  var state = {
    range: '30d',
    party: 'all',
    source: 'all',
    fulfill: 'all',
    trendMetric: 'gmv',
    compTab: 'gmv',
    compSeg: 'top',
    moreOpen: false
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function partyType() {
    return shared.partyTypeOf ? shared.partyTypeOf(state.party) : 'all';
  }

  function deltaHtml(rate) {
    if (rate == null || !isFinite(rate)) return '<span class="ops-ck-delta is-na">—</span>';
    var up = rate >= 0;
    var pct = (Math.round(Math.abs(rate) * 1000) / 10).toFixed(1) + '%';
    return (
      '<span class="ops-ck-delta ' +
      (up ? 'is-up' : 'is-down') +
      '">' +
      (up ? '↑' : '↓') +
      pct +
      '</span>'
    );
  }

  function compareLine(compare, fmt) {
    if (!compare) return '';
    var bits = [];
    if (compare.dod != null) {
      bits.push('<span>较上期 ' + deltaHtml(compare.dod) + '</span>');
    }
    if (compare.wow != null) {
      bits.push('<span>较上周同期 ' + deltaHtml(compare.wow) + '</span>');
    }
    if (compare.avg7 != null && !shared.isPending(compare.avg7)) {
      bits.push(
        '<span>近 7 日均 ' +
          shared.esc(shared.format(compare.avg7, fmt || 'money')) +
          '</span>'
      );
    }
    return bits.length ? '<div class="ops-ck-compare">' + bits.join('') + '</div>' : '';
  }

  /** 演示环比：按行 id 稳定生成，避免每次刷新乱跳 */
  function demoMom(id, value) {
    if (shared.isPending(value) || typeof value !== 'number') return null;
    var h = 0;
    String(id || '').split('').forEach(function (ch) {
      h = (h * 31 + ch.charCodeAt(0)) % 97;
    });
    var rate = ((h % 21) - 10) / 100;
    return rate;
  }

  function demoPrev(value, mom) {
    if (typeof value !== 'number' || mom == null) return null;
    if (1 + mom === 0) return value;
    return Math.round((value / (1 + mom)) * 100) / 100;
  }

  /**
   * 营业额／收益／订单数＝当前所选主体口径；
   * RBT 回收仅「全部（平台）」；
   * 仓库仅履约趋势。
   */
  function trendOpts() {
    var type = partyType();
    if (type === '仓库') {
      return [
        { id: 'pending', label: '待发货SKU' },
        { id: 'shipped', label: '已出库SKU' },
        { id: 'outbound', label: '出库订单' }
      ];
    }
    var isPlat = type === 'all';
    var opts = [
      { id: 'gmv', label: isPlat ? '平台营业额' : '营业额' },
      { id: 'revenue', label: isPlat ? '平台收益' : '收益' },
      { id: 'orders', label: '订单数' }
    ];
    if (type === 'all') {
      opts.push({ id: 'rbt', label: 'RBT回收' });
    }
    return opts;
  }

  function renderTrend(pack) {
    var opts = trendOpts();
    if (
      opts.every(function (o) {
        return o.id !== state.trendMetric;
      })
    ) {
      state.trendMetric = opts[0] ? opts[0].id : 'gmv';
    }
    var chips = $('[data-ck-trend-chips]');
    if (chips) {
      chips.innerHTML = opts
        .map(function (opt) {
          return (
            '<button type="button" class="ops-ck-chip' +
            (state.trendMetric === opt.id ? ' is-active' : '') +
            '" data-trend="' +
            opt.id +
            '">' +
            opt.label +
            '</button>'
          );
        })
        .join('');
      chips.querySelectorAll('[data-trend]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.trendMetric = btn.getAttribute('data-trend') || 'gmv';
          render();
        });
      });
    }
    var host = $('[data-ck-trend]');
    if (!host) return;
    var list = (pack.trends && pack.trends[state.trendMetric]) || [];
    if (!list.length) {
      host.innerHTML =
        '<div class="ops-ck-empty">' +
        (state.trendMetric === 'rbt'
          ? 'RBT回收仅平台（全部）可看'
          : '暂无趋势') +
        '</div>';
      return;
    }
    var labels = pack.trendLabels || [];
    var max = Math.max.apply(null, list.concat([1]));
    var fmt =
      state.trendMetric === 'orders' ||
      state.trendMetric === 'pending' ||
      state.trendMetric === 'shipped' ||
      state.trendMetric === 'outbound'
        ? 'int'
        : 'money';
    host.innerHTML = list
      .map(function (v, i) {
        var h = Math.max(4, Math.round((Number(v) / max) * 150));
        var lbl = labels[i] || String(i + 1);
        return (
          '<div class="ops-ck-trend__col" title="' +
          shared.esc(lbl + ' · ' + shared.format(v, fmt)) +
          '"><div class="ops-ck-trend__bar" style="height:' +
          h +
          'px"></div><span class="ops-ck-trend__lbl">' +
          shared.esc(lbl) +
          '</span></div>'
        );
      })
      .join('');
  }

  function renderBoard(pack) {
    var board = pack.board || {};
    var tip = $('[data-ck-board-tip]');
    if (tip) {
      tip.textContent =
        pack.viewMode === 'warehouse'
          ? '仓库视角仅展示履约看板，不含金额类经营指标。'
          : '看板按当前筛选主体口径汇总；待接入数据不计 0，展示为「待接入」。';
    }

    var hero = board.hero || {};
    var heroEl = $('[data-ck-hero]');
    if (heroEl) {
      var pending = shared.isPending(hero.value) || hero.value == null;
      heroEl.innerHTML =
        '<div class="ops-ck-hero__top">' +
        '<div class="ops-ck-hero__label">' +
        shared.esc(hero.label || '核心指标') +
        '</div>' +
        '<span class="ops-ck-hero__badge">对比期 · 演示</span>' +
        '</div>' +
        '<div class="ops-ck-hero__value' +
        (pending ? ' is-pending' : '') +
        '">' +
        shared.esc(shared.format(hero.value, hero.format || 'money')) +
        '</div>' +
        (hero.hint
          ? '<div class="ops-ck-hero__hint">' + shared.esc(hero.hint) + '</div>'
          : '') +
        compareLine(hero.compare, hero.format || 'money');
    }

    var secEl = $('[data-ck-secondary]');
    if (secEl) {
      secEl.innerHTML = (board.secondary || [])
        .map(function (s) {
          var p = shared.isPending(s.value) || s.value == null;
          var dod = s.compare && s.compare.dod;
          var tone =
            dod == null || !isFinite(dod)
              ? ''
              : dod >= 0
                ? ' is-up'
                : ' is-down';
          /* 退款上涨视为偏弱 */
          if (s.label && s.label.indexOf('退款') >= 0 && tone) {
            tone = dod > 0 ? ' is-down' : ' is-up';
          }
          if (s.label && s.label.indexOf('预警') >= 0 && typeof s.value === 'number') {
            tone = s.value > 0 ? ' is-down' : ' is-up';
          }
          return (
            '<div class="ops-ck-sec' +
            tone +
            '">' +
            '<div class="ops-ck-sec__label">' +
            shared.esc(s.label) +
            '</div>' +
            '<div class="ops-ck-sec__value' +
            (p ? ' is-pending' : '') +
            '">' +
            shared.esc(shared.format(s.value, s.format || 'money')) +
            '</div>' +
            compareLine(s.compare, s.format || 'money') +
            '</div>'
          );
        })
        .join('');
    }

    var moreEl = $('[data-ck-more-kpis]');
    var toggle = $('[data-ck-more-toggle]');
    var moreList = board.moreKpis || [];
    if (toggle) {
      toggle.style.display = moreList.length ? '' : 'none';
      toggle.classList.toggle('is-open', !!state.moreOpen);
      toggle.innerHTML =
        (state.moreOpen ? '收起更多指标' : '展开更多指标') +
        ' <span class="ops-ck-more-toggle__icon" aria-hidden="true">' +
        (state.moreOpen ? '▴' : '▾') +
        '</span>';
      toggle.onclick = function () {
        state.moreOpen = !state.moreOpen;
        render();
      };
    }
    if (moreEl) {
      if (!moreList.length || !state.moreOpen) {
        moreEl.hidden = true;
        moreEl.innerHTML = '';
      } else {
        moreEl.hidden = false;
        moreEl.innerHTML = moreList
          .map(function (k) {
            var p = shared.isPending(k.value) || k.value == null;
            return (
              '<div class="ops-ck-more-item">' +
              '<span class="ops-ck-more-item__label">' +
              shared.esc(k.label) +
              '</span>' +
              '<span class="ops-ck-more-item__value' +
              (p ? ' is-pending' : '') +
              '">' +
              shared.esc(shared.format(k.value, k.format || 'money')) +
              '</span></div>'
            );
          })
          .join('');
      }
    }

    var modEl = $('[data-ck-modules]');
    if (modEl) {
      var mods = board.modules || [];
      if (!mods.length) {
        modEl.innerHTML = '<div class="ops-ck-empty">当前主体暂无模块对比</div>';
      } else {
        /* 已按贡献排序：环形图＋图例＋占比表 */
        var modRows = mods.map(function (m) {
          return {
            id: m.id,
            name: m.name + (m.metric ? '（' + m.metric + '）' : ''),
            value: m.value,
            format: m.format || 'money',
            best: !!m.best,
            worst: !!m.worst
          };
        });
        var asCount = pack.viewMode === 'warehouse';
        var fmt = asCount ? 'int' : 'money';
        modEl.innerHTML =
          '<div class="ops-ck-donut-panel">' +
          donutHtml(modRows, null, fmt) +
          '</div>' +
          '<div class="ops-ck-mix-table-wrap">' +
          mixTableHtml(modRows, null, fmt, asCount, {
            nameLabel: '模块',
            showRank: true
          }) +
          '</div>';
      }
    }
  }

  function donutHtml(rows, total, fmt) {
    var usable = (rows || []).filter(function (r) {
      return !shared.isPending(r.value) && typeof r.value === 'number' && r.value > 0;
    });
    var sum = 0;
    usable.forEach(function (r) {
      sum += Number(r.value) || 0;
    });
    var base =
      typeof total === 'number' && total > 0 ? total : sum > 0 ? sum : 0;
    if (!usable.length || base <= 0) {
      return (
        '<div class="ops-ck-donut-empty">' +
        '<div class="ops-ck-donut-empty__ring"></div>' +
        '<div class="ops-ck-donut-empty__txt">暂无构成</div></div>'
      );
    }
    var R = 54;
    var C = 2 * Math.PI * R;
    var offset = 0;
    var arcs = usable
      .map(function (r, i) {
        var share = Math.min(1, (Number(r.value) || 0) / base);
        var len = Math.max(0.8, share * C);
        var gap = usable.length > 1 ? 2 : 0;
        var dash = len - gap;
        if (dash < 0.5) dash = 0.5;
        var color = DONUT_COLORS[i % DONUT_COLORS.length];
        var el =
          '<circle class="ops-ck-donut__arc" cx="70" cy="70" r="' +
          R +
          '" fill="none" stroke="' +
          color +
          '" stroke-width="18" stroke-dasharray="' +
          dash.toFixed(2) +
          ' ' +
          (C - dash).toFixed(2) +
          '" stroke-dashoffset="' +
          (-offset).toFixed(2) +
          '" transform="rotate(-90 70 70)"></circle>';
        offset += len;
        return el;
      })
      .join('');
    var legend = usable
      .map(function (r, i) {
        var share = (Number(r.value) || 0) / base;
        return (
          '<div class="ops-ck-donut-legend__item">' +
          '<span class="ops-ck-donut-legend__dot" style="background:' +
          DONUT_COLORS[i % DONUT_COLORS.length] +
          '"></span>' +
          '<span class="ops-ck-donut-legend__name">' +
          shared.esc(r.name) +
          '</span>' +
          '<span class="ops-ck-donut-legend__pct">' +
          (Math.round(share * 1000) / 10).toFixed(2) +
          '%</span></div>'
        );
      })
      .join('');
    return (
      '<div class="ops-ck-donut">' +
      '<div class="ops-ck-donut__chart">' +
      '<svg viewBox="0 0 140 140" width="140" height="140" aria-hidden="true">' +
      '<circle cx="70" cy="70" r="54" fill="none" stroke="#f0f2f5" stroke-width="18"></circle>' +
      arcs +
      '</svg>' +
      '<div class="ops-ck-donut__center">' +
      '<div class="ops-ck-donut__total">' +
      shared.esc(shared.format(base, fmt || 'money')) +
      '</div>' +
      '<div class="ops-ck-donut__total-lbl">合计</div>' +
      '</div></div>' +
      '<div class="ops-ck-donut-legend">' +
      legend +
      '</div></div>'
    );
  }

  function mixTableHtml(rows, total, fmt, asCount, opts) {
    opts = opts || {};
    var list = rows || [];
    if (!list.length) {
      return '<div class="ops-ck-empty">当前主体不适用</div>';
    }
    var base = typeof total === 'number' && total > 0 ? total : 0;
    if (!base) {
      list.forEach(function (r) {
        if (!shared.isPending(r.value) && typeof r.value === 'number') {
          base += Number(r.value) || 0;
        }
      });
    }
    var valueLabel = asCount ? '当前值' : '当前金额';
    var nameLabel = opts.nameLabel || '构成项';
    var showRank = !!opts.showRank;
    return (
      '<table class="ops-ck-table ops-ck-mix-table"><thead><tr>' +
      (showRank ? '<th class="is-money">排序</th>' : '') +
      '<th>' +
      shared.esc(nameLabel) +
      '</th>' +
      '<th class="is-money">' +
      valueLabel +
      '</th>' +
      '<th class="is-money">环比</th>' +
      '<th class="is-money">占比</th>' +
      '<th class="is-money">上期</th>' +
      '</tr></thead><tbody>' +
      list
        .map(function (r, idx) {
          var pending = shared.isPending(r.value) || r.value == null;
          var mom = pending ? null : demoMom(r.id, r.value);
          var prev = pending ? null : demoPrev(r.value, mom);
          var rowFmt = r.format || fmt || 'money';
          var share =
            !pending && base > 0 && typeof r.value === 'number'
              ? Number(r.value) / base
              : null;
          var bar =
            share != null
              ? '<div class="ops-ck-mix-bar"><i style="width:' +
                Math.min(100, Math.round(share * 1000) / 10) +
                '%"></i></div>'
              : '';
          var rowCls = pending
            ? ' class="is-pending"'
            : r.best
              ? ' class="is-best"'
              : r.worst
                ? ' class="is-weak"'
                : '';
          var tag = r.best
            ? ' <span class="ops-ck-race__tag is-best">最优</span>'
            : r.worst
              ? ' <span class="ops-ck-race__tag is-weak">偏弱</span>'
              : pending
                ? ' <span class="ops-ck-race__tag is-pending">待接入</span>'
                : '';
          return (
            '<tr' +
            rowCls +
            '>' +
            (showRank
              ? '<td class="is-money">' + shared.esc(String(idx + 1)) + '</td>'
              : '') +
            '<td>' +
            shared.esc(r.name) +
            tag +
            '</td><td class="is-money">' +
            shared.esc(shared.format(r.value, rowFmt)) +
            '</td><td class="is-money">' +
            (mom == null ? '—' : deltaHtml(mom)) +
            '</td><td class="is-money ops-ck-mix-share">' +
            (share == null
              ? '—'
              : (Math.round(share * 1000) / 10).toFixed(2) + '%' + bar) +
            '</td><td class="is-money">' +
            shared.esc(shared.format(prev, rowFmt)) +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table>'
    );
  }

  function compositionPack(pack, isWh) {
    if (isWh) {
      return {
        tabs: [{ id: 'gmv', label: '履约结构' }],
        note: pack.gmvMixNote || '',
        topRows: pack.gmvMix || [],
        topTotal: null,
        detailRows: [],
        detailNote: '',
        fmt: 'int',
        asCount: true,
        totalLabel: '履约构成'
      };
    }
    var isPlat = partyType() === 'all';
    return {
      tabs: [
        { id: 'gmv', label: isPlat ? '平台营业额' : '营业额' },
        { id: 'rev', label: isPlat ? '平台收益' : '收益' }
      ],
      gmv: {
        note: pack.gmvMixNote || '',
        topRows: pack.gmvMix || [],
        topTotal: pack.gmvTotal,
        detailRows: pack.gmvRetailMix || [],
        detailNote: pack.gmvRetailNote || '',
        detailLabel: '用户零售明细',
        fmt: 'money',
        asCount: false
      },
      rev: {
        note: pack.revMixNote || '',
        topRows: pack.revMix || [],
        topTotal: pack.revTotal,
        detailRows: pack.revClearingMix || [],
        detailNote: pack.revClearingNote || '',
        detailLabel: '订单分账明细',
        fmt: 'money',
        asCount: false
      }
    };
  }

  function renderComposition(pack, isWh) {
    var card = $('[data-ck-comp-card]');
    var titleEl = $('[data-ck-comp-title]');
    var tabsEl = $('[data-ck-comp-tabs]');
    var noteEl = $('[data-ck-comp-note]');
    var donutEl = $('[data-ck-donut-panel]');
    var segEl = $('[data-ck-comp-seg]');
    var tableEl = $('[data-ck-mix-table]');
    if (!card) return;

    var cfg = compositionPack(pack, isWh);
    if (isWh) {
      state.compTab = 'gmv';
      state.compSeg = 'top';
      if (titleEl) titleEl.textContent = '履约构成';
      if (tabsEl) tabsEl.innerHTML = '';
      if (noteEl) noteEl.textContent = cfg.note || '';
      if (donutEl) {
        donutEl.innerHTML = donutHtml(cfg.topRows, null, 'int');
      }
      if (segEl) segEl.innerHTML = '';
      if (tableEl) {
        tableEl.innerHTML = mixTableHtml(cfg.topRows, null, 'int', true);
      }
      return;
    }

    if (
      cfg.tabs.every(function (t) {
        return t.id !== state.compTab;
      })
    ) {
      state.compTab = 'gmv';
    }
    var active = state.compTab === 'rev' ? cfg.rev : cfg.gmv;
    if (titleEl) {
      titleEl.textContent =
        state.compTab === 'rev'
          ? partyType() === 'all'
            ? '平台收益构成'
            : '收益构成'
          : partyType() === 'all'
            ? '平台营业额构成'
            : '营业额构成';
    }
    if (tabsEl) {
      tabsEl.innerHTML = cfg.tabs
        .map(function (t) {
          return (
            '<button type="button" class="ops-ck-comp-tab' +
            (state.compTab === t.id ? ' is-active' : '') +
            '" data-comp="' +
            t.id +
            '">' +
            shared.esc(t.label) +
            '</button>'
          );
        })
        .join('');
      tabsEl.querySelectorAll('[data-comp]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.compTab = btn.getAttribute('data-comp') || 'gmv';
          state.compSeg = 'top';
          render();
        });
      });
    }
    if (noteEl) noteEl.textContent = active.note || '';

    var hasDetail = (active.detailRows || []).length > 0;
    if (segEl) {
      if (!hasDetail) {
        segEl.innerHTML = '';
        state.compSeg = 'top';
      } else {
        segEl.innerHTML =
          '<button type="button" class="ops-ck-seg' +
          (state.compSeg === 'top' ? ' is-active' : '') +
          '" data-seg="top">一级构成</button>' +
          '<button type="button" class="ops-ck-seg' +
          (state.compSeg === 'detail' ? ' is-active' : '') +
          '" data-seg="detail">' +
          shared.esc(active.detailLabel || '明细') +
          '</button>';
        segEl.querySelectorAll('[data-seg]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.compSeg = btn.getAttribute('data-seg') || 'top';
            render();
          });
        });
      }
    }

    var rows =
      state.compSeg === 'detail' && hasDetail
        ? active.detailRows
        : active.topRows;
    var total =
      state.compSeg === 'detail' && hasDetail
        ? null
        : active.topTotal;
    if (state.compSeg === 'detail' && hasDetail) {
      /* 明细占比相对父项合计 */
      var parentId = state.compTab === 'rev' ? 'clearing' : 'retail';
      (active.topRows || []).forEach(function (r) {
        if (r.id === parentId && typeof r.value === 'number') total = r.value;
      });
      if (noteEl && active.detailNote) {
        noteEl.textContent = active.detailNote;
      }
    }

    if (donutEl) {
      donutEl.innerHTML = donutHtml(rows, total, active.fmt || 'money');
    }
    if (tableEl) {
      tableEl.innerHTML = mixTableHtml(
        rows,
        total,
        active.fmt || 'money',
        !!active.asCount
      );
    }
  }

  function renderRbt(pack) {
    var card = document.querySelector('[data-ck-rbt]')
      ? document.querySelector('[data-ck-rbt]').closest('.ops-ck-card')
      : null;
    var note = $('[data-ck-rbt-note]');
    var host = $('[data-ck-rbt]');
    var sum = pack.rbtSummary || {};
    if (sum.hidden) {
      if (card) card.style.display = 'none';
      return;
    }
    if (card) card.style.display = '';
    if (note) note.textContent = sum.note || '';
    if (!host) return;
    var groups = sum.groups || [];
    if (!groups.length && sum.metrics && sum.metrics.length) {
      groups = [{ title: '', metrics: sum.metrics }];
    }
    if (!groups.length) {
      host.innerHTML = '<div class="ops-ck-empty">当前主体不适用联营回收</div>';
      return;
    }
    host.innerHTML = groups
      .map(function (g) {
        return (
          '<div class="ops-ck-rbt-group">' +
          (g.title
            ? '<h4 class="ops-ck-rbt-group__title">' + shared.esc(g.title) + '</h4>'
            : '') +
          '<div class="ops-ck-rbt-rows">' +
          (g.metrics || [])
            .map(function (m) {
              var pending = shared.isPending(m.value) || m.value == null;
              return (
                '<div class="ops-ck-rbt-row' +
                (pending ? ' is-pending' : '') +
                '">' +
                '<div class="ops-ck-rbt-row__label">' +
                shared.esc(m.label) +
                (m.hint
                  ? '<span class="ops-ck-rbt-row__hint">' +
                    shared.esc(m.hint) +
                    '</span>'
                  : '') +
                '</div>' +
                '<div class="ops-ck-rbt-row__value">' +
                shared.esc(shared.format(m.value, m.format || 'text')) +
                '</div></div>'
              );
            })
            .join('') +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderRoleBill(pack) {
    var bill = pack.roleBill || {};
    var card = document.querySelector('[data-ck-bill]')
      ? document.querySelector('[data-ck-bill]').closest('.ops-ck-card')
      : null;
    var noteEl = $('[data-ck-bill-note]');
    var checkEl = $('[data-ck-bill-check]');
    var host = $('[data-ck-bill]');
    if (bill.hidden) {
      if (card) card.style.display = 'none';
      return;
    }
    if (card) card.style.display = '';
    if (noteEl) {
      noteEl.textContent =
        (bill.note || '') + (bill.refundNote ? ' ' + bill.refundNote : '');
    }
    if (checkEl) {
      if (bill.gmv == null) {
        checkEl.innerHTML = '';
      } else {
        var ok = !!bill.balanced;
        checkEl.className =
          'ops-ck-bill-check' + (ok ? ' is-ok' : ' is-bad');
        checkEl.innerHTML =
          '<span class="ops-ck-bill-check__tag">' +
          (ok ? '已对齐' : '有差额') +
          '</span>' +
          '<span>分账合计 <strong>' +
          shared.esc(shared.format(bill.sumTotal, 'money')) +
          '</strong></span>' +
          '<span>' +
          (partyType() === 'all' ? '平台营业额' : '营业额') +
          ' <strong>' +
          shared.esc(shared.format(bill.gmv, 'money')) +
          '</strong></span>' +
          '<span>差额 <strong>' +
          shared.esc(shared.format(bill.diff, 'money')) +
          '</strong></span>' +
          '<span class="ops-ck-bill-check__sub">零售 ' +
          shared.esc(shared.format(bill.sumRetail, 'money')) +
          ' ＋ 代采 ' +
          shared.esc(shared.format(bill.sumProxy, 'money')) +
          '</span>';
      }
    }
    if (!host) return;
    var rows = bill.rows || [];
    if (!rows.length) {
      host.innerHTML = '<div class="ops-ck-empty">当前筛选下暂无分账账单</div>';
      return;
    }
    function moneyCell(v) {
      if (v == null) return '<td class="is-money is-na">—</td>';
      return (
        '<td class="is-money">' + shared.esc(shared.format(v, 'money')) + '</td>'
      );
    }
    function pctCell(v) {
      if (v == null || !isFinite(v)) return '<td class="is-money is-na">—</td>';
      return (
        '<td class="is-money">' +
        shared.esc((Math.round(v * 1000) / 10).toFixed(1) + '%') +
        '</td>'
      );
    }
    host.innerHTML =
      '<table class="ops-ck-table ops-ck-bill-table"><thead><tr>' +
      '<th>角色</th><th>分账项</th><th class="is-money">零售</th><th class="is-money">代采</th>' +
      '<th class="is-money">合计</th><th class="is-money">占营业额</th><th>说明</th>' +
      '</tr></thead><tbody>' +
      rows
        .map(function (r) {
          var hl = r.role === '平台' ? ' class="is-plat"' : '';
          return (
            '<tr' +
            hl +
            '><td>' +
            shared.esc(r.role) +
            '</td><td>' +
            shared.esc(r.item) +
            '</td>' +
            moneyCell(r.retail) +
            moneyCell(r.proxy) +
            moneyCell(r.total) +
            pctCell(r.share) +
            '<td class="ops-ck-bill-note">' +
            shared.esc(r.note || '') +
            '</td></tr>'
          );
        })
        .join('') +
      '<tr class="ops-ck-bill-total"><td>合计</td><td>应对齐营业额</td>' +
      moneyCell(bill.sumRetail) +
      moneyCell(bill.sumProxy) +
      moneyCell(bill.sumTotal) +
      pctCell(bill.gmv > 0 ? 1 : null) +
      '<td class="ops-ck-bill-note">' +
      (bill.balanced ? '分账合计＝平台营业额' : '分账合计与营业额存在差额，请核对') +
      '</td></tr>' +
      '</tbody></table>';
  }

  function renderRanks(pack) {
    var host = $('[data-ck-ranks]');
    if (!host) return;
    var ranks = pack.ranks || {};
    var blocks = ranks.blocks || [];
    var titleEl = $('[data-ck-rank-title]');
    if (titleEl) {
      if (partyType() === '仓库') titleEl.textContent = '经营对象排行（仓库无）';
      else if (partyType() === '门店') titleEl.textContent = '经营对象排行 · 门店会员';
      else if (partyType() === '供应商') titleEl.textContent = '经营对象排行 · 门店与平台用户';
      else titleEl.textContent = '经营对象排行';
    }
    function blockHtml(b) {
      var cols = b.cols || [];
      var list = b.rows || [];
      if (!list.length) return '';
      return (
        '<div class="ops-ck-card ops-ck-card--soft"><div class="ops-ck-card__head"><h3 class="ops-ck-card__title">' +
        shared.esc(b.title || '') +
        '</h3></div><table class="ops-ck-table"><thead><tr>' +
        cols
          .map(function (c) {
            var moneyish = c.format === 'money' || c.format === 'int' || c.format === 'pct';
            return (
              '<th' +
              (moneyish ? ' class="is-money"' : '') +
              '>' +
              shared.esc(c.label) +
              '</th>'
            );
          })
          .join('') +
        '</tr></thead><tbody>' +
        list
          .map(function (r) {
            return (
              '<tr>' +
              cols
                .map(function (c) {
                  var val = r[c.key];
                  var moneyish =
                    c.format === 'money' || c.format === 'int' || c.format === 'pct';
                  var cls = '';
                  if (c.key === 'status' && val === '逾期关注') cls = ' is-warn';
                  if (c.key === 'status' && val === '已回本') cls = ' is-ok';
                  return (
                    '<td class="' +
                    (moneyish ? 'is-money' : '') +
                    cls +
                    '">' +
                    shared.esc(shared.format(val, c.format || 'text')) +
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
    var html = blocks
      .map(function (b) {
        return blockHtml(b);
      })
      .join('');
    host.innerHTML =
      html ||
      '<div class="ops-ck-empty">' +
        shared.esc(ranks.emptyNote || '当前筛选下暂无排行数据') +
        '</div>';
  }

  function renderAlerts(pack) {
    var host = $('[data-ck-alerts]');
    if (!host) return;
    host.innerHTML = (pack.alerts || [])
      .map(function (a) {
        var cls =
          'ops-ck-alert ops-ck-alert--' + shared.esc(a.level || 'info');
        if (a.href) {
          return (
            '<a class="' +
            cls +
            '" href="' +
            shared.pageHref(a.href) +
            '">' +
            shared.esc(a.text) +
            '</a>'
          );
        }
        return '<div class="' + cls + '">' + shared.esc(a.text) + '</div>';
      })
      .join('');
  }

  function render() {
    var pack = dataApi.overview(state);
    shared.renderMeta($('[data-ck-meta]'), pack.meta);
    shared.renderFilters($('[data-ck-filters]'), state, render, { mode: 'platform' });
    var isWh = pack.viewMode === 'warehouse' || partyType() === '仓库';
    if (isWh && ['gmv', 'revenue', 'orders', 'rbt'].indexOf(state.trendMetric) >= 0) {
      state.trendMetric = 'pending';
    }
    if (
      !isWh &&
      ['pending', 'shipped', 'outbound'].indexOf(state.trendMetric) >= 0
    ) {
      state.trendMetric = 'gmv';
    }
    renderBoard(pack);
    renderTrend(pack);
    renderComposition(pack, isWh);
    var billCard = $('[data-ck-bill-card]');
    if (billCard) billCard.style.display = isWh ? 'none' : '';
    renderRoleBill(pack);
    renderRbt(pack);
    renderRanks(pack);
    renderAlerts(pack);
  }

  render();
})();
