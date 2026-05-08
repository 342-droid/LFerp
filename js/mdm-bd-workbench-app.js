/**
 * BD 工作台：首页 / AI / 收益 / 团队 / 报表 / 活动 / 指南 / 客服 — 单页 hash 切换
 */
(function () {
  var notifications = [
    { id: 1, text: '您的商户"茶百道-人民路店"已通过审核', time: '10:30' },
    { id: 2, text: '本月团队业绩已超额完成，请查看详情', time: '09:15' },
  ];
  var marketingMaterials = [
    { id: 1, title: '新商户入驻推广海报', desc: '适用于地推和线上分享', tag: '热门', uses: '2.3k' },
    { id: 2, title: '商户收益对比图', desc: '展示合作前后收益变化', tag: '推荐', uses: '1.8k' },
  ];
  var workbenchItems = [
    { label: '门店管理', emoji: '🗺', cls: 'wb1', hash: 'stores' },
    { label: '协议管理', emoji: '📝', cls: 'wb2', hash: 'stores-agreements' },
    { label: '商户进件', emoji: '🏪', cls: 'wb3', hash: 'merchants' },
    { label: '收益明细', emoji: '💳', cls: 'wb4', hash: 'revenue' },
    { label: '团队管理', emoji: '👥', cls: 'wb5', hash: 'team' },
    { label: '数据报表', emoji: '📊', cls: 'wb6', hash: 'reports' },
    { label: '活动管理', emoji: '🎁', cls: 'wb7', hash: 'activities' },
    { label: '操作指南', emoji: '📖', cls: 'wb8', hash: 'guide' },
    { label: '联系客服', emoji: '🎧', cls: 'wb9', hash: 'support' },
  ];
  var activities = [
    { id: 1, name: '春季满减活动', startTime: '2024-03-01', endTime: '2024-03-31', merchants: 80, status: 'active', rules: '满30减5，满50减10' },
    { id: 2, name: '新商户入驻奖励', startTime: '2024-04-01', endTime: '2024-04-30', merchants: 0, status: 'upcoming', rules: '新商户首月交易满1万奖励200元' },
    { id: 3, name: '春节红包活动', startTime: '2024-02-01', endTime: '2024-02-29', merchants: 120, status: 'ended', rules: '随机红包0.5-5元' },
    { id: 4, name: '周末双倍积分', startTime: '2024-03-15', endTime: '2024-06-15', merchants: 55, status: 'active', rules: '每周六日消费积分翻倍' },
  ];
  var guides = [
    { id: 'merchant-onboarding', title: '商户进件指南', steps: ['点击"商户进件" -> "新增商户"', '填写法人与企业信息', '上传营业执照、法人身份证', '选择进件渠道', '提交审核'] },
    { id: 'withdrawal', title: '收益提现指南', steps: ['进入收益明细', '核对可提现金额', '绑定银行卡', '发起提现申请'] },
    { id: 'store-audit', title: '门店审核指南', steps: ['进入门店管理查看待审', '核对门头与地址', '驳回需写清原因', '通过可进入总监终审流程'] },
  ];
  var revenueData = null;
  var reportSelected = '商户发展报表';
  var reportTypes = ['商户发展报表', '交易流水报表', '分润收益报表', '区域分布报表'];
  var RPT_COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626', '#0891b2', '#7c3aed'];

  function $(s) {
    return document.querySelector(s);
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }
  function page(name) {
    return (window.bdPage || function (x) {
      return x;
    })(name);
  }

  function fmt(n) {
    return '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
  }

  function renderHome() {
    var wb = workbenchItems
      .map(function (it) {
        return (
          '<button type="button" class="bd-wb-cell" data-hash="' +
          it.hash +
          '">' +
          '<div class="bd-wb-ico ' +
          it.cls +
          '">' +
          it.emoji +
          '</div><span>' +
          escapeHtml(it.label) +
          '</span></button>'
        );
      })
      .join('');
    var nf = notifications
      .map(function (n, i) {
        return (
          '<button type="button" class="nf-item" data-msg="' +
          n.id +
          '" style="width:100%;border:none;background:none;display:flex;align-items:center;gap:12px;padding:12px 14px;text-align:left;cursor:pointer;' +
          (i < notifications.length - 1 ? 'border-bottom:1px solid var(--bd-border);' : '') +
          '">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:var(--bd-primary);flex-shrink:0"></span>' +
          '<span style="flex:1;font-size:13px;color:var(--bd-text)">' +
          escapeHtml(n.text) +
          '</span>' +
          '<span style="font-size:11px;color:var(--bd-muted)">' +
          escapeHtml(n.time) +
          '</span></button>'
        );
      })
      .join('');
    var mat = marketingMaterials
      .map(function (m) {
        return (
          '<button type="button" data-mat="' +
          m.id +
          '" style="width:100%;border:1px solid var(--bd-border);border-radius:12px;padding:14px;background:#fff;text-align:left;margin-bottom:10px;cursor:pointer">' +
          '<div style="display:flex;gap:12px">' +
          '<div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px">🔗</div>' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-size:14px;font-weight:600">' +
          escapeHtml(m.title) +
          '</div>' +
          '<div style="font-size:12px;color:var(--bd-muted);margin-top:4px">' +
          escapeHtml(m.desc) +
          '</div>' +
          '<div style="margin-top:8px"><span style="font-size:11px;padding:2px 8px;border-radius:4px;background:rgba(37,99,235,.1);color:var(--bd-primary)">' +
          escapeHtml(m.tag) +
          '</span> <span style="font-size:11px;color:var(--bd-muted)">' +
          escapeHtml(m.uses) +
          ' 次使用</span></div></div></div></button>'
        );
      })
      .join('');
    return (
      '<div class="bd-scroll" style="padding-bottom:72px">' +
      '<div class="bd-header-primary">' +
      '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px">👤</div>' +
      '<div><p style="margin:0;font-size:15px;font-weight:700">李泽峰，早上好</p>' +
      '<p style="margin:4px 0 0;font-size:11px;opacity:.75">高级业务经理</p></div></div></div>' +
      '<div class="bd-stats-card">' +
      '<div style="display:flex;justify-content:space-around;align-items:flex-start">' +
      '<div style="text-align:center"><p style="margin:0;font-size:11px;color:var(--bd-muted)">已发展门店</p>' +
      '<p style="margin:6px 0 0;font-size:20px;font-weight:800">50<small style="font-weight:400;font-size:11px;margin-left:4px;color:var(--bd-muted)">家</small></p></div>' +
      '<div style="width:1px;background:var(--bd-border);margin:0 4px"></div>' +
      '<div style="text-align:center"><p style="margin:0;font-size:11px;color:var(--bd-muted)">本月新增</p>' +
      '<p style="margin:6px 0 0;font-size:20px;font-weight:800;color:var(--bd-success)">8<small style="font-weight:400;font-size:11px;margin-left:4px;color:var(--bd-muted)">家</small></p></div>' +
      '<div style="width:1px;background:var(--bd-border);margin:0 4px"></div>' +
      '<div style="text-align:center"><p style="margin:0;font-size:11px;color:var(--bd-muted)">今日收益</p>' +
      '<p style="margin:6px 0 0;font-size:20px;font-weight:800">¥2,350</p></div>' +
      '<span style="font-size:14px;color:var(--bd-success)">↗</span></div></div>' +
      '<div style="padding:16px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:10px">' +
      '<span style="font-size:14px;font-weight:600">消息通知</span>' +
      '<button type="button" data-hash="msgs" style="border:none;background:none;font-size:11px;color:var(--bd-muted);cursor:pointer">更多 ›</button></div>' +
      '<div style="border:1px solid var(--bd-border);border-radius:12px;overflow:hidden;background:#fff">' +
      nf +
      '</div>' +
      '<p style="margin:16px 0 10px;font-size:14px;font-weight:600">工作台</p>' +
      '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:16px;background:#fff">' +
      '<div class="bd-workbench-grid" style="padding:0">' +
      wb +
      '</div></div>' +
      '<div style="display:flex;justify-content:space-between;margin:16px 0 10px">' +
      '<span style="font-size:14px;font-weight:600">拓客素材</span>' +
      '<button type="button" data-hash="mats" style="border:none;background:none;font-size:11px;color:var(--bd-muted);cursor:pointer">更多 ›</button></div>' +
      mat +
      '</div>' +
      '</div>'
    );
  }

  function renderAi() {
    return (
      '<div class="bd-scroll" style="min-height:420px;display:flex;align-items:center;justify-content:center;padding-bottom:72px">' +
      '<div style="text-align:center"><div style="font-size:40px;opacity:.35;margin-bottom:12px">◇</div>' +
      '<p style="margin:0;font-size:17px;font-weight:700">AI 助手</p>' +
      '<p style="margin:8px 0 0;font-size:13px;color:var(--bd-muted)">即将上线，敬请期待</p></div></div>'
    );
  }

  function renderRevenue() {
    var list = revenueData && revenueData.revenueList ? revenueData.revenueList : [];
    var storeList = revenueData && revenueData.storeList ? revenueData.storeList : [];
    var sel = $('#bdRevStore');
    var storeId = sel ? sel.value : 'all';
    var filtered =
      storeId === 'all'
        ? list
        : list.filter(function (i) {
            var st = storeList.find(function (x) {
              return x.id === storeId;
            });
            return st && i.merchant === st.name;
          });
    var totalProfit = filtered.reduce(function (s, i) {
      return s + i.profit;
    }, 0);
    var totalOrders = filtered.reduce(function (s, i) {
      return s + i.orders;
    }, 0);
    var totalVol = filtered.reduce(function (s, i) {
      return s + i.volume;
    }, 0);
    var totalNu = filtered.reduce(function (s, i) {
      return s + i.newUsers;
    }, 0);
    var map = {};
    filtered.forEach(function (item) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    });
    var grouped = Object.keys(map)
      .sort()
      .reverse()
      .map(function (d) {
        return [d, map[d]];
      });

    var opts = storeList
      .map(function (s) {
        return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.name) + '</option>';
      })
      .join('');
    var body = grouped
      .map(function (pair) {
        var date = pair[0];
        var items = pair[1];
        return (
          '<div style="margin-bottom:16px"><p style="margin:0 0 8px;font-size:13px;font-weight:700">' +
          escapeHtml(date) +
          '</p>' +
          items
            .map(function (it) {
              return (
                '<div style="border:1px solid var(--bd-border);border-radius:10px;padding:12px;margin-bottom:8px;background:#fff">' +
                '<div style="font-size:14px;font-weight:600">' +
                escapeHtml(it.merchant) +
                '</div>' +
                '<div style="margin-top:8px;font-size:12px;color:var(--bd-muted)">' +
                '分佣 ' +
                fmt(it.profit) +
                ' · 订单 ' +
                it.orders +
                '</div></div>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>收益明细</h1></div>' +
      '<div class="bd-scroll" style="padding:12px 16px 72px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<select id="bdRevStore" style="padding:8px 10px;border-radius:8px;border:1px solid var(--bd-border);font-size:13px">' +
      opts +
      '</select>' +
      '<div id="bdRevPeriod" style="display:flex;font-size:11px;border:1px solid var(--bd-border);border-radius:8px;overflow:hidden">' +
      '<button type="button" data-p="day" class="bd-rev-p bd-active" style="padding:8px 12px;border:none;background:var(--bd-primary);color:#fff">日</button>' +
      '<button type="button" data-p="month" class="bd-rev-p" style="padding:8px 12px;border:none;background:#fff">月</button>' +
      '<button type="button" data-p="cum" class="bd-rev-p" style="padding:8px 12px;border:none;background:#fff">累计</button>' +
      '</div></div>' +
      '<div style="text-align:center;padding:12px 0"><p style="margin:0;font-size:26px;font-weight:800">' +
      fmt(totalProfit) +
      '</p>' +
      '<p style="margin:6px 0 0;font-size:11px;color:var(--bd-muted)">分佣收益</p></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;margin:12px 0 16px">' +
      '<div><p style="margin:0;font-size:15px;font-weight:700">' +
      totalOrders +
      '</p><p style="margin:4px 0 0;font-size:11px;color:var(--bd-muted)">支付订单</p></div>' +
      '<div><p style="margin:0;font-size:15px;font-weight:700">' +
      fmt(totalVol) +
      '</p><p style="margin:4px 0 0;font-size:11px;color:var(--bd-muted)">交易流水</p></div>' +
      '<div><p style="margin:0;font-size:15px;font-weight:700">' +
      totalNu +
      '</p><p style="margin:4px 0 0;font-size:11px;color:var(--bd-muted)">新增用户</p></div></div>' +
      '<div style="height:8px;background:#f5f5f5;margin:0 -16px 12px"></div>' +
      body +
      '</div>'
    );
  }

  function renderTeam() {
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>团队管理</h1></div>' +
      '<div class="bd-scroll" style="padding:16px 16px 72px">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">' +
      '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:12px;background:#fff;text-align:center"><small style="color:var(--bd-muted)">直属成员</small><p style="margin:6px 0 0;font-size:18px;font-weight:800">15</p></div>' +
      '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:12px;background:#fff;text-align:center"><small style="color:var(--bd-muted)">间接成员</small><p style="margin:6px 0 0;font-size:18px;font-weight:800">42</p></div>' +
      '</div>' +
      '<p style="font-size:13px;font-weight:700;margin-bottom:8px">成员列表</p>' +
      ['王强', '李明', '张芳']
        .map(function (nm) {
          return (
            '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:12px;margin-bottom:8px;background:#fff">' +
            '<div style="font-weight:700">' +
            escapeHtml(nm) +
            '</div>' +
            '<div style="font-size:11px;color:var(--bd-muted);margin-top:4px">本月业绩与拓店数据见 bd-guanli TeamPage 完整版</div></div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function reportChartBundle() {
    return (
      window.__BD_REPORT_CHARTS__ || {
        merchantTrend: [],
        transactionTrend: [],
        revenueTrend: [],
        industryDistribution: [],
        areaBarData: [],
      }
    );
  }

  function barHoriz(label, value, maxVal, color) {
    var pct = maxVal > 0 ? Math.min(100, Math.round((value / maxVal) * 100)) : 0;
    color = color || 'var(--bd-primary)';
    return (
      '<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--bd-muted);margin-bottom:4px">' +
      '<span>' +
      escapeHtml(label) +
      '</span><span style="font-variant-numeric:tabular-nums">' +
      value +
      '</span></div><div style="height:10px;background:#eef2ff;border-radius:6px;overflow:hidden"><div style="height:100%;width:' +
      pct +
      '%;background:' +
      color +
      ';border-radius:6px"></div></div></div>'
    );
  }

  function renderReports() {
    var D = reportChartBundle();
    var tabs = reportTypes
      .map(function (t) {
        return (
          '<button type="button" data-report-tab="' +
          escapeHtml(t) +
          '" style="flex-shrink:0;padding:9px 16px;border-radius:999px;border:none;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;' +
          (reportSelected === t ? 'background:var(--bd-primary);color:#fff;' : 'background:#f4f4f5;color:#525252;') +
          '">' +
          escapeHtml(t) +
          '</button>'
        );
      })
      .join('');
    var body = '';
    if (reportSelected === '商户发展报表') {
      var mt = D.merchantTrend || [];
      var maxNm = mt.reduce(function (m, row) {
        return Math.max(m, row.newMerchants || 0);
      }, 1);
      var last = mt.length ? mt[mt.length - 1] : {};
      var ind = D.industryDistribution || [];
      var indRows = ind
        .map(function (item, idx) {
          return barHoriz(item.name + ' ' + (item.percentage != null ? item.percentage + '%' : ''), item.value || 0, 150, RPT_COLORS[idx % RPT_COLORS.length]);
        })
        .join('');
      body =
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff;margin-bottom:12px;font-size:12px;color:var(--bd-muted)">📅 2023-10 至 2024-03</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">累计商户</div><div style="font-size:18px;font-weight:800;color:var(--bd-primary);margin-top:4px">' +
        (last.totalMerchants ?? '267') +
        '家</div></div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">本月新增</div><div style="font-size:18px;font-weight:800;color:#b45309;margin-top:4px">' +
        (last.newMerchants ?? 50) +
        '家</div></div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">活跃商户</div><div style="font-size:18px;font-weight:800;color:var(--bd-success);margin-top:4px">' +
        (last.activeMerchants ?? 220) +
        '家</div></div>' +
        '</div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff;margin-bottom:12px">' +
        '<p style="margin:0 0 12px;font-size:13px;font-weight:700">商户增长 · 月度新增</p>' +
        mt
          .map(function (row) {
            return barHoriz(row.month, row.newMerchants, maxNm);
          })
          .join('') +
        '</div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff">' +
        '<p style="margin:0 0 12px;font-size:13px;font-weight:700">行业分布</p>' +
        indRows +
        '</div>';
    } else if (reportSelected === '交易流水报表') {
      var tr = D.transactionTrend || [];
      var maxAmt = tr.reduce(function (m, row) {
        return Math.max(m, row.amount || 0);
      }, 1);
      body =
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">本月交易额</div><div style="font-size:14px;font-weight:800;color:var(--bd-primary);margin-top:6px">' +
        fmtMil(tr.length ? tr[tr.length - 1].amount : 1120000) +
        '</div></div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">笔数</div><div style="font-size:14px;font-weight:800;margin-top:6px">' +
        (tr.length ? tr[tr.length - 1].count : 1400) +
        '</div></div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:12px;text-align:center;background:#fff"><div style="font-size:10px;color:var(--bd-muted)">客单价</div><div style="font-size:14px;font-weight:800;margin-top:6px">¥' +
        (tr.length ? tr[tr.length - 1].avgAmount : 800) +
        '</div></div></div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff"><p style="margin:0 0 12px;font-size:13px;font-weight:700">交易流水趋势</p>' +
        tr
          .map(function (row) {
            return barHoriz(row.month, row.amount, maxAmt);
          })
          .join('') +
        '</div>';
    } else if (reportSelected === '分润收益报表') {
      var rv = D.revenueTrend || [];
      var maxR = rv.reduce(function (m, row) {
        return Math.max(m, row.revenue || 0);
      }, 1);
      body =
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff">' +
        '<p style="margin:0 0 12px;font-size:13px;font-weight:700">分佣与结算走势</p>' +
        rv
          .map(function (row) {
            return barHoriz(row.month + ' · 分佣 ', row.revenue, maxR) + '<div style="padding-left:8px;margin:-4px 0 8px;font-size:11px;color:var(--bd-muted)">已结 ' + row.settled + ' · 在途 ' + row.pending + '</div>';
          })
          .join('') +
        '</div>';
    } else if (reportSelected === '区域分布报表') {
      var ab = D.areaBarData || [];
      var maxRv = ab.reduce(function (m, row) {
        return Math.max(m, row.revenue || 0);
      }, 1);
      var maxMc = ab.reduce(function (m, row) {
        return Math.max(m, row.merchants || 0);
      }, 1);
      body =
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff">' +
        '<p style="margin:0 0 12px;font-size:13px;font-weight:700">区域商户</p>' +
        ab.map(function (row) {
          return barHoriz(row.area + ' · 门店', row.merchants, maxMc);
        }).join('') +
        '</div>' +
        '<div style="border:1px solid var(--bd-border);border-radius:14px;padding:14px;background:#fff;margin-top:12px">' +
        '<p style="margin:0 0 12px;font-size:13px;font-weight:700">区域分佣</p>' +
        ab.map(function (row) {
          return barHoriz(row.area + ' · 佣金', row.revenue, maxRv, '#16a34a');
        }).join('') +
        '</div>';
    }
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>数据报表</h1></div>' +
      '<div style="overflow-x:auto;padding:8px 12px 6px;display:flex;gap:8px;border-bottom:1px solid rgba(229,231,235,.7)">' +
      tabs +
      '</div>' +
      '<div class="bd-scroll" style="padding:14px;font-size:13px;line-height:1.65;color:var(--bd-text);padding-bottom:92px">' +
      body +
      '</div>'
    );
  }

  function fmtMil(n) {
    if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + '万';
    return (
      '¥' +
      Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
    );
  }

  function renderActivities() {
    var stLabel = { active: '进行中', upcoming: '即将开始', ended: '已结束' };
    var body = activities
      .map(function (a) {
        return (
          '<div style="border:1px solid var(--bd-border);border-radius:12px;padding:14px;margin-bottom:10px;background:#fff">' +
          '<div style="display:flex;justify-content:space-between"><strong style="font-size:14px">' +
          escapeHtml(a.name) +
          '</strong><span style="font-size:11px;color:var(--bd-primary)">' +
          stLabel[a.status] +
          '</span></div>' +
          '<p style="margin:8px 0 0;font-size:11px;color:var(--bd-muted)">' +
          escapeHtml(a.startTime) +
          ' ~ ' +
          escapeHtml(a.endTime) +
          '</p>' +
          '<p style="margin:8px 0 0;font-size:12px">' +
          escapeHtml(a.rules) +
          '</p>' +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>活动管理</h1></div>' +
      '<div class="bd-scroll" style="padding:16px;padding-bottom:72px">' +
      body +
      '</div>'
    );
  }

  function renderGuide() {
    var body = guides
      .map(function (g) {
        return (
          '<div style="margin-bottom:16px;border:1px solid var(--bd-border);border-radius:12px;padding:14px;background:#fff">' +
          '<strong style="font-size:14px">' +
          escapeHtml(g.title) +
          '</strong>' +
          '<ol style="margin:10px 0 0;padding-left:18px;font-size:13px;color:var(--bd-text)">' +
          g.steps.map(function (st) {
            return '<li style="margin-bottom:6px">' + escapeHtml(st) + '</li>';
          }).join('') +
          '</ol></div>'
        );
      })
      .join('');
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>操作指南</h1></div>' +
      '<div class="bd-scroll" style="padding:16px;padding-bottom:72px">' +
      body +
      '</div>'
    );
  }

  function renderSupport() {
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-backhome>‹</button><h1>联系客服</h1></div>' +
      '<div class="bd-scroll" style="padding:24px 16px;text-align:center;padding-bottom:72px">' +
      '<p style="margin:0;font-size:15px;font-weight:600">7×24 在线客服（演示）</p>' +
      '<p style="margin:12px 0 0;font-size:13px;color:var(--bd-muted);line-height:1.7">热线电话：400-000-0000<br>企业服务微信：LfService（示例）</p>' +
      '</div>'
    );
  }

  function mountMain() {
    var host = $('#bdWorkbenchMain');
    if (!host) return;
    var h = location.hash.replace(/^#\//, '#').replace(/^#/, '');
    var main = 'home';
    if (['ai', 'revenue', 'team', 'reports', 'activities', 'guide', 'support'].indexOf(h) >= 0) main = h;
    window.bdRenderBottomTabs(main === 'ai' ? 'ai' : 'home');
    var html = '';
    if (main === 'home') html = renderHome();
    else if (main === 'ai') html = renderAi();
    else if (main === 'revenue') html = renderRevenue();
    else if (main === 'team') html = renderTeam();
    else if (main === 'reports') html = renderReports();
    else if (main === 'activities') html = renderActivities();
    else if (main === 'guide') html = renderGuide();
    else if (main === 'support') html = renderSupport();
    host.innerHTML = html;
    wire(main);
  }

  function wire(main) {
    var host = $('#bdWorkbenchMain');
    host.querySelectorAll('[data-hash]').forEach(function (btn) {
      btn.onclick = function () {
        var x = btn.getAttribute('data-hash');
        if (x === 'stores') location.href = page('mdm_bd_stores.html');
        else if (x === 'stores-agreements') location.href = page('mdm_bd_stores.html#agreements');
        else if (x === 'merchants') location.href = page('mdm_bd_merchants.html');
        else if (x === 'msgs') location.href = page('mdm_bd_personal.html#messages');
        else if (x === 'mats') location.href = page('mdm_bd_personal.html#materials');
        else location.hash = x;
      };
    });
    host.querySelectorAll('[data-msg]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-msg');
        location.href = page('mdm_bd_personal.html#msg/' + id);
      };
    });
    host.querySelectorAll('[data-mat]').forEach(function (b) {
      b.onclick = function () {
        location.href = page('mdm_bd_personal.html#mat/' + b.getAttribute('data-mat'));
      };
    });
    host.querySelectorAll('[data-backhome]').forEach(function (b) {
      b.onclick = function () {
        location.hash = 'home';
      };
    });
    if (main === 'reports') {
      host.querySelectorAll('[data-report-tab]').forEach(function (b) {
        b.onclick = function () {
          reportSelected = b.getAttribute('data-report-tab') || reportTypes[0];
          mountMain();
        };
      });
    }
    if (main === 'revenue') {
      var sel = $('#bdRevStore');
      if (sel) sel.onchange = mountMain;
      host.querySelectorAll('.bd-rev-p').forEach(function (b) {
        b.onclick = function () {
          host.querySelectorAll('.bd-rev-p').forEach(function (x) {
            x.classList.remove('bd-active');
            x.style.background = '#fff';
            x.style.color = 'inherit';
          });
          b.classList.add('bd-active');
          b.style.background = 'var(--bd-primary)';
          b.style.color = '#fff';
        };
      });
    }
  }

  function init() {
    function bootRev(d) {
      revenueData =
        d && typeof d === 'object'
          ? JSON.parse(JSON.stringify(d))
          : { revenueList: [], storeList: [{ id: 'all', name: '默认全部' }] };
      mountMain();
    }
    if (window.__BD_REVENUE_DATA__) {
      bootRev(window.__BD_REVENUE_DATA__);
    } else {
      fetch(new URL('../js/mdm-bd-revenue-data.json', location.href).toString())
        .then(function (r) {
          return r.json();
        })
        .then(bootRev)
        .catch(function () {
          bootRev({ revenueList: [], storeList: [{ id: 'all', name: '默认全部' }] });
        });
    }
    window.addEventListener('hashchange', mountMain);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
