(function () {
  var Center = window.MdmDataBizCenter;
  var CUi = window.MdmDataBizCenterUi;
  var Biz = window.MdmDataBiz;
  if (!Center || !CUi || !Biz) return;

  var root = document.querySelector('[data-ldb-root]');
  var initial = CUi.readState({ period: '30d', channel: 'all' });
  var channels = { all: '全部', mall: '商城', live: '直播' };
  var state = { period: initial.period, from: initial.from, to: initial.to,
    channel: Object.hasOwn(channels, initial.channel) ? initial.channel : 'all' };
  var toolbar = root.querySelector('[data-ldb-toolbar]');
  var body = root.querySelector('[data-ldb-table]');
  var cutoff = new Date(Center.AS_OF);
  var pointsPager = { page: 1, pageSize: 10 };
  var configPager = { page: 1, pageSize: 10 };
  var options = { showStore: false, showLine: false, showChannel: true, exportName: '营销活动' };
  var types = { coupon: '优惠券', cash: '现金红包', points: '积分', goods: '商品' };

  // 示例配置及对应权益流水。每条流水代表一份权益，用户可跨来源重复。
  var configs = [
    { name: '直播满减发券', type: '优惠券', source: '直播场次', relation: '周末生鲜专场', reward: 'coupon', item: '满 50 减 5', amount: 500, channel: 'live' },
    { name: '周末福袋', type: '福袋', source: '直播场次', relation: '周末生鲜专场', reward: 'coupon', item: '无门槛 3 元券', amount: 300, channel: 'live' },
    { name: '周末福袋', type: '福袋', source: '直播场次', relation: '周末生鲜专场', reward: 'points', item: '每份 100 积分', quantity: 100, channel: 'live' },
    { name: '连续签到', type: '签到', source: '直播场次', relation: '早间会员专场', reward: 'points', item: '第 1 次签到送 5 积分', quantity: 5, channel: 'live' },
    { name: '连续签到', type: '签到', source: '直播场次', relation: '早间会员专场', reward: 'coupon', item: '第 3 次签到送无门槛 3 元券', amount: 300, channel: 'live' },
    { name: '观看时长奖励', type: '观看任务', source: '直播场次', relation: '早间会员专场', reward: 'goods', item: '观看满 15 分钟赠试吃装', amount: 1250, channel: 'live' },
    { name: '观看时长奖励', type: '观看任务', source: '直播场次', relation: '早间会员专场', reward: 'cash', item: '观看满 30 分钟赠 2 元红包', amount: 200, channel: 'live' },
    { name: '黄金会员赠券', type: '会员等级', source: '会员等级', relation: '黄金 · 累计赠送', reward: 'coupon', item: '满 100 减 10', amount: 1000, channel: '' },
    { name: '商城推广红包', type: '现金红包', source: '红包活动', relation: '商城推广', reward: 'cash', item: '每份 4 元红包', amount: 400, channel: 'mall' },
    { name: '会员手工发券', type: '优惠券', source: '手动发放', reward: 'coupon', item: '无门槛 5 元券', amount: 500, channel: '' },
    { name: '手动发放红包', type: '现金红包', source: '手动发放', reward: 'cash', item: '每份 2 元红包', amount: 200, channel: '' },
    { name: '周三晚场福袋', type: '福袋', source: '直播场次', relation: '周三晚间场', reward: 'goods', item: '生鲜试吃装 1 份', amount: 1250, channel: 'live' },
    { name: '晚场观看任务', type: '观看任务', source: '直播场次', relation: '周三晚间场', reward: 'coupon', item: '观看满 20 分钟赠满 50 减 5', amount: 500, channel: 'live' },
    { name: '会员签到奖励', type: '签到', source: '直播场次', relation: '周一会员专场', reward: 'cash', item: '签到赠 2 元红包', amount: 200, channel: 'live' },
    { name: '白银会员月度券', type: '会员等级', source: '会员等级', relation: '白银 · 每月赠送', reward: 'coupon', item: '满 50 减 5', amount: 500, channel: '' }
  ];
  var day = 86400000;
  var ledger = configs.flatMap(function (config, index) {
    return Array.from({ length: 26 + index * 3 }, function (_, order) {
      var plan = cutoff.getTime() - (order % 18) * day - (7 + index % 4) * 3600000;
      var issue = order % 7 ? plan + 3600000 : null;
      var requiresClaim = config.reward === 'coupon' || config.reward === 'cash';
      var claim = requiresClaim && issue && order % 5 ? issue + (2 + order % 4) * 3600000 : null;
      var redeem = config.reward === 'coupon' && claim && order % 3 ? claim + (order % 4) * day + 3600000 : null;
      return {
        config: config, userId: 'U' + (order * 7 + index * 13) % 94,
        id: 'MK-' + (index + 1) + '-' + String(order + 1).padStart(3, '0'),
        plan: plan, issue: issue, claim: claim, redeem: redeem,
        redeemChannel: order % 2 ? 'live' : 'mall',
        discountCents: redeem ? config.amount - (order % 4 === 0 ? 100 : 0) : 0,
        // 红包以领取到账为支出，商品以实际发放时的采购成本为支出。
        used: config.reward === 'coupon' ? redeem : config.reward === 'cash' ? claim : config.reward === 'goods' ? issue : null
      };
    });
  });

  function snapshot() {
    var range = Biz.resolvePeriod(state.period, state.from, state.to, cutoff);
    function inScope(time, channel) {
      return time && time >= range.start.getTime() && time < range.end.getTime() &&
        time <= cutoff.getTime() && (state.channel === 'all' || state.channel === channel) ? time : null;
    }
    return ledger.map(function (row) {
      var channel = row.config.channel;
      return Object.assign({}, row, {
        status: row.redeem && row.redeem <= cutoff ? '已核销' :
          row.claim && row.claim <= cutoff ? (row.config.reward === 'cash' ? '已到账' : '已领取') :
          ['coupon', 'cash'].includes(row.config.reward) ? '待领取' : '已发放',
        plan: inScope(row.plan, channel),
        issue: inScope(row.issue, channel),
        claim: inScope(row.claim, channel),
        redeem: inScope(row.redeem, row.redeemChannel),
        used: inScope(row.used, row.config.reward === 'coupon' ? row.redeemChannel : channel)
      });
    }).filter(function (row) { return row.plan || row.issue || row.claim || row.redeem || row.used; });
  }

  function summarize(rows, pointDetails) {
    var totals = { planAmount: null, issueAmount: null, claimAmount: null,
      redeemAmount: null, usedAmount: null, points: null, goods: null };
    var users = new Set();
    rows.forEach(function (row) {
      var config = row.config;
      var monetary = config.reward === 'coupon' || config.reward === 'cash';
      ['plan', 'issue', 'claim', 'redeem'].forEach(function (stage) {
        if (!row[stage]) return;
        if (monetary) totals[stage + 'Amount'] += stage === 'redeem' ? row.discountCents : config.amount;
      });
      if (row.used) totals.usedAmount += config.reward === 'coupon' ? row.discountCents : config.amount;
      if (row.issue && config.reward === 'points') totals.points += config.quantity;
      if (row.issue && config.reward === 'goods') totals.goods += 1;
      if (row.issue || row.claim || row.redeem || row.used) users.add(row.userId);
    });
    (pointDetails || []).forEach(function (row) {
      if (row.points > 0) totals.points += row.points;
      if (row.deductionCents != null) totals.usedAmount += row.deductionCents;
      users.add(row.user);
    });
    totals.users = users.size;
    return totals;
  }

  var metrics = [
    { key: 'plan', label: '计划发放金额', hint: '优惠券面额＋红包计划金额' },
    { key: 'issue', label: '成功发放金额', hint: '已发优惠券面额＋已发红包金额' },
    { key: 'claim', label: '实际领取金额', hint: '已领取券面额＋红包实际到账' },
    { key: 'redeem', label: '优惠券核销金额', hint: '订单实际用券抵扣金额' },
    { key: 'used', label: '实际使用金额', hint: '用券抵扣＋红包到账＋实发商品采购成本＋积分抵现' }
  ];

  function usageColumns() {
    return metrics.map(function (metric) {
      return { label: metric.label, num: true, render: function (row) {
        return moneyCell(row[metric.key + 'Amount']);
      } };
    }).concat([
      { key: 'users', label: '涉及用户数', num: true, render: function (row) { return row.users ? CUi.intText(row.users) : '-'; } },
      { key: 'points', label: '实发积分', num: true, render: countCell },
      { key: 'goods', label: '实发商品份数', num: true, render: countCell }
    ]);
  }

  function countCell(row, value) {
    return value == null ? '-' : CUi.intText(value);
  }

  function moneyCell(cents) {
    return cents == null ? '-' : CUi.money(cents / 100);
  }

  var dateFormat = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });

  function timeColumn(key, label) {
    return { label: label, render: function (row) { return row[key] ? dateFormat.format(row[key]) : '-'; } };
  }

  function detailColumns(reward) {
    var columns = [
      { key: 'id', label: '记录ID' }, { key: 'userId', label: '用户ID' },
      { key: 'name', label: '营销配置' }, { key: 'relation', label: '关联对象' },
      { key: 'item', label: { coupon: '优惠券名称／规则', cash: '红包规则' }[reward] || '奖励规则' },
      { key: 'status', label: '状态' }, timeColumn('issue', '发放时间')
    ];
    if (reward === 'coupon' || reward === 'cash') {
      columns.push({ key: 'scene', label: reward === 'coupon' ? '领券场景' : '场景' },
        { key: 'activityId', label: '活动ID' });
      columns.push({ label: reward === 'coupon' ? '券面额' : '发放金额', num: true,
        render: function (row) { return moneyCell(row.amount); } },
        timeColumn('claim', reward === 'cash' ? '领取到账时间' : '领取时间'));
    }
    if (reward === 'coupon') {
      columns.splice(2, 0, { key: 'nickname', label: '用户昵称' },
        { label: '手机号', render: function (row) { return row.phone.slice(0, 3) + '****' + row.phone.slice(-4); } });
      columns.push(timeColumn('redeem', '核销时间'),
        { key: 'orderId', label: '核销关联订单', render: function (row) { return row.orderId || '-'; } },
        { key: 'orderChannel', label: '核销渠道', render: function (row) { return row.orderChannel || '-'; } },
        { label: '实际抵扣', num: true, render: function (row) { return moneyCell(row.redeem ? row.discountCents : null); } });
    }
    if (reward === 'cash') {
      columns.push({ label: '领取端口', render: function (row) { return row.endpoint || '-'; } },
        { label: '微信回执单号', render: function (row) { return row.receipt || '-'; } });
    }
    if (reward === 'points' || reward === 'goods') {
      columns.push(reward === 'points' ? { key: 'quantity', label: '实发积分', num: true, render: countCell } :
        { label: '发放时采购成本', num: true, render: function (row) { return moneyCell(row.amount); } });
    }
    return columns;
  }

  var couponScenes = ['直播发券', '福袋送券', '签到送券', '观看任务送券', '商城推荐位', '会员等级送券', '会员手工发券'];
  var cashScenes = ['直播中控', '福袋', '签到', '观看任务', '手动发放', '注册有礼'];

  function detailRow(row) {
    var config = row.config;
    var userNumber = row.userId.slice(1);
    var coupon = config.reward === 'coupon';
    var manual = config.source === '手动发放';
    var status = { 已核销: '已使用', 已领取: '未使用', 已到账: '领取成功' }[row.status] || row.status;
    var scene = manual ? (coupon ? '会员手工发券' : '手动发放') :
      coupon ? ({ 福袋: '福袋送券', 签到: '签到送券', 观看任务: '观看任务送券',
      会员等级: '会员等级送券' }[config.type] || '直播发券') :
      (cashScenes.includes(config.type) ? config.type : '');
    return Object.assign({}, config, row, {
      status: status,
      scene: scene,
      nickname: '示例用户' + userNumber,
      phone: '0000000' + String(7000 + Number(userNumber)),
      activityId: manual ? null : 'ACT-' + (configs.findIndex(function (entry) { return entry.name === config.name; }) + 1),
      endpoint: config.reward === 'cash' && row.claim ? (Number(userNumber) % 2 ? 'APP' : '小程序') : '',
      receipt: config.reward === 'cash' && row.claim ? 'WX-' + row.id : '',
      orderId: row.redeem ? 'ORD-' + row.id : null,
      orderChannel: row.redeem ? channels[row.redeemChannel] : null
    });
  }

  function filterField(label, name, control) {
    var id = 'ldb-ledger-' + name;
    return '<div class="ldb-field"><label for="' + id + '">' + label + '</label>' +
      control.replace('<input', '<input id="' + id + '" name="' + name + '"')
        .replace('<select', '<select id="' + id + '" name="' + name + '"') + '</div>';
  }

  function filterInput(label, name, type) {
    return filterField(label, name, '<input class="ldb-input" type="' + (type || 'search') + '"' +
      (type === 'number' ? ' min="0" step="0.01"' : '') + '>');
  }

  function filterSelect(label, name, choices) {
    return filterField(label, name, '<select class="ldb-select"><option value="">全部</option>' +
      choices.map(function (value) {
        return '<option value="' + CUi.esc(value) + '">' + CUi.esc(value) + '</option>';
      }).join('') + '</select>');
  }

  function detailFilters(reward, rows) {
    if (reward === 'coupon') {
      return filterInput('用户ID', 'userId') + filterInput('用户昵称', 'nickname') + filterInput('手机号', 'phone') +
        filterSelect('领券场景', 'scene', couponScenes) + filterSelect('状态', 'status', ['未使用', '已使用', '已过期']);
    }
    if (reward === 'cash') {
      return filterInput('ID', 'userId') +
        filterSelect('发放活动', 'name', Array.from(new Set(rows.filter(function (row) {
          return row.activityId;
        }).map(function (row) { return row.name; })))) +
        filterInput('活动ID', 'activityId') + filterSelect('场景', 'scene', cashScenes) +
        '<details><summary>更多筛选</summary><div class="ldb-toolbar">' +
        filterInput('发放起始日期', 'from', 'date') + filterInput('发放结束日期', 'to', 'date') +
        filterInput('最小发放金额', 'min', 'number') + filterInput('最大发放金额', 'max', 'number') +
        filterSelect('领取端口', 'endpoint', ['APP', '小程序']) +
        filterInput('流水号', 'id') + filterInput('微信回执单号', 'receipt') +
        filterSelect('状态', 'status', ['待领取', '领取中', '领取成功', '发放失败', '已失效', '已撤销']) +
        '</div></details>';
    }
    return filterInput('用户ID', 'userId');
  }

  function matchesDetail(row, filters) {
    return Object.keys(filters).every(function (key) {
      var value = filters[key];
      if (!value) return true;
      if (key === 'from' || key === 'to') {
        var boundary = Date.parse(value + 'T00:00:00+08:00');
        return row.issue && (key === 'from' ? row.issue >= boundary : row.issue < boundary + day);
      }
      if (key === 'min' || key === 'max') {
        var amount = Math.round(Number(value) * 100);
        return row.issue && (key === 'min' ? row.amount >= amount : row.amount <= amount);
      }
      if (key === 'nickname') return row.nickname.includes(value);
      return row[key] === value;
    });
  }

  function bindDetail(rows, activeConfigs) {
    body.querySelectorAll('[data-marketing-detail]').forEach(function (button) {
      button.addEventListener('click', function () {
        var initialName = button.getAttribute('data-marketing-detail');
        var rewards = new Set(activeConfigs.filter(function (config) { return config.name === initialName; })
          .map(function (config) { return config.reward; }));
        var available = Object.keys(types).filter(function (key) { return rewards.has(key); });
        var reward = available[0];
        var scope = rows.filter(function (row) {
          return row.config.name === initialName && (row.issue || row.claim || row.redeem || row.used);
        }).sort(function (a, b) {
          return Math.max(b.issue, b.claim, b.redeem, b.used) - Math.max(a.issue, a.claim, a.redeem, a.used);
        }).map(detailRow);
        CUi.showDrawer('营销权益流水明细',
          '<div data-marketing-detail-panel><p class="ldb-tip">' + CUi.esc(initialName) + ' · ' +
          CUi.esc(CUi.periodLabel(state)) + ' · ' + channels[state.channel] + '</p>' +
          (available.length > 1 ? '<div class="ldb-chips" aria-label="流水类型">' + available.map(function (key) {
            return '<button class="ldb-chip" type="button" data-ledger-type="' + key + '">' + types[key] + '</button>';
          }).join('') + '</div>' : '') +
          '<form data-ledger-filters></form>' +
          '<div data-marketing-detail-rows></div></div>');
        var panel = document.querySelector('[data-marketing-detail-panel]');
        var form = panel.querySelector('[data-ledger-filters]');
        var results = panel.querySelector('[data-marketing-detail-rows]');
        var pager = { page: 1, pageSize: 10 };
        var filters = {};
        var rewardRows;
        function renderDetail() {
          var details = rewardRows.filter(function (row) { return matchesDetail(row, filters); });
          results.innerHTML = CUi.renderPagedTable(detailColumns(reward), details, pager, {
            unitLabel: '笔', emptyText: '当前筛选范围内暂无发放、领取或核销流水'
          });
          CUi.bindPagedTable(results, pager, renderDetail);
        }
        function applyFilters(next) {
          filters = next;
          pager.page = 1;
          renderDetail();
        }
        var buttons = panel.querySelectorAll('[data-ledger-type]');
        function changeReward(key) {
          reward = key;
          buttons.forEach(function (item) {
            var selected = item.dataset.ledgerType === key;
            item.classList.toggle('is-active', selected);
            item.setAttribute('aria-pressed', String(selected));
          });
          rewardRows = scope.filter(function (row) { return row.config.reward === key; });
          form.innerHTML = '<div class="ldb-toolbar">' + detailFilters(key, rewardRows) +
            '<button type="submit" class="btn btn-primary">查询</button>' +
            '<button type="reset" class="btn btn-secondary">重置</button></div>';
          applyFilters({});
        }
        form.addEventListener('submit', function (event) {
          event.preventDefault();
          applyFilters(Object.fromEntries(Array.from(new FormData(form), function (entry) {
            return [entry[0], entry[1].trim()];
          })));
        });
        form.addEventListener('reset', function () { applyFilters({}); });
        buttons.forEach(function (item) {
          item.addEventListener('click', function () { changeReward(item.dataset.ledgerType); });
        });
        changeReward(reward);
      });
    });
  }

  function renderPoints(data, marketingRows) {
    var host = body.querySelector('#marketing-points');
    var awards = marketingRows.filter(function (row) { return row.issue && row.config.reward === 'points'; })
      .map(function (row) {
        return { time: dateFormat.format(row.issue), user: row.userId, type: '发放',
          scene: row.config.name, channel: row.config.channel, points: row.config.quantity };
      });
    var details = data.details.concat(awards).sort(function (a, b) { return b.time.localeCompare(a.time); });
    var issued = data.issued + awards.reduce(function (total, row) { return total + row.points; }, 0);
    var exchangePoints = data.exchangeConsumed != null
      ? data.exchangeConsumed
      : data.details.reduce(function (total, row) {
          return total + ((row.type === '商品兑换' || row.scene === '积分商城兑换') ? Math.max(0, -row.points) : 0);
        }, 0);
    var cashPoints = 0;
    var deductionCents = 0;
    data.details.forEach(function (row) {
      var isExchange = row.type === '商品兑换' || row.scene === '积分商城兑换';
      var isCash =
        row.type === '下单抵扣' ||
        row.scene === '订单积分抵现' ||
        row.scene === '积分抵现' ||
        row.deductionCents != null;
      if (isCash && !isExchange) cashPoints += Math.abs(row.points);
      if (row.deductionCents != null) deductionCents += row.deductionCents;
    });
    if (data.cashConsumed != null) cashPoints = data.cashConsumed;
    var columns = [
      { key: 'time', label: '时间' }, { key: 'user', label: '用户' },
      {
        key: 'type',
        label: '类型',
        render: function (row) {
          if (row.type === '商品兑换' || row.scene === '积分商城兑换') return '商品兑换';
          if (
            row.type === '下单抵扣' ||
            row.scene === '订单积分抵现' ||
            row.scene === '积分抵现' ||
            row.deductionCents != null
          ) {
            return '下单抵扣';
          }
          return CUi.esc(row.type || '—');
        }
      },
      { key: 'scene', label: '场景' },
      { label: '渠道', render: function (row) { return channels[row.channel] || '-'; } },
      { key: 'points', label: '积分变动', num: true, render: function (row) {
        return (row.points > 0 ? '+' : '') + CUi.intText(row.points);
      } },
      { label: '抵现比例', render: function (row) {
        return row.rateCents == null ? '-' : '1 积分抵 ' + moneyCell(row.rateCents);
      } },
      { label: '订单抵扣比例上限', num: true, render: function (row) {
        return row.maxRatio == null ? '-' : CUi.intText(row.maxRatio) + '%';
      } },
      { label: '实际抵现金额', num: true, render: function (row) { return moneyCell(row.deductionCents); } },
      { key: 'balanceAfter', label: '变动后积分余额', num: true, render: countCell }
    ];
    var cards = [
      CUi.kpiCard('发放积分', CUi.intText(issued), '', '筛选期内发放成功'),
      CUi.kpiCard(
        '商品兑换消耗',
        CUi.intText(exchangePoints),
        '',
        '积分商城兑换商品消耗的积分'
      ),
      CUi.kpiCard(
        '下单抵扣消耗',
        CUi.intText(cashPoints),
        '',
        '下单积分抵现消耗的积分'
      ),
      CUi.kpiCard('实际积分抵现金额', moneyCell(deductionCents), '', '按订单记录的实际抵现金额汇总'),
      CUi.kpiCard('平台当前积分余额', CUi.intText(data.balance), '', '全平台会员积分余额快照'),
      CUi.kpiCard(
        '消耗合计',
        CUi.intText(data.consumed),
        '',
        '商品兑换 ' + CUi.intText(exchangePoints) + ' · 下单抵扣 ' + CUi.intText(cashPoints)
      )
    ].join('');
    function renderDetails() {
      host.innerHTML = CUi.sectionCard(
        '会员营销 · 积分使用情况',
        '<p class="ldb-tip ldb-tip--flush">消耗按场景拆分：<strong>商品兑换</strong>（积分商城）与<strong>下单抵扣</strong>（订单积分抵现），二者口径分开统计。</p>' +
          '<div class="ldb-kpi-row ldb-kpi-row--6">' +
          cards +
          '</div>' +
          CUi.renderPagedTable(columns, details, pointsPager, {
            unitLabel: '条',
            emptyText: '当前筛选范围内暂无积分流水'
          })
      );
      CUi.bindPagedTable(host, pointsPager, renderDetails);
    }
    renderDetails();
  }

  function render() {
    CUi.writeState(state);
    CUi.renderToolbar(toolbar, state, options);
    CUi.bindToolbar(toolbar, state, function () {
      pointsPager.page = 1;
      configPager.page = 1;
      render();
    }, options);
    toolbar.querySelector('[data-ldb-meta]').textContent = CUi.periodLabel(state) + ' · ' + channels[state.channel];
    var rows = snapshot();
    var points = Center.pointsSnapshot(state);
    var total = summarize(rows, points.details);
    var activeConfigs = Array.from(new Set(rows.map(function (row) { return row.config; })));
    var rewards = Object.keys(types).map(function (key) {
      return Object.assign({ rewardName: types[key], rewardType: key }, summarize(rows.filter(function (row) {
        return row.config.reward === key;
      }), key === 'points' ? points.details : null));
    });
    var sourceRows = Array.from(new Set(activeConfigs.map(function (config) { return config.name; }))).map(function (name) {
      var matched = activeConfigs.filter(function (config) { return config.name === name; });
      return Object.assign({}, matched[0], summarize(rows.filter(function (row) { return row.config.name === name; })), {
        rewards: Array.from(new Set(matched.map(function (config) { return types[config.reward]; }))).join('、')
      });
    });

    body.innerHTML = '<div class="ldb-kpi-row">' + metrics.map(function (metric) {
      return CUi.kpiCard(metric.label, CUi.money(total[metric.key + 'Amount'] / 100), '', metric.hint);
    }).join('') + CUi.kpiCard('涉及用户数', CUi.intText(total.users), '', '按发放、领取或使用记录的用户去重') + '</div>' +
      CUi.sectionCard('平台优惠 · 按奖励类型', CUi.simpleTable([
        { key: 'rewardName', label: '奖励类型', render: function (row) {
          return row.rewardType === 'points' ? '<a class="ldb-link-all" href="#marketing-points" aria-label="查看会员营销积分使用情况">积分</a>' : CUi.esc(row.rewardName);
        } }
      ].concat(usageColumns()), rewards)) +
      '<div data-ldb-config-table>' + CUi.sectionCard('营销配置使用情况', CUi.renderPagedTable([
        { key: 'name', label: '营销配置' }, { key: 'type', label: '类型' },
        { key: 'source', label: '发放来源' }, { key: 'relation', label: '关联对象' }, { key: 'rewards', label: '奖励' }
      ].concat(usageColumns(), [{ label: '操作', render: function (row) {
        return '<button type="button" class="ldb-link-all" data-marketing-detail="' + CUi.esc(row.name) + '">查看明细</button>';
      } }]), sourceRows, configPager, { unitLabel: '条', emptyText: '当前筛选范围内暂无营销记录' })) + '</div>' +
      '<div id="marketing-points"></div>';
    CUi.bindPagedTable(body.querySelector('[data-ldb-config-table]'), configPager, render);
    bindDetail(rows, activeConfigs);
    renderPoints(points, rows);
  }

  root.querySelector('[data-ldb-tip]').innerHTML = '<p class="ldb-tip">计划、发放、领取和核销分别按各自发生时间统计。' +
    '发放与领取按对应渠道统计，无渠道的流水计入「全部」。优惠券核销按订单渠道归属。</p>';
  render();
  if (window.location.hash === '#marketing-points') body.querySelector('#marketing-points').scrollIntoView();
})();
