/* RBT 贸易商管理演示数据。待入驻列表按审核状态过滤；审核通过后回写 H5 账号状态。 */
(function () {
    var KEY = 'rbt_trader_list_v3';
    var H5_KEY = 'rbt_h5_trader_accounts_v1';
    var LICENSE_TYPES = ['商业保理公司', '融资租赁公司', '持牌金融机构', '地方金融组织'];
    var BIZ_SCOPES = ['保理', '融资租赁', '其他'];

    function demoImg(title, tone) {
        var fill = tone === 'permit' ? '#e8f1fb' : '#efe3c9';
        var accent = tone === 'permit' ? '#1d4f91' : '#6f4f26';
        var panel = tone === 'permit' ? '#c7dbf5' : '#f8f1df';
        var svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">' +
            '<rect width="480" height="300" fill="#d8d8d8"/>' +
            '<rect x="24" y="22" width="432" height="256" rx="6" fill="' + fill + '" stroke="' + accent + '" stroke-width="4"/>' +
            '<rect x="48" y="48" width="384" height="160" rx="4" fill="' + panel + '"/>' +
            '<text x="240" y="140" text-anchor="middle" font-size="28" font-weight="700" fill="' + accent + '">' + title + '</text>' +
            '<text x="240" y="248" text-anchor="middle" font-size="13" fill="' + accent + '">原型演示图</text>' +
            '</svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    var LICENSE_DEMO_IMG = demoImg('营业执照', 'license');
    var PERMIT_DEMO_IMG = demoImg('经营许可证', 'permit');

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    function nowText() {
        var d = new Date();
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

    function readRaw() {
        try {
            var raw = sessionStorage.getItem(KEY);
            var list = raw ? JSON.parse(raw) : null;
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function writeRaw(list) {
        sessionStorage.setItem(KEY, JSON.stringify(list));
    }

    function seed() {
        return [
            {
                code: 'TRD00001',
                subjectName: '杭州鲜达贸易有限公司',
                licenseType: '商业保理公司',
                bizScope: '保理',
                contactName: '周宁',
                contactPhone: '13800001101',
                status: '待审核',
                creator: '贸易商自助',
                createdAt: '2026-11-05 10:12:00',
                updater: '贸易商自助',
                updatedAt: '2026-11-05 10:12:00',
                license: {
                    name: '杭州鲜达贸易有限公司',
                    creditCode: '91330106MA2H7K8X1A',
                    type: '有限责任公司（自然人投资或控股）',
                    legal: '周宁',
                    capital: '500万元人民币',
                    founded: '2021-06-18',
                    address: '浙江省杭州市西湖区文三路100号',
                    scope: '预包装食品批发；食用农产品批发',
                    image: LICENSE_DEMO_IMG
                },
                permit: {
                    no: 'JY13301061234567',
                    name: '杭州鲜达贸易有限公司',
                    legal: '周宁',
                    place: '浙江省杭州市西湖区文三路100号',
                    mode: '食品销售经营者',
                    items: '预包装食品销售（含冷藏冷冻食品）',
                    expire: '2029-06-17',
                    image: PERMIT_DEMO_IMG
                }
            },
            {
                code: 'TRD00002',
                subjectName: '上海甬信融资租赁有限公司',
                licenseType: '融资租赁公司',
                bizScope: '融资租赁',
                contactName: '陈岚',
                contactPhone: '13900002202',
                status: '待审核',
                creator: '贸易商自助',
                createdAt: '2026-11-04 16:40:00',
                updater: '贸易商自助',
                updatedAt: '2026-11-04 16:40:00',
                license: {
                    name: '上海甬信融资租赁有限公司',
                    creditCode: '91310115MA1K2N3P4Q',
                    type: '有限责任公司',
                    legal: '陈岚',
                    capital: '1000万元人民币',
                    founded: '2019-03-12',
                    address: '上海市浦东新区世纪大道88号',
                    scope: '融资租赁业务；租赁业务',
                    image: LICENSE_DEMO_IMG
                },
                permit: {
                    no: 'JY13101159876543',
                    name: '上海甬信融资租赁有限公司',
                    legal: '陈岚',
                    place: '上海市浦东新区世纪大道88号',
                    mode: '融资租赁业务',
                    items: '融资租赁及相关咨询服务',
                    expire: '2028-12-31',
                    image: PERMIT_DEMO_IMG
                }
            },
            {
                code: 'TRD00003',
                subjectName: '深圳金穗商业保理有限公司',
                licenseType: '地方金融组织',
                bizScope: '保理',
                contactName: '林浩',
                contactPhone: '13700003303',
                status: '待审核',
                creator: '贸易商自助',
                createdAt: '2026-11-03 09:25:00',
                updater: '贸易商自助',
                updatedAt: '2026-11-03 09:25:00',
                license: {
                    name: '深圳金穗商业保理有限公司',
                    creditCode: '91440300MA5F6G7H8J',
                    type: '有限责任公司',
                    legal: '林浩',
                    capital: '800万元人民币',
                    founded: '2020-08-08',
                    address: '广东省深圳市南山区科技园南路18号',
                    scope: '商业保理；供应链管理',
                    image: LICENSE_DEMO_IMG
                },
                permit: {
                    no: 'JY14403001234567',
                    name: '深圳金穗商业保理有限公司',
                    legal: '林浩',
                    place: '广东省深圳市南山区科技园南路18号',
                    mode: '商业保理',
                    items: '以受让应收账款方式提供贸易融资',
                    expire: '2030-01-15',
                    image: PERMIT_DEMO_IMG
                }
            },
            {
                code: 'TRD00004',
                subjectName: '宁波海融持牌金融服务有限公司',
                licenseType: '持牌金融机构',
                bizScope: '其他',
                contactName: '赵敏',
                contactPhone: '13600004404',
                status: '已驳回',
                creator: '贸易商自助',
                createdAt: '2026-11-02 14:08:00',
                updater: '管理员',
                updatedAt: '2026-11-03 11:20:00',
                license: {
                    name: '宁波海融持牌金融服务有限公司',
                    creditCode: '91330201MA2B3C4D5E',
                    type: '有限责任公司',
                    legal: '赵敏',
                    capital: '2000万元人民币',
                    founded: '2018-11-20',
                    address: '浙江省宁波市海曙区中山西路66号',
                    scope: '金融信息服务；资产管理咨询',
                    image: LICENSE_DEMO_IMG
                },
                permit: {
                    no: 'JY13302019876543',
                    name: '宁波海融持牌金融服务有限公司',
                    legal: '赵敏',
                    place: '浙江省宁波市海曙区中山西路66号',
                    mode: '金融服务',
                    items: '金融信息服务（不含吸收公众存款）',
                    expire: '2027-09-30',
                    image: PERMIT_DEMO_IMG
                }
            }
        ];
    }

    function ensure() {
        var list = readRaw();
        if (!list) {
            list = seed();
            writeRaw(list);
        }
        var changed = false;
        list.forEach(function (row) {
            if (!row || (row.status !== '已审核' && row.status !== '已通过')) return;
            if (row.status === '已通过') {
                row.status = '已审核';
                changed = true;
            }
            if (row.orderQuota == null || row.orderQuota === '') return;
            /* 旧数据只有总额度时，补演示占用/锁定，便于已入驻列表验收 */
            if (row.occupiedQuota == null || row.lockedQuota == null) {
                var total = toAmount(row.orderQuota);
                var occupied = Number((total * 0.2).toFixed(2));
                var locked = Number((total * 0.1).toFixed(2));
                applyQuota(row, total, occupied, locked);
                changed = true;
            }
        });
        if (changed) writeRaw(list);
        return list;
    }

    function list(status) {
        var all = ensure();
        if (!status) return all.slice();
        var statuses = Array.isArray(status) ? status : [status];
        return all.filter(function (row) {
            return row && statuses.indexOf(row.status) >= 0;
        });
    }

    function get(code) {
        return ensure().filter(function (row) {
            return row && row.code === code;
        })[0] || null;
    }

    function syncH5Status(phone, status) {
        if (!phone) return;
        try {
            var raw = sessionStorage.getItem(H5_KEY);
            var accounts = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(accounts) || !accounts.length) return;
            var changed = false;
            accounts.forEach(function (item) {
                if (item && item.phone === phone) {
                    item.status = status;
                    changed = true;
                }
            });
            if (changed) sessionStorage.setItem(H5_KEY, JSON.stringify(accounts));
        } catch (e) {}
    }

    function toAmount(value) {
        var num = Number(value);
        return isFinite(num) ? num : 0;
    }

    /* 接单总额度 - 已占用(接单中) - 已成交锁定 = 可用额度 */
    function quotaOf(row) {
        var total = toAmount(row && row.orderQuota);
        var occupied = row && row.occupiedQuota != null ? toAmount(row.occupiedQuota) : 0;
        var locked = row && row.lockedQuota != null ? toAmount(row.lockedQuota) : 0;
        return {
            total: total,
            occupied: occupied,
            locked: locked,
            available: Math.max(0, Number((total - occupied - locked).toFixed(2)))
        };
    }

    function applyQuota(row, total, occupied, locked) {
        if (!row) return row;
        row.orderQuota = toAmount(total);
        row.occupiedQuota = toAmount(occupied);
        row.lockedQuota = toAmount(locked);
        return row;
    }

    function updateStatus(codes, status, operator, extra) {
        var listData = ensure();
        var set = {};
        (codes || []).forEach(function (code) {
            set[code] = true;
        });
        var stamp = nowText();
        var who = operator || '管理员';
        var patch = extra || {};
        var updated = [];
        listData.forEach(function (row) {
            if (!row || !set[row.code]) return;
            row.status = status;
            row.updater = who;
            row.updatedAt = stamp;
            if (status === '已审核') {
                applyQuota(row, patch.orderQuota, 0, 0);
            }
            if (status === '已驳回') {
                row.orderQuota = null;
                row.occupiedQuota = null;
                row.lockedQuota = null;
            }
            syncH5Status(row.contactPhone, status === '已审核' ? '已审核' : '已驳回');
            updated.push(row);
        });
        writeRaw(listData);
        return updated;
    }

    window.RbtTraderData = {
        licenseTypes: LICENSE_TYPES,
        bizScopes: BIZ_SCOPES,
        list: list,
        get: get,
        updateStatus: updateStatus,
        quotaOf: quotaOf,
        applyQuota: applyQuota,
        nowText: nowText
    };
})();
