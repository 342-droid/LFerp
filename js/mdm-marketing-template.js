/**
 * 营销模版 — 模版配置列表 / 新增编辑弹窗 / 操作日志
 */
(function () {
  'use strict';

  var Store = window.MdmMarketingTemplateStore;
  if (!Store) return;

  var state = {
    page: 1,
    pageSize: 10,
    activityType: '',
    moreOpenId: ''
  };

  var edit = {
    open: false,
    mode: 'add',
    id: '',
    base: null,
    coupon: null,
    bag: null,
    sign: null,
    task: null,
    skuTarget: 'coupon',
    skuSingle: false
  };

  var logState = {
    activityId: '',
    activityName: '',
    page: 1,
    pageSize: 20
  };

  function toast(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type || 'info');
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function closestAct(el) {
    if (!el) return null;
    if (el.nodeType !== 1) el = el.parentElement;
    return el && el.closest ? el.closest('[data-act]') : null;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function typeTagClass(type) {
    if (type === 'COUPON') return 'mkt-tpl-tag mkt-tpl-tag--primary';
    if (type === 'FORTUNE_BAG') return 'mkt-tpl-tag mkt-tpl-tag--warning';
    if (type === 'SIGN_IN') return 'mkt-tpl-tag mkt-tpl-tag--success';
    return 'mkt-tpl-tag mkt-tpl-tag--info';
  }

  function emptyForm() {
    return {
      base: { activityType: 'COUPON', name: '', applicableChannel: 'ALL', totalStock: '' },
      coupon: {
        couponType: 'FULL_MINUS',
        threshold: 0,
        denomination: 0,
        timeScope: 'UNLIMITED',
        timeStart: '',
        timeEnd: '',
        itemScope: 'ALL',
        productSkus: [],
        selectedCategories: [],
        categorySource: 'MALL',
        claimLimitMode: 'UNLIMITED',
        perUserLimit: 1
      },
      bag: {
        prizeType: 'POINTS',
        pointsAmount: 100,
        productSkus: [],
        couponActivityId: '',
        claimValidityType: '',
        claimValidityValue: '',
        claimValidityUnit: '',
        pickupAutoClaim: ''
      },
      sign: {
        totalRounds: 1,
        mode: 'PER_ROUND',
        roundRewards: [{ rewardType: 'POINTS', pointsAmount: 5, couponActivityId: '', productSkus: [] }],
        completeReward: { rewardType: 'POINTS', pointsAmount: 5, couponActivityId: '', productSkus: [] },
        continuousRequired: false,
        claimValidityType: '',
        claimValidityValue: '',
        claimValidityUnit: '',
        pickupAutoClaim: ''
      },
      task: {
        milestones: [{ minutes: 5, points: 10, rewardType: 'POINTS', couponActivityId: '', productSkus: [] }],
        claimValidityType: '',
        claimValidityValue: '',
        claimValidityUnit: '',
        pickupAutoClaim: ''
      }
    };
  }

  function isLocked() {
    if (edit.mode === 'view') return true;
    if (edit.mode === 'edit' && edit.base.activityType !== 'COUPON') return true;
    return false;
  }

  function fillFromItem(item) {
    var blank = emptyForm();
    edit.base = blank.base;
    edit.coupon = blank.coupon;
    edit.bag = blank.bag;
    edit.sign = blank.sign;
    edit.task = blank.task;
    edit.base.activityType = item.activityType || 'COUPON';
    edit.base.name = item.name || '';
    edit.base.applicableChannel = item.applicableChannel || 'ALL';
    edit.base.totalStock = item.totalStock == null ? '' : String(item.totalStock);
    var cfg = item.config || {};
    if (item.activityType === 'COUPON') {
      edit.coupon.couponType = cfg.couponType || 'FULL_MINUS';
      edit.coupon.threshold = Number(cfg.threshold || 0);
      edit.coupon.denomination = Number(cfg.denomination || 0);
      edit.coupon.timeScope = cfg.timeScope || 'UNLIMITED';
      if (edit.coupon.timeScope === 'SPECIFIC') {
        edit.coupon.timeStart = String(item.validStart || '').replace(' ', 'T').slice(0, 16);
        edit.coupon.timeEnd = String(item.validEnd || '').replace(' ', 'T').slice(0, 16);
      }
      edit.coupon.itemScope = cfg.itemScope || 'ALL';
      edit.coupon.perUserLimit = cfg.perUserLimit || 1;
      edit.coupon.claimLimitMode = cfg.perUserLimit ? 'LIMITED' : 'UNLIMITED';
      try {
        var scope = typeof cfg.productScopeJson === 'string' ? JSON.parse(cfg.productScopeJson) : cfg.productScopeJson;
        if (scope && scope.type === 'GOODS' && Array.isArray(scope.items)) {
          edit.coupon.itemScope = 'GOODS';
          edit.coupon.productSkus = scope.items.map(function (n) {
            return {
              id: String(n.id || n.skuCode || ''),
              label: String(n.label || n.name || n.id || ''),
              spuCode: n.spuCode ? String(n.spuCode) : undefined,
              skuCode: n.skuCode ? String(n.skuCode) : String(n.id || ''),
              spuId: n.spuId ? String(n.spuId) : undefined
            };
          });
        }
        if (scope && scope.type === 'CATEGORY' && Array.isArray(scope.items)) {
          edit.coupon.itemScope = 'CATEGORY';
          edit.coupon.selectedCategories = scope.items.map(function (n) {
            return { id: String(n.id || ''), name: String(n.name || n.id || ''), source: n.source === 'LIVE' ? 'LIVE' : 'MALL' };
          });
        }
      } catch (e) {
        /* ignore */
      }
    } else if (item.activityType === 'FORTUNE_BAG') {
      edit.bag.prizeType = cfg.prizeType || 'POINTS';
      applyClaimFromCfg(edit.bag, cfg);
      if (edit.bag.prizeType === 'POINTS' && cfg.prizes && cfg.prizes[0]) {
        edit.bag.pointsAmount = Number(cfg.prizes[0].amount || 100);
      } else if (edit.bag.prizeType === 'GOODS') {
        try {
          var bagScope = typeof cfg.productScopeJson === 'string' ? JSON.parse(cfg.productScopeJson) : cfg.productScopeJson;
          if (bagScope && Array.isArray(bagScope.items) && bagScope.items.length) {
            edit.bag.productSkus = bagScope.items.map(function (n) {
              return {
                id: String(n.skuCode || n.id || ''),
                label: String(n.label || n.name || n.id || ''),
                spuCode: n.spuCode ? String(n.spuCode) : undefined,
                skuCode: n.skuCode ? String(n.skuCode) : String(n.id || ''),
                spuId: n.spuId ? String(n.spuId) : undefined
              };
            }).slice(0, 1);
          } else {
            edit.bag.productSkus = (cfg.prizes || []).map(function (p) {
              return { id: String(p.refId || ''), skuCode: String(p.refId || ''), spuCode: p.spuCode, label: String(p.label || p.refId || '') };
            }).slice(0, 1);
          }
        } catch (e2) {
          edit.bag.productSkus = [];
        }
      } else if (edit.bag.prizeType === 'COUPON') {
        edit.bag.couponActivityId = String((cfg.prizes && cfg.prizes[0] && cfg.prizes[0].refId) || '');
      }
    } else if (item.activityType === 'SIGN_IN') {
      edit.sign.totalRounds = Number(cfg.totalRounds || 1);
      edit.sign.mode = cfg.mode || 'PER_ROUND';
      edit.sign.continuousRequired = !!cfg.continuousRequired;
      edit.sign.roundRewards = (cfg.roundRewards || []).map(function (u) {
        return {
          rewardType: u.rewardType || 'POINTS',
          pointsAmount: u.pointsAmount != null ? u.pointsAmount : 5,
          couponActivityId: u.couponActivityId || '',
          productSkus: Array.isArray(u.productSkus) ? u.productSkus.slice(0, 1) : []
        };
      });
      syncSignRounds();
      if (cfg.completeReward) {
        edit.sign.completeReward = {
          rewardType: cfg.completeReward.rewardType || 'POINTS',
          pointsAmount: cfg.completeReward.pointsAmount != null ? cfg.completeReward.pointsAmount : 5,
          couponActivityId: cfg.completeReward.couponActivityId || '',
          productSkus: Array.isArray(cfg.completeReward.productSkus) ? cfg.completeReward.productSkus.slice(0, 1) : []
        };
      }
      applyClaimFromCfg(edit.sign, cfg);
    } else if (item.activityType === 'TASK') {
      edit.task.milestones = (cfg.milestones || []).map(function (u) {
        var reward = u.reward || {};
        return {
          minutes: Number(u.threshold || 5),
          points: Number(reward.pointsAmount || 10),
          rewardType: reward.rewardType || 'POINTS',
          couponActivityId: reward.couponActivityId || '',
          productSkus: Array.isArray(reward.productSkus) ? reward.productSkus.slice(0, 1) : []
        };
      });
      if (!edit.task.milestones.length) {
        edit.task.milestones = [{ minutes: 5, points: 10, rewardType: 'POINTS', couponActivityId: '', productSkus: [] }];
      }
      applyClaimFromCfg(edit.task, cfg);
    }
  }

  function applyClaimFromCfg(target, cfg) {
    if (cfg.claimValidityType === 'CUSTOM' || cfg.claimValidityType === 'SESSION_END') {
      target.claimValidityType = cfg.claimValidityType;
    } else {
      target.claimValidityType = '';
    }
    target.claimValidityUnit =
      cfg.claimValidityUnit === 'DAY' || cfg.claimValidityUnit === 'HOUR' ? cfg.claimValidityUnit : '';
    target.claimValidityValue = target.claimValidityType === 'CUSTOM' ? String(cfg.claimValidityValue || '') : '';
    target.pickupAutoClaim = cfg.pickupAutoClaim === 'YES' || cfg.pickupAutoClaim === 'NO' ? cfg.pickupAutoClaim : '';
  }

  function claimState() {
    var type = edit.base.activityType;
    if (type === 'FORTUNE_BAG') return edit.bag;
    if (type === 'SIGN_IN') return edit.sign;
    if (type === 'TASK') return edit.task;
    return null;
  }

  function activityHasGoods() {
    var type = edit.base.activityType;
    if (type === 'FORTUNE_BAG') return edit.bag.prizeType === 'GOODS';
    if (type === 'SIGN_IN') {
      if (edit.sign.mode === 'PER_ROUND') {
        return edit.sign.roundRewards.some(function (rw) {
          return rw.rewardType === 'GOODS';
        });
      }
      return edit.sign.completeReward.rewardType === 'GOODS';
    }
    if (type === 'TASK') {
      return edit.task.milestones.some(function (ms) {
        return ms.rewardType === 'GOODS';
      });
    }
    return false;
  }

  function claimValidityError() {
    if (!activityHasGoods()) return '';
    var c = claimState();
    if (!c || !c.claimValidityType) return '请配置商品领取有效期';
    if (c.claimValidityType === 'CUSTOM') {
      if (c.claimValidityUnit !== 'HOUR' && c.claimValidityUnit !== 'DAY') return '请选择领取有效期单位';
      var n = Number(c.claimValidityValue);
      var max = c.claimValidityUnit === 'DAY' ? 365 : 120;
      var unit = c.claimValidityUnit === 'DAY' ? '天' : '小时';
      if (!n || n < 1 || n > max) return '商品领取有效期' + unit + '需为 1-' + max + ' 的整数';
    }
    if (c.pickupAutoClaim !== 'YES' && c.pickupAutoClaim !== 'NO') return '请选择自提商品是否自动领取';
    return '';
  }

  function writeClaimToCfg(cfg, src) {
    if (!activityHasGoods() || !src) return;
    cfg.claimValidityType = src.claimValidityType;
    if (src.claimValidityType === 'CUSTOM') {
      cfg.claimValidityUnit = src.claimValidityUnit;
      cfg.claimValidityValue = Number(src.claimValidityValue);
    }
    cfg.pickupAutoClaim = src.pickupAutoClaim || '';
  }

  function syncSignRounds() {
    var t = Math.max(1, Number(edit.sign.totalRounds) || 1);
    edit.sign.totalRounds = t;
    while (edit.sign.roundRewards.length < t) {
      edit.sign.roundRewards.push({ rewardType: 'POINTS', pointsAmount: 5, couponActivityId: '', productSkus: [] });
    }
    if (edit.sign.roundRewards.length > t) edit.sign.roundRewards.length = t;
  }

  function rowActions(item) {
    var acts = [];
    if (item.status !== 'ACTIVE') acts.push({ key: 'edit', label: '编辑' });
    acts.push({ key: 'toggle', label: item.status === 'ACTIVE' ? '禁用' : '启用' });
    acts.push({ key: 'operationLog', label: '操作日志' });
    return acts;
  }

  function renderTable() {
    var tbody = document.getElementById('tplTableBody');
    if (!tbody) return;
    var all = Store.listRows({ activityType: state.activityType });
    var total = all.length;
    var start = (state.page - 1) * state.pageSize;
    var rows = all.slice(start, start + state.pageSize);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="mkt-tpl-empty">未查询到符合条件的数据</td></tr>';
    } else {
      tbody.innerHTML = rows
        .map(function (item) {
          var cfg = item.config || {};
          var typeText = Store.typeLabel(item.activityType, cfg.taskType);
          var acts = rowActions(item);
          var shown = acts.length > 2 ? acts.slice(0, 1) : acts;
          var more = acts.length > 2 ? acts.slice(1) : [];
          var ops =
            shown
              .map(function (a) {
                var cls = 'mkt-tpl-link';
                if (a.key === 'toggle' && item.status === 'ACTIVE') cls += ' mkt-tpl-link--warn';
                if (a.key === 'toggle' && item.status !== 'ACTIVE') cls += ' mkt-tpl-link--ok';
                return (
                  '<button type="button" class="' +
                  cls +
                  '" data-act="' +
                  a.key +
                  '" data-id="' +
                  escapeHtml(item.id) +
                  '">' +
                  escapeHtml(a.label) +
                  '</button>'
                );
              })
              .join('') +
            (more.length
              ? '<span class="mkt-tpl-more' +
                (state.moreOpenId === item.id ? ' is-open' : '') +
                '">' +
                '<button type="button" class="mkt-tpl-link mkt-tpl-more__btn" data-act="more" data-id="' +
                escapeHtml(item.id) +
                '">更多 ▾</button>' +
                '<span class="mkt-tpl-more__menu">' +
                more
                  .map(function (a) {
                    return (
                      '<button type="button" class="mkt-tpl-more__item" data-act="' +
                      a.key +
                      '" data-id="' +
                      escapeHtml(item.id) +
                      '">' +
                      escapeHtml(a.label) +
                      '</button>'
                    );
                  })
                  .join('') +
                '</span></span>'
              : '');
          return (
            '<tr data-id="' +
            escapeHtml(item.id) +
            '">' +
            '<td><button type="button" class="mkt-tpl-name" data-act="view" data-id="' +
            escapeHtml(item.id) +
            '">' +
            escapeHtml(item.name || '—') +
            '</button></td>' +
            '<td style="text-align:center"><span class="' +
            typeTagClass(item.activityType) +
            '">' +
            escapeHtml(typeText) +
            '</span></td>' +
            '<td style="text-align:center">' +
            escapeHtml(Store.channelLabel(item.applicableChannel)) +
            '</td>' +
            '<td style="text-align:center">' +
            escapeHtml(Store.scopeLabel(cfg.itemScope)) +
            '</td>' +
            '<td>' +
            escapeHtml(item.createdAt || '—') +
            '</td>' +
            '<td style="text-align:center"><span class="mkt-tpl-tag ' +
            (item.status === 'ACTIVE' ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--info') +
            '">' +
            escapeHtml(Store.statusLabel(item.status)) +
            '</span></td>' +
            '<td class="mkt-tpl-ops action-links">' +
            ops +
            '</td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'pagination-container',
        totalItems: total,
        currentPage: state.page,
        pageSize: state.pageSize,
        pageSizeOptions: [10, 20, 50, 100],
        onPageChange: function (p) {
          state.page = p;
          renderTable();
        },
        onPageSizeChange: function (s) {
          state.pageSize = s;
          state.page = 1;
          renderTable();
        }
      });
    }
  }

  function radio(name, value, current, label, disabled) {
    return (
      '<label><input type="radio" name="' +
      name +
      '" value="' +
      value +
      '"' +
      (current === value ? ' checked' : '') +
      (disabled ? ' disabled' : '') +
      '> ' +
      label +
      '</label>'
    );
  }

  function skuChips(list, removable, from) {
    if (!list || !list.length) return '';
    return list
      .map(function (s) {
        return (
          '<span class="mkt-tpl-chip">' +
          escapeHtml(s.label || s.id) +
          (removable
            ? '<button type="button" class="mkt-tpl-chip__x" data-act="rm-sku" data-id="' +
              escapeHtml(s.id) +
              '" data-from="' +
              escapeHtml(from || '') +
              '">×</button>'
            : '') +
          '</span>'
        );
      })
      .join('');
  }

  function getSkuList(from) {
    if (from === 'bag') return edit.bag.productSkus || [];
    if (from === 'coupon') return edit.coupon.productSkus || [];
    if (from === 'sign-complete') {
      edit.sign.completeReward.productSkus = edit.sign.completeReward.productSkus || [];
      return edit.sign.completeReward.productSkus;
    }
    var m = /^sign-rw-(\d+)$/.exec(from || '');
    if (m) {
      var rw = edit.sign.roundRewards[Number(m[1])];
      if (!rw) return [];
      rw.productSkus = rw.productSkus || [];
      return rw.productSkus;
    }
    m = /^task-(\d+)$/.exec(from || '');
    if (m) {
      var ms = edit.task.milestones[Number(m[1])];
      if (!ms) return [];
      ms.productSkus = ms.productSkus || [];
      return ms.productSkus;
    }
    return [];
  }

  function isRewardSkuTarget(from) {
    return from && from !== 'coupon';
  }

  function setSkuList(from, items) {
    if (isRewardSkuTarget(from) && items && items.length > 1) items = items.slice(0, 1);
    if (from === 'bag') edit.bag.productSkus = items;
    else if (from === 'coupon') edit.coupon.productSkus = items;
    else if (from === 'sign-complete') edit.sign.completeReward.productSkus = items;
    else {
      var m = /^sign-rw-(\d+)$/.exec(from || '');
      if (m && edit.sign.roundRewards[Number(m[1])]) {
        edit.sign.roundRewards[Number(m[1])].productSkus = items;
        return;
      }
      m = /^task-(\d+)$/.exec(from || '');
      if (m && edit.task.milestones[Number(m[1])]) {
        edit.task.milestones[Number(m[1])].productSkus = items;
      }
    }
  }

  function renderGoodsPick(skus, from, locked) {
    var list = skus || [];
    if (isRewardSkuTarget(from) && list.length > 1) list = list.slice(0, 1);
    var html = '<div class="mkt-tpl-tags">';
    html += skuChips(list, !locked, from);
    if (!locked) {
      html +=
        '<button type="button" class="mkt-tpl-add-link" data-act="add-sku" data-from="' +
        escapeHtml(from) +
        '">' +
        (list.length ? '更换商品' : '+ 添加商品') +
        '</button>';
    }
    html += '</div>';
    return html;
  }

  function renderClaimValidity(locked) {
    if (!activityHasGoods()) return '';
    var c = claimState() || {};
    var dis = locked ? ' disabled' : '';
    var customOn = c.claimValidityType === 'CUSTOM';
    var html =
      '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">商品领取有效期</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-claim">';
    html +=
      '<label class="mkt-tpl-claim__row"><input type="radio" name="fClaimVal" value="SESSION_END"' +
      (c.claimValidityType === 'SESSION_END' ? ' checked' : '') +
      dis +
      '><span>直播场次结束</span></label>';
    html +=
      '<label class="mkt-tpl-claim__row"><input type="radio" name="fClaimVal" value="CUSTOM"' +
      (customOn ? ' checked' : '') +
      dis +
      '><span class="mkt-tpl-claim__custom"><span>中奖后</span>';
    html +=
      '<input id="fClaimValN" type="text" placeholder="请输入" value="' +
      escapeHtml(c.claimValidityValue || '') +
      '"' +
      (locked || !customOn ? ' disabled' : '') +
      '>';
    html +=
      '<select id="fClaimUnit"' +
      (locked || !customOn ? ' disabled' : '') +
      '><option value=""' +
      (!c.claimValidityUnit ? ' selected' : '') +
      '>请选择</option><option value="HOUR"' +
      (c.claimValidityUnit === 'HOUR' ? ' selected' : '') +
      '>小时</option><option value="DAY"' +
      (c.claimValidityUnit === 'DAY' ? ' selected' : '') +
      '>天</option></select>';
    html += '<span>可领取</span></span></label></div></div></div>';
    html += renderPickupAutoClaim(locked, c);
    return html;
  }

  function renderPickupAutoClaim(locked, c) {
    var html =
      '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">自提商品是否自动领取</div><div class="mkt-tpl-row__ctrl">';
    html += '<div class="mkt-tpl-radios">';
    html += radio('fPickupAuto', 'YES', c.pickupAutoClaim, '是', locked);
    html += radio('fPickupAuto', 'NO', c.pickupAutoClaim, '否', locked);
    html += '</div>';
    html +=
      '<div class="mkt-tpl-field-tip">选择<strong>是</strong>后符合中奖条件后系统会自动领取并生成订单；快递商品仍然需要用户手动领取填写收货地址后才领取成功生成订单。</div>';
    html += '</div></div>';
    return html;
  }

  function couponSelect(selected) {
    var opts = Store.listActiveCoupons()
      .map(function (c) {
        return (
          '<option value="' +
          escapeHtml(c.id) +
          '"' +
          (String(selected) === String(c.id) ? ' selected' : '') +
          '>' +
          escapeHtml(Store.couponOptionLabel(c)) +
          '</option>'
        );
      })
      .join('');
    return opts;
  }

  function shouldRerenderEdit(el) {
    if (!el) return false;
    var id = el.id || '';
    if (id === 'fType' || id === 'fCouponType' || id === 'fClaimMode' || id === 'fRounds') return true;
    var name = el.getAttribute('name') || '';
    if (
      name === 'fPrize' ||
      name === 'fSignMode' ||
      name === 'fCompleteType' ||
      name === 'fItemScope' ||
      name === 'fTimeScope' ||
      name === 'fChannel' ||
      name === 'fClaimVal' ||
      name === 'fCatSrc'
    ) {
      return true;
    }
    if (/^fRwType\d+$/.test(name) || /^fMsType\d+$/.test(name)) return true;
    return false;
  }

  function renderEditBody() {
    var body = document.getElementById('tplEditBody');
    var title = document.getElementById('tplEditTitle');
    var footer = document.getElementById('tplEditFooter');
    if (!body) return;
    var locked = isLocked();
    var dis = locked ? ' disabled' : '';
    title.textContent = edit.mode === 'view' ? '模板详情' : edit.mode === 'edit' ? '编辑模板' : '新增模板';
    footer.hidden = locked;

    var typeOpts = [
      { v: 'COUPON', l: '优惠券' },
      { v: 'FORTUNE_BAG', l: '福袋' },
      { v: 'SIGN_IN', l: '签到' },
      { v: 'TASK', l: '观看任务' }
    ]
      .map(function (o) {
        return (
          '<option value="' +
          o.v +
          '"' +
          (edit.base.activityType === o.v ? ' selected' : '') +
          '>' +
          o.l +
          '</option>'
        );
      })
      .join('');

    var html = '';
    html += '<div class="mkt-tpl-section">';
    html += '<div class="mkt-tpl-section__title"><span class="mkt-tpl-section__icon"></span> 基本信息</div>';
    html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">模板类型</div><div class="mkt-tpl-row__ctrl">';
    html +=
      '<select id="fType" class="mkt-tpl-w240"' +
      (edit.mode !== 'add' || locked ? ' disabled' : '') +
      '>' +
      typeOpts +
      '</select></div></div>';
    html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">模板名称</div><div class="mkt-tpl-row__ctrl">';
    html +=
      '<span class="mkt-tpl-wordlimit"><input id="fName" type="text" maxlength="50" placeholder="请输入模板名称" value="' +
      escapeHtml(edit.base.name) +
      '"' +
      dis +
      '><span class="mkt-tpl-wordlimit__n" id="fNameCount">' +
      String(edit.base.name.length) +
      '/50</span></span></div></div></div>';

    html += '<div class="mkt-tpl-section">';
    html += '<div class="mkt-tpl-section__title"><span class="mkt-tpl-section__icon"></span> 模板配置</div>';

    if (edit.base.activityType === 'COUPON') {
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">优惠券类型</div><div class="mkt-tpl-row__ctrl">';
      html +=
        '<select id="fCouponType" class="mkt-tpl-w240"' +
        dis +
        '><option value="NO_THRESHOLD"' +
        (edit.coupon.couponType === 'NO_THRESHOLD' ? ' selected' : '') +
        '>无门槛</option><option value="FULL_MINUS"' +
        (edit.coupon.couponType === 'FULL_MINUS' ? ' selected' : '') +
        '>满减</option></select></div></div>';
      if (edit.coupon.couponType === 'FULL_MINUS') {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">减免条件</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline mkt-tpl-inline--nowrap">';
        html += '<span class="mkt-tpl-inline__text">消费满</span>';
        html +=
          '<input id="fThreshold" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(edit.coupon.threshold)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">元 减</span>';
        html +=
          '<input id="fDenomination" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(edit.coupon.denomination)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">元</span></div></div></div>';
      } else {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">减免金额</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
        html +=
          '<input id="fDenomination" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(edit.coupon.denomination)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">元</span></div></div></div>';
      }
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">适用渠道</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-radios">';
      html += radio('fChannel', 'ALL', edit.base.applicableChannel, '全部渠道', locked);
      html += radio('fChannel', 'LIVE_ONLY', edit.base.applicableChannel, '仅直播', locked);
      html += radio('fChannel', 'MALL_ONLY', edit.base.applicableChannel, '仅商城', locked);
      html += '</div></div></div>';
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">可用时间</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-radios">';
      html += radio('fTimeScope', 'UNLIMITED', edit.coupon.timeScope, '不限制', locked);
      html += radio('fTimeScope', 'SPECIFIC', edit.coupon.timeScope, '指定时间', locked);
      html += '</div></div></div>';
      if (edit.coupon.timeScope === 'SPECIFIC') {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">起止时间</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
        html +=
          '<input id="fTimeStart" type="datetime-local" value="' +
          escapeHtml(edit.coupon.timeStart) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">至</span>';
        html +=
          '<input id="fTimeEnd" type="datetime-local" value="' +
          escapeHtml(edit.coupon.timeEnd) +
          '"' +
          dis +
          '>';
        html += '</div></div></div>';
      }
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">适用商品</div><div class="mkt-tpl-row__ctrl">';
      html += renderScopePicker(locked);
      html += '</div></div>';
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">领取上限</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
      html +=
        '<select id="fClaimMode" class="mkt-tpl-w160"' +
        dis +
        '><option value="UNLIMITED"' +
        (edit.coupon.claimLimitMode === 'UNLIMITED' ? ' selected' : '') +
        '>不限次数</option><option value="LIMITED"' +
        (edit.coupon.claimLimitMode === 'LIMITED' ? ' selected' : '') +
        '>每人限领</option></select>';
      if (edit.coupon.claimLimitMode === 'LIMITED') {
        html +=
          '<input id="fPerUser" type="number" min="1" step="1" value="' +
          escapeHtml(String(edit.coupon.perUserLimit)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">次</span>';
      }
      html += '</div></div></div>';
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">发放数量</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
      html +=
        '<input id="fStock" type="text" placeholder="请输入" value="' +
        escapeHtml(edit.base.totalStock) +
        '"' +
        dis +
        '>';
      html += '<span class="mkt-tpl-inline__text">份</span></div></div></div>';
    } else if (edit.base.activityType === 'FORTUNE_BAG') {
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">奖品类型</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-radios">';
      html += radio('fPrize', 'POINTS', edit.bag.prizeType, '积分', locked);
      html += radio('fPrize', 'GOODS', edit.bag.prizeType, '商品', locked);
      html += radio('fPrize', 'COUPON', edit.bag.prizeType, '优惠券', locked);
      html += '</div></div></div>';
      if (edit.bag.prizeType === 'POINTS') {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">积分数量</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
        html +=
          '<input id="fPoints" type="number" min="1" step="1" value="' +
          escapeHtml(String(edit.bag.pointsAmount)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">积分</span></div></div></div>';
      } else if (edit.bag.prizeType === 'GOODS') {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">选择商品</div><div class="mkt-tpl-row__ctrl">';
        html += renderGoodsPick(edit.bag.productSkus, 'bag', locked);
        html += '</div></div>';
      } else {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">选择优惠券</div><div class="mkt-tpl-row__ctrl">';
        html +=
          '<select id="fBagCoupon" class="mkt-tpl-w240"' +
          dis +
          '><option value="">请选择优惠券活动</option>' +
          couponSelect(edit.bag.couponActivityId) +
          '</select></div></div>';
      }
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">发放数量</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
      html +=
        '<input id="fStock" type="text" placeholder="请输入" value="' +
        escapeHtml(edit.base.totalStock) +
        '"' +
        dis +
        '>';
      html += '<span class="mkt-tpl-inline__text">份</span></div></div></div>';
      html += renderClaimValidity(locked);
    } else if (edit.base.activityType === 'SIGN_IN') {
      html += '<div class="mkt-tpl-sub-title">签到奖励规则配置</div>';
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">总签到次数</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-inline">';
      html +=
        '<input id="fRounds" type="number" min="1" step="1" value="' +
        escapeHtml(String(edit.sign.totalRounds)) +
        '"' +
        dis +
        '>';
      html += '<span class="mkt-tpl-inline__text">次</span></div></div></div>';
      html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label is-req">奖励规则</div><div class="mkt-tpl-row__ctrl"><div class="mkt-tpl-radios">';
      html += radio('fSignMode', 'PER_ROUND', edit.sign.mode, '单次领取', locked);
      html += radio('fSignMode', 'ON_COMPLETE', edit.sign.mode, '满N次领取', locked);
      html += '</div></div></div>';
      if (edit.sign.mode === 'PER_ROUND') {
        edit.sign.roundRewards.forEach(function (rw, i) {
          html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">第 ' + (i + 1) + ' 次签到</div><div class="mkt-tpl-row__ctrl">';
          html += '<div class="mkt-tpl-radios">';
          html += radio('fRwType' + i, 'POINTS', rw.rewardType, '积分', locked);
          html += radio('fRwType' + i, 'GOODS', rw.rewardType, '商品', locked);
          html += radio('fRwType' + i, 'COUPON', rw.rewardType, '优惠券', locked);
          html += radio('fRwType' + i, 'NONE', rw.rewardType, '无奖励', locked);
          html += '</div>';
          if (rw.rewardType === 'POINTS') {
            html +=
              '<div class="mkt-tpl-rule__extra"><div class="mkt-tpl-inline"><input data-rw-points="' +
              i +
              '" type="number" min="1" step="1" class="mkt-tpl-num" value="' +
              escapeHtml(String(rw.pointsAmount || 5)) +
              '"' +
              dis +
              '><span class="mkt-tpl-inline__text">积分</span></div></div>';
          } else if (rw.rewardType === 'COUPON') {
            html +=
              '<div class="mkt-tpl-rule__extra"><select data-rw-coupon="' +
              i +
              '" class="mkt-tpl-w240"' +
              dis +
              '><option value="">请选择优惠券活动</option>' +
              couponSelect(rw.couponActivityId) +
              '</select></div>';
          } else if (rw.rewardType === 'GOODS') {
            html += '<div class="mkt-tpl-rule__extra">' + renderGoodsPick(rw.productSkus, 'sign-rw-' + i, locked) + '</div>';
          }
          html += '</div></div>';
        });
      } else {
        var cr = edit.sign.completeReward;
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">满 ' + edit.sign.totalRounds + ' 次后发</div><div class="mkt-tpl-row__ctrl">';
        html += '<div class="mkt-tpl-radios">';
        html += radio('fCompleteType', 'POINTS', cr.rewardType, '积分', locked);
        html += radio('fCompleteType', 'GOODS', cr.rewardType, '商品', locked);
        html += radio('fCompleteType', 'COUPON', cr.rewardType, '优惠券', locked);
        html += radio('fCompleteType', 'NONE', cr.rewardType, '无奖励', locked);
        html += '</div>';
        if (cr.rewardType === 'POINTS') {
          html +=
            '<div class="mkt-tpl-rule__extra"><div class="mkt-tpl-inline"><input id="fCompletePts" type="number" min="1" step="1" class="mkt-tpl-num" value="' +
            escapeHtml(String(cr.pointsAmount || 5)) +
            '"' +
            dis +
            '><span class="mkt-tpl-inline__text">积分</span></div></div>';
        } else if (cr.rewardType === 'COUPON') {
          html +=
            '<div class="mkt-tpl-rule__extra"><select id="fCompleteCoupon" class="mkt-tpl-w240"' +
            dis +
            '><option value="">请选择优惠券活动</option>' +
            couponSelect(cr.couponActivityId) +
            '</select></div>';
        } else if (cr.rewardType === 'GOODS') {
          html += '<div class="mkt-tpl-rule__extra">' + renderGoodsPick(cr.productSkus, 'sign-complete', locked) + '</div>';
        }
        html += '</div></div>';
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">连续要求</div><div class="mkt-tpl-row__ctrl">';
        html +=
          '<label class="mkt-tpl-check"><input id="fContinuous" type="checkbox"' +
          (edit.sign.continuousRequired ? ' checked' : '') +
          dis +
          '> 必须连续签到</label>';
        html += '<span class="mkt-tpl-check-tip">未勾选则累计即可</span></div></div>';
      }
      html += renderClaimValidity(locked);
    } else if (edit.base.activityType === 'TASK') {
      html += '<div class="mkt-tpl-sub-title">观看任务规则(观看指定时长获得奖励)</div>';
      edit.task.milestones.forEach(function (ms, i) {
        html += '<div class="mkt-tpl-row"><div class="mkt-tpl-row__label">' + (i === 0 ? '观看规则' : '') + '</div><div class="mkt-tpl-row__ctrl">';
        html += '<div class="mkt-tpl-rule__head">';
        html +=
          '<input data-ms-min="' +
          i +
          '" class="mkt-tpl-num" type="number" min="1" step="1" value="' +
          escapeHtml(String(ms.minutes)) +
          '"' +
          dis +
          '>';
        html += '<span class="mkt-tpl-inline__text">分钟 =</span>';
        html += '<div class="mkt-tpl-radios">';
        html += radio('fMsType' + i, 'POINTS', ms.rewardType || 'POINTS', '积分', locked);
        html += radio('fMsType' + i, 'GOODS', ms.rewardType, '商品', locked);
        html += radio('fMsType' + i, 'COUPON', ms.rewardType, '优惠券', locked);
        html += '</div>';
        if (!locked && edit.task.milestones.length > 1) {
          html +=
            '<button type="button" class="mkt-tpl-add-link" data-act="rm-ms" data-i="' + i + '" style="color:#f56c6c">删除</button>';
        }
        html += '</div>';
        if ((ms.rewardType || 'POINTS') === 'POINTS') {
          html +=
            '<div class="mkt-tpl-rule__extra"><div class="mkt-tpl-inline"><input data-ms-pts="' +
            i +
            '" type="number" min="1" step="1" class="mkt-tpl-num" value="' +
            escapeHtml(String(ms.points || 10)) +
            '"' +
            dis +
            '><span class="mkt-tpl-inline__text">积分</span></div></div>';
        } else if (ms.rewardType === 'COUPON') {
          html +=
            '<div class="mkt-tpl-rule__extra"><select data-ms-coupon="' +
            i +
            '" class="mkt-tpl-w240"' +
            dis +
            '><option value="">请选择优惠券活动</option>' +
            couponSelect(ms.couponActivityId) +
            '</select></div>';
        } else if (ms.rewardType === 'GOODS') {
          html += '<div class="mkt-tpl-rule__extra">' + renderGoodsPick(ms.productSkus, 'task-' + i, locked) + '</div>';
        }
        html += '</div></div>';
      });
      if (!locked) {
        html += '<div class="mkt-tpl-add-rule"><button type="button" class="mkt-tpl-add-link" data-act="add-ms">+ 新增规则</button></div>';
      }
      html += renderClaimValidity(locked);
    }

    html += '</div>';
    body.innerHTML = html;
  }

  function renderScopePicker(locked) {
    var html = '';
    html += '<div class="mkt-tpl-radios">';
    html += radio('fItemScope', 'ALL', edit.coupon.itemScope, '全部', locked);
    html += radio('fItemScope', 'GOODS', edit.coupon.itemScope, '指定商品', locked);
    html += radio('fItemScope', 'CATEGORY', edit.coupon.itemScope, '指定类目', locked);
    html += '</div>';
    if (edit.coupon.itemScope === 'GOODS') {
      html += '<div class="mkt-tpl-tags" style="margin-top:8px">';
      html += skuChips(edit.coupon.productSkus, !locked, 'coupon');
      if (!locked) html += '<button type="button" class="mkt-tpl-add-link" data-act="add-coupon-sku">+ 添加商品</button>';
      html += '</div>';
    } else if (edit.coupon.itemScope === 'CATEGORY') {
      html += '<div class="mkt-tpl-radios" style="margin:8px 0">';
      html += radio('fCatSrc', 'MALL', edit.coupon.categorySource, '商城类目', locked);
      html += radio('fCatSrc', 'LIVE', edit.coupon.categorySource, '直播类目', locked);
      html += '</div>';
      var cats = Store.categoriesOf(edit.coupon.categorySource);
      html += '<div class="mkt-tpl-cats">';
      cats.forEach(function (c) {
        var checked = edit.coupon.selectedCategories.some(function (x) {
          return x.id === c.id && x.source === c.source;
        });
        html +=
          '<label><input type="checkbox" data-cat-id="' +
          escapeHtml(c.id) +
          '" data-cat-name="' +
          escapeHtml(c.name) +
          '" data-cat-src="' +
          escapeHtml(c.source) +
          '"' +
          (checked ? ' checked' : '') +
          (locked ? ' disabled' : '') +
          '> ' +
          escapeHtml(c.name) +
          '</label>';
      });
      html += '</div>';
      var shown = edit.coupon.selectedCategories.filter(function (x) {
        return x.source === edit.coupon.categorySource;
      });
      if (shown.length) {
        html += '<div class="mkt-tpl-tags" style="margin-top:12px">';
        shown.forEach(function (c) {
          html +=
            '<span class="mkt-tpl-chip">' +
            escapeHtml((c.source === 'LIVE' ? '直播类目' : '商城类目') + '-' + c.name) +
            (!locked
              ? '<button type="button" class="mkt-tpl-chip__x" data-act="rm-cat" data-id="' +
                escapeHtml(c.id) +
                '" data-src="' +
                escapeHtml(c.source) +
                '">×</button>'
              : '') +
            '</span>';
        });
        html += '</div>';
      }
    }
    return html;
  }

  function readEditDom() {
    var typeEl = document.getElementById('fType');
    var nameEl = document.getElementById('fName');
    if (typeEl && edit.mode === 'add') {
      edit.base.activityType = typeEl.value;
    }
    if (nameEl) edit.base.name = nameEl.value;
    if (edit.base.activityType === 'COUPON') {
      var ch = document.querySelector('input[name="fChannel"]:checked');
      if (ch) edit.base.applicableChannel = ch.value;
    } else {
      edit.base.applicableChannel = 'LIVE_ONLY';
    }
    var stock = document.getElementById('fStock');
    if (stock) edit.base.totalStock = stock.value.replace(/\D/g, '').replace(/^0+/, '');

    var ct = document.getElementById('fCouponType');
    if (ct) edit.coupon.couponType = ct.value;
    var th = document.getElementById('fThreshold');
    if (th) edit.coupon.threshold = Number(th.value || 0);
    var den = document.getElementById('fDenomination');
    if (den) edit.coupon.denomination = Number(den.value || 0);
    var ts = document.querySelector('input[name="fTimeScope"]:checked');
    if (ts) edit.coupon.timeScope = ts.value;
    var t1 = document.getElementById('fTimeStart');
    var t2 = document.getElementById('fTimeEnd');
    if (t1) edit.coupon.timeStart = t1.value;
    if (t2) edit.coupon.timeEnd = t2.value;
    var iscope = document.querySelector('input[name="fItemScope"]:checked');
    if (iscope) edit.coupon.itemScope = iscope.value;
    var csrc = document.querySelector('input[name="fCatSrc"]:checked');
    if (csrc) edit.coupon.categorySource = csrc.value;
    var cm = document.getElementById('fClaimMode');
    if (cm) edit.coupon.claimLimitMode = cm.value;
    var pu = document.getElementById('fPerUser');
    if (pu) edit.coupon.perUserLimit = Math.max(1, Number(pu.value || 1));

    var prize = document.querySelector('input[name="fPrize"]:checked');
    if (prize) edit.bag.prizeType = prize.value;
    var pts = document.getElementById('fPoints');
    if (pts) edit.bag.pointsAmount = Number(pts.value || 0);
    var bc = document.getElementById('fBagCoupon');
    if (bc) edit.bag.couponActivityId = bc.value;
    var claimRadios = document.querySelectorAll('input[name="fClaimVal"]');
    var cv = document.querySelector('input[name="fClaimVal"]:checked');
    var cvn = document.getElementById('fClaimValN');
    var cu = document.getElementById('fClaimUnit');
    var claim = claimState();
    if (claim && claimRadios.length) {
      claim.claimValidityType = cv ? cv.value : '';
      if (cvn) claim.claimValidityValue = cvn.value.replace(/\D/g, '');
      if (cu) claim.claimValidityUnit = cu.value;
    }
    var pickupRadios = document.querySelectorAll('input[name="fPickupAuto"]');
    var pickup = document.querySelector('input[name="fPickupAuto"]:checked');
    if (claim && pickupRadios.length) {
      claim.pickupAutoClaim = pickup ? pickup.value : '';
    }

    var rounds = document.getElementById('fRounds');
    if (rounds) {
      edit.sign.totalRounds = String(rounds.value || '').replace(/\D/g, '').replace(/^0+/, '') || '1';
      syncSignRounds();
    }
    var sm = document.querySelector('input[name="fSignMode"]:checked');
    if (sm) edit.sign.mode = sm.value;
    edit.sign.roundRewards.forEach(function (rw, i) {
      var rt = document.querySelector('input[name="fRwType' + i + '"]:checked');
      if (rt) rw.rewardType = rt.value;
      var rp = document.querySelector('[data-rw-points="' + i + '"]');
      if (rp) rw.pointsAmount = Number(rp.value || 5);
      var rc = document.querySelector('[data-rw-coupon="' + i + '"]');
      if (rc) rw.couponActivityId = rc.value;
      rw.productSkus = rw.productSkus || [];
    });
    var cty = document.querySelector('input[name="fCompleteType"]:checked');
    if (cty) edit.sign.completeReward.rewardType = cty.value;
    var cpts = document.getElementById('fCompletePts');
    if (cpts) edit.sign.completeReward.pointsAmount = Number(cpts.value || 5);
    var cc = document.getElementById('fCompleteCoupon');
    if (cc) edit.sign.completeReward.couponActivityId = cc.value;
    var cont = document.getElementById('fContinuous');
    if (cont) edit.sign.continuousRequired = cont.checked;
    edit.sign.completeReward.productSkus = edit.sign.completeReward.productSkus || [];

    edit.task.milestones.forEach(function (ms, i) {
      var mn = document.querySelector('[data-ms-min="' + i + '"]');
      var mp = document.querySelector('[data-ms-pts="' + i + '"]');
      var mt = document.querySelector('input[name="fMsType' + i + '"]:checked');
      var mc = document.querySelector('[data-ms-coupon="' + i + '"]');
      if (mn) ms.minutes = Number(mn.value || 1);
      if (mp) ms.points = Number(mp.value || 1);
      if (mt) ms.rewardType = mt.value;
      if (mc) ms.couponActivityId = mc.value;
      ms.productSkus = ms.productSkus || [];
    });

    document.querySelectorAll('[data-cat-id]').forEach(function (el) {
      var id = el.getAttribute('data-cat-id');
      var name = el.getAttribute('data-cat-name');
      var src = el.getAttribute('data-cat-src');
      var exists = edit.coupon.selectedCategories.some(function (x) {
        return x.id === id && x.source === src;
      });
      if (el.checked && !exists) edit.coupon.selectedCategories.push({ id: id, name: name, source: src });
      if (!el.checked && exists) {
        edit.coupon.selectedCategories = edit.coupon.selectedCategories.filter(function (x) {
          return !(x.id === id && x.source === src);
        });
      }
    });
  }

  function toLocalDt(v) {
    if (!v) return '';
    return String(v).replace('T', ' ').slice(0, 19);
  }

  function defaultValid() {
    var t = new Date();
    var start = t.toISOString().slice(0, 19);
    var end = new Date(t.getTime() + 720 * 3600 * 1000).toISOString().slice(0, 19);
    return { validStart: start, validEnd: end };
  }

  function buildConfig() {
    var type = edit.base.activityType;
    if (type === 'COUPON') {
      var productScopeJson;
      if (edit.coupon.itemScope === 'GOODS') {
        productScopeJson = JSON.stringify({
          type: 'GOODS',
          items: edit.coupon.productSkus.map(function (n) {
            return { id: n.id, label: n.label, spuCode: n.spuCode, skuCode: n.skuCode };
          })
        });
      } else if (edit.coupon.itemScope === 'CATEGORY') {
        productScopeJson = JSON.stringify({
          type: 'CATEGORY',
          items: edit.coupon.selectedCategories.map(function (n) {
            return { id: n.id, name: n.name, source: n.source };
          })
        });
      }
      return {
        activityType: 'COUPON',
        couponType: edit.coupon.couponType,
        denomination: Number(edit.coupon.denomination),
        threshold: edit.coupon.couponType === 'FULL_MINUS' ? Number(edit.coupon.threshold) : 0,
        useScope: edit.coupon.itemScope,
        timeScope: edit.coupon.timeScope,
        itemScope: edit.coupon.itemScope,
        perUserLimit: edit.coupon.claimLimitMode === 'LIMITED' ? Number(edit.coupon.perUserLimit) : null,
        stackable: false,
        productScopeJson: productScopeJson
      };
    }
    if (type === 'FORTUNE_BAG') {
      var prizes;
      if (edit.bag.prizeType === 'POINTS') prizes = [{ refId: 'POINTS', amount: Number(edit.bag.pointsAmount) || 0, weight: 1 }];
      else if (edit.bag.prizeType === 'GOODS') {
        prizes = edit.bag.productSkus.slice(0, 1).map(function (n) {
          return { refId: n.skuCode || n.id, spuCode: n.spuCode, amount: 1, weight: 1 };
        });
      } else prizes = [{ refId: edit.bag.couponActivityId, amount: 1, weight: 1 }];
      var cfg = {
        activityType: 'FORTUNE_BAG',
        prizeType: edit.bag.prizeType,
        prizes: prizes,
        drawMode: 'SCHEDULED',
        winnerLimitMode: 'PER_SESSION'
      };
      if (edit.bag.prizeType === 'GOODS') {
        writeClaimToCfg(cfg, edit.bag);
        if (edit.bag.productSkus.length) {
          cfg.productScopeJson = JSON.stringify({
            items: edit.bag.productSkus.slice(0, 1).map(function (n) {
              return { id: n.id, label: n.label, spuCode: n.spuCode, skuCode: n.skuCode, spuId: n.spuId };
            })
          });
        }
      }
      return cfg;
    }
    if (type === 'SIGN_IN') {
      var s = {
        activityType: 'SIGN_IN',
        totalRounds: Number(edit.sign.totalRounds) || 1,
        mode: edit.sign.mode,
        continuousRequired: edit.sign.mode === 'ON_COMPLETE' ? !!edit.sign.continuousRequired : false
      };
      if (edit.sign.mode === 'PER_ROUND') s.roundRewards = edit.sign.roundRewards.map(packSignReward);
      else s.completeReward = packSignReward(edit.sign.completeReward);
      writeClaimToCfg(s, edit.sign);
      return s;
    }
    var taskCfg = {
      activityType: 'TASK',
      taskType: 'WATCH',
      milestones: edit.task.milestones.map(function (t, i) {
        return { index: i, threshold: Number(t.minutes) || 1, reward: packTaskReward(t) };
      })
    };
    writeClaimToCfg(taskCfg, edit.task);
    return taskCfg;
  }

  function packSignReward(rw) {
    var out = { rewardType: rw.rewardType || 'POINTS' };
    if (out.rewardType === 'POINTS') out.pointsAmount = Number(rw.pointsAmount) || 0;
    if (out.rewardType === 'COUPON') out.couponActivityId = rw.couponActivityId || '';
    if (out.rewardType === 'GOODS') out.productSkus = (rw.productSkus || []).slice(0, 1);
    return out;
  }

  function packTaskReward(t) {
    var out = { rewardType: t.rewardType || 'POINTS' };
    if (out.rewardType === 'POINTS') out.pointsAmount = Number(t.points) || 1;
    if (out.rewardType === 'COUPON') out.couponActivityId = t.couponActivityId || '';
    if (out.rewardType === 'GOODS') out.productSkus = (t.productSkus || []).slice(0, 1);
    return out;
  }

  function isCompleteSku(t) {
    return !!(t && (t.skuCode || t.id) && t.spuCode);
  }

  function rewardGoodsError(list) {
    if (!list || !list.length) return '请选择商品';
    if (list.length > 1) return '奖励商品只能选择一个';
    if (!isCompleteSku(list[0])) return '商品必须选择到规格（SKU），请重新选择';
    return '';
  }

  function validate() {
    if (!edit.base.activityType) return '请选择模板类型';
    if (!String(edit.base.name || '').trim()) return '请输入模板名称';
    var type = edit.base.activityType;
    if (type === 'COUPON' || type === 'FORTUNE_BAG') {
      if (!/^[1-9]\d{0,7}$/.test(String(edit.base.totalStock || '').trim())) return '发放数量最多支持 8 位正整数';
    }
    if (type === 'COUPON') {
      if (edit.coupon.couponType === 'FULL_MINUS' && (Number(edit.coupon.threshold) <= 0 || Number(edit.coupon.denomination) <= 0)) {
        return '请填写正确的减免条件';
      }
      if (edit.coupon.couponType === 'FULL_MINUS' && Number(edit.coupon.denomination) > Number(edit.coupon.threshold)) {
        return '满减金额不能大于消费金额';
      }
      if (edit.coupon.couponType === 'NO_THRESHOLD' && Number(edit.coupon.denomination) <= 0) return '请填写正确的减免金额';
      if (edit.coupon.timeScope === 'SPECIFIC' && (!edit.coupon.timeStart || !edit.coupon.timeEnd)) return '请选择起止时间';
      if (edit.coupon.itemScope === 'GOODS' && !edit.coupon.productSkus.length) return '请选择商品';
      if (edit.coupon.itemScope === 'CATEGORY' && !edit.coupon.selectedCategories.length) return '请选择类目';
    }
    if (type === 'FORTUNE_BAG') {
      if (edit.bag.prizeType === 'GOODS') {
        var bagGoodsErr = rewardGoodsError(edit.bag.productSkus);
        if (bagGoodsErr) return bagGoodsErr;
      }
      if (edit.bag.prizeType === 'COUPON' && !edit.bag.couponActivityId) return '请选择优惠券活动';
    }
    if (type === 'SIGN_IN') {
      var rounds = Number(edit.sign.totalRounds);
      if (!rounds || rounds < 1) return '总签到次数至少 1 次';
      if (rounds > 99999999) return '总签到次数最多支持 8 位正整数';
      var signRewards =
        edit.sign.mode === 'PER_ROUND' ? edit.sign.roundRewards : [edit.sign.completeReward];
      if (signRewards.some(function (rw) { return rw.rewardType === 'COUPON' && !rw.couponActivityId; })) {
        return '请选择优惠券活动';
      }
      for (var si = 0; si < signRewards.length; si++) {
        if (signRewards[si].rewardType === 'GOODS') {
          var signGoodsErr = rewardGoodsError(signRewards[si].productSkus);
          if (signGoodsErr) return signGoodsErr;
        }
      }
    }
    if (type === 'TASK') {
      if (
        edit.task.milestones.some(function (ms) {
          return ms.rewardType === 'COUPON' && !ms.couponActivityId;
        })
      ) {
        return '请选择优惠券活动';
      }
      for (var ti = 0; ti < edit.task.milestones.length; ti++) {
        if (edit.task.milestones[ti].rewardType === 'GOODS') {
          var taskGoodsErr = rewardGoodsError(edit.task.milestones[ti].productSkus);
          if (taskGoodsErr) return taskGoodsErr;
        }
      }
    }
    var claimErr = claimValidityError();
    if (claimErr) return claimErr;
    return '';
  }

  function openEdit(mode, item) {
    var blank = emptyForm();
    edit.open = true;
    edit.mode = mode;
    edit.id = item ? item.id : '';
    edit.base = blank.base;
    edit.coupon = blank.coupon;
    edit.bag = blank.bag;
    edit.sign = blank.sign;
    edit.task = blank.task;
    if (item) fillFromItem(item);
    setHidden(document.getElementById('tplEditBackdrop'), false);
    renderEditBody();
  }

  function closeEdit() {
    edit.open = false;
    setHidden(document.getElementById('tplEditBackdrop'), true);
    setHidden(document.getElementById('tplSkuBackdrop'), true);
  }

  function saveEdit() {
    readEditDom();
    var err = validate();
    if (err) {
      toast(err, 'error');
      return;
    }
    var valid = defaultValid();
    if (edit.base.activityType === 'COUPON' && edit.coupon.timeScope === 'SPECIFIC') {
      valid.validStart = toLocalDt(edit.coupon.timeStart);
      valid.validEnd = toLocalDt(edit.coupon.timeEnd);
    }
    var payload = {
      activityType: edit.base.activityType,
      name: edit.base.name.trim(),
      validStart: valid.validStart,
      validEnd: valid.validEnd,
      totalStock:
        edit.base.activityType === 'COUPON' || edit.base.activityType === 'FORTUNE_BAG'
          ? Number(edit.base.totalStock)
          : null,
      applicableChannel: edit.base.applicableChannel,
      config: buildConfig()
    };
    if (edit.mode === 'edit' && edit.id) Store.updateItem(edit.id, payload);
    else Store.createItem(payload);
    toast('保存成功', 'success');
    closeEdit();
    renderTable();
  }

  /* —— SKU 选择 —— */
  var skuUi = { checked: {}, keyword: '' };

  function skuLabel(p, sku) {
    return p.title + '（' + sku.skuName + '（' + sku.skuCode + '））';
  }

  function renderSkuTree() {
    var box = document.getElementById('tplSkuTree');
    var hint = document.getElementById('tplSkuHint');
    if (!box) return;
    var products = Store.searchProducts(skuUi.keyword);
    var inputType = edit.skuSingle ? 'radio' : 'checkbox';
    box.innerHTML = products
      .map(function (p) {
        var children = (p.skus || [])
          .map(function (s) {
            return (
              '<div class="mkt-tpl-sku-node mkt-tpl-sku-node--child"><label><input type="' +
              inputType +
              '"' +
              (edit.skuSingle ? ' name="tplSkuPick"' : '') +
              ' data-sku="' +
              escapeHtml(s.skuCode) +
              '" data-spu="' +
              escapeHtml(p.spuCode) +
              '" data-spuid="' +
              escapeHtml(p.id) +
              '" data-label="' +
              escapeHtml(skuLabel(p, s)) +
              '"' +
              (skuUi.checked[s.skuCode] ? ' checked' : '') +
              '> ' +
              escapeHtml(s.skuName + '（' + s.skuCode + '）') +
              '</label></div>'
            );
          })
          .join('');
        return (
          '<div class="mkt-tpl-sku-node"><strong>' +
          escapeHtml(p.title) +
          '</strong></div>' +
          (children ||
            '<div class="mkt-tpl-sku-node mkt-tpl-sku-node--child">' +
            escapeHtml(p.spuCode) +
            (edit.skuSingle ? '（暂无可选规格，不能作为奖励商品）' : '（暂无可选规格）') +
            '</div>')
        );
      })
      .join('');
    var n = Object.keys(skuUi.checked).length;
    hint.textContent = edit.skuSingle
      ? n
        ? '已选 1 个规格（SKU）'
        : '请选择 1 个规格（SKU），商品行不可选'
      : '已选 ' + n + ' 个规格';
  }

  function openSkuPicker(target, selected, single) {
    edit.skuTarget = target;
    edit.skuSingle = !!single;
    skuUi.keyword = '';
    skuUi.checked = {};
    var seed = selected || [];
    if (edit.skuSingle && seed.length > 1) seed = seed.slice(0, 1);
    seed.forEach(function (s) {
      skuUi.checked[s.skuCode || s.id] = {
        id: s.skuCode || s.id,
        skuCode: s.skuCode || s.id,
        spuCode: s.spuCode,
        spuId: s.spuId,
        label: s.label
      };
    });
    var title = document.getElementById('tplSkuTitle');
    if (title) {
      title.textContent = edit.skuSingle ? '选择商品（仅 1 个规格）' : '选择商品（精确到规格）';
    }
    document.getElementById('tplSkuKeyword').value = '';
    setHidden(document.getElementById('tplSkuBackdrop'), false);
    renderSkuTree();
  }

  function confirmSku() {
    var keys = Object.keys(skuUi.checked);
    if (edit.skuSingle) {
      if (keys.length !== 1) {
        toast(keys.length ? '奖励商品只能选择一个' : '请选择到规格（SKU）', 'error');
        return;
      }
      var one = skuUi.checked[keys[0]];
      if (!one.skuCode || !one.spuCode) {
        toast('商品必须选择到规格（SKU）', 'error');
        return;
      }
    }
    var items = keys.map(function (k) {
      return skuUi.checked[k];
    });
    setSkuList(edit.skuTarget, items);
    setHidden(document.getElementById('tplSkuBackdrop'), true);
    renderEditBody();
  }

  /* —— 操作日志 —— */
  var FIELD_LABEL = {
    name: '模板名称',
    status: '状态',
    validStart: '有效期起',
    validEnd: '有效期止',
    totalStock: '发放数量',
    applicableChannel: '适用渠道',
    'config.couponType': '优惠券类型',
    'config.denomination': '面额',
    'config.threshold': '门槛',
    'config.itemScope': '适用商品',
    'config.productScopeJson': '商品范围',
    'config.perUserLimit': '每人限领',
    'config.stackable': '是否可叠加'
  };
  var VALUE_MAP = {
    status: { ACTIVE: '启用', PAUSED: '禁用', DRAFT: '草稿' },
    applicableChannel: Store.CHANNEL_LABEL,
    'config.itemScope': Store.SCOPE_LABEL,
    'config.stackable': { true: '可叠加', false: '不可叠加' }
  };

  function formatLogValue(field, value) {
    if (value == null || value === '') return '—';
    var map = VALUE_MAP[field];
    if (map && map[String(value)] != null) return map[String(value)];
    return String(value);
  }

  function renderLogs() {
    var tbody = document.getElementById('tplLogTableBody');
    if (!tbody) return;
    var data = Store.listLogs(logState.activityId, logState.page, logState.pageSize);
    if (!data.list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="mkt-tpl-empty">暂无数据</td></tr>';
    } else {
      tbody.innerHTML = data.list
        .map(function (row) {
          return (
            '<tr>' +
            '<td>' +
            escapeHtml(row.timestamp) +
            '</td>' +
            '<td>' +
            escapeHtml(Store.ACTION_LABEL[row.action] || row.action || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(row.operator || '—') +
            '</td>' +
            '<td><span class="mkt-tpl-log-method">' +
            escapeHtml([row.httpMethod, row.requestUri].filter(Boolean).join(' ') || '—') +
            '</span></td>' +
            '<td style="text-align:center"><span class="mkt-tpl-tag ' +
            (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
            '">' +
            (row.success ? '成功' : '失败') +
            '</span></td>' +
            '<td><button type="button" class="mkt-tpl-name" data-act="log-detail" data-id="' +
            escapeHtml(row.id) +
            '">查看详情</button></td></tr>'
          );
        })
        .join('');
    }
    if (typeof createPagination === 'function') {
      createPagination({
        containerId: 'tplLogPagination',
        totalItems: data.total,
        currentPage: logState.page,
        pageSize: logState.pageSize,
        pageSizeOptions: [10, 20, 50],
        onPageChange: function (p) {
          logState.page = p;
          renderLogs();
        },
        onPageSizeChange: function (s) {
          logState.pageSize = s;
          logState.page = 1;
          renderLogs();
        }
      });
    }
  }

  function openLog(item) {
    logState.activityId = item.id;
    logState.activityName = item.name;
    logState.page = 1;
    document.getElementById('tplLogTitle').textContent = '操作日志 · ' + (item.name || item.id);
    setHidden(document.getElementById('tplLogDrawer'), false);
    renderLogs();
  }

  function closeLog() {
    setHidden(document.getElementById('tplLogDrawer'), true);
    setHidden(document.getElementById('tplLogDetailBackdrop'), true);
  }

  function openLogDetail(id) {
    var row = Store.findLog(id);
    var body = document.getElementById('tplLogDetailBody');
    if (!body) return;
    if (!row) {
      toast('未找到该条操作日志', 'error');
      return;
    }
    var changes = row.changes || [];
    var pretty;
    try {
      pretty = JSON.stringify(JSON.parse(row.requestParams), null, 2);
    } catch (e) {
      pretty = String(row.requestParams || '—');
    }
    body.innerHTML =
      '<div class="mkt-tpl-log-detail__head">' +
      '<span class="mkt-tpl-tag ' +
      (row.success ? 'mkt-tpl-tag--success' : 'mkt-tpl-tag--warning') +
      '">' +
      (row.success ? '成功' : '失败') +
      '</span>' +
      '<span class="mkt-tpl-log-detail__action">' +
      escapeHtml(Store.ACTION_LABEL[row.action] || row.action || '—') +
      '</span></div>' +
      '<div class="mkt-tpl-log-detail__meta">' +
      '<div><dt>操作时间</dt><dd>' +
      escapeHtml(row.timestamp || '—') +
      '</dd></div>' +
      '<div><dt>操作人</dt><dd>' +
      escapeHtml(row.operator || '—') +
      '</dd></div>' +
      '<div><dt>查询对象</dt><dd>' +
      escapeHtml([row.resource, row.resourceId].filter(Boolean).join('-') || '—') +
      '</dd></div>' +
      '<div><dt>客户端IP</dt><dd>' +
      escapeHtml(row.clientIp || '—') +
      '</dd></div>' +
      '<div><dt>来源服务</dt><dd>' +
      escapeHtml(row.service || '—') +
      '</dd></div>' +
      '<div><dt>耗时</dt><dd>' +
      escapeHtml(row.elapsedMs != null ? row.elapsedMs + ' ms' : '—') +
      '</dd></div></div>' +
      '<div class="mkt-tpl-log-detail__section-title">变更明细 <span class="mkt-tpl-log-detail__count">（共 ' +
      changes.length +
      ' 个字段）</span></div>' +
      (changes.length
        ? '<table class="table"><thead><tr><th>字段</th><th>变更前</th><th>变更后</th></tr></thead><tbody>' +
          changes
            .map(function (c) {
              return (
                '<tr><td>' +
                escapeHtml(FIELD_LABEL[c.field] || c.field) +
                '</td><td class="mkt-tpl-log-old">' +
                escapeHtml(formatLogValue(c.field, c.oldValue)) +
                '</td><td class="mkt-tpl-log-new">' +
                escapeHtml(formatLogValue(c.field, c.newValue)) +
                '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table>'
        : '<div class="mkt-tpl-empty">无字段级变更</div>') +
      '<div class="mkt-tpl-log-detail__section-title">请求参数</div>' +
      '<div class="mkt-tpl-log-uri">' +
      escapeHtml((row.httpMethod || '') + ' ' + (row.requestUri || '')) +
      '</div>' +
      '<pre class="mkt-tpl-log-params">' +
      escapeHtml(pretty) +
      '</pre>';
    setHidden(document.getElementById('tplLogDetailBackdrop'), false);
  }

  function handleAct(act, id, evt) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    var item = Store.findById(id);
    if (act === 'more') {
      var next = state.moreOpenId === id ? '' : id;
      state.moreOpenId = next;
      document.querySelectorAll('.mkt-tpl-more').forEach(function (el) {
        var btn = el.querySelector('[data-act="more"]');
        el.classList.toggle('is-open', !!(btn && btn.getAttribute('data-id') === next));
      });
      return;
    }
    state.moreOpenId = '';
    document.querySelectorAll('.mkt-tpl-more.is-open').forEach(function (el) {
      el.classList.remove('is-open');
    });
    if (act === 'view' && item) {
      openEdit('view', item);
      return;
    }
    if (act === 'edit' && item) {
      openEdit('edit', item);
      return;
    }
    if (act === 'operationLog' && item) {
      openLog(item);
      return;
    }
    if (act === 'toggle' && item) {
      var enable = item.status !== 'ACTIVE';
      var msg = enable ? '确认启用模板「' + item.name + '」吗？' : '确认禁用模板「' + item.name + '」吗？';
      if (!window.confirm(msg)) return;
      Store.setStatus(item.id, enable ? 'ACTIVE' : 'PAUSED');
      toast(enable ? '已启用' : '已禁用', 'success');
      renderTable();
    }
  }

  function bind() {
    document.getElementById('tplFilterQuery').addEventListener('click', function () {
      state.activityType = document.getElementById('qTplType').value;
      state.page = 1;
      renderTable();
    });
    document.getElementById('tplFilterReset').addEventListener('click', function () {
      document.getElementById('qTplType').value = '';
      state.activityType = '';
      state.page = 1;
      renderTable();
    });
    document.getElementById('tplAddBtn').addEventListener('click', function () {
      openEdit('add', null);
    });
    document.getElementById('tplTableBody').addEventListener('click', function (e) {
      var btn = closestAct(e.target);
      if (!btn) return;
      handleAct(btn.getAttribute('data-act'), btn.getAttribute('data-id'), e);
    });
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.mkt-tpl-more')) return;
      if (!state.moreOpenId) return;
      state.moreOpenId = '';
      document.querySelectorAll('.mkt-tpl-more.is-open').forEach(function (el) {
        el.classList.remove('is-open');
      });
    });

    document.getElementById('tplEditClose').addEventListener('click', closeEdit);
    document.getElementById('tplEditCancel').addEventListener('click', closeEdit);
    document.getElementById('tplEditSave').addEventListener('click', saveEdit);
    document.getElementById('tplEditBackdrop').addEventListener('click', function (e) {
      if (e.target === document.getElementById('tplEditBackdrop')) closeEdit();
    });
    document.getElementById('tplEditBody').addEventListener('change', function (e) {
      var prevScope = edit.coupon.itemScope;
      var el = e.target;
      readEditDom();
      if (edit.coupon.itemScope !== prevScope) {
        if (edit.coupon.itemScope !== 'GOODS') edit.coupon.productSkus = [];
        if (edit.coupon.itemScope !== 'CATEGORY') edit.coupon.selectedCategories = [];
      }
      if (el && el.id === 'fRounds') syncSignRounds();
      if (shouldRerenderEdit(el)) renderEditBody();
    });
    document.getElementById('tplEditBody').addEventListener('input', function (e) {
      if (e.target && e.target.id === 'fName') {
        var n = document.getElementById('fNameCount');
        if (n) n.textContent = String(e.target.value.length) + '/50';
        edit.base.name = e.target.value;
      }
    });
    document.getElementById('tplEditBody').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'add-coupon-sku') {
        readEditDom();
        openSkuPicker('coupon', edit.coupon.productSkus, false);
      } else if (act === 'add-bag-sku' || act === 'add-sku') {
        readEditDom();
        var from = btn.getAttribute('data-from') || (act === 'add-bag-sku' ? 'bag' : '');
        openSkuPicker(from, getSkuList(from), isRewardSkuTarget(from));
      } else if (act === 'rm-sku') {
        readEditDom();
        var sid = btn.getAttribute('data-id');
        var fromRm = btn.getAttribute('data-from') || '';
        if (fromRm) {
          setSkuList(
            fromRm,
            getSkuList(fromRm).filter(function (s) {
              return s.id !== sid;
            })
          );
        } else {
          edit.coupon.productSkus = edit.coupon.productSkus.filter(function (s) { return s.id !== sid; });
          edit.bag.productSkus = edit.bag.productSkus.filter(function (s) { return s.id !== sid; });
        }
        renderEditBody();
      } else if (act === 'rm-cat') {
        readEditDom();
        var cid = btn.getAttribute('data-id');
        var src = btn.getAttribute('data-src');
        edit.coupon.selectedCategories = edit.coupon.selectedCategories.filter(function (x) {
          return !(x.id === cid && x.source === src);
        });
        renderEditBody();
      } else if (act === 'add-ms') {
        readEditDom();
        edit.task.milestones.push({ minutes: 5, points: 10, rewardType: 'POINTS', couponActivityId: '', productSkus: [] });
        renderEditBody();
      } else if (act === 'rm-ms') {
        readEditDom();
        edit.task.milestones.splice(Number(btn.getAttribute('data-i')), 1);
        renderEditBody();
      }
    });

    document.getElementById('tplSkuClose').addEventListener('click', function () {
      setHidden(document.getElementById('tplSkuBackdrop'), true);
    });
    document.getElementById('tplSkuCancel').addEventListener('click', function () {
      setHidden(document.getElementById('tplSkuBackdrop'), true);
    });
    document.getElementById('tplSkuOk').addEventListener('click', confirmSku);
    document.getElementById('tplSkuKeyword').addEventListener('input', function () {
      skuUi.keyword = this.value;
      renderSkuTree();
    });
    document.getElementById('tplSkuTree').addEventListener('change', function (e) {
      var el = e.target;
      if (!el || !el.getAttribute('data-sku')) return;
      var code = el.getAttribute('data-sku');
      if (el.checked) {
        if (edit.skuSingle) skuUi.checked = {};
        skuUi.checked[code] = {
          id: code,
          skuCode: code,
          spuCode: el.getAttribute('data-spu'),
          spuId: el.getAttribute('data-spuid'),
          label: el.getAttribute('data-label')
        };
      } else {
        delete skuUi.checked[code];
      }
      renderSkuTree();
    });

    document.getElementById('tplLogClose').addEventListener('click', closeLog);
    document.getElementById('tplLogMask').addEventListener('click', closeLog);
    document.getElementById('tplLogTableBody').addEventListener('click', function (e) {
      var btn = closestAct(e.target);
      if (!btn || btn.getAttribute('data-act') !== 'log-detail') return;
      e.preventDefault();
      e.stopPropagation();
      openLogDetail(btn.getAttribute('data-id'));
    });
    document.getElementById('tplLogDetailClose').addEventListener('click', function () {
      setHidden(document.getElementById('tplLogDetailBackdrop'), true);
    });
    document.getElementById('tplLogDetailOk').addEventListener('click', function () {
      setHidden(document.getElementById('tplLogDetailBackdrop'), true);
    });
    document.getElementById('tplLogDetailBackdrop').addEventListener('click', function (e) {
      if (e.target === document.getElementById('tplLogDetailBackdrop')) {
        setHidden(document.getElementById('tplLogDetailBackdrop'), true);
      }
    });
  }

  try {
    bind();
    renderTable();
  } catch (err) {
    console.error(err);
    toast('页面初始化失败：' + ((err && err.message) || err), 'error');
  }
})();
