/**
 * 营销活动 — 新建/编辑现金红包模版
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingCashRedpackTplStore;
  if (!Store) return;
  var wp = window.wmsPath || { page: function (f) { return f; } };
  var params = new URLSearchParams(window.location.search || '');
  var mode = params.get('mode') || 'add';
  var editId = params.get('id') || '';
  var auditId = params.get('auditId') || '';
  var fromAudit = params.get('from') === 'audit' || mode === 'audit' || !!auditId;
  var locked = false;

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function listHref() {
    if (fromAudit) return wp.page('mdm_audit_cash_redpack.html');
    return wp.page('mdm_marketing_cash_redpack_tpl.html');
  }

  function emptyModel() {
    return {
      id: '',
      name: '',
      startAt: '',
      endAt: '',
      ports: ['mini'],
      rewardType: 'fixed',
      claimTimesMode: 'unlimited',
      singleAmount: '',
      totalAmount: '',
      packetTotal: '',
      tiers: [{ amount: '', amountMin: '', amountMax: '', count: '', expected: '', probability: '' }],
      budgetUsed: 0,
      claimCondition: 'none',
      registerDays: '',
      orderCount: '',
      orderAmount: '',
      orderDayRange: 1,
      memberAudience: 'level',
      memberScope: 'specific',
      memberLevelIds: [],
      memberTagIds: [],
      memberSegmentIds: [],
      status: 'DRAFT',
      remark: ''
    };
  }

  var model = emptyModel();

  function fieldRow(req, label, control) {
    return (
      '<div class="pts-rule-field"><label class="pts-rule-field__label">' +
      (req ? '<span class="erp-req">*</span>' : '') +
      escapeHtml(label) +
      '</label><div class="pts-rule-field__control">' +
      control +
      '</div></div>'
    );
  }

  function readDayCustom() {
    var sel = document.getElementById('fCrTplDayRange');
    if (!sel) return !!model.orderDayCustom;
    return sel.value === 'custom';
  }

  function readDayRange() {
    var sel = document.getElementById('fCrTplDayRange');
    if (!sel) return model.orderDayRange || 1;
    if (sel.value === 'custom') {
      var input = document.getElementById('fCrTplDayCustom');
      return input ? input.value : model.orderDayRange || '';
    }
    return sel.value;
  }

  function readMemberAudience() {
    var checked = document.querySelector('input[name="fCrTplMemberAudience"]:checked');
    if (!checked) return model.memberAudience || 'level';
    return checked.value === 'tag' || checked.value === 'segment' ? checked.value : 'level';
  }

  function readCheckedIds(selector) {
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) {
      if (selector === '[data-cr-tag]') return (model.memberTagIds || []).slice();
      if (selector === '[data-cr-segment]') return (model.memberSegmentIds || []).slice();
    }
    var ids = [];
    nodes.forEach(function (el) {
      if (el.checked) ids.push(el.getAttribute('data-cr-tag') || el.getAttribute('data-cr-segment'));
    });
    return ids;
  }

  function readMemberLevelIds() {
    var box = document.getElementById('fCrTplLevelAll');
    if (!box) return (model.memberLevelIds || []).slice();
    if (box.checked) return [];
    var ids = [];
    document.querySelectorAll('[data-cr-level]:checked').forEach(function (el) {
      ids.push(el.getAttribute('data-cr-level'));
    });
    return ids;
  }

  function readMemberScope() {
    var box = document.getElementById('fCrTplLevelAll');
    if (!box) return model.memberScope || 'specific';
    return box.checked ? 'all' : 'specific';
  }

  function fieldValue(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback == null ? '' : fallback;
    return el.value;
  }

  function readModelFromDom() {
    var nameEl = document.getElementById('fCrTplName');
    var ports = [];
    document.querySelectorAll('[data-cr-tpl-port]:checked').forEach(function (el) {
      ports.push(el.getAttribute('data-cr-tpl-port'));
    });
    var typeEl = document.querySelector('input[name="fCrTplRewardType"]:checked');
    var rewardType = typeEl && typeEl.value ? typeEl.value : 'fixed';
    var tiers = [];
    document.querySelectorAll('[data-cr-tier]').forEach(function (row) {
      tiers.push({
        amount: (row.querySelector('[data-tier-amount]') || {}).value || '',
        amountMin: (row.querySelector('[data-tier-min]') || {}).value || '',
        amountMax: (row.querySelector('[data-tier-max]') || {}).value || '',
        count: (row.querySelector('[data-tier-count]') || {}).value || '',
        expected: (row.querySelector('[data-tier-expected]') || {}).value || '',
        probability: (row.querySelector('[data-tier-prob]') || {}).value || '',
        issued: Number(row.getAttribute('data-tier-issued') || 0)
      });
    });
    return {
      id: model.id,
      name: nameEl ? nameEl.value : '',
      startAt: fieldValue('fCrTplStartAt', model.startAt),
      endAt: fieldValue('fCrTplEndAt', model.endAt),
      ports: ports,
      rewardType: rewardType,
      claimTimesMode: (document.getElementById('fCrTplClaimTimes') || {}).value === 'per_user' ? 'per_user' : 'unlimited',
      singleAmount: fieldValue('fCrTplSingle', model.singleAmount),
      totalAmount: fieldValue('fCrTplTotal', model.totalAmount),
      packetTotal: fieldValue('fCrTplPacket', model.packetTotal),
      tiers: tiers.length ? tiers : model.tiers,
      budgetUsed: model.budgetUsed,
      packetIssued: model.packetIssued,
      claimCondition: (document.getElementById('fCrTplClaim') || {}).value || 'none',
      registerDays: fieldValue('fCrTplRegisterDays', model.registerDays),
      orderCount: fieldValue('fCrTplOrderCount', model.orderCount),
      orderAmount: fieldValue('fCrTplOrderAmount', model.orderAmount),
      orderDayRange: readDayRange(),
      orderDayCustom: readDayCustom(),
      memberAudience: readMemberAudience(),
      memberScope: readMemberScope(),
      memberLevelIds: readMemberLevelIds(),
      memberTagIds: readCheckedIds('[data-cr-tag]'),
      memberSegmentIds: readCheckedIds('[data-cr-segment]'),
      status: model.status,
      remark: model.remark,
      createdAt: model.createdAt
    };
  }

  function render() {
    var dis = locked ? ' disabled' : '';
    var rewardType = model.rewardType || 'fixed';
    var portHtml =
      '<div class="pts-rule-check-row">' +
      '<label class="pts-rule-check-label"><input type="checkbox" data-cr-tpl-port="mini"' +
      (model.ports.indexOf('mini') >= 0 ? ' checked' : '') +
      dis +
      '> 小程序</label>' +
      '<label class="pts-rule-check-label"><input type="checkbox" data-cr-tpl-port="app"' +
      (model.ports.indexOf('app') >= 0 ? ' checked' : '') +
      dis +
      '> APP</label></div>' +
      '<div class="pts-rule-tip">只决定用户能在哪些终端领取，不影响发放人数。同一红包只能领取一次。</div>';

    var rewardHtml = renderRewardHtml(rewardType, dis);

    var claim = model.claimCondition;
    if (claim === 'order') claim = 'order_count';
    if (claim !== 'register' && claim !== 'order_count' && claim !== 'order_amount') claim = 'none';
    var orderClaim = claim === 'order_count' || claim === 'order_amount';
    var dayRange = model.orderDayRange === '' || model.orderDayRange == null ? '' : Number(model.orderDayRange);
    var dayCustom = !!model.orderDayCustom || (dayRange !== '' && (Store.DAY_RANGE_OPTIONS || []).indexOf(dayRange) < 0);
    var dayOptions = (Store.DAY_RANGE_OPTIONS || [1])
      .map(function (n) {
        return (
          '<option value="' +
          n +
          '"' +
          (!dayCustom && Number(dayRange) === n ? ' selected' : '') +
          '>' +
          escapeHtml(Store.dayRangeLabel(n)) +
          '</option>'
        );
      })
      .join('');
    dayOptions += '<option value="custom"' + (dayCustom ? ' selected' : '') + '>自定义</option>';
    var claimExtra = '';
    if (claim === 'register') {
      claimExtra =
        '<span class="pts-rule-unit__text">注册</span><input class="erp-input mkt-cr-claim-extra" id="fCrTplRegisterDays" type="number" min="1" step="1" placeholder="请输入天数" value="' +
        escapeHtml(model.registerDays ? String(model.registerDays) : '') +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">天内用户</span>';
    } else if (claim === 'order_count') {
      claimExtra =
        '<input class="erp-input mkt-cr-claim-extra" id="fCrTplOrderCount" type="number" min="1" step="1" placeholder="请输入笔数" value="' +
        escapeHtml(model.orderCount ? String(model.orderCount) : '') +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">笔</span>';
    } else if (claim === 'order_amount') {
      claimExtra =
        '<input class="erp-input mkt-cr-claim-extra" id="fCrTplOrderAmount" type="number" min="0.01" step="0.01" placeholder="请输入金额" value="' +
        escapeHtml(model.orderAmount ? String(model.orderAmount) : '') +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">元</span>';
    }
    var claimHtml =
      '<div class="mkt-cr-claim-row">' +
      '<select class="erp-select mkt-cr-claim-select" id="fCrTplClaim"' +
      dis +
      '>' +
      '<option value="none"' +
      (claim === 'none' ? ' selected' : '') +
      '>' +
      escapeHtml(Store.CLAIM_LABEL.none) +
      '</option>' +
      '<option value="register"' +
      (claim === 'register' ? ' selected' : '') +
      '>' +
      escapeHtml(Store.CLAIM_LABEL.register) +
      '</option>' +
      '<option value="order_amount"' +
      (claim === 'order_amount' ? ' selected' : '') +
      '>' +
      escapeHtml(Store.CLAIM_LABEL.order_amount) +
      '</option>' +
      '<option value="order_count"' +
      (claim === 'order_count' ? ' selected' : '') +
      '>' +
      escapeHtml(Store.CLAIM_LABEL.order_count) +
      '</option>' +
      '</select>' +
      claimExtra +
      '</div>' +
      '<div class="pts-rule-tip">无条件不限制领取用户。新注册按注册至今天数判断。后两项分别按累计天数范围统计下单金额或笔数。未满足时客户端提示：新注册「抱歉，您暂不符合领取条件！」；金额「您的累计下单金额未达到领取条件！」；笔数「您的累计下单笔数未达到领取条件！」。</div>';
    var dayHtml =
      '<div class="pts-rule-unit mkt-cr-day-row">' +
      '<select class="erp-select mkt-cr-day-select" id="fCrTplDayRange"' +
      (locked ? ' disabled' : '') +
      '>' +
      dayOptions +
      '</select>' +
      (dayCustom
        ? '<input class="erp-input mkt-cr-day-custom" id="fCrTplDayCustom" type="number" min="1" step="1" placeholder="请输入天数" value="' +
          escapeHtml(dayRange ? String(dayRange) : '') +
          '"' +
          (locked ? ' disabled' : '') +
          '><span class="pts-rule-unit__text">天</span>'
        : '') +
      '<span class="pts-rule-unit__text" id="fCrTplDayHint">' +
      escapeHtml(Store.dayRangeHint(dayRange, claim)) +
      '</span></div>';
    var html = '';
    html += '<div class="pts-rule-card"><div class="pts-rule-card__title">基本信息</div><div class="pts-rule-card__body">';
    html += fieldRow(
      true,
      '红包名称',
      '<input class="erp-input pts-rule-field__input--name" id="fCrTplName" type="text" maxlength="50" placeholder="请输入红包名称" value="' +
        escapeHtml(model.name) +
        '"' +
        dis +
        '><div class="pts-rule-tip">最多 50 个字符</div>'
    );
    html += fieldRow(true, '有效时间', renderTimeHtml(dis));
    html += '</div></div>';
    html += '<div class="pts-rule-card"><div class="pts-rule-card__title">发放规则</div><div class="pts-rule-card__body">';
    html += fieldRow(true, '领取条件', claimHtml);
    html +=
      '<div class="pts-rule-field" id="fCrTplDayField"' +
      (orderClaim ? '' : ' hidden style="display:none"') +
      '><label class="pts-rule-field__label"><span class="erp-req">*</span>累计天数范围</label><div class="pts-rule-field__control">' +
      dayHtml +
      '</div></div>';
    html += fieldRow(true, '奖励类型', rewardHtml);
    var claimTimes = model.claimTimesMode === 'per_user' ? 'per_user' : 'unlimited';
    html += fieldRow(
      true,
      '领取次数',
      '<select class="erp-select" id="fCrTplClaimTimes"' +
        dis +
        '><option value="per_user"' +
        (claimTimes === 'per_user' ? ' selected' : '') +
        '>每人限领</option><option value="unlimited"' +
        (claimTimes === 'unlimited' ? ' selected' : '') +
        '>不限次数</option></select>'
    );
    html += fieldRow(true, '参与会员', renderMemberHtml(dis));
    html += fieldRow(true, '活动领取终端', portHtml);
    html += '</div></div>';
    var panel = document.getElementById('crTplFormPanel');
    if (panel) panel.innerHTML = html;
    bindReward();
    bindClaim();
    bindMembers();
    bindActivityTime();
  }

  function renderTimeHtml(dis) {
    var minAttr = dis ? '' : ' min="' + escapeHtml(Store.currentMinuteValue()) + '"';
    return (
      '<div class="mkt-rg-datetime-row">' +
      '<div class="mkt-rg-datetime-wrap" id="fCrTplStartWrap">' +
      '<input class="erp-input" id="fCrTplStartAt" type="datetime-local" step="60" title="开始时间" value="' +
      escapeHtml(model.startAt || '') +
      '"' +
      minAttr +
      dis +
      '>' +
      '<button type="button" class="mkt-rg-datetime-clear" data-clear-for="fCrTplStartAt" aria-label="清空开始时间"' +
      (dis ? ' disabled' : '') +
      '>×</button></div>' +
      '<span class="sep">至</span>' +
      '<div class="mkt-rg-datetime-wrap" id="fCrTplEndWrap">' +
      '<input class="erp-input" id="fCrTplEndAt" type="datetime-local" step="60" title="结束时间" value="' +
      escapeHtml(model.endAt || '') +
      '"' +
      minAttr +
      dis +
      '>' +
      '<button type="button" class="mkt-rg-datetime-clear" data-clear-for="fCrTplEndAt" aria-label="清空结束时间"' +
      (dis ? ' disabled' : '') +
      '>×</button></div></div>'
    );
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  function applyActivityTimeMin() {
    var start = document.getElementById('fCrTplStartAt');
    var end = document.getElementById('fCrTplEndAt');
    if (!start || start.disabled) return;
    var now = Store.currentMinuteValue();
    start.min = now;
    if (end) end.min = start.value && start.value > now ? start.value : now;
  }

  function bindActivityTime() {
    [
      ['fCrTplStartWrap', 'fCrTplStartAt'],
      ['fCrTplEndWrap', 'fCrTplEndAt']
    ].forEach(function (pair) {
      var input = document.getElementById(pair[1]);
      if (input) {
        input.addEventListener('focus', applyActivityTimeMin);
        input.addEventListener('input', function () {
          applyActivityTimeMin();
          syncDatetimeClear(pair[0], pair[1]);
        });
        input.addEventListener('change', function () {
          applyActivityTimeMin();
          syncDatetimeClear(pair[0], pair[1]);
        });
      }
      syncDatetimeClear(pair[0], pair[1]);
    });
    applyActivityTimeMin();
    document.querySelectorAll('.mkt-rg-datetime-clear').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var input = document.getElementById(btn.getAttribute('data-clear-for'));
        if (!input || input.disabled) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  }

  function renderMemberHtml(dis) {
    var audience = model.memberAudience === 'tag' || model.memberAudience === 'segment' ? model.memberAudience : 'level';
    var radios = ['level', '会员等级', 'tag', '会员标签', 'segment', '会员分群'];
    var radioHtml = '';
    for (var i = 0; i < radios.length; i += 2) {
      radioHtml +=
        '<label class="pts-rule-check-label"><input type="radio" name="fCrTplMemberAudience" value="' +
        radios[i] +
        '"' +
        (audience === radios[i] ? ' checked' : '') +
        dis +
        '> ' +
        radios[i + 1] +
        '</label>';
    }
    return (
      '<div class="pts-rule-check-row">' +
      radioHtml +
      '</div>' +
      '<div class="mkt-cr-audience-panels">' +
      renderLevelPanel(dis, audience) +
      renderTagPanel(dis, audience) +
      renderSegmentPanel(dis, audience) +
      '</div>' +
      '<div class="pts-rule-tip">按会员等级、会员分群或会员标签限定可领取用户。全部层级不限制。不在范围内时，客户端提示「抱歉，您暂不符合该红包的领取条件！」。</div>'
    );
  }

  function renderLevelPanel(dis, audience) {
    var options = Store.memberLevelOptions ? Store.memberLevelOptions() : [];
    var allOn = model.memberScope === 'all';
    var picked = allOn ? [] : model.memberLevelIds || [];
    var grid = options
      .map(function (level) {
        var checked = allOn || picked.indexOf(String(level.id)) >= 0;
        return (
          '<label class="pts-rule-check-label"><input type="checkbox" data-cr-level="' +
          escapeHtml(level.id) +
          '"' +
          (checked ? ' checked' : '') +
          dis +
          '> ' +
          escapeHtml(level.name) +
          '</label>'
        );
      })
      .join('');
    if (!grid) grid = '<span class="pts-rule-unit__text">暂无启用中的会员等级</span>';
    return (
      '<div id="fCrTplMemberLevel"' +
      (audience === 'level' ? '' : ' hidden') +
      '><label class="pts-rule-check-label mkt-cr-level-all"><input type="checkbox" id="fCrTplLevelAll"' +
      (allOn ? ' checked' : '') +
      dis +
      '> 全部层级</label><div class="mkt-cr-level-grid">' +
      grid +
      '</div></div>'
    );
  }

  function renderTagPanel(dis, audience) {
    var groups = Store.memberTagGroups ? Store.memberTagGroups() : [];
    var picked = model.memberTagIds || [];
    var html = groups
      .map(function (group) {
        var tags = (group.tags || [])
          .map(function (tag) {
            var checked = picked.indexOf(String(tag.id)) >= 0;
            return (
              '<label class="pts-rule-check-label"><input type="checkbox" data-cr-tag="' +
              escapeHtml(tag.id) +
              '" data-tag-group="' +
              escapeHtml(group.id) +
              '" data-tag-rule="' +
              escapeHtml(group.rule || 'multi') +
              '"' +
              (checked ? ' checked' : '') +
              dis +
              '> ' +
              escapeHtml(tag.name) +
              '</label>'
            );
          })
          .join('');
        return (
          '<div class="mkt-cr-tag-block"><div class="mkt-cr-tag-block__name">' +
          escapeHtml(group.name) +
          (group.rule === 'single' ? '（单选）' : '') +
          '</div><div class="mkt-cr-level-grid">' +
          tags +
          '</div></div>'
        );
      })
      .join('');
    if (!html) html = '<span class="pts-rule-unit__text">暂无启用中的会员标签</span>';
    return '<div id="fCrTplMemberTag"' + (audience === 'tag' ? '' : ' hidden') + '>' + html + '</div>';
  }

  function renderSegmentPanel(dis, audience) {
    var options = Store.memberSegmentOptions ? Store.memberSegmentOptions() : [];
    var picked = model.memberSegmentIds || [];
    var grid = options
      .map(function (seg) {
        var checked = picked.indexOf(String(seg.id)) >= 0;
        return (
          '<label class="pts-rule-check-label"><input type="checkbox" data-cr-segment="' +
          escapeHtml(seg.id) +
          '"' +
          (checked ? ' checked' : '') +
          dis +
          '> ' +
          escapeHtml(seg.name) +
          '</label>'
        );
      })
      .join('');
    if (!grid) grid = '<span class="pts-rule-unit__text">暂无启用中的会员分群</span>';
    return (
      '<div id="fCrTplMemberSegment"' +
      (audience === 'segment' ? '' : ' hidden') +
      '><div class="mkt-cr-level-grid">' +
      grid +
      '</div></div>'
    );
  }

  function bindMembers() {
    document.querySelectorAll('input[name="fCrTplMemberAudience"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.disabled) return;
        model = Object.assign(model, readModelFromDom());
        render();
      });
    });
    var allBox = document.getElementById('fCrTplLevelAll');
    if (allBox && !allBox.disabled) {
      allBox.addEventListener('change', function () {
        document.querySelectorAll('[data-cr-level]').forEach(function (el) {
          el.checked = allBox.checked;
        });
        model.memberScope = allBox.checked ? 'all' : 'specific';
        model.memberLevelIds = allBox.checked ? [] : readMemberLevelIds();
      });
      document.querySelectorAll('[data-cr-level]').forEach(function (el) {
        el.addEventListener('change', function () {
          var boxes = document.querySelectorAll('[data-cr-level]');
          var checked = document.querySelectorAll('[data-cr-level]:checked');
          allBox.checked = boxes.length > 0 && checked.length === boxes.length;
          model.memberScope = allBox.checked ? 'all' : 'specific';
          model.memberLevelIds = readMemberLevelIds();
        });
      });
    }
    document.querySelectorAll('[data-cr-tag]').forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.disabled) return;
        if (el.checked && el.getAttribute('data-tag-rule') === 'single') {
          var gid = el.getAttribute('data-tag-group');
          document.querySelectorAll('[data-cr-tag][data-tag-group="' + gid + '"]').forEach(function (other) {
            if (other !== el) other.checked = false;
          });
        }
        model.memberTagIds = readCheckedIds('[data-cr-tag]');
      });
    });
    document.querySelectorAll('[data-cr-segment]').forEach(function (el) {
      el.addEventListener('change', function () {
        if (el.disabled) return;
        model.memberSegmentIds = readCheckedIds('[data-cr-segment]');
      });
    });
  }

  function showNum(v) {
    if (v === '' || v == null) return '';
    if (Number(v) === 0) return '';
    return String(v);
  }

  function renderRewardHtml(rewardType, dis) {
    var types = [
      ['fixed', '固定金额'],
      ['random', '随机金额'],
      ['custom_fixed', '自定义（固定）'],
      ['custom_random', '自定义（随机）']
    ];
    var html = '<div class="pts-rule-check-row">';
    types.forEach(function (pair) {
      html +=
        '<label class="pts-rule-check-label"><input type="radio" name="fCrTplRewardType" value="' +
        pair[0] +
        '"' +
        (rewardType === pair[0] ? ' checked' : '') +
        dis +
        '> ' +
        pair[1] +
        '</label>';
    });
    html += '</div>';
    if (rewardType === 'fixed') {
      html +=
        '<div class="mkt-cr-reward-block"><div class="pts-rule-unit"><span class="pts-rule-unit__text"><span class="erp-req">*</span>单个金额</span><input class="erp-input" id="fCrTplSingle" type="number" min="0.01" step="0.01" placeholder="请输入单个金额" value="' +
        escapeHtml(showNum(model.singleAmount)) +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">元</span></div>';
      html += packetTotalHtml(dis) + '</div>';
    } else if (rewardType === 'random') {
      var totalRaw = model.totalAmount == null ? '' : String(model.totalAmount);
      html +=
        '<div class="mkt-cr-reward-block"><div class="pts-rule-unit"><span class="pts-rule-unit__text"><span class="erp-req">*</span>总计金额</span><input class="erp-input" id="fCrTplTotal" type="text" inputmode="numeric" maxlength="6" placeholder="请输入1-6位整数" value="' +
        escapeHtml(totalRaw) +
        '"' +
        dis +
        '></div>';
      html += packetTotalHtml(dis) + '</div>';
    } else {
      html += renderTierTable(rewardType, dis);
    }
    return html;
  }

  function packetTotalHtml(dis) {
    return (
      '<div class="pts-rule-unit" style="margin-top:10px"><span class="pts-rule-unit__text"><span class="erp-req">*</span>红包总数</span><input class="erp-input" id="fCrTplPacket" type="number" min="1" step="1" placeholder="请输入红包总数" value="' +
      escapeHtml(showNum(model.packetTotal)) +
      '"' +
      dis +
      '></div>'
    );
  }

  function renderTierTable(rewardType, dis) {
    var random = rewardType === 'custom_random';
    var tiers = model.tiers && model.tiers.length ? model.tiers : [{}];
    var head = random
      ? '<span>红包金额区间</span><span>红包数量</span><span>期望奖金(即平均值)</span><span>中奖概率</span><span></span>'
      : '<span>红包金额</span><span>红包数量</span><span>中奖概率</span><span></span>';
    var rows = tiers
      .map(function (t, i) {
        var remove =
          tiers.length > 1 && !locked
            ? '<button type="button" class="mkt-cr-tier-remove" data-tier-remove="' + i + '">删除</button>'
            : '<span class="mkt-cr-tier-remove-slot"></span>';
        if (random) {
          return (
            '<div class="mkt-cr-tier mkt-cr-tier--random" data-cr-tier data-tier-issued="' +
            escapeHtml(String(t.issued || 0)) +
            '"><span class="mkt-cr-tier-range"><input class="erp-input" data-tier-min type="number" min="0.01" step="0.01" placeholder="请输入" value="' +
            escapeHtml(showNum(t.amountMin)) +
            '"' +
            dis +
            '><span>-</span><input class="erp-input" data-tier-max type="number" min="0.01" step="0.01" placeholder="请输入" value="' +
            escapeHtml(showNum(t.amountMax)) +
            '"' +
            dis +
            '></span><input class="erp-input" data-tier-count type="number" min="1" step="1" placeholder="请输入" value="' +
            escapeHtml(showNum(t.count)) +
            '"' +
            dis +
            '><input class="erp-input" data-tier-expected type="number" min="0" step="0.01" placeholder="0表示随机不限" value="' +
            escapeHtml(t.expected === 0 || t.expected ? String(t.expected) : '') +
            '"' +
            dis +
            '><span class="mkt-cr-prob"><input class="erp-input" data-tier-prob type="number" min="0" max="100" step="0.01" placeholder="请输入" value="' +
            escapeHtml(showNum(t.probability)) +
            '"' +
            dis +
            '><span>%</span></span>' +
            remove +
            '</div>'
          );
        }
        return (
          '<div class="mkt-cr-tier" data-cr-tier data-tier-issued="' +
          escapeHtml(String(t.issued || 0)) +
          '"><input class="erp-input" data-tier-amount type="number" min="0.01" step="0.01" placeholder="请输入" value="' +
          escapeHtml(showNum(t.amount)) +
          '"' +
          dis +
          '><input class="erp-input" data-tier-count type="number" min="1" step="1" placeholder="请输入" value="' +
          escapeHtml(showNum(t.count)) +
          '"' +
          dis +
          '><span class="mkt-cr-prob"><input class="erp-input" data-tier-prob type="number" min="0" max="100" step="0.01" placeholder="请输入" value="' +
          escapeHtml(showNum(t.probability)) +
          '"' +
          dis +
          '><span>%</span></span>' +
          remove +
          '</div>'
        );
      })
      .join('');
    var sums = tierSums(tiers, random);
    var sumText = random
      ? '红包总额：' + sums.minMoney + '-' + sums.maxMoney + '　　红包总数：' + sums.count
      : '红包总额：' + sums.money + '　　红包总数：' + sums.count;
    return (
      '<div class="mkt-cr-reward-block"><div class="mkt-cr-tier-table' +
      (random ? ' mkt-cr-tier-table--random' : '') +
      '"><div class="mkt-cr-tier-head' +
      (random ? ' mkt-cr-tier-head--random' : '') +
      '">' +
      head +
      '</div>' +
      rows +
      '</div>' +
      (locked || tiers.length >= 20 ? '' : '<button type="button" class="mkt-cr-reward-add" id="fCrTplTierAdd">+</button>') +
      (random ? '<div class="mkt-cr-field-error">红包金额区间最小值 ≤ 期望奖金 ≤ 红包金额区间最大值</div>' : '') +
      '<div class="mkt-cr-reward-sum" id="fCrTplTierSum">' +
      sumText +
      '</div></div>'
    );
  }

  function tierSums(tiers, random) {
    var money = 0;
    var minMoney = 0;
    var maxMoney = 0;
    var count = 0;
    (tiers || []).forEach(function (t) {
      var qty = Math.max(0, Math.round(Number(t.count) || 0));
      count += qty;
      if (random) {
        minMoney += (Number(t.amountMin) || 0) * qty;
        maxMoney += (Number(t.amountMax) || 0) * qty;
      } else {
        money += (Number(t.amount) || 0) * qty;
      }
    });
    return {
      money: money.toFixed(2),
      minMoney: minMoney.toFixed(2),
      maxMoney: maxMoney.toFixed(2),
      count: count
    };
  }

  function bindReward() {
    document.querySelectorAll('input[name="fCrTplRewardType"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        model = Object.assign(model, readModelFromDom());
        render();
      });
    });
    var add = document.getElementById('fCrTplTierAdd');
    if (add) {
      add.addEventListener('click', function () {
        model = Object.assign(model, readModelFromDom());
        if ((model.tiers || []).length >= 20) {
          toast('最多添加20条', 'warning');
          return;
        }
        model.tiers = (model.tiers || []).concat([{ amount: '', amountMin: '', amountMax: '', count: '', expected: '', probability: '' }]);
        render();
      });
    }
    document.querySelectorAll('[data-tier-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var index = Number(btn.getAttribute('data-tier-remove'));
        model = Object.assign(model, readModelFromDom());
        model.tiers.splice(index, 1);
        render();
      });
    });
    document.querySelectorAll('[data-cr-tier] input').forEach(function (input) {
      input.addEventListener('input', function () {
        var rows = [];
        document.querySelectorAll('[data-cr-tier]').forEach(function (row) {
          rows.push({
            amount: (row.querySelector('[data-tier-amount]') || {}).value,
            amountMin: (row.querySelector('[data-tier-min]') || {}).value,
            amountMax: (row.querySelector('[data-tier-max]') || {}).value,
            count: (row.querySelector('[data-tier-count]') || {}).value
          });
        });
        var sum = document.getElementById('fCrTplTierSum');
        if (!sum) return;
        var calc = tierSums(rows, model.rewardType === 'custom_random');
        sum.textContent =
          model.rewardType === 'custom_random'
            ? '红包总额：' + calc.minMoney + '-' + calc.maxMoney + '　　红包总数：' + calc.count
            : '红包总额：' + calc.money + '　　红包总数：' + calc.count;
      });
    });
  }

  function bindClaim() {
    var claimSel = document.getElementById('fCrTplClaim');
    if (claimSel) {
      claimSel.addEventListener('change', function () {
        model = Object.assign(model, readModelFromDom());
        render();
      });
    }
    var daySel = document.getElementById('fCrTplDayRange');
    if (daySel) {
      daySel.addEventListener('change', function () {
        var previous = model.orderDayRange;
        model = Object.assign(model, readModelFromDom());
        if (daySel.value === 'custom') {
          model.orderDayCustom = true;
          if ((Store.DAY_RANGE_OPTIONS || []).indexOf(Number(previous)) >= 0) model.orderDayRange = '';
        } else {
          model.orderDayCustom = false;
          model.orderDayRange = Number(daySel.value) || 1;
        }
        render();
      });
    }
    var dayCustomInput = document.getElementById('fCrTplDayCustom');
    if (dayCustomInput) {
      dayCustomInput.addEventListener('input', function () {
        model.orderDayRange = dayCustomInput.value;
        model.orderDayCustom = true;
        var hint = document.getElementById('fCrTplDayHint');
        if (hint) hint.textContent = Store.dayRangeHint(dayCustomInput.value, (document.getElementById('fCrTplClaim') || {}).value);
      });
    }
  }

  function setHidden(el, hidden) {
    if (el) el.hidden = !!hidden;
  }

  function goList(msg) {
    if (msg) toast(msg, 'success');
    setTimeout(function () {
      window.location.href = listHref();
    }, 400);
  }

  function saveDraft() {
    var result = Store.saveDraft(readModelFromDom());
    if (!result.ok) {
      toast(result.message, 'warning');
      return;
    }
    goList('已保存草稿');
  }

  function submit() {
    var result = Store.submit(readModelFromDom());
    if (!result.ok) {
      toast(result.message, 'warning');
      return;
    }
    goList('已提交审核');
  }

  var opinion = { read: function () { return ''; } };

  document.addEventListener('DOMContentLoaded', function () {
    var audit = auditId ? Store.findAudit(auditId) : null;
    if (mode === 'audit' && (!audit || audit.status !== 'PENDING')) mode = 'view';
    if (mode === 'add') {
      model = emptyModel();
    } else if (audit && audit.snapshot && (mode === 'view' || mode === 'audit')) {
      model = Store.normalize(audit.snapshot);
    } else {
      var item = Store.getById(editId);
      if (!item && audit && audit.snapshot) model = Store.normalize(audit.snapshot);
      else item = item || null;
      if (!item && !model.id) {
        toast('现金红包不存在', 'warning');
        window.location.href = listHref();
        return;
      }
      if (item) model = item;
      if (mode === 'edit' && model && (model.status === 'PENDING' || model.status === 'ACTIVE')) mode = 'view';
    }
    locked = mode === 'view' || mode === 'audit';
    var titles = { add: '新建现金红包', edit: '编辑现金红包', view: '查看现金红包', audit: '审核现金红包' };
    var tab = document.getElementById('crTplFormTab');
    if (tab) tab.textContent = titles[mode] || '现金红包';
    document.title = '冷丰WMS - ' + (titles[mode] || '现金红包');
    var tip = document.getElementById('crTplFormTip');
    if (tip && mode === 'audit') {
      tip.innerHTML = '以下为提交时的现金红包模版，只读。审核成功后需再<strong>启用</strong>，才可被注册有礼及其他模块关联。';
    }
    var canEdit = mode === 'add' || mode === 'edit';
    var canAudit = mode === 'audit' || (!fromAudit && mode === 'view' && model.status === 'PENDING');
    setHidden(document.getElementById('crTplBtnSave'), !canEdit);
    setHidden(document.getElementById('crTplBtnSubmit'), !canEdit);
    setHidden(document.getElementById('crTplBtnReject'), !canAudit);
    setHidden(document.getElementById('crTplBtnApprove'), !canAudit);
    if (window.MdmMarketingAuditPanel && (fromAudit || canAudit)) {
      if (!audit && model && model.id && typeof Store.latestAuditOf === 'function') {
        audit = Store.latestAuditOf(model.id, 'PENDING') || Store.latestAuditOf(model.id);
      }
      opinion = window.MdmMarketingAuditPanel.mount(document.getElementById('crTplAuditPanel'), audit, canAudit);
    }
    render();

    var back = document.getElementById('crTplFormBack');
    if (back) {
      back.href = listHref();
      back.textContent = fromAudit ? '← 返回现金红包审核' : '← 返回现金红包模版';
    }
    var cancel = document.getElementById('crTplBtnCancel');
    if (cancel) cancel.addEventListener('click', function () { window.location.href = listHref(); });
    var saveBtn = document.getElementById('crTplBtnSave');
    if (saveBtn) saveBtn.addEventListener('click', saveDraft);
    var submitBtn = document.getElementById('crTplBtnSubmit');
    if (submitBtn) submitBtn.addEventListener('click', submit);
    var approveBtn = document.getElementById('crTplBtnApprove');
    if (approveBtn) {
      approveBtn.addEventListener('click', function () {
        var note = opinion.read();
        var result = auditId ? Store.approveAudit(auditId, note) : Store.approve(model.id, note);
        if (!result.ok) {
          toast(result.message, 'warning');
          return;
        }
        goList('审核成功');
      });
    }
    var rejectBtn = document.getElementById('crTplBtnReject');
    if (rejectBtn) {
      rejectBtn.addEventListener('click', function () {
        var reason = opinion.read();
        if (!reason) {
          toast('请填写驳回原因', 'error');
          return;
        }
        var result = auditId ? Store.rejectAudit(auditId, reason) : Store.reject(model.id, reason);
        if (!result.ok) {
          toast(result.message, 'warning');
          return;
        }
        goList('已标记审核失败');
      });
    }
  });
})();
