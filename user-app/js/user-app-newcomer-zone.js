/**
 * C 端 — 新人专区列表（仅立即购买，禁加购）
 */
(function () {
  'use strict';

  var Store = window.MdmNewcomerZoneStore;
  var Config = window.MdmNewcomerZoneConfig;
  var Order = window.UaNewcomerZoneOrder;
  if (!Store || !Order) return;

  var state = {
    product: null,
    specs: [],
    specIndex: 0
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(n) {
    var v = Math.round((Number(n) || 0) * 100) / 100;
    if (v % 1 === 0) return String(Math.round(v));
    return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  /** B 端存的是 ../user-app/assets/...，C 端 h5 需改写为 ../assets/... */
  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return '../assets/restock/product-leaf.svg';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    if (src.indexOf('../') === 0) return src;
    return src;
  }

  function enabledSpecs(item) {
    return (item.specs || []).filter(function (s) {
      return !!s.saleEnabled;
    });
  }

  function hasLinePrice(spec) {
    return spec && spec.linePrice != null && spec.linePrice !== '' && !isNaN(Number(spec.linePrice));
  }

  /** 列表展示价：取已开启规格中活动价最低的一档 */
  function pickDisplaySpec(item) {
    var specs = enabledSpecs(item);
    if (!specs.length) return null;
    return specs.slice().sort(function (a, b) {
      return (Number(a.salePrice) || 0) - (Number(b.salePrice) || 0);
    })[0];
  }

  function listProducts() {
    return Store.getAll().filter(function (item) {
      if (!Store.isOnShelfDisplay(item)) return false;
      return enabledSpecs(item).length > 0;
    });
  }

  function renderBanner() {
    var el = document.getElementById('nzBanner');
    if (!el || !Config) return;
    var banners = Config.loadBanners ? Config.loadBanners() : [];
    var first = banners[0];
    if (!first || !first.image) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<img src="' + escapeHtml(resolveAsset(first.image)) + '" alt="' + escapeHtml(first.title || '新人专区') + '">';
  }

  function renderList() {
    var listEl = document.getElementById('nzList');
    var endEl = document.getElementById('nzEnd');
    if (!listEl) return;

    if (Config && Config.isEnabled && !Config.isEnabled()) {
      listEl.innerHTML =
        '<div class="ua-nz-empty">新人专区暂未开放</div>';
      if (endEl) endEl.hidden = true;
      return;
    }

    var rows = listProducts();
    if (!rows.length) {
      listEl.innerHTML = '<div class="ua-nz-empty">暂无新人专区商品</div>';
      if (endEl) endEl.hidden = true;
      return;
    }

    if (endEl) endEl.hidden = false;
    listEl.innerHTML = rows
      .map(function (item) {
        var spec = pickDisplaySpec(item);
        var price = spec ? Number(spec.salePrice) || 0 : 0;
        var lineHtml = hasLinePrice(spec)
          ? '<span class="ua-nz-card__line">¥' + escapeHtml(formatMoney(spec.linePrice)) + '</span>'
          : '';
        var can = Order.canBuyProduct(item.code);
        var btnText = can.ok ? '立即购买' : '不可购买';
        return (
          '<article class="ua-nz-card" data-code="' +
          escapeHtml(item.code) +
          '">' +
          '<img class="ua-nz-card__img" src="' +
          escapeHtml(resolveAsset(item.img)) +
          '" alt="">' +
          '<div class="ua-nz-card__body">' +
          '<div class="ua-nz-card__name">' +
          escapeHtml(item.name) +
          '</div>' +
          '<div class="ua-nz-card__price"><em>¥</em>' +
          escapeHtml(formatMoney(price)) +
          lineHtml +
          '</div>' +
          '<span class="ua-nz-card__tag">新人专享</span>' +
          '<button type="button" class="ua-nz-card__btn" data-buy="' +
          escapeHtml(item.code) +
          '"' +
          (can.ok ? '' : ' disabled') +
          '>' +
          escapeHtml(btnText) +
          '</button>' +
          '</div></article>'
        );
      })
      .join('');
  }

  function closeSkuSheet() {
    var sheet = document.getElementById('nzSkuSheet');
    if (sheet) sheet.hidden = true;
    state.product = null;
    state.specs = [];
    state.specIndex = 0;
  }

  function paintSkuSheet() {
    var product = state.product;
    var specs = state.specs;
    var spec = specs[state.specIndex];
    if (!product || !spec) return;

    var thumb = document.getElementById('nzSkuThumb');
    var priceEl = document.getElementById('nzSkuPrice');
    var lineEl = document.getElementById('nzSkuLine');
    var nameEl = document.getElementById('nzSkuName');
    var pickedEl = document.getElementById('nzSkuPicked');
    var specsEl = document.getElementById('nzSkuSpecs');
    var hintEl = document.getElementById('nzSkuHint');
    var buyBtn = document.getElementById('nzSkuBuyNow');

    if (thumb) thumb.src = resolveAsset(spec.skuImg || product.img);
    if (priceEl) priceEl.textContent = '¥' + formatMoney(spec.salePrice);
    if (lineEl) {
      if (hasLinePrice(spec)) {
        lineEl.hidden = false;
        lineEl.textContent = '¥' + formatMoney(spec.linePrice);
      } else {
        lineEl.hidden = true;
        lineEl.textContent = '';
      }
    }
    if (nameEl) nameEl.textContent = product.name || '';
    if (pickedEl) pickedEl.textContent = '已选：' + (spec.specName || '默认');

    if (specsEl) {
      specsEl.innerHTML = specs
        .map(function (s, i) {
          return (
            '<button type="button" class="ua-nz-sku-sheet__spec' +
            (i === state.specIndex ? ' is-active' : '') +
            '" data-spec-index="' +
            i +
            '">' +
            escapeHtml(s.specName || '默认') +
            '</button>'
          );
        })
        .join('');
    }

    var can = Order.canBuyProduct(product.code);
    if (hintEl) {
      hintEl.textContent = can.ok
        ? '不支持加入购物车，每人限购 1 件且仅可购买一次'
        : can.message || '暂不可购买';
    }
    if (buyBtn) {
      buyBtn.disabled = !can.ok || !(Number(spec.stock) > 0);
      buyBtn.textContent = !can.ok
        ? '不可购买'
        : Number(spec.stock) > 0
          ? '立即购买'
          : '库存不足';
    }
  }

  function openSkuSheet(code) {
    var product = Store.getByCode(code);
    if (!product) return;
    var can = Order.canBuyProduct(code);
    if (!can.ok) {
      alert(can.message);
      return;
    }
    state.product = product;
    state.specs = enabledSpecs(product);
    state.specIndex = 0;
    if (!state.specs.length) {
      alert('该商品暂无可售规格');
      return;
    }
    var sheet = document.getElementById('nzSkuSheet');
    if (sheet) sheet.hidden = false;
    paintSkuSheet();
  }

  function bindEvents() {
    var listEl = document.getElementById('nzList');
    if (listEl) {
      listEl.addEventListener('click', function (e) {
        var buy = e.target.closest ? e.target.closest('[data-buy]') : null;
        if (buy) {
          e.preventDefault();
          e.stopPropagation();
          openSkuSheet(buy.getAttribute('data-buy'));
          return;
        }
        var card = e.target.closest ? e.target.closest('[data-code]') : null;
        if (card) openSkuSheet(card.getAttribute('data-code'));
      });
    }

    var sheet = document.getElementById('nzSkuSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target.getAttribute('data-nz-sku-close') != null) {
          closeSkuSheet();
          return;
        }
        var specBtn = e.target.closest ? e.target.closest('[data-spec-index]') : null;
        if (specBtn) {
          state.specIndex = Number(specBtn.getAttribute('data-spec-index')) || 0;
          paintSkuSheet();
          return;
        }
        if (e.target.closest && e.target.closest('#nzSkuBuyNow')) {
          var product = state.product;
          var spec = state.specs[state.specIndex];
          if (!product || !spec) return;
          var line = Order.buildLine(product, spec);
          Order.goConfirm(line, 'newcomer-zone.html');
        }
      });
    }
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('#nzBack', 'profile.html');
    }
    renderBanner();
    renderList();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
