/**
 * 门店 H5：跨页面字段同步（sessionStorage）。
 * data-sh5-sync="key" → 元素的 textContent/value 与子节点 .sh5-sync-target
 * input/textarea/select 使用 data-sh5-bind="key"
 */
(function () {
    var STORAGE_KEY = 'storeH5_cross_page';

    function read() {
        try {
            return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function write(obj) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }

    function defaults() {
        return {
            storeName: '示例旗舰店',
            storeDraftName: '草稿·滨江便利店',
            storeAbbrev: '',
            bdName: '张三',
            bdCode: 'DEMO001',
            bdAccount: 'BD20240001',
            submitTime: '2026-05-09 10:12',
            warehouse: '默认：华东 RDC-仓储（与当前 BD 关联）',
            cooperationType: '加盟店 / 合作店 / 同行店',
            storeEntity: '',
            detailAddress: '杭州市滨江区网商路 XX 号',
            franchiseContractNo: '',
            contactName: ''
        };
    }

    window.StoreH5Sync = {
        read: read,
        set: function (patch) {
            var next = Object.assign(read(), patch);
            write(next);
            return next;
        },
        initDefaults: function () {
            var cur = read();
            var d = defaults();
            var empty = Object.keys(cur).length === 0;
            Object.keys(d).forEach(function (k) {
                if (empty || cur[k] === undefined || cur[k] === '') {
                    cur[k] = d[k];
                }
            });
            write(cur);
            return cur;
        },
        applyDom: function () {
            var state = read();
            document.querySelectorAll('[data-sh5-sync]').forEach(function (el) {
                var key = el.getAttribute('data-sh5-sync');
                if (key && state[key] != null) {
                    var t = el.querySelector('.sh5-sync-target');
                    if (t) {
                        t.textContent = state[key];
                    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                        if (!el.dataset.sh5Touched) {
                            el.value = state[key];
                        }
                    } else {
                        el.textContent = state[key];
                    }
                }
            });
        },
        bindInputs: function () {
            function saveFrom(el) {
                var key = el.getAttribute('data-sh5-bind');
                if (!key) {
                    return;
                }
                el.dataset.sh5Touched = '1';
                var patch = {};
                patch[key] = el.value;
                window.StoreH5Sync.set(patch);
            }
            document.querySelectorAll('[data-sh5-bind]').forEach(function (el) {
                el.addEventListener('change', function () {
                    saveFrom(el);
                });
                el.addEventListener('blur', function () {
                    saveFrom(el);
                });
            });
        },
        collectForm: function (root) {
            var patch = {};
            (root || document).querySelectorAll('[data-sh5-bind]').forEach(function (el) {
                var key = el.getAttribute('data-sh5-bind');
                if (key) {
                    patch[key] = el.value;
                }
            });
            return patch;
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        if (document.body && document.body.classList.contains('sh5')) {
            window.StoreH5Sync.initDefaults();
            window.StoreH5Sync.bindInputs();
            window.StoreH5Sync.applyDom();
        }
    });
})();
