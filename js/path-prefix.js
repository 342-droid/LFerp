/**
 * 首页 index.html 位于项目根目录，mdm*.html 位于 MDM/，其余业务页位于 SCM/；shop-h5/、BD APP/ 等为根目录下静态页。
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
    function page(filename) {
        filename = normPath(filename);
        /** shop-h5、BD APP 等静态目录：自根目录起的相对路径（兼容历史大写 SHOP-H5/） */
        if (/^shop-h5\//i.test(filename) || /^BD APP\//.test(filename)) {
            var up = (inScmFolder() || inMdmFolder()) ? '../' : '';
            return up + filename;
        }
        if (filename === 'index.html') {
            if (inScmFolder() || inMdmFolder()) return '../index.html';
            return 'index.html';
        }
        var m = /^mdm/i.test(filename);
        if (inScmFolder()) {
            return m ? ('../MDM/' + filename) : filename;
        }
        if (inMdmFolder()) {
            return m ? filename : ('../SCM/' + filename);
        }
        return m ? ('MDM/' + filename) : ('SCM/' + filename);
    }
    function asset(relPath) {
        relPath = String(relPath).replace(/^\//, '');
        var prefix = (inScmFolder() || inMdmFolder()) ? '../' : '';
        return prefix + relPath;
    }
    window.wmsPath = {
        inScmFolder: inScmFolder,
        inMdmFolder: inMdmFolder,
        /** @deprecated 使用 inScmFolder */
        inFulfillmentFolder: inScmFolder,
        /** @deprecated 使用 inScmFolder */
        inWmsHtmlFolder: inScmFolder,
        page: page,
        asset: asset
    };
})();
