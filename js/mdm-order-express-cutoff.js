/**
 * 订单 · 订单截单
 * 按订单渠道（零售 / 代采）+ 履约方式 + 商品标签 + 类目组合配置。
 * 零售履约：快递到家、门店自提；代采履约：平台配送、快递配送。
 * 适用场景（直播 / 商城）仅零售订单使用；支持每日定时 / 支付后自动截单。
 * 指定履约 / 指定标签 / 指定类目优先于「全部」；门店订货汇总自动截单已并入本页。
 * 系统只兜零售 × 快递到家（直播+商城、全部标签类目），不做全渠道通用兜底。
 * 底层（见 order-cutoff-runtime.js，不改本页交互）：
 * - 支付后自动截单的订单不进入采购「门店订货汇总」，也不再走每日定时；
 * - 订货汇总已人工截单的订单，到点策略不再重复执行。
 */
(function () {
    var STORAGE_KEY = 'lf_order_express_cutoff_v6';
    var LEGACY_STORAGE_KEYS = [
        'lf_order_express_cutoff_v5',
        'lf_order_express_cutoff_v4',
        'lf_order_express_cutoff_v3',
        'lf_order_express_cutoff_v2',
        'lf_order_express_cutoff_v1'
    ];
    var STORE_AUTO_CUTOFF_KEY = 'purchase_store_auto_cutoff_config';
    var PAGE_SIZE_OPTIONS = [20, 50, 100];
    var CHANNEL_LABEL = { retail: '零售', proxy: '代采' };
    var CHANNEL_IDS = ['retail', 'proxy'];
    var SCENE_LABEL = { live: '直播', mall: '商城' };
    var STATUS_LABEL = { draft: '草稿', active: '启用', stopped: '停用' };
    var STATUS_CLASS = { draft: 'is-draft', active: 'is-on', stopped: 'is-off' };
    var MODE_LABEL = { time: '每日定时', after_pay: '支付后自动截单' };
    var FULFILLMENT_OPTIONS = [
        { id: 'express_home', name: '快递到家', channel: 'retail' },
        { id: 'pickup', name: '门店自提', channel: 'retail' },
        { id: 'platform', name: '平台配送', channel: 'proxy' },
        { id: 'express_proxy', name: '快递配送', channel: 'proxy' }
    ];
    var FULFILLMENT_IDS = FULFILLMENT_OPTIONS.map(function (item) {
        return item.id;
    });
    var FULFILLMENT_NAME = FULFILLMENT_OPTIONS.reduce(function (map, item) {
        map[item.id] = item.name;
        return map;
    }, {});
    var CHANNEL_FULFILLMENTS = { retail: ['express_home', 'pickup'], proxy: ['platform', 'express_proxy'] };
    var STORE_FULFILLMENT_MAP = {
        快递配送: 'express_proxy',
        平台配送: 'platform',
        快递到家: 'express_home',
        门店自提: 'pickup',
        自提: 'pickup',
        快递: 'express_home'
    };

    function statusText(status) {
        return STATUS_LABEL[status] || STATUS_LABEL.draft;
    }

    function statusClass(status) {
        return STATUS_CLASS[status] || STATUS_CLASS.draft;
    }

    var FALLBACK_CATEGORIES = [
        { id: '新鲜蔬菜', name: '新鲜蔬菜' },
        { id: '时令水果', name: '时令水果' },
        { id: '粮油调味', name: '粮油调味' },
        { id: '肉禽蛋品', name: '肉禽蛋品' },
        { id: '酒水饮料', name: '酒水饮料' }
    ];
    var FALLBACK_TAGS = [
        { id: '冷丰溯源', name: '冷丰溯源' },
        { id: '冷丰优选', name: '冷丰优选' },
        { id: '牛牛专用', name: '牛牛专用' },
        { id: '蔬菜水果', name: '蔬菜水果' },
        { id: '优选商品', name: '优选商品' },
        { id: '天天平价', name: '天天平价' }
    ];

    var idSeq = 6;
    var SEED_STRATEGIES = [
        {
            id: 's1',
            name: '零售快递到家',
            channels: ['retail'],
            scenes: ['live', 'mall'],
            fulfillmentScope: 'specified',
            fulfillments: ['express_home'],
            cutoffMode: 'time',
            cutoffTime: '10:00:00',
            tagScope: 'all',
            tags: [],
            categoryScope: 'all',
            categories: [],
            status: 'active',
            isDefault: true,
            userDesc: ''
        },
        {
            id: 's2',
            name: '快递到家蔬菜截单',
            channels: ['retail'],
            scenes: ['live', 'mall'],
            fulfillmentScope: 'specified',
            fulfillments: ['express_home'],
            cutoffMode: 'time',
            cutoffTime: '08:00:00',
            tagScope: 'all',
            tags: [],
            categoryScope: 'specified',
            categories: [{ id: '新鲜蔬菜', name: '新鲜蔬菜' }],
            status: 'active',
            userDesc: ''
        },
        {
            id: 's3',
            name: '商城水果截单',
            channels: ['retail'],
            scenes: ['mall'],
            fulfillmentScope: 'specified',
            fulfillments: ['express_home'],
            cutoffMode: 'time',
            cutoffTime: '14:00:00',
            tagScope: 'all',
            tags: [],
            categoryScope: 'specified',
            categories: [{ id: '时令水果', name: '时令水果' }],
            status: 'stopped',
            userDesc: ''
        },
        {
            id: 's4',
            name: '平台配送优选截单',
            channels: ['proxy'],
            scenes: [],
            fulfillmentScope: 'specified',
            fulfillments: ['platform'],
            cutoffMode: 'time',
            cutoffTime: '16:00:00',
            tagScope: 'specified',
            tags: [{ id: '冷丰优选', name: '冷丰优选' }],
            categoryScope: 'all',
            categories: [],
            status: 'active',
            userDesc: '承接原门店订货汇总自动截单：平台配送按标签单独到点截单。'
        },
        {
            id: 's5',
            name: '代采快递支付即截',
            channels: ['proxy'],
            scenes: [],
            fulfillmentScope: 'specified',
            fulfillments: ['express_proxy'],
            cutoffMode: 'after_pay',
            cutoffTime: '',
            tagScope: 'all',
            tags: [],
            categoryScope: 'all',
            categories: [],
            status: 'active',
            userDesc: '支付成功即截单，不再停留待接单。'
        }
    ];

    var state = {
        strategies: [],
        keywordName: '',
        filterChannel: '',
        filterFulfillment: '',
        filterMode: '',
        filterStatus: '',
        page: 1,
        pageSize: 20,
        selected: {},
        collapsed: false,
        drawer: null,
        editId: null,
        formCategories: [],
        formTags: []
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

    function toast(msg, type) {
        if (typeof showToast === 'function') {
            showToast(msg, type || 'success');
            return;
        }
        window.alert(msg);
    }

    function pad2(num) {
        return (num < 10 ? '0' : '') + num;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function normalizeTime(raw) {
        var text = String(raw || '').trim();
        var match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (!match) return '';
        var hour = Number(match[1]);
        var minute = Number(match[2]);
        var second = match[3] != null ? Number(match[3]) : 0;
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
            return '';
        }
        return pad2(hour) + ':' + pad2(minute) + ':' + pad2(second);
    }

    function subtractOneSecond(hhmmss) {
        var time = normalizeTime(hhmmss);
        if (!time) return '23:59:59';
        var parts = time.split(':');
        var total = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]) - 1;
        if (total < 0) total += 24 * 3600;
        return pad2(Math.floor(total / 3600)) + ':' + pad2(Math.floor((total % 3600) / 60)) + ':' + pad2(total % 60);
    }

    function nextId() {
        return 's' + idSeq++;
    }

    function syncIdSeq(list) {
        var max = 0;
        (list || []).forEach(function (row) {
            var m = String(row.id || '').match(/^s(\d+)$/);
            if (m) max = Math.max(max, Number(m[1]));
        });
        if (max >= idSeq) idSeq = max + 1;
    }

    function normalizeScenes(row) {
        var list = [];
        if (row && Array.isArray(row.scenes)) list = row.scenes;
        else if (row && row.scene) list = [row.scene];
        var out = [];
        if (list.indexOf('live') >= 0) out.push('live');
        if (list.indexOf('mall') >= 0) out.push('mall');
        return out;
    }

    function hasChannelField(row) {
        return !!(row && (Array.isArray(row.channels) || row.channel));
    }

    function normalizeChannels(row) {
        var list = [];
        if (row && Array.isArray(row.channels)) list = row.channels;
        else if (row && row.channel) list = [row.channel];
        return CHANNEL_IDS.filter(function (id) {
            return list.indexOf(id) >= 0;
        });
    }

    function inferChannels(row) {
        if (hasChannelField(row)) return normalizeChannels(row);
        var name = String((row && row.name) || '');
        if (name.indexOf('代采') >= 0 && name.indexOf('零售') < 0) return ['proxy'];
        if (row && (row.fulfillmentScope === 'specified' || row.fulfillments)) {
            var fromFulfill = channelsFromFulfillments(normalizeFulfillments(row.fulfillments));
            if (fromFulfill.length === 1) return fromFulfill;
        }
        return ['retail'];
    }

    function channelOfFulfillment(id) {
        if ((CHANNEL_FULFILLMENTS.retail || []).indexOf(id) >= 0) return 'retail';
        if ((CHANNEL_FULFILLMENTS.proxy || []).indexOf(id) >= 0) return 'proxy';
        return '';
    }

    function channelsFromFulfillments(ids) {
        var seen = {};
        (ids || []).forEach(function (id) {
            var ch = channelOfFulfillment(id);
            if (ch) seen[ch] = true;
        });
        return CHANNEL_IDS.filter(function (id) {
            return seen[id];
        });
    }

    function fulfillmentIdsForChannels(channels) {
        var seen = {};
        (channels && channels.length ? channels : []).forEach(function (ch) {
            (CHANNEL_FULFILLMENTS[ch] || []).forEach(function (id) {
                seen[id] = true;
            });
        });
        return FULFILLMENT_IDS.filter(function (id) {
            return seen[id];
        });
    }

    function allowedFulfillmentIds(row) {
        return fulfillmentIdsForChannels(inferChannels(row));
    }

    function hasRetail(row) {
        return inferChannels(row).indexOf('retail') >= 0;
    }

    function hasProxy(row) {
        return inferChannels(row).indexOf('proxy') >= 0;
    }

    function channelsOverlap(a, b) {
        var left = inferChannels(a);
        var right = inferChannels(b);
        return left.some(function (id) {
            return right.indexOf(id) >= 0;
        });
    }

    function overlapChannelLabels(a, b) {
        var left = inferChannels(a);
        var right = inferChannels(b);
        return left
            .filter(function (id) {
                return right.indexOf(id) >= 0;
            })
            .map(function (id) {
                return CHANNEL_LABEL[id];
            })
            .join('、');
    }

    function channelText(row) {
        var channels = inferChannels(row);
        if (!channels.length) return '—';
        return channels
            .map(function (id) {
                if (id !== 'retail') return CHANNEL_LABEL[id];
                var sceneText = normalizeScenes(row)
                    .map(function (s) {
                        return SCENE_LABEL[s];
                    })
                    .filter(Boolean)
                    .join('、');
                return sceneText ? '零售（' + sceneText + '）' : '零售';
            })
            .join('、');
    }

    function scenesOverlap(a, b) {
        var left = normalizeScenes(a);
        var right = normalizeScenes(b);
        return left.some(function (s) {
            return right.indexOf(s) >= 0;
        });
    }

    function overlapSceneLabels(a, b) {
        var left = normalizeScenes(a);
        var right = normalizeScenes(b);
        return left
            .filter(function (s) {
                return right.indexOf(s) >= 0;
            })
            .map(function (s) {
                return SCENE_LABEL[s];
            })
            .join('、');
    }

    function normalizeNamedList(list) {
        return (Array.isArray(list) ? list : [])
            .map(function (row) {
                var id = String((row && (row.id || row.name)) || '').trim();
                if (!id) return null;
                return { id: id, name: String((row && row.name) || id).trim() || id };
            })
            .filter(Boolean);
    }

    function normalizeFulfillmentId(raw) {
        var text = String(raw || '').trim();
        if (FULFILLMENT_NAME[text]) return text;
        if (STORE_FULFILLMENT_MAP[text]) return STORE_FULFILLMENT_MAP[text];
        return '';
    }

    function normalizeFulfillments(list) {
        var seen = {};
        var out = [];
        (Array.isArray(list) ? list : []).forEach(function (item) {
            var id = normalizeFulfillmentId(item);
            if (!id || seen[id]) return;
            seen[id] = true;
            out.push(id);
        });
        return FULFILLMENT_IDS.filter(function (id) {
            return seen[id];
        });
    }

    function isAllFulfillment(row) {
        if (!row) return false;
        if (row.fulfillmentScope === 'specified') return false;
        if (row.fulfillmentScope === 'all') return true;
        var ids = normalizeFulfillments(row.fulfillments);
        var allowed = allowedFulfillmentIds(row);
        return !ids.length || (allowed.length > 0 && ids.length === allowed.length);
    }

    function fulfillmentIdsOf(row) {
        var allowed = allowedFulfillmentIds(row);
        if (isAllFulfillment(row)) return allowed.slice();
        return normalizeFulfillments(row.fulfillments).filter(function (id) {
            return allowed.indexOf(id) >= 0;
        });
    }

    function fulfillmentText(row) {
        if (isAllFulfillment(row)) return '全部履约方式';
        return fulfillmentIdsOf(row)
            .map(function (id) {
                return FULFILLMENT_NAME[id];
            })
            .filter(Boolean)
            .join('、') || '—';
    }

    function namedListText(scope, list, allLabel) {
        if (scope !== 'specified' || !list || !list.length) return allLabel;
        return list
            .map(function (item) {
                return item.name;
            })
            .join('、');
    }

    function tagText(row) {
        return namedListText(row && row.tagScope, row && row.tags, '全部标签');
    }

    function categoryText(row) {
        return namedListText(row && row.categoryScope, row && row.categories, '全部类目');
    }

    function cutoffModeOf(row) {
        return row && row.cutoffMode === 'after_pay' ? 'after_pay' : 'time';
    }

    function ruleText(row) {
        if (cutoffModeOf(row) === 'after_pay') return MODE_LABEL.after_pay;
        return '每日 ' + (normalizeTime(row && row.cutoffTime) || '10:00:00');
    }

    function getCatalogCategories() {
        if (
            window.MdmProductCatalog &&
            typeof window.MdmProductCatalog.getCategories === 'function'
        ) {
            var list = window.MdmProductCatalog.getCategories() || [];
            if (list.length) return list;
        }
        return FALLBACK_CATEGORIES.slice();
    }

    function collectStoreTags(store) {
        if (!store || typeof store.getAll !== 'function') return [];
        return store.getAll() || [];
    }

    function isSkipAutoCutoffTag(row) {
        if (!row) return false;
        if (
            window.MdmProductSelectionTagStore &&
            typeof window.MdmProductSelectionTagStore.isSkipAutoCutoff === 'function' &&
            window.MdmProductSelectionTagStore.isSkipAutoCutoff(row.name)
        ) {
            return true;
        }
        return row.isSystem === true || String(row.name || '').trim() === '跳过自动截单';
    }

    function getCatalogTags() {
        var map = {};
        function add(list) {
            (list || []).forEach(function (row) {
                if (!row || isSkipAutoCutoffTag(row)) return;
                var id = String((row.id || row.name) || '').trim();
                var name = String(row.name || id).trim();
                if (!id || map[id]) return;
                map[id] = { id: id, name: name || id };
            });
        }
        if (
            window.MdmProductSelectionTagStore &&
            typeof window.MdmProductSelectionTagStore.getEnabled === 'function'
        ) {
            add(window.MdmProductSelectionTagStore.getEnabled());
        }
        add(collectStoreTags(window.MdmMallTagStore));
        add(collectStoreTags(window.MdmProxyTagStore));
        var list = Object.keys(map).map(function (id) {
            return map[id];
        });
        return list.length ? list : FALLBACK_TAGS.slice();
    }

    function normalizeStrategy(row) {
        if (!row) return null;
        var channels = inferChannels(row);
        var scenes = channels.indexOf('retail') >= 0 ? normalizeScenes(row) : [];
        var tagScope = row.tagScope === 'specified' ? 'specified' : 'all';
        var catScope = row.categoryScope === 'specified' ? 'specified' : 'all';
        var fulfillmentScope = row.fulfillmentScope === 'specified' ? 'specified' : 'all';
        var rawFulfill = fulfillmentScope === 'specified' ? normalizeFulfillments(row.fulfillments) : [];
        var allowed = fulfillmentIdsForChannels(channels);
        var fulfillments = rawFulfill.filter(function (id) {
            return allowed.indexOf(id) >= 0;
        });
        if (fulfillmentScope === 'specified' && rawFulfill.length && !fulfillments.length) {
            var realign = channelsFromFulfillments(rawFulfill);
            if (realign.length) {
                channels = realign;
                if (channels.indexOf('retail') < 0) scenes = [];
                allowed = fulfillmentIdsForChannels(channels);
                fulfillments = rawFulfill.filter(function (id) {
                    return allowed.indexOf(id) >= 0;
                });
            }
        }
        var mode = cutoffModeOf(row);
        return {
            id: String(row.id || row.code || nextId()),
            name: String(row.name || '').trim(),
            channels: channels,
            scenes: scenes,
            fulfillmentScope: fulfillmentScope,
            fulfillments: fulfillments,
            cutoffMode: mode,
            cutoffTime: mode === 'after_pay' ? '' : normalizeTime(row.cutoffTime) || '10:00:00',
            tagScope: tagScope,
            tags: tagScope === 'specified' ? normalizeNamedList(row.tags) : [],
            categoryScope: catScope,
            categories: catScope === 'specified' ? normalizeNamedList(row.categories) : [],
            status: row.status === 'active' || row.status === 'stopped' ? row.status : 'draft',
            isDefault: !!row.isDefault,
            userDesc: row.userDesc != null ? String(row.userDesc) : ''
        };
    }

    function upgradeLegacyStrategy(row) {
        if (!row) return null;
        var next = Object.assign({}, row);
        if (!next.fulfillmentScope && !next.fulfillments) {
            next.fulfillmentScope = 'specified';
            next.fulfillments = ['express_home'];
        }
        if (!next.tagScope) {
            next.tagScope = 'all';
            next.tags = [];
        }
        if (!next.cutoffMode) next.cutoffMode = 'time';
        return normalizeStrategy(next);
    }

    function migrateLegacyRule(rule) {
        var scenes = [];
        if (rule.scenes && rule.scenes.live) scenes.push('live');
        if (rule.scenes && rule.scenes.mall) scenes.push('mall');
        if (!scenes.length) scenes = ['live', 'mall'];
        var list = [
            {
                id: nextId(),
                name: '默认截单',
                channels: ['retail'],
                scenes: scenes,
                fulfillmentScope: 'specified',
                fulfillments: ['express_home'],
                cutoffMode: 'time',
                cutoffTime: rule.cutoffTime || '10:00:00',
                tagScope: 'all',
                tags: [],
                categoryScope: 'all',
                categories: [],
                status: 'active',
                isDefault: true,
                userDesc: rule.userDesc || ''
            }
        ];
        (rule.categoryTimes || []).forEach(function (cat) {
            list.push({
                id: nextId(),
                name: String(cat.name || cat.id || '') + '截单',
                channels: ['retail'],
                scenes: scenes.slice(),
                fulfillmentScope: 'specified',
                fulfillments: ['express_home'],
                cutoffMode: 'time',
                cutoffTime: cat.cutoffTime,
                tagScope: 'all',
                tags: [],
                categoryScope: 'specified',
                categories: [{ id: cat.id || cat.name, name: cat.name || cat.id }],
                status: 'draft',
                userDesc: ''
            });
        });
        return list.map(normalizeStrategy).filter(Boolean);
    }

    function parseCronToTime(expr) {
        var parts = String(expr || '')
            .trim()
            .split(/\s+/);
        if (parts.length < 3) return '';
        var minute = Number(parts[1]);
        var hour = Number(parts[2]);
        if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return '';
        }
        return pad2(hour) + ':' + pad2(minute) + ':00';
    }

    function importStoreAutoCutoffStrategies(existing) {
        var rows = (existing || []).slice();
        var raw = '';
        try {
            raw = localStorage.getItem(STORE_AUTO_CUTOFF_KEY) || '';
        } catch (e) {
            raw = '';
        }
        if (!raw) return rows;
        var parsed = null;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            return rows;
        }
        var rules = parsed && Array.isArray(parsed.rules) ? parsed.rules : [];
        rules.forEach(function (rule) {
            var fulfillment = normalizeFulfillmentId(rule && rule.fulfillmentMethod);
            if (!fulfillment) return;
            var time = parseCronToTime(rule.timerExpression);
            if (!time) return;
            var isProxy =
                String((rule && rule.orderSource) || '').indexOf('代采') >= 0 ||
                channelOfFulfillment(fulfillment) === 'proxy';
            var draft = normalizeStrategy({
                id: nextId(),
                name: String((rule.orderSource || '') + (rule.fulfillmentMethod || '') + '自动截单').replace(/\s+/g, ''),
                channels: isProxy ? ['proxy'] : ['retail'],
                scenes: isProxy ? [] : ['live', 'mall'],
                fulfillmentScope: 'specified',
                fulfillments: [fulfillment],
                cutoffMode: 'time',
                cutoffTime: time,
                tagScope: 'all',
                tags: [],
                categoryScope: 'all',
                categories: [],
                status: 'draft',
                userDesc: rule.timerDesc || '由门店订货汇总自动截单配置迁入'
            });
            if (!draft) return;
            if (overlapError(draft, '', rows)) return;
            rows.push(draft);
        });
        return rows;
    }

    function parseStoredList(raw) {
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && Array.isArray(parsed.strategies)) return parsed.strategies;
        return [];
    }

    function loadStrategies() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var current = parseStoredList(raw)
                    .map(normalizeStrategy)
                    .filter(Boolean);
                var normalized = ensureDefaultStrategy(current);
                if (normalized.length) {
                    syncIdSeq(normalized);
                    return normalized;
                }
            }
            for (var i = 0; i < LEGACY_STORAGE_KEYS.length; i++) {
                var legacy = localStorage.getItem(LEGACY_STORAGE_KEYS[i]);
                if (!legacy) continue;
                var old = JSON.parse(legacy);
                var fromList = [];
                if (Array.isArray(old)) fromList = old;
                else if (old && Array.isArray(old.strategies)) fromList = old.strategies;
                var migrated = fromList.length
                    ? fromList.map(upgradeLegacyStrategy).filter(Boolean)
                    : migrateLegacyRule(old || {});
                if (migrated.length) {
                    migrated = importStoreAutoCutoffStrategies(ensureDefaultStrategy(migrated));
                    syncIdSeq(migrated);
                    return migrated;
                }
            }
        } catch (e) {
            /* ignore */
        }
        var seed = ensureDefaultStrategy(SEED_STRATEGIES.map(normalizeStrategy).filter(Boolean));
        syncIdSeq(seed);
        return seed;
    }

    function saveStrategies() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ strategies: state.strategies }));
    }

    function filteredRows() {
        var name = String(state.keywordName || '').trim().toLowerCase();
        var channel = String(state.filterChannel || '').trim();
        var fulfillment = String(state.filterFulfillment || '').trim();
        var mode = String(state.filterMode || '').trim();
        var status = String(state.filterStatus || '').trim();
        return state.strategies.filter(function (row) {
            if (name && String(row.name).toLowerCase().indexOf(name) < 0) {
                return false;
            }
            if (channel && inferChannels(row).indexOf(channel) < 0) return false;
            if (fulfillment && fulfillmentIdsOf(row).indexOf(fulfillment) < 0) return false;
            if (mode && cutoffModeOf(row) !== mode) return false;
            if (status && (row.status || 'draft') !== status) return false;
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

    function findRow(id) {
        var found = null;
        state.strategies.forEach(function (row) {
            if (row.id === id) found = row;
        });
        return found;
    }

    function isDefaultStrategy(row) {
        return !!(row && row.isDefault);
    }

    function canDeleteStrategy(row) {
        return !!row && !isDefaultStrategy(row) && row.status !== 'active';
    }

    function canStopStrategy(row) {
        return !!row && !isDefaultStrategy(row);
    }

    function isRetailHomeFallback(row) {
        if (!row) return false;
        var channels = inferChannels(row);
        var scenes = normalizeScenes(row);
        var fulfills = fulfillmentIdsOf(row);
        return (
            channels.length === 1 &&
            channels[0] === 'retail' &&
            !isAllFulfillment(row) &&
            fulfills.length === 1 &&
            fulfills[0] === 'express_home' &&
            row.tagScope !== 'specified' &&
            row.categoryScope !== 'specified' &&
            scenes.indexOf('live') >= 0 &&
            scenes.indexOf('mall') >= 0
        );
    }

    function isLegacyCatchAllStrategy(row) {
        if (!row) return false;
        var channels = inferChannels(row);
        var scenes = normalizeScenes(row);
        return (
            channels.indexOf('retail') >= 0 &&
            channels.indexOf('proxy') >= 0 &&
            isAllFulfillment(row) &&
            row.tagScope !== 'specified' &&
            row.categoryScope !== 'specified' &&
            scenes.indexOf('live') >= 0 &&
            scenes.indexOf('mall') >= 0
        );
    }

    function isCatchAllStrategy(row) {
        return isRetailHomeFallback(row) || isLegacyCatchAllStrategy(row);
    }

    function applyDefaultLocks(row) {
        if (!row) return row;
        row.isDefault = true;
        row.channels = ['retail'];
        row.scenes = ['live', 'mall'];
        row.fulfillmentScope = 'specified';
        row.fulfillments = ['express_home'];
        row.tagScope = 'all';
        row.tags = [];
        row.categoryScope = 'all';
        row.categories = [];
        row.status = 'active';
        var name = String(row.name || '').trim();
        if (!name || name === '通用截单策略' || name === '零售快递到家兜底') row.name = '零售快递到家';
        return row;
    }

    function ensureDefaultStrategy(list) {
        var rows = (list || []).slice();
        var def = null;
        rows.forEach(function (row) {
            if (!def && isDefaultStrategy(row)) def = row;
        });
        if (!def) {
            rows.forEach(function (row) {
                if (!def && isCatchAllStrategy(row)) def = row;
            });
        }
        if (def) {
            applyDefaultLocks(def);
        } else {
            def = normalizeStrategy({
                id: nextId(),
                name: '零售快递到家',
                channels: ['retail'],
                scenes: ['live', 'mall'],
                fulfillmentScope: 'specified',
                fulfillments: ['express_home'],
                cutoffMode: 'time',
                cutoffTime: '10:00:00',
                tagScope: 'all',
                tags: [],
                categoryScope: 'all',
                categories: [],
                status: 'active',
                isDefault: true,
                userDesc: ''
            });
            if (def) rows.unshift(def);
        }
        rows.forEach(function (row) {
            if (row !== def) row.isDefault = false;
        });
        return rows;
    }

    function syncDeleteBtn() {
        var btn = $('cutoffDeleteBtn');
        if (!btn) return;
        var canDelete = selectedCodes().some(function (id) {
            return canDeleteStrategy(findRow(id));
        });
        btn.disabled = !canDelete;
    }

    function scopeConflict(aScope, aItems, bScope, bItems) {
        var leftAll = aScope !== 'specified';
        var rightAll = bScope !== 'specified';
        if (leftAll && rightAll) return { type: 'both-all' };
        if (!leftAll && !rightAll) {
            var seen = {};
            (aItems || []).forEach(function (item) {
                seen[item.id] = item.name;
            });
            for (var i = 0; i < (bItems || []).length; i++) {
                var hit = seen[bItems[i].id];
                if (hit) return { type: 'shared', name: hit };
            }
        }
        return null;
    }

    function fulfillmentConflict(a, b) {
        var aAll = isAllFulfillment(a);
        var bAll = isAllFulfillment(b);
        if (aAll && bAll) return { type: 'both-all' };
        if (!aAll && !bAll) {
            var left = fulfillmentIdsOf(a);
            var shared = fulfillmentIdsOf(b).filter(function (id) {
                return left.indexOf(id) >= 0;
            });
            if (shared.length) {
                return {
                    type: 'shared',
                    name: shared
                        .map(function (id) {
                            return FULFILLMENT_NAME[id];
                        })
                        .join('、')
                };
            }
        }
        return null;
    }

    function overlapError(candidate, ignoreId, pool) {
        var list = pool || state.strategies;
        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            if (ignoreId && row.id === ignoreId) continue;
            if (!channelsOverlap(row, candidate)) continue;
            var shareRetail = hasRetail(row) && hasRetail(candidate);
            var shareProxy = hasProxy(row) && hasProxy(candidate);
            if (shareRetail && !shareProxy && !scenesOverlap(row, candidate)) continue;
            var fulfillHit = fulfillmentConflict(row, candidate);
            var tagHit = scopeConflict(row.tagScope, row.tags, candidate.tagScope, candidate.tags);
            var catHit = scopeConflict(
                row.categoryScope,
                row.categories,
                candidate.categoryScope,
                candidate.categories
            );
            if (!(fulfillHit && tagHit && catHit)) continue;
            var channelLabel = overlapChannelLabels(row, candidate);
            var sceneLabel =
                shareRetail && scenesOverlap(row, candidate) ? overlapSceneLabels(row, candidate) : '';
            var scopeLabel = channelLabel + (sceneLabel ? '（' + sceneLabel + '）' : '');
            var fulfillLabel = isAllFulfillment(candidate) ? '全部履约方式' : fulfillmentText(candidate);
            if (tagHit.type === 'both-all' && catHit.type === 'both-all') {
                return (
                    scopeLabel +
                    fulfillLabel +
                    '已有「全部标签、全部类目」策略「' +
                    row.name +
                    '」'
                );
            }
            if (tagHit.type === 'shared') {
                return scopeLabel + fulfillLabel + '标签「' + tagHit.name + '」已在策略「' + row.name + '」中配置';
            }
            if (catHit.type === 'shared') {
                return scopeLabel + fulfillLabel + '类目「' + catHit.name + '」已在策略「' + row.name + '」中配置';
            }
            return scopeLabel + fulfillLabel + '已与策略「' + row.name + '」重叠';
        }
        return '';
    }

    function renderTable() {
        Object.keys(state.selected).forEach(function (id) {
            if (!canDeleteStrategy(findRow(id))) delete state.selected[id];
        });
        var tbody = $('cutoffTableBody');
        var empty = $('cutoffEmpty');
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
                    var checked = !!state.selected[row.id];
                    var deletable = canDeleteStrategy(row);
                    var nameExtra = isDefaultStrategy(row)
                        ? '<span class="cutoff-default-tag">兜底</span>'
                        : '';
                    var toggleBtn = canStopStrategy(row)
                        ? '<button type="button" class="sf-link js-cutoff-toggle">' +
                          (row.status === 'active' ? '停用' : '启用') +
                          '</button>'
                        : '';
                    var payRule = cutoffModeOf(row) === 'after_pay';
                    return (
                        '<tr class="' +
                        (checked ? 'is-selected' : '') +
                        '" data-id="' +
                        escapeHtml(row.id) +
                        '">' +
                        '<td class="sf-table__check"><input type="checkbox" class="cutoff-row-check" data-id="' +
                        escapeHtml(row.id) +
                        '"' +
                        (checked ? ' checked' : '') +
                        (deletable ? '' : ' disabled') +
                        '></td>' +
                        '<td class="sf-table__index">' +
                        index +
                        '</td>' +
                        '<td><a href="#" class="sf-link js-cutoff-name">' +
                        escapeHtml(row.name) +
                        '</a>' +
                        nameExtra +
                        '</td>' +
                        '<td title="' +
                        escapeHtml(channelText(row)) +
                        '">' +
                        escapeHtml(channelText(row)) +
                        '</td>' +
                        '<td title="' +
                        escapeHtml(fulfillmentText(row)) +
                        '">' +
                        escapeHtml(fulfillmentText(row)) +
                        '</td>' +
                        '<td title="' +
                        escapeHtml(tagText(row)) +
                        '">' +
                        escapeHtml(tagText(row)) +
                        '</td>' +
                        '<td title="' +
                        escapeHtml(categoryText(row)) +
                        '">' +
                        escapeHtml(categoryText(row)) +
                        '</td>' +
                        '<td><span class="cutoff-rule-text' +
                        (payRule ? ' is-pay' : '') +
                        '">' +
                        escapeHtml(ruleText(row)) +
                        '</span></td>' +
                        '<td><span class="cutoff-status ' +
                        statusClass(row.status) +
                        '">' +
                        escapeHtml(statusText(row.status)) +
                        '</span></td>' +
                        '<td class="sf-table__action"><div class="sf-action-cell">' +
                        '<button type="button" class="sf-link js-cutoff-edit">修改</button>' +
                        toggleBtn +
                        '</div></td>' +
                        '</tr>'
                    );
                })
                .join('');
        }

        var checkAll = $('cutoffCheckAll');
        if (checkAll) {
            var ids = pageData.rows.filter(canDeleteStrategy).map(function (r) {
                return r.id;
            });
            var allChecked =
                ids.length > 0 &&
                ids.every(function (id) {
                    return state.selected[id];
                });
            checkAll.checked = allChecked;
            checkAll.indeterminate = !allChecked && ids.some(function (id) {
                return state.selected[id];
            });
            checkAll.disabled = ids.length === 0;
        }

        renderPagination(pageData.total);
        syncDeleteBtn();
    }

    function renderPagination(total) {
        var totalEl = $('cutoffPaginationTotal');
        var pagesEl = $('cutoffPaginationPages');
        var sizeEl = $('cutoffPageSize');
        var jumpEl = $('cutoffJumpPage');
        if (totalEl) totalEl.textContent = '共 ' + total + ' 条';
        if (sizeEl && !sizeEl.options.length) {
            PAGE_SIZE_OPTIONS.forEach(function (n) {
                var opt = document.createElement('option');
                opt.value = String(n);
                opt.textContent = n + ' 条/页';
                sizeEl.appendChild(opt);
            });
        }
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
        state.editId = null;
        state.formCategories = [];
        state.formTags = [];
    }

    function updateTimeTip(time) {
        var tip = $('cutoffFormTimeTip');
        if (!tip) return;
        var t = normalizeTime(time) || '10:00:00';
        var prev = subtractOneSecond(t);
        tip.textContent =
            '每次截单覆盖「上次该时刻 ～ 本次前一秒」。例：今天 ' + t + ' 截昨天 ' + t + ' 至今天 ' + prev + ' 的订单。';
    }

    function renderNamedRows(listElId, rows, removeAttr) {
        var listEl = $(listElId);
        if (!listEl) return [];
        var normalized = normalizeNamedList(rows);
        if (!normalized.length) {
            listEl.innerHTML = '';
            return normalized;
        }
        listEl.innerHTML = normalized
            .map(function (row) {
                return (
                    '<div class="cutoff-cat-row" data-item-id="' +
                    escapeHtml(row.id) +
                    '"><span>' +
                    escapeHtml(row.name) +
                    '</span><button type="button" class="sf-link" ' +
                    removeAttr +
                    '>删除</button></div>'
                );
            })
            .join('');
        return normalized;
    }

    function renderFormCategories() {
        state.formCategories = renderNamedRows('cutoffFormCatList', state.formCategories, 'data-cat-remove');
    }

    function renderFormTags() {
        state.formTags = renderNamedRows('cutoffFormTagList', state.formTags, 'data-tag-remove');
    }

    function syncScopeBox(name, boxId) {
        var checked = document.querySelector('input[name="' + name + '"]:checked');
        var box = $(boxId);
        if (!box) return;
        box.hidden = !(checked && checked.value === 'specified');
    }

    function syncCategoryScopeUi() {
        syncScopeBox('cutoffFormCatScope', 'cutoffFormCatBox');
    }

    function syncTagScopeUi() {
        syncScopeBox('cutoffFormTagScope', 'cutoffFormTagBox');
    }

    function syncFulfillmentScopeUi() {
        syncScopeBox('cutoffFormFulfillScope', 'cutoffFormFulfillBox');
    }

    function syncCutoffModeUi() {
        var modeEl = document.querySelector('input[name="cutoffFormMode"]:checked');
        var isPay = modeEl && modeEl.value === 'after_pay';
        var timeItem = $('cutoffFormTimeItem');
        var payTip = $('cutoffFormPayTip');
        if (timeItem) timeItem.hidden = !!isPay;
        if (payTip) payTip.hidden = !isPay;
    }

    function syncChannelSceneUi() {
        var hasRetailChecked = checkedValues('cutoffFormChannel', CHANNEL_IDS).indexOf('retail') >= 0;
        var item = $('cutoffFormSceneItem');
        if (item) item.hidden = !hasRetailChecked;
    }

    function renderFulfillmentChecks(selectedIds) {
        var box = $('cutoffFormFulfillBox');
        if (!box) return;
        var channels = checkedValues('cutoffFormChannel', CHANNEL_IDS);
        var allowed = fulfillmentIdsForChannels(channels);
        var selected = (selectedIds || []).filter(function (id) {
            return allowed.indexOf(id) >= 0;
        });
        if (!allowed.length) {
            box.innerHTML = '<div class="cutoff-form-tip">请先选择订单渠道，再指定履约方式</div>';
            return;
        }
        box.innerHTML = CHANNEL_IDS.filter(function (ch) {
            return channels.indexOf(ch) >= 0;
        })
            .map(function (ch) {
                var opts = (CHANNEL_FULFILLMENTS[ch] || [])
                    .map(function (id) {
                        return (
                            '<label><input type="checkbox" name="cutoffFormFulfillment" value="' +
                            id +
                            '"' +
                            (selected.indexOf(id) >= 0 ? ' checked' : '') +
                            '> ' +
                            FULFILLMENT_NAME[id] +
                            '</label>'
                        );
                    })
                    .join('');
                if (channels.length > 1) {
                    return (
                        '<div class="cutoff-fulfill-group"><div class="cutoff-fulfill-group__label">' +
                        CHANNEL_LABEL[ch] +
                        '</div><div class="cutoff-radio-row">' +
                        opts +
                        '</div></div>'
                    );
                }
                return '<div class="cutoff-radio-row">' + opts + '</div>';
            })
            .join('');
    }

    function syncChannelDependentUi(selectedIds) {
        syncChannelSceneUi();
        var keep = selectedIds || checkedValues('cutoffFormFulfillment', FULFILLMENT_IDS);
        renderFulfillmentChecks(keep);
        syncFulfillmentScopeUi();
    }

    function openNamedPicker(title, catalog, selectedRows, emptyText, onOk) {
        if (!catalog.length) {
            toast(emptyText, 'warning');
            return;
        }
        var selectedMap = {};
        selectedRows.forEach(function (row) {
            selectedMap[row.id] = true;
        });

        var backdrop = document.createElement('div');
        backdrop.className = 'pts-rule-pick-backdrop cutoff-pick-backdrop';
        backdrop.innerHTML =
            '<div class="pts-rule-pick-modal" role="dialog" aria-modal="true">' +
            '  <div class="pts-rule-pick-modal__header">' +
            '    <h3 class="pts-rule-pick-modal__title">' +
            escapeHtml(title) +
            '</h3>' +
            '    <button type="button" class="pts-rule-pick-modal__close" data-pick-close aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__body">' +
            '    <input class="erp-input pts-rule-pick-filter" type="text" placeholder="输入名称筛选" data-pick-filter>' +
            '    <div class="pts-rule-pick-list" data-pick-list></div>' +
            '  </div>' +
            '  <div class="pts-rule-pick-modal__footer">' +
            '    <button type="button" class="erp-btn" data-pick-close>取消</button>' +
            '    <button type="button" class="erp-btn erp-btn--primary" data-pick-ok>确定</button>' +
            '  </div>' +
            '</div>';

        var listEl = backdrop.querySelector('[data-pick-list]');
        var filterEl = backdrop.querySelector('[data-pick-filter]');

        function renderList(keyword) {
            var kw = String(keyword || '').trim().toLowerCase();
            var filtered = catalog.filter(function (it) {
                if (!kw) return true;
                return String(it.name).toLowerCase().indexOf(kw) !== -1;
            });
            if (!filtered.length) {
                listEl.innerHTML = '<div class="pts-rule-pick-empty">无匹配项</div>';
                return;
            }
            listEl.innerHTML = filtered
                .map(function (it) {
                    return (
                        '<label class="pts-rule-pick-item"><input type="checkbox" value="' +
                        escapeHtml(it.id) +
                        '"' +
                        (selectedMap[it.id] ? ' checked' : '') +
                        '><span>' +
                        escapeHtml(it.name) +
                        '</span></label>'
                    );
                })
                .join('');
        }

        renderList('');
        filterEl.addEventListener('input', function () {
            renderList(filterEl.value);
        });
        listEl.addEventListener('change', function (ev) {
            var input = ev.target;
            if (!input || input.type !== 'checkbox') return;
            if (input.checked) selectedMap[input.value] = true;
            else delete selectedMap[input.value];
        });

        function close() {
            backdrop.remove();
        }
        backdrop.addEventListener('click', function (ev) {
            if (ev.target === backdrop) close();
        });
        backdrop.querySelectorAll('[data-pick-close]').forEach(function (btn) {
            btn.addEventListener('click', close);
        });
        backdrop.querySelector('[data-pick-ok]').addEventListener('click', function () {
            onOk(
                catalog.filter(function (it) {
                    return !!selectedMap[it.id];
                })
            );
            close();
        });
        document.body.appendChild(backdrop);
        filterEl.focus();
    }

    function openCategoryPicker() {
        openNamedPicker('选择商品类目', getCatalogCategories(), state.formCategories, '暂无选品库类目', function (rows) {
            state.formCategories = rows;
            renderFormCategories();
        });
    }

    function openTagPicker() {
        openNamedPicker('选择商品标签', getCatalogTags(), state.formTags, '暂无商品标签', function (rows) {
            state.formTags = rows;
            renderFormTags();
        });
    }

    function checkedValues(name, allow) {
        var out = [];
        document.querySelectorAll('input[name="' + name + '"]:checked').forEach(function (input) {
            if (!allow || allow.indexOf(input.value) >= 0) out.push(input.value);
        });
        return out;
    }

    function readDrawerForm() {
        var fulfillScopeEl = document.querySelector('input[name="cutoffFormFulfillScope"]:checked');
        var tagScopeEl = document.querySelector('input[name="cutoffFormTagScope"]:checked');
        var catScopeEl = document.querySelector('input[name="cutoffFormCatScope"]:checked');
        var modeEl = document.querySelector('input[name="cutoffFormMode"]:checked');
        var fulfillScope = fulfillScopeEl && fulfillScopeEl.value === 'specified' ? 'specified' : 'all';
        var tagScope = tagScopeEl && tagScopeEl.value === 'specified' ? 'specified' : 'all';
        var catScope = catScopeEl && catScopeEl.value === 'specified' ? 'specified' : 'all';
        var channels = checkedValues('cutoffFormChannel', CHANNEL_IDS);
        return {
            id: state.editId || nextId(),
            name: ($('cutoffFormName') && $('cutoffFormName').value) || '',
            channels: channels,
            scenes: channels.indexOf('retail') >= 0 ? checkedValues('cutoffFormScene', ['live', 'mall']) : [],
            fulfillmentScope: fulfillScope,
            fulfillments: fulfillScope === 'specified' ? checkedValues('cutoffFormFulfillment', FULFILLMENT_IDS) : [],
            cutoffMode: modeEl && modeEl.value === 'after_pay' ? 'after_pay' : 'time',
            cutoffTime: ($('cutoffFormTime') && $('cutoffFormTime').value) || '',
            tagScope: tagScope,
            tags: tagScope === 'specified' ? normalizeNamedList(state.formTags) : [],
            categoryScope: catScope,
            categories: catScope === 'specified' ? normalizeNamedList(state.formCategories) : [],
            userDesc: ($('cutoffFormDesc') && $('cutoffFormDesc').value) || ''
        };
    }

    function validateStrategy(row, ignoreId) {
        if (!String(row.name || '').trim()) return '请输入策略名称';
        if (!inferChannels(row).length) return '请至少选择一个订单渠道';
        if (hasRetail(row) && !normalizeScenes(row).length) return '请至少选择一个适用场景';
        if (row.fulfillmentScope === 'specified' && !fulfillmentIdsOf(row).length) return '请选择履约方式';
        if (cutoffModeOf(row) === 'time' && !normalizeTime(row.cutoffTime)) return '请填写截单时间';
        if (row.tagScope === 'specified' && !row.tags.length) return '请选择商品标签';
        if (row.categoryScope === 'specified' && !row.categories.length) return '请选择商品类目';
        return overlapError(row, ignoreId);
    }

    function openDrawer(row, mode) {
        closeDrawer();
        var isView = mode === 'view';
        var isEdit = !!row && !isView;
        var isCreate = !row;
        state.editId = isEdit || isView ? row.id : null;
        state.formCategories = isCreate ? [] : normalizeNamedList(row.categories);
        state.formTags = isCreate ? [] : normalizeNamedList(row.tags);

        var backdrop = el('div', 'sf-drawer-backdrop' + (isView ? ' is-view' : ''));
        var drawer = el('aside', 'sf-drawer' + (isView ? ' sf-drawer--view' : ''));
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');

        var header = el('div', 'sf-drawer__header');
        header.appendChild(
            el('h2', 'sf-drawer__title', isView ? '截单策略详情' : isEdit ? '修改截单策略' : '新增截单策略')
        );
        var closeBtn = el('button', 'sf-drawer__close');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.innerHTML = '&times;';
        header.appendChild(closeBtn);

        var channels = isCreate ? ['retail'] : inferChannels(row);
        var scenes = isCreate ? ['live', 'mall'] : normalizeScenes(row);
        var fulfillScope = isCreate ? 'specified' : isAllFulfillment(row) ? 'all' : 'specified';
        var fulfillments = isCreate ? ['express_home'] : fulfillmentIdsOf(row);
        var tagScope = isCreate ? 'all' : row.tagScope;
        var catScope = isCreate ? 'all' : row.categoryScope;
        var cutoffMode = isCreate ? 'time' : cutoffModeOf(row);
        var time = isCreate ? '10:00:00' : row.cutoffTime || '10:00:00';

        var body = el('div', 'sf-drawer__body');
        body.innerHTML =
            '<section class="sf-section" id="cutoffBasicSection">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">基本信息</h3></div>' +
            '  <div class="sf-section__body"><div class="sf-form-grid">' +
            '    <div class="sf-form-item"><div class="sf-form-item__label"><span class="sf-req">*</span>策略名称</div>' +
            '      <div class="sf-form-item__control"><input class="sf-input" id="cutoffFormName" placeholder="请输入策略名称"></div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>订单渠道</div>' +
            '      <div class="sf-form-item__control"><div class="cutoff-radio-row">' +
            '        <label><input type="checkbox" name="cutoffFormChannel" value="retail"> 零售</label>' +
            '        <label><input type="checkbox" name="cutoffFormChannel" value="proxy"> 代采</label>' +
            '      </div><div class="cutoff-form-tip">可同时勾选。零售履约：快递到家、门店自提；代采履约：平台配送、快递配送。代采不区分直播 / 商城。</div></div></div>' +
            '    <div class="sf-form-item sf-form-item--wide sf-form-item--nested" id="cutoffFormSceneItem"><div class="sf-form-item__label"><span class="sf-req">*</span>适用场景</div>' +
            '      <div class="sf-form-item__control"><div class="cutoff-radio-row">' +
            '        <label><input type="checkbox" name="cutoffFormScene" value="live"> 直播</label>' +
            '        <label><input type="checkbox" name="cutoffFormScene" value="mall"> 商城</label>' +
            '      </div><div class="cutoff-form-tip" id="cutoffFormSceneTip">仅零售订单区分直播 / 商城，可同时勾选。</div></div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>履约方式</div>' +
            '      <div class="sf-form-item__control">' +
            '        <div class="cutoff-radio-row">' +
            '          <label><input type="radio" name="cutoffFormFulfillScope" value="all"> 全部履约方式</label>' +
            '          <label><input type="radio" name="cutoffFormFulfillScope" value="specified"> 指定履约方式</label>' +
            '        </div>' +
            '        <div id="cutoffFormFulfillBox" hidden></div>' +
            '        <div class="cutoff-form-tip">履约方式随订单渠道变化。指定履约优先于「全部履约方式」。门店订货汇总的自动截单已并入本页，按履约方式配置即可。</div>' +
            '      </div></div>' +
            '  </div></div>' +
            '</section>' +
            '<section class="sf-section" id="cutoffRuleSection">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">截单规则</h3></div>' +
            '  <div class="sf-section__body"><div class="sf-form-grid">' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>截单方式</div>' +
            '      <div class="sf-form-item__control">' +
            '        <div class="cutoff-radio-row">' +
            '          <label><input type="radio" name="cutoffFormMode" value="time"> 每日定时</label>' +
            '          <label><input type="radio" name="cutoffFormMode" value="after_pay"> 支付后自动截单</label>' +
            '        </div>' +
            '        <div class="cutoff-form-tip" id="cutoffFormPayTip" hidden>支付成功即写入已截单，对客直接进入「待发货」，不再停留待接单。仓配类仍会生成门店订货单。</div>' +
            '      </div></div>' +
            '    <div class="sf-form-item" id="cutoffFormTimeItem"><div class="sf-form-item__label"><span class="sf-req">*</span>截单时间</div>' +
            '      <div class="sf-form-item__control"><input class="sf-input" id="cutoffFormTime" type="time" step="1">' +
            '      <div class="cutoff-form-tip" id="cutoffFormTimeTip"></div></div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>商品标签</div>' +
            '      <div class="sf-form-item__control">' +
            '        <div class="cutoff-radio-row">' +
            '          <label><input type="radio" name="cutoffFormTagScope" value="all"> 全部标签</label>' +
            '          <label><input type="radio" name="cutoffFormTagScope" value="specified"> 指定商品标签</label>' +
            '        </div>' +
            '        <div id="cutoffFormTagBox" hidden>' +
            '          <div class="cutoff-cat-list" id="cutoffFormTagList"></div>' +
            '          <button type="button" class="sf-btn" id="cutoffFormTagAdd">+ 添加商品标签</button>' +
            '        </div>' +
            '        <div class="cutoff-form-tip">同一履约下指定标签优先于「全部标签」。</div>' +
            '      </div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label"><span class="sf-req">*</span>商品类目</div>' +
            '      <div class="sf-form-item__control">' +
            '        <div class="cutoff-radio-row">' +
            '          <label><input type="radio" name="cutoffFormCatScope" value="all"> 全部类目</label>' +
            '          <label><input type="radio" name="cutoffFormCatScope" value="specified"> 指定选品库类目</label>' +
            '        </div>' +
            '        <div id="cutoffFormCatBox" hidden>' +
            '          <div class="cutoff-cat-list" id="cutoffFormCatList"></div>' +
            '          <button type="button" class="sf-btn" id="cutoffFormCatAdd">+ 添加商品类目</button>' +
            '        </div>' +
            '        <div class="cutoff-form-tip">同一履约下指定类目优先于「全部类目」。未单独配置的走该履约的兜底策略。</div>' +
            '      </div></div>' +
            '    <div class="sf-form-item sf-form-item--wide"><div class="sf-form-item__label">备注</div>' +
            '      <div class="sf-form-item__control"><textarea class="sf-input" id="cutoffFormDesc" placeholder="选填，对该策略的说明解释"></textarea>' +
            '      <div class="cutoff-form-tip">非必填，仅后台查看，不会展示给用户。</div></div></div>' +
            '  </div></div>' +
            '</section>' +
            '<section class="sf-section">' +
            '  <div class="sf-section__head"><h3 class="sf-section__title">截单后</h3></div>' +
            '  <div class="sf-section__body">' +
            '    <ul class="cutoff-after-list">' +
            '      <li>用户 APP「取消订单」隐藏</li>' +
            '      <li>「申请退款」截断免审直退，改为售后审核流</li>' +
            '    </ul>' +
            '    <div class="cutoff-form-tip">各策略统一，相当于把发货后的售后方式提前到截单时刻。已发货订单按发货后规则，不受本页时刻影响。</div>' +
            '  </div>' +
            '</section>';

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

        $('cutoffFormName').value = isCreate ? '' : row.name || '';
        $('cutoffFormTime').value = time;
        $('cutoffFormDesc').value = isCreate ? '' : row.userDesc || '';
        document.querySelectorAll('input[name="cutoffFormChannel"]').forEach(function (r) {
            r.checked = channels.indexOf(r.value) >= 0;
        });
        document.querySelectorAll('input[name="cutoffFormScene"]').forEach(function (r) {
            r.checked = scenes.indexOf(r.value) >= 0;
        });
        document.querySelectorAll('input[name="cutoffFormFulfillScope"]').forEach(function (r) {
            r.checked = r.value === fulfillScope;
        });
        document.querySelectorAll('input[name="cutoffFormTagScope"]').forEach(function (r) {
            r.checked = r.value === tagScope;
        });
        document.querySelectorAll('input[name="cutoffFormCatScope"]').forEach(function (r) {
            r.checked = r.value === catScope;
        });
        document.querySelectorAll('input[name="cutoffFormMode"]').forEach(function (r) {
            r.checked = r.value === cutoffMode;
        });
        renderFormCategories();
        renderFormTags();
        syncChannelDependentUi(fulfillScope === 'specified' ? fulfillments : []);
        syncTagScopeUi();
        syncCategoryScopeUi();
        syncCutoffModeUi();
        updateTimeTip(time);

        var sceneTip = $('cutoffFormSceneTip');
        var editingDefault = !isCreate && isDefaultStrategy(row);
        if (editingDefault) {
            document
                .querySelectorAll(
                    'input[name="cutoffFormChannel"], input[name="cutoffFormScene"], input[name="cutoffFormFulfillScope"], input[name="cutoffFormFulfillment"], input[name="cutoffFormTagScope"], input[name="cutoffFormCatScope"]'
                )
                .forEach(function (input) {
                    input.disabled = true;
                });
            var tagAdd = $('cutoffFormTagAdd');
            var catAdd = $('cutoffFormCatAdd');
            if (tagAdd) tagAdd.disabled = true;
            if (catAdd) catAdd.disabled = true;
            if (sceneTip) {
                sceneTip.textContent =
                    '系统只兜零售快递到家（直播+商城、全部标签、全部类目）。仅可修改名称、截单方式、截单时间和备注，不支持停用或删除。不做全渠道通用兜底。';
            }
        } else if (sceneTip) {
            sceneTip.textContent = isCreate
                ? '仅零售订单区分直播 / 商城。同一渠道 + 同一履约 + 同标签 + 同类目不可与其它策略重叠。保存后为草稿，需在列表手动启用。'
                : '仅零售订单区分直播 / 商城。同一渠道 + 同一履约 + 同标签 + 同类目不可与其它策略重叠。启用中的策略保存后将停用，需在列表手动启用。';
        }

        if (isView) {
            backdrop.querySelectorAll('input, textarea, button#cutoffFormCatAdd, button#cutoffFormTagAdd').forEach(
                function (input) {
                    if (input === closeBtn || input === backBtn) return;
                    input.disabled = true;
                }
            );
        }

        function shut() {
            closeDrawer();
        }
        closeBtn.addEventListener('click', shut);
        backBtn.addEventListener('click', shut);
        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) shut();
        });

        if (isView) return;

        $('cutoffFormTime').addEventListener('input', function () {
            updateTimeTip($('cutoffFormTime').value);
        });
        $('cutoffFormTime').addEventListener('change', function () {
            updateTimeTip($('cutoffFormTime').value);
        });
        document.querySelectorAll('input[name="cutoffFormCatScope"]').forEach(function (r) {
            r.addEventListener('change', syncCategoryScopeUi);
        });
        document.querySelectorAll('input[name="cutoffFormTagScope"]').forEach(function (r) {
            r.addEventListener('change', syncTagScopeUi);
        });
        document.querySelectorAll('input[name="cutoffFormChannel"]').forEach(function (r) {
            r.addEventListener('change', function () {
                syncChannelDependentUi();
            });
        });
        document.querySelectorAll('input[name="cutoffFormFulfillScope"]').forEach(function (r) {
            r.addEventListener('change', syncFulfillmentScopeUi);
        });
        document.querySelectorAll('input[name="cutoffFormMode"]').forEach(function (r) {
            r.addEventListener('change', syncCutoffModeUi);
        });
        var addCatBtn = $('cutoffFormCatAdd');
        if (addCatBtn) addCatBtn.addEventListener('click', openCategoryPicker);
        var addTagBtn = $('cutoffFormTagAdd');
        if (addTagBtn) addTagBtn.addEventListener('click', openTagPicker);
        var catListEl = $('cutoffFormCatList');
        if (catListEl) {
            catListEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-cat-remove]');
                if (!btn) return;
                var wrap = btn.closest('[data-item-id]');
                var id = wrap && wrap.getAttribute('data-item-id');
                state.formCategories = state.formCategories.filter(function (c) {
                    return c.id !== id;
                });
                renderFormCategories();
            });
        }
        var tagListEl = $('cutoffFormTagList');
        if (tagListEl) {
            tagListEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-tag-remove]');
                if (!btn) return;
                var wrap = btn.closest('[data-item-id]');
                var id = wrap && wrap.getAttribute('data-item-id');
                state.formTags = state.formTags.filter(function (c) {
                    return c.id !== id;
                });
                renderFormTags();
            });
        }

        saveBtn.addEventListener('click', function () {
            var draft = normalizeStrategy(readDrawerForm());
            if (!draft) {
                toast('请完善策略信息', 'warning');
                return;
            }
            var prev = isEdit ? findRow(state.editId) : null;
            if (prev && isDefaultStrategy(prev)) {
                applyDefaultLocks(draft);
                draft.cutoffMode = cutoffModeOf(draft);
                draft.cutoffTime = draft.cutoffMode === 'after_pay' ? '' : normalizeTime(draft.cutoffTime) || '10:00:00';
                draft.userDesc = ($('cutoffFormDesc') && $('cutoffFormDesc').value) || '';
            } else {
                draft.isDefault = false;
                if (prev && prev.status === 'active') draft.status = 'stopped';
                else if (prev) draft.status = prev.status || 'draft';
                else draft.status = 'draft';
            }
            var err = validateStrategy(draft, isEdit ? state.editId : '');
            if (err) {
                toast(err, 'warning');
                return;
            }
            if (isEdit) {
                state.strategies = state.strategies.map(function (item) {
                    return item.id === state.editId ? draft : item;
                });
                if (isDefaultStrategy(draft)) toast('兜底策略已保存');
                else if (prev && prev.status === 'active') toast('已保存并停用，请手动启用');
                else if (draft.status === 'draft') toast('已保存为草稿，请手动启用');
                else toast('已保存，请手动启用');
            } else {
                state.strategies.unshift(draft);
                toast('已保存为草稿，请手动启用');
            }
            saveStrategies();
            closeDrawer();
            renderTable();
        });
    }

    function bindPage() {
        var queryBtn = $('cutoffFilterQuery');
        var resetBtn = $('cutoffFilterReset');
        var collapseBtn = $('cutoffFilterCollapse');
        var addBtn = $('cutoffAddBtn');
        var deleteBtn = $('cutoffDeleteBtn');
        var checkAll = $('cutoffCheckAll');
        var refreshBtn = $('cutoffRefreshBtn');
        var sizeEl = $('cutoffPageSize');
        var jumpGo = $('cutoffJumpGo');
        var pagesEl = $('cutoffPaginationPages');
        var tbody = $('cutoffTableBody');

        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                state.keywordName = ($('cutoffFilterName') && $('cutoffFilterName').value) || '';
                state.filterChannel = ($('cutoffFilterChannel') && $('cutoffFilterChannel').value) || '';
                state.filterFulfillment = ($('cutoffFilterFulfillment') && $('cutoffFilterFulfillment').value) || '';
                state.filterMode = ($('cutoffFilterMode') && $('cutoffFilterMode').value) || '';
                state.filterStatus = ($('cutoffFilterStatus') && $('cutoffFilterStatus').value) || '';
                state.page = 1;
                renderTable();
            });
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if ($('cutoffFilterName')) $('cutoffFilterName').value = '';
                if ($('cutoffFilterChannel')) $('cutoffFilterChannel').value = '';
                if ($('cutoffFilterFulfillment')) $('cutoffFilterFulfillment').value = '';
                if ($('cutoffFilterMode')) $('cutoffFilterMode').value = '';
                if ($('cutoffFilterStatus')) $('cutoffFilterStatus').value = '';
                state.keywordName = '';
                state.filterChannel = '';
                state.filterFulfillment = '';
                state.filterMode = '';
                state.filterStatus = '';
                state.page = 1;
                renderTable();
            });
        }
        if (collapseBtn) {
            collapseBtn.addEventListener('click', function () {
                state.collapsed = !state.collapsed;
                var grid = $('cutoffFilterGrid');
                var label = $('cutoffFilterCollapseLabel');
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
                var ids = selectedCodes();
                if (!ids.length) {
                    toast('请先勾选要删除的策略', 'warning');
                    return;
                }
                var removable = ids.filter(function (id) {
                    return canDeleteStrategy(findRow(id));
                });
                var blocked = ids.length - removable.length;
                if (!removable.length) {
                    toast('启用中的策略和兜底策略不支持删除', 'warning');
                    return;
                }
                if (
                    !window.confirm(
                        '确认删除选中的 ' +
                            removable.length +
                            ' 条截单策略吗？仅草稿、停用状态可删除。'
                    )
                ) {
                    return;
                }
                state.strategies = state.strategies.filter(function (row) {
                    if (removable.indexOf(row.id) >= 0) {
                        delete state.selected[row.id];
                        return false;
                    }
                    return true;
                });
                saveStrategies();
                state.page = 1;
                renderTable();
                toast(
                    blocked
                        ? '已删除 ' + removable.length + ' 条，其余不可删除已跳过'
                        : '已删除选中策略'
                );
            });
        }
        if (checkAll) {
            checkAll.addEventListener('change', function () {
                pageRows().rows.forEach(function (row) {
                    if (!canDeleteStrategy(row)) {
                        delete state.selected[row.id];
                        return;
                    }
                    if (checkAll.checked) state.selected[row.id] = true;
                    else delete state.selected[row.id];
                });
                renderTable();
            });
        }
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function () {
                renderTable();
                toast('列表已刷新', 'info');
            });
        }
        if (sizeEl) {
            sizeEl.addEventListener('change', function () {
                state.pageSize = Number(sizeEl.value) || 20;
                state.page = 1;
                renderTable();
            });
        }
        if (jumpGo) {
            jumpGo.addEventListener('click', function () {
                var page = parseInt(($('cutoffJumpPage') && $('cutoffJumpPage').value) || '1', 10);
                if (!page || page < 1) page = 1;
                state.page = page;
                renderTable();
            });
        }
        if (pagesEl) {
            pagesEl.addEventListener('click', function (ev) {
                var btn = ev.target.closest('[data-page]');
                if (!btn || btn.disabled) return;
                var page = parseInt(btn.getAttribute('data-page'), 10);
                if (!page || page < 1) return;
                state.page = page;
                renderTable();
            });
        }
        if (tbody) {
            tbody.addEventListener('change', function (ev) {
                var box = ev.target.closest('.cutoff-row-check');
                if (!box) return;
                var id = box.getAttribute('data-id');
                var checkedRow = findRow(id);
                if (!canDeleteStrategy(checkedRow)) {
                    box.checked = false;
                    delete state.selected[id];
                    toast(
                        isDefaultStrategy(checkedRow)
                            ? '兜底策略不支持删除'
                            : '启用中的策略不支持删除',
                        'warning'
                    );
                    renderTable();
                    return;
                }
                if (box.checked) state.selected[id] = true;
                else delete state.selected[id];
                renderTable();
            });
            tbody.addEventListener('click', function (ev) {
                var tr = ev.target.closest('tr[data-id]');
                if (!tr) return;
                var id = tr.getAttribute('data-id');
                var row = findRow(id);
                if (!row) return;
                if (ev.target.closest('.js-cutoff-name')) {
                    ev.preventDefault();
                    openDrawer(row, 'view');
                    return;
                }
                if (ev.target.closest('.js-cutoff-edit')) {
                    openDrawer(row, 'edit');
                    return;
                }
                if (ev.target.closest('.js-cutoff-toggle')) {
                    if (!canStopStrategy(row)) {
                        toast('兜底策略不支持停用', 'warning');
                        return;
                    }
                    row.status = row.status === 'active' ? 'stopped' : 'active';
                    saveStrategies();
                    renderTable();
                    toast(row.status === 'active' ? '策略已启用' : '策略已停用');
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        state.strategies = loadStrategies();
        saveStrategies();
        bindPage();
        renderTable();
    });
})();
