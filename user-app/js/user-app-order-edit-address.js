/**
 * 订单详情 — 修改地址（复用地址簿数据，不改地址簿页）
 */
(function () {
  var ORIGIN_KEY = 'ua_order_edit_address_origin';
  var SELECTED_KEY = 'ua_order_edit_address_selected';
  var PICKED_KEY = 'ua_refund_picked_address';

  function getParams() {
    return new URLSearchParams(window.location.search);
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(msg) {
    var el = document.getElementById('oeaToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1800);
  }

  function buildOrderDetailReturnHref() {
    var from = getParams().get('from') || 'order-detail.html?status=pending_accept';
    try {
      var decoded = decodeURIComponent(from);
      if (/order-detail\.html/i.test(decoded) || /order-detail(\?|$)/i.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      /* ignore */
    }
    return from;
  }

  function loadGroups() {
    if (window.UAOrderRefund && typeof window.UAOrderRefund.loadAddressBookGroups === 'function') {
      return window.UAOrderRefund.loadAddressBookGroups();
    }
    return [];
  }

  function displayPhone(phone) {
    var raw = String(phone || '');
    var digits = raw.replace(/\D/g, '');
    if (digits.length === 11) return digits;
    var prefix = (raw.match(/^(\d{3})/) || [])[1] || digits.slice(0, 3);
    var suffix = (raw.match(/(\d{4})\s*$/) || [])[1] || digits.slice(-4);
    if (prefix === '138' && suffix === '6688') return '13866886688';
    if (prefix === '181' && suffix === '4215') return '18142154215';
    if (prefix.length === 3 && suffix.length === 4) return (prefix + '0000' + suffix).slice(0, 11);
    if (digits.length > 11) return digits.slice(0, 11);
    return (digits + '00000000000').slice(0, 11);
  }

  function splitAddress(text) {
    var raw = String(text || '').trim();
    if (!raw) return { region: '', detail: '' };
    var m = raw.match(/^((?:[^省]+省\s*)?(?:[^市]+市\s*)?(?:[^区县]+[区县]\s*)?(?:[^街道镇乡]+(?:街道|镇|乡))?)\s*(.+)$/);
    if (m && m[2]) {
      return {
        region: m[1].replace(/([省市])/g, '$1 ').replace(/\s+/g, ' ').trim(),
        detail: m[2].trim()
      };
    }
    return { region: '', detail: raw };
  }

  function readOrigin() {
    try {
      var raw = sessionStorage.getItem(ORIGIN_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.text) {
          return {
            name: parsed.name || '',
            phone: displayPhone(parsed.phone),
            text: parsed.text
          };
        }
      }
    } catch (e) {
      /* ignore */
    }
    var from = '';
    try {
      from = decodeURIComponent(getParams().get('from') || '');
    } catch (e2) {
      from = getParams().get('from') || '';
    }
    if (/from=restock\.html|restock\.html/.test(from)) {
      return {
        name: '张店长',
        phone: '13866886688',
        text: '浙江省杭州市萧山区建设一路88号 悠悠生鲜超市'
      };
    }
    return {
      name: '武者',
      phone: '18142154215',
      text: '四川省成都市武侯区天府大道中段666号天府软件园A区'
    };
  }

  function compactText(str) {
    return String(str || '').replace(/\s+/g, '');
  }

  function isSameAsOrigin(row, origin) {
    if (!row || !origin) return false;
    var sameText = compactText(row.text) && compactText(row.text) === compactText(origin.text);
    var sameName = String(row.name || '').trim() === String(origin.name || '').trim();
    var samePhone = displayPhone(row.phone) === displayPhone(origin.phone);
    return sameText || (sameName && samePhone && sameText);
  }

  function flattenAddresses(groups) {
    var rows = [];
    (groups || []).forEach(function (group) {
      (group.addresses || []).forEach(function (addr) {
        rows.push({
          groupId: group.id,
          addrId: addr.id,
          name: group.name,
          phone: group.phone,
          phoneDisplay: displayPhone(group.phone || group.phoneDisplay),
          tags: group.tags || [],
          text: addr.text
        });
      });
    });
    return rows;
  }

  function renderOrigin(origin) {
    var el = document.getElementById('oeaOrigin');
    if (!el) return;
    var parts = splitAddress(origin.text);
    el.innerHTML =
      (parts.region ? '<div class="ua-oea-origin__region">' + escapeHtml(parts.region) + '</div>' : '') +
      '<div class="ua-oea-origin__detail">' + escapeHtml(parts.detail || origin.text) + '</div>' +
      '<div class="ua-oea-origin__user">' +
      '<span>' +
      escapeHtml(origin.name) +
      ' ' +
      escapeHtml(displayPhone(origin.phone)) +
      '</span>' +
      '<span class="ua-oea-tag">默认</span>' +
      '</div>';
  }

  function renderList(rows, selectedId) {
    var list = document.getElementById('oeaList');
    if (!list) return;
    if (!rows.length) {
      list.innerHTML = '<div class="ua-oea-empty">暂无可用地址</div>';
      return;
    }
    list.innerHTML = rows
      .map(function (row) {
        var parts = splitAddress(row.text);
        var selected = row.addrId === selectedId;
        return (
          '<div class="ua-oea-item' +
          (selected ? ' is-selected' : '') +
          '" data-addr="' +
          escapeHtml(row.addrId) +
          '">' +
          '<div class="ua-oea-item__body">' +
          (parts.region ? '<div class="ua-oea-item__region">' + escapeHtml(parts.region) + '</div>' : '') +
          '<div class="ua-oea-item__detail">' +
          escapeHtml(parts.detail || row.text) +
          '</div>' +
          '<div class="ua-oea-item__user"><span>' +
          escapeHtml(row.name) +
          ' ' +
          escapeHtml(displayPhone(row.phone || row.phoneDisplay)) +
          '</span></div></div>' +
          '<button type="button" class="ua-oea-item__edit" data-edit="' +
          escapeHtml(row.addrId) +
          '" aria-label="编辑地址">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
          '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 00-3-3L5 17v3z"/>' +
          '<path d="M13.5 6.5l3 3"/>' +
          '</svg></button></div>'
        );
      })
      .join('');
  }

  function buildEditHref(row) {
    var returnTo = 'order-edit-address.html' + (window.location.search || '');
    return (
      'order-refund-address-create.html?addrFrom=order_edit_address&from=' +
      encodeURIComponent(returnTo) +
      '&edit=1&groupId=' +
      encodeURIComponent(row.groupId) +
      '&addrId=' +
      encodeURIComponent(row.addrId)
    );
  }

  function init() {
    var origin = readOrigin();
    var rows = flattenAddresses(loadGroups()).filter(function (row) {
      return !isSameAsOrigin(row, origin);
    });
    var selectedId = '';
    try {
      selectedId = sessionStorage.getItem(SELECTED_KEY) || '';
    } catch (e) {
      selectedId = '';
    }
    if (
      selectedId &&
      !rows.some(function (r) {
        return r.addrId === selectedId;
      })
    ) {
      selectedId = '';
    }

    var backEl = document.getElementById('oeaBack');
    if (backEl) backEl.setAttribute('href', buildOrderDetailReturnHref());

    renderOrigin(origin);
    renderList(rows, selectedId);

    var list = document.getElementById('oeaList');
    if (list) {
      list.addEventListener('click', function (e) {
        var editBtn = e.target.closest('[data-edit]');
        if (editBtn) {
          e.preventDefault();
          e.stopPropagation();
          var editId = editBtn.getAttribute('data-edit');
          var row = rows.find(function (r) {
            return r.addrId === editId;
          });
          if (!row) return;
          try {
            sessionStorage.setItem(SELECTED_KEY, row.addrId);
          } catch (err) {
            /* ignore */
          }
          window.location.href = buildEditHref(row);
          return;
        }
        var item = e.target.closest('.ua-oea-item');
        if (!item) return;
        selectedId = item.getAttribute('data-addr') || '';
        try {
          sessionStorage.setItem(SELECTED_KEY, selectedId);
        } catch (err2) {
          /* ignore */
        }
        renderList(rows, selectedId);
      });
    }

    document.getElementById('oeaSubmit') &&
      document.getElementById('oeaSubmit').addEventListener('click', function () {
        if (!selectedId) {
          toast('请选择新的收货地址');
          return;
        }
        var row = rows.find(function (r) {
          return r.addrId === selectedId;
        });
        if (!row) {
          toast('请选择新的收货地址');
          return;
        }
        if (row.text === origin.text && row.name === origin.name) {
          toast('请选择与原地址不同的收货地址');
          return;
        }
        try {
          sessionStorage.setItem(
            PICKED_KEY,
            JSON.stringify({
              id: row.addrId,
              contact: row.name,
              phone: row.phone,
              label: row.text,
              full: row.text
            })
          );
          sessionStorage.removeItem(SELECTED_KEY);
        } catch (err) {
          /* ignore */
        }
        toast('地址已修改');
        window.setTimeout(function () {
          window.location.href = buildOrderDetailReturnHref();
        }, 400);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
