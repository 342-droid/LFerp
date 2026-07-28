/**
 * 用户 APP — 积分商城
 * 可用/冻结并排；单 SKU 兑换直达确认订单；多 SKU 先选规格；点卡片进详情
 */
(function () {
  var AVAILABLE_POINTS = 161;
  var FROZEN_POINTS = 45;
  var EXPIRE_TIP = '可用积分不含冻结积分，点此查看明细';

  var state = {
    exchangeType: '',
    pointsMin: '',
    pointsMax: '',
    name: '',
    bannerIndex: 0,
    bannerTimer: null,
    skuProduct: null,
    skuIndex: 0,
    skuQty: 1
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveAsset(src) {
    src = String(src || '');
    if (!src) return '';
    if (/^(data:|https?:|\/\/)/i.test(src)) return src;
    if (src.indexOf('../user-app/') === 0) return src.replace('../user-app/', '../');
    if (src.indexOf('user-app/') === 0) return '../' + src.slice('user-app/'.length);
    if (src.indexOf('../') === 0) return src;
    return src;
  }

  function formatMoney(num) {
    var n = Math.round((Number(num) || 0) * 100) / 100;
    if (n % 1 === 0) return '¥' + Math.round(n);
    return '¥' + n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  }

  function formatExchangePrice(spec, product) {
    var isMoney =
      (spec && spec.exchangeType === 'points_money') ||
      (product && product.exchangeType === 'points_money');
    var pts = Number(spec && spec.points) || 0;
    if (isMoney && Number(spec.money) > 0) {
      return pts + '积分 + ' + formatMoney(spec.money);
    }
    return pts + '积分';
  }

  function parseOptionalNumber(val) {
    if (val === '' || val == null) return null;
    var n = Number(val);
    return isNaN(n) ? null : n;
  }

  function hasLinePrice(spec) {
    return spec && spec.linePrice != null && spec.linePrice !== '' && !isNaN(Number(spec.linePrice));
  }

  function getEnabledSpecs(item) {
    return (Array.isArray(item.specs) ? item.specs : []).filter(function (s) {
      return !!s.exchangeEnabled;
    });
  }

  function pickDisplaySpec(item) {
    var specs = getEnabledSpecs(item);
    if (!specs.length) return null;
    return specs.slice().sort(function (a, b) {
      return (Number(a.points) || 0) - (Number(b.points) || 0);
    })[0];
  }

  function findProduct(code) {
    if (!window.MdmPointsMallStore) return null;
    return window.MdmPointsMallStore.getByCode(code);
  }

  function loadProducts() {
    var list = window.MdmPointsMallStore ? window.MdmPointsMallStore.getAll() : [];
    return list.filter(function (item) {
      var onShelf = window.MdmPointsMallStore && window.MdmPointsMallStore.isOnShelfDisplay
        ? window.MdmPointsMallStore.isOnShelfDisplay(item)
        : item.status === 'on_shelf';
      return onShelf && getEnabledSpecs(item).length > 0;
    });
  }

  function matchFilters(item) {
    if (state.name) {
      var hay = String(item.name || '').toLowerCase();
      if (hay.indexOf(state.name.toLowerCase()) < 0) return false;
    }
    var itemType = item.exchangeType === 'points_money' ? 'points_money' : 'points';
    if (state.exchangeType && itemType !== state.exchangeType) return false;

    /* 积分区间支持单边：只填最低=该值起不限上限；只填最高=不限下限到该值 */
    var min = parseOptionalNumber(state.pointsMin);
    var max = parseOptionalNumber(state.pointsMax);
    if (min == null && max == null) return true;
    if (min != null && max != null && min > max) {
      var swap = min;
      min = max;
      max = swap;
    }
    return getEnabledSpecs(item).some(function (s) {
      var points = Number(s.points) || 0;
      if (min != null && points < min) return false;
      if (max != null && points > max) return false;
      return true;
    });
  }

  function toast(msg) {
    if (typeof showToast === 'function') {
      showToast(msg, 'info');
      return;
    }
    window.alert(msg);
  }

  function renderPoints() {
    var el = document.getElementById('pmAvailable');
    if (el) el.textContent = String(AVAILABLE_POINTS);
    var frozen = document.getElementById('pmFrozen');
    if (frozen) frozen.textContent = String(FROZEN_POINTS);
    var tip = document.getElementById('pmExpireText');
    if (tip) tip.textContent = EXPIRE_TIP;
  }

  function renderBanner() {
    var root = document.getElementById('pmBanner');
    if (!root) return;
    var banners = window.MdmPointsMallConfig ? window.MdmPointsMallConfig.loadBanners() : [];
    banners = banners.filter(function (b) {
      return b && b.image;
    });
    if (!banners.length) {
      root.hidden = true;
      root.innerHTML = '';
      return;
    }
    root.hidden = false;

    state.bannerIndex = 0;
    var slides = banners
      .map(function (b) {
        /* C 端轮播只展示图片，不展示标题 */
        var inner =
          '<img src="' +
          escapeHtml(resolveAsset(b.image)) +
          '" alt="">';
        if (b.link) {
          return (
            '<a class="ua-pm-banner__slide" href="' +
            escapeHtml(b.link) +
            '">' +
            inner +
            '</a>'
          );
        }
        return '<div class="ua-pm-banner__slide">' + inner + '</div>';
      })
      .join('');

    var dots =
      banners.length > 1
        ? '<div class="ua-pm-banner__dots">' +
          banners
            .map(function (_, i) {
              return '<span class="ua-pm-banner__dot' + (i === 0 ? ' is-active' : '') + '"></span>';
            })
            .join('') +
          '</div>'
        : '';

    root.innerHTML =
      '<div class="ua-pm-banner__track" id="pmBannerTrack">' + slides + '</div>' + dots;

    if (state.bannerTimer) {
      clearInterval(state.bannerTimer);
      state.bannerTimer = null;
    }
    if (banners.length < 2) return;

    state.bannerTimer = setInterval(function () {
      state.bannerIndex = (state.bannerIndex + 1) % banners.length;
      var track = document.getElementById('pmBannerTrack');
      if (track) track.style.transform = 'translateX(-' + state.bannerIndex * 100 + '%)';
      root.querySelectorAll('.ua-pm-banner__dot').forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === state.bannerIndex);
      });
    }, 3600);
  }

  function renderPriceHtml(spec) {
    if (!hasLinePrice(spec)) return '';
    return (
      '<div class="ua-pm-card-goods__price">' +
      '<s class="ua-pm-card-goods__line">' +
      escapeHtml(formatMoney(spec.linePrice)) +
      '</s>' +
      '</div>'
    );
  }

  function renderList() {
    var listEl = document.getElementById('pmList');
    var endEl = document.getElementById('pmEnd');
    if (!listEl) return;

    var rows = loadProducts().filter(matchFilters);
    if (!rows.length) {
      listEl.innerHTML = '<div class="ua-pm-empty">暂无符合条件的兑换商品</div>';
      if (endEl) endEl.hidden = true;
      return;
    }

    listEl.innerHTML = rows
      .map(function (item) {
        var spec = pickDisplaySpec(item);
        if (!spec) return '';
        var isMoney = spec.exchangeType === 'points_money' || item.exchangeType === 'points_money';
        var tagCls = isMoney ? 'ua-pm-card-goods__tag--money' : 'ua-pm-card-goods__tag--points';
        var tagText = isMoney ? '积分+现金' : '纯积分';
        var ptsHtml =
          '<span class="ua-pm-card-goods__pts-icon">积</span>' +
          escapeHtml(String(spec.points)) +
          (isMoney && Number(spec.money) > 0
            ? '<small>+' + escapeHtml(formatMoney(spec.money)) + '</small>'
            : '');

        return (
          '<article class="ua-pm-card-goods" data-detail="' +
          escapeHtml(item.code || '') +
          '">' +
          '  <div class="ua-pm-card-goods__media">' +
          '    <span class="ua-pm-card-goods__tag ' +
          tagCls +
          '">' +
          tagText +
          '</span>' +
          '    <img src="' +
          escapeHtml(resolveAsset(item.img)) +
          '" alt="">' +
          '  </div>' +
          '  <div class="ua-pm-card-goods__body">' +
          '    <h3 class="ua-pm-card-goods__name">' +
          escapeHtml(item.name || '') +
          '</h3>' +
          renderPriceHtml(spec) +
          '    <div class="ua-pm-card-goods__foot">' +
          '      <div class="ua-pm-card-goods__pts">' +
          ptsHtml +
          '      </div>' +
          '      <button type="button" class="ua-pm-card-goods__btn" data-exchange="' +
          escapeHtml(item.code || '') +
          '">兑换</button>' +
          '    </div>' +
          '  </div>' +
          '</article>'
        );
      })
      .join('');

    if (endEl) endEl.hidden = false;
  }

  function currentSkuSpec() {
    if (!state.skuProduct) return null;
    var specs = getEnabledSpecs(state.skuProduct);
    return specs[state.skuIndex] || specs[0] || null;
  }

  function clampSkuQty() {
    var spec = currentSkuSpec();
    if (!spec) {
      state.skuQty = 1;
      return;
    }
    var min = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
    var max = Math.max(min, Math.round(Number(spec.stock) || 0) || min);
    if (state.skuQty < min) state.skuQty = min;
    if (state.skuQty > max) state.skuQty = max;
  }

  function renderSkuSheet() {
    var product = state.skuProduct;
    if (!product) return;
    var specs = getEnabledSpecs(product);
    var spec = currentSkuSpec();
    if (!spec) return;
    clampSkuQty();

    var thumb = document.getElementById('pmSkuThumb');
    var priceEl = document.getElementById('pmSkuPrice');
    var nameEl = document.getElementById('pmSkuName');
    var pickedEl = document.getElementById('pmSkuPicked');
    var specsEl = document.getElementById('pmSkuSpecs');
    var qtyEl = document.getElementById('pmSkuQty');
    var hintEl = document.getElementById('pmSkuHint');

    if (thumb) thumb.src = resolveAsset(spec.skuImg || product.img || '');
    if (priceEl) priceEl.textContent = formatExchangePrice(spec, product);
    if (nameEl) nameEl.textContent = product.name || '';
    if (pickedEl) pickedEl.textContent = '已选：' + (spec.specName || '默认');
    if (qtyEl) qtyEl.textContent = String(state.skuQty);
    if (hintEl) {
      var min = Math.max(1, Math.round(Number(spec.minSaleQty) || 1));
      hintEl.textContent =
        '起售 ' + min + ' 件 · 库存 ' + (spec.stock != null ? spec.stock : 0);
    }
    if (specsEl) {
      specsEl.innerHTML = specs
        .map(function (s, i) {
          return (
            '<button type="button" class="ua-pm-sku-sheet__chip' +
            (i === state.skuIndex ? ' is-active' : '') +
            '" data-sku-index="' +
            i +
            '">' +
            '<img src="' +
            escapeHtml(resolveAsset(s.skuImg || product.img || '')) +
            '" alt="">' +
            escapeHtml(s.specName || '默认') +
            '</button>'
          );
        })
        .join('');
    }
  }

  function openSkuSheet(product) {
    state.skuProduct = product;
    state.skuIndex = 0;
    var spec = currentSkuSpec();
    state.skuQty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
    renderSkuSheet();
    var sheet = document.getElementById('pmSkuSheet');
    if (sheet) sheet.hidden = false;
  }

  function closeSkuSheet() {
    var sheet = document.getElementById('pmSkuSheet');
    if (sheet) sheet.hidden = true;
    state.skuProduct = null;
  }

  function buildCurrentLine() {
    if (!window.UaPointsMallOrder || !state.skuProduct) return null;
    return window.UaPointsMallOrder.buildLine(
      state.skuProduct,
      currentSkuSpec(),
      state.skuQty
    );
  }

  function startExchange(code) {
    var product = findProduct(code);
    if (!product) {
      toast('商品不存在或已下架');
      return;
    }
    var specs = getEnabledSpecs(product);
    if (!specs.length) {
      toast('暂无可兑换规格');
      return;
    }
    if (specs.length === 1) {
      var line = window.UaPointsMallOrder
        ? window.UaPointsMallOrder.buildLine(product, specs[0], specs[0].minSaleQty || 1)
        : null;
      if (!line) return;
      window.UaPointsMallOrder.goConfirm(line, 'points-mall.html');
      return;
    }
    openSkuSheet(product);
  }

  function goDetail(code) {
    if (window.UaPointsMallOrder) {
      window.UaPointsMallOrder.goDetail(code, 'points-mall.html');
      return;
    }
    window.location.href =
      'points-product-detail.html?code=' + encodeURIComponent(code || '');
  }

  function readFilters() {
    state.pointsMin = ((document.getElementById('pmPointsMin') || {}).value || '').trim();
    state.pointsMax = ((document.getElementById('pmPointsMax') || {}).value || '').trim();
    state.name = ((document.getElementById('pmName') || {}).value || '').trim();
  }

  function clearFilters() {
    var minEl = document.getElementById('pmPointsMin');
    var maxEl = document.getElementById('pmPointsMax');
    var nameEl = document.getElementById('pmName');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    if (nameEl) nameEl.value = '';
    state.pointsMin = '';
    state.pointsMax = '';
    state.name = '';
  }

  function applyFilters() {
    readFilters();
    renderList();
  }

  function init() {
    var cfg = window.MdmPointsMallConfig;
    if (cfg && !cfg.isExchangeEnabled()) {
      window.location.replace(
        window.UaNav && window.UaNav.withFrom
          ? window.UaNav.withFrom('points-detail.html')
          : 'points-detail.html'
      );
      return;
    }

    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-pm-nav__back', 'profile.html');
      var detailHref =
        window.UaNav.withFrom ? window.UaNav.withFrom('points-detail.html') : 'points-detail.html';
      ['pmPointsLink', 'pmFrozenLink', 'pmExpireTip'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.href = detailHref;
      });
      var ruleLink = document.getElementById('pmRuleLink');
      if (ruleLink) {
        ruleLink.href = window.UaNav.withFrom
          ? window.UaNav.withFrom('points-rule-desc.html')
          : 'points-rule-desc.html';
      }
    }

    renderPoints();
    renderBanner();
    renderList();

    document.getElementById('pmTabs') &&
      document.getElementById('pmTabs').addEventListener('click', function (e) {
        var tab = e.target.closest('.ua-pm-tab');
        if (!tab) return;
        state.exchangeType = tab.getAttribute('data-type') || '';
        document.querySelectorAll('.ua-pm-tab').forEach(function (el) {
          el.classList.toggle('is-active', el === tab);
        });
        renderList();
      });

    var queryBtn = document.getElementById('pmFilterQuery');
    if (queryBtn) {
      queryBtn.addEventListener('click', applyFilters);
    }

    var clearBtn = document.getElementById('pmFilterClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearFilters();
        renderList();
      });
    }

    ['pmPointsMin', 'pmPointsMax', 'pmName'].forEach(function (id) {
      var input = document.getElementById(id);
      if (!input) return;
      input.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        applyFilters();
      });
    });

    document.getElementById('pmList') &&
      document.getElementById('pmList').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-exchange]');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          startExchange(btn.getAttribute('data-exchange'));
          return;
        }
        var card = e.target.closest('[data-detail]');
        if (card) {
          goDetail(card.getAttribute('data-detail'));
        }
      });

    var sheet = document.getElementById('pmSkuSheet');
    if (sheet) {
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('[data-pm-sku-close]')) {
          closeSkuSheet();
          return;
        }
        var chip = e.target.closest('[data-sku-index]');
        if (chip) {
          state.skuIndex = Number(chip.getAttribute('data-sku-index')) || 0;
          var spec = currentSkuSpec();
          state.skuQty = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
          renderSkuSheet();
        }
      });
    }

    document.getElementById('pmSkuQtyMinus') &&
      document.getElementById('pmSkuQtyMinus').addEventListener('click', function () {
        var spec = currentSkuSpec();
        var min = Math.max(1, Math.round(Number(spec && spec.minSaleQty) || 1));
        state.skuQty = Math.max(min, state.skuQty - 1);
        renderSkuSheet();
      });

    document.getElementById('pmSkuQtyPlus') &&
      document.getElementById('pmSkuQtyPlus').addEventListener('click', function () {
        state.skuQty += 1;
        clampSkuQty();
        renderSkuSheet();
      });

    document.getElementById('pmSkuAddCart') &&
      document.getElementById('pmSkuAddCart').addEventListener('click', function () {
        var line = buildCurrentLine();
        if (!line || !window.UaPointsMallOrder) return;
        window.UaPointsMallOrder.addToCart(line);
        closeSkuSheet();
        toast('已加入购物车');
      });

    document.getElementById('pmSkuBuyNow') &&
      document.getElementById('pmSkuBuyNow').addEventListener('click', function () {
        var line = buildCurrentLine();
        if (!line || !window.UaPointsMallOrder) return;
        closeSkuSheet();
        window.UaPointsMallOrder.goConfirm(line, 'points-mall.html');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
