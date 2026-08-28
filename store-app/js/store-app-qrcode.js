/**
 * 门店二维码弹层：引流码 / 排队码
 */
(function (global) {
  var QR_SIZE = 180;

  /** 无 CDN 或生成失败时，用画布画简易占位图案（可参与合成导出） */
  function appendPlaceholderCanvas(mount) {
    if (!mount) return;
    var c = global.document.createElement("canvas");
    c.width = QR_SIZE;
    c.height = QR_SIZE;
    c.setAttribute("aria-label", "二维码占位");
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);
    ctx.fillStyle = "#1a1a1a";
    var cell = 6;
    var pad = 10;
    var n = 21;
    function corner(r, col) {
      return (
        r <= 6 &&
        col <= 6 &&
        (r === 0 ||
          col === 0 ||
          r === 6 ||
          col === 6 ||
          (r >= 2 && r <= 4 && col >= 2 && col <= 4))
      );
    }
    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        var v = ((row * 17 + col * 31 + row * col) % 5) < 2;
        if (row < 7 && col < 7) v = corner(row, col);
        else if (row < 7 && col > n - 8) v = corner(row, n - 1 - col);
        else if (row > n - 8 && col < 7) v = corner(n - 1 - row, col);
        if (v) {
          ctx.fillRect(pad + col * cell, pad + row * cell, cell - 1, cell - 1);
        }
      }
    }
    mount.appendChild(c);
  }

  function getQrDrawable(mount) {
    if (!mount) return null;
    var canvas = mount.querySelector("canvas");
    if (canvas) return canvas;
    var img = mount.querySelector("img");
    if (img && img.complete && img.naturalWidth) return img;
    if (img) return img;
    return null;
  }

  function init(mockData, options) {
    var openBtn = options.openButton;
    var modal = options.modal;
    var closeBtn = options.closeButton;
    var shareBtn = options.shareButton;
    var saveBtn = options.saveButton;
    var qrMount = options.qrMount;
    var avatarEl = options.avatarEl;
    var nameEl = options.nameEl;

    if (!openBtn || !modal) return;

    var store = mockData.store;
    var wxQrUrl =
      options.qrUrl ||
      store.miniProgramUrl ||
      store.qrUrl ||
      global.location.protocol + "//" + global.location.host + "/";
    var shareTitle = options.shareTitle || store.companyName || "门店小程序";
    var shareText = options.shareText || "扫码访问" + (store.companyName || "") + "小程序";
    var downloadSuffix = options.downloadSuffix || "_小程序码";

    function renderStoreInfo() {
      if (avatarEl) avatarEl.textContent = store.avatarLetter || "店";
      if (nameEl) nameEl.textContent = store.companyName || "";
    }

    function renderQR() {
      if (!qrMount) return;
      qrMount.innerHTML = "";
      if (global.QRCode) {
        try {
          new global.QRCode(qrMount, {
            text: wxQrUrl,
            width: QR_SIZE,
            height: QR_SIZE,
            colorDark: "#1a1a1a",
            colorLight: "#ffffff",
            correctLevel: global.QRCode.CorrectLevel.M,
          });
          return;
        } catch (e) {
          /* fall through */
        }
      }
      appendPlaceholderCanvas(qrMount);
    }

    function open() {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      renderStoreInfo();
      if (qrMount) qrMount.innerHTML = "";
      global.setTimeout(renderQR, 60);
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    openBtn.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) close();
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var drawable = getQrDrawable(qrMount);
        if (!drawable) {
          global.LFToast && global.LFToast.show("保存失败，请截图保存");
          return;
        }
        var combinedCanvas = buildCombinedImage(store, drawable);
        if (!combinedCanvas) {
          global.LFToast && global.LFToast.show("保存失败，请截图保存");
          return;
        }
        var link = global.document.createElement("a");
        link.download = (store.companyName || "门店") + downloadSuffix + ".png";
        link.href = combinedCanvas.toDataURL("image/png");
        link.click();
        global.LFToast && global.LFToast.show("图片已保存");
      });
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        if (global.navigator.share) {
          global.navigator
            .share({
              title: shareTitle,
              text: shareText,
              url: wxQrUrl,
            })
            .catch(function () {});
        } else {
          if (global.clipboard && global.clipboard.writeText) {
            global.clipboard.writeText(wxQrUrl).then(function () {
              global.LFToast && global.LFToast.show("链接已复制，去微信粘贴发送");
            });
          } else {
            global.window.prompt("请复制以下链接：", wxQrUrl);
          }
        }
      });
    }

    function buildCombinedImage(store, qrEl) {
      try {
        var avatarColor = store.avatarColor || "#ff6b00";
        var avatarSize = 60;
        var qrSize = qrEl.width || (qrEl.naturalWidth && qrEl.naturalWidth) || QR_SIZE;
        if (qrEl.tagName === "IMG" && qrEl.naturalWidth) qrSize = qrEl.naturalWidth;
        var padding = 24;
        var gap = 12;
        var titleH = 36;
        var canvasW = avatarSize + padding * 2;
        var canvasH = padding + titleH + gap + avatarSize + gap + qrSize + padding;

        var oc = global.document.createElement("canvas");
        oc.width = canvasW;
        oc.height = canvasH;
        var ctx = oc.getContext("2d");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = "#1a1a1a";
        ctx.font = "bold 16px PingFang SC, Microsoft YaHei, sans-serif";
        ctx.textAlign = "center";
        var nameText = store.companyName || "门店小程序";
        var maxNameW = canvasW - padding * 2;
        nameText = ellipsisText(ctx, nameText, maxNameW);
        ctx.fillText(nameText, canvasW / 2, padding + 18);

        var ax = (canvasW - avatarSize) / 2;
        var ay = padding + titleH + gap;
        ctx.fillStyle = avatarColor;
        ctx.beginPath();
        ctx.arc(ax + avatarSize / 2, ay + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 28px PingFang SC, Microsoft YaHei, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText((store.avatarLetter || "店").charAt(0).toUpperCase(), ax + avatarSize / 2, ay + avatarSize / 2 + 10);

        var qrX = (canvasW - qrSize) / 2;
        var qrY = ay + avatarSize + gap;
        ctx.drawImage(qrEl, qrX, qrY, qrSize, qrSize);

        return oc;
      } catch (e) {
        return null;
      }
    }

    function ellipsisText(ctx, text, maxW) {
      if (ctx.measureText(text).width <= maxW) return text;
      for (var i = text.length - 1; i > 0; i--) {
        if (ctx.measureText(text.slice(0, i) + "…").width <= maxW) {
          return text.slice(0, i) + "…";
        }
      }
      return text.slice(0, 1) + "…";
    }
  }

  global.LFQRCode = { init: init };
})(window);
