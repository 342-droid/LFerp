/**
 * 用户 APP — 积分规则说明（读取营销侧积分规则说明配置）
 */
(function () {
  var STORAGE_KEY = 'mdm_marketing_points_rule_desc_v1';

  var DEFAULT_DESC = {
    title: '积分规则说明',
    html:
      '<h3>一、积分获取</h3>' +
      '<p>积分可通过消费赠送、会员升级、签到、任务等方式获得，具体以平台当前生效规则为准。积分自获得之日起计算有效期，到期后失效。</p>' +
      '<h3>二、积分使用</h3>' +
      '<p><strong>积分抵现：</strong>下单时可按规则使用积分抵扣部分金额，受单笔比例与金额上限约束。</p>' +
      '<p><strong>积分商城：</strong>可在积分商城使用可用积分（不含冻结积分）兑换商品，部分商品支持积分加现金。</p>' +
      '<h3>三、冻结与售后</h3>' +
      '<p>部分场景下积分会进入冻结状态，交易完成后转为可用。积分兑换商品是否支持售后及退还规则，以积分规则配置为准。</p>' +
      '<h3>四、其他说明</h3>' +
      '<p>本说明内容可随时由运营编辑更新，最终解释权归平台所有。</p>'
  };

  function loadDesc() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { title: DEFAULT_DESC.title, html: DEFAULT_DESC.html };
      var parsed = JSON.parse(raw);
      return {
        title: parsed.title || DEFAULT_DESC.title,
        html: parsed.html || DEFAULT_DESC.html
      };
    } catch (e) {
      return { title: DEFAULT_DESC.title, html: DEFAULT_DESC.html };
    }
  }

  function init() {
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-gd-nav__back', 'points-mall.html');
    }
    var data = loadDesc();
    var titleEl = document.getElementById('prTitle');
    var contentEl = document.getElementById('prContent');
    if (titleEl) titleEl.textContent = data.title || '规则说明';
    if (contentEl) contentEl.innerHTML = data.html || '<p>暂无规则说明</p>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
