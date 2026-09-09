/**
 * 优惠券新建/编辑/查看/审核 — 表单渲染
 * 整页编辑用 pts-rule-field / erp-input（36px），不要套模版配置弹窗的 mkt-tpl-row（32px）
 */
(function (global) {
  'use strict';

  var Store = null;
  var model = null;
  var locked = false;
  var skuUi = { keyword: '', checked: {} };
  var onRerender = null;
  var hostEl = null;

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

  function emptyModel() {
    return {
      name: '',
      couponType: 'FULL_MINUS',
      threshold: 0,
      denomination: 0,
      applicableChannel: 'ALL',
      timeScope: 'UNLIMITED',
      timeStart: '',
      timeEnd: '',
      itemScope: 'ALL',
      productSkus: [],
      selectedCategories: [],
      categorySource: 'MALL',
      claimLimitMode: 'UNLIMITED',
      perUserLimit: 1,
      totalStock: '',
      issueSceneMode: '',
      issueScenes: []
    };
  }

  function fillFromItem(item) {
    var m = emptyModel();
    if (!item) return m;
    var cfg = item.config || {};
    m.name = item.name || '';
    m.couponType = cfg.couponType || 'FULL_MINUS';
    m.threshold = Number(cfg.threshold || 0);
    m.denomination = Number(cfg.denomination || 0);
    m.applicableChannel = item.applicableChannel || 'ALL';
    m.timeScope = cfg.timeScope || 'UNLIMITED';
    if (m.timeScope === 'SPECIFIC') {
      m.timeStart = String(item.validStart || '').replace(' ', 'T').slice(0, 16);
      m.timeEnd = String(item.validEnd || '').replace(' ', 'T').slice(0, 16);
    }
    m.itemScope = cfg.itemScope || 'ALL';
    m.perUserLimit = cfg.perUserLimit || 1;
    m.claimLimitMode = cfg.perUserLimit ? 'LIMITED' : 'UNLIMITED';
    m.totalStock = item.totalStock == null ? '' : String(item.totalStock);
    m.issueSceneMode = item.issueSceneMode || '';
    m.issueScenes = typeof Store.migrateIssueScenes === 'function'
      ? Store.migrateIssueScenes(item.issueScenes)
      : (Array.isArray(item.issueScenes) ? item.issueScenes.slice() : []);
    try {
      var scope = typeof cfg.productScopeJson === 'string' ? JSON.parse(cfg.productScopeJson) : cfg.productScopeJson;
      if (scope && scope.type === 'GOODS' && Array.isArray(scope.items)) {
        m.itemScope = 'GOODS';
        m.productSkus = scope.items.map(function (n) {
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
        m.itemScope = 'CATEGORY';
        m.selectedCategories = scope.items.map(function (n) {
          return { id: String(n.id || ''), name: String(n.name || n.id || ''), source: n.source === 'LIVE' ? 'LIVE' : 'MALL' };
        });
        if (m.selectedCategories[0]) m.categorySource = m.selectedCategories[0].source;
      }
    } catch (e) {
      /* ignore */
    }
    return m;
  }

  function radio(name, value, current, label, disabled) {
    return (
      '<label class="pts-rule-check-label"><input type="radio" name="' +
      name +
      '" value="' +
      value +
      '"' +
      (current === value ? ' checked' : '') +
      (disabled ? ' disabled' : '') +
      '> ' +
      escapeHtml(label) +
      '</label>'
    );
  }

  function fieldRow(req, label, controlHtml) {
    return (
      '<div class="pts-rule-field"><label class="pts-rule-field__label">' +
      (req ? '<span class="erp-req">*</span>' : '') +
      escapeHtml(label) +
      '</label><div class="pts-rule-field__control">' +
      controlHtml +
      '</div></div>'
    );
  }

  function skuChips(list, removable) {
    if (!list || !list.length) return '';
    return list
      .map(function (s) {
        return (
          '<span class="mkt-tpl-chip">' +
          escapeHtml(s.label || s.id) +
          (removable
            ? '<button type="button" class="mkt-tpl-chip__x" data-act="rm-sku" data-id="' +
              escapeHtml(s.id) +
              '">×</button>'
            : '') +
          '</span>'
        );
      })
      .join('');
  }

  function renderScopePicker() {
    var html = '';
    html += '<div class="pts-rule-check-row">';
    html += radio('fItemScope', 'ALL', model.itemScope, '全部', locked);
    html += radio('fItemScope', 'GOODS', model.itemScope, '指定商品', locked);
    html += radio('fItemScope', 'CATEGORY', model.itemScope, '指定类目', locked);
    html += '</div>';
    if (model.itemScope === 'GOODS') {
      var goodsCount = Store && Store.groupSkuItems ? Store.groupSkuItems(model.productSkus || []).length : (model.productSkus || []).length;
      html += '<div class="mkt-cp-goods-count-row">';
      if (goodsCount) {
        html +=
          '<button type="button" class="mkt-tpl-name" data-act="view-goods">' +
          goodsCount +
          '个商品</button>';
      } else {
        html += '<span class="mkt-cp-goods-count-empty">指定商品（0）</span>';
      }
      html += '</div>';
      html += '<div class="mkt-tpl-tags" style="margin-top:8px">';
      if (!locked) html += skuChips(model.productSkus, true);
      if (!locked) html += '<button type="button" class="mkt-tpl-add-link" data-act="add-coupon-sku">+ 添加商品</button>';
      html += '</div>';
    } else if (model.itemScope === 'CATEGORY') {
      var catCount = (model.selectedCategories || []).length;
      html += '<div class="mkt-cp-goods-count-row">';
      if (catCount) {
        html +=
          '<button type="button" class="mkt-tpl-name" data-act="view-cats">' +
          '指定类目（' +
          catCount +
          '）</button>';
      } else {
        html += '<span class="mkt-cp-goods-count-empty">指定类目（0）</span>';
      }
      html += '</div>';
      html += '<div class="pts-rule-check-row" style="margin:8px 0">';
      html += radio('fCatSrc', 'MALL', model.categorySource, '商城类目', locked);
      html += radio('fCatSrc', 'LIVE', model.categorySource, '直播类目', locked);
      html += '</div>';
      var cats = Store.categoriesOf(model.categorySource);
      html += '<div class="pts-rule-check-row mkt-cp-cats">';
      cats.forEach(function (c) {
        var checked = model.selectedCategories.some(function (x) {
          return x.id === c.id && x.source === c.source;
        });
        html +=
          '<label class="pts-rule-check-label"><input type="checkbox" data-cat-id="' +
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
      var shown = model.selectedCategories.filter(function (x) {
        return x.source === model.categorySource;
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

  function renderScene() {
    var html = '<div class="pts-rule-check-row">';
    html += radio('fSceneMode', 'ALL', model.issueSceneMode, '全部', locked);
    html += radio('fSceneMode', 'SPECIFIC', model.issueSceneMode, '指定场景', locked);
    html += '</div>';
    if (model.issueSceneMode === 'SPECIFIC') {
      html += '<div class="mkt-cp-scene-checks">';
      Store.SCENE_OPTIONS.forEach(function (o) {
        html +=
          '<label class="pts-rule-check-label"><input type="checkbox" data-scene="' +
          escapeHtml(o.v) +
          '"' +
          (model.issueScenes.indexOf(o.v) >= 0 ? ' checked' : '') +
          (locked ? ' disabled' : '') +
          '> ' +
          escapeHtml(o.l) +
          '</label>';
      });
      html += '</div>';
    }
    html += '<div class="pts-rule-tip">发放场景决定该券能否被直播场次、福袋、签到、观看任务、商城推荐位、会员等级、会员手工发券选择。</div>';
    return html;
  }

  function html() {
    var dis = locked ? ' disabled' : '';
    var out = '';
    out += '<div class="pts-rule-card">';
    out += '<div class="pts-rule-card__title">基本信息</div>';
    out += '<div class="pts-rule-card__body">';
    out += fieldRow(
      true,
      '券名称',
      '<div class="mkt-cp-name-row"><input class="erp-input pts-rule-field__input--name" id="fName" type="text" maxlength="50" placeholder="请输入券名称" value="' +
        escapeHtml(model.name) +
        '"' +
        dis +
        '><span class="pts-rule-unit__text" id="fNameCount">' +
        String(model.name.length) +
        '/50</span></div>'
    );
    out += fieldRow(true, '发放场景', renderScene());
    out += '</div></div>';

    out += '<div class="pts-rule-card">';
    out += '<div class="pts-rule-card__title">券规则</div>';
    out += '<div class="pts-rule-card__body">';
    out += fieldRow(
      false,
      '优惠券类型',
      '<select id="fCouponType" class="erp-select pts-rule-field__input--name"' +
        dis +
        '><option value="NO_THRESHOLD"' +
        (model.couponType === 'NO_THRESHOLD' ? ' selected' : '') +
        '>无门槛</option><option value="FULL_MINUS"' +
        (model.couponType === 'FULL_MINUS' ? ' selected' : '') +
        '>满减</option></select>'
    );
    if (model.couponType === 'FULL_MINUS') {
      out += fieldRow(
        false,
        '减免条件',
        '<div class="pts-rule-unit"><span class="pts-rule-unit__text">消费满</span>' +
          '<input class="erp-input" id="fThreshold" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(model.threshold)) +
          '"' +
          dis +
          '><span class="pts-rule-unit__text">元 减</span>' +
          '<input class="erp-input" id="fDenomination" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(model.denomination)) +
          '"' +
          dis +
          '><span class="pts-rule-unit__text">元</span></div>'
      );
    } else {
      out += fieldRow(
        false,
        '减免金额',
        '<div class="pts-rule-unit"><input class="erp-input" id="fDenomination" type="number" min="0" step="0.01" value="' +
          escapeHtml(String(model.denomination)) +
          '"' +
          dis +
          '><span class="pts-rule-unit__text">元</span></div>'
      );
    }
    out += fieldRow(
      true,
      '适用渠道',
      '<div class="pts-rule-check-row">' +
        radio('fChannel', 'ALL', model.applicableChannel, '全部渠道', locked) +
        radio('fChannel', 'LIVE_ONLY', model.applicableChannel, '仅直播', locked) +
        radio('fChannel', 'MALL_ONLY', model.applicableChannel, '仅商城', locked) +
        '</div>'
    );
    out += fieldRow(
      true,
      '可用时间',
      '<div class="pts-rule-check-row">' +
        radio('fTimeScope', 'UNLIMITED', model.timeScope, '不限制', locked) +
        radio('fTimeScope', 'SPECIFIC', model.timeScope, '指定时间', locked) +
        '</div>'
    );
    if (model.timeScope === 'SPECIFIC') {
      out += fieldRow(
        false,
        '起止时间',
        '<div class="pts-rule-unit"><input class="erp-input mkt-cp-datetime" id="fTimeStart" type="datetime-local" value="' +
          escapeHtml(model.timeStart) +
          '"' +
          dis +
          '><span class="pts-rule-unit__text">至</span>' +
          '<input class="erp-input mkt-cp-datetime" id="fTimeEnd" type="datetime-local" value="' +
          escapeHtml(model.timeEnd) +
          '"' +
          dis +
          '></div>'
      );
    }
    out += fieldRow(true, '适用商品', renderScopePicker());
    var claimHtml =
      '<div class="pts-rule-unit"><select id="fClaimMode" class="erp-select"' +
      dis +
      '><option value="UNLIMITED"' +
      (model.claimLimitMode === 'UNLIMITED' ? ' selected' : '') +
      '>不限次数</option><option value="LIMITED"' +
      (model.claimLimitMode === 'LIMITED' ? ' selected' : '') +
      '>每人限领</option></select>';
    if (model.claimLimitMode === 'LIMITED') {
      claimHtml +=
        '<input class="erp-input" id="fPerUser" type="number" min="1" step="1" value="' +
        escapeHtml(String(model.perUserLimit)) +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">次</span>';
    }
    claimHtml += '</div>';
    out += fieldRow(true, '领取上限', claimHtml);
    out += fieldRow(
      true,
      '发放数量',
      '<div class="pts-rule-unit"><input class="erp-input" id="fStock" type="text" placeholder="请输入" value="' +
        escapeHtml(model.totalStock) +
        '"' +
        dis +
        '><span class="pts-rule-unit__text">份</span></div>'
    );
    out += '</div></div>';
    return out;
  }

  function collect() {
    if (!model) model = emptyModel();
    var root = hostEl || document;
    var nameEl = root.querySelector('#fName') || document.getElementById('fName');
    if (nameEl) model.name = nameEl.value;
    var typeEl = root.querySelector('#fCouponType') || document.getElementById('fCouponType');
    if (typeEl) model.couponType = typeEl.value;
    var th = root.querySelector('#fThreshold') || document.getElementById('fThreshold');
    if (th) model.threshold = Number(th.value || 0);
    var den = root.querySelector('#fDenomination') || document.getElementById('fDenomination');
    if (den) model.denomination = Number(den.value || 0);
    var ch = root.querySelector('input[name="fChannel"]:checked');
    if (ch) model.applicableChannel = ch.value;
    var ts = root.querySelector('input[name="fTimeScope"]:checked');
    if (ts) model.timeScope = ts.value;
    var t1 = root.querySelector('#fTimeStart') || document.getElementById('fTimeStart');
    if (t1) model.timeStart = t1.value;
    var t2 = root.querySelector('#fTimeEnd') || document.getElementById('fTimeEnd');
    if (t2) model.timeEnd = t2.value;
    var cm = root.querySelector('#fClaimMode') || document.getElementById('fClaimMode');
    if (cm) model.claimLimitMode = cm.value;
    var pu = root.querySelector('#fPerUser') || document.getElementById('fPerUser');
    if (pu) model.perUserLimit = Number(pu.value || 1);
    var stock = root.querySelector('#fStock') || document.getElementById('fStock');
    if (stock) model.totalStock = stock.value;
    var sm = root.querySelector('input[name="fSceneMode"]:checked');
    if (sm) model.issueSceneMode = sm.value;
    var sceneBoxes = root.querySelectorAll('[data-scene]');
    if (sceneBoxes.length) {
      var scenes = [];
      sceneBoxes.forEach(function (el) {
        if (el.checked) scenes.push(el.getAttribute('data-scene'));
      });
      if (model.issueSceneMode === 'SPECIFIC') model.issueScenes = scenes;
    }
    var scope = root.querySelector('input[name="fItemScope"]:checked');
    if (scope) model.itemScope = scope.value;
    var catSrc = root.querySelector('input[name="fCatSrc"]:checked');
    if (catSrc) model.categorySource = catSrc.value;
    return model;
  }

  function validate() {
    var m = collect();
    if (!String(m.name || '').trim()) return '请输入券名称';
    if (!m.issueSceneMode) return '请选择发放场景';
    if (m.issueSceneMode === 'SPECIFIC' && !(m.issueScenes && m.issueScenes.length)) return '请至少选择一个指定场景';
    if (!/^[1-9]\d{0,7}$/.test(String(m.totalStock || '').trim())) return '发放数量最多支持 8 位正整数';
    if (m.couponType === 'FULL_MINUS' && (Number(m.threshold) <= 0 || Number(m.denomination) <= 0)) {
      return '请填写正确的减免条件';
    }
    if (m.couponType === 'FULL_MINUS' && Number(m.denomination) > Number(m.threshold)) {
      return '满减金额不能大于消费金额';
    }
    if (m.couponType === 'NO_THRESHOLD' && Number(m.denomination) <= 0) return '请填写正确的减免金额';
    if (m.timeScope === 'SPECIFIC' && (!m.timeStart || !m.timeEnd)) return '请选择起止时间';
    if (m.itemScope === 'GOODS' && !m.productSkus.length) return '请选择商品';
    if (m.itemScope === 'CATEGORY' && !m.selectedCategories.length) return '请选择类目';
    return '';
  }

  function shouldRerender(el) {
    if (!el) return false;
    var id = el.id || '';
    if (id === 'fCouponType' || id === 'fClaimMode') return true;
    var name = el.getAttribute('name') || '';
    if (name === 'fItemScope' || name === 'fTimeScope' || name === 'fChannel' || name === 'fCatSrc' || name === 'fSceneMode') {
      return true;
    }
    return false;
  }

  function bind(host) {
    if (!host) return;
    hostEl = host;
    host.addEventListener('input', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'fName') {
        var n = document.getElementById('fNameCount');
        if (n) n.textContent = String(t.value.length) + '/50';
      }
      if (
        t.id === 'fName' ||
        t.id === 'fThreshold' ||
        t.id === 'fDenomination' ||
        t.id === 'fTimeStart' ||
        t.id === 'fTimeEnd' ||
        t.id === 'fPerUser' ||
        t.id === 'fStock'
      ) {
        collect();
      }
    });
    host.addEventListener('change', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.getAttribute('data-cat-id')) {
        collect();
        var id = t.getAttribute('data-cat-id');
        var src = t.getAttribute('data-cat-src');
        var name = t.getAttribute('data-cat-name');
        model.selectedCategories = model.selectedCategories.filter(function (x) {
          return !(x.id === id && x.source === src);
        });
        if (t.checked) model.selectedCategories.push({ id: id, name: name, source: src });
        rerender();
        return;
      }
      if (t.getAttribute('data-scene')) {
        collect();
        return;
      }
      if (shouldRerender(t)) {
        collect();
        rerender();
        return;
      }
      collect();
    });
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-act');
      if (act === 'add-coupon-sku') {
        openSkuPicker();
      } else if (act === 'view-goods') {
        if (global.MdmMarketingCouponGoodsDialog) {
          global.MdmMarketingCouponGoodsDialog.openFromSkus(model.productSkus || []);
        }
      } else if (act === 'view-cats') {
        if (global.MdmMarketingCouponGoodsDialog) {
          global.MdmMarketingCouponGoodsDialog.openCategories(model.selectedCategories || []);
        }
      } else if (act === 'rm-sku') {
        var sid = btn.getAttribute('data-id');
        model.productSkus = (model.productSkus || []).filter(function (s) {
          return String(s.id) !== sid;
        });
        rerender();
      } else if (act === 'rm-cat') {
        var cid = btn.getAttribute('data-id');
        var csrc = btn.getAttribute('data-src');
        model.selectedCategories = model.selectedCategories.filter(function (x) {
          return !(x.id === cid && x.source === csrc);
        });
        rerender();
      }
    });
  }

  function skuLabel(p, s) {
    return p.title + '（' + s.skuName + '（' + s.skuCode + '））';
  }

  function renderSkuTree() {
    var box = document.getElementById('tplSkuTree');
    var hint = document.getElementById('tplSkuHint');
    if (!box) return;
    var products = Store.searchProducts(skuUi.keyword);
    box.innerHTML = products
      .map(function (p) {
        var children = (p.skus || [])
          .map(function (s) {
            return (
              '<div class="mkt-tpl-sku-node mkt-tpl-sku-node--child"><label><input type="checkbox" data-sku="' +
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
          (children || '<div class="mkt-tpl-sku-node mkt-tpl-sku-node--child">暂无可选规格</div>')
        );
      })
      .join('');
    if (hint) hint.textContent = '已选 ' + Object.keys(skuUi.checked).length + ' 个规格';
  }

  function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = !!hidden;
  }

  function openSkuPicker() {
    skuUi.keyword = '';
    skuUi.checked = {};
    (model.productSkus || []).forEach(function (s) {
      skuUi.checked[s.skuCode || s.id] = {
        id: s.skuCode || s.id,
        skuCode: s.skuCode || s.id,
        spuCode: s.spuCode,
        spuId: s.spuId,
        label: s.label
      };
    });
    var kw = document.getElementById('tplSkuKeyword');
    if (kw) kw.value = '';
    setHidden(document.getElementById('tplSkuBackdrop'), false);
    renderSkuTree();
  }

  function confirmSku() {
    model.productSkus = Object.keys(skuUi.checked).map(function (k) {
      return skuUi.checked[k];
    });
    setHidden(document.getElementById('tplSkuBackdrop'), true);
    rerender();
  }

  function bindSkuModal() {
    var close = document.getElementById('tplSkuClose');
    var cancel = document.getElementById('tplSkuCancel');
    var ok = document.getElementById('tplSkuOk');
    var kw = document.getElementById('tplSkuKeyword');
    var tree = document.getElementById('tplSkuTree');
    function hide() {
      setHidden(document.getElementById('tplSkuBackdrop'), true);
    }
    if (close) close.onclick = hide;
    if (cancel) cancel.onclick = hide;
    if (ok) ok.onclick = confirmSku;
    if (kw) {
      kw.oninput = function () {
        skuUi.keyword = kw.value;
        renderSkuTree();
      };
    }
    if (tree) {
      tree.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.getAttribute('data-sku')) return;
        var code = t.getAttribute('data-sku');
        if (t.checked) {
          skuUi.checked[code] = {
            id: code,
            skuCode: code,
            spuCode: t.getAttribute('data-spu'),
            spuId: t.getAttribute('data-spuid'),
            label: t.getAttribute('data-label')
          };
        } else {
          delete skuUi.checked[code];
        }
        renderSkuTree();
      });
    }
  }

  function rerender() {
    if (!hostEl) return;
    collect();
    render(hostEl, { locked: locked, model: model, onRerender: onRerender });
  }

  function render(container, opts) {
    Store = global.MdmMarketingCouponStore;
    if (container) hostEl = container;
    locked = !!(opts && opts.locked);
    if (opts && opts.model) {
      model = opts.model;
    } else if (!model) {
      model = emptyModel();
    }
    onRerender = opts && opts.onRerender;
    if (!hostEl) return;
    hostEl.innerHTML = html();
  }

  global.MdmMarketingCouponFormUi = {
    emptyModel: emptyModel,
    fillFromItem: fillFromItem,
    render: render,
    collect: collect,
    validate: validate,
    bind: bind,
    bindSkuModal: bindSkuModal,
    getModel: function () {
      return model;
    }
  };
})(window);
