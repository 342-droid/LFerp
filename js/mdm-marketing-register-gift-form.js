/**
 * 营销活动 — 注册有礼 新增/编辑
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingRegisterGiftStore;
  if (!Store) return;

  var wp = window.wmsPath || {
    page: function (f) {
      return f;
    }
  };

  var params = new URLSearchParams(window.location.search || '');
  var editId = params.get('id') || params.get('Id') || '';
  var editing = !!editId;

  function emptyReward() {
    return {
      couponEnabled: false,
      pointsEnabled: false,
      cashEnabled: false,
      coupons: [{ coupon: '', qty: 1 }],
      points: 0,
      cashTemplateId: '',
      cashMin: 0,
      cashMax: 0,
      cashBudgetTotal: 0,
      cashBudgetUsed: 0
    };
  }

  /** 从已存奖励还原表单态（有券/积分/红包则默认开启对应开关） */
  function rewardFromStored(r) {
    r = Store.normalizeReward(r || {});
    var coupons = Array.isArray(r.coupons)
      ? r.coupons
          .filter(function (c) {
            return c && c.coupon;
          })
          .map(function (c) {
            return { coupon: c.coupon, qty: c.qty };
          })
      : [];
    var points = Math.max(0, Math.round(Number(r.points) || 0));
    var couponEnabled = coupons.length > 0;
    var pointsEnabled = points > 0;
    var cashEnabled = !!r.cashEnabled;
    return {
      couponEnabled: couponEnabled,
      pointsEnabled: pointsEnabled,
      cashEnabled: cashEnabled,
      coupons: couponEnabled ? coupons : [{ coupon: '', qty: 1 }],
      points: points,
      cashTemplateId: r.cashTemplateId || '',
      cashMin: r.cashMin || 0,
      cashMax: r.cashMax || 0,
      cashBudgetTotal: r.cashBudgetTotal || 0,
      cashBudgetUsed: r.cashBudgetUsed || 0
    };
  }

  /** 当前表单态：端口、场景、各场景奖励（含开启开关） */
  var state = {
    port: 'mini',
    scenes: ['new_register'],
    rewards: {
      new_register: emptyReward()
    }
  };

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
    return wp.page('mdm_marketing_register_gift.html');
  }

  function getPort() {
    var checked = document.querySelector('input[name="rgPort"]:checked');
    return checked && checked.value === 'app' ? 'app' : 'mini';
  }

  function syncDatetimeClear(wrapId, inputId) {
    var wrap = document.getElementById(wrapId);
    var input = document.getElementById(inputId);
    if (!wrap || !input) return;
    wrap.classList.toggle('has-value', !!input.value);
  }

  function bindDatetimeClears() {
    [
      ['rgStartWrap', 'rgStartAt'],
      ['rgEndWrap', 'rgEndAt']
    ].forEach(function (pair) {
      var wrapId = pair[0];
      var inputId = pair[1];
      var input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', function () {
          syncDatetimeClear(wrapId, inputId);
        });
        input.addEventListener('change', function () {
          syncDatetimeClear(wrapId, inputId);
        });
      }
      syncDatetimeClear(wrapId, inputId);
    });

    document.querySelectorAll('.mkt-rg-datetime-clear').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-clear-for');
        var input = id && document.getElementById(id);
        if (!input) return;
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      });
    });
  }

  function couponOptionsHtml(selected) {
    var opts =
      '<option value="">请选择优惠券</option>' +
      Store.COUPON_OPTIONS.map(function (name) {
        var sel = name === selected ? ' selected' : '';
        return '<option value="' + escapeHtml(name) + '"' + sel + '>' + escapeHtml(name) + '</option>';
      }).join('');
    return opts;
  }

  function buildCouponRowHtml(item) {
    item = item || { coupon: '', qty: 1 };
    return (
      '<div class="mkt-rg-coupon-row" data-coupon-row>' +
      '<select class="erp-input" data-coupon-name>' +
      couponOptionsHtml(item.coupon || '') +
      '</select>' +
      '<div class="mkt-rg-coupon-qty">' +
      '<input class="erp-input" type="number" min="1" step="1" value="' +
      escapeHtml(String(item.qty || 1)) +
      '" data-coupon-qty>' +
      '<em>张</em>' +
      '</div>' +
      '<button type="button" class="mkt-rg-coupon-remove" data-coupon-remove>删除</button>' +
      '</div>'
    );
  }

  /** 奖励卡：左右字段布局对齐会员等级权益（先开关再配置） */

  function setControlsDisabled(root, disabled) {
    if (!root) return;
    root.querySelectorAll('input, select, textarea, button').forEach(function (el) {
      if (el.getAttribute('data-benefit-switch') != null) return;
      el.disabled = !!disabled;
    });
  }

  function syncBenefitSwitch(field) {
    var sw = field.querySelector('[data-benefit-switch]');
    var body = field.querySelector('[data-benefit-body]');
    if (!sw || !body) return;
    var on = !!sw.checked;
    body.classList.toggle('is-disabled', !on);
    body.hidden = !on;
    setControlsDisabled(body, !on);
  }

  function bindBenefitSwitches(card) {
    if (!card) return;
    card.querySelectorAll('[data-benefit]').forEach(function (field) {
      var sw = field.querySelector('[data-benefit-switch]');
      if (!sw) return;
      sw.addEventListener('change', function () {
        syncBenefitSwitch(field);
      });
      syncBenefitSwitch(field);
    });
  }

  function collectRewardFromCard(card) {
    var scene = card.getAttribute('data-scene');
    var couponField = card.querySelector('[data-benefit="coupon"]');
    var pointsField = card.querySelector('[data-benefit="points"]');
    var cashField = card.querySelector('[data-benefit="cash"]');
    var couponEnabled = !!(couponField && couponField.querySelector('[data-benefit-switch]') && couponField.querySelector('[data-benefit-switch]').checked);
    var pointsEnabled = !!(pointsField && pointsField.querySelector('[data-benefit-switch]') && pointsField.querySelector('[data-benefit-switch]').checked);
    var cashEnabled = !!(cashField && cashField.querySelector('[data-benefit-switch]') && cashField.querySelector('[data-benefit-switch]').checked);

    var coupons = [];
    if (couponEnabled) {
      card.querySelectorAll('[data-coupon-row]').forEach(function (row) {
        var coupon = ((row.querySelector('[data-coupon-name]') || {}).value || '').trim();
        var qtyRaw = ((row.querySelector('[data-coupon-qty]') || {}).value || '').trim();
        var qty = Math.max(1, Math.round(Number(qtyRaw) || 1));
        coupons.push({ coupon: coupon, qty: qty });
      });
    }

    var points = 0;
    if (pointsEnabled) {
      var pointsEl = card.querySelector('[data-reward-points]');
      points = Math.max(0, Math.round(Number((pointsEl && pointsEl.value) || 0) || 0));
    }

    var cashTemplateId = '';
    var cashMin = 0;
    var cashMax = 0;
    var cashBudgetTotal = 0;
    var cashBudgetUsed = 0;
    var cashGlobalOn = typeof Store.isGlobalCashEnabled === 'function' ? Store.isGlobalCashEnabled() : true;
    /* 总开关关闭时不可改现金红包：保留原关联，避免误清空 */
    if (!cashGlobalOn) {
      var prevCash = state.rewards[scene] || emptyReward();
      cashEnabled = !!prevCash.cashEnabled;
      cashTemplateId = prevCash.cashTemplateId || '';
      cashMin = prevCash.cashMin || 0;
      cashMax = prevCash.cashMax || 0;
      cashBudgetTotal = prevCash.cashBudgetTotal || 0;
      cashBudgetUsed = prevCash.cashBudgetUsed || 0;
    } else if (cashEnabled && cashField) {
      cashTemplateId = String((cashField.querySelector('[data-cash-template]') || {}).value || '').trim();
      var prev = state.rewards[scene] || emptyReward();
      cashMin = prev.cashMin || 0;
      cashMax = prev.cashMax || 0;
      cashBudgetTotal = prev.cashBudgetTotal || 0;
      cashBudgetUsed = prev.cashBudgetUsed || 0;
    }

    return {
      scene: scene,
      reward: {
        couponEnabled: couponEnabled,
        pointsEnabled: pointsEnabled,
        cashEnabled: cashEnabled,
        coupons: coupons.length ? coupons : [{ coupon: '', qty: 1 }],
        points: points,
        cashTemplateId: cashTemplateId,
        cashMin: cashMin,
        cashMax: cashMax,
        cashBudgetTotal: cashBudgetTotal,
        cashBudgetUsed: cashBudgetUsed
      }
    };
  }

  /** 从 DOM 收集所有场景奖励到 state.rewards */
  function syncRewardsFromDom() {
    var host = document.getElementById('rgRewardHost');
    if (!host) return;
    host.querySelectorAll('[data-reward-card]').forEach(function (card) {
      var got = collectRewardFromCard(card);
      if (got.scene) state.rewards[got.scene] = got.reward;
    });
  }

  function renderScenes() {
    var row = document.getElementById('rgSceneRow');
    var tip = document.getElementById('rgSceneTip');
    if (!row) return;
    var port = state.port;
    if (port === 'mini') {
      row.innerHTML =
        '<label class="mkt-rg-check-label is-locked">' +
        '<input type="checkbox" value="new_register" checked disabled data-scene-cb> 新用户注册' +
        '</label>';
      if (tip) tip.textContent = '小程序仅支持「新用户注册」';
    } else {
      var hasNew = state.scenes.indexOf('new_register') >= 0;
      var hasOld = state.scenes.indexOf('old_first_download') >= 0;
      row.innerHTML =
        '<label class="mkt-rg-check-label">' +
        '<input type="checkbox" value="new_register" data-scene-cb' +
        (hasNew ? ' checked' : '') +
        '> 新用户注册</label>' +
        '<label class="mkt-rg-check-label">' +
        '<input type="checkbox" value="old_first_download" data-scene-cb' +
        (hasOld ? ' checked' : '') +
        '> 老用户下载</label>';
      if (tip) tip.textContent = 'APP 可多选场景，至少选择 1 个';
    }

    row.querySelectorAll('[data-scene-cb]').forEach(function (cb) {
      if (cb.disabled) return;
      cb.addEventListener('change', onSceneChange);
    });
  }

  function onSceneChange() {
    syncRewardsFromDom();
    var selected = [];
    document.querySelectorAll('#rgSceneRow [data-scene-cb]:checked').forEach(function (cb) {
      selected.push(cb.value);
    });
    if (state.port === 'mini') selected = ['new_register'];
    if (!selected.length) {
      toast('请至少选择一个场景', 'warning');
      renderScenes();
      return;
    }
    state.scenes = selected;
    selected.forEach(function (scene) {
      if (!state.rewards[scene]) state.rewards[scene] = emptyReward();
    });
    Object.keys(state.rewards).forEach(function (key) {
      if (selected.indexOf(key) < 0) delete state.rewards[key];
    });
    renderRewards();
  }

  function bindRewardCard(card) {
    bindBenefitSwitches(card);
    var listEl = card.querySelector('[data-coupon-list]');
    var addBtn = card.querySelector('[data-coupon-add]');
    if (addBtn && !addBtn._bound) {
      addBtn._bound = true;
      addBtn.addEventListener('click', function () {
        if (!listEl || addBtn.disabled) return;
        listEl.insertAdjacentHTML('beforeend', buildCouponRowHtml({ coupon: '', qty: 1 }));
      });
    }
    var cashSelect = card.querySelector('[data-cash-template]');
    if (cashSelect && !cashSelect._bound) {
      cashSelect._bound = true;
      cashSelect.addEventListener('change', function () {
        var tip = card.querySelector('[data-cash-template-tip]');
        if (tip) tip.textContent = cashTemplateHint(cashSelect.value);
      });
    }
    if (listEl && !listEl._bound) {
      listEl._bound = true;
      listEl.addEventListener('click', function (ev) {
        var removeBtn = ev.target.closest('[data-coupon-remove]');
        if (!removeBtn || removeBtn.disabled) return;
        var rows = listEl.querySelectorAll('[data-coupon-row]');
        if (rows.length <= 1) {
          toast('至少保留一行优惠券配置', 'warning');
          return;
        }
        var row = removeBtn.closest('[data-coupon-row]');
        if (row) row.remove();
      });
    }
  }

  function cashTemplatesForPort() {
    var T = window.MdmMarketingCashRedpackTplStore;
    if (!T || typeof T.listForAssociate !== 'function') return [];
    return T.listForAssociate({ port: state.port, scene: 'REGISTER_GIFT' });
  }

  function cashTemplateHint(templateId) {
    var T = window.MdmMarketingCashRedpackTplStore;
    if (!templateId || !T) return '请选择已启用、且活动领取终端包含当前活动端口的现金红包。';
    var tpl = T.getById(templateId);
    if (!tpl) return '关联的现金红包不存在，请重新选择。';
    var portOk = (tpl.ports || []).indexOf(state.port) >= 0;
    var extra = tpl.status !== 'ACTIVE' ? '当前未启用，保存前请先启用。' : portOk ? '' : '活动领取终端不包含当前活动端口。';
    return (
      T.rewardTypeText(tpl) +
      '，' +
      T.rewardContentText(tpl) +
      '；已发放 ' +
      T.toMoney(tpl.budgetUsed).toFixed(2) +
      ' 元；活动领取终端 ' +
      T.portsText(tpl) +
      (extra ? '。' + extra : '。')
    );
  }

  function renderRewards() {
    var host = document.getElementById('rgRewardHost');
    if (!host) return;
    host.innerHTML = state.scenes
      .map(function (scene) {
        var reward = state.rewards[scene] || emptyReward();
        var coupons = reward.coupons && reward.coupons.length ? reward.coupons : [{ coupon: '', qty: 1 }];
        var title = Store.sceneLabel(scene);
        var couponOn = !!reward.couponEnabled;
        var pointsOn = !!reward.pointsEnabled;
        var cashOn = !!reward.cashEnabled;
        var cashGlobalOn = typeof Store.isGlobalCashEnabled === 'function' ? Store.isGlobalCashEnabled() : true;
        if (!cashGlobalOn) cashOn = false;
        var cashLocked = !cashGlobalOn;
        var cashTemplateId = reward.cashTemplateId || '';
        var tplOptions = cashTemplatesForPort();
        var optionIds = tplOptions.map(function (it) {
          return it.id;
        });
        var Tpl = window.MdmMarketingCashRedpackTplStore;
        var selectedTpl = cashTemplateId && Tpl ? Tpl.getById(cashTemplateId) : null;
        var optionHtml =
          '<option value="">请选择现金红包</option>' +
          tplOptions
            .map(function (it) {
              return (
                '<option value="' +
                escapeHtml(it.id) +
                '"' +
                (it.id === cashTemplateId ? ' selected' : '') +
                '>' +
                escapeHtml(it.name) +
                '（' +
                escapeHtml(Tpl.rewardTypeText(it) + ' ' + Tpl.rewardContentText(it)) +
                '）</option>'
              );
            })
            .join('');
        if (selectedTpl && optionIds.indexOf(selectedTpl.id) < 0) {
          optionHtml +=
            '<option value="' +
            escapeHtml(selectedTpl.id) +
            '" selected>' +
            escapeHtml(selectedTpl.name) +
            '（' +
            escapeHtml(Tpl.statusLabel(selectedTpl.status)) +
            '）</option>';
        }
        return (
          '<div class="mkt-rg-reward-card" data-reward-card data-scene="' +
          escapeHtml(scene) +
          '">' +
          '<div class="mkt-rg-reward-card__title">' +
          escapeHtml(title) +
          ' · 奖励配置</div>' +
          '<div class="mkt-rg-reward-card__body">' +
          '<div class="pts-rule-field" data-benefit="points">' +
          '<label class="pts-rule-field__label">赠送积分</label>' +
          '<div class="pts-rule-field__control">' +
          '<div class="member-level-benefit-head">' +
          '<label class="mkt-rg-check-label">' +
          '<input type="checkbox" data-benefit-switch' +
          (pointsOn ? ' checked' : '') +
          '> 开启赠送积分</label></div>' +
          '<div class="member-level-benefit-body' +
          (pointsOn ? '' : ' is-disabled') +
          '" data-benefit-body' +
          (pointsOn ? '' : ' hidden') +
          '>' +
          '<div class="mkt-rg-unit">' +
          '<input class="erp-input" type="number" min="1" step="1" data-reward-points value="' +
          escapeHtml(pointsOn && reward.points ? String(reward.points) : '') +
          '" placeholder="请输入积分数" ' +
          (pointsOn ? '' : 'disabled') +
          '>' +
          '<span class="mkt-rg-unit__text">分</span>' +
          '</div></div></div></div>' +
          '<div class="pts-rule-field" data-benefit="coupon">' +
          '<label class="pts-rule-field__label">赠送券</label>' +
          '<div class="pts-rule-field__control">' +
          '<div class="member-level-benefit-head">' +
          '<label class="mkt-rg-check-label">' +
          '<input type="checkbox" data-benefit-switch' +
          (couponOn ? ' checked' : '') +
          '> 开启赠送券</label></div>' +
          '<div class="member-level-benefit-body' +
          (couponOn ? '' : ' is-disabled') +
          '" data-benefit-body' +
          (couponOn ? '' : ' hidden') +
          '>' +
          '<div class="mkt-rg-coupon-list" data-coupon-list>' +
          coupons.map(buildCouponRowHtml).join('') +
          '</div>' +
          '<button type="button" class="mkt-rg-coupon-add" data-coupon-add' +
          (couponOn ? '' : ' disabled') +
          '>+ 添加优惠券</button>' +
          '<div class="mkt-rg-tip">可添加多条；未选券名的行将在保存时忽略</div>' +
          '</div></div></div>' +
          '<div class="pts-rule-field" data-benefit="cash">' +
          '<label class="pts-rule-field__label">现金红包</label>' +
          '<div class="pts-rule-field__control">' +
          '<div class="member-level-benefit-head">' +
          '<label class="mkt-rg-check-label' +
          (cashLocked ? ' is-locked' : '') +
          '">' +
          '<input type="checkbox" data-benefit-switch' +
          (cashOn ? ' checked' : '') +
          (cashLocked ? ' disabled' : '') +
          '> 关联现金红包</label></div>' +
          (cashLocked
            ? '<div class="mkt-rg-tip">现金红包总开关已关闭，请先在「营销 → 现金红包」中开启后，再关联。</div>'
            : '') +
          '<div class="member-level-benefit-body' +
          (cashOn ? '' : ' is-disabled') +
          '" data-benefit-body' +
          (cashOn ? '' : ' hidden') +
          '>' +
          '<select class="erp-select pts-rule-field__input--name" data-cash-template' +
          (cashOn ? '' : ' disabled') +
          '>' +
          optionHtml +
          '</select>' +
          '<div class="mkt-rg-tip" data-cash-template-tip>' +
          escapeHtml(cashTemplateHint(cashTemplateId)) +
          '</div>' +
          '</div></div></div>' +
          '</div></div>'
        );
      })
      .join('');

    host.querySelectorAll('[data-reward-card]').forEach(bindRewardCard);
  }

  function resetForPort(port) {
    state.port = port === 'app' ? 'app' : 'mini';
    if (state.port === 'mini') {
      state.scenes = ['new_register'];
    } else {
      state.scenes = ['new_register'];
    }
    state.rewards = { new_register: emptyReward() };
    renderScenes();
    renderRewards();
  }

  function applyItem(item) {
    item = Store.normalizeItem(item);
    editing = true;
    editId = item.id;
    var nameEl = document.getElementById('rgName');
    var startEl = document.getElementById('rgStartAt');
    var endEl = document.getElementById('rgEndAt');
    var tab = document.getElementById('rgFormTabTitle');
    if (nameEl) nameEl.value = item.name || '';
    if (startEl) startEl.value = item.startAt || '';
    if (endEl) endEl.value = item.endAt || '';
    if (tab) tab.textContent = '编辑注册有礼';
    document.querySelectorAll('input[name="rgPort"]').forEach(function (r) {
      r.checked = r.value === item.port;
    });
    state.port = item.port;
    state.scenes = item.scenes.slice();
    state.rewards = {};
    item.scenes.forEach(function (scene) {
      state.rewards[scene] = rewardFromStored(item.rewards[scene]);
    });
    renderScenes();
    renderRewards();
    syncDatetimeClear('rgStartWrap', 'rgStartAt');
    syncDatetimeClear('rgEndWrap', 'rgEndAt');
  }

  function validateReward(scene, reward) {
    var label = Store.sceneLabel(scene);
    var couponEnabled = !!reward.couponEnabled;
    var pointsEnabled = !!reward.pointsEnabled;
    var cashEnabled = !!reward.cashEnabled;

    if (!couponEnabled && !pointsEnabled && !cashEnabled) {
      return { ok: false, message: label + '需至少开启并配置券、积分或现金红包其中一种有效奖励' };
    }

    var filled = [];
    if (couponEnabled) {
      filled = (reward.coupons || []).filter(function (it) {
        return !!it.coupon;
      });
      if (!filled.length) {
        return { ok: false, message: label + '已开启赠送券，请选择优惠券' };
      }
      var seen = {};
      for (var i = 0; i < filled.length; i++) {
        var it = filled[i];
        if (seen[it.coupon]) {
          return { ok: false, message: label + '中优惠券不能重复' };
        }
        seen[it.coupon] = true;
        var qty = Math.round(Number(it.qty) || 0);
        if (qty < 1) {
          return { ok: false, message: label + '中优惠券数量需为正整数' };
        }
      }
    }

    var points = 0;
    if (pointsEnabled) {
      points = Math.round(Number(reward.points) || 0);
      if (!points || points < 1 || isNaN(points)) {
        return { ok: false, message: label + '已开启赠送积分，请填写正整数积分' };
      }
    }

    var cashTemplateId = '';
    if (cashEnabled) {
      cashTemplateId = String(reward.cashTemplateId || '').trim();
      if (!cashTemplateId) {
        return { ok: false, message: label + '已关联现金红包，请选择现金红包' };
      }
      var Tpl = window.MdmMarketingCashRedpackTplStore;
      var tpl = Tpl && Tpl.getById ? Tpl.getById(cashTemplateId) : null;
      if (!tpl || tpl.status !== 'ACTIVE') {
        return { ok: false, message: label + '请关联已启用的现金红包' };
      }
      if ((tpl.ports || []).indexOf(getPort()) < 0) {
        return { ok: false, message: label + '所选现金红包的活动领取终端不包含当前活动端口' };
      }
    }

    return {
      ok: true,
      reward: {
        coupons: couponEnabled
          ? filled.map(function (it) {
              return { coupon: it.coupon, qty: Math.max(1, Math.round(Number(it.qty) || 1)) };
            })
          : [],
        points: pointsEnabled ? Math.max(0, points) : 0,
        cashEnabled: cashEnabled,
        cashTemplateId: cashEnabled ? cashTemplateId : '',
        cashMin: cashEnabled ? Store.toMoney(reward.cashMin) : 0,
        cashMax: cashEnabled ? Store.toMoney(reward.cashMax) : 0,
        cashBudgetTotal: cashEnabled ? Store.toMoney(reward.cashBudgetTotal) : 0,
        cashBudgetUsed: Store.toMoney(reward.cashBudgetUsed)
      }
    };
  }

  function collectPayload() {
    syncRewardsFromDom();
    var name = ((document.getElementById('rgName') || {}).value || '').trim();
    var startAt = ((document.getElementById('rgStartAt') || {}).value || '').trim();
    var endAt = ((document.getElementById('rgEndAt') || {}).value || '').trim();
    var port = getPort();
    var scenes = state.scenes.slice();
    if (port === 'mini') scenes = ['new_register'];

    if (!name) return { ok: false, message: '请填写活动名称' };
    if (!startAt || !endAt) return { ok: false, message: '请填写活动开始与结束时间' };
    if (Date.parse(startAt) > Date.parse(endAt)) {
      return { ok: false, message: '结束时间需晚于开始时间' };
    }
    if (!scenes.length) return { ok: false, message: '请至少选择一个场景' };

    var rewards = {};
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var result = validateReward(scene, state.rewards[scene] || emptyReward());
      if (!result.ok) return result;
      rewards[scene] = result.reward;
    }

    var existing = editing ? Store.getById(editId) : null;
    return {
      ok: true,
      item: {
        id: editing ? editId : '',
        name: name,
        startAt: startAt,
        endAt: endAt,
        port: port,
        scenes: scenes,
        rewards: rewards,
        enabled: existing ? existing.enabled !== false : true,
        createdAt: existing ? existing.createdAt : undefined
      }
    };
  }

  function save() {
    var result = collectPayload();
    if (!result.ok) {
      toast(result.message, 'warning');
      return;
    }
    Store.saveItem(result.item);
    toast('保存成功', 'success');
    setTimeout(function () {
      window.location.href = listHref();
    }, 400);
  }

  function bindPortChange() {
    document.querySelectorAll('input[name="rgPort"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var next = getPort();
        if (next === state.port) return;
        if (!window.confirm('切换应用端口将重置场景与奖励配置，是否继续？')) {
          document.querySelectorAll('input[name="rgPort"]').forEach(function (r) {
            r.checked = r.value === state.port;
          });
          return;
        }
        resetForPort(next);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindDatetimeClears();
    bindPortChange();

    var cancelBtn = document.getElementById('rgFormCancel');
    var saveBtn = document.getElementById('rgFormSave');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        window.location.href = listHref();
      });
    }
    if (saveBtn) saveBtn.addEventListener('click', save);

    if (editId) {
      var item = Store.getById(editId);
      if (item) {
        applyItem(item);
      } else {
        toast('未找到该活动，将按新增处理', 'warning');
        editing = false;
        editId = '';
        resetForPort('mini');
      }
    } else {
      resetForPort('mini');
    }
  });
})();
