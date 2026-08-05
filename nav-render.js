(function () {
  function currentPageId() {
    if (!window.SITE_BASE) return "intro";
    var segments = location.pathname.split("/").filter(Boolean);
    if (segments.length && /\.html$/i.test(segments[segments.length - 1])) {
      var last = segments.pop();

      if (last.toLowerCase() !== "index.html")
        return last.replace(/\.html$/i, "");
    }
    return segments.length ? segments[segments.length - 1] : "intro";
  }

  function escAttr(s) {
    return String(s == null ? "" : s);
  }

  function withBase(href) {
    return (window.SITE_BASE || "") + escAttr(href);
  }

  function buildChildItem(item) {
    var iconHtml = item.icon
      ? '<i class="fa-solid ' +
        escAttr(item.icon) +
        (item.color ? " " + escAttr(item.color) : "") +
        ' w-4"></i> '
      : "";
    return (
      "<button onclick=\"location.href='" +
      withBase(item.href) +
      '\'" class="w-full text-left px-4 py-2.5 rounded-xl text-sm text-purple-200 hover:bg-white/8 hover:text-white flex items-center gap-2 transition-colors">' +
      iconHtml +
      '<span data-i18n="' +
      escAttr(item.label) +
      '">' +
      escAttr(item.text) +
      "</span></button>"
    );
  }

  function buildTopButton(item) {
    return (
      "<button onclick=\"location.href='" +
      withBase(item.href) +
      '\'" id="tab-' +
      escAttr(item.id) +
      '" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">' +
      '<i class="fa-solid ' +
      escAttr(item.icon) +
      '"></i><span class="inline" data-i18n="' +
      escAttr(item.label) +
      '">' +
      escAttr(item.text) +
      "</span></button>"
    );
  }

  function buildDropdown(group) {
    var enabledItems = (group.items || []).filter(function (it) {
      return it.enabled !== false;
    });
    if (!enabledItems.length) return "";
    var itemsHtml = enabledItems.map(buildChildItem).join("");
    return (
      '<div class="relative" id="' +
      escAttr(group.id) +
      'DropdownWrap">' +
      "<button onclick=\"toggleNavDropdown(event,'" +
      escAttr(group.id) +
      '\')" id="tab-' +
      escAttr(group.id) +
      '-trigger" class="tab-btn px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-bold text-sm text-purple-300 hover:bg-white/5 flex items-center gap-2">' +
      '<i class="fa-solid ' +
      escAttr(group.icon) +
      '"></i><span class="inline" data-i18n="' +
      escAttr(group.label) +
      '">' +
      escAttr(group.text) +
      "</span>" +
      '<i class="fa-solid fa-chevron-down text-[10px] transition-transform duration-200" id="' +
      escAttr(group.id) +
      'Arrow"></i></button>' +
      '<div id="' +
      escAttr(group.id) +
      'Dropdown" class="hidden absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#120824] border border-purple-500/40 rounded-2xl p-2 shadow-2xl z-[300] min-w-[170px]">' +
      itemsHtml +
      "</div></div>"
    );
  }

  function findCurrentEntry(config, pageId) {
    for (var i = 0; i < config.length; i++) {
      var entry = config[i];
      if (entry.dropdown) {
        var items = entry.items || [];
        for (var j = 0; j < items.length; j++) {
          if (items[j].id === pageId) return items[j];
        }
      } else if (entry.id === pageId) {
        return entry;
      }
    }
    return null;
  }

  function enforceDisabledPageGuard(config) {
    var pageId = currentPageId();
    if (pageId === "intro") return;
    var entry = findCurrentEntry(config, pageId);
    if (entry && entry.enabled === false) {
      location.replace((window.SITE_BASE || "") + "index.html");
    }
  }

  function renderMainNav() {
    var nav = document.getElementById("mainNav");
    var config = window.NAV_CONFIG;
    if (!nav) return;
    if (!config) {
      console.error(
        "[nav-render] window.NAV_CONFIG 尚未定義，請確認 nav-config.js 有在 nav-render.js 之前載入",
      );
      return;
    }

    enforceDisabledPageGuard(config);

    var html = "";
    var groupOfChild = {};

    config.forEach(function (entry) {
      if (entry.enabled === false) return;
      if (entry.dropdown) {
        var frag = buildDropdown(entry);
        if (frag) html += frag;
        (entry.items || []).forEach(function (it) {
          if (it.enabled !== false) groupOfChild[it.id] = entry.id;
        });
      } else {
        html += buildTopButton(entry);
      }
    });

    nav.innerHTML = html;

    var pageId = currentPageId();
    var activeBtn =
      document.getElementById("tab-" + pageId) ||
      (groupOfChild[pageId]
        ? document.getElementById("tab-" + groupOfChild[pageId] + "-trigger")
        : null);
    if (activeBtn) {
      activeBtn.classList.add("active", "text-white");
      activeBtn.classList.remove("text-purple-300");
    }
  }

  renderMainNav();

  window.renderMainNav = renderMainNav;
})();
