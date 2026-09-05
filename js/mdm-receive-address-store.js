/**
 * 收货地址公共取值（供应商 / 仓库 / 门店）
 * - 供应商、仓库：详情抽屉维护，按实体编号存多条，一条默认
 * - 门店：档案「门店地址 + 详细地址 + 联系人 + 手机」同步为默认收货地址，供售后等读取
 */
(function (global) {
    var KEYS = {
        supplier: 'mdm_supplier_receive_addr_v1',
        warehouse: 'mdm_warehouse_receive_addr_v1',
        store: 'mdm_store_receive_addr_v1'
    };
    var STORE_META_KEY = 'mdm_store_receive_meta_v1';
    var WAREHOUSE_META_KEY = 'mdm_warehouse_receive_meta_v1';

    function blankable(v) {
        var s = String(v == null ? '' : v).trim();
        if (!s || s === '—') return '';
        return s;
    }

    function normalize(item, fallbackId) {
        return {
            id: String((item && item.id) || fallbackId || 'addr_' + Date.now()),
            receiverName: blankable(item && item.receiverName),
            receiverPhone: blankable(item && item.receiverPhone),
            region: blankable(item && item.region),
            detailAddress: blankable(item && item.detailAddress),
            isDefault: !!(item && item.isDefault)
        };
    }

    function readMap(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return {};
            var data = JSON.parse(raw);
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function writeMap(key, map) {
        try {
            localStorage.setItem(key, JSON.stringify(map || {}));
        } catch (e) {}
    }

    function entityKey(id) {
        return String(id || '').trim();
    }

    function ensureOneDefault(list) {
        if (!list || !list.length) return list || [];
        var hasDefault = list.some(function (it) {
            return it.isDefault;
        });
        if (!hasDefault) list[0].isDefault = true;
        return list;
    }

    function asList(raw) {
        if (Array.isArray(raw)) return raw;
        if (raw && Array.isArray(raw.list)) return raw.list;
        return [];
    }

    function seedFromEntity(entity) {
        return [
            normalize(
                {
                    id: 'seed_default',
                    receiverName:
                        blankable(entity && entity.contactName) ||
                        blankable(entity && entity.admin) ||
                        blankable(entity && entity.contact) ||
                        blankable(entity && entity.name),
                    receiverPhone: blankable(entity && entity.phone),
                    region: blankable(entity && entity.region).replace(/\//g, ' / '),
                    detailAddress:
                        blankable(entity && entity.detailAddress) ||
                        blankable(entity && entity.address) ||
                        blankable(entity && entity.location),
                    isDefault: true
                },
                'seed_default'
            )
        ];
    }

    function load(kind, id, seedEntity) {
        var k = entityKey(id);
        var map = readMap(KEYS[kind] || KEYS.supplier);
        if (k && Object.prototype.hasOwnProperty.call(map, k)) {
            return asList(map[k]).map(function (it, idx) {
                return normalize(it, 'addr_' + idx);
            });
        }
        if (kind === 'warehouse' && k) {
            var old = readMap(KEYS.supplier);
            if (Object.prototype.hasOwnProperty.call(old, k)) {
                var migrated = asList(old[k]).map(function (it, idx) {
                    return normalize(it, 'addr_' + idx);
                });
                if (migrated.length) {
                    save(kind, k, migrated);
                    return migrated;
                }
            }
        }
        if (seedEntity) return seedFromEntity(seedEntity);
        return [];
    }

    function save(kind, id, list) {
        var k = entityKey(id);
        if (!k) return;
        var map = readMap(KEYS[kind] || KEYS.supplier);
        map[k] = ensureOneDefault(
            (list || []).map(function (it, idx) {
                return normalize(it, 'addr_' + idx);
            })
        );
        writeMap(KEYS[kind] || KEYS.supplier, map);
    }

    function getDefault(kind, id, seedEntity) {
        var list = load(kind, id, seedEntity);
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].isDefault) return list[i];
        }
        return list[0] || null;
    }

    function readMeta(key) {
        return readMap(key);
    }

    function writeMeta(key, map) {
        writeMap(key, map);
    }

    function upsertMeta(metaKey, id, name, extra) {
        var k = entityKey(id);
        if (!k) return;
        var map = readMeta(metaKey);
        var prev = map[k] && typeof map[k] === 'object' ? map[k] : {};
        var next = {
            id: k,
            name: blankable(name) || prev.name || ''
        };
        if (extra && typeof extra === 'object') {
            Object.keys(extra).forEach(function (key) {
                if (extra[key] != null && extra[key] !== '') next[key] = extra[key];
            });
        }
        map[k] = next;
        var alias = blankable(name);
        if (alias && alias !== k) {
            map[alias] = { id: k, name: alias, aliasOf: k };
        }
        writeMeta(metaKey, map);
    }

    function resolveId(metaKey, hint) {
        var h = entityKey(hint);
        if (!h) return '';
        var map = readMeta(metaKey);
        if (map[h]) return entityKey(map[h].aliasOf || map[h].id || h);
        var keys = Object.keys(map);
        var i;
        for (i = 0; i < keys.length; i++) {
            var one = map[keys[i]];
            if (!one) continue;
            if (entityKey(one.name) === h || entityKey(one.id) === h) {
                return entityKey(one.aliasOf || one.id || keys[i]);
            }
        }
        return h;
    }

    function splitLocation(location) {
        var loc = blankable(location);
        if (!loc) return { region: '', detailAddress: '' };
        var m = loc.match(/^(.+?(?:区|县|市|旗|州))\s*(.*)$/);
        if (m && m[2]) {
            return { region: m[1], detailAddress: m[2] };
        }
        return { region: loc, detailAddress: loc };
    }

    function seedWarehouseFromArchive(warehouse, opts) {
        opts = opts || {};
        var id = entityKey((warehouse && (warehouse.id || warehouse.code)) || '');
        if (!id) return [];
        var existing = load('warehouse', id);
        if (existing.length && opts.onlyIfEmpty) {
            upsertMeta(WAREHOUSE_META_KEY, id, warehouse && warehouse.name, {
                location: blankable(warehouse && warehouse.location)
            });
            return existing;
        }
        if (existing.length) {
            upsertMeta(WAREHOUSE_META_KEY, id, warehouse && warehouse.name, {
                location: blankable(warehouse && warehouse.location)
            });
            return existing;
        }
        var loc = splitLocation(warehouse && warehouse.location);
        var region = blankable(warehouse && warehouse.region) || loc.region;
        var detail =
            blankable(warehouse && warehouse.detailAddress) || loc.detailAddress || loc.region;
        var list = [
            normalize(
                {
                    id: 'seed_default',
                    receiverName:
                        blankable(warehouse && warehouse.admin) ||
                        blankable(warehouse && warehouse.contactName) ||
                        blankable(warehouse && warehouse.name),
                    receiverPhone: blankable(warehouse && warehouse.phone),
                    region: region.replace(/\//g, ' / '),
                    detailAddress: detail,
                    isDefault: true
                },
                'seed_default'
            )
        ];
        save('warehouse', id, list);
        upsertMeta(WAREHOUSE_META_KEY, id, warehouse && warehouse.name, {
            location: blankable(warehouse && warehouse.location)
        });
        return list;
    }

    function syncStoreFromArchive(store) {
        var id = entityKey((store && (store.id || store.storeId)) || '');
        var name = blankable(store && store.name);
        if (!id && !name) return [];
        var key = id || name;
        var archive = normalize(
            {
                id: 'archive_default',
                receiverName:
                    blankable(store && store.contactName) ||
                    blankable(store && store.contact) ||
                    name,
                receiverPhone: blankable(store && store.phone),
                region: blankable(store && store.region).replace(/\//g, ' / '),
                detailAddress: blankable(store && (store.detailAddress || store.address)),
                isDefault: true
            },
            'archive_default'
        );
        var list = load('store', key);
        if (!list.length && name && name !== key) list = load('store', name);
        if (!list.length) {
            list = [archive];
            if (archive.detailAddress) {
                list.push(
                    normalize(
                        {
                            id: 'archive_alt',
                            receiverName: archive.receiverName,
                            receiverPhone: archive.receiverPhone,
                            region: archive.region,
                            detailAddress: archive.detailAddress + '（备选收货点）',
                            isDefault: false
                        },
                        'archive_alt'
                    )
                );
            }
        } else {
            var replaced = false;
            list = list.map(function (it) {
                if (it.isDefault || it.id === 'archive_default' || it.id === 'seed_default') {
                    replaced = true;
                    return normalize(
                        {
                            id: it.id,
                            receiverName: archive.receiverName,
                            receiverPhone: archive.receiverPhone,
                            region: archive.region,
                            detailAddress: archive.detailAddress,
                            isDefault: true
                        },
                        it.id
                    );
                }
                return Object.assign({}, it, { isDefault: false });
            });
            if (!replaced) {
                list.forEach(function (it) {
                    it.isDefault = false;
                });
                list.unshift(archive);
            }
        }
        save('store', key, list);
        if (name && name !== key) save('store', name, list);
        upsertMeta(STORE_META_KEY, key, name, {
            fulfillWarehouse: blankable(store && store.fulfillWarehouse)
        });
        return list;
    }

    function findWarehouseId(hint) {
        var h = entityKey(hint);
        if (!h) return '';
        var fromMeta = resolveId(WAREHOUSE_META_KEY, h);
        if (fromMeta && load('warehouse', fromMeta).length) return fromMeta;
        var map = readMap(KEYS.warehouse);
        if (map[h]) return h;
        var keys = Object.keys(map);
        var i;
        for (i = 0; i < keys.length; i++) {
            if (h.indexOf(keys[i]) >= 0 || keys[i].indexOf(h) >= 0) return keys[i];
        }
        var meta = readMeta(WAREHOUSE_META_KEY);
        var mk = Object.keys(meta);
        for (i = 0; i < mk.length; i++) {
            var one = meta[mk[i]];
            if (!one) continue;
            var name = entityKey(one.name);
            if (name && (h.indexOf(name) >= 0 || name.indexOf(h) >= 0)) {
                return entityKey(one.aliasOf || one.id || mk[i]);
            }
        }
        return '';
    }

    function findStoreId(hint) {
        var h = entityKey(hint);
        if (!h) return '';
        var fromMeta = resolveId(STORE_META_KEY, h);
        if (fromMeta) return fromMeta;
        var map = readMap(KEYS.store);
        if (map[h]) return h;
        return h;
    }

    function resolveWarehouseIdByStore(storeId, storeName) {
        var id = findStoreId(storeId || storeName);
        if (!id) return '';
        var meta = readMeta(STORE_META_KEY);
        var pack = meta[id] || meta[entityKey(storeName)] || {};
        var fulfill = blankable(pack.fulfillWarehouse);
        if (!fulfill && pack.aliasOf) {
            pack = meta[pack.aliasOf] || pack;
            fulfill = blankable(pack.fulfillWarehouse);
        }
        if (!fulfill) return '';
        var codeMatch = fulfill.match(/WH[-–]?\S+/i);
        if (codeMatch) {
            var found = findWarehouseId(codeMatch[0].replace(/–/g, '-'));
            if (found) return found;
        }
        return findWarehouseId(fulfill);
    }

    function getFirstWarehouseId() {
        var map = readMap(KEYS.warehouse);
        var keys = Object.keys(map);
        if (keys.length) return keys[0];
        var meta = readMeta(WAREHOUSE_META_KEY);
        var mk = Object.keys(meta);
        return mk[0] || 'WH001';
    }

    function ensureDemoSeeds() {
        var warehouses = [
            {
                id: 'WH001',
                name: '主仓库',
                admin: '小牛',
                phone: '13822112211',
                location: '上海市浦东新区张江路88号'
            },
            {
                id: 'WH304550231884821504',
                name: '前置仓-华东一号库',
                admin: '周仓',
                phone: '1370000098',
                location: '上海市浦东新区张江路1688号'
            },
            {
                id: 'WH-ONS-88303',
                name: '合作仓-苏州',
                admin: '钱多多',
                phone: '15977887788',
                location: '江苏省苏州市工业园区星湖街328号'
            },
            {
                id: 'WH004',
                name: '同城周转仓',
                admin: '孙丽',
                phone: '18877657765',
                location: '上海市杨浦区国定路506号'
            }
        ];
        warehouses.forEach(function (wh) {
            seedWarehouseFromArchive(wh, { onlyIfEmpty: true });
        });
        upsertMeta(WAREHOUSE_META_KEY, 'WH001', '沪南一号仓');
        upsertMeta(WAREHOUSE_META_KEY, 'WH001', '华东履约仓');
        upsertMeta(WAREHOUSE_META_KEY, 'WH001', 'WH-SH-01');
        upsertMeta(WAREHOUSE_META_KEY, 'WH304550231884821504', '沪东前置仓');

        var stores = [
            {
                id: 'ONS-CENTER-01',
                name: '中心店01',
                contactName: '喻巧',
                phone: '15395629562',
                region: '浙江省/杭州市/西湖区',
                detailAddress: '杭州市西湖区绿城西溪世纪中心1号楼',
                fulfillWarehouse: '华东履约仓 / WH–SH–01'
            },
            {
                id: 'AS-STORE-NJ',
                name: '南京万达店',
                contactName: '南京万达店 售后',
                phone: '4008006688',
                region: '江苏省南京市建邺区',
                detailAddress: '河西大街万达广场',
                fulfillWarehouse: 'WH001'
            },
            {
                id: 'AS-STORE-SS',
                name: '斯斯门店商家2',
                contactName: '斯斯门店 售后',
                phone: '4008006688',
                region: '浙江省杭州市萧山区',
                detailAddress: '宁围街道演示门店',
                fulfillWarehouse: 'WH001'
            },
            {
                id: 'AS-STORE-HZ',
                name: '杭州西湖店',
                contactName: '杭州西湖店 售后',
                phone: '4008006688',
                region: '浙江省杭州市西湖区',
                detailAddress: '文三路演示门店',
                fulfillWarehouse: 'WH001'
            },
            {
                id: 'AS-STORE-SH',
                name: '上海徐家汇店',
                contactName: '上海徐家汇店 售后',
                phone: '4008006688',
                region: '上海市徐汇区',
                detailAddress: '漕溪北路演示门店',
                fulfillWarehouse: 'WH001'
            },
            {
                id: 'AS-STORE-DQ',
                name: '德清乾元天恩冷丰店',
                contactName: '德清乾元天恩冷丰店 售后',
                phone: '4008006688',
                region: '浙江省湖州市德清县',
                detailAddress: '乾元镇天恩路冷丰店',
                fulfillWarehouse: 'WH001'
            }
        ];
        stores.forEach(function (st) {
            if (!load('store', st.id).length && !load('store', st.name).length) {
                syncStoreFromArchive(st);
            } else {
                upsertMeta(STORE_META_KEY, st.id, st.name, {
                    fulfillWarehouse: st.fulfillWarehouse
                });
            }
        });
    }

    ensureDemoSeeds();

    global.MdmReceiveAddressStore = {
        KEYS: KEYS,
        normalize: normalize,
        load: load,
        save: save,
        getDefault: getDefault,
        seedWarehouseFromArchive: seedWarehouseFromArchive,
        syncStoreFromArchive: syncStoreFromArchive,
        findWarehouseId: findWarehouseId,
        findStoreId: findStoreId,
        resolveWarehouseIdByStore: resolveWarehouseIdByStore,
        getFirstWarehouseId: getFirstWarehouseId,
        getWarehouseReceiveInfo: function (warehouseId, warehouseFallback) {
            var id = findWarehouseId(warehouseId) || entityKey(warehouseId);
            if (warehouseFallback) seedWarehouseFromArchive(warehouseFallback, { onlyIfEmpty: true });
            return (
                getDefault('warehouse', id, warehouseFallback) ||
                normalize({}, 'empty')
            );
        },
        getStoreReceiveInfo: function (storeId, storeFallback) {
            var id = findStoreId(storeId) || entityKey(storeId);
            if (storeFallback) {
                var fb = Object.assign({}, storeFallback, {
                    id: storeFallback.id || storeFallback.storeId || id
                });
                var list = syncStoreFromArchive(fb);
                var i;
                for (i = 0; i < list.length; i++) {
                    if (list[i].isDefault) return list[i];
                }
                return list[0] || normalize({}, 'empty');
            }
            return getDefault('store', id) || normalize({}, 'empty');
        },
        ensureDemoSeeds: ensureDemoSeeds
    };
})(typeof window !== 'undefined' ? window : this);
