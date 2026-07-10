(function () {
  var TRACKING_NO = '773075059702651';

  var TIMELINE = [
    {
      type: 'address',
      text: '【收货地址】浙江省杭州市宁波市 象山好看的街道 美好小区5幢3单元802 15255678912'
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
      time: '12-01\n06:00',
      title: '运输中',
      desc: '【宁波市】快件已到达 宁波象山转运中心'
    },
    {
      time: '11-30\n22:15',
      title: '运输中',
      desc: '【宁波市】快件离开 宁波转运中心，下一站 宁波象山转运中心'
    },
    {
      time: '11-30\n18:40',
      title: '运输中',
      desc: '【宁波市】快件到达 宁波转运中心'
    },
    {
      time: '11-30\n14:20',
      title: '运输中',
      desc: '【杭州市】快件离开 杭州萧山转运中心，下一站 宁波转运中心'
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
  ];

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function toast(msg) {
    window.alert(msg + '（演示）');
  }

  function buildDetailBackHref() {
    var params = getParams();
    var qs = [];
    ['from', 'status', 'supplier', 'delivery', 'cutoff', 'reason'].forEach(function (key) {
      var val = params.get(key);
      if (val) qs.push(key + '=' + encodeURIComponent(val));
    });
    if (!params.get('status')) qs.unshift('status=receipt');
    if (params.get('from') === 'restock.html' && !params.get('delivery')) {
      qs.push('delivery=store');
    }
    return 'order-detail.html?' + qs.join('&');
  }

  function renderTimeline() {
    var container = document.getElementById('logisticsTimeline');
    if (!container) return;

    container.innerHTML = TIMELINE.map(function (item) {
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
    }).join('');
  }

  function copyTrackingNo() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(TRACKING_NO).then(
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

    renderTimeline();

    var copyBtn = document.getElementById('logisticsCopyBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyTrackingNo);

    document.querySelector('.ua-ol-nav__icon--close') &&
      document.querySelector('.ua-ol-nav__icon--close').addEventListener('click', function () {
        window.history.length > 1 ? window.history.back() : (window.location.href = buildDetailBackHref());
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
