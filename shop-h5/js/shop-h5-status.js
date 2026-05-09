(function () {
  'use strict';

  var BD_EMPLOYEE_CODE_TO_NAME = { BD20240001: '李泽峰' };

  function resolveBdDisplayName(bdIdentifier) {
    var key = (bdIdentifier || '').trim();
    if (!key || key === '—') return '—';
    return BD_EMPLOYEE_CODE_TO_NAME[key] || key;
  }

  var STATUS_COPY = {
    pending: {
      title: '申请已提交',
      desc: '门店注册资料已提交至 BD 审核处，请等待 BD 审核。审核结果将由 BD 同步通知。',
      icon: '⏱',
      bg: '#fff7ed',
      fg: '#c2410c',
      badge: '待审核',
    },
    updated: {
      title: '资料已更新',
      desc: '您提交的门店资料已同步至 BD，请等待 BD 审核。如需继续修改可返回表单。',
      icon: '📋',
      bg: '#e0f2fe',
      fg: '#0369a1',
      badge: '待审核',
    },
    cancelled: {
      title: '已取消',
      desc: '本次填写已取消，未提交注册。如需注册请重新扫码打开链接。',
      icon: '✕',
      bg: '#f3f4f6',
      fg: '#6b7280',
      badge: '已取消',
    },
    approved: {
      title: '审核通过',
      desc: '门店资料审核已通过，后续将由 BD 协助完成进件与开店准备。',
      icon: '✓',
      bg: '#dcfce7',
      fg: '#15803d',
      badge: '审核成功',
    },
  };

  function pad2(n) {
    var s = String(n);
    return s.length < 2 ? '0' + s : s;
  }

  function nowSubmittedAt() {
    var now = new Date();
    return (
      now.getFullYear() +
      '-' +
      pad2(now.getMonth() + 1) +
      '-' +
      pad2(now.getDate()) +
      ' ' +
      pad2(now.getHours()) +
      ':' +
      pad2(now.getMinutes())
    );
  }

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    var params = new URLSearchParams(location.search);
    var rawStatus = params.get('status') || 'pending';
    var status =
      rawStatus === 'draft' || !STATUS_COPY.hasOwnProperty(rawStatus) ? 'pending' : rawStatus;
    var meta = STATUS_COPY[status];
    var storeName = params.get('storeName') || '您的门店';
    var bdId = params.get('bdId') || '—';
    var storeId = (params.get('storeId') || '').trim();
    var bdNameFromUrl = (params.get('bdName') || '').trim();
    var bdDisplayName =
      bdNameFromUrl.length > 0 ? bdNameFromUrl : resolveBdDisplayName(bdId);
    var showBdEmployeeId = bdId !== '—' && bdDisplayName !== bdId;

    var wrap = $('statusIconWrap');
    wrap.style.background = meta.bg;
    wrap.style.color = meta.fg;
    wrap.style.borderRadius = '999px';
    wrap.style.width = '64px';
    wrap.style.height = '64px';
    wrap.style.margin = '0 auto 16px';
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'center';
    wrap.style.fontSize = '28px';
    wrap.textContent = meta.icon;

    $('statusTitle').textContent = meta.title;
    $('statusDesc').textContent = meta.desc;
    $('statusBadge').textContent = meta.badge;
    $('metaStoreName').textContent = storeName;
    $('metaBdName').textContent = bdDisplayName;

    var sub = $('metaBdSub');
    if (showBdEmployeeId) {
      sub.classList.remove('shop-h5-hidden');
      sub.textContent = '工号 ' + bdId;
    } else sub.classList.add('shop-h5-hidden');

    $('metaTime').textContent = status === 'cancelled' ? '—' : nowSubmittedAt();

    var actions = $('statusActions');
    if (status !== 'cancelled') {
      actions.classList.remove('shop-h5-hidden');
      $('btnRefresh').onclick = function () {
        location.reload();
      };
      $('btnContinue').onclick = function () {
        var q = new URLSearchParams();
        if (bdId !== '—') q.set('bdId', bdId);
        if (storeId) q.set('storeId', storeId);
        var qs = q.toString();
        location.href = 'register.html' + (qs ? '?' + qs : '');
      };
    } else {
      actions.classList.add('shop-h5-hidden');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
