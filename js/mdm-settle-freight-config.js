/**
 * 结算 — 运费配置 / 费用模板列表 + 新增抽屉
 */
(function () {
  var PAGE_SIZE_OPTIONS = [20, 50, 100];
  var APP_PORTS = ['代采端', 'c端'];
  var FULFILLMENT_BY_PORT = {
    代采端: ['配送', '快递'],
    c端: ['自提', '快递']
  };
  var BILLING_METHOD = '货款阶梯价格';
  var REGION_NATIONWIDE = '全国';
  var REGION_TREE_4 = {
    北京市: {
      北京市: {
        北京城区: ['北京城区', '东城区', '西城区', '朝阳区'],
        通州区: ['中仓街道', '永顺镇']
      }
    },
    天津市: {
      天津市: {
        和平区: ['劝业场街道', '小白楼街道'],
        河东区: ['大王庄街道', '大直沽街道']
      }
    },
    河北省: {
      石家庄市: {
        长安区: ['建北街道', '青园街道'],
        桥西区: ['东里街道', '休门街道']
      },
      唐山市: {
        路北区: ['乔屯街道', '文化路街道'],
        路南区: ['学院南路街道']
      }
    },
    山西省: {
      太原市: {
        小店区: ['坞城街道', '营盘街道'],
        迎泽区: ['柳巷街道', '庙前街道']
      }
    },
    山东省: {
      济南市: {
        历下区: ['泉城路街道', '东关街道'],
        市中区: ['大观园街道']
      },
      青岛市: {
        市南区: ['八大关街道', '金门路街道'],
        市北区: ['敦化路街道']
      }
    },
    江苏省: {
      南京市: {
        鼓楼区: ['宁海路街道', '华侨路街道'],
        玄武区: ['梅园新村街道', '新街口街道'],
        江宁区: ['东山街道', '秣陵街道']
      },
      苏州市: {
        姑苏区: ['平江街道', '金阊街道'],
        工业园区: ['斜塘街道', '唯亭街道']
      }
    },
    浙江省: {
      杭州市: {
        西湖区: ['灵隐街道', '文新街道'],
        上城区: ['湖滨街道', '小营街道'],
        余杭区: ['临平街道', '东湖街道'],
        滨江区: ['西兴街道', '长河街道']
      },
      宁波市: {
        海曙区: ['鼓楼街道', '月湖街道'],
        鄞州区: ['中河街道']
      },
      嘉兴市: {
        南湖区: ['建设街道', '新兴街道'],
        秀洲区: ['新城街道']
      }
    },
    上海市: {
      上海市: {
        浦东新区: ['陆家嘴街道', '花木街道'],
        黄浦区: ['外滩街道', '半淞园路街道'],
        静安区: ['江宁路街道'],
        杨浦区: ['五角场街道']
      }
    },
    广东省: {
      广州市: {
        天河区: ['天河南街道', '石牌街道'],
        越秀区: ['北京街道', '人民街道']
      },
      深圳市: {
        南山区: ['粤海街道', '南山街道'],
        罗湖区: ['桂园街道', '东门街道']
      }
    }
  };

  var codeSeq = 4;

  var MOCK_ROWS = [
    {
      code: '202509290003',
      name: '山东仓-代采费',
      appPort: '代采端',
      fulfillmentMethod: '配送',
      validStart: '2025-09-01',
      validEnd: '2025-10-31',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '山东省 > 济南市 > 历下区 > 泉城路街道', startAmount: '0.00', endAmount: '500.00', freight: '8.00' }]
    },
    {
      code: '202509290002',
      name: '南京仓-全量撮合',
      appPort: '代采端',
      fulfillmentMethod: '快递',
      validStart: '2025-09-01',
      validEnd: '2025-12-31',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '江苏省 > 南京市 > 鼓楼区 > 宁海路街道', startAmount: '0.00', endAmount: '1000.00', freight: '10.00' }]
    },
    {
      code: '202509240002',
      name: '山东仓-运费模板',
      appPort: 'c端',
      fulfillmentMethod: '快递',
      validStart: '2025-09-01',
      validEnd: '2025-12-31',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '北京市 > 北京市 > 北京城区 > 北京城区', startAmount: '0.00', endAmount: '0.00', freight: '0.00' }]
    },
    {
      code: '202509230008',
      name: '嘉兴仓-代采费',
      appPort: '代采端',
      fulfillmentMethod: '配送',
      validStart: '2025-09-01',
      validEnd: '2025-10-31',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '浙江省 > 杭州市 > 西湖区 > 文新街道', startAmount: '0.00', endAmount: '300.00', freight: '6.00' }]
    },
    {
      code: '202509230004',
      name: '山东仓-自提费',
      appPort: '代采端',
      fulfillmentMethod: '配送',
      validStart: '2025-09-01',
      validEnd: '2026-03-01',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '山东省 > 青岛市 > 市南区 > 八大关街道', startAmount: '0.00', endAmount: '200.00', freight: '5.00' }]
    },
    {
      code: '202509230003',
      name: '南京仓-代采费',
      appPort: '代采端',
      fulfillmentMethod: '快递',
      validStart: '2025-09-01',
      validEnd: '2025-11-01',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '江苏省 > 苏州市 > 工业园区 > 斜塘街道', startAmount: '0.00', endAmount: '800.00', freight: '12.00' }]
    },
    {
      code: '202509230001',
      name: '山东仓-基础运费',
      appPort: 'c端',
      fulfillmentMethod: '自提',
      validStart: '2025-09-01',
      validEnd: '2025-10-31',
      billingMethod: BILLING_METHOD,
      tiers: [{ region: '全国', startAmount: '0.00', endAmount: '0.00', freight: '0.00' }]
    }
  ];

  var state = {
    keywordCode: '',
    keywordName: '',
    filterAppPort: '',
    filterFulfillment: '',
    page: 1,
    pageSize: 20,
    selected: {},
    collapsed: false,
    drawer: null,
    editCode: null,
    tiers: []
  };

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null && text !== '') n.textContent = text;
    return n;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function pad4(n) {
    var s = String(n);
    while (s.length < 4) s = '0' + s;
    return s;
  }

  function nextTemplateCode() {
    var d = new Date();
    return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + pad4(codeSeq++);
  }

  function formatValidPeriod(row) {
    if (row.validStart && row.validEnd) return row.validStart + ' 至 ' + row.validEnd;
    return row.validPeriod || '—';
  }

  function filteredRows() {
    var code = String(state.keywordCode || '').trim().toLowerCase();
    var name = String(state.keywordName || '').trim().toLowerCase();
    var port = String(state.filterAppPort || '').trim();
    var fulfillment = String(state.filterFulfillment || '').trim();
    return MOCK_ROWS.filter(function (row) {
      if (code && String(row.code).toLowerCase().indexOf(code) < 0) return false;
      if (name && String(row.name).toLowerCase().indexOf(name) < 0) return false;
      if (port && String(row.appPort || '') !== port) return false;
      if (fulfillment && String(row.fulfillmentMethod || '') !== fulfillment) return false;
      return true;
    });
  }

  function pageRows() {
    var all = filteredRows();
    var start = (state.page - 1) * state.pageSize;
    return { total: all.length, rows: all.slice(start, start + state.pageSize) };
  }

  function selectedCodes() {
    return Object.keys(state.selected).filter(function (k) {
      return state.selected[k];
    });
  }

  function syncDeleteBtn() {
    var btn = $('sfDeleteBtn');
    if (btn) btn.disabled = selectedCodes().length === 0;
  }

  function findRow(code) {
    var found = null;
    MOCK_ROWS.forEach(function (row) {
      if (row.code === code) found = row;
    });
    return found;
  }

  function renderTable() {
    var tbody = $('sfTableBody');
    var empty = $('sfEmpty');
    var pageData = pageRows();
    if (!tbody) return;

    if (!pageData.rows.length) {
      tbody.innerHTML = '';
      if (empty) empty.hidden = false;
    } else {
      if (empty) empty.hidden = true;
      tbody.innerHTML = pageData.rows
        .map(function (row, idx) {
          var index = (state.page - 1) * state.pageSize + idx + 1;
          var checked = !!state.selected[row.code];
          var period = formatValidPeriod(row);
          return (
            '<tr class="' +
            (checked ? 'is-selected' : '') +
            '" data-code="' +
            escapeHtml(row.code) +
            '">' +
            '<td class="sf-table__check"><input type="checkbox" class="sf-row-check" data-code="' +
            escapeHtml(row.code) +
            '"' +
            (checked ? ' checked' : '') +
            '></td>' +
            '<td class="sf-table__index">' +
            index +
            '</td>' +
            '<td class="sf-table__code"><a href="#" class="sf-link js-sf-code">' +
            escapeHtml(row.code) +
            '</a></td>' +
            '<td class="sf-table__name">' +
            escapeHtml(row.name) +
            '</td>' +
            '<td class="sf-table__port">' +
            escapeHtml(row.appPort) +
            '</td>' +
            '<td class="sf-table__fulfillment">' +
            escapeHtml(row.fulfillmentMethod || '—') +
            '</td>' +
            '<td class="sf-table__valid" title="' +
            escapeHtml(period) +
            '">' +
            escapeHtml(period) +
            '</td>' +
            '<td class="sf-table__billing-method">' +
            escapeHtml(row.billingMethod || BILLING_METHOD) +
            '</td>' +
            '<td class="sf-table__action"><div class="sf-action-cell">' +
            '<button type="button" class="sf-link js-sf-edit">修改</button>' +
            '</div></td>' +
            '</tr>'
          );
        })
        .join('');
    }

    var checkAll = $('sfCheckAll');
    if (checkAll) {
      var codes = pageData.rows.map(function (r) {
        return r.code;
      });
      var allChecked = codes.length > 0 && codes.every(function (c) {
        return state.selected[c];
      });
      checkAll.checked = allChecked;
      checkAll.indeterminate = !allChecked && codes.some(function (c) {
        return state.selected[c];
      });
    }

    renderPagination(pageData.total);
    syncDeleteBtn();
  }

  function renderPagination(total) {
    var totalEl = $('sfPaginationTotal');
    var pagesEl = $('sfPaginationPages');
    var sizeEl = $('sfPageSize');
    var jumpEl = $('sfJumpPage');
    if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
    if (sizeEl) sizeEl.value = String(state.pageSize);
    if (jumpEl) jumpEl.value = String(state.page);

    var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
    if (state.page > totalPages) state.page = totalPages;
    if (!pagesEl) return;

    pagesEl.innerHTML =
      '<button type="button" class="sf-page-btn" data-page="' +
      (state.page - 1) +
      '"' +
      (state.page <= 1 ? ' disabled' : '') +
      '>‹</button>' +
      '<button type="button" class="sf-page-btn is-active" data-page="' +
      state.page +
      '">' +
      state.page +
      '</button>' +
      '<button type="button" class="sf-page-btn" data-page="' +
      (state.page + 1) +
      '"' +
      (state.page >= totalPages ? ' disabled' : '') +
      '>›</button>';
  }

  function closeDrawer() {
    if (state.drawer) {
      state.drawer.remove();
      state.drawer = null;
    }
    state.editCode = null;
    state.tiers = [];
  }

  function parseRegionPath(path) {
    return String(path || '')
      .split('>')
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function formatRegionPath(parts) {
    return (parts || []).filter(Boolean).join(' > ');
  }

  function getCities(province) {
    var node = REGION_TREE_4[province];
    return node ? Object.keys(node) : [];
  }

  function getDistricts(province, city) {
    var node = REGION_TREE_4[province] && REGION_TREE_4[province][city];
    return node ? Object.keys(node) : [];
  }

  function getStreets(province, city, district) {
    var streets =
      REGION_TREE_4[province] &&
      REGION_TREE_4[province][city] &&
      REGION_TREE_4[province][city][district];
    return Array.isArray(streets) ? streets.slice() : [];
  }

  function openRegionPicker(initialPath, onConfirm) {
    var parts = parseRegionPath(initialPath);
    var isNationwideInit =
      parts.length === 1 && (parts[0] === REGION_NATIONWIDE || parts[0] === '全部');
    var pick = {
      province: isNationwideInit ? REGION_NATIONWIDE : parts[0] || '',
      city: isNationwideInit ? '' : parts[1] || '',
      district: isNationwideInit ? '' : parts[2] || '',
      street: isNationwideInit ? '' : parts[3] || ''
    };

    var mask = el('div', 'sf-region-modal-mask');
    var modal = el('div', 'sf-region-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var header = el('div', 'sf-region-modal__header');
    header.appendChild(el('h3', 'sf-region-modal__title', '请选择区域'));
    var closeX = el('button', 'sf-region-modal__close');
    closeX.type = 'button';
    closeX.innerHTML = '&times;';
    closeX.setAttribute('aria-label', '关闭');
    header.appendChild(closeX);

    var columns = el('div', 'sf-region-cols');
    var colP = el('div', 'sf-region-col');
    var colC = el('div', 'sf-region-col');
    var colD = el('div', 'sf-region-col');
    var colS = el('div', 'sf-region-col');
    colP.appendChild(el('div', 'sf-region-col__head', '省'));
    colC.appendChild(el('div', 'sf-region-col__head', '市'));
    colD.appendChild(el('div', 'sf-region-col__head', '区/县'));
    colS.appendChild(el('div', 'sf-region-col__head', '街道'));
    var listP = el('div', 'sf-region-col__list');
    var listC = el('div', 'sf-region-col__list');
    var listD = el('div', 'sf-region-col__list');
    var listS = el('div', 'sf-region-col__list');
    colP.appendChild(listP);
    colC.appendChild(listC);
    colD.appendChild(listD);
    colS.appendChild(listS);
    columns.appendChild(colP);
    columns.appendChild(colC);
    columns.appendChild(colD);
    columns.appendChild(colS);

    var footer = el('div', 'sf-region-modal__footer');
    var summary = el('div', 'sf-region-summary');
    var summaryLabel = el('span', 'sf-region-summary__label', '已选择：');
    var summaryPath = el('span', 'sf-region-summary__path');
    summary.appendChild(summaryLabel);
    summary.appendChild(summaryPath);

    var actions = el('div', 'sf-region-modal__actions');
    var cancelBtn = el('button', 'sf-btn sf-btn--default', '取消');
    cancelBtn.type = 'button';
    var okBtn = el('button', 'sf-btn sf-btn--primary', '确定');
    okBtn.type = 'button';
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);

    footer.appendChild(summary);
    footer.appendChild(actions);

    modal.appendChild(header);
    modal.appendChild(columns);
    modal.appendChild(footer);
    mask.appendChild(modal);
    document.body.appendChild(mask);

    function isNationwide() {
      return pick.province === REGION_NATIONWIDE;
    }

    function currentPath() {
      if (isNationwide()) return REGION_NATIONWIDE;
      return formatRegionPath([pick.province, pick.city, pick.district, pick.street]);
    }

    function syncSummary() {
      var segs = isNationwide()
        ? [REGION_NATIONWIDE]
        : [pick.province, pick.city, pick.district, pick.street].filter(Boolean);
      summaryPath.innerHTML = '';
      if (!segs.length) {
        summaryPath.textContent = '未选择';
        summaryPath.classList.add('is-empty');
        return;
      }
      summaryPath.classList.remove('is-empty');
      segs.forEach(function (name, i) {
        if (i > 0) {
          summaryPath.appendChild(el('span', 'sf-region-summary__sep', ' > '));
        }
        summaryPath.appendChild(el('span', 'sf-region-summary__seg', name));
      });
    }

    function fillList(listEl, items, active, onPick) {
      listEl.innerHTML = '';
      if (!items || !items.length) {
        listEl.appendChild(el('div', 'sf-region-empty', isNationwide() ? '—' : '请选择上级'));
        return;
      }
      items.forEach(function (name) {
        var item = el('div', 'sf-region-item' + (name === active ? ' is-active' : ''), name);
        item.addEventListener('click', function () {
          onPick(name);
        });
        listEl.appendChild(item);
      });
    }

    function provinceOptions() {
      return [REGION_NATIONWIDE].concat(Object.keys(REGION_TREE_4));
    }

    function renderLists() {
      fillList(listP, provinceOptions(), pick.province, function (name) {
        pick.province = name;
        pick.city = '';
        pick.district = '';
        pick.street = '';
        renderLists();
      });
      fillList(listC, isNationwide() ? [] : getCities(pick.province), pick.city, function (name) {
        pick.city = name;
        pick.district = '';
        pick.street = '';
        renderLists();
      });
      fillList(
        listD,
        isNationwide() ? [] : getDistricts(pick.province, pick.city),
        pick.district,
        function (name) {
          pick.district = name;
          pick.street = '';
          renderLists();
        }
      );
      fillList(
        listS,
        isNationwide() ? [] : getStreets(pick.province, pick.city, pick.district),
        pick.street,
        function (name) {
          pick.street = name;
          renderLists();
        }
      );
      syncSummary();
    }

    function shut() {
      mask.remove();
    }

    closeX.addEventListener('click', shut);
    cancelBtn.addEventListener('click', shut);
    mask.addEventListener('click', function (e) {
      if (e.target === mask) shut();
    });
    okBtn.addEventListener('click', function () {
      if (isNationwide()) {
        if (typeof onConfirm === 'function') onConfirm(REGION_NATIONWIDE);
        shut();
        return;
      }
      if (!pick.province || !pick.city || !pick.district || !pick.street) {
        if (typeof showToast === 'function') showToast('请完整选择省 / 市 / 区县 / 街道', 'error');
        return;
      }
      if (typeof onConfirm === 'function') onConfirm(currentPath());
      shut();
    });

    // 默认展开第一条链路；非法路径回退到默认
    if (isNationwide()) {
      pick.city = '';
      pick.district = '';
      pick.street = '';
    } else if (!pick.province || !REGION_TREE_4[pick.province]) {
      var firstP = Object.keys(REGION_TREE_4)[0];
      pick.province = firstP;
      var cities = getCities(firstP);
      pick.city = cities[0] || '';
      var districts = getDistricts(pick.province, pick.city);
      pick.district = districts[0] || '';
      var streets = getStreets(pick.province, pick.city, pick.district);
      pick.street = streets[0] || '';
    } else {
      if (pick.province && !pick.city) {
        pick.city = getCities(pick.province)[0] || '';
      }
      if (pick.city && getCities(pick.province).indexOf(pick.city) < 0) {
        pick.city = getCities(pick.province)[0] || '';
        pick.district = '';
        pick.street = '';
      }
      if (pick.city && !pick.district) {
        pick.district = getDistricts(pick.province, pick.city)[0] || '';
      }
      if (pick.district && getDistricts(pick.province, pick.city).indexOf(pick.district) < 0) {
        pick.district = getDistricts(pick.province, pick.city)[0] || '';
        pick.street = '';
      }
      if (pick.district && !pick.street) {
        pick.street = getStreets(pick.province, pick.city, pick.district)[0] || '';
      }
      if (
        pick.street &&
        getStreets(pick.province, pick.city, pick.district).indexOf(pick.street) < 0
      ) {
        pick.street = getStreets(pick.province, pick.city, pick.district)[0] || '';
      }
    }

    renderLists();
  }

  function ensureFirstTierStartZero() {
    if (!state.tiers.length) return;
    state.tiers[0].startAmount = '0';
  }

  function renderTier(tbody, readonly) {
    if (!tbody) return;
    var isReadonly = !!readonly;
    ensureFirstTierStartZero();
    if (!state.tiers.length) {
      tbody.innerHTML =
        '<tr><td colspan="' +
        (isReadonly ? '4' : '5') +
        '" style="text-align:center;color:#909399;padding:16px;">' +
        (isReadonly ? '暂无阶梯' : '暂无阶梯，请点击「新增货款阶梯」') +
        '</td></tr>';
      return;
    }
    tbody.innerHTML = state.tiers
      .map(function (tier, idx) {
        var regionText = tier.region || '';
        var startVal = idx === 0 ? '0' : tier.startAmount;
        if (isReadonly) {
          return (
            '<tr data-tier-idx="' +
            idx +
            '" class="is-readonly">' +
            '<td title="' +
            escapeHtml(regionText) +
            '">' +
            escapeHtml(regionText || '—') +
            '</td>' +
            '<td>' +
            escapeHtml(startVal) +
            '</td>' +
            '<td>' +
            escapeHtml(tier.endAmount) +
            '</td>' +
            '<td>' +
            escapeHtml(tier.freight) +
            '</td>' +
            '</tr>'
          );
        }
        return (
          '<tr data-tier-idx="' +
          idx +
          '">' +
          '<td><button type="button" class="sf-region-trigger js-tier-region" title="' +
          escapeHtml(regionText) +
          '">' +
          (regionText
            ? '<span class="sf-region-trigger__text">' + escapeHtml(regionText) + '</span>'
            : '<span class="sf-region-trigger__placeholder">请选择</span>') +
          '<span class="sf-region-trigger__arrow">▾</span>' +
          '</button></td>' +
          '<td><input class="sf-input js-tier-start" type="number" step="0.01" min="0" value="' +
          escapeHtml(startVal) +
          '"' +
          (idx === 0 ? ' disabled title="第一条起始货款固定为0"' : '') +
          '></td>' +
          '<td><input class="sf-input js-tier-end" type="number" step="0.01" min="0" value="' +
          escapeHtml(tier.endAmount) +
          '"></td>' +
          '<td><input class="sf-input js-tier-freight" type="number" step="0.01" min="0" value="' +
          escapeHtml(tier.freight) +
          '"></td>' +
          '<td><button type="button" class="sf-link js-tier-del">删除</button></td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function syncTierFromDom(tbody) {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll('tr[data-tier-idx]'), function (tr) {
      var idx = parseInt(tr.getAttribute('data-tier-idx'), 10);
      if (!state.tiers[idx]) return;
      var regionBtn = tr.querySelector('.js-tier-region');
      var start = tr.querySelector('.js-tier-start');
      var end = tr.querySelector('.js-tier-end');
      var freight = tr.querySelector('.js-tier-freight');
      var regionText = '';
      if (regionBtn) {
        var txt = regionBtn.querySelector('.sf-region-trigger__text');
        regionText = txt ? txt.textContent : state.tiers[idx].region || '';
      }
      state.tiers[idx] = {
        region: regionText,
        startAmount: idx === 0 ? '0' : start ? start.value : '',
        endAmount: end ? end.value : '',
        freight: freight ? freight.value : ''
      };
    });
    ensureFirstTierStartZero();
  }

  function validateTiers(tiers) {
    if (!tiers || !tiers.length) return '请至少新增一条货款阶梯';

    var byRegion = {};
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var rowNo = i + 1;
      if (!t.region) return '请完善第 ' + rowNo + ' 行区域';

      var start = parseFloat(t.startAmount);
      var end = parseFloat(t.endAmount);
      var freight = parseFloat(t.freight);
      if (isNaN(start) || t.startAmount === '' || t.startAmount == null) {
        return '请完善第 ' + rowNo + ' 行起始货款';
      }
      if (isNaN(end) || t.endAmount === '' || t.endAmount == null) {
        return '请完善第 ' + rowNo + ' 行结束货款';
      }
      if (isNaN(freight) || t.freight === '' || t.freight == null) {
        return '请完善第 ' + rowNo + ' 行运费';
      }
      if (!(start < end)) {
        return '第 ' + rowNo + ' 行起始货款须小于结束货款';
      }

      if (!byRegion[t.region]) byRegion[t.region] = [];
      byRegion[t.region].push({ start: start, end: end, rowNo: rowNo });
    }

    var regions = Object.keys(byRegion);
    for (var r = 0; r < regions.length; r++) {
      var list = byRegion[regions[r]];
      for (var j = 1; j < list.length; j++) {
        if (!(list[j].start > list[j - 1].end)) {
          return (
            '第 ' +
            list[j].rowNo +
            ' 行起始货款须大于上一级（第 ' +
            list[j - 1].rowNo +
            ' 行）结束货款'
          );
        }
      }
    }
    return '';
  }

  function openDrawer(row, mode) {
    closeDrawer();
    var isView = mode === 'view';
    var isEdit = !!row && !isView;
    var isCreate = !row;
    state.editCode = isEdit || isView ? row.code : null;
    state.tiers = (row && row.tiers && row.tiers.length
      ? row.tiers
      : [{ region: '', startAmount: '0', endAmount: '', freight: '' }]
    ).map(function (t) {
      return {
        region: t.region || '',
        startAmount: t.startAmount != null ? String(t.startAmount) : '',
        endAmount: t.endAmount != null ? String(t.endAmount) : '',
        freight: t.freight != null ? String(t.freight) : ''
      };
    });
    ensureFirstTierStartZero();

    var backdrop = el('div', 'sf-drawer-backdrop' + (isView ? ' is-view' : ''));
    var drawer = el('aside', 'sf-drawer' + (isView ? ' sf-drawer--view' : ''));
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    var header = el('div', 'sf-drawer__header');
    var titleText = isView ? '费用模板详情' : isEdit ? '修改运费模板' : '新增运费模板';
    header.appendChild(el('h2', 'sf-drawer__title', titleText));
    var closeBtn = el('button', 'sf-drawer__close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.innerHTML = '&times;';
    header.appendChild(closeBtn);

    var body = el('div', 'sf-drawer__body');

    // 基本信息
    var basicSec = el('section', 'sf-section');
    basicSec.id = 'sfBasicSection';
    var basicHead = el('div', 'sf-section__head');
    basicHead.appendChild(el('h3', 'sf-section__title', '基本信息'));
    var basicCollapse = el('button', 'sf-btn sf-btn--text js-sec-collapse', '收起');
    basicCollapse.type = 'button';
    basicCollapse.setAttribute('data-target', 'sfBasicSection');
    basicHead.appendChild(basicCollapse);
    basicSec.appendChild(basicHead);

    var basicBody = el('div', 'sf-section__body');
    var grid = el('div', 'sf-form-grid');

    function formItem(label, required, control) {
      var item = el('div', 'sf-form-item');
      var lab = el('div', 'sf-form-item__label');
      if (required && !isView) lab.appendChild(el('span', 'sf-req', '*'));
      lab.appendChild(document.createTextNode(label));
      item.appendChild(lab);
      var ctl = el('div', 'sf-form-item__control');
      ctl.appendChild(control);
      item.appendChild(ctl);
      return item;
    }

    var codeInp = document.createElement('input');
    codeInp.className = 'sf-input';
    codeInp.id = 'sfFormCode';
    codeInp.disabled = true;
    codeInp.value = isCreate ? nextTemplateCode() : row.code;

    var nameInp = document.createElement('input');
    nameInp.className = 'sf-input';
    nameInp.id = 'sfFormName';
    nameInp.placeholder = isView ? '' : '请输入模板名称';
    nameInp.value = isCreate ? '' : row.name || '';
    nameInp.disabled = isView;

    var portSel = document.createElement('select');
    portSel.className = 'sf-select';
    portSel.id = 'sfFormPort';
    portSel.disabled = isView;
    var portPlaceholder = document.createElement('option');
    portPlaceholder.value = '';
    portPlaceholder.textContent = '请选择';
    portSel.appendChild(portPlaceholder);
    APP_PORTS.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      if (!isCreate && row.appPort === p) opt.selected = true;
      portSel.appendChild(opt);
    });

    var fulfillmentSel = document.createElement('select');
    fulfillmentSel.className = 'sf-select';
    fulfillmentSel.id = 'sfFormFulfillment';
    fulfillmentSel.disabled = isView;

    function fillFulfillmentOptions(port, preferred) {
      var options = FULFILLMENT_BY_PORT[port] || [];
      var keep = preferred && options.indexOf(preferred) >= 0 ? preferred : '';
      fulfillmentSel.innerHTML = '';
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = port ? '请选择' : '请先选择应用端口';
      fulfillmentSel.appendChild(ph);
      options.forEach(function (v) {
        var opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        if (keep && v === keep) opt.selected = true;
        fulfillmentSel.appendChild(opt);
      });
      fulfillmentSel.disabled = isView || !port;
    }

    fillFulfillmentOptions(
      isCreate ? '' : row.appPort || '',
      isCreate ? '' : row.fulfillmentMethod || ''
    );

    portSel.addEventListener('change', function () {
      var prev = fulfillmentSel.value;
      fillFulfillmentOptions(portSel.value, prev);
    });

    var dateWrap = el('div', 'sf-date-range' + (isView ? ' is-disabled' : ''));
    var startInp = document.createElement('input');
    startInp.type = 'date';
    startInp.className = 'sf-date-range__input';
    startInp.id = 'sfFormValidStart';
    startInp.value = isCreate ? '' : row.validStart || '';
    startInp.disabled = isView;
    var sep = el('span', 'sf-date-range__sep', '至');
    var endInp = document.createElement('input');
    endInp.type = 'date';
    endInp.className = 'sf-date-range__input';
    endInp.id = 'sfFormValidEnd';
    endInp.value = isCreate ? '' : row.validEnd || '';
    endInp.disabled = isView;
    dateWrap.appendChild(startInp);
    dateWrap.appendChild(sep);
    dateWrap.appendChild(endInp);

    var billingSel = document.createElement('select');
    billingSel.className = 'sf-select';
    billingSel.id = 'sfFormBilling';
    billingSel.disabled = isView;
    var billOpt = document.createElement('option');
    billOpt.value = BILLING_METHOD;
    billOpt.textContent = BILLING_METHOD;
    billOpt.selected = true;
    billingSel.appendChild(billOpt);

    grid.appendChild(formItem('模板编码', true, codeInp));
    grid.appendChild(formItem('模板名称', true, nameInp));
    grid.appendChild(formItem('应用端口', true, portSel));
    grid.appendChild(formItem('履约方式', true, fulfillmentSel));
    grid.appendChild(formItem('有效期', true, dateWrap));
    grid.appendChild(formItem('计费方式', true, billingSel));
    basicBody.appendChild(grid);
    basicSec.appendChild(basicBody);

    // 货款阶梯计费
    var tierSec = el('section', 'sf-section');
    tierSec.id = 'sfTierSection';
    var tierHead = el('div', 'sf-section__head');
    tierHead.appendChild(el('h3', 'sf-section__title', '货款阶梯计费'));
    var tierActs = el('div', 'sf-section__actions');
    var addTierBtn = null;
    if (!isView) {
      addTierBtn = el('button', 'sf-btn sf-btn--primary', '新增货款阶梯');
      addTierBtn.type = 'button';
      addTierBtn.id = 'sfAddTierBtn';
      tierActs.appendChild(addTierBtn);
    }
    var tierCollapse = el('button', 'sf-btn sf-btn--text js-sec-collapse', '收起');
    tierCollapse.type = 'button';
    tierCollapse.setAttribute('data-target', 'sfTierSection');
    tierActs.appendChild(tierCollapse);
    tierHead.appendChild(tierActs);
    tierSec.appendChild(tierHead);

    var tierBody = el('div', 'sf-section__body');
    var tierWrap = el('div', 'sf-tier-table-wrap');
    var tierTable = el('table', 'sf-tier-table');
    tierTable.innerHTML =
      '<thead><tr>' +
      '<th style="width:' +
      (isView ? '28%' : '22%') +
      '">区域</th>' +
      '<th style="width:' +
      (isView ? '24%' : '22%') +
      '">起始货款</th>' +
      '<th style="width:' +
      (isView ? '24%' : '22%') +
      '">结束货款</th>' +
      '<th style="width:' +
      (isView ? '24%' : '22%') +
      '">运费</th>' +
      (isView ? '' : '<th style="width:12%">操作</th>') +
      '</tr></thead>';
    var tierTbody = document.createElement('tbody');
    tierTbody.id = 'sfTierTbody';
    tierTable.appendChild(tierTbody);
    tierWrap.appendChild(tierTable);
    tierBody.appendChild(tierWrap);
    tierSec.appendChild(tierBody);

    body.appendChild(basicSec);
    body.appendChild(tierSec);

    var footer = el('div', 'sf-drawer__footer');
    var saveBtn = null;
    if (!isView) {
      saveBtn = el('button', 'sf-btn sf-btn--primary', '保存');
      saveBtn.type = 'button';
      footer.appendChild(saveBtn);
    }
    var backBtn = el('button', 'sf-btn sf-btn--default', '返回');
    backBtn.type = 'button';
    footer.appendChild(backBtn);

    drawer.appendChild(header);
    drawer.appendChild(body);
    drawer.appendChild(footer);
    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);
    state.drawer = backdrop;

    renderTier(tierTbody, isView);

    function shut() {
      closeDrawer();
    }

    closeBtn.addEventListener('click', shut);
    backBtn.addEventListener('click', shut);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) shut();
    });

    backdrop.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-sec-collapse');
      if (!btn) return;
      var id = btn.getAttribute('data-target');
      var sec = document.getElementById(id);
      if (!sec) return;
      sec.classList.toggle('is-collapsed');
      btn.textContent = sec.classList.contains('is-collapsed') ? '展开' : '收起';
    });

    if (isView) return;

    addTierBtn.addEventListener('click', function () {
      syncTierFromDom(tierTbody);
      var isFirst = state.tiers.length === 0;
      state.tiers.push({
        region: '',
        startAmount: isFirst ? '0' : '',
        endAmount: '',
        freight: ''
      });
      ensureFirstTierStartZero();
      renderTier(tierTbody, false);
    });

    tierTbody.addEventListener('click', function (e) {
      var regionBtn = e.target.closest('.js-tier-region');
      if (regionBtn) {
        var regionTr = regionBtn.closest('tr[data-tier-idx]');
        if (!regionTr) return;
        var regionIdx = parseInt(regionTr.getAttribute('data-tier-idx'), 10);
        syncTierFromDom(tierTbody);
        openRegionPicker(state.tiers[regionIdx] && state.tiers[regionIdx].region, function (path) {
          if (!state.tiers[regionIdx]) return;
          state.tiers[regionIdx].region = path;
          renderTier(tierTbody, false);
        });
        return;
      }

      var del = e.target.closest('.js-tier-del');
      if (!del) return;
      var tr = del.closest('tr[data-tier-idx]');
      if (!tr) return;
      syncTierFromDom(tierTbody);
      var idx = parseInt(tr.getAttribute('data-tier-idx'), 10);
      state.tiers.splice(idx, 1);
      ensureFirstTierStartZero();
      renderTier(tierTbody, false);
    });

    saveBtn.addEventListener('click', function () {
      syncTierFromDom(tierTbody);
      var name = String(nameInp.value || '').trim();
      var port = portSel.value;
      var fulfillment = fulfillmentSel.value;
      var start = startInp.value;
      var end = endInp.value;
      var code = codeInp.value;
      var allowedFulfillment = FULFILLMENT_BY_PORT[port] || [];

      if (!name) {
        if (typeof showToast === 'function') showToast('请输入模板名称', 'error');
        nameInp.focus();
        return;
      }
      if (!port) {
        if (typeof showToast === 'function') showToast('请选择应用端口', 'error');
        return;
      }
      if (!fulfillment) {
        if (typeof showToast === 'function') showToast('请选择履约方式', 'error');
        return;
      }
      if (allowedFulfillment.indexOf(fulfillment) < 0) {
        if (typeof showToast === 'function') showToast('履约方式与应用端口不匹配', 'error');
        return;
      }
      if (!start || !end) {
        if (typeof showToast === 'function') showToast('请选择有效期', 'error');
        return;
      }
      if (start > end) {
        if (typeof showToast === 'function') showToast('有效期开始日期不能晚于结束日期', 'error');
        return;
      }
      if (!state.tiers.length) {
        if (typeof showToast === 'function') showToast('请至少新增一条货款阶梯', 'error');
        return;
      }
      var tierErr = validateTiers(state.tiers);
      if (tierErr) {
        if (typeof showToast === 'function') showToast(tierErr, 'error');
        return;
      }

      var payload = {
        code: code,
        name: name,
        appPort: port,
        fulfillmentMethod: fulfillment,
        validStart: start,
        validEnd: end,
        billingMethod: BILLING_METHOD,
        tiers: state.tiers.slice()
      };

      if (isEdit) {
        var exist = findRow(code);
        if (exist) {
          Object.keys(payload).forEach(function (k) {
            exist[k] = payload[k];
          });
        }
        if (typeof showToast === 'function') showToast('运费模板已更新', 'success');
      } else {
        MOCK_ROWS.unshift(payload);
        if (typeof showToast === 'function') showToast('运费模板已保存', 'success');
      }
      shut();
      state.page = 1;
      renderTable();
    });

    setTimeout(function () {
      nameInp.focus();
    }, 0);
  }

  function syncFilterFulfillmentOptions() {
    var portEl = $('sfAppPort');
    var fulfillmentEl = $('sfFulfillment');
    if (!fulfillmentEl) return;
    var port = portEl ? portEl.value : '';
    var preferred = fulfillmentEl.value;
    var options = port ? FULFILLMENT_BY_PORT[port] || [] : ['配送', '自提', '快递'];
    fulfillmentEl.innerHTML = '';
    var allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = '全部';
    fulfillmentEl.appendChild(allOpt);
    options.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      if (preferred && preferred === v) opt.selected = true;
      fulfillmentEl.appendChild(opt);
    });
  }

  function bindEvents() {
    var queryBtn = $('sfFilterQuery');
    var resetBtn = $('sfFilterReset');
    var collapseBtn = $('sfFilterCollapse');
    var addBtn = $('sfAddBtn');
    var deleteBtn = $('sfDeleteBtn');
    var checkAll = $('sfCheckAll');
    var tbody = $('sfTableBody');
    var sizeEl = $('sfPageSize');
    var pagesEl = $('sfPaginationPages');
    var jumpEl = $('sfJumpPage');
    var jumpGo = $('sfJumpGo');
    var appPortEl = $('sfAppPort');

    if (appPortEl) {
      appPortEl.addEventListener('change', function () {
        syncFilterFulfillmentOptions();
      });
    }

    if (queryBtn) {
      queryBtn.addEventListener('click', function () {
        state.keywordCode = ($('sfCode') && $('sfCode').value) || '';
        state.keywordName = ($('sfName') && $('sfName').value) || '';
        state.filterAppPort = ($('sfAppPort') && $('sfAppPort').value) || '';
        state.filterFulfillment = ($('sfFulfillment') && $('sfFulfillment').value) || '';
        state.page = 1;
        renderTable();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if ($('sfCode')) $('sfCode').value = '';
        if ($('sfName')) $('sfName').value = '';
        if ($('sfAppPort')) $('sfAppPort').value = '';
        if ($('sfFulfillment')) $('sfFulfillment').value = '';
        syncFilterFulfillmentOptions();
        state.keywordCode = '';
        state.keywordName = '';
        state.filterAppPort = '';
        state.filterFulfillment = '';
        state.page = 1;
        renderTable();
      });
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        state.collapsed = !state.collapsed;
        var grid = $('sfFilterGrid');
        var label = $('sfFilterCollapseLabel');
        if (grid) grid.hidden = state.collapsed;
        if (label) label.textContent = state.collapsed ? '展开' : '收起';
      });
    }

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        openDrawer(null);
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        var codes = selectedCodes();
        if (!codes.length) {
          if (typeof showToast === 'function') showToast('请先勾选要删除的模板', 'error');
          return;
        }
        if (!window.confirm('确认删除选中的 ' + codes.length + ' 条费用模板吗？')) return;
        codes.forEach(function (code) {
          delete state.selected[code];
          var idx = -1;
          MOCK_ROWS.forEach(function (row, i) {
            if (row.code === code) idx = i;
          });
          if (idx >= 0) MOCK_ROWS.splice(idx, 1);
        });
        state.page = 1;
        renderTable();
        if (typeof showToast === 'function') showToast('已删除选中模板', 'success');
      });
    }

    if (checkAll) {
      checkAll.addEventListener('change', function () {
        var pageData = pageRows();
        pageData.rows.forEach(function (row) {
          if (checkAll.checked) state.selected[row.code] = true;
          else delete state.selected[row.code];
        });
        renderTable();
      });
    }

    if (tbody) {
      tbody.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.classList.contains('sf-row-check')) return;
        var code = t.getAttribute('data-code');
        if (t.checked) state.selected[code] = true;
        else delete state.selected[code];
        renderTable();
      });
      tbody.addEventListener('click', function (e) {
        var t = e.target;
        if (!t) return;
        var tr = t.closest('tr[data-code]');
        var code = tr ? tr.getAttribute('data-code') : '';
        if (t.classList.contains('js-sf-code')) {
          e.preventDefault();
          var viewRow = findRow(code);
          if (viewRow) openDrawer(viewRow, 'view');
          return;
        }
        if (t.classList.contains('js-sf-edit')) {
          e.preventDefault();
          var editRow = findRow(code);
          if (editRow) openDrawer(editRow, 'edit');
        }
      });
    }

    if (sizeEl) {
      sizeEl.innerHTML = PAGE_SIZE_OPTIONS.map(function (n) {
        return (
          '<option value="' +
          n +
          '"' +
          (n === state.pageSize ? ' selected' : '') +
          '>' +
          n +
          '条/页</option>'
        );
      }).join('');
      sizeEl.addEventListener('change', function () {
        state.pageSize = parseInt(sizeEl.value, 10) || 20;
        state.page = 1;
        renderTable();
      });
    }

    if (pagesEl) {
      pagesEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.sf-page-btn');
        if (!btn || btn.disabled) return;
        var p = parseInt(btn.getAttribute('data-page'), 10);
        if (!p || p === state.page) return;
        state.page = p;
        renderTable();
      });
    }

    function jumpTo() {
      var total = filteredRows().length;
      var totalPages = Math.max(1, Math.ceil(total / state.pageSize) || 1);
      var p = parseInt(jumpEl && jumpEl.value, 10);
      if (!p || p < 1) p = 1;
      if (p > totalPages) p = totalPages;
      state.page = p;
      renderTable();
    }
    if (jumpGo) jumpGo.addEventListener('click', jumpTo);
    if (jumpEl) {
      jumpEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          jumpTo();
        }
      });
    }

    var refreshBtn = $('sfRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        renderTable();
        if (typeof showToast === 'function') showToast('列表已刷新', 'success');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindEvents();
    syncFilterFulfillmentOptions();
    renderTable();
  });
})();
