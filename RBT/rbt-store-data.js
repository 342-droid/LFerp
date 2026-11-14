/* RBT 门店列表演示数据。详情含基础信息、进件信息、操作记录，不含收货信息、运营评估、商户进件。 */
(function () {
    var KEY = 'rbt_store_list_v5';

    function toAmount(value) {
        var num = Number(value);
        return isFinite(num) ? num : 0;
    }

    /* 可用额度 = 门店总额度 - 已占用（已成交单独累计，不扣减可用） */
    function quotaOf(row) {
        var total = toAmount(row && row.storeQuota);
        var occupied = row && row.occupiedQuota != null ? toAmount(row.occupiedQuota) : 0;
        var locked = row && row.lockedQuota != null ? toAmount(row.lockedQuota) : 0;
        return {
            total: total,
            occupied: occupied,
            locked: locked,
            available: Math.max(0, Number((total - occupied).toFixed(2)))
        };
    }

    function applyQuota(row, total, occupied, locked) {
        if (!row) return row;
        row.storeQuota = toAmount(total);
        row.occupiedQuota = toAmount(occupied);
        row.lockedQuota = toAmount(locked);
        return row;
    }

    function demoQuotaParts(total) {
        var amount = toAmount(total);
        return {
            occupied: Number((amount * 0.2).toFixed(2)),
            /* 已成交只累计需求单复核通过金额，演示补数不写成交 */
            locked: 0
        };
    }

    function pad(n) {
        return n < 10 ? '0' + n : String(n);
    }

    var FIELD_LABELS = {
        name: '门店名称',
        rbtLevel: 'RBT等级',
        partnerType: '门店合作类型',
        storeType: '门店类型',
        contact: '联系人',
        phone: '联系人手机号',
        legalName: '法人姓名',
        legalPhone: '法人手机号',
        warehouse: '配送仓库',
        region: '省市区',
        address: '详细地址',
        enabled: '状态',
        storeQuota: '门店总额度',
        occupiedQuota: '已占用',
        lockedQuota: '已成交'
    };

    function formatMoney(value) {
        return toAmount(value).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' 元';
    }

    function showField(key, value) {
        if (key === 'enabled') return value === false ? '禁用' : '启用';
        if (key === 'storeQuota' || key === 'occupiedQuota' || key === 'lockedQuota') return formatMoney(value);
        if (value == null || value === '') return '空';
        return String(value);
    }

    function sameField(key, before, after) {
        if (key === 'enabled') return (before === false) === (after === false);
        if (key === 'storeQuota' || key === 'occupiedQuota' || key === 'lockedQuota') {
            return toAmount(before) === toAmount(after);
        }
        return String(before == null ? '' : before) === String(after == null ? '' : after);
    }

    function pushLog(store, content, operator, time) {
        if (!store || !content) return;
        if (!Array.isArray(store.logs)) store.logs = [];
        store.logs.unshift({
            time: time || nowText(),
            operator: operator || '用户名',
            content: content
        });
    }

    /* 旧数据没有操作记录时，补一条准入记录。之后的变更只追加真实差异。 */
    function ensureLogs(item) {
        if (Array.isArray(item.logs)) return false;
        item.logs = [{
            time: item.createdAt || item.updatedAt || '',
            operator: item.creator || '用户名',
            content: '新增准入门店'
        }];
        return true;
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

    function onboardOf(store, extra) {
        var done = store.onboardStatus === '进件成功' || store.onboardStatus === '进件中';
        var base = {
            merchantNo: done ? 'HF-' + store.code : '—',
            receiptName: done ? store.shortName : '—',
            bizAddress: done ? store.address : '—',
            adminName: done ? store.contact : '—',
            adminPhone: done ? store.phone : '—',
            adminEmail: done ? 'store@lengfeng.demo' : '—',
            licenseName: done ? store.subjectName : '—',
            licenseCode: done ? '91310000MA' + store.code.slice(-4) : '—',
            licenseStart: done ? '2020-01-01' : '—',
            licenseEnd: done ? '长期' : '—',
            foundDate: done ? '2020-01-01' : '—',
            licenseRegion: done ? store.region : '—',
            licenseAddress: done ? store.address : '—',
            legalCertType: '身份证',
            legalId: done ? '330102199001011234' : '—',
            legalStart: done ? '2018-06-01' : '—',
            legalEnd: done ? '2038-06-01' : '—',
            legalRegion: done ? store.region : '—',
            legalAddress: done ? store.address : '—',
            accountName: done ? store.subjectName : '—',
            cardNo: done ? '6225 **** **** 6601' : '—',
            bankName: done ? '中国工商银行' : '—',
            bankBranch: done ? '杭州西湖支行' : '—',
            placeName: store.name,
            agreementType: '余额支付协议',
            agreementSigned: store.onboardStatus === '进件成功',
            agreementName: '余额支付服务协议',
            photos: done
        };
        return Object.assign(base, extra || {});
    }

    function row(data) {
        var store = Object.assign(
            {
                shortName: data.name,
                subjectName: data.subjectName || data.name,
                bd: '—',
                latlng: '—',
                opStatus: '营业中',
                businessHours: '08:00-22:00',
                balancePay: '未提交',
                settleType: '—',
                settleCycle: '—',
                splitService: '未开通',
                storeStatus: '正常',
                withdrawPhone: data.phone,
                fridge: '无',
                photos: false
            },
            data
        );
        store.onboard = onboardOf(store, data.onboard);
        return store;
    }

    function seed() {
        return [
            row({
                code: 'ONS00001',
                archiveCode: 'HGH00002',
                name: '西湖中心生鲜店',
                shortName: '西湖中心店',
                subjectName: '杭州冷丰餐饮管理有限公司',
                partnerType: '直营店',
                storeType: '社区生鲜店',
                bizLine: '餐饮',
                brandName: '冷丰锅贴',
                bizLines: '拉新、留存、POS/堂食',
                contact: '喻巧',
                phone: '15312349562',
                legalName: '陈立',
                legalPhone: '13900001111',
                warehouse: '华东履约仓 / WH–SH–01',
                region: '浙江省/杭州市/西湖区',
                address: '杭州市西湖区绿城西溪世纪中心1号楼1层',
                latlng: '120.07, 30.28',
                opStatus: '营业中',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然周',
                splitService: '已开通',
                rbtLevel: 'A',
                storeQuota: 500000,
                occupiedQuota: 80000,
                lockedQuota: 0,
                creator: '周经理',
                createdAt: '2026-08-01 09:00:00',
                updater: '喻巧',
                updatedAt: '2026-08-12 14:20:00',
                photos: true
            }),
            row({
                code: 'ONS00002',
                archiveCode: 'BJS00001',
                name: '东城和平里生鲜店',
                shortName: '和平里店',
                subjectName: '北京汉言商贸有限公司',
                partnerType: '加盟店',
                storeType: '社区生鲜店',
                bizLine: '康美',
                brandName: '汉言',
                bizLines: '拉新、POS/到店',
                contact: '夏利',
                phone: '17812344646',
                legalName: '夏利',
                legalPhone: '17812344646',
                warehouse: '华北履约仓 / WH–BJ–01',
                region: '北京市/市辖区/东城区',
                address: '北京市东城区和平里中街12号底商',
                latlng: '116.42, 39.96',
                opStatus: '营业中',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然周',
                splitService: '已开通',
                storeStatus: '正常',
                rbtLevel: 'B',
                storeQuota: 200000,
                occupiedQuota: 30000,
                lockedQuota: 0,
                creator: '李敏',
                createdAt: '2026-04-29 22:53:02',
                updater: '夏利',
                updatedAt: '2026-05-02 11:08:20',
                photos: true
            }),
            row({
                code: 'ONS00003',
                archiveCode: 'TSN00001',
                name: '河东大桥道自提点',
                shortName: '河东店',
                subjectName: '天津冷丰特选商贸有限公司',
                partnerType: '联营店',
                storeType: '团购自提点',
                bizLine: '纯私域',
                brandName: '冷丰特选',
                bizLines: '拉新、留存、私域直播-生鲜场',
                contact: '周海',
                phone: '13812342211',
                legalName: '王敏',
                legalPhone: '13600008821',
                warehouse: '华北履约仓 / WH–TJ–02',
                region: '天津市/市辖区/河东区',
                address: '天津市河东区大桥道78号一层',
                latlng: '117.25, 39.12',
                bd: '刘洋',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然周',
                splitService: '开启',
                rbtLevel: 'A',
                storeQuota: 300000,
                occupiedQuota: 45000,
                lockedQuota: 0,
                creator: '刘洋',
                createdAt: '2026-04-20 10:22:11',
                updater: '周海',
                updatedAt: '2026-06-01 09:12:00',
                photos: true
            }),
            row({
                code: 'ONS00004',
                archiveCode: 'SHA00001',
                name: '五角场体验店',
                shortName: '五角场店',
                subjectName: '上海冷丰餐饮管理有限公司',
                partnerType: '加盟店',
                storeType: '社区生鲜店',
                bizLine: '餐饮',
                brandName: '冷丰食堂',
                bizLines: '外卖运营、商城',
                contact: '赵倩',
                phone: '18612349001',
                legalName: '赵倩',
                legalPhone: '13700006618',
                warehouse: '沪东前置仓 / WH–SH–03',
                region: '上海市/市辖区/杨浦区',
                address: '上海市杨浦区翔殷路1128号国定路路口',
                latlng: '121.52, 31.30',
                bd: '李敏',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然月',
                splitService: '已开通',
                rbtLevel: 'B',
                storeQuota: 180000,
                occupiedQuota: 40000,
                lockedQuota: 0,
                creator: '李敏',
                createdAt: '2026-04-19 15:01:44',
                updater: '赵倩',
                updatedAt: '2026-07-18 16:40:33',
                photos: true
            }),
            row({
                code: 'ONS00005',
                archiveCode: 'HGH00001',
                name: '余杭仓前便利店',
                shortName: '仓前店',
                subjectName: '杭州仓前零售有限公司',
                partnerType: '加盟店',
                storeType: '社区便利店',
                bizLine: '集团内部',
                brandName: '冷丰优选',
                bizLines: '到店零售',
                contact: '陈晨',
                phone: '13100002233',
                legalName: '陈晨',
                legalPhone: '13100002233',
                warehouse: '华东履约仓 / WH–SH–01',
                region: '浙江省/杭州市/余杭区',
                address: '杭州市余杭区文一西路969号西溪首座底商',
                latlng: '120.05, 30.28',
                bd: '周经理',
                opStatus: '营业中',
                onboardStatus: '进件成功',
                storeStatus: '正常',
                enabled: true,
                rbtLevel: 'C',
                storeQuota: 120000,
                occupiedQuota: 10000,
                lockedQuota: 0,
                creator: '周经理',
                createdAt: '2026-04-18 09:33:02',
                updater: '陈晨',
                updatedAt: '2026-08-08 09:33:02',
                photos: true
            })
        ];
    }

    function read() {
        try {
            var raw = sessionStorage.getItem(KEY);
            if (!raw) return null;
            var list = JSON.parse(raw);
            return Array.isArray(list) ? list : null;
        } catch (e) {
            return null;
        }
    }

    function write(list) {
        sessionStorage.setItem(KEY, JSON.stringify(list));
    }

    /* 门店档案列表里的门店。新增准入时从这里选取，其余资料只读带出。 */
    var ARCHIVE = [
        {
            code: 'HGH00002',
            name: '西湖中心生鲜店',
            subjectName: '杭州冷丰餐饮管理有限公司',
            partnerType: '直营店',
            storeType: '社区生鲜店',
            bizLine: '餐饮',
            brandName: '冷丰锅贴',
            bizLines: '拉新、留存、POS/堂食',
            bd: '—',
            contact: '喻巧',
            phone: '153****9562',
            legalName: '陈立',
            legalPhone: '139****1111',
            warehouse: '华东履约仓 / WH–SH–01',
            region: '浙江省/杭州市/西湖区',
            address: '杭州市西湖区绿城西溪世纪中心1号楼1层',
            latlng: '120.07, 30.28',
            opStatus: '营业中',
            onboardStatus: '进件成功',
            balancePay: '已开通',
            settleType: '对公',
            settleCycle: '自然周',
            splitService: '已开通',
            storeStatus: '正常',
            withdrawPhone: '153****9562',
            photos: true
        },
        {
            code: 'BJS00001',
            name: '东城和平里生鲜店',
            subjectName: '北京汉言商贸有限公司',
            partnerType: '加盟店',
            storeType: '社区生鲜店',
            bizLine: '康美',
            brandName: '汉言',
            bizLines: '拉新、POS/到店',
            bd: '—',
            contact: '夏利',
            phone: '178****4646',
            legalName: '夏利',
            legalPhone: '178****4646',
            warehouse: '华北履约仓 / WH–BJ–01',
            region: '北京市/市辖区/东城区',
            address: '北京市东城区和平里中街12号底商',
            latlng: '116.42, 39.96',
            opStatus: '营业中',
            onboardStatus: '进件成功',
            balancePay: '已开通',
            settleType: '对公',
            settleCycle: '自然周',
            splitService: '已开通',
            storeStatus: '正常',
            withdrawPhone: '178****4646',
            photos: true
        },
        {
            code: 'TSN00001',
            name: '河东大桥道自提点',
            subjectName: '天津冷丰特选商贸有限公司',
            partnerType: '联营店',
            storeType: '团购自提点',
            bizLine: '纯私域',
            brandName: '冷丰特选',
            bizLines: '拉新、留存、私域直播-生鲜场',
            bd: '刘洋',
            contact: '周海',
            phone: '138****2211',
            legalName: '王敏',
            legalPhone: '136****8821',
            warehouse: '华北履约仓 / WH–TJ–02',
            region: '天津市/市辖区/河东区',
            address: '天津市河东区大桥道78号一层',
            latlng: '117.25, 39.12',
            opStatus: '营业中',
            onboardStatus: '进件成功',
            balancePay: '已开通',
            settleType: '对公',
            settleCycle: '自然周',
            splitService: '开启',
            storeStatus: '正常',
            withdrawPhone: '138****2211',
            photos: true
        },
        {
            code: 'SHA00001',
            name: '五角场体验店',
            subjectName: '上海冷丰餐饮管理有限公司',
            partnerType: '加盟店',
            storeType: '社区生鲜店',
            bizLine: '餐饮',
            brandName: '冷丰食堂',
            bizLines: '外卖运营、商城',
            bd: '李敏',
            contact: '赵倩',
            phone: '186****9001',
            legalName: '赵倩',
            legalPhone: '137****6618',
            warehouse: '沪东前置仓 / WH–SH–03',
            region: '上海市/市辖区/杨浦区',
            address: '上海市杨浦区翔殷路1128号国定路路口',
            latlng: '121.52, 31.30',
            opStatus: '营业中',
            onboardStatus: '进件成功',
            balancePay: '已开通',
            settleType: '对公',
            settleCycle: '自然月',
            splitService: '已开通',
            storeStatus: '正常',
            withdrawPhone: '186****9001',
            photos: true
        },
        {
            code: 'HGH00001',
            name: '余杭仓前便利店',
            subjectName: '杭州仓前零售有限公司',
            partnerType: '加盟店',
            storeType: '社区便利店',
            bizLine: '集团内部',
            brandName: '冷丰优选',
            bizLines: '到店零售',
            bd: '周经理',
            contact: '陈晨',
            phone: '131****2233',
            legalName: '陈晨',
            legalPhone: '131****2233',
            warehouse: '华东履约仓 / WH–SH–01',
            region: '浙江省/杭州市/余杭区',
            address: '杭州市余杭区文一西路969号西溪首座底商',
            latlng: '120.05, 30.28',
            opStatus: '营业中',
            onboardStatus: '进件成功',
            balancePay: '已开通',
            settleType: '对公',
            settleCycle: '自然周',
            splitService: '关闭',
            storeStatus: '正常',
            withdrawPhone: '131****2233',
            photos: true
        }
    ];

    function archiveByCode(code) {
        var found = null;
        ARCHIVE.some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    function list() {
        var current = read();
        if (!current) {
            current = seed();
            write(current);
        }
        var changed = false;
        current.forEach(function (item) {
            if (!item.archiveCode) {
                ARCHIVE.some(function (source) {
                    if (source.name === item.name) {
                        item.archiveCode = source.code;
                        changed = true;
                        return true;
                    }
                    return false;
                });
            }
            var source = archiveByCode(item.archiveCode);
            if (source && !item.bizLine) {
                item.bizLine = source.bizLine || '';
                item.brandName = source.brandName || '';
                item.bizLines = source.bizLines || '';
                changed = true;
            }
            if (ensureLogs(item)) changed = true;
            /* 旧数据缺占用时补演示占用；已成交缺省为 0，只由需求复核通过累加 */
            if (item.storeQuota != null && item.storeQuota !== '' && (item.occupiedQuota == null || item.lockedQuota == null)) {
                var parts = demoQuotaParts(item.storeQuota);
                applyQuota(
                    item,
                    item.storeQuota,
                    item.occupiedQuota == null ? parts.occupied : item.occupiedQuota,
                    item.lockedQuota == null ? 0 : item.lockedQuota
                );
                changed = true;
            }
        });
        if (changed) write(current);
        return current;
    }

    function alreadyAdmitted(source) {
        return list().some(function (item) {
            return item.code === source.code || item.archiveCode === source.code;
        });
    }

    function addFromArchive(input) {
        var source = archiveByCode(input.archiveCode || input.code);
        if (!source) return null;
        if (alreadyAdmitted(source)) return { duplicate: true, code: source.code };
        var items = list();
        var createdAt = nowText();
        var store = row(
            Object.assign({}, source, {
                archiveCode: source.code,
                rbtLevel: input.rbtLevel,
                enabled: input.status !== '禁用',
                creator: '用户名',
                createdAt: createdAt,
                updater: '用户名',
                updatedAt: createdAt
            })
        );
        applyQuota(store, input.storeQuota, 0, 0);
        pushLog(store, '新增准入门店', '用户名', createdAt);
        items.unshift(store);
        write(items);
        return store;
    }

    function nextCode(items) {
        var max = 0;
        items.forEach(function (item) {
            var matched = String(item.code || '').match(/^ONS(\d+)$/);
            if (matched) max = Math.max(max, parseInt(matched[1], 10));
        });
        return 'ONS' + String(max + 1).padStart(5, '0');
    }

    function add(input) {
        var items = list();
        var createdAt = nowText();
        var store = row(
            Object.assign({}, input, {
                code: nextCode(items),
                enabled: input.status !== '禁用',
                shortName: input.name,
                subjectName: input.name,
                bd: '—',
                latlng: '—',
                opStatus: '营业中',
                businessHours: '08:00-22:00',
                onboardStatus: '未进件',
                balancePay: '未提交',
                settleType: '—',
                settleCycle: '—',
                splitService: '未开通',
                storeStatus: '正常',
                withdrawPhone: input.phone,
                fridge: '无',
                photos: false,
                creator: '用户名',
                createdAt: createdAt,
                updater: '用户名',
                updatedAt: createdAt
            })
        );
        pushLog(store, '新增准入门店', '用户名', createdAt);
        items.unshift(store);
        write(items);
        return store;
    }

    function update(input) {
        var items = list();
        var target = null;
        items.some(function (item) {
            if (item.code === input.code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target) return null;
        var changes = [];
        ['name', 'rbtLevel', 'partnerType', 'storeType', 'contact', 'phone', 'legalName', 'legalPhone', 'warehouse', 'region', 'address', 'enabled'].forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(input, key)) return;
            if (sameField(key, target[key], input[key])) return;
            changes.push(FIELD_LABELS[key] + '：' + showField(key, target[key]) + ' → ' + showField(key, input[key]));
            target[key] = input[key];
        });
        if (Object.prototype.hasOwnProperty.call(input, 'storeQuota') && !sameField('storeQuota', target.storeQuota, input.storeQuota)) {
            changes.push('门店总额度：' + showField('storeQuota', target.storeQuota) + ' → ' + showField('storeQuota', input.storeQuota));
            applyQuota(
                target,
                input.storeQuota,
                target.occupiedQuota != null ? target.occupiedQuota : 0,
                target.lockedQuota != null ? target.lockedQuota : 0
            );
        }
        if (!changes.length) return target;
        var changedAt = nowText();
        target.updater = '用户名';
        target.updatedAt = changedAt;
        pushLog(target, changes.join('；'), '用户名', changedAt);
        write(items);
        return target;
    }

    function appendLog(code, content, operator) {
        var items = list();
        var target = null;
        items.some(function (item) {
            if (item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target || !content) return null;
        var changedAt = nowText();
        var who = operator || '用户名';
        target.updater = who;
        target.updatedAt = changedAt;
        pushLog(target, content, who, changedAt);
        write(items);
        return target;
    }

    function get(code) {
        var found = null;
        list().some(function (item) {
            if (item.code === code) {
                found = item;
                return true;
            }
            return false;
        });
        return found;
    }

    /* 增减已占用额度，结果不小于 0。金额有变化时写入操作记录。 */
    function adjustOccupied(code, delta, operator) {
        var items = list();
        var target = null;
        items.some(function (item) {
            if (item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target) return null;
        var before = toAmount(target.occupiedQuota);
        var next = before + toAmount(delta);
        if (next < 0) next = 0;
        next = Number(next.toFixed(2));
        if (next === before) return target;
        applyQuota(
            target,
            target.storeQuota,
            next,
            target.lockedQuota != null ? target.lockedQuota : 0
        );
        var changedAt = nowText();
        var who = operator || '用户名';
        target.updater = who;
        target.updatedAt = changedAt;
        pushLog(target, '已占用：' + showField('occupiedQuota', before) + ' → ' + showField('occupiedQuota', next), who, changedAt);
        write(items);
        return target;
    }

    /* 增减已成交金额，结果不小于 0。金额有变化时写入操作记录。 */
    function adjustLocked(code, delta, operator) {
        var items = list();
        var target = null;
        items.some(function (item) {
            if (item.code === code) {
                target = item;
                return true;
            }
            return false;
        });
        if (!target) return null;
        var before = toAmount(target.lockedQuota);
        var next = before + toAmount(delta);
        if (next < 0) next = 0;
        next = Number(next.toFixed(2));
        if (next === before) return target;
        applyQuota(
            target,
            target.storeQuota,
            target.occupiedQuota != null ? target.occupiedQuota : 0,
            next
        );
        var changedAt = nowText();
        var who = operator || '用户名';
        target.updater = who;
        target.updatedAt = changedAt;
        pushLog(target, '已成交：' + showField('lockedQuota', before) + ' → ' + showField('lockedQuota', next), who, changedAt);
        write(items);
        return target;
    }

    window.RbtStoreData = {
        KEY: KEY,
        levels: ['A', 'B', 'C', 'D'],
        partnerTypes: ['直营店', '加盟店', '联营店'],
        storeTypes: ['社区生鲜店', '团购自提点', '快闪零售', '社区便利店'],
        list: list,
        add: add,
        addFromArchive: addFromArchive,
        archiveStores: function () {
            return ARCHIVE.map(function (item) {
                return Object.assign({}, item);
            });
        },
        archiveByCode: archiveByCode,
        update: update,
        get: get,
        adjustOccupied: adjustOccupied,
        adjustLocked: adjustLocked,
        appendLog: appendLog,
        quotaOf: quotaOf,
        applyQuota: applyQuota,
        saveList: write
    };
})();
