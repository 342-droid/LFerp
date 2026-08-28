/**
 * 省市区三级联动下拉（门店/供应商收货地址等共用）
 */
(function () {
    var REGION_TREE = {
        北京市: { 市辖区: ['东城区', '西城区', '朝阳区', '海淀区'] },
        天津市: { 市辖区: ['河东区', '河西区', '和平区'] },
        河北省: { 石家庄市: ['长安区', '桥西区'], 唐山市: ['路北区', '路南区'] },
        山西省: { 太原市: ['小店区', '迎泽区'] },
        内蒙古自治区: { 呼和浩特市: ['新城区', '回民区'] },
        辽宁省: { 沈阳市: ['和平区', '沈河区'], 大连市: ['中山区', '西岗区'] },
        上海市: { 市辖区: ['浦东新区', '黄浦区', '静安区', '杨浦区'] },
        江苏省: { 苏州市: ['工业园区', '姑苏区'], 南京市: ['鼓楼区', '玄武区', '江宁区'] },
        浙江省: {
            杭州市: ['余杭区', '西湖区', '上城区', '拱墅区', '滨江区', '萧山区'],
            宁波市: ['鄞州区', '海曙区'],
            嘉兴市: ['南湖区', '秀洲区']
        },
        广东省: { 深圳市: ['罗湖区', '南山区'], 广州市: ['天河区', '越秀区'] },
        云南省: { 昭通市: ['昭阳区', '鲁甸县'], 昆明市: ['五华区', '盘龙区'] }
    };

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null && text !== '') n.textContent = text;
        return n;
    }

    function normalizePath(path) {
        return String(path || '')
            .replace(/\//g, ' / ')
            .replace(/\s*\/\s*/g, ' / ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * @param {HTMLElement} mountInside
     * @param {string} [initialPath]
     * @param {{ disabled?: boolean }} [opts]
     */
    function create(mountInside, initialPath, opts) {
        opts = opts || {};
        var disabled = !!opts.disabled;
        var wrap = el('div', 'store-region');
        var trigger = el('button', 'store-region__trigger erp-input');
        trigger.type = 'button';
        var placeholder = '请选择省市区';
        var selected = normalizePath(initialPath);
        if (selected === '—') selected = '';

        function syncTrigger() {
            trigger.textContent = selected || placeholder;
            trigger.classList.toggle('is-placeholder', !selected);
            trigger.disabled = disabled;
            wrap.classList.toggle('store-region--disabled', disabled);
        }
        syncTrigger();

        var panel = el('div', 'store-region__panel');
        panel.style.display = 'none';
        var colP = el('div', 'store-region__col');
        var colC = el('div', 'store-region__col');
        var colD = el('div', 'store-region__col');
        var prov = '';
        var city = '';

        function fillProvinces() {
            colP.innerHTML = '';
            Object.keys(REGION_TREE).forEach(function (p) {
                var item = el('div', 'store-region__item', p);
                if (p === prov) item.classList.add('is-active');
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    prov = p;
                    city = '';
                    fillProvinces();
                    fillCities();
                    colD.innerHTML = '';
                });
                colP.appendChild(item);
            });
        }

        function fillCities() {
            colC.innerHTML = '';
            if (!prov || !REGION_TREE[prov]) return;
            Object.keys(REGION_TREE[prov]).forEach(function (c) {
                var item = el('div', 'store-region__item', c);
                if (c === city) item.classList.add('is-active');
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    city = c;
                    fillCities();
                    fillDistricts();
                });
                colC.appendChild(item);
            });
        }

        function fillDistricts() {
            colD.innerHTML = '';
            if (!prov || !city || !REGION_TREE[prov] || !REGION_TREE[prov][city]) return;
            REGION_TREE[prov][city].forEach(function (d) {
                var item = el('div', 'store-region__item', d);
                item.addEventListener('click', function (e) {
                    e.stopPropagation();
                    selected = prov + ' / ' + city + ' / ' + d;
                    syncTrigger();
                    panel.style.display = 'none';
                });
                colD.appendChild(item);
            });
        }

        function parseSelected() {
            var parts = selected.split(' / ').map(function (s) {
                return s.trim();
            }).filter(Boolean);
            if (parts[0] && REGION_TREE[parts[0]]) {
                prov = parts[0];
                if (parts[1] && REGION_TREE[prov][parts[1]]) {
                    city = parts[1];
                }
            }
        }

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            if (disabled) return;
            var open = panel.style.display === 'none';
            panel.style.display = open ? 'flex' : 'none';
            if (open) {
                parseSelected();
                if (!prov) prov = Object.keys(REGION_TREE)[0];
                fillProvinces();
                fillCities();
                fillDistricts();
            }
        });

        panel.appendChild(colP);
        panel.appendChild(colC);
        panel.appendChild(colD);
        wrap.appendChild(trigger);
        wrap.appendChild(panel);

        function closeOnDoc(ev) {
            if (!wrap.contains(ev.target)) panel.style.display = 'none';
        }
        if (mountInside && mountInside.addEventListener) {
            mountInside.addEventListener('scroll', function () {
                panel.style.display = 'none';
            });
        }
        setTimeout(function () {
            document.addEventListener('click', closeOnDoc);
        }, 0);

        return {
            wrap: wrap,
            getValue: function () {
                return selected;
            },
            setValue: function (v) {
                selected = normalizePath(v);
                if (selected === '—') selected = '';
                syncTrigger();
            },
            setDisabled: function (on) {
                disabled = !!on;
                syncTrigger();
                if (disabled) panel.style.display = 'none';
            },
            destroy: function () {
                document.removeEventListener('click', closeOnDoc);
            }
        };
    }

    window.MdmStoreRegionCascader = {
        REGION_TREE: REGION_TREE,
        create: create
    };
})();
