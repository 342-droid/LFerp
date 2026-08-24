/**
 * C 端意见反馈 / 举报 — 图片最多 9 张（单张 ≤ 5MB），视频最多 1 个（≤ 100MB），非必填。
 */
(function (global) {
  'use strict';

  var IMAGE_MAX = 5 * 1024 * 1024;
  var VIDEO_MAX = 100 * 1024 * 1024;
  var IMAGE_COUNT = 9;
  var PLACEHOLDER = '/user-app/assets/shop/beef-review-1.svg';

  function isImage(file) {
    return file && /^image\//i.test(file.type);
  }
  function isVideo(file) {
    return file && /^video\//i.test(file.type);
  }
  function formatSize(n) {
    if (n >= 1048576) return (n / 1048576).toFixed(1) + 'MB';
    if (n >= 1024) return Math.round(n / 1024) + 'KB';
    return n + 'B';
  }

  function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (file.size > IMAGE_MAX) {
        reject('图片不能超过 5MB');
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var url = reader.result;
        if (typeof url === 'string' && url.length > 350000) {
          resolve({ kind: 'image', name: file.name, size: file.size, url: PLACEHOLDER });
        } else {
          resolve({ kind: 'image', name: file.name, size: file.size, url: url });
        }
      };
      reader.onerror = function () {
        reject('图片读取失败');
      };
      reader.readAsDataURL(file);
    });
  }

  function create(options) {
    options = options || {};
    var grid = options.grid;
    var input = options.input;
    var toast = options.toast || function () {};
    var images = [];
    var video = null;

    function snapshot() {
      return {
        images: images.slice(),
        video: video
      };
    }

    function canAddMore() {
      return images.length < IMAGE_COUNT || !video;
    }

    function render() {
      if (!grid) return;
      var html = '';
      images.forEach(function (item, idx) {
        html +=
          '<div class="ua-fb-media__item">' +
          '<img src="' +
          item.url +
          '" alt="">' +
          '<button type="button" class="ua-fb-media__remove" data-rm-img="' +
          idx +
          '" aria-label="删除">×</button>' +
          '</div>';
      });
      if (video) {
        html +=
          '<div class="ua-fb-media__item ua-fb-media__item--video">' +
          '<span class="ua-fb-media__video-name">' +
          (video.name || '视频') +
          '</span>' +
          '<span class="ua-fb-media__video-size">' +
          formatSize(video.size || 0) +
          '</span>' +
          '<button type="button" class="ua-fb-media__remove" data-rm-video="1" aria-label="删除">×</button>' +
          '</div>';
      }
      if (canAddMore()) {
        html +=
          '<button type="button" class="ua-fb-media__add" data-fb-media-add>' +
          '<span>+</span><em>图片/视频</em></button>';
      }
      grid.innerHTML = html;
    }

    function addFiles(fileList) {
      var files = Array.prototype.slice.call(fileList || []);
      var tasks = [];
      files.forEach(function (file) {
        if (isImage(file)) {
          if (images.length + tasks.length >= IMAGE_COUNT) {
            toast('最多上传 9 张图片');
            return;
          }
          tasks.push(readImage(file).then(function (item) {
            images.push(item);
          }));
        } else if (isVideo(file)) {
          if (file.size > VIDEO_MAX) {
            toast('视频不能超过 100MB');
            return;
          }
          if (video) toast('只能上传 1 个视频，已替换');
          video = { kind: 'video', name: file.name, size: file.size, url: '' };
        } else {
          toast('仅支持图片或视频');
        }
      });
      Promise.all(tasks)
        .then(function () {
          render();
        })
        .catch(function (err) {
          toast(String(err || '上传失败'));
        });
    }

    function reset() {
      images = [];
      video = null;
      if (input) input.value = '';
      render();
    }

    if (grid) {
      grid.addEventListener('click', function (ev) {
        var add = ev.target.closest('[data-fb-media-add]');
        if (add && input) {
          input.click();
          return;
        }
        var rmImg = ev.target.closest('[data-rm-img]');
        if (rmImg) {
          images.splice(Number(rmImg.getAttribute('data-rm-img')), 1);
          render();
          return;
        }
        if (ev.target.closest('[data-rm-video]')) {
          video = null;
          render();
        }
      });
    }
    if (input) {
      input.addEventListener('change', function () {
        addFiles(input.files);
        input.value = '';
      });
    }
    render();
    return { snapshot: snapshot, reset: reset };
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderDetail(row) {
    var images = (row && row.images) || [];
    var video = row && row.video;
    if (!images.length && !video) return '';
    var html = '<div class="ua-fb-detail-media">';
    images.forEach(function (item) {
      html +=
        '<img src="' +
        escapeHtml(item.url || PLACEHOLDER) +
        '" alt="' +
        escapeHtml(item.name || '图片') +
        '">';
    });
    if (video) {
      html +=
        '<span class="ua-fb-detail-video">' +
        escapeHtml(video.name || '视频') +
        '<br>' +
        formatSize(video.size || 0) +
        '</span>';
    }
    html += '</div>';
    return html;
  }

  global.UaFbMedia = { create: create, renderDetail: renderDetail };
})(window);
