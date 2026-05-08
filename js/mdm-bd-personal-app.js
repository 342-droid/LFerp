(function () {
  var messages = [
    { id: 1, text: '您的商户"茶百道-人民路店"已通过审核', time: '10:30', date: '今天', read: false, type: '审核通知' },
    { id: 2, text: '本月团队业绩已超额完成，请查看详情', time: '09:15', date: '今天', read: false, type: '业绩通知' },
    { id: 3, text: '新商户"星辰咖啡馆"入驻申请待审核', time: '16:40', date: '昨天', read: false, type: '审核通知' },
    { id: 4, text: '团队成员王强已完成本月KPI目标', time: '14:20', date: '昨天', read: true, type: '团队通知' },
    { id: 5, text: '系统将于今晚22:00进行例行维护', time: '11:00', date: '昨天', read: true, type: '系统通知' },
  ];
  var materials = [
    { id: 1, title: '新商户入驻推广海报', desc: '适用于地推和线上分享，突出费率优势和入驻流程简便', tag: '热门', uses: '2.3k', category: '推广海报' },
    { id: 2, title: '商户收益对比图', desc: '展示合作前后收益变化，数据可视化说服力强', tag: '推荐', uses: '1.8k', category: '数据图表' },
    { id: 3, title: '节日营销活动模板', desc: '春节/中秋等节日活动方案，可直接套用', tag: '新品', uses: '960', category: '活动方案' },
    { id: 4, title: '商户成功案例集', desc: '精选10个合作商户的真实案例，增强信任感', tag: '推荐', uses: '1.5k', category: '案例分享' },
  ];
  var withdrawRecords = [
    { id: 1, applyTime: '2024-03-20 14:30', amount: 5000, status: 'success', arriveTime: '2024-03-21 10:00', bank: '招商银行 **** 6789' },
    { id: 2, applyTime: '2024-03-15 09:00', amount: 8000, status: 'success', arriveTime: '2024-03-16 10:00', bank: '招商银行 **** 6789' },
    { id: 3, applyTime: '2024-03-10 16:20', amount: 3000, status: 'processing', arriveTime: '', bank: '工商银行 **** 1234' },
  ];
  var route = 'profile';

  function $(s) {
    return document.querySelector(s);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  function page(x) {
    return (window.bdPage || function (a) {
      return a;
    })(x);
  }

  function barBack(label, target) {
    return (
      '<div class="bd-page-bar"><button type="button" class="bd-back" data-nav="' +
      target +
      '">‹</button><h1>' +
      esc(label) +
      '</h1></div>'
    );
  }

  function renderProfile() {
    var groups = [
      {
        t: '业务管理',
        items: [
          ['商户进件', 'merchants', '🏪'],
          ['我的业绩', 'performance', '📊'],
          ['邀请好友', 'invite', '👥'],
        ],
      },
      {
        t: '资产管理',
        items: [
          ['我的银行卡', 'bank', '💳'],
          ['实名认证', 'verification', '✓'],
        ],
      },
      {
        t: '系统设置',
        items: [
          ['账号安全', 'security', '🔒'],
          ['消息设置', 'notifications', '🔔'],
          ['意见反馈', 'feedback', '✎'],
          ['关于我们', 'about', 'ℹ️'],
        ],
      },
    ];
    var gh = groups
      .map(function (g) {
        return (
          '<p style="margin:14px 4px 8px;font-size:12px;color:var(--bd-muted)">' +
          esc(g.t) +
          '</p>' +
          '<div style="border:1px solid var(--bd-border);border-radius:12px;overflow:hidden;background:#fff">' +
          g.items
            .map(function (it, idx) {
              return (
                '<button type="button" data-nav="' +
                it[1] +
                '" style="width:100%;border:none;background:none;display:flex;align-items:center;gap:10px;padding:14px 16px;text-align:left;cursor:pointer;' +
                (idx < g.items.length - 1 ? 'border-bottom:1px solid var(--bd-border)' : '') +
                '">' +
                '<span style="width:32px;height:32px;border-radius:10px;background:var(--bd-primary-soft);display:flex;align-items:center;justify-content:center">' +
                it[2] +
                '</span><span style="flex:1;font-size:14px">' +
                esc(it[0]) +
                '</span><span style="opacity:.35">›</span></button>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('');
    return (
      '<div class="bd-scroll" style="padding-bottom:72px">' +
      '<div class="bd-header-primary">' +
      '<div style="display:flex;gap:14px">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px">👤</div>' +
      '<div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span style="font-size:18px;font-weight:800">李泽峰</span>' +
      '<span style="font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,.2)">高级业务经理</span></div>' +
      '<div style="font-size:12px;opacity:.7;margin-top:6px">ID: BD20240001</div></div></div></div>' +
      '<div style="padding:14px;margin-top:-20px">' +
      '<button type="button" data-nav="wallet" style="width:100%;border:1px solid var(--bd-border);border-radius:12px;padding:14px;background:#fff;display:flex;justify-content:space-between;align-items:center;cursor:pointer">' +
      '<div style="display:flex;gap:12px;align-items:center">' +
      '<span style="width:40px;height:40px;border-radius:12px;background:rgba(245,158,11,.14);display:flex;align-items:center;justify-content:center">💰</span>' +
      '<div style="text-align:left"><div style="font-size:14px;font-weight:600">我的钱包</div>' +
      '<div style="font-size:11px;color:var(--bd-muted);margin-top:4px">余额 ¥12,580.00</div></div></div><span style="opacity:.35">›</span></button></div>' +
      '<div style="padding:0 14px">' +
      gh +
      '<button type="button" id="bdLogoutBtn" style="width:100%;margin-top:16px;padding:14px;border:1px solid var(--bd-border);border-radius:12px;background:#fff;color:var(--bd-destructive);font-weight:700">退出登录</button>' +
      '</div></div>' +
      '<div class="bd-modal" id="bdLogoutModal">' +
      '<div class="bd-modal-box"><h3>确认退出</h3><p style="font-size:12px;color:var(--bd-muted)">演示环境，确定退出登录？</p>' +
      '<div class="bd-modal-actions"><button type="button" data-close>取消</button><button type="button" class="ok" onclick="document.getElementById(\'bdLogoutModal\').classList.remove(\'bd-show\');bdToast(\'已退出（演示）\')">退出</button></div></div></div>'
    );
  }

  function renderWallet() {
    var rows = withdrawRecords
      .map(function (r) {
        return (
          '<button type="button" data-nav="wallet-' +
          r.id +
          '" style="width:100%;border:none;border-bottom:1px solid var(--bd-border);background:none;padding:12px;text-align:left;cursor:pointer">' +
          '<div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600"><span>提现 ¥' +
          r.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) +
          '</span><span style="font-size:12px;font-weight:500;color:var(--bd-muted)">' +
          (r.status === 'success' ? '已到账' : '处理中') +
          '</span></div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:6px">' +
          esc(r.applyTime) +
          '</div></button>'
        );
      })
      .join('');
    return (
      barBack('钱包', 'profile') +
      '<div class="bd-scroll" style="padding:14px">' +
      '<div style="text-align:center;padding:20px 0"><p style="margin:0;font-size:12px;color:var(--bd-muted)">可提现余额</p>' +
      '<p style="margin:10px 0 0;font-size:32px;font-weight:800;font-variant-numeric:tabular-nums">¥36,200.00</p></div>' +
      '<div style="display:flex;gap:10px;margin:12px 0">' +
      '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;justify-content:center;border-radius:12px;box-shadow:none" data-nav="withdraw">提现</button></div>' +
      '<p style="font-weight:700;font-size:13px;margin:16px 0 8px">提现记录</p>' +
      '<div style="border:1px solid var(--bd-border);border-radius:12px;overflow:hidden;background:#fff">' +
      rows +
      '</div></div>'
    );
  }

  function renderWithdraw() {
    return (
      barBack('提现', 'wallet') +
      '<div class="bd-scroll" style="padding:16px">' +
      '<label style="font-size:13px;display:block;margin-bottom:10px">金额<input type="number" style="margin-top:6px;display:block;width:100%;padding:12px;border:1px solid var(--bd-border);border-radius:12px"/></label>' +
      '<button type="button" class="bd-btn bd-btn-primary" style="width:100%;margin-top:16px;border-radius:12px" onclick="bdToast(\'提现申请已提交（演示）\');location.hash=\'#wallet\'">确认提现</button></div>'
    );
  }

  function renderWalletDetail(id) {
    var r = withdrawRecords.find(function (x) {
      return String(x.id) === String(id);
    });
    if (!r)
      return barBack('明细', 'wallet') + '<div class="bd-empty">无记录</div>';
    return (
      barBack('提现明细', 'wallet') +
      '<div style="padding:18px;line-height:1.8;font-size:14px"><p><span style="color:var(--bd-muted)">申请时间：</span>' +
      esc(r.applyTime) +
      '</p><p><span style="color:var(--bd-muted)">金额：</span>¥' +
      r.amount.toFixed(2) +
      '</p><p><span style="color:var(--bd-muted)">到账时间：</span>' +
      esc(r.arriveTime || '—') +
      '</p><p><span style="color:var(--bd-muted)">银行卡：</span>' +
      esc(r.bank) +
      '</p></div>'
    );
  }

  function renderMessages() {
    var unread = messages.filter(function (m) {
      return !m.read;
    }).length;
    var body = messages
      .map(function (m) {
        return (
          '<button type="button" data-nav="msg-' +
          m.id +
          '" style="width:100%;border:1px solid var(--bd-border);border-radius:12px;background:#fff;padding:12px 14px;margin-bottom:10px;text-align:left;cursor:pointer">' +
          '<div style="display:flex;gap:10px">' +
          (m.read
            ? '<span style="width:8px"></span>'
            : '<span style="width:8px;height:8px;margin-top:6px;border-radius:50%;background:var(--bd-primary);flex-shrink:0"></span>') +
          '<div style="flex:1;min-width:0">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:4px">' +
          '<span style="font-size:11px;padding:3px 8px;border-radius:6px;background:rgba(37,99,235,.12);color:var(--bd-primary);font-weight:600">' +
          esc(m.type) +
          '</span>' +
          '<span style="font-size:11px;color:var(--bd-muted)">' +
          esc(m.date + ' ' + m.time) +
          '</span></div>' +
          '<div style="font-size:14px;line-height:1.35">' +
          esc(m.text) +
          '</div></div></div></button>'
        );
      })
      .join('');
    return (
      barBack('消息通知', 'profile') +
      '<div class="bd-scroll" style="padding:14px"><p style="font-size:12px;color:var(--bd-muted)">共 ' +
      messages.length +
      ' 条 · ' +
      unread +
      ' 条未读</p>' +
      body +
      '</div>'
    );
  }

  function renderMsgDetail(id) {
    var m = messages.find(function (x) {
      return String(x.id) === String(id);
    });
    if (!m) return barBack('消息', 'messages') + '<div class="bd-empty">无此消息</div>';
    return (
      barBack('消息详情', 'messages') +
      '<div style="padding:18px;line-height:1.75"><span style="font-size:11px;color:var(--bd-primary);font-weight:700">' +
      esc(m.type) +
      '</span>' +
      '<h2 style="margin:10px 0 8px;font-size:17px">' +
      esc(m.text) +
      '</h2>' +
      '<p style="margin:0;font-size:12px;color:var(--bd-muted)">' +
      esc(m.date + ' ' + m.time) +
      '</p></div>'
    );
  }

  function renderMaterials() {
    var body = materials
      .map(function (m) {
        return (
          '<button type="button" data-nav="mat-' +
          m.id +
          '" style="width:100%;border:1px solid var(--bd-border);border-radius:12px;padding:14px;margin-bottom:10px;display:flex;gap:12px;background:#fff;text-align:left;cursor:pointer">' +
          '<div style="width:56px;height:56px;border-radius:12px;background:#f3f4f6;display:flex;align-items:center;justify-content:center">🔗</div>' +
          '<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">' +
          esc(m.title) +
          '</div>' +
          '<div style="font-size:11px;color:var(--bd-muted);margin-top:4px;line-height:1.35">' +
          esc(m.desc) +
          '</div>' +
          '<div style="margin-top:6px"><span style="font-size:11px;background:rgba(37,99,235,.1);color:var(--bd-primary);padding:3px 8px;border-radius:6px">' +
          esc(m.tag) +
          '</span><span style="font-size:11px;color:var(--bd-muted);margin-left:8px">' +
          esc(m.uses) +
          ' 次</span></div></div>' +
          '<span style="align-self:center;opacity:.3">›</span></button>'
        );
      })
      .join('');
    return barBack('拓客素材', 'profile') + '<div class="bd-scroll" style="padding:14px">' + body + '</div>';
  }

  function renderMatDetail(id) {
    var m = materials.find(function (x) {
      return String(x.id) === String(id);
    });
    if (!m) return barBack('素材', 'materials') + '<div class="bd-empty">无此素材</div>';
    return (
      barBack('素材详情', 'materials') +
      '<div style="padding:18px;line-height:1.7;font-size:14px">' +
      '<span style="font-size:11px;color:var(--bd-muted);font-weight:600">' +
      esc(m.category) +
      '</span>' +
      '<h2 style="margin:10px 0;font-size:18px">' +
      esc(m.title) +
      '</h2><p>' +
      esc(m.desc) +
      '</p>' +
      '<div style="margin-top:14px;display:flex;gap:10px">' +
      '<button type="button" class="bd-btn bd-btn-outline" style="flex:1;border-radius:10px;font-size:13px;box-shadow:none" onclick="bdToast(\'已下载（演示）\')">下载</button>' +
      '<button type="button" class="bd-btn bd-btn-primary" style="flex:1;border-radius:10px;font-size:13px" onclick="bdToast(\'已分享（演示）\')">分享</button></div></div>'
    );
  }

  function simplePage(title, paragraphs) {
    return (
      barBack(title, 'profile') +
      '<div style="padding:18px;line-height:1.75;font-size:14px">' +
      paragraphs.map(function (p) {
        return '<p>' + esc(p) + '</p>';
      }).join('') +
      '</div>'
    );
  }

  function renderStoreQr() {
    return (
      barBack('门店入驻码', 'profile') +
      '<div class="bd-scroll" style="padding:24px;text-align:center;font-size:14px;line-height:1.7;color:var(--bd-text)">' +
      '<div style="width:220px;height:220px;margin:12px auto;background:#f9fafb;border:1px solid var(--bd-border);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--bd-muted);font-size:13px">' +
      '二维码占位<br>（对齐 StoreCreateQrPage）</div>' +
      '<button type="button" class="bd-btn bd-btn-primary" onclick="bdToast(\'链接已复制\')" style="margin-top:14px;border-radius:12px">复制分享链接</button></div>'
    );
  }

  function mount() {
    var host = $('#bd-personal-root');
    if (!host) return;
    parseHash();
    var html = '';
    if (route === 'profile') html = renderProfile();
    else if (route === 'wallet') html = renderWallet();
    else if (route === 'withdraw') html = renderWithdraw();
    else if (route.indexOf('wallet-detail-') === 0)
      html = renderWalletDetail(route.replace('wallet-detail-', ''));
    else if (route === 'messages') html = renderMessages();
    else if (route.indexOf('msg-') === 0) html = renderMsgDetail(route.replace('msg-', ''));
    else if (route === 'materials') html = renderMaterials();
    else if (route.indexOf('mat-') === 0) html = renderMatDetail(route.replace('mat-', ''));
    else if (route === 'performance')
      html = simplePage('我的业绩', [
        '拓店数、交易额、转化率与 Trends 与 bd-guanli MyPerformancePage 数据源一致。',
        '本月预估分佣：¥4,862.35',
      ]);
    else if (route === 'invite')
      html =
        barBack('邀请好友', 'profile') +
        '<div style="padding:18px;line-height:1.75;font-size:14px"><p>您的邀请码：<strong>LFG2026</strong>（演示）</p>' +
        '<p>分享给好友扫码注册 BD，即可获得奖励。</p>' +
        '<div style="width:200px;height:200px;margin:16px auto;border:1px solid var(--bd-border);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--bd-muted);font-size:12px;text-align:center">邀请二维码占位</div></div>';
    else if (route === 'store-qr') html = renderStoreQr();
    else if (route === 'bank')
      html = simplePage('我的银行卡', [
        '招商银行（尾号 6789），开户名李泽峰。',
        '与 BankCardsPage 一致可维护多张卡片。',
      ]);
    else if (route === 'verification')
      html = simplePage('实名认证', ['认证状态：已通过', '身份证号 330106********6612']);
    else if (route === 'security') html = simplePage('账号安全', ['已绑定手机 138****8001', '可修改登录密码与设备管理。']);
    else if (route === 'notifications')
      html = simplePage('消息设置', ['推送开关、营销通知等与 NotificationSettingsPage 一致。']);
    else if (route === 'feedback') html = simplePage('意见反馈', ['感谢您的反馈（演示占位）。']);
    else if (route === 'about')
      html = simplePage('关于我们', ['冷丰 BD 管理端本地静态还原 · 内容与交互对齐 bd-guanli-main']);
    else html = renderProfile();
    host.innerHTML = html;
    window.bdRenderBottomTabs(route === 'profile' ? 'profile' : 'profile');
    host.querySelectorAll('[data-nav]').forEach(function (b) {
      b.onclick = function () {
        var t = b.getAttribute('data-nav');
        var map = {
          wallet: '#wallet',
          withdraw: '#withdraw',
          merchants: page('mdm_bd_merchants.html'),
          performance: '#performance',
          invite: '#invite',
          bank: '#bank',
          verification: '#verification',
          security: '#security',
          notifications: '#notifications',
          feedback: '#feedback',
          about: '#about',
          profile: '#profile',
          messages: '#messages',
          materials: '#materials',
        };
        if (map[t]) {
          if (map[t].indexOf('.html') >= 0) location.href = map[t];
          else location.hash = map[t].replace(/^#/, '');
          return;
        }
        if (t.indexOf('wallet-') === 0)
          location.hash = 'wallet-detail-' + t.replace('wallet-', '');
      };
    });
    var lo = $('#bdLogoutBtn');
    if (lo) {
      lo.onclick = function () {
        $('#bdLogoutModal').classList.add('bd-show');
      };
    }
    $('#bdLogoutModal') &&
      $('#bdLogoutModal').addEventListener &&
      $('#bdLogoutModal').addEventListener('click', function (e) {
        if (e.target.id === 'bdLogoutModal') $('#bdLogoutModal').classList.remove('bd-show');
      });
    $('button[data-close]') &&
      (function () {
        var c = document.querySelectorAll('#bdLogoutModal [data-close]');
        for (var i = 0; i < c.length; i++)
          c[i].onclick = function () {
            $('#bdLogoutModal').classList.remove('bd-show');
          };
      })();
  }

  function parseHash() {
    var h = (location.hash || '#profile').replace(/^#/, '');
    if (h === 'profile' || !h) route = 'profile';
    else if (h === 'wallet') route = 'wallet';
    else if (h === 'withdraw') route = 'withdraw';
    else if (h.indexOf('wallet-detail-') === 0) route = h;
    else if (h === 'messages') route = 'messages';
    else if (h.indexOf('msg/') === 0) route = 'msg-' + h.split('/')[1];
    else if (h === 'materials') route = 'materials';
    else if (h.indexOf('mat/') === 0) route = 'mat-' + h.split('/')[1];
    else if (h === 'performance') route = 'performance';
    else if (h === 'invite') route = 'invite';
    else if (h === 'store-qr') route = 'store-qr';
    else if (h === 'bank-cards' || h === 'bank') route = 'bank';
    else if (h === 'verification') route = 'verification';
    else if (h === 'security') route = 'security';
    else if (h.indexOf('notifications') === 0) route = 'notifications';
    else if (h === 'feedback') route = 'feedback';
    else if (h === 'about') route = 'about';
    else route = 'profile';
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', function () {
        mount();
        window.addEventListener('hashchange', mount);
      })
    : (mount(),
      window.addEventListener('hashchange', mount));
})();
