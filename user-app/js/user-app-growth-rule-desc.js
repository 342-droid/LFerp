/**
 * 用户 APP — 会员规则说明 / 成长值规则说明
 * ?kind=member 读会员规则（会员中心「规则说明」）
 * ?kind=growth 读成长值规则（成长值明细「规则」）
 */
(function () {
  function kindFromQuery() {
    var params = new URLSearchParams((window.location && window.location.search) || '');
    var k = String(params.get('kind') || params.get('type') || '').toLowerCase();
    if (k === 'growth' || k === 'member') return k;
    var from = String(params.get('from') || '').toLowerCase();
    if (from.indexOf('growth-detail') >= 0) return 'growth';
    return 'member';
  }

  function init() {
    var kind = kindFromQuery();
    var fallback = kind === 'growth' ? 'growth-detail.html' : 'member-center.html';
    if (window.UaNav) {
      window.UaNav.applyBackLink('.ua-gd-nav__back', fallback);
    }
    var data = { title: '规则说明', html: '<p>暂无规则说明</p>' };
    if (window.MdmMemberRuleDesc && typeof window.MdmMemberRuleDesc.load === 'function') {
      data = window.MdmMemberRuleDesc.load(kind) || data;
    }
    var titleEl = document.getElementById('grTitle');
    var contentEl = document.getElementById('grContent');
    if (titleEl) titleEl.textContent = data.title || '规则说明';
    if (contentEl) contentEl.innerHTML = data.html || '<p>暂无规则说明</p>';
  }

  document.addEventListener('DOMContentLoaded', init);
})();
