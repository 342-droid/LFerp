/**
 * 首页 index.html 位于项目根目录，mdm*.html 位于 MDM/，crm*.html 位于 CRM/，其余业务页位于 SCM/；shop-h5/ 等为根目录下静态页。
 * 本文件必须在 wms-sidebar / mdm-sidebar / common 等脚本之前加载。
 */
(function () {
    function normPath(p) {
        return String(p || '').replace(/\\/g, '/');
    }
    function inScmFolder() {
        var p = normPath(window.location.pathname || '');
        return /\/scm\//i.test(p) || /\/scm$/i.test(p);
    }
    function inMdmFolder() {
        var p = normPath(window.location.pathname || '');
        return /\/MDM\//i.test(p) || /\/MDM$/i.test(p);
    }
    function inCrmFolder() {
        var p = normPath(window.location.pathname || '');
        return /\/CRM\//i.test(p) || /\/CRM$/i.test(p);
    }
    function inSubModuleFolder() {
        return inScmFolder() || inMdmFolder() || inCrmFolder();
    }
    function page(filename) {
        filename = normPath(filename);
        /** shop-h5 / user-app 静态目录：自根目录起的相对路径 */
        if (/^(shop-h5|user-app)\//i.test(filename)) {
            var up = inSubModuleFolder() ? '../' : '';
            return up + filename;
        }
        if (filename === 'index.html') {
            if (inSubModuleFolder()) return '../index.html';
            return 'index.html';
        }
        var m = /^mdm/i.test(filename);
        var c = /^crm/i.test(filename);
        if (inScmFolder()) {
            if (m) return '../MDM/' + filename;
            if (c) return '../CRM/' + filename;
            return filename;
        }
        if (inMdmFolder()) {
            if (m) return filename;
            if (c) return '../CRM/' + filename;
            return '../SCM/' + filename;
        }
        if (inCrmFolder()) {
            if (c) return filename;
            if (m) return '../MDM/' + filename;
            return '../SCM/' + filename;
        }
        if (m) return 'MDM/' + filename;
        if (c) return 'CRM/' + filename;
        return 'SCM/' + filename;
    }
    function asset(relPath) {
        relPath = String(relPath).replace(/^\//, '');
        var prefix = inSubModuleFolder() ? '../' : '';
        return prefix + relPath;
    }
    window.wmsPath = {
        inScmFolder: inScmFolder,
        inMdmFolder: inMdmFolder,
        inCrmFolder: inCrmFolder,
        /** @deprecated 使用 inScmFolder */
        inFulfillmentFolder: inScmFolder,
        /** @deprecated 使用 inScmFolder */
        inWmsHtmlFolder: inScmFolder,
        page: page,
        asset: asset
    };
})();
