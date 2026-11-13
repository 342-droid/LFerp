/**
 * 贸易商档案共享数据（所有主体「新增贸易商商家」成功后写入，贸易商档案页读取）
 */
(function () {
    var STORAGE_KEY = 'mdm_trader_archive_v1';
    var DEFAULT_OPERATOR = '当前用户';

    function nowText() {
        var d = new Date();
        function pad(n) {
            return n < 10 ? '0' + n : String(n);
        }
        return (
            d.getFullYear() +
            '-' +
            pad(d.getMonth() + 1) +
            '-' +
            pad(d.getDate()) +
            ' ' +
            pad(d.getHours()) +
            ':' +
            pad(d.getMinutes()) +
            ':' +
            pad(d.getSeconds())
        );
    }

    function readList() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var list = raw ? JSON.parse(raw) : null;
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function writeList(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    }

    function normalize(item) {
        var row = Object.assign({}, item || {});
        var createdAt = row.createdAt || nowText();
        row.createdBy = row.createdBy || '系统';
        row.createdAt = createdAt;
        row.updatedBy = row.updatedBy || row.createdBy || '系统';
        row.updatedAt = row.updatedAt || createdAt;
        row.subjectType = row.subjectType === '服务商' ? '服务商' : '贸易商';
        return row;
    }

    function seed() {
        return [
            {
                id: 'TRD20190001',
                subjectId: 'TRD-SUB-001',
                subjectName: '杭州鲜达贸易有限公司',
                subjectType: '贸易商',
                name: '杭州鲜达贸易有限公司',
                shortName: '鲜达贸易',
                region: '浙江省/杭州市/西湖区',
                detailAddr: '文三路100号',
                licenseType: '商业保理公司',
                bizScope: '保理',
                contact: '周宁',
                phone: '138****1001',
                onboardStatus: '进件成功',
                status: '正常',
                license: {
                    name: '杭州鲜达贸易有限公司',
                    creditCode: '91330106MA2H7K8X1A',
                    type: '有限责任公司（自然人投资或控股）',
                    legal: '周宁',
                    capital: '500万元人民币',
                    founded: '2021-06-18',
                    address: '浙江省杭州市西湖区文三路100号',
                    scope: '商业保理',
                    image: '已上传'
                },
                permit: {
                    no: 'JY13301061234567',
                    name: '杭州鲜达贸易有限公司',
                    legal: '周宁',
                    place: '浙江省杭州市西湖区文三路100号',
                    mode: '商业保理',
                    items: '应收账款保理',
                    expire: '2029-06-17',
                    image: '已上传'
                },
                createdBy: '系统',
                createdAt: '2026-11-08 10:20:01',
                updatedBy: '周宁',
                updatedAt: '2026-11-09 14:08:22'
            },
            {
                id: 'TRD20190002',
                subjectId: 'TRD-SUB-002',
                subjectName: '上海冷链融资租赁有限公司',
                subjectType: '贸易商',
                name: '上海冷链融资租赁有限公司',
                shortName: '冷链租赁',
                region: '上海市/浦东新区',
                detailAddr: '张杨路188号',
                licenseType: '融资租赁公司',
                bizScope: '融资租赁',
                contact: '李航',
                phone: '138****1002',
                onboardStatus: '进件中',
                status: '正常',
                license: {
                    name: '上海冷链融资租赁有限公司',
                    creditCode: '91310115MA1K2N3P4Q',
                    type: '有限责任公司',
                    legal: '李航',
                    capital: '1000万元人民币',
                    founded: '2019-03-12',
                    address: '上海市浦东新区张杨路188号',
                    scope: '融资租赁业务',
                    image: '已上传'
                },
                permit: {
                    no: 'JY13101159876543',
                    name: '上海冷链融资租赁有限公司',
                    legal: '李航',
                    place: '上海市浦东新区张杨路188号',
                    mode: '融资租赁',
                    items: '融资租赁及相关咨询',
                    expire: '2028-12-31',
                    image: '已上传'
                },
                createdBy: '系统',
                createdAt: '2026-11-07 15:11:09',
                updatedBy: '系统',
                updatedAt: '2026-11-07 15:11:09'
            },
            {
                id: 'TRD20190003',
                subjectId: 'TRD-SUB-003',
                subjectName: '宁波海丰商业保理有限公司',
                subjectType: '服务商',
                name: '宁波海丰商业保理有限公司',
                shortName: '海丰保理',
                region: '浙江省/宁波市/鄞州区',
                detailAddr: '中山东路666号',
                licenseType: '持牌金融机构',
                bizScope: '其他',
                contact: '陈可',
                phone: '138****1003',
                onboardStatus: '未进件',
                status: '正常',
                license: {
                    name: '宁波海丰商业保理有限公司',
                    creditCode: '91330212MA2XXXXX1B',
                    type: '有限责任公司',
                    legal: '陈可',
                    capital: '800万元人民币',
                    founded: '2020-08-08',
                    address: '浙江省宁波市鄞州区中山东路666号',
                    scope: '商业保理',
                    image: ''
                },
                permit: {
                    no: '',
                    name: '',
                    legal: '',
                    place: '',
                    mode: '',
                    items: '',
                    expire: '',
                    image: ''
                },
                createdBy: '系统',
                createdAt: '2026-11-06 09:45:33',
                updatedBy: '系统',
                updatedAt: '2026-11-06 09:45:33'
            }
        ].map(normalize);
    }

    function ensureSeed() {
        var list = readList();
        var changed = false;
        if (!list || !list.length) {
            list = seed();
            changed = true;
        } else {
            var seedById = {};
            seed().forEach(function (item) {
                seedById[item.id] = item;
            });
            list = list.map(function (item) {
                var hadType = !!(item && String(item.subjectType || '').trim());
                var before = JSON.stringify(item);
                var after = normalize(item);
                var base = seedById[after.id];
                if (base) {
                    if (!after.bizScope) after.bizScope = base.bizScope;
                    if (!after.license || !after.license.name) after.license = base.license;
                    if (!after.permit || !after.permit.no) after.permit = base.permit;
                    if (!hadType && base.subjectType) after.subjectType = base.subjectType;
                }
                if (JSON.stringify(after) !== before) changed = true;
                return after;
            });
        }
        if (changed) writeList(list);
        return list.map(function (item) {
            return Object.assign({}, item);
        });
    }

    function nextId(list) {
        var max = 20190000;
        (list || []).forEach(function (item) {
            var m = String((item && item.id) || '').match(/^TRD(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'TRD' + String(max + 1);
    }

    function nextSubjectId(list) {
        var max = 0;
        (list || []).forEach(function (item) {
            var m = String((item && item.subjectId) || '').match(/^TRD-SUB-(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'TRD-SUB-' + String(max + 1).padStart(3, '0');
    }

    function maskPhone(phone) {
        var digits = String(phone || '').replace(/\D/g, '');
        if (digits.length !== 11) return phone || '—';
        return digits.slice(0, 3) + '****' + digits.slice(7);
    }

    /**
     * 档案页「新增贸易商」或主体准入写入
     * @param {Object} payload
     */
    function add(payload) {
        var list = ensureSeed();
        var name = String((payload && (payload.name || payload.subjectName)) || '').trim();
        if (!name) return null;
        var subjectName = String((payload && payload.subjectName) || name).trim() || name;
        var subjectId = String((payload && payload.subjectId) || '').trim() || nextSubjectId(list);
        var stamp = nowText();
        var shortName = String((payload && payload.shortName) || '').trim();
        if (!shortName) shortName = name.length > 6 ? name.slice(0, 6) : name;
        var row = normalize({
            id: nextId(list),
            subjectId: subjectId,
            subjectName: subjectName,
            subjectType: String((payload && payload.subjectType) || '').trim() === '服务商' ? '服务商' : '贸易商',
            name: name,
            shortName: shortName,
            region: String((payload && payload.region) || '').trim() || '—',
            detailAddr: String((payload && payload.detailAddr) || '').trim() || '—',
            licenseType: String((payload && payload.licenseType) || '').trim() || '商业保理公司',
            bizScope: String((payload && payload.bizScope) || '').trim() || '—',
            contact: String((payload && payload.contact) || '').trim() || '—',
            phone: maskPhone((payload && payload.phone) || ''),
            license: (payload && payload.license) || {},
            permit: (payload && payload.permit) || {},
            onboardStatus: String((payload && payload.onboardStatus) || '').trim() || '未进件',
            status: String((payload && payload.status) || '').trim() || '正常',
            createdBy: DEFAULT_OPERATOR,
            createdAt: stamp,
            updatedBy: DEFAULT_OPERATOR,
            updatedAt: stamp
        });
        list.unshift(row);
        writeList(list);
        return row;
    }

    /**
     * 所有主体新增贸易商商家成功后写入档案
     * @param {{subjectName:string,subjectType?:string,contact:string,phone:string,subjectId?:string}} payload
     */
    function addFromSubject(payload) {
        return add(payload);
    }

    function update(row) {
        if (!row || !row.id) return null;
        var list = ensureSeed();
        var found = null;
        list.some(function (item, index) {
            if (item.id === row.id) {
                var next = Object.assign({}, item, row);
                if (!row.updatedAt) next.updatedAt = nowText();
                if (!row.updatedBy) next.updatedBy = DEFAULT_OPERATOR;
                list[index] = normalize(next);
                found = list[index];
                return true;
            }
            return false;
        });
        if (found) writeList(list);
        return found;
    }

    function get(id) {
        var found = null;
        ensureSeed().some(function (item) {
            if (item.id === id) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    window.MdmTraderArchiveStore = {
        KEY: STORAGE_KEY,
        list: ensureSeed,
        add: add,
        addFromSubject: addFromSubject,
        update: update,
        get: get,
        seed: seed,
        save: writeList,
        nowText: nowText
    };
})();
