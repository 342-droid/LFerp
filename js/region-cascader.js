/**
 * 省市区三级联动筛选组件（WMS 公共）
 */
const RegionCascader = {
    SEPARATOR: ' / ',

    REGION_TREE: {
        '辽宁省': {
            '沈阳市': ['市辖区', '和平区', '沈河区', '大东区', '皇姑区', '铁西区', '苏家屯区', '浑南区', '沈北新区', '于洪区', '辽中区', '康平县', '法库县', '新民市'],
            '大连市': ['中山区', '西岗区', '沙河口区', '甘井子区']
        },
        '吉林省': {
            '长春市': ['南关区', '宽城区', '朝阳区', '二道区']
        },
        '黑龙江省': {
            '哈尔滨市': ['道里区', '南岗区', '道外区', '平房区']
        },
        '上海市': { '市辖区': ['闵行区', '浦东新区', '松江区', '嘉定区', '徐汇区', '青浦区'] },
        '江苏省': {
            '南京市': ['江宁区', '鼓楼区', '建邺区', '玄武区'],
            '苏州市': ['工业园区', '姑苏区', '吴中区']
        },
        '浙江省': {
            '杭州市': ['钱塘区', '滨江区', '拱墅区', '余杭区', '萧山区'],
            '宁波市': ['鄞州区', '海曙区', '江北区']
        }
    },

    /**
     * 按已选省市区路径匹配数据项（支持只选省或只选到市）
     * @param {Object} item
     * @param {string} regionFilter
     * @param {{ province?: string, city?: string, district?: string }} [keys]
     */
    matchRegion(item, regionFilter, keys = {}) {
        if (!regionFilter) return true;
        const provinceKey = keys.province || 'province';
        const cityKey = keys.city || 'city';
        const districtKey = keys.district || 'district';
        const parts = regionFilter.split(RegionCascader.SEPARATOR).map(s => s.trim()).filter(Boolean);
        if (parts[0] && item[provinceKey] !== parts[0]) return false;
        if (parts[1] && item[cityKey] !== parts[1]) return false;
        if (parts[2] && item[districtKey] !== parts[2]) return false;
        return true;
    },

    /**
     * @param {Object} options
     * @param {string|HTMLElement} options.mount 挂载容器
     * @param {string} [options.id='regionCascader'] 组件 ID 前缀
     * @param {string} [options.label='省市区:'] 标签文案
     * @param {string} [options.labelWidth='80px'] 标签宽度
     * @param {string} [options.width='280px'] 选择框宽度
     * @param {string} [options.placeholder='请选择'] 占位文案
     * @param {Record<string, Record<string, string[]>>} [options.regionTree] 省市区数据
     * @param {string|HTMLElement} [options.closeOnScrollContainer] 滚动时关闭面板的容器
     * @returns {{ getValue: Function, getParts: Function, setValue: Function, reset: Function, destroy: Function, el: HTMLElement }}
     */
    create(options = {}) {
        const mountEl = typeof options.mount === 'string'
            ? document.querySelector(options.mount)
            : options.mount;
        if (!mountEl) {
            throw new Error('RegionCascader: mount 容器不存在');
        }

        const id = options.id || 'regionCascader';
        const label = options.label ?? '省市区:';
        const labelWidth = options.labelWidth || '80px';
        const width = options.width || '280px';
        const placeholder = options.placeholder || '请选择';
        const regionTree = options.regionTree || RegionCascader.REGION_TREE;
        const inline = !!options.inline;

        const cascaderHtml = `
                <div class="region-cascader" id="${id}Cascader" style="width: ${width};">
                    <div class="region-cascader-trigger" id="${id}Trigger">
                        <span class="region-cascader-value is-placeholder" id="${id}Value">${placeholder}</span>
                        <span class="region-cascader-clear" id="${id}Clear">×</span>
                        <span class="region-cascader-arrow">▼</span>
                    </div>
                    <div class="region-cascader-panel" id="${id}Panel" style="display: none;">
                        <div class="region-cascader-col" id="${id}ColProvince"></div>
                    </div>
                </div>`;

        if (inline) {
            mountEl.innerHTML = `<div class="region-cascader-wrapper" id="${id}Wrapper">${cascaderHtml}</div>`;
        } else {
            mountEl.innerHTML = `
            <div class="form-group region-cascader-wrapper" id="${id}Wrapper">
                <label style="width: ${labelWidth};">${label}</label>
                ${cascaderHtml}
            </div>`;
        }

        const wrapper = document.getElementById(`${id}Wrapper`);
        const cascader = document.getElementById(`${id}Cascader`);
        const trigger = document.getElementById(`${id}Trigger`);
        const valueEl = document.getElementById(`${id}Value`);
        const clearBtn = document.getElementById(`${id}Clear`);
        const panel = document.getElementById(`${id}Panel`);
        const colProvince = document.getElementById(`${id}ColProvince`);
        let colCity = null;
        let colDistrict = null;
        let selected = '';
        let prov = '';
        let city = '';
        let disabled = !!options.disabled;

        function parseSelected() {
            const parts = selected.split(RegionCascader.SEPARATOR).map(s => s.trim()).filter(Boolean);
            prov = parts[0] || '';
            city = parts[1] || '';
        }

        function syncTrigger() {
            if (selected) {
                valueEl.textContent = selected;
                valueEl.classList.remove('is-placeholder');
                cascader.classList.add('has-value');
            } else {
                valueEl.textContent = placeholder;
                valueEl.classList.add('is-placeholder');
                cascader.classList.remove('has-value');
            }
        }

        function removeDistrictColumn() {
            if (colDistrict) {
                colDistrict.remove();
                colDistrict = null;
            }
        }

        function removeCityColumn() {
            removeDistrictColumn();
            if (colCity) {
                colCity.remove();
                colCity = null;
            }
        }

        function ensureCityColumn() {
            if (!colCity) {
                colCity = document.createElement('div');
                colCity.className = 'region-cascader-col';
                colCity.id = `${id}ColCity`;
                panel.appendChild(colCity);
            }
            return colCity;
        }

        function ensureDistrictColumn() {
            if (!colDistrict) {
                colDistrict = document.createElement('div');
                colDistrict.className = 'region-cascader-col';
                colDistrict.id = `${id}ColDistrict`;
                panel.appendChild(colDistrict);
            }
            return colDistrict;
        }

        function createItem(labelText, isActive, hasChildren) {
            const item = document.createElement('div');
            item.className = 'region-cascader-item' + (isActive ? ' is-active' : '');
            const text = document.createElement('span');
            text.textContent = labelText;
            item.appendChild(text);
            if (hasChildren) {
                const arrow = document.createElement('span');
                arrow.className = 'region-cascader-item-arrow';
                arrow.textContent = '›';
                item.appendChild(arrow);
            }
            return item;
        }

        function fillProvinces() {
            colProvince.innerHTML = '';
            Object.keys(regionTree).forEach(p => {
                const item = createItem(p, p === prov, true);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    prov = p;
                    city = '';
                    selected = p;
                    syncTrigger();
                    fillProvinces();
                    removeDistrictColumn();
                    fillCities();
                });
                colProvince.appendChild(item);
            });
        }

        function fillCities() {
            if (!prov || !regionTree[prov]) {
                removeCityColumn();
                return;
            }
            const cityCol = ensureCityColumn();
            cityCol.innerHTML = '';
            Object.keys(regionTree[prov]).forEach(c => {
                const item = createItem(c, c === city, true);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    city = c;
                    selected = `${prov}${RegionCascader.SEPARATOR}${c}`;
                    syncTrigger();
                    fillCities();
                    fillDistricts();
                });
                cityCol.appendChild(item);
            });
        }

        function fillDistricts() {
            if (!prov || !city || !regionTree[prov]?.[city]) {
                removeDistrictColumn();
                return;
            }
            const districtCol = ensureDistrictColumn();
            districtCol.innerHTML = '';
            regionTree[prov][city].forEach(d => {
                const item = createItem(d, false, false);
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selected = `${prov}${RegionCascader.SEPARATOR}${city}${RegionCascader.SEPARATOR}${d}`;
                    syncTrigger();
                    closePanel();
                });
                districtCol.appendChild(item);
            });
        }

        function openPanel() {
            panel.style.display = 'flex';
            wrapper.classList.add('is-open');
            parseSelected();
            fillProvinces();
            if (prov) {
                fillCities();
            } else {
                removeCityColumn();
            }
            if (prov && city) {
                fillDistricts();
            } else {
                removeDistrictColumn();
            }
        }

        function closePanel() {
            panel.style.display = 'none';
            wrapper.classList.remove('is-open');
        }

        function setDisabled(value) {
            disabled = !!value;
            wrapper.classList.toggle('is-disabled', disabled);
            cascader.classList.toggle('is-disabled', disabled);
            if (disabled) {
                closePanel();
            }
        }

        function reset() {
            selected = '';
            prov = '';
            city = '';
            syncTrigger();
            closePanel();
            colProvince.innerHTML = '';
            removeCityColumn();
        }

        function setValue(value) {
            selected = (value || '').trim();
            parseSelected();
            syncTrigger();
        }

        function getParts() {
            const parts = selected.split(RegionCascader.SEPARATOR).map(s => s.trim()).filter(Boolean);
            return {
                province: parts[0] || '',
                city: parts[1] || '',
                district: parts[2] || ''
            };
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (disabled) return;
            if (panel.style.display === 'none') {
                openPanel();
            } else {
                closePanel();
            }
        });

        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (disabled) return;
            reset();
        });

        const onDocumentClick = (e) => {
            if (!cascader.contains(e.target)) {
                closePanel();
            }
        };
        document.addEventListener('click', onDocumentClick);

        let scrollContainer = null;
        let onScrollClose = null;
        if (options.closeOnScrollContainer) {
            scrollContainer = typeof options.closeOnScrollContainer === 'string'
                ? document.querySelector(options.closeOnScrollContainer)
                : options.closeOnScrollContainer;
            if (scrollContainer) {
                onScrollClose = () => closePanel();
                scrollContainer.addEventListener('scroll', onScrollClose);
            }
        }

        setDisabled(disabled);

        return {
            el: wrapper,
            getValue: () => selected,
            getParts,
            setValue,
            reset,
            setDisabled,
            isDisabled: () => disabled,
            destroy() {
                document.removeEventListener('click', onDocumentClick);
                if (scrollContainer && onScrollClose) {
                    scrollContainer.removeEventListener('scroll', onScrollClose);
                }
                mountEl.innerHTML = '';
            }
        };
    },

    _modalInstances: {},
    _modalReadOnly: { add: false, edit: false },

    setModalAddressReadOnly(mode, readOnly) {
        RegionCascader._modalReadOnly[mode] = !!readOnly;
        RegionCascader._modalInstances[mode]?.setDisabled(!!readOnly);
    },

    buildModalRegionMountHtml(mountId, labelWidth = '100px') {
        return `
            <div class="modal-form-group region-cascader-form-group">
                <label style="width: ${labelWidth};">省市区:</label>
                <div id="${mountId}" class="region-cascader-modal-mount"></div>
            </div>`;
    },

    buildPageManagerAddressFields(options = {}) {
        const labelWidth = options.labelWidth || '100px';
        return [
            {
                id: 'regionField',
                type: 'raw',
                content: RegionCascader.buildModalRegionMountHtml('regionMount', labelWidth),
                editHtml: RegionCascader.buildModalRegionMountHtml('editRegionMount', labelWidth)
            },
            {
                id: 'detailAddress',
                label: '详细地址',
                type: 'text',
                labelWidth,
                editDisabled: options.editDisabled || false,
                disabled: options.disabled || false
            }
        ];
    },

    initModalAddress(mode = 'add', options = {}) {
        const isEdit = mode === 'edit';
        const mountId = isEdit ? 'editRegionMount' : 'regionMount';
        const idPrefix = isEdit ? 'editRegion' : 'region';
        const mountEl = document.getElementById(mountId);
        if (!mountEl) return null;

        if (RegionCascader._modalInstances[mode]) {
            RegionCascader._modalInstances[mode].destroy();
        }

        mountEl.innerHTML = '';
        const holder = document.createElement('div');
        mountEl.appendChild(holder);

        const instance = RegionCascader.create({
            mount: holder,
            id: idPrefix,
            inline: true,
            width: '100%',
            disabled: RegionCascader._modalReadOnly[mode],
            closeOnScrollContainer: options.closeOnScrollContainer
        });
        RegionCascader._modalInstances[mode] = instance;
        return instance;
    },

    getModalAddress(mode = 'add') {
        const instance = RegionCascader._modalInstances[mode];
        const parts = instance ? instance.getParts() : { province: '', city: '', district: '' };
        const detailId = mode === 'edit' ? 'editDetailAddress' : 'detailAddress';
        const detailEl = document.getElementById(detailId);
        return {
            province: parts.province || '',
            city: parts.city || '',
            district: parts.district || '',
            detailAddress: detailEl ? detailEl.value.trim() : ''
        };
    },

    setModalAddress(mode, data = {}) {
        if (!RegionCascader._modalInstances[mode]) {
            RegionCascader.initModalAddress(mode);
        }
        const regionParts = [data.province, data.city, data.district].filter(Boolean);
        RegionCascader._modalInstances[mode]?.setValue(regionParts.join(RegionCascader.SEPARATOR));
        const detailId = mode === 'edit' ? 'editDetailAddress' : 'detailAddress';
        const detailEl = document.getElementById(detailId);
        if (detailEl) {
            detailEl.value = data.detailAddress || '';
        }
    },

    resetModalAddress(mode = 'add') {
        RegionCascader._modalInstances[mode]?.reset();
        const detailId = mode === 'edit' ? 'editDetailAddress' : 'detailAddress';
        const detailEl = document.getElementById(detailId);
        if (detailEl) {
            detailEl.value = '';
        }
    },

    tableCells(data) {
        const empty = (value) => (!value || value === '-') ? '-' : value;
        return [
            empty(data.province),
            empty(data.city),
            empty(data.district),
            empty(data.detailAddress)
        ];
    },

    readRowAddressCells(cells, startIndex = 5) {
        const pick = (index) => {
            const text = cells[index]?.textContent.trim();
            return !text || text === '-' ? '' : text;
        };
        return {
            province: pick(startIndex),
            city: pick(startIndex + 1),
            district: pick(startIndex + 2),
            detailAddress: pick(startIndex + 3)
        };
    },

    resolveDetailAddress(item) {
        if (item.detailAddress) return item.detailAddress;
        if (!item.address) return '';
        let rest = item.address;
        [item.province, item.city, item.district].forEach((part) => {
            if (part) rest = rest.replace(part, '');
        });
        return rest.trim() || item.address;
    },

    formatRegionText(data) {
        return [data.province, data.city, data.district].filter(Boolean).join(RegionCascader.SEPARATOR);
    }
};

window.RegionCascader = RegionCascader;
