/**
 * 【857】PC 门店档案更换了本门店的登录手机号后，门店 APP 上旧账号的处理（演示）
 * - 旧账号名下还有其他门店：弹窗告知已不能管理该门店 → 切换到名下其他门店
 * - 旧账号名下没有其他门店：弹窗告知 → 退出登录，回到登录页
 * - 旧账号当前选中的不是被改号的门店：不打断，只是切换门店列表里不再有该门店
 * 演示状态存在 localStorage，右下角「857 改号演示」可切换场景。
 */
(function (global) {
  var KEY = 'sa_857_phone_change_v1';
  var OLD_PHONE = '13812348001';
  var CHANGED_STORE = '冷丰生鲜超市';
  var OTHER_STORES = ['中心店01', '西溪湿地南门店'];

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data || {}));
    } catch (e) {
      /* ignore */
    }
  }

  function injectStyle() {
    if (document.getElementById('sa857Style')) return;
    var css =
      '.sa857-mask{position:absolute;inset:0;background:rgba(0,0,0,.5);z-index:900;display:flex;align-items:center;justify-content:center;padding:0 32px}' +
      '.sa857-dialog{width:100%;background:#fff;border-radius:14px;overflow:hidden;text-align:center}' +
      '.sa857-dialog h3{font-size:17px;font-weight:600;color:#1a1a1a;padding:22px 20px 8px}' +
      '.sa857-dialog p{font-size:14px;color:#666;line-height:1.6;padding:0 20px 20px}' +
      '.sa857-dialog button{width:100%;border:0;border-top:1px solid #eee;background:#fff;color:#ff6a00;font-size:16px;font-weight:600;padding:14px 0}' +
      '.sa857-sheet{position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:16px 16px 0 0;z-index:901;padding:18px 16px 24px}' +
      '.sa857-sheet h3{font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:4px}' +
      '.sa857-sheet .sa857-sub{font-size:12px;color:#999;margin-bottom:12px}' +
      '.sa857-store{display:flex;justify-content:space-between;align-items:center;width:100%;border:1px solid #eee;background:#fff;border-radius:10px;padding:14px;margin-bottom:10px;font-size:15px;color:#1a1a1a;text-align:left}' +
      '.sa857-store span{font-size:12px;color:#ff6a00}' +
      '.sa857-demo{position:absolute;right:10px;bottom:84px;z-index:800;background:#1a1a1a;color:#fff;border:0;border-radius:16px;padding:6px 12px;font-size:12px;opacity:.85}' +
      '.sa857-demo-panel{position:absolute;right:10px;bottom:120px;z-index:801;width:250px;background:#fff;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,.15);padding:12px}' +
      '.sa857-demo-panel b{display:block;font-size:13px;margin-bottom:6px}' +
      '.sa857-demo-panel p{font-size:12px;color:#666;line-height:1.5;margin-bottom:8px}' +
      '.sa857-demo-panel button{display:block;width:100%;margin-top:6px;border:1px solid #ff8a1a;background:#fff7f0;color:#ff6a00;border-radius:6px;padding:7px 0;font-size:12px}';
    var st = document.createElement('style');
    st.id = 'sa857Style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function shell() {
    return document.querySelector('.sa-shell') || document.body;
  }

  function applyCurrentStore() {
    var st = read();
    if (!st.currentStore) return;
    var nameEl = document.getElementById('saHomeStoreName');
    if (nameEl) nameEl.textContent = st.currentStore;
  }

  function showDialog(title, text, btnText, onBtn) {
    var mask = document.createElement('div');
    mask.className = 'sa857-mask';
    mask.innerHTML = '<div class="sa857-dialog"><h3></h3><p></p><button type="button"></button></div>';
    mask.querySelector('h3').textContent = title;
    mask.querySelector('p').textContent = text;
    var btn = mask.querySelector('button');
    btn.textContent = btnText;
    btn.addEventListener('click', function () {
      mask.remove();
      onBtn();
    });
    shell().appendChild(mask);
  }

  function showSwitchSheet() {
    var mask = document.createElement('div');
    mask.className = 'sa857-mask';
    mask.style.alignItems = 'flex-end';
    mask.style.padding = '0';
    var sheet = document.createElement('div');
    sheet.className = 'sa857-sheet';
    sheet.innerHTML = '<h3>选择门店</h3><div class="sa857-sub">当前账号可管理的门店</div>';
    OTHER_STORES.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sa857-store';
      b.innerHTML = '<em style="font-style:normal"></em><span>进入</span>';
      b.querySelector('em').textContent = name;
      b.addEventListener('click', function () {
        var st = read();
        st.currentStore = name;
        st.pending = '';
        write(st);
        mask.remove();
        applyCurrentStore();
        if (global.LFToast) global.LFToast.show('已切换到' + name);
      });
      sheet.appendChild(b);
    });
    mask.appendChild(sheet);
    shell().appendChild(mask);
  }

  function handlePending() {
    var st = read();
    var msg =
      '门店【' + CHANGED_STORE + '】的登录手机号已由管理员更换，你的账号已不能管理该门店。';
    if (st.pending === 'multi') {
      showDialog('门店登录手机号已更换', msg + '你还可以继续管理名下其他门店。', '切换门店', showSwitchSheet);
    } else if (st.pending === 'single') {
      showDialog('门店登录手机号已更换', msg + '当前账号下没有可管理的门店，请重新登录。', '重新登录', function () {
        st.pending = '';
        st.loggedOut = true;
        write(st);
        location.href = 'login.html';
      });
    }
  }

  function mountDemo() {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'sa857-demo';
    chip.textContent = '857 改号演示';
    var panel = document.createElement('div');
    panel.className = 'sa857-demo-panel';
    panel.hidden = true;
    panel.innerHTML =
      '<b>模拟 PC 更换本门店登录手机号</b>' +
      '<p>当前登录 ' + OLD_PHONE + '，正在管理【' + CHANGED_STORE + '】。选择场景后会刷新页面，相当于 App 下一次请求时收到改号结果。</p>' +
      '<button type="button" data-s="multi">名下还有其他门店</button>' +
      '<button type="button" data-s="single">名下只有这一家门店</button>' +
      '<button type="button" data-s="reset">恢复初始状态</button>';
    chip.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
    });
    panel.addEventListener('click', function (e) {
      var s = e.target && e.target.getAttribute('data-s');
      if (!s) return;
      write(s === 'reset' ? {} : { pending: s });
      location.reload();
    });
    shell().appendChild(chip);
    shell().appendChild(panel);
  }

  injectStyle();
  applyCurrentStore();
  mountDemo();
  handlePending();

  global.Sa857PhoneChange = { KEY: KEY, OLD_PHONE: OLD_PHONE, read: read, write: write };
})(window);
