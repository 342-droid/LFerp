/**
 * 营销-新人专区配置：专区开关 + 轮播图
 */
(function () {
  var ENABLE_KEY = 'mdm_marketing_newcomer_zone_enable_v1';
  var BANNER_KEY = 'mdm_marketing_newcomer_zone_banners_v1';
  var MAX_BANNERS = 10;

  var DEFAULT_BANNERS = [
    {
      id: 'b1',
      title: '新人专享价',
      image: '../user-app/assets/shop/banner-featured.svg',
      link: ''
    },
    {
      id: 'b2',
      title: '新客好物精选',
      image: '../user-app/assets/restock/product-leaf.svg',
      link: ''
    }
  ];

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function uid() {
    return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function isEnabled() {
    try {
      var raw = localStorage.getItem(ENABLE_KEY);
      if (raw == null) return true;
      return raw === '1' || raw === 'true';
    } catch (e) {
      return true;
    }
  }

  function setEnabled(on) {
    try {
      localStorage.setItem(ENABLE_KEY, on ? '1' : '0');
    } catch (e) { /* ignore */ }
  }

  function normalizeBanner(item) {
    item = item || {};
    return {
      id: item.id || uid(),
      title: String(item.title || '').trim(),
      image: String(item.image || '').trim(),
      link: String(item.link || '').trim()
    };
  }

  function loadBanners() {
    try {
      var raw = localStorage.getItem(BANNER_KEY);
      if (!raw) return clone(DEFAULT_BANNERS);
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return clone(DEFAULT_BANNERS);
      return parsed.map(normalizeBanner).slice(0, MAX_BANNERS);
    } catch (e) {
      return clone(DEFAULT_BANNERS);
    }
  }

  function saveBanners(list) {
    var next = (Array.isArray(list) ? list : []).map(normalizeBanner).slice(0, MAX_BANNERS);
    localStorage.setItem(BANNER_KEY, JSON.stringify(next));
    return next;
  }

  window.MdmNewcomerZoneConfig = {
    MAX_BANNERS: MAX_BANNERS,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    /* 兼容列表页沿用 isExchangeEnabled 调用名 */
    isExchangeEnabled: isEnabled,
    setExchangeEnabled: setEnabled,
    loadBanners: loadBanners,
    saveBanners: saveBanners,
    createBanner: function () {
      return { id: uid(), title: '', image: '', link: '' };
    }
  };
})();
