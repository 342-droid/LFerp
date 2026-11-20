/**
 * BD 数据中心页面。顶层：门店数据／佣金数据；佣金数据直接进分析，明细从分析页进入。
 */
(function () {
  var page = document.body.getAttribute('data-dc-page') || 'overview';
  var openId = '';
  var api = null;
  var dcGroup = new URLSearchParams(location.search).get('group') || 'stores';
  var dcSection = new URLSearchParams(location.search).get('section') || (dcGroup === 'commission' ? 'analysis' : 'business');
  if (dcGroup === 'commission' && dcSection === 'comm') dcSection = 'analysis';

  function K() { return window.StoreAppRoleDc; }
  function D() { return window.StoreAppBdDcData; }
  function st() { return api.get(); }
  function esc(s) { return K().esc(s); }

  var BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 6l-6 6 6 6"/></svg>';
  var HELP_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7.5h.01" stroke-linecap="round"/></svg>';
  var WORKBENCH = '../../MDM/mdm_bd_workbench.html#home';

  function customOf() {
    var s = st();
    return { start: s.start, end: s.end };
  }
  function setCaption(data) {
    var p = document.getElementById('dcPeriod');
    var a = document.getElementById('dcAsOf');
    if (p) p.textContent = K().periodCaption(data.bounds, data.compareLabel);
    if (a) { a.textContent = K().updatedCaption(data.updatedAt).replace('（演示数据）', ''); a.hidden = page === 'analysis' || (page === 'overview' && dcGroup === 'commission'); }
  }
  function paintRanges() {
    api.renderRanges(document.getElementById('dcRanges'), st().range);
  }
  function chips(items, active, attr) {
    return '<div class="sa-dc-chip" role="tablist">' + items.map(function (it) {
      return '<button type="button" class="sa-dc-chip__btn' + (it.id === active ? ' is-active' : '') + '" data-' + attr + '="' + esc(it.id) + '">' + esc(it.name) + '</button>';
    }).join('') + '</div>';
  }
  function mtabs(items, active) {
    return '<div class="sa-dc-mtabs" role="tablist">' + items.map(function (it) {
      var on = it.id === active;
      return '<button type="button" role="tab" class="sa-dc-mtabs__btn' + (on ? ' is-active' : '') + '" aria-selected="' + (on ? 'true' : 'false') + '" data-tab="' + it.id + '">' + esc(it.name) + '</button>';
    }).join('') + '</div>';
  }
  function moneyHero(title, value, delta, label) {
    return K().hero(title, K().moneyFmt(value) + '<span class="sa-dc-hero__unit">元</span>', K().deltaHtml(delta, label));
  }
  function block(title, linkHtml, inner) {
    return '<section class="sa-dc-block">' + (title || linkHtml ? '<div class="sa-dc-block__hd"><h2 class="sa-dc-block__title">' + esc(title) + '</h2>' + (linkHtml || '') + '</div>' : '') + inner + '</section>';
  }
  function rankRows(rank, tab) {
    if (!rank.rows.length) return '<div class="sa-dc-empty">这个时段没有门店数据</div>';
    return rank.rows.map(function (r) {
      var shown = rank.money ? K().moneyFmt(r.value) : K().intFmt(r.value);
      var href = api.href('biz-bd-store.html', { tab: tab, store: r.id }) + '&returnTo=stores';
      return '<a class="sa-dc-list-row" href="' + href + '"><div class="sa-dc-list-row__main"><div class="sa-dc-list-row__title">' + esc(r.name) + '</div><div class="sa-dc-list-row__meta">' + esc(rank.label) + ' · 订单 ' + K().intFmt(r.orders) + '</div></div><div><div class="sa-dc-list-amt">' + shown + (rank.money ? '' : '') + '</div>' + (r.delta ? K().deltaHtml(r.delta, '') : '') + '</div></a>';
    }).join('');
  }

  function head(active) {
    var s = st();
    if (active === 'comm') return '<div class="sa-dc-head__row"><a class="sa-dc-head__back" href="' + api.href('biz-bd-center.html', {store:''}) + '" aria-label="返回总览">' + BACK_SVG + '</a><h1 class="bd-page-title">佣金明细</h1><button type="button" class="sa-dc-tip-btn" data-tip aria-label="指标说明">' + HELP_SVG + '</button></div>' + rangeBlock();
    return '<div class="sa-dc-head__row"><a class="sa-dc-head__back" href="' + WORKBENCH + '" aria-label="返回工作台">' + BACK_SVG + '</a><h1 class="bd-page-title">数据中心</h1><button type="button" class="sa-dc-tip-btn" data-tip aria-label="指标说明">' + HELP_SVG + '</button></div>' + rangeBlock();
  }
  function nav(title, href) {
    var el = document.getElementById('dcNav');
    if (!el) return;
    el.innerHTML = '<a class="sa-rpt-nav__back" href="' + href + '" aria-label="返回">' + BACK_SVG + '</a><h1 class="sa-rpt-nav__title">' + esc(title) + '</h1><button type="button" class="sa-rpt-nav__link sa-dc-nav-help" data-tip aria-label="指标说明">' + HELP_SVG + '</button>';
  }
  function rangeBlock() {
    return '<div class="sa-dc-ranges" id="dcRanges"></div><p class="sa-dc-period" id="dcPeriod"></p><p class="sa-dc-asof" id="dcAsOf"></p>';
  }

  function storeCommissionHtml(storeId, tab) {
    var s = st();
    var source = tab === 'proxy' ? '代采' : '零售';
    var comparison = D().businessCommission(s.range, customOf(), tab, storeId);
    var result = D().commissionList(s.range, customOf(), 'current', 'pay', source, 'all', storeId);
    var href = api.href('biz-bd-commission-list.html', {
      store: storeId,
      scope: 'current',
      source: source,
      settle: 'all',
      dim: 'pay',
      range: s.range,
      start: s.range === 'custom' ? s.start : '',
      end: s.range === 'custom' ? s.end : ''
    });
    return (
      '<a class="bd-store-commission" href="' +
      href +
      '"><span>' +
      source +
      '佣金（元）</span><strong>' +
      K().moneyFmt(result.total) +
      ' <small>查看明细 ›</small></strong>' +
      K().deltaHtml(comparison.delta, comparison.compareLabel) +
      '</a>'
    );
  }

  function renderOverview() {
    if (st().store) api.update({ store: '' });
    document.getElementById('dcHead').innerHTML = head('overview');
    var s = st();
    var tab = s.tab === 'proxy' ? 'proxy' : 'retail';
    var data = D().overview(s.range, customOf());
    var ranked = D().storesView(s.range, customOf(), tab, tab === 'proxy' ? 'goods' : 'paid').rank;
    var c = data.counts;
    var visibleRows = tab === 'proxy' ? ranked.rows.filter(function(r){ return r.orders > 0; }) : ranked.rows;
    var rows = visibleRows.map(function (r) {
      var detail = D().storeView(s.range, customOf(), r.id, tab);
      var m = tab === 'proxy' ? detail.proxy : detail.retail;
      var last = tab === 'proxy' ? detail.historyLastPurchase : detail.historyLastRetail;
      return '<a class="bd-store-card" href="' + api.href('biz-bd-store.html', {tab:tab,store:r.id}) + '"><div class="bd-store-card__head"><strong>' + esc(r.name) + '</strong><span>查看详情 ›</span></div><div class="bd-store-card__amount"><span>' + (tab === 'proxy' ? '代采商品金额' : '零售成交额') + '</span><strong>' + K().moneyFmt(r.value) + '<small>元</small></strong></div>' + K().deltaHtml(r.delta, data.compareLabel) + '<div class="bd-store-card__metrics"><span>订单数<b>' + K().intFmt(m.orders) + '</b></span><span>' + (tab === 'proxy' ? '进货天数' : '支付人数') + '<b>' + K().intFmt(tab === 'proxy' ? m.days : m.users) + '</b></span>' + (tab === 'proxy' ? '' : '<span>客单价（元）<b>' + K().moneyFmt(m.aov) + '</b></span>') + '</div>' + storeCommissionHtml(r.id, tab).replace('<a ', '<div ').replace('</a>', '</div>').replace('查看明细 ›','') + '<div class="bd-store-card__last">' + (tab === 'proxy' ? '最近进货' : '最近成交') + '：' + esc(last || '—') + '（全部历史）</div></a>';
    }).join('');
    document.getElementById('dcMain').innerHTML =
      '<div class="bd-coverage"><span>当前负责 <strong>' + c.responsible + '</strong> 家门店</span></div>' +
      '<a class="bd-business-entry" href="' + api.href('biz-bd-stores.html',{tab:tab,store:''}) + '"><span><strong>门店业务分析</strong><small>汇总指标 · 经营趋势 · 门店排行</small></span><span>查看 ›</span></a>' +
      block('', '', chips([{id:'retail',name:'零售经营'},{id:'proxy',name:'平台进货'}],tab,'tab') + '<p class="sa-dc-note">' + (tab === 'proxy' ? '本期在平台进货的门店，按商品金额排序。' : '全部负责门店，按零售成交额排序。') + '</p>' + (rows || '<div class="sa-dc-empty">所选周期暂无平台进货记录</div>'));

    paintRanges();
    setCaption(data);
  }

  function renderStores() {
    if (st().store) api.update({ store: '' });
    var s = st();
    var tab = s.tab === 'proxy' ? 'proxy' : 'retail';
    nav('门店业务', api.href('biz-bd-center.html', { store: '' }));
    var data = D().storesView(s.range, customOf(), tab, s.rank);
    var body = tab === 'retail'
      ? K().grid([
          { t: '支付成交额（元）', v: K().moneyFmt(data.retail.paid), f: K().deltaHtml(data.retailDelta.paid, data.compareLabel) },
          { t: '零售佣金（元）', v: K().moneyFmt(D().businessCommission(s.range, customOf(), 'retail').total), f: K().deltaHtml(D().businessCommission(s.range, customOf(), 'retail').delta, data.compareLabel) },
          { t: '支付主订单数（单）', v: K().intFmt(data.retail.orders), f: K().deltaHtml(data.retailDelta.orders, data.compareLabel, { unit: '单' }) },
          { t: '支付人数（人）', v: K().intFmt(data.retail.users), f: K().deltaHtml(data.retailDelta.users, data.compareLabel, { unit: '人' }) },
          { t: '客单价（元）', v: K().moneyFmt(data.retail.aov), f: K().deltaHtml(data.retailDelta.aov, data.compareLabel) },
          { t: '有成交天数（天）', v: K().intFmt(data.retail.days) },
          { t: '本期最近成交日', v: K().textFmt(data.retail.last) }
        ], 3)
      : K().grid([
          { t: '商品支付金额（元）', v: K().moneyFmt(data.proxy.goods), f: K().deltaHtml(data.proxyDelta.goods, data.compareLabel) },
          { t: '代采佣金（元）', v: K().moneyFmt(D().businessCommission(s.range, customOf(), 'proxy').total), f: K().deltaHtml(D().businessCommission(s.range, customOf(), 'proxy').delta, data.compareLabel) },

          { t: '进货支付总额（元）', v: K().moneyFmt(data.proxy.total), f: K().deltaHtml(data.proxyDelta.total, data.compareLabel) },
          { t: '支付主订单数（单）', v: K().intFmt(data.proxy.orders), f: K().deltaHtml(data.proxyDelta.orders, data.compareLabel) },

          { t: '进货天数（天）', v: K().intFmt(data.proxy.days) },
          { t: '平均进货间隔', v: K().intervalFmt(data.proxy.interval) },
          { t: '最近一次进货（全部历史）', v: K().textFmt(data.historyLastPurchase), wide: true }
        ], 3);
    if (s.rank === 'commission') {
      var ranked = data.rank.rows.map(function(r){
        var c = D().businessCommission(s.range, customOf(), tab, r.id);
        return Object.assign({}, r, {value:c.total, delta:c.delta});
      });
      ranked.sort(function(a,b){ if(a.value == null) return b.value == null ? 0 : 1; if(b.value == null) return -1; return b.value-a.value; });
      data.rank = {rows:ranked,key:'commission',label:tab === 'proxy' ? '代采佣金' : '零售佣金',money:true};
    }
    var rankChips = tab === 'retail'
      ? [{ id: 'paid', name: '成交额' }, { id: 'orders', name: '订单数' }, { id: 'users', name: '支付人数' }, { id: 'commission', name: '佣金' }]
      : [{ id: 'goods', name: '商品金额' }, { id: 'total', name: '进货总额' }, { id: 'orders', name: '订单数' }, { id: 'commission', name: '佣金' }];
    document.getElementById('dcMain').innerHTML =
      rangeBlock() +
      mtabs([{ id: 'retail', name: '零售' }, { id: 'proxy', name: '代采' }], tab) +
      '<section class="sa-dc-panel">' + block('', '', '<p class="sa-dc-note">佣金按本期支付订单关联，不含运费。</p>' + body + K().chartBox(tab === 'retail' ? '成交额趋势（元）' : '商品支付金额趋势（元）')) + '</section>' +
      block('门店排行 · ' + data.rank.label, '', chips(rankChips, data.rank.key, 'rank') + rankRows(data.rank, tab));
    paintRanges();
    setCaption(data);
    K().drawChart(data.trend);
  }

  function storeBackHref() {
    try {
      var ret = new URLSearchParams(location.search || '').get('returnTo');
      if (ret === 'stores') return api.href('biz-bd-stores.html', { store: '' });
    } catch (e) { /* ignore */ }
    return api.href('biz-bd-center.html', { store: '' });
  }

  function renderStore() {
    var s = st();
    var tab = s.tab === 'proxy' ? 'proxy' : 'retail';
    var storeId = s.store;
    if (window.StoreAppBizSession && StoreAppBizSession.canonicalizeStoreId) {
      storeId = StoreAppBizSession.canonicalizeStoreId(storeId) || storeId;
      if (storeId !== s.store) api.update({ store: storeId });
    }
    var data = D().storeView(s.range, customOf(), storeId, tab);
    var title = data.name || (data.blocked === 'missing' || data.blocked === 'unknown' ? '无法查看门店' : '门店');
    nav(title, storeBackHref());
    if (data.blocked) {
      var hist = api.href('biz-bd-commission-list.html', {
        scope: 'history',
        store: data.blocked === 'history' ? data.id : '',
        tab: '',
        dim: 'pay'
      });
      var msg =
        data.blocked === 'history'
          ? '这家门店已经不在当前负责范围里，不能再看它的完整经营数据。以前记在本人名下的佣金仍可查看。'
          : data.blocked === 'missing'
            ? '未指定门店，无法查看经营数据。'
            : data.blocked === 'unknown'
              ? '无法识别该门店，或不在可查看范围内。'
              : '这家门店不在本人可看的统计范围里。';
      document.getElementById('dcMain').innerHTML =
        '<section class="sa-dc-block"><p class="sa-dc-note">' +
        msg +
        '</p>' +
        (data.blocked === 'history'
          ? '<a class="sa-dc-link" href="' + hist + '">只看本人历史佣金</a><br>'
          : '') +
        '<a class="sa-dc-link" href="' +
        storeBackHref() +
        '">返回门店列表</a></section>';
      setCaption(data);
      return;
    }
    var body = tab === 'retail'
      ? K().grid([
          { t: '支付成交额（元）', v: K().moneyFmt(data.retail.paid), f: K().deltaHtml(data.retailDelta.paid, data.compareLabel) },
          { t: '支付主订单数（单）', v: K().intFmt(data.retail.orders), f: K().deltaHtml(data.retailDelta.orders, data.compareLabel, { unit: '单' }) },
          { t: '支付人数（人）', v: K().intFmt(data.retail.users), f: K().deltaHtml(data.retailDelta.users, data.compareLabel, { unit: '人' }) },
          { t: '客单价（元）', v: K().moneyFmt(data.retail.aov) },
          { t: '有成交天数（天）', v: K().intFmt(data.retail.days) },
          { t: '本期最近成交日', v: K().textFmt(data.retail.last) },
          { t: '最近一次成交（全部历史）', v: K().textFmt(data.historyLastRetail), wide: true }
        ], 3)
      : K().grid([
          { t: '商品支付金额（元）', v: K().moneyFmt(data.proxy.goods), f: K().deltaHtml(data.proxyDelta.goods, data.compareLabel) },

          { t: '进货支付总额（元）', v: K().moneyFmt(data.proxy.total), f: K().deltaHtml(data.proxyDelta.total, data.compareLabel) },
          { t: '支付主订单数（单）', v: K().intFmt(data.proxy.orders) },

          { t: '进货天数（天）', v: K().intFmt(data.proxy.days) },
          { t: '平均进货间隔', v: K().intervalFmt(data.proxy.interval) },
          { t: '最近一次进货（全部历史）', v: K().textFmt(data.historyLastPurchase), wide: true }
        ], 3);
    document.getElementById('dcMain').innerHTML =
      rangeBlock() +
      mtabs([{ id: 'retail', name: '零售' }, { id: 'proxy', name: '代采' }], tab) +
      '<section class="sa-dc-panel">' + block(tab === 'retail' ? '零售' : '代采', '', storeCommissionHtml(data.id, tab) + body + K().chartBox('趋势（元）')) + '</section>';
    paintRanges();
    setCaption(data);
    K().drawChart(data.trend);
  }

  function renderAnalysis() {
    var s = st();
    var scope = 'all';
    var dim = s.dim === 'settle' ? 'settle' : 'pay';
    nav('佣金分析', api.href('biz-bd-center.html', { store: '' }));
    var data = D().analysis(s.range, customOf(), scope, dim);
    var stores = data.byStore.length
      ? data.byStore.map(function (r) {
          return '<div class="sa-dc-list-row"><div class="sa-dc-list-row__main"><div class="sa-dc-list-row__title">' + esc(r.name) + '</div></div><div class="sa-dc-list-amt">' + K().moneyFmt(r.amount) + '</div></div>';
        }).join('')
      : '<div class="sa-dc-empty">这个范围里还没有可计入的佣金</div>';
    var sources = data.bySource.length
      ? '<div class="sa-dc-split">' + data.bySource.map(function (r) {
          return '<div class="sa-dc-split__cell"><span>' + esc(r.name) + '</span><strong>' + K().moneyFmt(r.amount) + '</strong></div>';
        }).join('') + '</div>'
      : '<div class="sa-dc-empty">暂无来源拆分</div>';
    document.getElementById('dcMain').innerHTML =
      rangeBlock() +
      '<div class="bd-compact-filters bd-compact-filters--two">' +
      selectFilter('dim',dim,[['pay','按支付时间'],['settle','按结算时间']],'时间口径') + '</div>' +
      '<section class="sa-dc-block">' +
      moneyHero(dim === 'settle' ? '佣金合计' : '佣金合计', data.total, data.delta, data.compareLabel) +
      K().grid([
        { t: '待结算佣金（元）', v: K().moneyFmt(data.pending) },
        { t: '已结算佣金（元）', v: K().moneyFmt(data.settled) }
      ], 2) +
      '</section>' +
      '<div class="sa-dc-entry"><a class="sa-dc-entry__btn" href="' + api.href('biz-bd-commission-list.html', {
        scope: scope,
        dim: dim,
        store: '',
        settle: s.settle || 'all',
        source: s.source || 'all',
        range: s.range,
        start: s.range === 'custom' ? s.start : '',
        end: s.range === 'custom' ? s.end : ''
      }) + '">查看佣金明细<span>查看</span></a></div>' +
      block('门店佣金贡献', '', stores) +
      block('佣金来源', '', sources) +
      block('佣金趋势', '', K().chartBox('单位：元'));
    paintRanges();
    setCaption(data);
    K().drawChart(data.trend);
  }

  function selectFilter(key, value, options, label) {
    return '<select aria-label="' + label + '" data-filter="' + key + '">' + options.map(function(o){return '<option value="' + esc(o[0]) + '"' + (o[0] === value ? ' selected' : '') + '>' + esc(o[1]) + '</option>';}).join('') + '</select>';
  }

  function renderComm() {
    document.getElementById('dcHead').innerHTML = head('comm');
    var s = st();
    var scope = 'all';
    var dim = s.dim === 'settle' ? 'settle' : 'pay';
    var data = D().commissionList(s.range, customOf(), scope, dim, s.source, s.settle, s.store);
    var rows = data.rows.length ? data.rows.map(function (r) {
      var open = openId === r.id;
      var when = dim === 'settle' ? (r.settleAt || '—') : r.pay;
      var detail =
        '<div class="sa-dc-list-row__detail">订单 ' + esc(r.id) + '<br>支付 ' + esc(r.pay) +
        '<br>商品 ' + esc(r.goods) +
        '<br>佣金 ' + K().moneyFmt(r.amount) +
        (r.clawback ? '（原佣金 ' + K().moneyFmt(r.gross) + '，退款冲回 ' + K().moneyFmt(r.clawback) + (r.clawbackAt ? '，冲回时间 ' + esc(r.clawbackAt) : '') + '）' : '') +
        '<br>结算状态 ' + esc(r.settle || '—') +
        '<br>结算单创建 ' + esc(r.settleAt || '—') +
        (r.history
          ? '<br>这是历史佣金对账摘要，不能打开该门店的完整成交。'
          : '<br><a class="sa-dc-link" href="' + api.href('biz-bd-store.html', { store: r.storeId, tab: 'retail' }) + '">查看该店当前业务</a>') +
        '</div>';
      return '<button type="button" class="sa-dc-list-row' + (open ? ' is-open' : '') + '" data-row="' + esc(r.id) + '"><div class="sa-dc-list-row__main"><div class="sa-dc-list-row__title">' + esc(r.storeName) + ' · ' + esc(r.id) + '</div><div class="sa-dc-list-row__meta">' + esc(r.source) + ' · ' + esc(r.settle || '—') + ' · ' + esc(when) + '</div></div><div class="sa-dc-list-amt">' + K().moneyFmt(r.amount) + '</div>' + (open ? detail : '') + '</button>';
    }).join('') : '<div class="sa-dc-empty">当前日期及筛选条件下暂无佣金<br><button type="button" data-reset-commission>查看近30天全部佣金</button></div>';
    document.getElementById('dcMain').innerHTML =
      '' +
      '<div class="bd-compact-filters">' +
      selectFilter('dim',dim,[['pay','按支付时间'],['settle','按结算时间']],'时间口径') +
      selectFilter('source',s.source || 'all',[['all','全部来源'],['零售','零售合计'],['商城','商城'],['直播','直播'],['代采','代采']],'佣金来源') +
      selectFilter('settle',s.settle || 'all',[['all','全部状态'],['待结算','待结算'],['结算中','结算中'],['已结算','已结算'],['结算失败','结算失败'],['已取消','已取消']],'结算状态') + '</div>' +
      '<section class="sa-dc-block">' + K().grid([
        { t: '合计（元）', v: K().moneyFmt(data.total) },
        { t: '待结算（元）', v: K().moneyFmt(data.pending) },
        { t: '已结算（元）', v: K().moneyFmt(data.settled) }
      ], 3) + '</section>' +
      '<section class="sa-dc-block">' + rows + '</section>';
    paintRanges();
    setCaption(data);
  }

  function render() {
    if (page === 'overview') {
      var route=new URL(location.href);route.searchParams.set('group',dcGroup);route.searchParams.set('section',dcSection);history.replaceState(null,'',route.pathname+route.search);
      if (dcGroup === 'commission') {
        dcSection = 'analysis';
        renderAnalysis();
      } else if(dcSection === 'business') renderStores();
      else { api.update({tab:dcSection === 'proxy' ? 'proxy' : 'retail'}); renderOverview(); }
      var headEl=document.getElementById('dcHead');
      headEl.innerHTML='<div class="sa-dc-head__row"><a class="sa-dc-head__back" href="' + WORKBENCH + '" aria-label="返回工作台">' + BACK_SVG + '</a><h1 class="bd-page-title">数据中心</h1><button class="sa-dc-tip-btn" data-tip aria-label="指标说明">' + HELP_SVG + '</button></div>';
      var main=document.getElementById('dcMain');
      var oldRange=main.querySelector('#dcRanges');
      if(!oldRange) main.insertAdjacentHTML('afterbegin',rangeBlock());
      if (dcGroup === 'stores') {
        var items=[['business','业务分析'],['retail','零售经营'],['proxy','平台进货']];
        main.insertAdjacentHTML('afterbegin','<div class="bd-section-tabs">'+items.map(function(x){return '<button data-section="'+x[0]+'" class="'+(dcSection===x[0]?'is-active':'')+'">'+x[1]+'</button>';}).join('')+'</div>');
      }
      headEl.insertAdjacentHTML('beforeend','<div class="bd-group-tabs"><button data-group="stores" class="'+(dcGroup==='stores'?'is-active':'')+'">门店数据</button><button data-group="commission" class="'+(dcGroup==='commission'?'is-active':'')+'">佣金数据</button></div>');
      if(dcGroup==='stores' && dcSection!=='business') {
        main.querySelectorAll('.bd-business-entry,.sa-dc-entry,.bd-coverage a').forEach(function(el){el.remove();});
        var tabs=main.querySelector('.sa-dc-chip'); if(tabs) tabs.remove();
      }
      paintRanges();
      var info=D().overview(st().range,customOf()); setCaption(info);
    }
    else if (page === 'stores') renderStores();
    else if (page === 'store') renderStore();
    else if (page === 'analysis') renderAnalysis();
    else { renderComm(); var header=document.getElementById('dcHead'); var main=document.getElementById('dcMain'); ['dcRanges','dcPeriod','dcAsOf'].reverse().forEach(function(id){var el=document.getElementById(id);if(el) main.insertBefore(el, main.firstChild);}); }
  }

  function tipText() {
    var t = D().tips;
    if (page === 'stores' || page === 'store' || (page === 'overview' && dcGroup === 'stores')) return t.retail + '\n\n' + t.proxy;
    if (page === 'analysis' || page === 'comm' || (page === 'overview' && dcGroup === 'commission')) return t.commission;
    return t.overview + '\n\n' + t.commission;
  }
  function openCustom() {
    var s = st();
    var sheet = document.getElementById('dcRangeSheet');
    document.getElementById('dcCustomStart').value = s.start || K().DEMO_TODAY;
    document.getElementById('dcCustomEnd').value = s.end || K().DEMO_TODAY;
    document.getElementById('dcCustomStart').max = K().DEMO_TODAY;
    document.getElementById('dcCustomEnd').max = K().DEMO_TODAY;
    document.getElementById('dcCustomErr').hidden = true;
    sheet.hidden = false;
  }

  function bind() {
    document.getElementById('dcRoot').addEventListener('change', function(e){
      var key=e.target.getAttribute('data-filter');
      if(!key) return;
      var patch={}; patch[key]=e.target.value;
      api.update(patch); render();
    });

    document.getElementById('dcRoot').addEventListener('click', function (e) {
      if (e.target.closest('[data-reset-commission]')) { api.update({range:'30d',settle:'all',source:'all',store:''}); render(); return; }
      var group=e.target.closest('[data-group]');
      if(group){dcGroup=group.getAttribute('data-group');dcSection=dcGroup==='stores'?'business':'analysis';render();return;}
      var section=e.target.closest('[data-section]');
      if(section){dcSection=section.getAttribute('data-section');render();return;}
      var range = e.target.closest('[data-range]');
      if (range) {
        var id = range.getAttribute('data-range');
        if (id === 'custom') openCustom();
        else api.update({ range: id });
        render();
        return;
      }
      var tab = e.target.closest('[data-tab]');
      if (tab) {
        api.update({ tab: tab.getAttribute('data-tab') });
        render();
        return;
      }
      var scope = e.target.closest('[data-scope]');
      if (scope) {
        api.update({ scope: scope.getAttribute('data-scope'), store: '', settle: 'all', source: 'all', range: scope.getAttribute('data-scope') === 'history' ? '30d' : st().range });
        render();
        return;
      }
      var dim = e.target.closest('[data-dim]');
      if (dim) {
        api.update({ dim: dim.getAttribute('data-dim') });
        render();
        return;
      }
      var rank = e.target.closest('[data-rank]');
      if (rank) {
        api.update({ rank: rank.getAttribute('data-rank') });
        render();
        return;
      }
      var source = e.target.closest('[data-source]');
      if (source) {
        api.update({ source: source.getAttribute('data-source') });
        render();
        return;
      }
      var settle = e.target.closest('[data-settle]');
      if (settle) {
        api.update({ settle: settle.getAttribute('data-settle') });
        render();
        return;
      }
      var row = e.target.closest('[data-row]');
      if (row && !e.target.closest('a')) {
        var id = row.getAttribute('data-row');
        openId = openId === id ? '' : id;
        render();
        return;
      }
      if (e.target.closest('[data-tip]')) {
        document.getElementById('dcSheetTitle').textContent = '指标说明';
        document.getElementById('dcSheetBody').textContent = tipText() + '\n\n' + D().tips.note;
        document.getElementById('dcSheet').hidden = false;
        return;
      }
      if (e.target.closest('[data-close-sheet]') || e.target.id === 'dcSheet') document.getElementById('dcSheet').hidden = true;
      if (e.target.closest('[data-close-range]') || e.target.id === 'dcRangeSheet') document.getElementById('dcRangeSheet').hidden = true;
    });
    document.getElementById('dcCustomApply').addEventListener('click', function () {
      var a = document.getElementById('dcCustomStart').value;
      var b = document.getElementById('dcCustomEnd').value;
      var err = document.getElementById('dcCustomErr');
      if (!a || !b || a > b) {
        err.hidden = false;
        err.textContent = '请选择有效的开始和结束日期';
        return;
      }
      api.update({ range: 'custom', start: a, end: b });
      document.getElementById('dcRangeSheet').hidden = true;
      render();
    });
  }

  function sheets() {
    return '<div class="sa-rpt-sheet" id="dcSheet" hidden><div class="sa-rpt-sheet__panel" role="dialog"><div class="sa-rpt-sheet__hd"><strong id="dcSheetTitle">指标说明</strong><button type="button" class="sa-rpt-sheet__close" data-close-sheet aria-label="关闭">×</button></div><div id="dcSheetBody" class="sa-rpt-sheet__body"></div></div></div>' +
      '<div class="sa-rpt-sheet sa-rpt-sheet--time" id="dcRangeSheet" hidden><div class="sa-rpt-sheet__panel" role="dialog"><div class="sa-rpt-sheet__hd"><strong>自定义日期</strong><button type="button" class="sa-rpt-sheet__close" data-close-range aria-label="关闭">×</button></div><div class="sa-rpt-custom"><div class="sa-rpt-custom__row"><label class="sa-rpt-custom__field"><span>开始</span><input type="date" id="dcCustomStart"></label><span class="sa-rpt-custom__sep">至</span><label class="sa-rpt-custom__field"><span>结束</span><input type="date" id="dcCustomEnd"></label></div><p class="sa-rpt-custom__err" id="dcCustomErr" hidden></p><button type="button" class="sa-rpt-custom__btn" id="dcCustomApply">确定</button></div></div></div>';
  }

  function boot() {
    api = K().createState('sa_bd_dc_v1');
    var defaults = { range: 'today', tab: 'retail', scope: 'current', rank: page === 'stores' ? 'paid' : '' };
    if (page === 'comm' || page === 'analysis') defaults.tab = '';
    api.load(defaults);
    var root = document.getElementById('dcRoot');
    var top = page === 'overview' || page === 'comm';
    root.innerHTML = (top ? '<div class="sa-dc-head" id="dcHead"></div>' : '<header class="sa-rpt-nav" id="dcNav"></header>') + '<div class="sa-rpt-scroll" id="dcMain"></div>' + sheets();
    bind();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
