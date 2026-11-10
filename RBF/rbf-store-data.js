/* RBF 门店列表演示数据。详情只带基础信息与进件信息，不含收货信息、运营评估、商户进件。 */
(function () {
    var KEY = 'rbf_store_list_v2';

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
                name: '中心店01',
                subjectName: '冷丰',
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
                address: '杭州市西湖区绿城西溪世纪中心1号楼',
                latlng: '120.07, 30.28',
                opStatus: '营业中',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然周',
                splitService: '已开通',
                rbfLevel: 'A',
                creator: '周经理',
                createdAt: '2026-08-01 09:00:00',
                updater: '喻巧',
                updatedAt: '2026-08-12 14:20:00',
                photos: true
            }),
            row({
                code: 'ONS00002',
                archiveCode: 'BJS00001',
                name: '测试通知',
                subjectName: '冷丰演示门店',
                partnerType: '加盟店',
                storeType: '社区生鲜店',
                bizLine: '康美',
                brandName: '汉言',
                bizLines: '拉新、POS/到店',
                contact: '夏利',
                phone: '17812344646',
                legalName: '夏利',
                legalPhone: '17812344646',
                warehouse: '华东履约仓 / WH–SH–01',
                region: '北京市/市辖区/东城区',
                address: '地下车库',
                opStatus: '休息中',
                onboardStatus: '未进件',
                storeStatus: '冻结',
                rbfLevel: 'B',
                creator: '李四',
                createdAt: '2026-04-29 22:53:02',
                updater: '李四',
                updatedAt: '2026-05-02 11:08:20'
            }),
            row({
                code: 'ONS00003',
                archiveCode: 'TSN00001',
                name: '111',
                shortName: '河东店',
                subjectName: '冷丰演示门店',
                partnerType: '联营店',
                storeType: '团购自提点',
                bizLine: '纯私域',
                brandName: '冷丰特选',
                bizLines: '拉新、留存、私域直播-生鲜场',
                contact: '张三',
                phone: '13812342211',
                legalName: '王敏',
                legalPhone: '13600008821',
                warehouse: '创建门店时选择的履约仓库',
                region: '天津市/市辖区/河东区',
                address: '长三角珠宝产业园A3栋',
                latlng: '117.25, 39.12',
                bd: '公司11号',
                onboardStatus: '进件成功',
                balancePay: '已开通',
                settleType: '对公',
                settleCycle: '自然周',
                splitService: '开启',
                rbfLevel: 'A',
                creator: '张三',
                createdAt: '2026-04-20 10:22:11',
                updater: '公司11号',
                updatedAt: '2026-06-01 09:12:00',
                photos: true
            }),
            row({
                code: 'ONS00004',
                archiveCode: 'SHA00001',
                name: 'DDD',
                shortName: '五角场店',
                subjectName: '五角场体验店',
                partnerType: '加盟店',
                storeType: '快闪零售',
                bizLine: '餐饮',
                brandName: '冷丰食堂大钵刘',
                bizLines: '外卖运营、商城',
                contact: '李四',
                phone: '18612349001',
                legalName: '赵倩',
                legalPhone: '13700006618',
                warehouse: '沪东前置仓',
                region: '上海市/市辖区/浦东新区',
                address: '张江路88号',
                latlng: '121.58, 31.20',
                bd: '李四',
                onboardStatus: '进件中',
                settleType: '对公',
                settleCycle: '自然月',
                splitService: '关闭',
                rbfLevel: 'C',
                creator: '李四',
                createdAt: '2026-04-19 15:01:44',
                updater: '赵倩',
                updatedAt: '2026-07-18 16:40:33',
                photos: true
            }),
            row({
                code: 'ONS00005',
                archiveCode: 'HGH00001',
                name: '张三',
                subjectName: '张江快闪店',
                partnerType: '加盟店',
                storeType: '社区便利店',
                bizLine: '集团内部',
                brandName: '集团内部',
                bizLines: '集团内部',
                contact: '张三',
                phone: '13100002233',
                legalName: '张三',
                legalPhone: '13100002233',
                warehouse: '创建门店时选择的履约仓库',
                region: '浙江省/杭州市/余杭区',
                address: '文一西路969号',
                latlng: '120.05, 30.28',
                bd: '张三',
                opStatus: '休息中',
                onboardStatus: '未进件',
                storeStatus: '已禁用',
                rbfLevel: 'D',
                creator: '张三',
                createdAt: '2026-04-18 09:33:02',
                updater: '张三',
                updatedAt: '2026-04-18 09:33:02'
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
            name: '中心店01',
            subjectName: '冷丰',
            partnerType: '直营店',
            storeType: '社区生鲜店',
            bizLine: '餐饮',
            brandName: '冷丰锅贴',
            bizLines: '拉新、留存、POS/堂食',
            bd: '—',
            contact: '喻巧',
            phone: '153****9562',
            legalName: '—',
            legalPhone: '—',
            warehouse: '华东履约仓 / WH–SH–01',
            region: '浙江省/杭州市/西湖区',
            address: '杭州市西湖区绿城西溪世纪中心1号楼',
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
            name: '测试通知',
            subjectName: '冷丰演示门店',
            partnerType: '加盟店',
            storeType: '社区生鲜店',
            bizLine: '康美',
            brandName: '汉言',
            bizLines: '拉新、POS/到店',
            bd: '—',
            contact: '夏利',
            phone: '178****4646',
            legalName: '—',
            legalPhone: '—',
            warehouse: '华东履约仓 / WH–SH–01',
            region: '北京市/市辖区/东城区',
            address: '地下车库',
            latlng: '—',
            opStatus: '休息中',
            onboardStatus: '未进件',
            balancePay: '未提交',
            settleType: '—',
            settleCycle: '—',
            splitService: '未开通',
            storeStatus: '冻结',
            withdrawPhone: '—',
            photos: false
        },
        {
            code: 'TSN00001',
            name: '111',
            subjectName: '冷丰演示门店',
            partnerType: '联营店',
            storeType: '团购自提点',
            bizLine: '纯私域',
            brandName: '冷丰特选',
            bizLines: '拉新、留存、私域直播-生鲜场',
            bd: '公司11号',
            contact: '张三',
            phone: '138****2211',
            legalName: '—',
            legalPhone: '—',
            warehouse: '创建门店时选择的履约仓库',
            region: '天津市/市辖区/河东区',
            address: '长三角珠宝产业园A3栋',
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
            name: 'DDD',
            subjectName: '五角场体验店',
            partnerType: '加盟店',
            storeType: '快闪零售',
            bizLine: '餐饮',
            brandName: '冷丰食堂大钵刘',
            bizLines: '外卖运营、商城',
            bd: '李四',
            contact: '李四',
            phone: '186****9001',
            legalName: '—',
            legalPhone: '—',
            warehouse: '沪东前置仓',
            region: '上海市/市辖区/浦东新区',
            address: '张江路88号',
            latlng: '121.58, 31.20',
            opStatus: '营业中',
            onboardStatus: '进件中',
            balancePay: '未提交',
            settleType: '对公',
            settleCycle: '自然月',
            splitService: '关闭',
            storeStatus: '正常',
            withdrawPhone: '186****9001',
            photos: true
        },
        {
            code: 'HGH00001',
            name: '张三',
            subjectName: '张江快闪店',
            partnerType: '加盟店',
            storeType: '社区便利店',
            bizLine: '集团内部',
            brandName: '集团内部',
            bizLines: '集团内部',
            bd: '张三',
            contact: '张三',
            phone: '—',
            legalName: '—',
            legalPhone: '—',
            warehouse: '创建门店时选择的履约仓库',
            region: '浙江省/杭州市/余杭区',
            address: '文一西路969号',
            latlng: '120.05, 30.28',
            opStatus: '休息中',
            onboardStatus: '未进件',
            balancePay: '未提交',
            settleType: '—',
            settleCycle: '—',
            splitService: '关闭',
            storeStatus: '已禁用',
            withdrawPhone: '—',
            photos: false
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
                rbfLevel: input.rbfLevel,
                enabled: input.status !== '禁用',
                creator: '用户名',
                createdAt: createdAt,
                updater: '用户名',
                updatedAt: createdAt
            })
        );
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
        ['name', 'rbfLevel', 'partnerType', 'storeType', 'contact', 'phone', 'legalName', 'legalPhone', 'warehouse', 'region', 'address', 'enabled'].forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(input, key)) target[key] = input[key];
        });
        target.updater = '用户名';
        target.updatedAt = nowText();
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

    function ensureSeedTags() {
        var api = window.BusinessTagPrototypeStore;
        if (!api || typeof api.ensureDemoBinding !== 'function') return;
        ['ONS00001', 'ONS00002', 'ONS00003', 'ONS00004', 'ONS00005'].forEach(function (code, index) {
            api.ensureDemoBinding('RBF_STORE', code, index);
        });
    }

    window.RbfStoreData = {
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
        ensureSeedTags: ensureSeedTags
    };
})();
