/**
 * 数据导入独立页公共逻辑（交互对齐采购单「批量上传物流单号」）
 * 页面需提供：#importQueryBtn / #importTemplateBtn / #importBrowseBtn /
 * #importFile / #importSubmitBtn / #importTbody
 * 可选：window.WMS_DATA_IMPORT = { label: '储位导入' }
 */
(function () {
    function getNowStr() {
        var d = new Date();
        function p(n) { return String(n).padStart(2, '0'); }
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
            ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    }

    function appendImportRecord(fileName, status) {
        var tbody = document.getElementById('importTbody');
        if (!tbody) return;
        var emptyRow = tbody.querySelector('.batch-init-empty');
        if (emptyRow && emptyRow.closest('tr')) emptyRow.closest('tr').remove();
        var resultText = status === '成功' ? '导入成功' : '导入失败，请下载结果查看';
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + fileName + '</td>' +
            '<td>' + status + '</td>' +
            '<td>' + resultText + '</td>' +
            '<td>当前用户</td>' +
            '<td>' + getNowStr() + '</td>' +
            '<td><button type="button" class="batch-init-link import-download-result">下载</button></td>';
        tbody.insertBefore(tr, tbody.firstChild);
    }

    function ensureBrowseNameEl(browseBtn, fileInput) {
        if (!browseBtn) return null;
        var parent = browseBtn.parentNode;
        if (!parent) return null;

        var wrap = browseBtn.closest('.batch-init-browse-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.className = 'batch-init-browse-wrap';
            parent.insertBefore(wrap, browseBtn);
            wrap.appendChild(browseBtn);
            if (fileInput && fileInput.parentNode === parent) {
                wrap.appendChild(fileInput);
            } else if (fileInput) {
                wrap.appendChild(fileInput);
            }
        }

        var nameEl = wrap.querySelector('.batch-init-file-name');
        if (!nameEl) {
            nameEl = document.createElement('div');
            nameEl.className = 'batch-init-file-name';
            nameEl.id = 'importFileName';
            wrap.appendChild(nameEl);
        }
        return nameEl;
    }

    function setSelectedFileName(nameEl, name) {
        if (!nameEl) return;
        if (name) {
            nameEl.textContent = name;
            nameEl.classList.add('is-visible');
        } else {
            nameEl.textContent = '';
            nameEl.classList.remove('is-visible');
        }
    }

    function bind() {
        var cfg = window.WMS_DATA_IMPORT || {};
        var label = cfg.label || '数据导入';
        var queryBtn = document.getElementById('importQueryBtn');
        var templateBtn = document.getElementById('importTemplateBtn');
        var browseBtn = document.getElementById('importBrowseBtn');
        var fileInput = document.getElementById('importFile');
        var submitBtn = document.getElementById('importSubmitBtn');
        var tbody = document.getElementById('importTbody');
        var fileNameEl = ensureBrowseNameEl(browseBtn, fileInput);

        function setImportReady(ready) {
            if (!submitBtn) return;
            if (ready) {
                submitBtn.classList.add('is-ready');
                submitBtn.disabled = false;
            } else {
                submitBtn.classList.remove('is-ready');
                submitBtn.disabled = true;
            }
        }

        setImportReady(false);

        if (queryBtn) {
            queryBtn.addEventListener('click', function () {
                if (typeof showToast === 'function') showToast('已刷新导入记录', 'info');
            });
        }
        if (templateBtn) {
            templateBtn.addEventListener('click', function () {
                if (typeof showToast === 'function') showToast('导入模板详见需求文档', 'info');
            });
        }
        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', function () {
                fileInput.click();
            });
        }
        if (fileInput && submitBtn) {
            fileInput.addEventListener('change', function () {
                var file = this.files && this.files[0];
                if (file) {
                    setImportReady(true);
                    setSelectedFileName(fileNameEl, file.name);
                } else {
                    setImportReady(false);
                    setSelectedFileName(fileNameEl, '');
                }
                if (file && typeof showToast === 'function') {
                    showToast('已选择文件：' + file.name, 'info');
                }
            });
        }
        if (submitBtn && fileInput) {
            submitBtn.addEventListener('click', function () {
                if (submitBtn.disabled) return;
                var file = fileInput.files && fileInput.files[0];
                if (!file) {
                    if (typeof showToast === 'function') {
                        showToast('请先通过「文件浏览」选择 CSV 文件', 'error');
                    }
                    return;
                }
                var name = String(file.name || '').toLowerCase();
                if (!/\.csv$/.test(name)) {
                    if (typeof showToast === 'function') {
                        showToast('请上传 CSV 文件（可用 Excel 另存为）', 'error');
                    }
                    return;
                }
                appendImportRecord(file.name, '成功');
                fileInput.value = '';
                setImportReady(false);
                setSelectedFileName(fileNameEl, '');
                if (typeof showToast === 'function') {
                    showToast(label + '成功（演示）', 'success');
                }
            });
        }
        if (tbody) {
            tbody.addEventListener('click', function (e) {
                if (e.target && e.target.classList.contains('import-download-result')) {
                    if (typeof showToast === 'function') {
                        showToast('结果文件详见需求文档', 'info');
                    }
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();
