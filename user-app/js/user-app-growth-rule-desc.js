/**
 * 用户 APP — 成长值 / 会员规则说明（读取 MDM 规则说明配置）
 */
(function () {
  var STORAGE_KEY = 'mdm_member_level_rule_desc_v1';

  var DEFAULT_DESC = {
    title: '会员等级规则说明',
    html:
      '<h3>一、成长值获取</h3>' +
      '<p>成长值可通过消费与活跃两种方式获取，具体规则以「成长值规则」配置为准。成长值可设置有效期，过期后失效。</p>' +
      '<h3>二、升降级策略</h3>' +
      '<p><strong>升级：</strong>当会员当前有效成长值达到某等级门槛时，系统自动升至满足条件的最高等级，达标后立即生效。</p>' +
      '<p><strong>降级：</strong>当会员当前有效成长值低于当前等级门槛时，系统将降至满足条件的最高等级，于每日统一处理。</p>' +
      '<h3>三、会员权益</h3>' +
      '<p>不同等级可配置赠送积分、赠送优惠券、商品会员折扣、积分倍率及生日送券等权益。赠送券与生日券支持累计 / 每月 / 每日发放，并可配置多种优惠券及数量。</p>' +
      '<h3>四、其他说明</h3>' +
      '<p>消费获取成长值：每支付约定金额可获得对应成长值；订单售后成功时，按获取时的比例扣除。会员等级最多可设置 15 个，列表按成长值从低到高排列。本说明内容可随时编辑更新。</p>'
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
    var data = loadDesc();
    var titleEl = document.getElementById('grTitle');
    var contentEl = document.getElementById('grContent');
    if (titleEl) titleEl.textContent = data.title || '规则说明';
    if (contentEl) contentEl.innerHTML = data.html || '<p>暂无规则说明</p>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
