/**
 * BD 移动端公共：轻量 Toast、页面 href 前缀、底部 Tab
 */
(function () {
  const base = document.body.getAttribute('data-bd-base') || '';

  window.bdPage = function (name) {
    return base + name;
  };

  window.bdToast = function (title, desc) {
    var el = document.getElementById('bdGlobalToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bdGlobalToast';
      el.className = 'bd-toast';
      document.body.appendChild(el);
    }
    el.textContent = desc ? title + ' · ' + desc : title;
    el.classList.add('bd-show-toast');
    clearTimeout(window._bdToastT);
    window._bdToastT = setTimeout(function () {
      el.classList.remove('bd-show-toast');
    }, 2200);
  };

  /** 底部 Tab：workbench | ai | personal */
  window.bdRenderBottomTabs = function (active) {
    var w = window.bdPage ? window.bdPage('mdm_bd_workbench.html') : 'mdm_bd_workbench.html';
    var p = window.bdPage ? window.bdPage('mdm_bd_personal.html') : 'mdm_bd_personal.html';
    var h =
      '<div class="bd-bottom-tabbar">' +
      '<button type="button" class="' +
      (active === 'home' ? ' bd-active-tab' : '') +
      '" onclick="location.href=\'' +
      w +
      '#home\'">🏠<span style="margin-top:2px">首页</span></button>' +
      '<button type="button" class="' +
      (active === 'ai' ? ' bd-active-tab' : '') +
      '" onclick="location.href=\'' +
      w +
      '#ai\'">◇<span style="margin-top:2px">AI</span></button>' +
      '<button type="button" class="' +
      (active === 'profile' ? ' bd-active-tab' : '') +
      '" onclick="location.href=\'' +
      p +
      '#profile\'">👤<span style="margin-top:2px">我的</span></button>' +
      '</div>';
    var host = document.getElementById('bd-bottom-tab-slot');
    if (host) host.innerHTML = h;
  };
})();
