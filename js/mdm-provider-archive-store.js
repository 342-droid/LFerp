/**
 * 服务商档案共享数据（所有主体「新增服务商商家」成功后写入，服务商档案页读取）。
 * 贸易商档案的「绑定服务商」只从这里取名称。
 */
(function () {
    var STORAGE_KEY = 'mdm_provider_archive_v1';
    var DEFAULT_OPERATOR = '当前用户';
    var PROVIDER_TYPES = ['商业保理公司', '融资租赁公司', '持牌金融机构', '地方金融组织'];

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
        row.subjectType = '服务商';
        var providerType = String(row.providerType || row.licenseType || '').trim();
        row.providerType = PROVIDER_TYPES.indexOf(providerType) >= 0 ? providerType : providerType && providerType !== '—' ? providerType : '';
        row.onboardChannel = String(row.onboardChannel || '').trim() || '汇付';
        if (!String(row.balancePay || '').trim()) {
            row.balancePay = row.onboardStatus === '进件成功' ? '已开通' : '未发起';
        }
        return row;
    }

    function seed() {
        return [
            {
                id: 'PRV20190001',
                subjectId: 'PRV-SUB-001',
                subjectName: '冷丰',
                subjectType: '服务商',
                name: '冷丰',
                shortName: '冷丰',
                region: '上海市/上海市/浦东新区',
                detailAddr: '世纪大道100号',
                providerType: '商业保理公司',
                contact: '林夏',
                phone: '138****1000',
                onboardChannel: '汇付',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                status: '正常',
                createdBy: '系统',
                createdAt: '2026-01-06 09:00:00',
                updatedBy: '系统',
                updatedAt: '2026-01-06 09:00:00'
            },
            {
                id: 'PRV20190002',
                subjectId: 'PRV-SUB-002',
                subjectName: '宁波海丰商业保理有限公司',
                subjectType: '服务商',
                name: '宁波海丰商业保理有限公司',
                shortName: '海丰保理',
                region: '浙江省/宁波市/鄞州区',
                detailAddr: '中山东路666号',
                providerType: '持牌金融机构',
                contact: '陈可',
                phone: '138****1003',
                onboardChannel: '汇付',
                onboardStatus: '未进件',
                balancePay: '未发起',
                status: '正常',
                license: {
                    name: '宁波海丰商业保理有限公司',
                    creditCode: '91330212MA2XXXXX1B',
                    legal: '陈可'
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
            list = list.map(function (item) {
                var before = JSON.stringify(item);
                var after = normalize(item);
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
            var m = String((item && item.id) || '').match(/^PRV(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'PRV' + String(max + 1);
    }

    function nextSubjectId(list) {
        var max = 0;
        (list || []).forEach(function (item) {
            var m = String((item && item.subjectId) || '').match(/^PRV-SUB-(\d+)$/);
            if (m) max = Math.max(max, parseInt(m[1], 10));
        });
        return 'PRV-SUB-' + String(max + 1).padStart(3, '0');
    }

    function maskPhone(phone) {
        var digits = String(phone || '').replace(/\D/g, '');
        if (digits.length !== 11) return phone || '—';
        return digits.slice(0, 3) + '****' + digits.slice(7);
    }

    function sameParty(a, b) {
        if (!a || !b) return false;
        if (a.id && b.id && a.id === b.id) return true;
        var left = String(a.name || a.subjectName || '').trim();
        var right = String(b.name || b.subjectName || '').trim();
        return !!(left && right && left === right);
    }

    /**
     * 把仍留在贸易商档案里的服务商迁过来。同名已存在则不重复写入。
     */
    function importFromTrader(rows) {
        var list = ensureSeed();
        var added = false;
        (rows || []).forEach(function (row) {
            if (!row) return;
            var exists = list.some(function (item) {
                return sameParty(item, row);
            });
            if (exists) return;
            var name = String(row.name || row.subjectName || '').trim();
            if (!name) return;
            list.push(
                normalize({
                    id: /^PRV\d+$/.test(String(row.id || '')) ? row.id : nextId(list),
                    subjectId: /^PRV-SUB-/.test(String(row.subjectId || '')) ? row.subjectId : nextSubjectId(list),
                    subjectName: row.subjectName || name,
                    subjectType: '服务商',
                    name: name,
                    shortName: row.shortName || '',
                    region: row.region || '—',
                    detailAddr: row.detailAddr || '—',
                    providerType: row.providerType || row.licenseType || '',
                    contact: row.contact || '—',
                    phone: row.phone || '—',
                    license: row.license || {},
                    permit: row.permit || {},
                    onboardStatus: row.onboardStatus || '未进件',
                    status: row.status || '正常',
                    createdBy: row.createdBy || '系统',
                    createdAt: row.createdAt || nowText(),
                    updatedBy: row.updatedBy || row.createdBy || '系统',
                    updatedAt: row.updatedAt || row.createdAt || nowText()
                })
            );
            added = true;
        });
        if (added) writeList(list);
        return list;
    }

    function add(payload) {
        var list = ensureSeed();
        var name = String((payload && (payload.name || payload.subjectName)) || '').trim();
        if (!name) return null;
        var subjectName = String((payload && payload.subjectName) || name).trim() || name;
        var subjectId = String((payload && payload.subjectId) || '').trim() || nextSubjectId(list);
        var stamp = nowText();
        var shortName = String((payload && payload.shortName) || '').trim();
        if (!shortName) shortName = name.length > 6 ? name.slice(0, 6) : name;
        var providerType = String((payload && payload.providerType) || '').trim();
        var row = normalize({
            id: nextId(list),
            subjectId: subjectId,
            subjectName: subjectName,
            subjectType: '服务商',
            name: name,
            shortName: shortName,
            region: String((payload && payload.region) || '').trim() || '—',
            detailAddr: String((payload && payload.detailAddr) || '').trim() || '—',
            providerType: providerType,
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
                next.subjectType = '服务商';
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

    window.MdmProviderArchiveStore = {
        KEY: STORAGE_KEY,
        TYPES: PROVIDER_TYPES,
        list: ensureSeed,
        add: add,
        addFromSubject: addFromSubject,
        update: update,
        get: get,
        importFromTrader: importFromTrader,
        seed: seed,
        save: writeList,
        nowText: nowText
    };
})();
