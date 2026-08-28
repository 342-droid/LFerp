/**
 * 轻量 Toast
 */
(function (global) {
  function show(message, duration) {
    var ms = duration == null ? 2200 : duration;
    var el = document.getElementById("app-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "app-toast";
      el.className = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(show._t);
    show._t = setTimeout(function () {
      el.classList.remove("is-visible");
    }, ms);
  }

  global.LFToast = { show: show };
})(window);
