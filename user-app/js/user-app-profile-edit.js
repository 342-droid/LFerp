/**
 * 用户 APP — 会员资料编辑
 */
(function () {
  var WHEEL_ITEM_H = 36;
  var BIRTH_YEAR_START = 1940;

  /** 省市区演示数据（与售后地址选择器同源精简） */
  var REGION_TREE = {
    北京市: { 北京市: ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '通州区', '昌平区'] },
    天津市: { 天津市: ['和平区', '河东区', '河西区', '南开区', '河北区'] },
    河北省: {
      石家庄市: ['长安区', '桥西区', '新华区', '裕华区'],
      唐山市: ['路南区', '路北区', '丰南区']
    },
    山西省: { 太原市: ['小店区', '迎泽区', '杏花岭区'] },
    辽宁省: {
      沈阳市: ['和平区', '沈河区', '大东区', '铁西区'],
      大连市: ['中山区', '西岗区', '沙河口区', '甘井子区']
    },
    上海: { 上海市: ['黄浦区', '徐汇区', '长宁区', '静安区', '浦东新区', '闵行区'] },
    江苏省: {
      南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区', '栖霞区', '雨花台区', '江宁区', '浦口区'],
      无锡市: ['锡山区', '惠山区', '滨湖区', '梁溪区'],
      苏州市: ['姑苏区', '虎丘区', '吴中区', '相城区', '工业园区'],
      常州市: ['天宁区', '钟楼区', '新北区', '武进区']
    },
    浙江省: {
      杭州市: ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区'],
      宁波市: ['海曙区', '江北区', '鄞州区', '镇海区'],
      温州市: ['鹿城区', '龙湾区', '瓯海区']
    },
    安徽省: {
      合肥市: ['瑶海区', '庐阳区', '蜀山区', '包河区'],
      芜湖市: ['镜湖区', '弋江区', '鸠江区']
    },
    福建省: {
      福州市: ['鼓楼区', '台江区', '仓山区', '晋安区'],
      厦门市: ['思明区', '湖里区', '集美区', '海沧区']
    },
    山东省: {
      济南市: ['历下区', '市中区', '槐荫区', '历城区'],
      青岛市: ['市南区', '市北区', '崂山区', '黄岛区']
    },
    河南省: { 郑州市: ['中原区', '二七区', '金水区', '惠济区'] },
    湖北省: { 武汉市: ['江岸区', '江汉区', '硚口区', '武昌区', '洪山区'] },
    湖南省: { 长沙市: ['芙蓉区', '天心区', '岳麓区', '开福区'] },
    广东省: {
      广州市: ['越秀区', '荔湾区', '海珠区', '天河区', '白云区', '番禺区'],
      深圳市: ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区'],
      佛山市: ['禅城区', '南海区', '顺德区']
    },
    四川省: { 成都市: ['锦江区', '青羊区', '金牛区', '武侯区', '成华区'] },
    重庆市: { 重庆市: ['渝中区', '江北区', '南岸区', '渝北区', '沙坪坝区'] },
    陕西省: { 西安市: ['新城区', '碑林区', '雁塔区', '未央区'] }
  };

  var regionState = {
    province: '江苏省',
    city: '南京市',
    district: '鼓楼区'
  };

  var birthdayState = {
    year: 1992,
    month: 8,
    day: 16
  };

  function toast(msg) {
    var el = document.getElementById('peToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.hidden = true;
    }, 1600);
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function maxBirthYear() {
    return new Date().getFullYear();
  }

  function getYearList() {
    var max = maxBirthYear();
    var list = [];
    for (var y = max; y >= BIRTH_YEAR_START; y--) list.push(String(y));
    return list;
  }

  function getMonthList() {
    var list = [];
    for (var m = 1; m <= 12; m++) list.push(pad2(m));
    return list;
  }

  function getDayList(year, month) {
    var max = daysInMonth(year, month);
    var list = [];
    for (var d = 1; d <= max; d++) list.push(pad2(d));
    return list;
  }

  function formatBirthdayISO(year, month, day) {
    return year + '-' + pad2(month) + '-' + pad2(day);
  }

  function formatBirthdayLabel(year, month, day) {
    return year + '年' + pad2(month) + '月' + pad2(day) + '日';
  }

  function parseBirthday(value) {
    var m = String(value || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!m) return null;
    var year = Number(m[1]);
    var month = Number(m[2]);
    var day = Number(m[3]);
    if (!year || month < 1 || month > 12 || day < 1) return null;
    var maxDay = daysInMonth(year, month);
    if (day > maxDay) day = maxDay;
    return { year: year, month: month, day: day };
  }

  function setBirthdayDisplay(iso) {
    var hidden = document.getElementById('peBirthday');
    var text = document.getElementById('peBirthdayText');
    if (hidden) hidden.value = iso || '';
    if (!text) return;
    if (iso) {
      var parsed = parseBirthday(iso);
      text.textContent = parsed
        ? formatBirthdayLabel(parsed.year, parsed.month, parsed.day)
        : iso;
      text.classList.remove('ua-pe-value--placeholder');
    } else {
      text.textContent = '请选择生日';
      text.classList.add('ua-pe-value--placeholder');
    }
  }

  function getProvinces() {
    return Object.keys(REGION_TREE);
  }

  function getCities(province) {
    var node = REGION_TREE[province];
    return node ? Object.keys(node) : [];
  }

  function getDistricts(province, city) {
    var node = REGION_TREE[province];
    return node && city && node[city] ? node[city].slice() : [];
  }

  function formatRegion(province, city, district) {
    return [province, city, district].filter(Boolean).join(' · ');
  }

  function parseRegion(text) {
    var parts = String(text || '')
      .split(/[·\s]+/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    if (parts.length >= 3) {
      return { province: parts[0], city: parts[1], district: parts[2] };
    }
    if (parts.length === 1) {
      var only = parts[0];
      var found = null;
      getProvinces().some(function (p) {
        return getCities(p).some(function (c) {
          if (getDistricts(p, c).indexOf(only) >= 0) {
            found = { province: p, city: c, district: only };
            return true;
          }
          return false;
        });
      });
      return found;
    }
    return null;
  }

  function setGenderDisplay(gender) {
    var value = window.UAProfile && window.UAProfile.normalizeGender
      ? window.UAProfile.normalizeGender(gender)
      : (gender || '保密');
    var hidden = document.getElementById('peGender');
    var text = document.getElementById('peGenderText');
    if (hidden) hidden.value = value;
    if (text) {
      text.textContent = value;
      text.classList.remove('ua-pe-value--placeholder');
    }
  }

  function fillForm(profile) {
    var nick = document.getElementById('peNickname');
    var phoneHidden = document.getElementById('pePhone');
    var phoneText = document.getElementById('pePhoneText');
    var districtHidden = document.getElementById('peDistrict');
    var districtText = document.getElementById('peDistrictText');
    var avatar = document.getElementById('peAvatarImg');

    if (nick) nick.value = profile.nickname || '';
    var phone = profile.displayPhone || '';
    if (phoneHidden) phoneHidden.value = phone;
    if (phoneText) phoneText.textContent = phone || '—';
    if (avatar && profile.avatar) avatar.src = profile.avatar;

    setGenderDisplay(profile.gender || '保密');

    setBirthdayDisplay(profile.birthday || '');
    var birthParsed = parseBirthday(profile.birthday || '');
    if (birthParsed) {
      birthdayState.year = birthParsed.year;
      birthdayState.month = birthParsed.month;
      birthdayState.day = birthParsed.day;
    }

    var district = profile.district || '';
    if (districtHidden) districtHidden.value = district;
    if (districtText) {
      if (district) {
        districtText.textContent = district;
        districtText.classList.remove('ua-pe-value--placeholder');
      } else {
        districtText.textContent = '请选择所在城区';
        districtText.classList.add('ua-pe-value--placeholder');
      }
    }

    var parsed = parseRegion(district);
    if (parsed) {
      regionState.province = parsed.province;
      regionState.city = parsed.city;
      regionState.district = parsed.district;
    }
  }

  function readForm() {
    return {
      nickname: ((document.getElementById('peNickname') || {}).value || '').trim(),
      displayPhone: ((document.getElementById('pePhone') || {}).value || '').trim(),
      gender: ((document.getElementById('peGender') || {}).value || '').trim() || '保密',
      birthday: ((document.getElementById('peBirthday') || {}).value || '').trim(),
      district: ((document.getElementById('peDistrict') || {}).value || '').trim(),
      avatar: (document.getElementById('peAvatarImg') || {}).src || ''
    };
  }

  function validate(data) {
    if (!data.nickname) return '请填写昵称';
    if (data.nickname.length > 20) return '昵称最多 20 个字';
    return '';
  }

  function bindAvatar() {
    var btn = document.getElementById('peAvatarBtn');
    var input = document.getElementById('peAvatarInput');
    var img = document.getElementById('peAvatarImg');
    if (!btn || !input || !img) return;

    btn.addEventListener('click', function () {
      input.click();
    });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        toast('请选择图片文件');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        img.src = String(reader.result || '');
        toast('头像已更新，记得保存');
      };
      reader.readAsDataURL(file);
    });
  }

  function renderWheelColumn(wheelEl, items, selected, onSelect, labelFn) {
    if (!wheelEl) return;
    var html = '<div class="ua-pe-region-wheel__pad"></div>';
    items.forEach(function (item) {
      var label = typeof labelFn === 'function' ? labelFn(item) : item;
      html +=
        '<div class="ua-pe-region-wheel__item' +
        (item === selected ? ' is-selected' : '') +
        '" data-value="' +
        String(item).replace(/"/g, '&quot;') +
        '">' +
        label +
        '</div>';
    });
    html += '<div class="ua-pe-region-wheel__pad"></div>';
    wheelEl.innerHTML = html;
    wheelEl._regionItems = items.slice();
    wheelEl._regionOnSelect = onSelect;
    var idx = Math.max(0, items.indexOf(selected));
    requestAnimationFrame(function () {
      wheelEl.scrollTop = idx * WHEEL_ITEM_H;
    });
  }

  function readWheelIndex(wheelEl) {
    var items = wheelEl._regionItems || [];
    if (!items.length) return 0;
    var idx = Math.round(wheelEl.scrollTop / WHEEL_ITEM_H);
    if (idx < 0) idx = 0;
    if (idx > items.length - 1) idx = items.length - 1;
    return idx;
  }

  function applyWheelSelection(wheelEl, snap) {
    var items = wheelEl._regionItems || [];
    if (!items.length) return;
    var idx = readWheelIndex(wheelEl);
    if (snap) wheelEl.scrollTop = idx * WHEEL_ITEM_H;
    wheelEl.querySelectorAll('.ua-pe-region-wheel__item').forEach(function (itemEl, i) {
      itemEl.classList.toggle('is-selected', i === idx);
    });
    if (typeof wheelEl._regionOnSelect === 'function') {
      wheelEl._regionOnSelect(items[idx], idx);
    }
  }

  function bindWheel(wheelEl) {
    if (!wheelEl || wheelEl._regionBound) return;
    wheelEl._regionBound = true;
    wheelEl.addEventListener('scroll', function () {
      var idx = readWheelIndex(wheelEl);
      wheelEl.querySelectorAll('.ua-pe-region-wheel__item').forEach(function (itemEl, i) {
        itemEl.classList.toggle('is-selected', i === idx);
      });
      window.clearTimeout(wheelEl._regionTimer);
      wheelEl._regionTimer = window.setTimeout(function () {
        applyWheelSelection(wheelEl, true);
      }, 80);
    });
    wheelEl.addEventListener('click', function (e) {
      var itemEl = e.target.closest('.ua-pe-region-wheel__item');
      if (!itemEl || !wheelEl.contains(itemEl)) return;
      var items = wheelEl._regionItems || [];
      var value = itemEl.getAttribute('data-value');
      var idx = items.indexOf(value);
      if (idx < 0) return;
      wheelEl.scrollTop = idx * WHEEL_ITEM_H;
      applyWheelSelection(wheelEl, true);
    });
  }

  function clampBirthdayDay() {
    var max = daysInMonth(birthdayState.year, birthdayState.month);
    if (birthdayState.day > max) birthdayState.day = max;
  }

  function renderBirthdayWheels() {
    var yearWheel = document.getElementById('peYearWheel');
    var monthWheel = document.getElementById('peMonthWheel');
    var dayWheel = document.getElementById('peDayWheel');
    [yearWheel, monthWheel, dayWheel].forEach(function (el) {
      if (el && el._regionTimer) window.clearTimeout(el._regionTimer);
    });

    var years = getYearList();
    var yearStr = String(birthdayState.year);
    if (years.indexOf(yearStr) < 0) {
      birthdayState.year = Number(years[0] || maxBirthYear());
      yearStr = String(birthdayState.year);
    }
    var months = getMonthList();
    var monthStr = pad2(birthdayState.month);
    if (months.indexOf(monthStr) < 0) {
      birthdayState.month = 1;
      monthStr = '01';
    }
    clampBirthdayDay();
    var days = getDayList(birthdayState.year, birthdayState.month);
    var dayStr = pad2(birthdayState.day);

    renderWheelColumn(
      yearWheel,
      years,
      yearStr,
      function (value) {
        var next = Number(value);
        if (next === birthdayState.year) return;
        birthdayState.year = next;
        clampBirthdayDay();
        renderBirthdayWheels();
      },
      function (v) {
        return v + '年';
      }
    );
    renderWheelColumn(
      monthWheel,
      months,
      monthStr,
      function (value) {
        var next = Number(value);
        if (next === birthdayState.month) return;
        birthdayState.month = next;
        clampBirthdayDay();
        renderBirthdayWheels();
      },
      function (v) {
        return Number(v) + '月';
      }
    );
    renderWheelColumn(
      dayWheel,
      days,
      dayStr,
      function (value) {
        birthdayState.day = Number(value);
      },
      function (v) {
        return Number(v) + '日';
      }
    );

    bindWheel(yearWheel);
    bindWheel(monthWheel);
    bindWheel(dayWheel);
  }

  function openBirthdaySheet() {
    var sheet = document.getElementById('peBirthdaySheet');
    if (!sheet) return;
    var current = ((document.getElementById('peBirthday') || {}).value || '').trim();
    var parsed = parseBirthday(current);
    if (parsed) {
      birthdayState.year = parsed.year;
      birthdayState.month = parsed.month;
      birthdayState.day = parsed.day;
    } else {
      birthdayState.year = 1992;
      birthdayState.month = 8;
      birthdayState.day = 16;
    }
    sheet.hidden = false;
    renderBirthdayWheels();
  }

  function closeBirthdaySheet() {
    var sheet = document.getElementById('peBirthdaySheet');
    if (sheet) sheet.hidden = true;
  }

  function confirmBirthday() {
    clampBirthdayDay();
    setBirthdayDisplay(
      formatBirthdayISO(birthdayState.year, birthdayState.month, birthdayState.day)
    );
    closeBirthdaySheet();
  }

  function openGenderSheet() {
    var sheet = document.getElementById('peGenderSheet');
    if (!sheet) return;
    var current = ((document.getElementById('peGender') || {}).value || '保密').trim();
    sheet.querySelectorAll('[data-gender]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-gender') === current);
    });
    sheet.hidden = false;
  }

  function closeGenderSheet() {
    var sheet = document.getElementById('peGenderSheet');
    if (sheet) sheet.hidden = true;
  }

  function bindGender() {
    var btn = document.getElementById('peGenderBtn');
    var sheet = document.getElementById('peGenderSheet');
    if (btn) btn.addEventListener('click', openGenderSheet);
    if (!sheet) return;
    sheet.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-pe-gender-close]')) {
        closeGenderSheet();
        return;
      }
      var opt = ev.target.closest('[data-gender]');
      if (!opt) return;
      setGenderDisplay(opt.getAttribute('data-gender'));
      closeGenderSheet();
    });
  }

  function bindBirthday() {
    var btn = document.getElementById('peBirthdayBtn');
    var sheet = document.getElementById('peBirthdaySheet');
    var confirmBtn = document.getElementById('peBirthdayConfirm');
    if (btn) btn.addEventListener('click', openBirthdaySheet);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmBirthday);
    if (sheet) {
      sheet.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-pe-birthday-close]')) closeBirthdaySheet();
      });
    }
  }

  function renderRegionWheels() {
    var provWheel = document.getElementById('peProvWheel');
    var cityWheel = document.getElementById('peCityWheel');
    var distWheel = document.getElementById('peDistWheel');
    [provWheel, cityWheel, distWheel].forEach(function (el) {
      if (el && el._regionTimer) window.clearTimeout(el._regionTimer);
    });

    var provinces = getProvinces();
    if (provinces.indexOf(regionState.province) < 0) regionState.province = provinces[0] || '';
    var cities = getCities(regionState.province);
    if (cities.indexOf(regionState.city) < 0) regionState.city = cities[0] || '';
    var districts = getDistricts(regionState.province, regionState.city);
    if (districts.indexOf(regionState.district) < 0) regionState.district = districts[0] || '';

    renderWheelColumn(provWheel, provinces, regionState.province, function (value) {
      if (value === regionState.province) return;
      regionState.province = value;
      var nextCities = getCities(value);
      regionState.city = nextCities[0] || '';
      var nextDists = getDistricts(value, regionState.city);
      regionState.district = nextDists[0] || '';
      renderRegionWheels();
    });
    renderWheelColumn(cityWheel, cities, regionState.city, function (value) {
      if (value === regionState.city) return;
      regionState.city = value;
      var nextDists = getDistricts(regionState.province, value);
      regionState.district = nextDists[0] || '';
      renderRegionWheels();
    });
    renderWheelColumn(distWheel, districts, regionState.district, function (value) {
      regionState.district = value;
    });

    bindWheel(provWheel);
    bindWheel(cityWheel);
    bindWheel(distWheel);
  }

  function openRegionSheet() {
    var sheet = document.getElementById('peRegionSheet');
    if (!sheet) return;
    var current = ((document.getElementById('peDistrict') || {}).value || '').trim();
    var parsed = parseRegion(current);
    if (parsed) {
      regionState.province = parsed.province;
      regionState.city = parsed.city;
      regionState.district = parsed.district;
    }
    sheet.hidden = false;
    renderRegionWheels();
  }

  function closeRegionSheet() {
    var sheet = document.getElementById('peRegionSheet');
    if (sheet) sheet.hidden = true;
  }

  function confirmRegion() {
    var label = formatRegion(regionState.province, regionState.city, regionState.district);
    var hidden = document.getElementById('peDistrict');
    var text = document.getElementById('peDistrictText');
    if (hidden) hidden.value = label;
    if (text) {
      text.textContent = label;
      text.classList.remove('ua-pe-value--placeholder');
    }
    closeRegionSheet();
  }

  function bindRegion() {
    var btn = document.getElementById('peDistrictBtn');
    var sheet = document.getElementById('peRegionSheet');
    var confirmBtn = document.getElementById('peRegionConfirm');
    if (btn) btn.addEventListener('click', openRegionSheet);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmRegion);
    if (sheet) {
      sheet.addEventListener('click', function (ev) {
        if (ev.target.closest('[data-pe-region-close]')) closeRegionSheet();
      });
    }
  }

  function init() {
    function bindBack() {
      if (window.UaNav) {
        window.UaNav.applyBackLink('.ua-pe-nav__back', 'profile.html');
      } else {
        var backEl = document.querySelector('.ua-pe-nav__back');
        if (!backEl) return;
        try {
          var params = new URLSearchParams(window.location.search || '');
          var from = params.get('from') || params.get('back') || '';
          if (from && /^[a-z0-9][a-z0-9._-]*\.html(?:\?[^#]*)?(?:#.*)?$/i.test(from)) {
            backEl.setAttribute('href', from);
          }
        } catch (e) { /* ignore */ }
      }
    }

    if (document.readyState === 'loading') {
      /* applyBackLink 尽早执行，避免用户很快点返回仍是默认 profile.html */
    }
    bindBack();

    if (!window.UAProfile) return;
    var profile = window.UAProfile.load();
    fillForm(profile);
    bindAvatar();
    bindGender();
    bindBirthday();
    bindRegion();

    var saveBtn = document.getElementById('peSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var data = readForm();
        var err = validate(data);
        if (err) {
          toast(err);
          return;
        }
        if (!data.avatar) data.avatar = window.UAProfile.DEFAULT_PROFILE.avatar;
        window.UAProfile.save(data);
        toast('资料已保存');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
