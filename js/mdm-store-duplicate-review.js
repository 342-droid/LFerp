/* 门店疑似重复：原型匹配、审核提示及验收场景。 */
(function (global) {
  var DEMO_KEY = 'lf_store_duplicate_acceptance_v1';
  function clean(value) {
    return String(value || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  }
  function score(a, b) {
    a = clean(a); b = clean(b);
    if (!a || !b) return 0;
    var prev = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    for (var i = 1; i <= a.length; i++) {
      var next = [i];
      for (var j = 1; j <= b.length; j++) {
        next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = next;
    }
    return Math.round((1 - prev[b.length] / Math.max(a.length, b.length)) * 100);
  }
  function phone(value) {
    var raw = String(value || '').replace(/\D/g, '');
    return /^1\d{10}$/.test(raw) ? raw : '';
  }
  function demoMode() {
    try { return global.localStorage.getItem(DEMO_KEY) || 'auto'; } catch (e) { return 'auto'; }
  }
  function demoMatches() {
    return [
      { name: '鲜丰水果文一西路店', code: 'MU20260315001', reasons: ['门店名称相似 92%', '门店地址相似 87%', '手机号相同 100%'] },
      { name: '文一西路鲜丰店', code: 'MU20260509032', reasons: ['门店名称相似 83%', '手机号相同 100%'] },
      { name: '鲜丰水果城西店', code: 'MU20260412018', reasons: ['门店名称相似 89%', '门店地址相似 86%'] },
      { name: '鲜丰水果古墩店', code: 'MU20260618006', reasons: ['门店名称相似 86%'] },
      { name: '鲜丰果园西溪店', code: 'MU20260702011', reasons: ['门店名称相似 81%'] }
    ];
  }
  function reviewMatches(stored) {
    if (demoMode() === 'none') return [];
    if (demoMode() === 'hit') return demoMatches();
    return Array.isArray(stored) ? stored.slice().sort(function (a, b) {
      return (b.rank || b.score || 0) - (a.rank || a.score || 0);
    }) : [];
  }
  function find(input, candidates) {
    var mode = demoMode();
    if (mode === 'none') return [];
    if (mode === 'hit') return demoMatches();
    var found = [];
    (candidates || []).forEach(function (row) {
      if (!row) return;
      var identity = String(row.merchantUid || row.storeCode || row.id || '');
      if (identity && identity === String(input.currentId || '')) return;
      var name = row.name || row.storeName || '';
      var addr = row.address || [row.regionCascade, row.detailAddress].filter(Boolean).join('');
      var cell = row.contactPhone || row.phone || '';
      var reasons = [];
      var ns = score(input.name, name);
      var as = score(input.address, addr);
      if (ns >= 60) reasons.push('门店名称相似 ' + ns + '%');
      if (as >= 60) reasons.push('门店地址相似 ' + as + '%');
      if (phone(input.phone) && phone(input.phone) === phone(cell)) reasons.push('手机号相同 100%');
      if (reasons.length) found.push({ name: name, code: row.storeCode || row.merchantUid || '', reasons: reasons,
        rank: Math.max(ns, as, reasons.some(function (r) { return r.indexOf('手机号') === 0; }) ? 100 : 0) });
    });
    return found.sort(function (a, b) { return b.rank - a.rank; });
  }
  function appendRemaining(container, matches, showCode) {
    if (matches.length <= 3) return;
    var more = document.createElement('p');
    more.className = 'lf-duplicate-remaining';
    more.textContent = '另有 ' + (matches.length - 3) + ' 家疑似门店：' + matches.slice(3).map(function (m) {
      var name = m.name || '未命名门店';
      return showCode && m.code ? name + '·' + m.code : name;
    }).join('、') + '。';
    container.appendChild(more);
  }
  function itemNode(match, showCode) {
    var item = document.createElement('div');
    item.className = 'lf-duplicate-item';
    var header = document.createElement('div');
    header.className = 'lf-duplicate-item-head';
    var title = document.createElement('strong');
    title.textContent = match.name || '未命名门店';
    header.appendChild(title);
    if (showCode && match.code) {
      var code = document.createElement('span');
      code.textContent = '门店编码：' + match.code;
      header.appendChild(code);
    }
    item.appendChild(header);
    var reasons = document.createElement('div');
    reasons.className = 'lf-duplicate-reasons';
    reasons.textContent = (match.reasons || []).join('；');
    item.appendChild(reasons);
    return item;
  }
  function banner(matches, showCode) {
    if (!Array.isArray(matches) || !matches.length) return null;
    var box = document.createElement('section');
    box.className = 'lf-duplicate-review';
    box.setAttribute('role', 'note');
    var title = document.createElement('strong');
    title.textContent = '疑似重复门店（' + matches.length + ' 家）';
    box.appendChild(title);
    var note = document.createElement('p');
    note.textContent = '以下已有门店与本次申请的名称、地址或手机号相似，请在审核时核实；此提示不代替审核结论。';
    box.appendChild(note);
    matches.slice(0, 3).forEach(function (m, i) {
      var item = itemNode(m, showCode);
      item.setAttribute('data-sequence', String(i + 1).padStart(2, '0'));
      box.appendChild(item);
    });
    appendRemaining(box, matches, showCode);
    return box;
  }
  function dialog(matches, onContinue) {
    if (!matches.length) { onContinue(); return; }
    var existing = appShell().querySelector('.lf-duplicate-mask');
    if (existing) existing.remove();
    var backdrop = document.createElement('div');
    backdrop.className = 'lf-duplicate-mask';
    var card = document.createElement('div');
    card.className = 'lf-duplicate-dialog';
    var h = document.createElement('h2');
    h.textContent = '发现疑似重复门店';
    card.appendChild(h);
    var note = document.createElement('p');
    note.textContent = '发现 ' + matches.length + ' 家疑似门店，请逐条核对。相似度仅供排查参考。';
    card.appendChild(note);
    var list = document.createElement('div');
    list.className = 'lf-duplicate-list';
    matches.slice(0, 3).forEach(function (m, i) {
      var item = itemNode(m, false);
      item.setAttribute('data-sequence', String(i + 1).padStart(2, '0'));
      list.appendChild(item);
    });
    card.appendChild(list);
    appendRemaining(card, matches, false);
    var actions = document.createElement('div');
    actions.className = 'lf-duplicate-actions';
    var back = document.createElement('button');
    back.type = 'button'; back.textContent = '返回修改';
    back.onclick = function () { backdrop.remove(); };
    var confirm = document.createElement('button');
    confirm.type = 'button'; confirm.textContent = '确认，继续提交';
    confirm.onclick = function () { backdrop.remove(); onContinue(); };
    actions.appendChild(back); actions.appendChild(confirm); card.appendChild(actions);
    backdrop.appendChild(card); appShell().appendChild(backdrop);
  }
  function appShell() {
    return document.querySelector('.shop-h5-mobile-container, .sa-shell, .bd-mobile-shell') || document.body;
  }
  function mountSwitch() {
    var bdCreate = document.body.getAttribute('data-bd-store-form') === '1' && global.location.hash === '#new';
    var shopRegister = document.body.getAttribute('data-shop-store-register') === '1';
    if (!bdCreate && !shopRegister) {
      var old = document.getElementById('lfDuplicateAcceptance');
      if (old) old.remove();
      return;
    }
    if (document.getElementById('lfDuplicateAcceptance')) return;
    var panel = document.createElement('aside');
    panel.id = 'lfDuplicateAcceptance';
    panel.className = 'lf-duplicate-demo';
    panel.innerHTML = '<strong>疑似重复门店验收开关</strong><label>匹配场景<select aria-label="疑似重复匹配场景">' +
      '<option value="auto">按填写资料匹配</option><option value="hit">模拟命中 5 家</option>' +
      '<option value="none">模拟无命中</option></select></label>' +
      '<p>选择场景后刷新页面；模拟命中仅用于原型验收。</p><button type="button" data-duplicate-apply>应用并刷新</button>' +
      '<button type="button" data-duplicate-preview style="margin-top:8px;background:#fff7ed;color:#c2410c;border:1px solid #fdba74">预览疑似提示</button>';
    panel.querySelector('select').value = demoMode();
    panel.querySelector('[data-duplicate-apply]').onclick = function () {
      try { global.localStorage.setItem(DEMO_KEY, panel.querySelector('select').value); } catch (e) {}
      global.location.reload();
    };
    var preview = panel.querySelector('[data-duplicate-preview]');
    if (preview) preview.onclick = function () {
      if (bdCreate && typeof global.MdmBdDuplicatePreview === 'function') global.MdmBdDuplicatePreview();
      else dialog(demoMatches(), function () {});
    };
    document.body.appendChild(panel);
  }
  global.MdmStoreDuplicateReview = { find: find, banner: banner, dialog: dialog,
    demoMode: demoMode, demoMatches: demoMatches, reviewMatches: reviewMatches,
    mountSwitch: mountSwitch };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountSwitch);
  else mountSwitch();
  global.addEventListener('hashchange', mountSwitch);
})(window);
