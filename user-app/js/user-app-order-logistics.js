(function () {
  var PACKAGES = [
    {
      status: '已签收',
      courier: '申通快递',
      trackingNo: '773075059702651',
      totalQty: 7,
      products: [
        { img: '../assets/order-product-1.svg' },
        { img: '../assets/order-product-2.svg', badge: 2 },
        { img: '../assets/order-detail-cherry.svg' },
        { img: '../assets/restock/product-leaf.svg' },
        { img: '../assets/restock/product-tomato.svg' }
      ],
      timeline: [
        {
          type: 'address',
          text: '【收货地址】浙江省杭州市萧山区建设一路88号 悠悠生鲜超市 138****6688'
        },
        {
          time: '12-01\n12:00',
          title: '已签收',
          desc: '期待再次为您服务',
          active: true
        },
        {
          time: '12-01\n10:30',
          title: '待取件',
          desc:
            '快件已被【蜂站】开开心心物业服务中心开开心心蜂站站点代收，请凭取件码取件，联系电话 <a href="tel:15977234567" class="ua-ol-tl-phone">15977234567</a>'
        },
        {
          time: '12-01\n08:20',
          title: '派送中',
          desc:
            '【宁波市】快件正在派送中，派送员：王帅三弟，联系电话 <a href="tel:18084567234" class="ua-ol-tl-phone">18084567234</a>，请保持电话畅通'
        },
        {
          time: '11-30\n22:15',
          title: '运输中',
          desc: '【宁波市】快件离开 宁波转运中心，下一站 宁波象山转运中心'
        },
        {
          time: '11-30\n10:05',
          title: '运输中',
          desc: '【杭州市】快件到达 杭州萧山转运中心'
        },
        {
          time: '11-30\n08:30',
          title: '已揽件',
          desc:
            '【杭州市】快件已在 杭州萧山营业部 揽收，揽件员：王帅，联系电话 <a href="tel:15922345621" class="ua-ol-tl-phone">15922345621</a>'
        },
        {
          time: '11-30\n08:00',
          title: '已发货',
          desc: '包裹正在等待揽收'
        },
        {
          time: '11-29\n16:20',
          title: '已下单',
          desc: '商品已经下单'
        }
      ]
    },
    {
      status: '派送中',
      courier: '中通快递',
      trackingNo: '788012345678901',
      totalQty: 3,
      products: [
        { img: '../assets/restock/product-cola.svg' },
        { img: '../assets/restock/product-egg.svg', badge: 2 }
      ],
      timeline: [
        {
          type: 'address',
          text: '【收货地址】浙江省杭州市萧山区建设一路88号 悠悠生鲜超市 138****6688'
        },
        {
          time: '12-01\n09:10',
          title: '派送中',
          desc:
            '【杭州市】快件正在派送中，派送员：李师傅，联系电话 <a href="tel:13800138000" class="ua-ol-tl-phone">13800138000</a>',
          active: true
        },
        {
          time: '12-01\n06:40',
          title: '运输中',
          desc: '【杭州市】快件已到达 杭州临平转运中心'
        },
        {
          time: '11-30\n20:15',
          title: '运输中',
          desc: '【嘉兴市】快件离开 嘉兴转运中心，下一站 杭州临平转运中心'
        },
        {
          time: '11-30\n15:00',
          title: '已揽件',
          desc: '【嘉兴市】快件已揽收'
        },
        {
          time: '11-30\n14:20',
          title: '已发货',
          desc: '包裹正在等待揽收'
        },
        {
          time: '11-29\n16:20',
          title: '已下单',
          desc: '商品已经下单'
        }
      ]
    }
  ];

  var activeIdx = 0;

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function toast(msg) {
    window.alert(msg + '（演示）');
  }

  function buildDetailBackHref() {
    var params = getParams();
    if (params.get('refundBack') === '1') {
      var refundQs = [];
      [
        'from',
        'status',
        'supplier',
        'delivery',
        'cutoff',
        'reason',
        'scene',
        'item',
        'type',
        'stage',
        'pkgs'
      ].forEach(function (key) {
        var val = params.get(key);
        if (val) refundQs.push(key + '=' + encodeURIComponent(val));
      });
      if (!params.get('type')) refundQs.push('type=restock');
      if (!params.get('stage')) refundQs.push('stage=reship');
      return 'order-refund-detail.html?' + refundQs.join('&');
    }
    var qs = [];
    ['from', 'status', 'supplier', 'delivery', 'cutoff', 'reason', 'pkgs'].forEach(function (key) {
      var val = params.get(key);
      if (val) qs.push(key + '=' + encodeURIComponent(val));
    });
    if (!params.get('status')) qs.unshift('status=receipt');
    return 'order-detail.html?' + qs.join('&');
  }

  function getPackageList() {
    if (getParams().get('pkgs') === '1') return PACKAGES.slice(0, 1);
    return PACKAGES;
  }

  function renderTimeline(timeline) {
    var container = document.getElementById('logisticsTimeline');
    if (!container) return;

    container.innerHTML = (timeline || [])
      .map(function (item) {
        if (item.type === 'address') {
          return (
            '<div class="ua-ol-tl-row ua-ol-tl-row--address">' +
            '<div class="ua-ol-tl-time ua-ol-tl-time--empty">—</div>' +
            '<div class="ua-ol-tl-axis"><span class="ua-ol-tl-node ua-ol-tl-node--receive">收</span></div>' +
            '<div class="ua-ol-tl-content"><div class="ua-ol-tl-desc ua-ol-tl-desc--address">' +
            item.text +
            '</div></div></div>'
          );
        }

        var nodeCls = 'ua-ol-tl-node' + (item.active ? ' ua-ol-tl-node--active' : '');
        var titleCls = 'ua-ol-tl-title' + (item.active ? ' ua-ol-tl-title--active' : '');

        return (
          '<div class="ua-ol-tl-row">' +
          '<div class="ua-ol-tl-time">' +
          (item.time || '').replace('\n', '<br>') +
          '</div>' +
          '<div class="ua-ol-tl-axis"><span class="' +
          nodeCls +
          '"></span></div>' +
          '<div class="ua-ol-tl-content">' +
          '<div class="' +
          titleCls +
          '">' +
          item.title +
          '</div>' +
          (item.desc ? '<div class="ua-ol-tl-desc">' + item.desc + '</div>' : '') +
          '</div></div>'
        );
      })
      .join('');
  }

  function renderProducts(pkg) {
    var scroll = document.getElementById('logisticsProductsScroll');
    var totalEl = document.getElementById('logisticsProductsTotal');
    if (!scroll) return;
    scroll.innerHTML = (pkg.products || [])
      .map(function (p) {
        var badge = p.badge
          ? '<span class="ua-ol-products__badge">' + p.badge + '</span>'
          : '';
        return (
          '<div class="ua-ol-products__item' +
          (p.badge ? ' ua-ol-products__item--badge' : '') +
          '"><img src="' +
          p.img +
          '" alt="">' +
          badge +
          '</div>'
        );
      })
      .join('');
    if (totalEl) totalEl.textContent = '共' + (pkg.totalQty || 0) + '件';
  }

  function renderPkgTabs(list) {
    var tabsEl = document.getElementById('logisticsPkgTabs');
    if (!tabsEl) return;
    if (list.length <= 1) {
      tabsEl.hidden = true;
      tabsEl.innerHTML = '';
      return;
    }
    tabsEl.hidden = false;
    tabsEl.innerHTML = list
      .map(function (pkg, idx) {
        return (
          '<button type="button" class="ua-ol-pkg-tab' +
          (idx === activeIdx ? ' is-active' : '') +
          '" data-pkg-tab="' +
          idx +
          '">包裹' +
          (idx + 1) +
          '<small>' +
          pkg.courier +
          '</small></button>'
        );
      })
      .join('');
  }

  function renderPackage(idx) {
    var list = getPackageList();
    if (!list.length) return;
    activeIdx = Math.max(0, Math.min(idx, list.length - 1));
    var pkg = list[activeIdx];

    var statusEl = document.getElementById('logisticsMainStatus');
    var badgeEl = document.getElementById('logisticsPkgBadge');
    var courierEl = document.getElementById('logisticsCourierName');
    var noEl = document.getElementById('logisticsTrackingNo');

    if (statusEl) statusEl.textContent = pkg.status;
    if (badgeEl) badgeEl.hidden = true;
    if (courierEl) courierEl.textContent = pkg.courier;
    if (noEl) noEl.textContent = pkg.trackingNo;

    renderPkgTabs(list);
    renderProducts(pkg);
    renderTimeline(pkg.timeline);
  }

  function copyTrackingNo() {
    var list = getPackageList();
    var pkg = list[activeIdx] || list[0];
    var no = pkg ? pkg.trackingNo : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(no).then(
        function () {
          toast('已复制运单号');
        },
        function () {
          toast('已复制运单号');
        }
      );
    } else {
      toast('已复制运单号');
    }
  }

  function init() {
    var backEl = document.getElementById('orderLogisticsBack');
    if (backEl) backEl.setAttribute('href', buildDetailBackHref());

    var pkgParam = parseInt(getParams().get('pkg') || '0', 10);
    renderPackage(isNaN(pkgParam) ? 0 : pkgParam);

    var tabsEl = document.getElementById('logisticsPkgTabs');
    if (tabsEl) {
      tabsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-pkg-tab]');
        if (!btn) return;
        renderPackage(parseInt(btn.getAttribute('data-pkg-tab'), 10) || 0);
      });
    }

    var copyBtn = document.getElementById('logisticsCopyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyTrackingNo);

    document.querySelector('.ua-ol-nav__icon--close') &&
      document.querySelector('.ua-ol-nav__icon--close').addEventListener('click', function () {
        window.history.length > 1
          ? window.history.back()
          : (window.location.href = buildDetailBackHref());
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
