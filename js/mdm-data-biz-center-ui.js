/**
 * 经营数据中台 · 页面公共交互（基于 MdmDataBizUi，叠加本需求筛选与导出）
 */
(function (global) {
  'use strict';

  var Center = global.MdmDataBizCenter;
  var Ui = global.MdmDataBizUi;
  var Biz = global.MdmDataBiz;
  if (!Center || !Ui) return;

  var wp = global.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  function money(n) {
    if (Biz && Biz.money) return Biz.money(n);
    if (n == null || n !== n) return '—';
    return (
      '¥' +
      Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  function intText(n) {
    if (Biz && Biz.intText) return Biz.intText(n);
    if (n == null || n !== n) return '—';
    return Number(n).toLocaleString('zh-CN');
  }

  function esc(s) {
    if (Biz && Biz.esc) return Biz.esc(s);
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readState(defaults) {
    defaults = defaults || {};
    var q = new URLSearchParams(window.location.search);
    var period = Ui.normalizePeriodKey
      ? Ui.normalizePeriodKey(q.get('period') || defaults.period || '30d')
      : q.get('period') || defaults.period || '30d';
    return {
      period: period,
      channel: q.get('channel') || defaults.channel || 'all',
      line: q.get('line') || defaults.line || '',
      storeId: q.get('storeId') || defaults.storeId || '',
      supplierId: q.get('supplierId') || '',
      from: q.get('from') || defaults.from || '',
      to: q.get('to') || defaults.to || '',
      mode: q.get('mode') || defaults.mode || 'sales',
      tab: q.get('tab') || defaults.tab || '',
      back: q.get('back') || defaults.back || ''
    };
  }

  function writeState(state) {
    /* 只写入本需求筛选键，清掉旧版 view/sort/platScope 等残留 */
    /* 数据中台直出页面时保留外层 section/view，独立页面仍清理旧查询参数。 */
    var q = document.querySelector('.dc-layout')
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
    var keys = ['period', 'channel', 'line', 'storeId', 'supplierId', 'from', 'to', 'mode', 'tab', 'back'];
    keys.forEach(function (k) {
      var v = state[k];
      if (v == null || v === '') return;
      if (k === 'channel' && v === 'all') return;
      if (k === 'mode') {
        var path = location.pathname || '';
        var onStorePages =
          path.indexOf('mdm_data_biz_stores') >= 0 || path.indexOf('mdm_data_biz_store_detail') >= 0;
        if (!onStorePages) return;
        if (v === 'sales' && path.indexOf('store_detail') < 0) return;
      }
      if (k === 'tab' && (v === 'summary' || v === '')) return;
      if (k === 'back' && !v) return;
      q.set(k, String(v));
    });
    var qs = q.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }

  /**
   * opts: showChannel, showStore, showLine, showExport, hideView, exportName, extraHtml
   */
  function renderToolbar(host, state, opts) {
    opts = opts || {};
    var periods = [
      { id: 'today', label: '今日' },
      { id: 'yesterday', label: '昨日' },
      { id: '7d', label: '近7天' },
      { id: '30d', label: '近30天' },
      { id: 'custom', label: '自定义' }
    ];
    var html =
      '<div class="ldb-demo-banner ldb-demo-banner--proto"><strong>' +
      esc(Center.DEMO_LABEL) +
      '</strong> · 数据截止 ' +
      esc(Center.AS_OF.replace('T', ' ').replace('+08:00', '')) +
      '（北京时间）· 非 UAT 实数</div>' +
      '<div class="ldb-toolbar">' +
      '<div class="ldb-field"><label>日期</label><div class="ldb-chips" data-ldb-periods>';
    periods.forEach(function (p) {
      html +=
        '<button type="button" class="ldb-chip' +
        (state.period === p.id ? ' is-active' : '') +
        '" data-period="' +
        p.id +
        '">' +
        p.label +
        '</button>';
    });
    html +=
      '</div></div>' +
      '<div class="ldb-custom' +
      (state.period === 'custom' ? ' is-open' : '') +
      '" data-ldb-custom>' +
      '<input class="ldb-input" type="date" data-from value="' +
      esc(state.from || '') +
      '">' +
      '<span>至</span>' +
      '<input class="ldb-input" type="date" data-to value="' +
      esc(state.to || '') +
      '">' +
      '<button type="button" class="btn btn-primary" data-apply-custom style="height:32px;padding:0 12px;">应用</button>' +
      '</div>';

    if (opts.showStore !== false) {
      html +=
        '<div class="ldb-field"><label>门店</label><select class="ldb-select" data-filter="storeId">' +
        '<option value="">全部门店</option>' +
        Center.STORES.map(function (st) {
          return (
            '<option value="' +
            esc(st.id) +
            '"' +
            (state.storeId === st.id ? ' selected' : '') +
            '>' +
            esc(st.name) +
            '</option>'
          );
        }).join('') +
        '</select></div>';
    }

    if (opts.showSupplier) {
      html += '<div class="ldb-field"><label for="ldb-supplier">供应商</label>' +
        '<select id="ldb-supplier" class="ldb-select" data-filter="supplierId"><option value="">全部供应商</option>' +
        (opts.suppliers || Center.SUPPLIERS).map(function (supplier) {
          return '<option value="' + esc(supplier.id) + '"' +
            (state.supplierId === supplier.id ? ' selected' : '') + '>' + esc(supplier.name) + '</option>';
        }).join('') + '</select></div>';
    }

    if (opts.showLine !== false) {
      html +=
        '<div class="ldb-field"><label>事业线</label><select class="ldb-select" data-filter="line">' +
        '<option value="">所有事业线</option>' +
        Center.LINES.map(function (l) {
          return (
            '<option value="' +
            esc(l) +
            '"' +
            (state.line === l ? ' selected' : '') +
            '>' +
            esc(l) +
            '</option>'
          );
        }).join('') +
        '</select></div>';
    }

    if (opts.salesScope) {
      var retail = ['retail', 'mall', 'live'].indexOf(state.channel) >= 0;
      var business = retail ? 'retail' : state.channel === 'proxy' ? 'proxy' : 'all';
      html += '<div class="ldb-field"><label for="ldb-biz">订单渠道</label>' +
        '<select id="ldb-biz" class="ldb-select" data-filter="channel">' +
        (!opts.salesScopeRequired ? '<option value="all">全部（零售＋代采）</option>' : '') +
        '<option value="retail"' + (business === 'retail' ? ' selected' : '') + '>零售</option>' +
        '<option value="proxy"' + (business === 'proxy' ? ' selected' : '') + '>代采</option></select></div>';
      if (retail) {
        html += '<div class="ldb-field"><label for="ldb-retail-channel">零售渠道</label><select id="ldb-retail-channel" class="ldb-select" data-filter="channel">' +
          '<option value="retail">全部渠道</option>' +
          '<option value="mall"' + (state.channel === 'mall' ? ' selected' : '') + '>商城</option>' +
          '<option value="live"' + (state.channel === 'live' ? ' selected' : '') + '>直播</option></select></div>';
      }
    } else if (opts.showChannel) {
      html +=
        '<div class="ldb-field"><label>渠道</label><div class="ldb-chips" data-ldb-channel>' +
        ['all|全部', 'mall|商城', 'live|直播']
          .map(function (x) {
            var p = x.split('|');
            return (
              '<button type="button" class="ldb-chip' +
              (state.channel === p[0] ? ' is-active' : '') +
              '" data-channel="' +
              p[0] +
              '">' +
              p[1] +
              '</button>'
            );
          })
          .join('') +
        '</div></div>';
    }

    if (opts.extraHtml) html += opts.extraHtml;

    html += '<div class="ldb-meta" data-ldb-meta></div>';
    html +=
      '<button type="button" class="btn btn-secondary" data-open-glossary style="height:32px;padding:0 12px;">指标说明</button>';
    if (opts.showExport !== false) {
      html +=
        '<button type="button" class="btn btn-secondary" data-export data-lf-skip-export-notify style="height:32px;padding:0 12px;">导出</button>';
    }
    html += '</div>';
    host.innerHTML = html;
  }

  function bindToolbar(host, state, onChange, opts) {
    opts = opts || {};
    host.querySelectorAll('[data-period]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.period = btn.getAttribute('data-period');
        onChange();
      });
    });
    host.querySelectorAll('[data-channel]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.channel = btn.getAttribute('data-channel');
        onChange();
      });
    });
    var apply = host.querySelector('[data-apply-custom]');
    if (apply) {
      apply.addEventListener('click', function () {
        state.from = (host.querySelector('[data-from]') || {}).value || '';
        state.to = (host.querySelector('[data-to]') || {}).value || '';
        state.period = 'custom';
        onChange();
      });
    }
    host.querySelectorAll('[data-filter]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        state[sel.getAttribute('data-filter')] = sel.value;
        onChange();
      });
    });
    var g = host.querySelector('[data-open-glossary]');
    if (g) {
      g.addEventListener('click', function () {
        openGlossary();
      });
    }
    var exp = host.querySelector('[data-export]');
    if (exp) {
      exp.addEventListener('click', function () {
        openReportExport(host, state, opts.exportName);
      });
    }
  }

  /** 桌面确认样表：营销活动含积分工作表；提交后到文件中心下载示例 xlsx */
  var REPORT_EXPORT_SAMPLES = {
    '经营总览': {
      sheets: [
        '期间指标',
        '每日经营趋势',
        '门店排行前10',
        '下单与核销',
        '运营成本与毛利'
      ],
      sampleFile: '01 经营总览.xlsx',
      size: '7.5 KB'
    },
    '供应商分析': {
      sheets: ['供应商汇总', '供应商商品统计'],
      sampleFile: '02 供应商分析.xlsx',
      size: '5.8 KB'
    },
    '门店分析': {
      sheets: ['门店经营统计', '门店商品统计'],
      sampleFile: '03 门店分析.xlsx',
      size: '5.5 KB'
    },
    '单店详情': {
      sheets: ['单店指标', '每日经营趋势', '商品统计'],
      sampleFile: '04 单店详情.xlsx',
      size: '6.3 KB'
    },
    '食亨POS': {
      sheets: ['日门店账单统计'],
      sampleFile: '05 食亨 POS.xlsx',
      size: '4.6 KB'
    },
    '营销活动': {
      sheets: [
        '活动统计',
        '奖励及场次统计',
        '优惠券发放统计',
        '优惠券核销统计',
        '积分变动统计',
        '平台积分余额快照'
      ],
      sampleFile: '06 营销活动.xlsx',
      size: '5.4 KB'
    }
  };

  function sampleExportHref(fileName) {
    /* 根路径，文件中心在 SCM/MDM 任一页下载都可命中样表 */
    return (
      '/' +
      ('docs/经营报表-导出样例/' + String(fileName || ''))
        .split('/')
        .map(function (part) {
          return encodeURIComponent(part);
        })
        .join('/')
    );
  }

  function openReportExport(host, state, name) {
    var conf = REPORT_EXPORT_SAMPLES[name];
    if (!conf) return;
    var sheets = conf.sheets;
    var meta = host.querySelector('[data-ldb-meta]');
    var scope = (meta && meta.textContent) || filterHint(state);
    var period = Biz.resolvePeriod(state.period, state.from, state.to);
    var last = new Date(period.end.getTime() - 1);
    var filename = name + '报表_' + Biz.ymd(period.start) + '_' + Biz.ymd(last) + '.xlsx';
    Ui.showDrawer(
      '导出经营数据',
      '<div data-report-export>' +
        '<p class="ldb-tip"><strong>当前筛选</strong> ' +
        esc(scope) +
        '<br>数据截止 ' +
        esc(Center.AS_OF) +
        '</p>' +
        '<p>导出范围：当前筛选及账号权限下的全部匹配统计行。总览门店排行取前 10。</p>' +
        '<fieldset style="padding:12px;border:1px solid #d9e0e8"><legend>导出内容</legend>' +
        '<label style="display:block;margin-bottom:8px"><input type="checkbox" data-report-all checked> 全选</label>' +
        sheets
          .map(function (sheet) {
            return (
              '<label style="display:block;margin:8px 0"><input type="checkbox" data-report-sheet data-sheet-name="' +
              esc(sheet) +
              '" checked> ' +
              esc(sheet) +
              '</label>'
            );
          })
          .join('') +
        '</fieldset>' +
        '<p aria-live="polite" data-report-count></p>' +
        '<p>文件名：' +
        esc(filename) +
        '</p>' +
        '<p class="ldb-tip">原型提交后生成文件中心任务；下载的是已确认的<strong>导出示例表格</strong>（' +
        esc(conf.sampleFile) +
        '），正式环境再按勾选工作表灌实数。</p>' +
        '<div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">' +
        '<button type="button" class="btn btn-secondary" data-report-cancel>取消</button>' +
        '<button type="button" class="btn btn-primary" data-report-submit>提交到文件中心</button>' +
        '</div></div>'
    );
    var panel = document.querySelector('[data-report-export]');
    if (!panel) return;
    var all = panel.querySelector('[data-report-all]');
    var boxes = Array.from(panel.querySelectorAll('[data-report-sheet]'));
    var submitBtn = panel.querySelector('[data-report-submit]');
    function update() {
      var count = boxes.filter(function (box) {
        return box.checked;
      }).length;
      all.checked = count === boxes.length;
      all.indeterminate = count > 0 && count < boxes.length;
      panel.querySelector('[data-report-count]').textContent = count
        ? '预计生成 1 个 Excel 文件，包含 ' + count + ' 张工作表。'
        : '请选择至少一张工作表。';
      if (submitBtn) submitBtn.disabled = count === 0;
    }
    all.addEventListener('change', function () {
      boxes.forEach(function (box) {
        box.checked = all.checked;
      });
      update();
    });
    boxes.forEach(function (box) {
      box.addEventListener('change', update);
    });
    var cancel = panel.querySelector('[data-report-cancel]');
    if (cancel) {
      cancel.addEventListener('click', function () {
        if (typeof Ui.closeDrawer === 'function') Ui.closeDrawer();
      });
    }
    if (submitBtn) {
      submitBtn.addEventListener('click', function (ev) {
        var picked = boxes
          .filter(function (box) {
            return box.checked;
          })
          .map(function (box) {
            return box.getAttribute('data-sheet-name') || '';
          })
          .filter(Boolean);
        if (!picked.length) return;
        var downloadUrl = sampleExportHref(conf.sampleFile);
        var notify = global.LfFileCenterNotify;
        if (notify && typeof notify.bump === 'function') {
          notify.bump(
            {
              title: name + '报表导出',
              type: 'biz-report-export',
              fileName: filename,
              size: conf.size,
              downloadUrl: downloadUrl
            },
            { fromEvent: ev, toast: true, force: true }
          );
        } else if (typeof global.showToast === 'function') {
          global.showToast('已提交导出，请到文件中心下载', 'success');
        }
        if (typeof Ui.closeDrawer === 'function') Ui.closeDrawer();
      });
    }
    update();
  }

  function openGlossary() {
    var body =
      '<dl class="ldb-glossary">' +
      Center.GLOSSARY.map(function (g) {
        return '<dt>' + esc(g.name) + '</dt><dd>' + esc(g.text) + '</dd>';
      }).join('') +
      '</dl>';
    Ui.showDrawer('指标说明', body);
  }

  function toast(msg) {
    var el = document.querySelector('[data-ldb-toast]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ldb-toast';
      el.setAttribute('data-ldb-toast', '1');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-open');
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove('is-open');
    }, 2600);
  }

  function emptyBlock(text) {
    return '<div class="ldb-empty ldb-empty--block">' + esc(text || '暂无数据') + '</div>';
  }

  function sectionCard(title, bodyHtml, actionsHtml) {
    return (
      '<section class="ldb-card">' +
      '<div class="ldb-card__head"><h3 class="ldb-card__title">' +
      esc(title) +
      '</h3>' +
      (actionsHtml || '') +
      '</div>' +
      bodyHtml +
      '</section>'
    );
  }

  function simpleTable(columns, rows, emptyText) {
    if (!rows || !rows.length) {
      return emptyBlock(emptyText || '暂无明细');
    }
    var head = columns
      .map(function (c) {
        return '<th class="' + (c.num ? 'num' : '') + '">' + esc(c.label) + '</th>';
      })
      .join('');
    var body = rows
      .map(function (r) {
        return (
          '<tr>' +
          columns
            .map(function (c) {
              var v = r[c.key];
              var text;
              if (c.format === 'money') text = money(v);
              else if (c.format === 'int') text = intText(v);
              else if (v == null || v === '') text = '—';
              else text = esc(v);
              if (c.render) text = c.render(r, v);
              return '<td class="' + (c.num ? 'num' : '') + '">' + text + '</td>';
            })
            .join('') +
          '</tr>'
        );
      })
      .join('');
    return (
      '<div class="ldb-table-wrap"><table class="ldb-table"><thead><tr>' +
      head +
      '</tr></thead><tbody>' +
      body +
      '</tbody></table></div>'
    );
  }

  function pageTabs(items, activeId) {
    return (
      '<div class="ldb-page-tabs" role="tablist">' +
      items
        .map(function (it) {
          return (
            '<button type="button" class="ldb-page-tab' +
            (it.id === activeId ? ' is-active' : '') +
            '" data-page-tab="' +
            esc(it.id) +
            '">' +
            esc(it.label) +
            '</button>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function periodLabel(state) {
    if (!Biz || !Biz.resolvePeriod) {
      var map = { today: '今日', yesterday: '昨日', '7d': '近7天', '30d': '近30天', custom: '自定义' };
      return map[state.period] || '近30天';
    }
    return Biz.resolvePeriod(state.period, state.from, state.to).label;
  }

  function filterHint(state) {
    var bits = [periodLabel(state)];
    bits.push(state.storeId ? '指定门店' : '全部门店');
    bits.push(state.line ? '事业线·' + state.line : '所有事业线（全部参与汇总）');
    if (state.channel && state.channel !== 'all') {
      bits.push(({ retail: '零售', proxy: '代采', mall: '零售 · 商城', live: '零售 · 直播' })[state.channel] || state.channel);
    } else {
      bits.push('全部渠道');
    }
    return bits.join(' · ');
  }

  function pageHref(file, params) {
    return Ui.pageHref(file, params);
  }

  /** 复用现有订单页 orderId 深链：打开列表并自动拉起详情抽屉 */
  function orderDetailHref(row) {
    var id = row && (row.orderId || row.id);
    if (id == null || id === '') return '#';
    id = String(id);
    var biz = row.biz || row.bizKey || '';
    var page = biz === 'proxy' || biz === '代采' ? 'mdm_order_proxy.html' : 'mdm_order_retail.html';
    return pageHref(page, { orderId: id });
  }

  /** 展示号与 href 必须用同一行 orderId，禁止落到别的行 */
  function orderIdCell(row, v) {
    var id = v != null && v !== '' ? v : row && row.orderId;
    if (id == null || id === '') return '—';
    id = String(id);
    if (row && row.orderDetailUnavailable) return esc(id);
    var hrefRow = {
      orderId: id,
      biz: row && (row.biz || row.bizKey),
      bizKey: row && row.bizKey
    };
    return (
      '<a href="' +
      esc(orderDetailHref(hrefRow)) +
      '" target="_blank" rel="noopener" data-order-id="' +
      esc(id) +
      '">' +
      esc(id) +
      '</a>'
    );
  }

  /**
   * 可滚动分页表：粘性表头 + max-height 容器 + 10/20/50
   * pagerState: { page, pageSize }
   * onPageChange: function()
   */
  function renderPagedTable(columns, rows, pagerState, opts) {
    opts = opts || {};
    rows = rows || [];
    pagerState = pagerState || { page: 1, pageSize: 10 };
    pagerState.pageSize = Ui.normalizePageSize(pagerState.pageSize || 10);
    var paged = Ui.paginateRows(rows, pagerState.page, pagerState.pageSize);
    pagerState.page = paged.page;
    pagerState.pageSize = paged.pageSize;
    var unit = opts.unitLabel || '条';
    var tableHtml = simpleTable(columns, paged.rows, opts.emptyText || '暂无明细').replace(
      'class="ldb-table-wrap"',
      'class="ldb-table-wrap ldb-table-wrap--scroll"'
    );
    return (
      tableHtml +
      Ui.renderPager({
        total: paged.total,
        page: paged.page,
        pageSize: paged.pageSize,
        unitLabel: unit,
        rangeUnit: unit,
        rangeText: paged.total
          ? '当前展示第 ' + paged.from + '–' + paged.to + ' ' + unit
          : '当前无展示'
      })
    );
  }

  function bindPagedTable(host, pagerState, onPageChange) {
    if (!host) return;
    Ui.bindPager(host.querySelector('[data-ldb-pager]'), pagerState, onPageChange);
  }

  var incomeColumns = [
    { key: 'storeIncome', label: '门店预计所得', num: true, format: 'money' },
    { key: 'platformIncome', label: '平台预计所得', num: true, format: 'money' },
    { key: 'storeIncomeActual', label: '门店实际分佣', num: true, format: 'money' },
    { key: 'platformIncomeActual', label: '平台实际分佣', num: true, format: 'money' }
  ];
  var orderColumns = [
    { key: 'orderId', label: '主订单号', render: orderIdCell },
    { key: 'biz', label: '业务线' },
    { key: 'storeName', label: '门店' },
    { key: 'payTime', label: '支付成功时间' },
    { key: 'goodsSales', label: '商品金额', num: true, format: 'money' },
    { key: 'freightSales', label: '运费', num: true, format: 'money' },
    { key: 'refundAmount', label: '退款金额', num: true, format: 'money' }
  ].concat(incomeColumns);
  function openTableExport(opts) {
    var title = opts.title || '导出明细';
    var exportName = opts.exportName || title;
    var unitLabel = opts.unitLabel || '条';
    var rows = opts.rows || [];
    var columns = opts.columns || [];
    var checked = {};
    columns.forEach(function (c) {
      checked[c.key] = true;
    });
    function paint() {
      Ui.showDrawer(
        title,
        '<p class="ldb-tip ldb-tip--flush">勾选导出列（默认全选），提交后生成文件中心下载任务。当前筛选共 ' +
          intText(rows.length) +
          ' ' +
          esc(unitLabel) +
          '。</p>' +
          '<div class="ldb-drawer-export__cols">' +
          columns
            .map(function (c) {
              return (
                '<label class="ldb-drawer-export__col">' +
                '<input type="checkbox" data-export-col="' +
                esc(c.key) +
                '"' +
                (checked[c.key] ? ' checked' : '') +
                '> ' +
                esc(c.label) +
                '</label>'
              );
            })
            .join('') +
          '</div>' +
          '<div class="ldb-drawer-export__actions" style="margin-top:12px">' +
          '<button type="button" class="ldb-chip" data-export-all>全选</button>' +
          '<button type="button" class="ldb-chip is-active" data-export-submit data-lf-skip-export-notify>导出到文件中心</button>' +
          '<button type="button" class="ldb-chip" data-export-cancel>取消</button>' +
          '</div>'
      );
      var body = document.querySelector('[data-ldb-drawer-body]');
      if (!body) return;
      body.querySelectorAll('[data-export-col]').forEach(function (box) {
        box.addEventListener('change', function () {
          checked[box.getAttribute('data-export-col')] = !!box.checked;
        });
      });
      var allBtn = body.querySelector('[data-export-all]');
      if (allBtn) {
        allBtn.addEventListener('click', function () {
          columns.forEach(function (c) {
            checked[c.key] = true;
          });
          paint();
        });
      }
      var cancel = body.querySelector('[data-export-cancel]');
      if (cancel) {
        cancel.addEventListener('click', function () {
          if (typeof Ui.closeDrawer === 'function') Ui.closeDrawer();
        });
      }
      var submit = body.querySelector('[data-export-submit]');
      if (submit) {
        submit.addEventListener('click', function (ev) {
          var picked = columns
            .filter(function (c) {
              return checked[c.key];
            })
            .map(function (c) {
              return c.key;
            });
          if (!picked.length) return toast('请至少勾选一列');
          Ui.exportRowsToFileCenter(exportName, rows, columns, ev, { columns: picked });
          if (typeof Ui.closeDrawer === 'function') Ui.closeDrawer();
        });
      }
    }
    paint();
  }

  function renderStoreKpis(data, mode, showStoreCount) {
    var all = mode === 'all';
    var amountLabel = mode === 'proxy' ? '代采进货额' : 'GMV';
    function commissionCard(label, key, hint) {
      return Ui.kpiCard(label, money(data.commission[key]), '',
        mode === 'proxy' && key.indexOf('storeIncome') === 0 ? '代采订单无门店分佣' : hint);
    }

    return Ui.kpiCard(
        amountLabel,
        money(data.kpis.sales),
        '',
        '商品 ' + money(data.kpis.goodsSales) + ' · 运费 ' + money(data.kpis.freightSales) +
          (all ? ' · 零售 ' + money(data.retailKpis.sales) + ' · 代采 ' + money(data.proxyKpis.sales) : '')
      ) +
      Ui.kpiCard('支付主订单数', intText(data.kpis.orders), '', '按支付成功时间统计') +
      Ui.kpiCard(
        '成功退款',
        money(data.kpis.refundAmount),
        '',
        mode === 'proxy' ? '单独展示，不冲减进货额' : '单独展示，不冲减销售额'
      ) +
      (showStoreCount ? Ui.kpiCard(
        mode === 'proxy' ? '有进货门店' : '有成交门店',
        intText(data.stores.length),
        '',
        '当前筛选'
      ) : '') +
      (mode === 'proxy' ? '' :
        commissionCard('门店预计分佣', 'storeIncome', '按支付成功的示例订单汇总') +
        commissionCard('门店实际所得', 'storeIncomeActual', '按示例订单的结算完成时间入账')) +
      commissionCard('平台预计所得', 'platformIncome', '按支付成功的示例订单汇总') +
      commissionCard('平台实际所得', 'platformIncomeActual', '按示例订单的结算完成时间入账');
  }

  global.MdmDataBizCenterUi = {
    money: money,
    intText: intText,
    esc: esc,
    readState: readState,
    writeState: writeState,
    renderToolbar: renderToolbar,
    bindToolbar: bindToolbar,
    openGlossary: openGlossary,
    toast: toast,
    emptyBlock: emptyBlock,
    sectionCard: sectionCard,
    simpleTable: simpleTable,
    renderPagedTable: renderPagedTable,
    bindPagedTable: bindPagedTable,
    pageTabs: pageTabs,
    periodLabel: periodLabel,
    filterHint: filterHint,
    pageHref: pageHref,
    orderDetailHref: orderDetailHref,
    orderIdCell: orderIdCell,
    storeIncomeColumns: incomeColumns,
    storeOrderColumns: orderColumns,
    renderStoreKpis: renderStoreKpis,
    openTableExport: openTableExport,
    kpiCard: Ui.kpiCard,
    renderBars: Ui.renderBars,
    renderCompositionPie: Ui.renderCompositionPie,
    bindCompositionPie: Ui.bindCompositionPie,
    showDrawer: Ui.showDrawer,
    showDetailTable: Ui.showDetailTable,
    exportRowsToFileCenter: Ui.exportRowsToFileCenter,
    closeDrawer: Ui.closeDrawer
  };
})(typeof window !== 'undefined' ? window : this);
